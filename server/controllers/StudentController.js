import { StudentService } from '../services/StudentService.js';
import logger from '../utils/logger.js';

export class StudentController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await StudentService.login(email, password);
      res.json(result);
    } catch (error) {
      logger.error('Student login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async register(req, res, next) {
    try {
      const result = await StudentService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Student register error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = await StudentService.getProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const profile = await StudentService.updateProfile(req.user.id, req.body);
      res.json(profile);
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await StudentService.getStats(req.user.id);
      res.json(stats);
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAttempts(req, res, next) {
    try {
      const attempts = await StudentService.getAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      logger.error('Get attempts error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getTests(req, res, next) {
    try {
      const tests = await StudentService.getTests(req.user.id);
      res.json(tests);
    } catch (error) {
      logger.error('Get tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async accessTest(req, res, next) {
    try {
      const { testKey, fullName, studentId } = req.body;
      // If user is authenticated, use their ID, otherwise use studentId from body
      const finalStudentId = req.user?.id || studentId || null;
      const result = await StudentService.accessTest(testKey, fullName, finalStudentId);
      res.json(result);
    } catch (error) {
      logger.error('Student access error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTest(req, res, next) {
    try {
      const testKey = req.user.testKey;
      const test = await StudentService.getTest(testKey);
      res.json(test);
    } catch (error) {
      logger.error('Get test error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async getAttempt(req, res, next) {
    try {
      const attempt = await StudentService.getAttempt(req.user.id);
      res.json(attempt);
    } catch (error) {
      logger.error('Get attempt error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async saveReadingAnswers(req, res, next) {
    try {
      const { answers } = req.body;
      const attempt = await StudentService.saveAnswers(req.user.id, 'reading', answers);
      res.json(attempt);
    } catch (error) {
      logger.error('Save reading answers error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async saveListeningAnswers(req, res, next) {
    try {
      const { answers } = req.body;
      const attempt = await StudentService.saveAnswers(req.user.id, 'listening', answers);
      res.json(attempt);
    } catch (error) {
      logger.error('Save listening answers error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async saveWriting(req, res, next) {
    try {
      const { content } = req.body;
      const attempt = await StudentService.saveAnswers(req.user.id, 'writing', { content });
      res.json(attempt);
    } catch (error) {
      logger.error('Save writing error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async saveHighlights(req, res, next) {
    try {
      const { highlights } = req.body;
      const attempt = await StudentService.saveHighlights(req.user.id, highlights);
      res.json(attempt);
    } catch (error) {
      logger.error('Save highlights error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async submitTest(req, res, next) {
    try {
      const attempt = await StudentService.submitTest(req.user.id);
      res.json(attempt);
    } catch (error) {
      logger.error('Submit test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllTests(req, res, next) {
    try {
      const tests = await StudentService.getAllTests();
      res.json(tests);
    } catch (error) {
      logger.error('Get all tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async joinTest(req, res, next) {
    try {
      const { testKey } = req.body;
      const result = await StudentService.joinTest(testKey);
      res.json(result);
    } catch (error) {
      logger.error('Join test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async checkTestStatus(req, res, next) {
    try {
      const { testKey } = req.params;
      const status = await StudentService.checkTestStatus(testKey);
      res.json(status);
    } catch (error) {
      logger.error('Check test status error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

