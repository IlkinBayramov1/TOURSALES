import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import prisma from '../../config/db.js';
import env from '../../config/env.js';
import ApiError from '../../core/api.error.js';
import { generateUniqueId } from '../../utils/id-generator.js';

class AuthService {
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(user, plainPassword) {
    if (user.hashAlgorithm === 'SHA256') {
      const legacySha256 = crypto.createHash('sha256').update(plainPassword).digest('hex');
      const isMatch = (user.password === legacySha256);
      
      if (isMatch) {
        // Transparent Dual-Hash Migration: Upgrade user password to Bcrypt immediately
        const newBcryptHash = await bcrypt.hash(plainPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: newBcryptHash,
            hashAlgorithm: 'BCRYPT'
          }
        });
      }
      return isMatch;
    }

    return bcrypt.compare(plainPassword, user.password);
  }

  generateAccessToken(user, isTemp = false) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId, twoFactorTemp: isTemp },
      env.JWT_SECRET,
      { expiresIn: isTemp ? '5m' : '15m' }
    );
  }

  async createRefreshSession(userId, ipAddress, userAgent, parentTokenId = null, familyId = null) {
    const rsId = await generateUniqueId('RS', 'refreshSession');
    const activeFamilyId = familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const refreshToken = jwt.sign(
      { id: userId, sessionId: rsId, familyId: activeFamilyId },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.refreshSession.create({
      data: {
        id: rsId,
        userId,
        tokenHash,
        familyId: activeFamilyId,
        parentTokenId,
        expiresAt,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown'
      }
    });

    return { refreshToken, expiresAt, familyId: activeFamilyId };
  }

  async refreshTokens(refreshToken, ipAddress, userAgent) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Müvəqqəti və ya etibarsız refresh token.');
    }

    const session = await prisma.refreshSession.findUnique({
      where: { id: decoded.sessionId }
    });

    if (!session) {
      throw ApiError.unauthorized('Sessiya tapılmadı.');
    }

    // Theft Detection: Token re-use check
    if (session.revokedAt) {
      // Security Alert: Token re-used after revocation! Revoke all tokens in this family immediately
      await prisma.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'THEFT_REUSE_DETECTED' }
      });
      throw ApiError.unauthorized('Təhlükəsizlik xəbərdarlığı: Token təkrar istifadəsi aşkarlandı. Bütün sessiyalar ləğv edildi.');
    }

    // Revoke current session (Rotate)
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokeReason: 'ROTATED' }
    });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('İstifadəçi tapılmadı və ya silinib.');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshSession = await this.createRefreshSession(user.id, ipAddress, userAgent, session.id, session.familyId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshSession.refreshToken
    };
  }

  async createSession(userId, token, device) {
    const id = await generateUniqueId('S', 'session');
    return prisma.session.create({
      data: {
        id,
        userId,
        token,
        device: device || 'Bilinməyən Cihaz'
      }
    });
  }

  async register(data, device, ipAddress, userAgent) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw ApiError.badRequest('Bu email ünvanı artıq qeydiyyatdan keçib.');
    }

    const hashedPassword = await this.hashPassword(data.password);
    const userId = await generateUniqueId('U', 'user');

    let companyId = null;
    if (data.role === 'Vendor') {
      const newCompanyId = await generateUniqueId('C', 'company');
      const company = await prisma.company.create({
        data: {
          id: newCompanyId,
          name: data.companyName || `${data.name || 'Vendor'} Şirkəti`,
          status: 'Pending'
        }
      });
      companyId = company.id;
    }

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: data.email,
        password: hashedPassword,
        hashAlgorithm: 'BCRYPT',
        name: data.name,
        role: data.role || 'User',
        companyId: companyId
      }
    });

    const accessToken = this.generateAccessToken(user);
    const refreshSession = await this.createRefreshSession(user.id, ipAddress, userAgent);
    await this.createSession(user.id, accessToken, device);

    const { password, twoFactorSecret, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken: refreshSession.refreshToken };
  }

  async login(email, password, device, ipAddress, userAgent) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Email və ya şifrə yanlışdır.');
    }

    const isPasswordValid = await this.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Email və ya şifrə yanlışdır.');
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.generateAccessToken(user, true);
      return { twoFactorRequired: true, tempToken };
    }

    const accessToken = this.generateAccessToken(user);
    const refreshSession = await this.createRefreshSession(user.id, ipAddress, userAgent);
    await this.createSession(user.id, accessToken, device);

    const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken: refreshSession.refreshToken };
  }

  async verify2FAAndLogin(tempToken, code, device, ipAddress, userAgent) {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Müvəqqəti token etibarsızdır və ya vaxtı keçib.');
    }

    if (!decoded.twoFactorTemp) {
      throw ApiError.badRequest('Bu token 2FA doğrulaması üçün deyil.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.twoFactorSecret || user.deletedAt) {
      throw ApiError.badRequest('2FA konfiqurasiyası tapılmadı.');
    }

    const isValid = await verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw ApiError.unauthorized('2FA kodu yanlışdır.');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshSession = await this.createRefreshSession(user.id, ipAddress, userAgent);
    await this.createSession(user.id, accessToken, device);

    const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken: refreshSession.refreshToken };
  }

  async setup2FA(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw ApiError.notFound('İstifadəçi tapılmadı.');

    const secret = generateSecret();
    const otpauth = generateURI({
      secret,
      account: user.email,
      issuer: 'TOURSALES'
    });
    const qrCode = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });

    return { secret, otpauth, qrCode };
  }

  async enable2FA(userId, code) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret || user.deletedAt) {
      throw ApiError.badRequest('İlk öncə 2FA-nı quraşdırmalısınız.');
    }

    const isValid = await verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw ApiError.badRequest('2FA kodu yanlışdır.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return { success: true };
  }

  async disable2FA(userId, password) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw ApiError.notFound('İstifadəçi tapılmadı.');

    const isPasswordValid = await this.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw ApiError.badRequest('Şifrə yanlışdır.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });

    return { success: true };
  }

  async getSessions(userId) {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async killSession(userId, sessionId) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) throw ApiError.notFound('Sessiya tapılmadı.');

    await prisma.session.delete({ where: { id: sessionId } });
    return { success: true };
  }

  async killOtherSessions(userId, currentToken) {
    await prisma.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken }
      }
    });

    // Also revoke refresh sessions
    await prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'USER_LOGOUT_OTHER_DEVICES'
      }
    });

    return { success: true };
  }
}

export const authService = new AuthService();
export default authService;
