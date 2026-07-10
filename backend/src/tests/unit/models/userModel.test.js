/**
 * Unit tests for user model.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserById: jest.fn(),
}));

const UserModel = require('../../../models/userModel');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

describe('UserModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create user', async () => {
      sqliteDatabase.createUser.mockResolvedValue(1);
      const result = await UserModel.create({ username: 'u', email: 'e@e.com', password: 'p' });
      expect(result.id).toBe(1);
      expect(result.username).toBe('u');
    });

    it('should throw without required fields', async () => {
      await expect(UserModel.create({})).rejects.toThrow('required');
    });
  });

  describe('findByUsername', () => {
    it('should return user', async () => {
      sqliteDatabase.findUserByUsername.mockResolvedValue({ id: 1, username: 'u' });
      const user = await UserModel.findByUsername('u');
      expect(user.username).toBe('u');
    });

    it('should throw without username', async () => {
      await expect(UserModel.findByUsername(null)).rejects.toThrow('required');
    });
  });

  describe('findById', () => {
    it('should return user', async () => {
      sqliteDatabase.findUserById.mockResolvedValue({ id: 1, username: 'u' });
      const user = await UserModel.findById(1);
      expect(user.id).toBe(1);
    });

    it('should throw without id', async () => {
      await expect(UserModel.findById(null)).rejects.toThrow('required');
    });
  });
});
