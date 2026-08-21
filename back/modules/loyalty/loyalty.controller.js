import { asyncHandler } from '../../core/utils.js';
import { loyaltyService } from './loyalty.service.js';
import ApiError from '../../core/api.error.js';

class LoyaltyController {
  getOffers = asyncHandler(async (req, res) => {
    const result = await loyaltyService.getOffers();
    return res.json({ status: 'success', msg: 'Loyallıq təklifləri gətirildi', data: result });
  });

  createOffer = asyncHandler(async (req, res) => {
    const result = await loyaltyService.createOffer(req.body);
    return res.status(201).json({ status: 'success', msg: 'Yeni təklif yaradıldı', data: result });
  });

  redeemOffer = asyncHandler(async (req, res) => {
    const { offerId } = req.body;
    if (!offerId) throw ApiError.badRequest('Təklif ID daxil edilməlidir.');
    const result = await loyaltyService.redeemOffer(req.user.id, offerId);
    return res.json({ status: 'success', msg: 'Təklif uğurla aktivləşdirildi', data: result });
  });

  getMyHistory = asyncHandler(async (req, res) => {
    const result = await loyaltyService.getPointsHistory(req.user.id);
    return res.json({ status: 'success', msg: 'Loyallıq tarixçəniz gətirildi', data: result });
  });

  getAllHistory = asyncHandler(async (req, res) => {
    const result = await loyaltyService.getAllHistory();
    return res.json({ status: 'success', msg: 'Bütün loyallıq tarixçəsi gətirildi', data: result });
  });
}

export const loyaltyController = new LoyaltyController();
export default loyaltyController;
