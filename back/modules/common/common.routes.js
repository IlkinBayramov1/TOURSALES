import express from 'express';
import { commonController } from './common.controller.js';
import { publicUpload } from '../../utils/file-uploader.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// Middleware to handle both 'image' and 'file' field names gracefully
const handleUploadFile = (req, res, next) => {
  publicUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return next(err);
    req.file = req.files?.image?.[0] || req.files?.file?.[0] || null;
    next();
  });
};

router.get('/currencies', commonController.getCurrencies);
router.get('/currencies/convert', commonController.convertCurrency);
router.post('/geofence/check-arrival', commonController.checkGeofence);
router.post('/i18n/translate', commonController.translate);
router.post('/upload', authMiddleware(), handleUploadFile, commonController.uploadImage);

export default router;
