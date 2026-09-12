import { asyncHandler } from '../../core/utils.js';
import { subscriptionsService } from './subscriptions.service.js';

class SubscriptionsController {
  getAllPlans = asyncHandler(async (req, res) => {
    const plans = await subscriptionsService.getAllPlans();
    return res.json({
      status: 'success',
      msg: 'Abunəlik planları gətirildi.',
      data: plans
    });
  });

  createPlan = asyncHandler(async (req, res) => {
    const plan = await subscriptionsService.createPlan(req.body);
    return res.status(201).json({
      status: 'success',
      msg: 'Yeni plan yaradıldı.',
      data: plan
    });
  });

  updatePlan = asyncHandler(async (req, res) => {
    const plan = await subscriptionsService.updatePlan(req.params.id, req.body);
    return res.json({
      status: 'success',
      msg: 'Plan yeniləndi.',
      data: plan
    });
  });

  getSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await subscriptionsService.getSubscribers();
    return res.json({
      status: 'success',
      msg: 'Abunəçilər siyahısı gətirildi.',
      data: subscribers
    });
  });

  exportSubscribers = asyncHandler(async (req, res) => {
    const buffer = await subscriptionsService.exportSubscribersToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.xlsx');
    return res.send(buffer);
  });

  getCurrentSubscription = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const result = await subscriptionsService.getCurrentSubscription(companyId);
    return res.json({ status: 'success', msg: 'Aktiv abunəlik gətirildi.', data: result });
  });

  getBillingHistory = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const history = await subscriptionsService.getBillingHistory(companyId);
    return res.json({ status: 'success', msg: 'Fakturalar gətirildi.', data: history });
  });

  getInvoiceDetails = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    const { paymentId } = req.params;
    if (!companyId || !paymentId) {
      return res.status(400).json({ status: 'fail', msg: 'Məlumatlar tam deyil.' });
    }
    const invoice = await subscriptionsService.getInvoiceDetails(companyId, paymentId);
    return res.json({ status: 'success', msg: 'Faktura detalları gətirildi.', data: invoice });
  });

  toggleAutoRenewal = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const { autoRenew } = req.body;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const result = await subscriptionsService.toggleAutoRenewal(companyId, autoRenew);
    return res.json({ status: 'success', msg: result.message, data: result });
  });

  changePlan = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ status: 'fail', msg: 'Şirkət ID tapılmadı.' });
    }
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ status: 'fail', msg: 'Plan ID seçilməlidir.' });
    }
    const result = await subscriptionsService.changePlan(companyId, req.body);
    return res.json({ status: 'success', msg: result.message, data: result });
  });
}

export const subscriptionsController = new SubscriptionsController();
export default subscriptionsController;
