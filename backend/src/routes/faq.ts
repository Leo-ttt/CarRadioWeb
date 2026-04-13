/**
 * FAQ Routes
 * GET /api/faq — public (published only)
 * GET /api/faq/admin — admin (all)
 * POST /api/faq — admin create
 * PUT /api/faq/:id — admin update
 * DELETE /api/faq/:id — admin delete
 */

import express from 'express';
import faqService from '../services/faqService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('faq-route');
const router = express.Router();

/**
 * Public: get published FAQs
 */
router.get('/', async (req, res) => {
  try {
    const language = (req.query.language as string) || 'en';
    const faqs = await faqService.getPublishedFAQs(language);
    res.json({ success: true, data: faqs });
  } catch (error) {
    logger.error({ error }, 'Failed to get FAQs');
    res.status(500).json({ success: false, error: 'Failed to get FAQs' });
  }
});

/**
 * Admin: get all FAQs (including unpublished)
 */
router.get('/admin', authenticateUser, requirePermission(PERMISSIONS.content.read), async (req, res) => {
  try {
    const language = (req.query.language as string) || 'en';
    const faqs = await faqService.getAllFAQs(language);
    res.json({ success: true, data: faqs });
  } catch (error) {
    logger.error({ error }, 'Failed to get admin FAQs');
    res.status(500).json({ success: false, error: 'Failed to get FAQs' });
  }
});


/**
 * Admin: get distinct categories
 */
router.get('/categories', authenticateUser, async (req, res) => {
  try {
    const language = (req.query.language as string) || 'en';
    const categories = await faqService.getCategories(language);
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error({ error }, 'Failed to get FAQ categories');
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

/**
 * Admin: create FAQ
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.content.create), async (req, res) => {
  try {
    const { question, answer, category, sortOrder, published, language } = req.body;

    if (!question || !answer) {
      res.status(400).json({ success: false, error: 'question and answer are required' });
      return;
    }

    const faq = await faqService.createFAQ({
      question,
      answer,
      category: category || 'general',
      sortOrder: sortOrder ?? 0,
      published: published ?? true,
      language: language || 'en',
    });

    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    logger.error({ error }, 'Failed to create FAQ');
    res.status(500).json({ success: false, error: 'Failed to create FAQ' });
  }
});

/**
 * Admin: update FAQ
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await faqService.updateFAQ(id, req.body);

    if (!faq) {
      res.status(404).json({ success: false, error: 'FAQ not found' });
      return;
    }

    res.json({ success: true, data: faq });
  } catch (error) {
    logger.error({ error }, 'Failed to update FAQ');
    res.status(500).json({ success: false, error: 'Failed to update FAQ' });
  }
});

/**
 * Admin: delete FAQ
 */
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.content.delete), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await faqService.deleteFAQ(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'FAQ not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to delete FAQ');
    res.status(500).json({ success: false, error: 'Failed to delete FAQ' });
  }
});

export default router;
