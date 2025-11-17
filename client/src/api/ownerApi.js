import api from '../utils/api';

export const ownerApi = {
  login: (login, password) => api.post('/owner/login', { login, password }),
  getAdmins: () => api.get('/owner/admins'),
  createAdmin: (data) => api.post('/owner/admins', data),
  updateAdmin: (id, data) => api.put(`/owner/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/owner/admins/${id}`),
  resetAdminPassword: (id, newPassword) => api.post(`/owner/admins/${id}/reset-password`, { newPassword }),
  activateAdmin: (id, isActive) => api.patch(`/owner/admins/${id}/activate`, { isActive }),
  getAdminStats: (id) => api.get(`/owner/admins/${id}/stats`),
  getSystemStats: () => api.get('/owner/stats'),
  getStudents: () => api.get('/owner/students'),
  getAllUsers: () => api.get('/owner/users'), // File-based storage - all registered students
  getUserById: (id) => api.get(`/owner/user/${id}`),
  getUserResults: (id) => api.get(`/owner/user-tests/${id}`),
  getAllResults: () => api.get('/owner/all-results'),
  updateUserStatus: (id, status) => api.patch(`/owner/user/${id}/status`, { status }),
  resetUserPassword: (id, newPassword) => api.post(`/owner/user/${id}/reset-password`, { newPassword }),
  getTests: () => api.get('/owner/tests'),
  getAttempts: () => api.get('/owner/attempts'),
};
