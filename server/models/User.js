import { v4 as uuidv4 } from 'uuid';
import { userStorage } from '../utils/fileStorage.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// Enhanced User model using file-based storage
export class User {
  static async findById(id) {
    return userStorage.load(id);
  }

  static async findByEmail(email) {
    const users = userStorage.getAll();
    return users.find(u => u.email === email || u.login === email) || null;
  }

  static async findByLogin(login) {
    const users = userStorage.getAll();
    return users.find(u => u.login === login || u.email === login) || null;
  }

  static async getAll() {
    return userStorage.getAll();
  }

  static async search(predicate) {
    return userStorage.search(predicate);
  }

  static async create(data) {
    const loginOrEmail = data.login || data.email;
    const existing = await User.findByEmail(loginOrEmail) || await User.findByLogin(loginOrEmail);
    if (existing) {
      throw new Error('User with this login already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = {
      id: uuidv4(),
      full_name: data.fullName || data.full_name || '',
      email: data.email || data.login || '',
      login: data.login || data.email || '',
      phone: data.phone || '',
      password_hash: hashedPassword,
      role: data.role || 'user',
      registration_date: new Date().toISOString(),
      last_login: null,
      status: 'active',
      used_test_keys: [],
    };
    
    userStorage.save(user);
    return user;
  }

  static async update(id, data) {
    const user = await User.findById(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...data,
      // Preserve password hash if password is not being updated
      password_hash: data.password ? await hashPassword(data.password) : user.password_hash,
    };

    userStorage.save(updatedUser);
    return updatedUser;
  }

  static async updateLastLogin(id) {
    const user = await User.findById(id);
    if (user) {
      user.last_login = new Date().toISOString();
      userStorage.save(user);
    }
  }

  static async addTestKey(userId, testKey) {
    const user = await User.findById(userId);
    if (user) {
      if (!user.used_test_keys) {
        user.used_test_keys = [];
      }
      if (!user.used_test_keys.includes(testKey)) {
        user.used_test_keys.push(testKey);
        userStorage.save(user);
      }
    }
    return user;
  }

  static async verifyPassword(user, password) {
    return comparePassword(password, user.password_hash || user.password);
  }

  static async delete(id) {
    return userStorage.delete(id);
  }

  static async getUsersByTestKeys(testKeys) {
    const allUsers = userStorage.getAll();
    return allUsers.filter(user => {
      if (!user.used_test_keys || !Array.isArray(user.used_test_keys)) {
        return false;
      }
      return user.used_test_keys.some(key => testKeys.includes(key));
    });
  }
}

