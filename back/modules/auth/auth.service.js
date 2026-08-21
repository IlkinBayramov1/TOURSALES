import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import prisma from '../../config/db.js';
import env from '../../config/env.js';
import ApiError from '../../core/api.error.js';
import { generateUniqueId } from '../../utils/id-generator.js';

class AuthService {
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  generateToken(user, isTemp = false) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId, twoFactorTemp: isTemp },
      env.JWT_SECRET,
      { expiresIn: isTemp ? '5m' : '1d' }
    );
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

  async register(data, device) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw ApiError.badRequest('Bu email ünvanı artıq qeydiyyatdan keçib.');
    }

    const hashedPassword = this.hashPassword(data.password);
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
        name: data.name,
        role: data.role || 'User',
        companyId: companyId
      }
    });

    const token = this.generateToken(user);
    await this.createSession(user.id, token, device);
    
    const { password, twoFactorSecret, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email, password, device) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw ApiError.unauthorized('Email və ya şifrə yanlışdır.');
    }

    const hashedPassword = this.hashPassword(password);
    if (user.password !== hashedPassword) {
      throw ApiError.unauthorized('Email və ya şifrə yanlışdır.');
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.generateToken(user, true);
      return { twoFactorRequired: true, tempToken };
    }

    const token = this.generateToken(user);
    await this.createSession(user.id, token, device);

    const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async verify2FAAndLogin(tempToken, code, device) {
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

    if (!user || !user.twoFactorSecret) {
      throw ApiError.badRequest('2FA konfiqurasiyası tapılmadı.');
    }

    const isValid = await verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw ApiError.unauthorized('2FA kodu yanlışdır.');
    }

    const token = this.generateToken(user);
    await this.createSession(user.id, token, device);

    const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async setup2FA(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('İstifadəçi tapılmadı.');

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
    if (!user || !user.twoFactorSecret) {
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
    if (!user) throw ApiError.notFound('İstifadəçi tapılmadı.');

    if (user.password !== this.hashPassword(password)) {
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
    return { success: true };
  }
}

export const authService = new AuthService();
export default authService;
