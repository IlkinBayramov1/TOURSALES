import express from 'express';
import chatController from './chat.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// 1. Start or get conversation (public/guest or authenticated)
router.post('/conversations', authMiddleware({ isPublic: true }), chatController.startOrGet);

// 2. Get my conversations (customer or vendor)
router.get('/conversations', authMiddleware(), chatController.getMyConversations);
router.get('/conversations/my', authMiddleware(), chatController.getMyConversations);

// 3. Conversation messages & CRM
router.get('/conversations/:conversationId/messages', authMiddleware({ isPublic: true }), chatController.getMessages);
router.post('/conversations/:conversationId/messages', authMiddleware({ isPublic: true }), chatController.sendMessage);
router.post('/conversations/:conversationId/read', authMiddleware({ isPublic: true }), chatController.markAsRead);
router.get('/conversations/:conversationId/customer', authMiddleware(), chatController.getCustomerProfile);
router.patch('/conversations/:conversationId/status', authMiddleware(), chatController.updateConversationStatus);

// 4. Vendor Canned responses
router.get('/canned-responses', authMiddleware({ isPublic: true }), chatController.getCannedResponses);
router.post('/canned-responses', authMiddleware(), chatController.createCannedResponse);
router.delete('/canned-responses/:id', authMiddleware(), chatController.deleteCannedResponse);

export default router;
