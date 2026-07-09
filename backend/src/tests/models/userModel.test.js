const UserModel = require('../../models/userModel');

jest.mock('../../storage/sqliteDatabase', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserById: jest.fn()
}));

const sqliteDatabase = require('../../storage/sqliteDatabase');

describe('User Model Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export UserModel', () => {
    expect(UserModel).toBeDefined();
    expect(typeof UserModel.create).toBe('function');
    expect(typeof UserModel.findByUsername).toBe('function');
    expect(typeof UserModel.findById).toBe('function');
  });

  describe('create', () => {
    test('should create a user with default role', async () => {
      sqliteDatabase.createUser.mockResolvedValue(1);

      const userData = { username: 'testuser', email: 'test@test.com', password: 'secret123' };
      const result = await UserModel.create(userData);

      expect(result).toEqual({ id: 1, username: 'testuser', email: 'test@test.com', password: 'secret123' });
      expect(sqliteDatabase.createUser).toHaveBeenCalledWith({
        username: 'testuser', email: 'test@test.com', password: 'secret123', role: 'user'
      });
    });

    test('should create a user with custom role', async () => {
      sqliteDatabase.createUser.mockResolvedValue(2);

      const userData = { username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin' };
      const result = await UserModel.create(userData);

      expect(result).toEqual({ id: 2, ...userData });
      expect(sqliteDatabase.createUser).toHaveBeenCalledWith({
        username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin'
      });
    });

    test('should throw when username is missing', async () => {
      await expect(UserModel.create({ email: 'test@test.com', password: 'secret' }))
        .rejects.toThrow('Username, email, and password are required');
    });

    test('should throw when email is missing', async () => {
      await expect(UserModel.create({ username: 'testuser', password: 'secret' }))
        .rejects.toThrow('Username, email, and password are required');
    });

    test('should throw when password is missing', async () => {
      await expect(UserModel.create({ username: 'testuser', email: 'test@test.com' }))
        .rejects.toThrow('Username, email, and password are required');
    });
  });

  describe('findByUsername', () => {
    test('should find user by username', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
      sqliteDatabase.findUserByUsername.mockResolvedValue(mockUser);

      const result = await UserModel.findByUsername('testuser');
      expect(result).toEqual(mockUser);
      expect(sqliteDatabase.findUserByUsername).toHaveBeenCalledWith('testuser');
    });

    test('should return null for non-existent username', async () => {
      sqliteDatabase.findUserByUsername.mockResolvedValue(null);

      const result = await UserModel.findByUsername('nobody');
      expect(result).toBeNull();
    });

    test('should throw when username is empty', async () => {
      await expect(UserModel.findByUsername('')).rejects.toThrow('Username is required');
    });

    test('should throw when username is null', async () => {
      await expect(UserModel.findByUsername(null)).rejects.toThrow('Username is required');
    });
  });

  describe('findById', () => {
    test('should find user by id', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
      sqliteDatabase.findUserById.mockResolvedValue(mockUser);

      const result = await UserModel.findById(1);
      expect(result).toEqual(mockUser);
      expect(sqliteDatabase.findUserById).toHaveBeenCalledWith(1);
    });

    test('should return null for non-existent id', async () => {
      sqliteDatabase.findUserById.mockResolvedValue(null);

      const result = await UserModel.findById(999);
      expect(result).toBeNull();
    });

    test('should throw when id is null', async () => {
      await expect(UserModel.findById(null)).rejects.toThrow('User ID is required');
    });

    test('should throw when id is undefined', async () => {
      await expect(UserModel.findById(undefined)).rejects.toThrow('User ID is required');
    });
  });
});
