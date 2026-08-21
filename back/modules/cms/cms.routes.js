import express from 'express';
import { cmsController } from './cms.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Hər kəsə açıq marşrutlar (Müştərilərin oxuması üçün)
router.get('/faq', cmsController.getFAQs);
router.get('/blog', cmsController.getBlogs);
router.get('/blog/:id', cmsController.getBlogById);
router.get('/page/:slug', cmsController.getStaticPage);

// Aşağıdakı marşrutlar yalnız SuperAdmin tərəfindən icra edilə bilər
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.SUPERADMIN));

// FAQ CRUD marşrutları
router.post('/faq', cmsController.createFAQ);
router.put('/faq/:id', cmsController.updateFAQ);
router.delete('/faq/:id', cmsController.deleteFAQ);

// Blog CRUD marşrutları
router.post('/blog', cmsController.createBlog);
router.put('/blog/:id', cmsController.updateBlog);
router.delete('/blog/:id', cmsController.deleteBlog);

// Statik səhifələri redaktə etmə/yaratma marşrutu
router.post('/page/:slug', cmsController.upsertStaticPage);

export default router;
