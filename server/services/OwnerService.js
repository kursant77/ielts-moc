import { Owner } from '../models/Owner.js';
import { Admin } from '../models/Admin.js';
import { Test } from '../models/Test.js';
import { Attempt } from '../models/Attempt.js';
import { TestKeyModel } from '../models/TestKey.js';
import { Student } from '../models/Student.js';
import { Result } from '../models/Result.js';
import { testStorage } from '../utils/fileStorage.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import logger from '../utils/logger.js';

export class OwnerService {
  static async login(login, password) {
    const owner = await Owner.findByLogin(login) || await Owner.findByEmail(login);
    if (!owner) {
      throw new Error('Invalid credentials');
    }

    const isValid = await Owner.verifyPassword(owner, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await Owner.updateLastLogin(owner.id);

    const payload = {
      id: owner.id,
      email: owner.email || owner.login,
      role: 'owner'
    };

    return {
      owner: {
        id: owner.id,
        email: owner.email || owner.login,
        name: owner.name
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }

  static async createAdmin(data, ownerId) {
    if (!data.login || !data.password || !data.name) {
      throw new Error('Login, password, and name are required');
    }

    const existing = await Admin.findByEmail(data.login) || await Admin.findByLogin(data.login);
    if (existing) {
      throw new Error('Admin with this login already exists');
    }

    const admin = await Admin.create({
      login: data.login,
      password: data.password,
      name: data.name,
      email: data.login,
      createdBy: ownerId
    });

    logger.info(`Owner ${ownerId} created admin ${admin.id} with login: ${admin.login}`);

    return {
      id: admin.id,
      login: admin.login,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      createdAt: admin.createdAt
    };
  }

  static async deleteAdmin(adminId) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    await Admin.delete(adminId);
    logger.info(`Admin ${adminId} deleted`);
    return { success: true };
  }

  static async resetAdminPassword(adminId, newPassword) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    await Admin.resetPassword(adminId, newPassword);
    logger.info(`Password reset for admin ${adminId}`);
    return { success: true };
  }

  static async activateAdmin(adminId, isActive) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    await Admin.update(adminId, { isActive });
    logger.info(`Admin ${adminId} ${isActive ? 'activated' : 'deactivated'}`);
    return { success: true };
  }

  static async getAllAdmins() {
    const admins = await Admin.findAll();
    return admins.map(a => ({
      id: a.id,
      login: a.login || a.email,
      email: a.email,
      name: a.name,
      isActive: a.isActive,
      createdAt: a.createdAt,
      lastLogin: a.lastLogin
    }));
  }

  static async getAdminStats(adminId) {
    return await Admin.getStats(adminId);
  }

  static async getSystemStats() {
    const db = await import('../config/database.js').then(m => m.loadDb());
    
    const admins = db.admins;
    const tests = db.tests;
    const attempts = db.attempts;
    
    // Get ALL students from file-based storage (uploads/students/)
    const allStudents = await Student.getAll();

    return {
      totalAdmins: admins.length,
      activeAdmins: admins.filter(a => a.isActive).length,
      totalTests: tests.length,
      activeTests: tests.filter(t => t.isActive).length,
      totalStudents: allStudents.length, // File-based storage count
      totalUsers: allStudents.length, // Alias for totalStudents
      totalAttempts: attempts.length,
      completedAttempts: attempts.filter(a => a.isSubmitted).length
    };
  }

  static async getAllTests() {
    const tests = await Test.findAll();
    return tests.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      duration: t.duration,
      isActive: t.isActive,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
      startedAt: t.startedAt,
      endedAt: t.endedAt
    }));
  }

  static async getAllStudents() {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const attempts = db.attempts;
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

  static async getAllAttempts() {
    const attempts = await Attempt.findAll();
    return attempts.map(a => ({
      id: a.id,
      testKey: a.testKey,
      testId: a.testId,
      studentName: a.studentName,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      isSubmitted: a.isSubmitted,
      duration: a.duration
    }));
  }

  // File-based storage methods - Owner sees ALL students
  static async getAllUsers() {
    // Get ALL students from uploads/students/
    const students = await Student.getAll();
    // Return full student information for Owner
    return students.map(s => ({
      id: s.id,
      full_name: s.full_name || s.fullName || '',
      username: s.username || s.login || '',
      login: s.login || s.username || s.email || '',
      email: s.email || '',
      phone: s.phone || '',
      birth_date: s.birth_date || '',
      region: s.region || '',
      gender: s.gender || '',
      password_hash: s.password_hash || '***',
      registered_at: s.registered_at || s.registration_date || s.createdAt || '',
      last_login: s.last_login || s.lastLogin || null,
      used_admin_key: s.used_admin_key || '',
      test_status: s.test_status || 'not_taken',
      test_score: s.test_score || '',
      test_history: s.test_history || [],
    }));
  }

  static async getUserById(userId) {
    const student = await Student.findById(userId);
    if (!student) {
      throw new Error('User not found');
    }
    // Return full student information
    return {
      id: student.id,
      full_name: student.full_name || student.fullName || '',
      username: student.username || student.login || '',
      login: student.login || student.username || student.email || '',
      email: student.email || '',
      phone: student.phone || '',
      birth_date: student.birth_date || '',
      region: student.region || '',
      gender: student.gender || '',
      password_hash: student.password_hash || '***',
      registered_at: student.registered_at || student.registration_date || student.createdAt || '',
      last_login: student.last_login || student.lastLogin || null,
      used_admin_key: student.used_admin_key || '',
      test_status: student.test_status || 'not_taken',
      test_score: student.test_score || '',
      test_history: student.test_history || [],
    };
  }

  static async getAllResults() {
    const results = await Result.getAll();
    return results;
  }

  static async getUserResults(userId) {
    const results = await Result.findByUser(userId);
    return results;
  }

  static async updateUserStatus(userId, status) {
    const student = await Student.findById(userId);
    if (!student) {
      throw new Error('User not found');
    }
    // Update test_status field
    return await Student.updateTestStatus(userId, status);
  }

  static async resetUserPassword(userId, newPassword) {
    const student = await Student.findById(userId);
    if (!student) {
      throw new Error('User not found');
    }
    return await Student.update(userId, { password: newPassword });
  }
}

