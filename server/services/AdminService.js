import { Admin } from '../models/Admin.js';
import { Test } from '../models/Test.js';
import { TestKeyModel } from '../models/TestKey.js';
import { Attempt } from '../models/Attempt.js';
import { User } from '../models/User.js';
import { Result } from '../models/Result.js';
import { testStorage } from '../utils/fileStorage.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import logger from '../utils/logger.js';

export class AdminService {
  static async login(login, password) {
    const admin = await Admin.findByLogin(login) || await Admin.findByEmail(login);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValid = await Admin.verifyPassword(admin, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await Admin.updateLastLogin(admin.id);

    const payload = {
      id: admin.id,
      email: admin.email || admin.login,
      role: 'admin'
    };

    return {
      admin: {
        id: admin.id,
        email: admin.email || admin.login,
        name: admin.name
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }

  static async createTest(data, adminId) {
    const test = await Test.create({
      ...data,
      createdBy: adminId
    });

    // Automatically generate test key
    const testKey = await TestKeyModel.create({
      testId: test.id,
      adminId
    });

    logger.info(`Admin ${adminId} created test ${test.id} with key ${testKey.key}`);
    return {
      ...test,
      testKey: testKey.key,
      testId: test.id
    };
  }

  static async getTests(adminId) {
    const tests = await Test.findByAdmin(adminId);
    return tests;
  }

  static async getTest(testId, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }
    return test;
  }

  static async updateTest(testId, data, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    return await Test.update(testId, data);
  }

  static async deleteTest(testId, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    await Test.delete(testId);
    logger.info(`Admin ${adminId} deleted test ${testId}`);
    return { success: true };
  }

  static async startTest(testId, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    return await Test.start(testId);
  }

  static async stopTest(testId, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    return await Test.stop(testId);
  }

  static async generateTestKey(testId, adminId) {
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    const testKey = await TestKeyModel.create({
      testId,
      adminId
    });

    logger.info(`Admin ${adminId} generated key for test ${testId}`);
    return testKey;
  }

  static async getTestKeys(adminId) {
    const keys = await TestKeyModel.findByAdmin(adminId);
    const db = await import('../config/database.js').then(m => m.loadDb());
    
    return keys.map(k => {
      const test = db.tests.find(t => t.id === k.testId);
      return {
        id: k.id,
        key: k.key,
        testId: k.testId,
        testTitle: test?.title,
        isActive: k.isActive,
        createdAt: k.createdAt,
        usedBy: k.usedBy,
        usedAt: k.usedAt
      };
    });
  }

  static async getResults(adminId) {
    const attempts = await Attempt.findByAdmin(adminId);
    const db = await import('../config/database.js').then(m => m.loadDb());
    
    return attempts.map(a => {
      const test = db.tests.find(t => t.id === a.testId);
      return {
        id: a.id,
        testKey: a.testKey,
        testId: a.testId,
        testTitle: test?.title,
        studentName: a.studentName,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        isSubmitted: a.isSubmitted,
        duration: a.duration
      };
    });
  }

  static async getStudents(adminId) {
    const attempts = await Attempt.findByAdmin(adminId);
    const students = {};

    attempts.forEach(attempt => {
      if (!students[attempt.studentName]) {
        students[attempt.studentName] = {
          name: attempt.studentName,
          totalAttempts: 0,
          completedAttempts: 0,
          lastAttempt: null
        };
      }
      students[attempt.studentName].totalAttempts++;
      if (attempt.isSubmitted) {
        students[attempt.studentName].completedAttempts++;
      }
      if (!students[attempt.studentName].lastAttempt || 
          new Date(attempt.startedAt) > new Date(students[attempt.studentName].lastAttempt)) {
        students[attempt.studentName].lastAttempt = attempt.startedAt;
      }
    });

    return Object.values(students);
  }

  static async getStats(adminId) {
    return await Admin.getStats(adminId);
  }

  // File-based storage methods - Admin sees ONLY students who used their test keys
  static async getMyUsers(adminId) {
    // Get all test keys for this admin
    const testKeys = await TestKeyModel.findByAdmin(adminId);
    const testKeyList = testKeys.map(k => k.key);

    if (testKeyList.length === 0) {
      return [];
    }

    // Get all students who used these test keys (check used_admin_key field)
    const allStudents = await Student.getAll();
    const myStudents = allStudents.filter(student => 
      testKeyList.includes(student.used_admin_key || student.used_test_key || '')
    );

    // Return full student information
    return myStudents.map(s => ({
      id: s.id,
      full_name: s.full_name || s.fullName || '',
      email: s.email || '',
      username: s.username || s.login || '',
      phone: s.phone || '',
      registered_at: s.registered_at || s.registration_date || s.createdAt || '',
      last_login: s.last_login || s.lastLogin || null,
      used_admin_key: s.used_admin_key || '',
      test_status: s.test_status || 'not_taken',
      test_score: s.test_score || '',
    }));
  }

  static async getMyResults(adminId) {
    // Get all test keys for this admin
    const testKeys = await TestKeyModel.findByAdmin(adminId);
    const testKeyList = testKeys.map(k => k.key);

    if (testKeyList.length === 0) {
      return [];
    }

    // Get all results for these test keys
    const allResults = await Result.getAll();
    const adminResults = allResults.filter(result => 
      testKeyList.includes(result.test_key || result.testKey)
    );

    return adminResults;
  }

  static async getMyTest(adminId, testId) {
    // Verify the test belongs to this admin
    const test = await Test.findById(testId);
    if (!test || test.createdBy !== adminId) {
      throw new Error('Test not found or access denied');
    }

    // Get test key for this test
    const testKeys = await TestKeyModel.findByTest(testId);
    const adminTestKeys = testKeys.filter(k => k.adminId === adminId);
    
    if (adminTestKeys.length === 0) {
      return {
        test,
        results: [],
        users: [],
      };
    }

    const testKeyList = adminTestKeys.map(k => k.key);

    // Get results for this test
    const results = await Result.findByTest(testId);
    const adminResults = results.filter(result =>
      testKeyList.includes(result.test_key || result.testKey)
    );

    // Get students who took this test (filter by used_admin_key)
    const allStudents = await Student.getAll();
    const myStudents = allStudents.filter(student => 
      testKeyList.includes(student.used_admin_key || student.used_test_key || '')
    );

    return {
      test,
      testKeys: adminTestKeys,
      results: adminResults,
      users: myStudents.map(s => ({
        id: s.id,
        full_name: s.full_name || s.fullName || '',
        email: s.email || '',
        username: s.username || s.login || '',
        phone: s.phone || '',
        test_status: s.test_status || 'not_taken',
        test_score: s.test_score || '',
      })),
    };
  }
}

