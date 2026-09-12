import { asyncHandler } from '../../core/utils.js';
import { teamsService } from './teams.service.js';

class TeamsController {
  getTeamMembers = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const result = await teamsService.getTeamMembers(companyId);
    return res.json({ status: 'success', msg: 'Komanda üzvləri gətirildi.', data: result });
  });

  inviteMember = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const { name, email, phone, role, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: 'fail', msg: 'Ad və e-poçt tələb olunur.' });
    }
    const member = await teamsService.inviteMember(companyId, req.user, {
      name,
      email,
      phone,
      role,
      password,
    });
    return res.status(201).json({ status: 'success', msg: 'Yeni əməkdaş komandaya əlavə edildi.', data: member });
  });

  updateMember = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    if (!companyId || !id) {
      return res.status(400).json({ status: 'fail', msg: 'Parametrlər tam deyil.' });
    }
    const updated = await teamsService.updateMember(companyId, req.user, id, req.body);
    return res.json({ status: 'success', msg: 'Əməkdaş məlumatları yeniləndi.', data: updated });
  });

  removeMember = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    if (!companyId || !id) {
      return res.status(400).json({ status: 'fail', msg: 'Parametrlər tam deyil.' });
    }
    const result = await teamsService.removeMember(companyId, req.user, id);
    return res.json({ status: 'success', msg: result.message, data: result });
  });

  getPermissionsMatrix = asyncHandler(async (req, res) => {
    const matrix = teamsService.getPermissionsMatrix();
    return res.json({ status: 'success', msg: 'İcazələr matrisi gətirildi.', data: matrix });
  });

  getActivityLogs = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const logs = await teamsService.getActivityLogs(companyId);
    return res.json({ status: 'success', msg: 'Fəaliyyət jurnalı gətirildi.', data: logs });
  });
}

export const teamsController = new TeamsController();
export default teamsController;
