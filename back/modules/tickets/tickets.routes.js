import express from 'express';
import ticketsController from './tickets.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// 1. Root route: GET /api/v1/tickets
// Role-based auto delegation: Vendor -> getVendorTickets, Admin -> getAllTicketsAdmin, User -> getMyTickets
router.get('/', authMiddleware(), ticketsController.getTicketsRoot);

// 2. Create ticket (public/guest or authenticated)
router.post('/', authMiddleware({ isPublic: true }), ticketsController.createTicket);

// 3. Explicit routes by role
router.get('/my', authMiddleware(), ticketsController.getMyTickets);
router.get('/vendor', authMiddleware(), ticketsController.getVendorTickets);
router.get('/admin', authMiddleware(), ticketsController.getAllTicketsAdmin);

// 4. Ticket details and reply
router.get('/:id', authMiddleware({ isPublic: true }), ticketsController.getTicketDetails);
router.post('/:id/reply', authMiddleware({ isPublic: true }), ticketsController.replyTicket);

// 5. Update status / refund (accept PUT, PATCH /:id, and PATCH /:id/status)
router.put('/:id', authMiddleware(), ticketsController.updateTicketStatus);
router.patch('/:id', authMiddleware(), ticketsController.updateTicketStatus);
router.patch('/:id/status', authMiddleware(), ticketsController.updateTicketStatus);

// 6. Escalate to Admin
router.post('/:id/escalate', authMiddleware(), ticketsController.escalateToAdmin);

export default router;
