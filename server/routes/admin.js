import express from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateLogin } from '../validators/auth.js';
import { upload } from '../config/upload.js';

const router = express.Router();

router.post('/login', validateLogin, AdminController.login);
router.post('/tests', authenticate, requireAdmin, AdminController.createTest);
router.get('/tests', authenticate, requireAdmin, AdminController.getTests);
router.get('/tests/:id', authenticate, requireAdmin, AdminController.getTest);
router.put('/tests/:id', authenticate, requireAdmin, AdminController.updateTest);
router.delete('/tests/:id', authenticate, requireAdmin, AdminController.deleteTest);
router.post('/tests/:id/start', authenticate, requireAdmin, AdminController.startTest);
router.post('/tests/:id/stop', authenticate, requireAdmin, AdminController.stopTest);
router.post('/upload/reading', authenticate, requireAdmin, upload.single('file'), AdminController.uploadReading);
router.post('/upload/listening', authenticate, requireAdmin, upload.single('file'), AdminController.uploadListening);
router.post('/upload/writing', authenticate, requireAdmin, upload.single('file'), AdminController.uploadWriting);
router.post('/test-keys', authenticate, requireAdmin, AdminController.generateTestKey);
router.get('/test-keys', authenticate, requireAdmin, AdminController.getTestKeys);
router.get('/results', authenticate, requireAdmin, AdminController.getResults);
router.get('/students', authenticate, requireAdmin, AdminController.getStudents);
router.get('/stats', authenticate, requireAdmin, AdminController.getStats);

// File-based storage endpoints - Admin sees ONLY their users
router.get('/my-users', authenticate, requireAdmin, AdminController.getMyUsers);
router.get('/my-results', authenticate, requireAdmin, AdminController.getMyResults);
router.get('/my-test/:test_id', authenticate, requireAdmin, AdminController.getMyTest);

export default router;

