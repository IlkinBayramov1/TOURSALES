import { asyncHandler } from '../../core/utils.js';
import { authService } from './auth.service.js';
import ApiError from '../../core/api.error.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const device = req.headers['user-agent'] || 'Unknown Device';
    const result = await authService.register(req.body, device);
    return res.status(201).json({
      status: 'success',
      msg: 'Qeydiyyat uğurla tamamlandı.',
      data: result
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const device = req.headers['user-agent'] || 'Unknown Device';
    const result = await authService.login(email, password, device);
    return res.json({
      status: 'success',
      msg: result.twoFactorRequired ? '2FA doğrulaması tələb olunur.' : 'Giriş uğurla tamamlandı.',
      data: result
    });
  });

  verify2FA = asyncHandler(async (req, res) => {
    const { tempToken, code } = req.body;
    const device = req.headers['user-agent'] || 'Unknown Device';
    if (!tempToken || !code) {
      throw ApiError.badRequest('Müvəqqəti token və 2FA kodu daxil edilməlidir.');
    }
    const result = await authService.verify2FAAndLogin(tempToken, code, device);
    return res.json({
      status: 'success',
      msg: '2FA doğrulaması uğurla keçdi. Giriş tamamlandı.',
      data: result
    });
  });

  setup2FA = asyncHandler(async (req, res) => {
    const result = await authService.setup2FA(req.user.id);
    return res.json({
      status: 'success',
      msg: '2FA quraşdırma məlumatları generasiya edildi.',
      data: result
    });
  });

  enable2FA = asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) throw ApiError.badRequest('Təsdiqləmə kodu lazımdır.');
    const result = await authService.enable2FA(req.user.id, code);
    return res.json({
      status: 'success',
      msg: 'Google Authenticator 2FA uğurla aktivləşdirildi.',
      data: result
    });
  });

  disable2FA = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password) throw ApiError.badRequest('Şifrə daxil edilməlidir.');
    const result = await authService.disable2FA(req.user.id, password);
    return res.json({
      status: 'success',
      msg: '2FA uğurla deaktiv edildi.',
      data: result
    });
  });

  getSessions = asyncHandler(async (req, res) => {
    const result = await authService.getSessions(req.user.id);
    return res.json({
      status: 'success',
      msg: 'Aktiv sessiyalar siyahısı gətirildi.',
      data: result
    });
  });

  killSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) throw ApiError.badRequest('Sessiya ID daxil edilməlidir.');
    const result = await authService.killSession(req.user.id, sessionId);
    return res.json({
      status: 'success',
      msg: 'Sessiya uğurla sonlandırıldı.',
      data: result
    });
  });

  killOtherSessions = asyncHandler(async (req, res) => {
    const result = await authService.killOtherSessions(req.user.id, req.token);
    return res.json({
      status: 'success',
      msg: 'Digər bütün aktiv sessiyalar sonlandırıldı.',
      data: result
    });
  });

  getMe = asyncHandler(async (req, res) => {
    return res.json({
      status: 'success',
      msg: 'İstifadəçi profili gətirildi.',
      data: { user: req.user }
    });
  });
}

export const authController = new AuthController();
export default authController;
