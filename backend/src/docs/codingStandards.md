# CSCM Backend Coding Standards

## Language and Framework

- **Language**: JavaScript (Node.js)
- **Framework**: Express.js
- **Testing**: Jest
- **Linting**: ESLint

## Code Style

### Naming Conventions

1. **Variables and Functions**: Use camelCase
   ```javascript
   const userName = 'john';
   function getUserData() { ... }
   ```

2. **Classes and Constructors**: Use PascalCase
   ```javascript
   class UserController { ... }
   ```

3. **Constants**: Use UPPER_SNAKE_CASE
   ```javascript
   const MAX_RETRY_ATTEMPTS = 3;
   ```

4. **Files**: Use camelCase for filenames
   ```
   userService.js
   kafkaClient.js
   ```

### Formatting

1. **Indentation**: Use 2 spaces (no tabs)
2. **Line Length**: Max 100 characters
3. **Semicolons**: Always use semicolons
4. **Quotes**: Use single quotes for strings

### Comments

1. **Function Comments**: Use JSDoc format
   ```javascript
   /**
    * Creates a new user account
    * @param {string} email - User's email address
    * @param {string} password - User's password
    * @returns {Promise<Object>} Created user object
    */
   async function createUser(email, password) { ... }
   ```

2. **Inline Comments**: Use for complex logic
   ```javascript
   // Calculate inventory turnover ratio
   const turnoverRatio = salesVolume / averageInventory;
   ```

## Project Structure

```
src/
├── api/          # REST API controllers and routes
├── config/       # Configuration files
├── gateway/      # API gateway configuration
├── messaging/    # Messaging clients (Kafka, MQTT)
├── agents/       # Agent orchestration logic
├── models/       # Data models and database interactions
├── services/     # Business logic services
├── utils/        # Utility functions
├── docs/         # Documentation
└── tests/        # Test files
```

## Error Handling

1. **Async/Await**: Always wrap in try/catch blocks
   ```javascript
   try {
     const result = await someAsyncOperation();
     res.json(result);
   } catch (error) {
     logger.error('Operation failed:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
   ```

2. **Custom Errors**: Create specific error classes for different error types
   ```javascript
   class ValidationError extends Error {
     constructor(message) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

## Security

1. **Input Validation**: Always validate and sanitize user input
2. **Authentication**: Use JWT tokens for authentication
3. **Authorization**: Implement role-based access control
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Logging**: Log security events and suspicious activities

## Testing

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Test Coverage**: Aim for >80% code coverage
3. **Mocking**: Use mocks for external dependencies
4. **Integration Tests**: Test critical workflows with real dependencies

## Documentation

1. **API Documentation**: Document all API endpoints with examples
2. **Code Documentation**: Use JSDoc for all public functions
3. **Architecture Documentation**: Keep architecture documents up to date
4. **README**: Maintain comprehensive README files

## Performance

1. **Database Queries**: Use indexes and optimize queries
2. **Caching**: Implement caching for frequently accessed data
3. **Async Operations**: Use async/await for non-blocking operations
4. **Memory Management**: Avoid memory leaks and monitor usage

## Version Control

1. **Commit Messages**: Use conventional commit format
   ```
   feat: add user authentication
   fix: resolve inventory calculation bug
   docs: update API documentation
   ```

2. **Branching**: Use feature branches for new development
3. **Pull Requests**: Require code reviews before merging
4. **Tags**: Use semantic versioning for releases