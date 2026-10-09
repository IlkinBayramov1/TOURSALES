import express from 'express';
import customToursController from './custom-tours.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// 1. Real-time Price Estimation Calculator (public)
router.post('/estimate', customToursController.calculateEstimate);

// 2. Customer Custom Tour Requests
router.post('/requests', authMiddleware({ isPublic: true }), customToursController.createRequest);
router.get('/my-requests', authMiddleware({ isPublic: true }), customToursController.getMyRequests);
router.post('/requests/:id/cancel', authMiddleware({ isPublic: true }), customToursController.cancelRequest);

// 3. Vendor Tender Board, Stats & Bidding (Specific sub-paths first!)
router.get('/vendor/tender-board', authMiddleware({ isPublic: true }), customToursController.getTenderBoard);
router.get('/tenders', authMiddleware({ isPublic: true }), customToursController.getTenderBoard);

router.get('/vendor/stats', authMiddleware({ isPublic: true }), customToursController.getVendorStats);
router.get('/tenders/stats', authMiddleware({ isPublic: true }), customToursController.getVendorStats);

router.get('/vendor/my-bids', authMiddleware({ isPublic: true }), customToursController.getMyBids);
router.get('/tenders/my-bids', authMiddleware({ isPublic: true }), customToursController.getMyBids);

router.post('/requests/:id/bids', authMiddleware({ isPublic: true }), customToursController.submitBid);
router.post('/tenders/:id/bid', authMiddleware({ isPublic: true }), customToursController.submitBid);
router.post('/tenders/:id/bids', authMiddleware({ isPublic: true }), customToursController.submitBid);

// 4. Bids Edit & Withdraw
router.put('/bids/:bidId', authMiddleware({ isPublic: true }), customToursController.updateBid);
router.put('/tenders/bids/:bidId', authMiddleware({ isPublic: true }), customToursController.updateBid);
router.delete('/bids/:bidId', authMiddleware({ isPublic: true }), customToursController.withdrawBid);
router.delete('/tenders/bids/:bidId', authMiddleware({ isPublic: true }), customToursController.withdrawBid);

// 5. Single request/tender details (Parameterized :id MUST come AFTER all static sub-paths)
router.get('/requests/:id', authMiddleware({ isPublic: true }), customToursController.getRequestDetails);
router.get('/tenders/:id', authMiddleware({ isPublic: true }), customToursController.getRequestDetails);

// 6. Winning Bid Acceptance & Checkout Booking
router.post('/bids/:bidId/accept', authMiddleware({ isPublic: true }), customToursController.acceptBid);
router.post('/bids/:bidId/checkout', authMiddleware({ isPublic: true }), customToursController.checkoutBooking);

export default router;
