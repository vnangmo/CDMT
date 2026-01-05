import express from 'express';
import PIEProjectController from '../controllers/pieProject.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// PIE Projects CRUD
router.get('/', authorize(['PIE:READ']), PIEProjectController.getPIEProjects);
router.get('/summary/ministry', authorize(['PIE:READ']), PIEProjectController.getSummaryByMinistry);
router.get('/summary/category', authorize(['PIE:READ']), PIEProjectController.getSummaryByCategory);
router.get('/validate', authorize(['PIE:READ']), PIEProjectController.validateProjects);
router.get('/:id', authorize(['PIE:READ']), PIEProjectController.getPIEProject);
router.post('/', authorize(['PIE:CREATE']), PIEProjectController.createPIEProject);
router.put('/:id', authorize(['PIE:UPDATE']), PIEProjectController.updatePIEProject);
router.delete('/:id', authorize(['PIE:DELETE']), PIEProjectController.deletePIEProject);

export default router;
