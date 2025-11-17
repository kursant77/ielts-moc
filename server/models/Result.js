import { v4 as uuidv4 } from 'uuid';
import { resultStorage } from '../utils/fileStorage.js';

// Result model using file-based storage
export class Result {
  static async findById(resultId) {
    return resultStorage.load(resultId);
  }

  static async findByTestKey(testKey) {
    return resultStorage.getByTestKey(testKey);
  }

  static async findByUser(userId) {
    return resultStorage.getByUser(userId);
  }

  static async findByTest(testId) {
    return resultStorage.getByTest(testId);
  }

  static async findByAdmin(adminId) {
    return resultStorage.getByAdmin(adminId);
  }

  static async getAll() {
    return resultStorage.getAll();
  }

  static async create(data) {
    const result = {
      id: uuidv4(),
      result_id: uuidv4(),
      user_id: data.userId || data.user_id,
      test_id: data.testId || data.test_id,
      test_key: data.testKey || data.test_key,
      admin_id: data.adminId || data.admin_id,
      student_name: data.studentName || data.student_name || '',
      scores: {
        listening: data.scores?.listening || 0,
        reading: data.scores?.reading || 0,
        writing: data.scores?.writing || 0,
        speaking: data.scores?.speaking || 0,
        overall: data.scores?.overall || 0,
      },
      answers: data.answers || {},
      started_at: data.startedAt || data.started_at || new Date().toISOString(),
      completed_at: data.completedAt || data.completed_at || null,
      submitted_at: data.submittedAt || data.submitted_at || null,
      duration: data.duration || 0,
      is_submitted: data.isSubmitted !== undefined ? data.isSubmitted : false,
      created_at: new Date().toISOString(),
    };

    resultStorage.save(result);
    return result;
  }

  static async update(resultId, data) {
    const result = await Result.findById(resultId);
    if (!result) {
      return null;
    }

    const updatedResult = {
      ...result,
      ...data,
      scores: data.scores ? { ...result.scores, ...data.scores } : result.scores,
    };

    resultStorage.save(updatedResult);
    return updatedResult;
  }

  static async delete(resultId) {
    return resultStorage.delete(resultId);
  }
}

