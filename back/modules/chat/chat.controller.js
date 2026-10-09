import chatService from './chat.service.js';
import { asyncHandler } from '../../core/utils.js';

class ChatController {
  startOrGet = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    const { companyId, contextType, contextTourId, contextHotelId, contextBookingId } = req.body;

    const conversation = await chatService.startOrGetConversation({
      userId,
      companyId,
      contextType,
      contextTourId,
      contextHotelId,
      contextBookingId,
    });

    res.status(200).json({
      success: true,
      data: conversation,
    });
  });

  getMyConversations = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    const isVendor = req.user?.role === 'Vendor' || Boolean(companyId);

    let conversations = [];
    if (isVendor && companyId) {
      conversations = await chatService.getVendorConversations(companyId);
    } else if (userId) {
      conversations = await chatService.getUserConversations(userId);
    }

    res.status(200).json({
      success: true,
      data: conversations,
    });
  });

  getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);

    res.status(200).json({
      success: true,
      data: messages,
    });
  });

  sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    const senderId = req.user?.id || req.body.senderId || 'U-GUEST';
    const isVendor = req.user?.role === 'Vendor' || Boolean(req.user?.companyId);
    const senderRole = req.user?.role === 'SuperAdmin' ? 'ADMIN' : isVendor ? 'VENDOR' : (req.body.senderRole || 'USER');

    const message = await chatService.sendMessage({
      conversationId,
      senderId,
      senderRole,
      content,
      attachments,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  });

  markAsRead = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const isVendor = req.user?.role === 'Vendor' || Boolean(req.user?.companyId);
    const readerRole = isVendor ? 'VENDOR' : 'USER';

    const result = await chatService.markAsRead(conversationId, readerRole);
    res.status(200).json(result);
  });

  getCannedResponses = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.params.companyId || req.query.companyId;
    const responses = await chatService.getCannedResponses(companyId);

    res.status(200).json({
      success: true,
      data: responses,
    });
  });

  createCannedResponse = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.body.companyId;
    const { title, shortcut, content, category } = req.body;

    const response = await chatService.createCannedResponse(companyId, {
      title,
      shortcut,
      content,
      category,
    });

    res.status(201).json({
      success: true,
      data: response,
    });
  });

  deleteCannedResponse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'İcazə yoxdur' });
    }
    await chatService.deleteCannedResponse(id, companyId);
    res.status(200).json({ success: true, message: 'Şablon cavab silindi' });
  });

  getCustomerProfile = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const companyId = req.user?.companyId;

    const profile = await chatService.getCustomerCrmProfileByConversation(
      conversationId,
      companyId,
      req.user?.role
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  });

  updateConversationStatus = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { status } = req.body;
    const companyId = req.user?.companyId;

    const updated = await chatService.updateConversationStatus(conversationId, companyId, status);
    res.status(200).json({
      success: true,
      data: updated,
    });
  });
}

export const chatController = new ChatController();
export default chatController;
