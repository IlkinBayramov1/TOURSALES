import ticketsService from './tickets.service.js';
import { asyncHandler } from '../../core/utils.js';

class TicketsController {
  getTicketsRoot = asyncHandler(async (req, res) => {
    // If user is a Vendor (role === 'Vendor' or companyId is present)
    if (req.user?.companyId || req.user?.role === 'Vendor') {
      const companyId = req.user?.companyId || req.query.companyId;
      const result = await ticketsService.getVendorTickets(companyId, req.query);
      return res.status(200).json({
        success: true,
        data: result.tickets,
        stats: result.stats,
      });
    }

    // If user is SuperAdmin
    if (req.user?.role === 'SuperAdmin') {
      const tickets = await ticketsService.getAllTicketsAdmin(req.query);
      return res.status(200).json({
        success: true,
        data: tickets,
      });
    }

    // Standard client user
    const tickets = await ticketsService.getMyTickets(req.user?.id, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
    });
  });

  createTicket = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    const companyId = req.user?.companyId || req.body.companyId;
    let senderRole = 'USER';
    if (req.user?.role === 'Vendor') senderRole = 'VENDOR';
    else if (req.user?.role === 'SuperAdmin') senderRole = 'ADMIN';

    const ticket = await ticketsService.createTicket(userId, {
      ...req.body,
      companyId: companyId || req.body.companyId,
      senderRole,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  });

  getMyTickets = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const tickets = await ticketsService.getMyTickets(userId, req.query);

    res.status(200).json({
      success: true,
      data: tickets,
    });
  });

  getVendorTickets = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.query.companyId;
    const result = await ticketsService.getVendorTickets(companyId, req.query);

    res.status(200).json({
      success: true,
      data: result.tickets,
      stats: result.stats,
    });
  });

  getAllTicketsAdmin = asyncHandler(async (req, res) => {
    const tickets = await ticketsService.getAllTicketsAdmin(req.query);

    res.status(200).json({
      success: true,
      data: tickets,
    });
  });

  getTicketDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isVendorOrAdmin = req.user?.role === 'Vendor' || req.user?.role === 'SuperAdmin' || Boolean(req.user?.companyId);

    const ticket = await ticketsService.getTicketDetails(id, { isVendorOrAdmin });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  });

  replyTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, isInternalNote, attachments } = req.body;

    const senderId = req.user?.id || req.body.senderId || 'U-GUEST';
    const isVendor = req.user?.role === 'Vendor' || Boolean(req.user?.companyId);
    const senderRole = req.user?.role === 'SuperAdmin' ? 'ADMIN' : isVendor ? 'VENDOR' : (req.body.senderRole || 'USER');

    const reply = await ticketsService.replyTicket(id, {
      senderId,
      senderRole,
      message,
      isInternalNote,
      attachments,
    });

    res.status(201).json({
      success: true,
      data: reply,
    });
  });

  updateTicketStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await ticketsService.updateTicketStatus(id, req.body);

    res.status(200).json({
      success: true,
      data: updated,
    });
  });

  escalateToAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const escalated = await ticketsService.escalateToAdmin(id, reason);

    res.status(200).json({
      success: true,
      data: escalated,
    });
  });
}

export const ticketsController = new TicketsController();
export default ticketsController;
