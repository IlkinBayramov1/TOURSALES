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
}

export const subscriptionsController = new SubscriptionsController();
export default subscriptionsController;
