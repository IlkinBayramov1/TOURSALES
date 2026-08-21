import { asyncHandler } from '../../core/utils.js';
import { cmsService } from './cms.service.js';
import ApiError from '../../core/api.error.js';

class CMSController {
  // FAQs
  getFAQs = asyncHandler(async (req, res) => {
    const result = await cmsService.getFAQs();
    return res.json({ status: 'success', data: result });
  });

  createFAQ = asyncHandler(async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) throw ApiError.badRequest('Sual və cavab daxil edilməlidir.');
    const result = await cmsService.createFAQ(req.body);
    return res.status(201).json({ status: 'success', msg: 'FAQ əlavə edildi', data: result });
  });

  updateFAQ = asyncHandler(async (req, res) => {
    const result = await cmsService.updateFAQ(req.params.id, req.body);
    return res.json({ status: 'success', msg: 'FAQ yeniləndi', data: result });
  });

  deleteFAQ = asyncHandler(async (req, res) => {
    await cmsService.deleteFAQ(req.params.id);
    return res.json({ status: 'success', msg: 'FAQ silindi' });
  });

  // Blogs
  getBlogs = asyncHandler(async (req, res) => {
    const result = await cmsService.getBlogs();
    return res.json({ status: 'success', data: result });
  });

  getBlogById = asyncHandler(async (req, res) => {
    const result = await cmsService.getBlogById(req.params.id);
    return res.json({ status: 'success', data: result });
  });

  createBlog = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) throw ApiError.badRequest('Başlıq və məzmun daxil edilməlidir.');
    const result = await cmsService.createBlog(req.body);
    return res.status(201).json({ status: 'success', msg: 'Bloq yaradıldı', data: result });
  });

  updateBlog = asyncHandler(async (req, res) => {
    const result = await cmsService.updateBlog(req.params.id, req.body);
    return res.json({ status: 'success', msg: 'Bloq yeniləndi', data: result });
  });

  deleteBlog = asyncHandler(async (req, res) => {
    await cmsService.deleteBlog(req.params.id);
    return res.json({ status: 'success', msg: 'Bloq silindi' });
  });

  // Static Pages
  getStaticPage = asyncHandler(async (req, res) => {
    const result = await cmsService.getStaticPageBySlug(req.params.slug);
    return res.json({ status: 'success', data: result });
  });

  upsertStaticPage = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) throw ApiError.badRequest('Məzmun başlığı və kontent vacibdir.');
    const result = await cmsService.upsertStaticPage(req.params.slug, req.body);
    return res.json({ status: 'success', msg: 'Səhifə yeniləndi/yaradıldı', data: result });
  });
}

export const cmsController = new CMSController();
export default cmsController;
