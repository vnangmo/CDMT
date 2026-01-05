import express from 'express';
import PIPProjectController from '../controllers/pipProject.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// PIP Projects CRUD
router.get('/', authorize(['PIP:READ']), PIPProjectController.getPIPProjects);
router.get('/summary/ministry', authorize(['PIP:READ']), PIPProjectController.getSummaryByMinistry);
router.get('/summary/funding-source', authorize(['PIP:READ']), PIPProjectController.getSummaryByFundingSource);
router.get('/recurrent', authorize(['PIP:READ']), PIPProjectController.getRecurrentProjects);
router.get('/external', authorize(['PIP:READ']), PIPProjectController.getExternallyFundedProjects);
router.get('/validate', authorize(['PIP:READ']), PIPProjectController.validateProjects);
router.get('/:id', authorize(['PIP:READ']), PIPProjectController.getPIPProject);
router.post('/', authorize(['PIP:CREATE']), PIPProjectController.createPIPProject);
router.put('/:id', authorize(['PIP:UPDATE']), PIPProjectController.updatePIPProject);
router.delete('/:id', authorize(['PIP:DELETE']), PIPProjectController.deletePIPProject);

export default router;
