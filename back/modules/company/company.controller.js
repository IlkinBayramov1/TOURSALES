import { asyncHandler } from '../../core/utils.js';
import apiKeyService from './apiKey.service.js';
import { rbacService, AGENCY_ROLES, PERMISSIONS } from './rbac.service.js';
import prisma from '../../config/db.js';
import authService from '../auth/auth.service.js';
import ApiError from '../../core/api.error.js';
import { generateUniqueId } from '../../utils/id-generator.js';

class CompanyController {
  // B2B Partnyor API Açarlarının Generasiyası
  generateApiKey = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) throw ApiError.badRequest('Yalnız şirkəti olan vendorlar API Key ala bilər.');

    const { keyName = 'Default API Key' } = req.body;
    const apiKeyData = apiKeyService.generateApiKey(companyId, keyName);

    return res.status(201).json({
      status: 'success',
      msg: 'B2B API Key uğurla generasiya edildi. Secret açarı təhlükəsiz yerdə saxlayın.',
      data: apiKeyData
    });
  });

  // Şirkətin B2B API Açarları siyahısı
  getApiKeys = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət tələb olunur.');

    const keys = Array.from(apiKeyService.apiKeysStore.values())
      .filter(k => k.companyId === companyId)
      .map(({ keyHash, ...safeData }) => safeData);

    return res.json({
      status: 'success',
      msg: 'API Açarları gətirildi',
      data: keys
    });
  });

  // Rollar və İcazələr cədvəli
  getRolesAndPermissions = asyncHandler(async (req, res) => {
    return res.json({
      status: 'success',
      data: {
        roles: AGENCY_ROLES,
        permissions: PERMISSIONS,
        matrix: rbacService.rolePermissions
      }
    });
  });

  // Agentlik daxili komanda üzvünün (işçinin) əlavə edilməsi
  addTeamMember = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət tələb olunur.');

    const { name, email, password, role = 'SalesAgent' } = req.body;
    if (!email || !password || !name) {
      throw ApiError.badRequest('Ad, email və şifrə vacibdir.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw ApiError.badRequest('Bu email artıq qeydiyyatdan keçib.');

    const hashedPassword = await authService.hashPassword(password);
    const userId = await generateUniqueId('U', 'user');

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
        hashAlgorithm: 'BCRYPT',
        role, // AgencyAdmin, SalesAgent, Accountant, Guide
        companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      status: 'success',
      msg: 'Komanda üzvü uğurla əlavə edildi.',
      data: newUser
    });
  });

  // Agentlik komanda üzvlərinin siyahısı
  getTeamMembers = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət tələb olunur.');

    const members = await prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.json({
      status: 'success',
      msg: 'Komanda üzvləri gətirildi',
      data: members
    });
  });
}

export const companyController = new CompanyController();
export default companyController;
