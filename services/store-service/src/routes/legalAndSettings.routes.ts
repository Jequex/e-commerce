import { Router } from 'express';
import { LegalAndSettingsController } from '../controllers/legalAndSettingsController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new LegalAndSettingsController();

// Contact Information
router.get('/settings/contact', asyncHandler(controller.getContactInfo.bind(controller)));
router.put('/settings/contact', asyncHandler(controller.updateContactInfo.bind(controller)));

// Legal Documents
router.get('/legal', asyncHandler(controller.getAllLegalDocuments.bind(controller)));
router.get('/legal/:type', asyncHandler(controller.getLegalDocumentByType.bind(controller)));
router.get('/legal/:type/versions', asyncHandler(controller.getLegalDocumentVersions.bind(controller)));
router.post('/legal/:type/versions', asyncHandler(controller.createLegalDocumentVersion.bind(controller)));

export { router as legalAndSettingsRoutes };

