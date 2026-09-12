const database = require('../storage/database');

class UserModel {
  static async create(userData) {
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('Username, email, and password are required');
    }
    const db = database.getDatabase();
    const id = await db.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
    });
    return { id, ...userData };
  }

  static async findByUsername(username) {
    if (!username) throw new Error('Username is required');
    const db = database.getDatabase();
    return db.findUserByUsername(username);
  }

  static async findById(id) {
    if (!id) throw new Error('User ID is required');
    const db = database.getDatabase();
    return db.findUserById(id);
  }
}

module.exports = UserModel;
