import { AdminService } from '../services/AdminService.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export class AdminController {
  static async login(req, res, next) {
    try {
      const { login, password } = req.body;
      const result = await AdminService.login(login, password);
      res.json(result);
    } catch (error) {
      logger.error('Admin login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async createTest(req, res, next) {
    try {
      const test = await AdminService.createTest(req.body, req.user.id);
      res.status(201).json(test);
    } catch (error) {
      logger.error('Create test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTests(req, res, next) {
    try {
      const tests = await AdminService.getTests(req.user.id);
      res.json(tests);
    } catch (error) {
      logger.error('Get tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getTest(req, res, next) {
    try {
      const test = await AdminService.getTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Get test error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async updateTest(req, res, next) {
    try {
      const test = await AdminService.updateTest(req.params.id, req.body, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Update test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTest(req, res, next) {
    try {
      const result = await AdminService.deleteTest(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Delete test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async startTest(req, res, next) {
    try {
      const test = await AdminService.startTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Start test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async stopTest(req, res, next) {
    try {
      const test = await AdminService.stopTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Stop test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async uploadReading(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/reading/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      logger.error('Upload reading error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadListening(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/listening/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      logger.error('Upload listening error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadWriting(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/writing/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      logger.error('Upload writing error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async generateTestKey(req, res, next) {
    try {
      const { testId } = req.body;
      const testKey = await AdminService.generateTestKey(testId, req.user.id);
      res.status(201).json(testKey);
    } catch (error) {
      logger.error('Generate key error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTestKeys(req, res, next) {
    try {
      const keys = await AdminService.getTestKeys(req.user.id);
      res.json(keys);
    } catch (error) {
      logger.error('Get keys error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getResults(req, res, next) {
    try {
      const results = await AdminService.getResults(req.user.id);
      res.json(results);
    } catch (error) {
      logger.error('Get results error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getStudents(req, res, next) {
    try {
      const students = await AdminService.getStudents(req.user.id);
      res.json(students);
    } catch (error) {
      logger.error('Get students error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getStats(req.user.id);
      res.json(stats);
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // File-based storage endpoints - Admin sees ONLY their users
  static async getMyUsers(req, res, next) {
    try {
      const users = await AdminService.getMyUsers(req.user.id);
      res.json(users);
    } catch (error) {
      logger.error('Get my users error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyResults(req, res, next) {
    try {
      const results = await AdminService.getMyResults(req.user.id);
      res.json(results);
    } catch (error) {
      logger.error('Get my results error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyTest(req, res, next) {
    try {
      const data = await AdminService.getMyTest(req.user.id, req.params.test_id);
      res.json(data);
    } catch (error) {
      logger.error('Get my test error:', error);
      res.status(404).json({ error: error.message });
    }
  }
}

