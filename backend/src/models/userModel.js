const sqliteDatabase = require('../storage/sqliteDatabase');

class UserModel {
  static async create(userData) {
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('Username, email, and password are required');
    }
    const id = await sqliteDatabase.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user'
    });
    return { id, ...userData };
  }

  static async findByUsername(username) {
    if (!username) throw new Error('Username is required');
    return sqliteDatabase.findUserByUsername(username);
  }

  static async findById(id) {
    if (!id) throw new Error('User ID is required');
    return sqliteDatabase.findUserById(id);
  }
}

module.exports = UserModel;
