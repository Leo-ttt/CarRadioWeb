/**
 * FAQ Service — CRUD operations for FAQ items
 */

import FAQ, { IFAQ } from '../models/FAQ';
import { createLogger } from '../utils/logger';

const logger = createLogger('faq-service');

class FAQService {
  /**
   * Get published FAQs for public display
   */
  async getPublishedFAQs(language: string): Promise<IFAQ[]> {
    const faqs = await FAQ.find({ language, published: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return faqs as unknown as IFAQ[];
  }

  /**
   * Get all FAQs (admin, includes unpublished)
   */
  async getAllFAQs(language: string): Promise<IFAQ[]> {
    const faqs = await FAQ.find({ language })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return faqs as unknown as IFAQ[];
  }

  /**
   * Get single FAQ by ID
   */
  async getFAQById(id: string): Promise<IFAQ | null> {
    return FAQ.findById(id).lean() as unknown as Promise<IFAQ | null>;
  }

  /**
   * Create a new FAQ
   */
  async createFAQ(data: Partial<IFAQ>): Promise<IFAQ> {
    const faq = new FAQ(data);
    const saved = await faq.save();
    logger.info({ id: saved._id }, 'FAQ created');
    return saved;
  }

  /**
   * Update an existing FAQ
   */
  async updateFAQ(id: string, data: Partial<IFAQ>): Promise<IFAQ | null> {
    const faq = await FAQ.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (faq) {
      logger.info({ id }, 'FAQ updated');
    }
    return faq as unknown as IFAQ | null;
  }

  /**
   * Delete a FAQ
   */
  async deleteFAQ(id: string): Promise<boolean> {
    const result = await FAQ.deleteOne({ _id: id });
    if (result.deletedCount > 0) {
      logger.info({ id }, 'FAQ deleted');
      return true;
    }
    return false;
  }

  /**
   * Get distinct categories for a language
   */
  async getCategories(language: string): Promise<string[]> {
    return FAQ.distinct('category', { language });
  }
}

export default new FAQService();
