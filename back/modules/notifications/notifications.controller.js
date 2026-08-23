import notificationsService from './notifications.service.js';
import ApiError from '../../core/api.error.js';

class NotificationsController {
  async sendNotification(req, res, next) {
    try {
      const { userId, type, title, message, email } = req.body;
      if (!title || !message) {
        throw ApiError.badRequest('Title və message sahələri tələb olunur.');
      }

      await notificationsService.send({ userId, type, title, message, email });
      res.json({ success: true, message: 'Bildiriş uğurla göndərildi.' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
export default notificationsController;
