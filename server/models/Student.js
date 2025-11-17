import { v4 as uuidv4 } from 'uuid';
import { studentStorage } from '../utils/fileStorage.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// Student model using file-based storage (uploads/students/)
export class Student {
  static async findByEmail(email) {
    const students = studentStorage.getAll();
    return students.find(s => s.email === email || s.username === email || s.login === email) || null;
  }

  static async findByLogin(login) {
    const students = studentStorage.getAll();
    return students.find(s => s.login === login || s.username === login || s.email === login) || null;
  }

  static async findByUsername(username) {
    const students = studentStorage.getAll();
    return students.find(s => s.username === username) || null;
  }

  static async findById(id) {
    return studentStorage.load(id);
  }

  static async getAll() {
    return studentStorage.getAll();
  }

  static async create(data) {
    const loginOrEmail = data.login || data.email || data.username;
    
    // Check if student already exists
    const existing = await Student.findByEmail(loginOrEmail) || 
                     await Student.findByLogin(loginOrEmail) || 
                     await Student.findByUsername(data.username);
    
    if (existing) {
      throw new Error('Student with this login already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const student = {
      id: uuidv4(),
      full_name: data.fullName || data.full_name || '',
      username: data.username || data.login || data.email || '',
      phone: data.phone || '',
      email: data.email || data.login || '',
      birth_date: data.birth_date || data.birthDate || '',
      region: data.region || '',
      gender: data.gender || '',
      login: data.login || data.username || data.email || '',
      password_hash: hashedPassword,
      registered_at: new Date().toISOString(),
      last_login: null,
      used_admin_key: '', // Will be set when student uses a test key
      test_status: 'not_taken', // 'not_taken', 'in_progress', 'completed'
      test_score: '',
      test_history: [], // Array of test attempts
    };
    
    studentStorage.save(student);
    return student;
  }

  static async update(id, data) {
    const student = await Student.findById(id);
    if (!student) {
      return null;
    }

    // If password is being updated, hash it
    if (data.password) {
      data.password_hash = await hashPassword(data.password);
      delete data.password;
    }

    const updatedStudent = {
      ...student,
      ...data,
      password_hash: data.password_hash || student.password_hash,
    };

    studentStorage.save(updatedStudent);
    return updatedStudent;
  }

  static async updateLastLogin(id) {
    const student = await Student.findById(id);
    if (student) {
      student.last_login = new Date().toISOString();
      studentStorage.save(student);
    }
  }

  static async updateAdminKey(id, adminKey) {
    const student = await Student.findById(id);
    if (student) {
      student.used_admin_key = adminKey;
      studentStorage.save(student);
      return student;
    }
    return null;
  }

  static async updateTestStatus(id, status, score = '') {
    const student = await Student.findById(id);
    if (student) {
      student.test_status = status;
      if (score) {
        student.test_score = score;
      }
      studentStorage.save(student);
      return student;
    }
    return null;
  }

  static async verifyPassword(student, password) {
    return comparePassword(password, student.password_hash || student.password);
  }

  static async getByAdminKey(adminKey) {
    return studentStorage.getByAdminKey(adminKey);
  }

  static async getStats(id) {
    // This can be enhanced later with resultStorage
    const student = await Student.findById(id);
    if (!student) {
      return {
        totalTests: 0,
        completedTests: 0,
        inProgressTests: 0,
        averageScore: 0
      };
    }

    return {
      totalTests: student.test_status !== 'not_taken' ? 1 : 0,
      completedTests: student.test_status === 'completed' ? 1 : 0,
      inProgressTests: student.test_status === 'in_progress' ? 1 : 0,
      averageScore: parseFloat(student.test_score) || 0
    };
  }

  static async delete(id) {
    return studentStorage.delete(id);
  }
}
