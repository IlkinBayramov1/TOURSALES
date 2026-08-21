import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class CMSService {
  // --- FAQ İdarəetməsi ---
  async getFAQs() {
    return prisma.fAQ.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createFAQ(data) {
    const id = await generateUniqueId('FAQ', 'faq');
    return prisma.fAQ.create({
      data: {
        id,
        question: data.question,
        answer: data.answer
      }
    });
  }

  async updateFAQ(id, data) {
    const faq = await prisma.fAQ.findUnique({ where: { id } });
    if (!faq) throw ApiError.notFound('FAQ tapılmadı.');

    return prisma.fAQ.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer
      }
    });
  }

  async deleteFAQ(id) {
    const faq = await prisma.fAQ.findUnique({ where: { id } });
    if (!faq) throw ApiError.notFound('FAQ tapılmadı.');

    await prisma.fAQ.delete({ where: { id } });
    return { success: true };
  }

  // --- Bloq İdarəetməsi ---
  async getBlogs() {
    return prisma.blog.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getBlogById(id) {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) throw ApiError.notFound('Bloq tapılmadı.');
    return blog;
  }

  async createBlog(data) {
    const id = await generateUniqueId('B', 'blog');
    return prisma.blog.create({
      data: {
        id,
        title: data.title,
        content: data.content,
        author: data.author || 'Admin'
      }
    });
  }

  async updateBlog(id, data) {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) throw ApiError.notFound('Bloq tapılmadı.');

    return prisma.blog.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        author: data.author
      }
    });
  }

  async deleteBlog(id) {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) throw ApiError.notFound('Bloq tapılmadı.');

    await prisma.blog.delete({ where: { id } });
    return { success: true };
  }

  // --- Statik Səhifələr (Məxfilik, Qaydalar və s.) ---
  async getStaticPageBySlug(slug) {
    const page = await prisma.staticPage.findUnique({ where: { slug } });
    if (!page) throw ApiError.notFound('Məzmun tapılmadı.');
    return page;
  }

  async upsertStaticPage(slug, data) {
    const existing = await prisma.staticPage.findUnique({ where: { slug } });

    if (existing) {
      return prisma.staticPage.update({
        where: { slug },
        data: {
          title: data.title,
          content: data.content
        }
      });
    } else {
      const id = await generateUniqueId('SPG', 'staticPage');
      return prisma.staticPage.create({
        data: {
          id,
          slug,
          title: data.title,
          content: data.content
        }
      });
    }
  }
}

export const cmsService = new CMSService();
export default cmsService;
