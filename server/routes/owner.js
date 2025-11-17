import express from 'express';
import { OwnerController } from '../controllers/OwnerController.js';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validateLogin, validateAdminCreate } from '../validators/auth.js';

const router = express.Router();

router.post('/login', validateLogin, OwnerController.login);
router.post('/admins', authenticate, requireOwner, validateAdminCreate, OwnerController.createAdmin);
router.delete('/admins/:id', authenticate, requireOwner, OwnerController.deleteAdmin);
router.post('/admins/:id/reset-password', authenticate, requireOwner, OwnerController.resetAdminPassword);
router.patch('/admins/:id/activate', authenticate, requireOwner, OwnerController.activateAdmin);
router.get('/admins', authenticate, requireOwner, OwnerController.getAllAdmins);
router.get('/admins/:id/stats', authenticate, requireOwner, OwnerController.getAdminStats);
router.get('/stats', authenticate, requireOwner, OwnerController.getSystemStats);
router.get('/tests', authenticate, requireOwner, OwnerController.getAllTests);
router.get('/students', authenticate, requireOwner, OwnerController.getAllStudents);
router.get('/attempts', authenticate, requireOwner, OwnerController.getAllAttempts);

// File-based storage endpoints
router.get('/users', authenticate, requireOwner, OwnerController.getAllUsers);
router.get('/user/:id', authenticate, requireOwner, OwnerController.getUserById);
router.get('/all-results', authenticate, requireOwner, OwnerController.getAllResults);
router.get('/user-tests/:id', authenticate, requireOwner, OwnerController.getUserResults);
router.patch('/user/:id/status', authenticate, requireOwner, OwnerController.updateUserStatus);
router.post('/user/:id/reset-password', authenticate, requireOwner, OwnerController.resetUserPassword);

export default router;

