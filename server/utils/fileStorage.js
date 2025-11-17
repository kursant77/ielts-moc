import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All uploads now in server/uploads (not root/uploads)
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const STUDENTS_DIR = path.join(UPLOADS_DIR, 'students');
const TESTS_DIR = path.join(UPLOADS_DIR, 'tests');
const RESULTS_DIR = path.join(UPLOADS_DIR, 'results');
const KEYS_DIR = path.join(UPLOADS_DIR, 'keys');

// Ensure directories exist
const ensureDirectories = () => {
  [UPLOADS_DIR, STUDENTS_DIR, TESTS_DIR, RESULTS_DIR, KEYS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize on import
ensureDirectories();

// Generic file operations
export const fileStorage = {
  // Write a file
  write: (dir, filename, data) => {
    ensureDirectories();
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  },

  // Read a file
  read: (dir, filename) => {
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  },

  // Check if file exists
  exists: (dir, filename) => {
    const filePath = path.join(dir, filename);
    return fs.existsSync(filePath);
  },

  // Delete a file (only owner can do this)
  delete: (dir, filename) => {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  },

  // List all files in directory
  list: (dir) => {
    ensureDirectories();
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  },

  // Read all files from directory
  readAll: (dir) => {
    ensureDirectories();
    if (!fs.existsSync(dir)) {
      return [];
    }
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.json'));
    
    return files.map(file => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      return JSON.parse(content);
    });
  },

  // Search files by criteria
  search: (dir, predicate) => {
    const allFiles = fileStorage.readAll(dir);
    return allFiles.filter(predicate);
  },
};

// Student-specific operations (uploads/students/)
export const studentStorage = {
  getFilePath: (studentId) => path.join(STUDENTS_DIR, `student_${studentId}.json`),
  
  save: (student) => {
    ensureDirectories();
    const filename = `student_${student.id}.json`;
    // Remove password before saving (store password_hash instead)
    const { password, ...studentData } = student;
    const studentToSave = {
      ...studentData,
      password_hash: student.password || student.password_hash || student.password_hash,
    };
    return fileStorage.write(STUDENTS_DIR, filename, studentToSave);
  },

  load: (studentId) => {
    const filename = `student_${studentId}.json`;
    return fileStorage.read(STUDENTS_DIR, filename);
  },

  exists: (studentId) => {
    const filename = `student_${studentId}.json`;
    return fileStorage.exists(STUDENTS_DIR, filename);
  },

  delete: (studentId) => {
    const filename = `student_${studentId}.json`;
    return fileStorage.delete(STUDENTS_DIR, filename);
  },

  getAll: () => {
    return fileStorage.readAll(STUDENTS_DIR);
  },

  search: (predicate) => {
    return fileStorage.search(STUDENTS_DIR, predicate);
  },

  updateAdminKey: async (studentId, adminKey) => {
    const student = studentStorage.load(studentId);
    if (student) {
      student.used_admin_key = adminKey;
      studentStorage.save(student);
      return student;
    }
    return null;
  },

  getByAdminKey: (adminKey) => {
    return fileStorage.search(STUDENTS_DIR, (student) => 
      student.used_admin_key === adminKey
    );
  },
};

// Legacy alias for backward compatibility
export const userStorage = studentStorage;

// Test-specific operations
export const testStorage = {
  getFilePath: (testId) => path.join(TESTS_DIR, `test_${testId}.json`),
  
  save: (test) => {
    ensureDirectories();
    const filename = `test_${test.id || test.test_id}.json`;
    return fileStorage.write(TESTS_DIR, filename, test);
  },

  load: (testId) => {
    const filename = `test_${testId}.json`;
    return fileStorage.read(TESTS_DIR, filename);
  },

  exists: (testId) => {
    const filename = `test_${testId}.json`;
    return fileStorage.exists(TESTS_DIR, filename);
  },

  delete: (testId) => {
    const filename = `test_${testId}.json`;
    return fileStorage.delete(TESTS_DIR, filename);
  },

  getAll: () => {
    return fileStorage.readAll(TESTS_DIR);
  },

  getByAdmin: (adminId) => {
    return fileStorage.search(TESTS_DIR, (test) => test.admin_id === adminId || test.createdBy === adminId);
  },

  getByKey: (testKey) => {
    return fileStorage.search(TESTS_DIR, (test) => test.test_key === testKey || test.testKey === testKey);
  },
};

// Result-specific operations
export const resultStorage = {
  getFilePath: (resultId) => path.join(RESULTS_DIR, `result_${resultId}.json`),
  
  save: (result) => {
    ensureDirectories();
    const filename = `result_${result.id || result.result_id}.json`;
    return fileStorage.write(RESULTS_DIR, filename, result);
  },

  load: (resultId) => {
    const filename = `result_${resultId}.json`;
    return fileStorage.read(RESULTS_DIR, filename);
  },

  exists: (resultId) => {
    const filename = `result_${resultId}.json`;
    return fileStorage.exists(RESULTS_DIR, filename);
  },

  delete: (resultId) => {
    const filename = `result_${resultId}.json`;
    return fileStorage.delete(RESULTS_DIR, filename);
  },

  getAll: () => {
    return fileStorage.readAll(RESULTS_DIR);
  },

  getByUser: (userId) => {
    return fileStorage.search(RESULTS_DIR, (result) => result.user_id === userId);
  },

  getByTest: (testId) => {
    return fileStorage.search(RESULTS_DIR, (result) => result.test_id === testId);
  },

  getByAdmin: (adminId) => {
    return fileStorage.search(RESULTS_DIR, (result) => result.admin_id === adminId);
  },

  getByTestKey: (testKey) => {
    return fileStorage.search(RESULTS_DIR, (result) => result.test_key === testKey || result.testKey === testKey);
  },
};

// Admin key storage (uploads/keys/)
export const keyStorage = {
  getFilePath: (keyName) => path.join(KEYS_DIR, `adminKey_${keyName}.json`),
  
  save: (keyData) => {
    ensureDirectories();
    const filename = `adminKey_${keyData.key || keyData.admin_key}.json`;
    return fileStorage.write(KEYS_DIR, filename, keyData);
  },

  load: (keyName) => {
    const filename = `adminKey_${keyName}.json`;
    return fileStorage.read(KEYS_DIR, filename);
  },

  getAll: () => {
    return fileStorage.readAll(KEYS_DIR);
  },
};

export { STUDENTS_DIR, TESTS_DIR, RESULTS_DIR, KEYS_DIR, UPLOADS_DIR };

