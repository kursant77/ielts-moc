import api from '../utils/api';

export const studentApi = {
  login: (email, password) => api.post('/student/login', { email, password }),
  register: (data) => api.post('/student/register', data),
  accessTest: (testKey, fullName, studentId = null) => api.post('/student/access', { testKey, fullName, studentId }),
  getTest: () => api.get('/student/test'),
  getAttempt: () => api.get('/student/attempt'),
  saveReadingAnswers: (answers) => api.post('/student/answers/reading', { answers }),
  saveListeningAnswers: (answers) => api.post('/student/answers/listening', { answers }),
  saveWriting: (content) => api.post('/student/answers/writing', { content }),
  saveHighlights: (highlights) => api.post('/student/highlights', { highlights }),
  submitTest: () => api.post('/student/submit'),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getStats: () => api.get('/student/stats'),
  getAttempts: () => api.get('/student/attempts'),
  getTests: () => api.get('/student/tests'),
  getAllTests: () => api.get('/student/all-tests'),
  joinTest: (testKey) => api.post('/student/join-test', { testKey }),
  checkTestStatus: (testKey) => api.get(`/student/test-status/${testKey}`),
};
