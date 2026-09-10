/**
 * Query Builder Utilities
 * Shared database query building functions for consistent database operations
 */

/**
 * Build SELECT query with filters
 * @param {string} table - Table name
 * @param {Object} filters - Filter conditions
 * @param {Object} options - Query options (orderBy, limit, offset)
 * @returns {Object} Query object with SQL and parameters
 */
function buildSelectQuery(table, filters = {}, options = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Build WHERE clause
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  // Build ORDER BY clause
  let orderBy = options.orderBy || 'id';
  let orderDirection = options.orderDirection || 'ASC';
  
  // Build LIMIT and OFFSET
  let limit = options.limit;
  let offset = options.offset;
  
  // Construct SQL
  let sql = `SELECT * FROM ${table}`;
  
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  sql += ` ORDER BY ${orderBy} ${orderDirection}`;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  if (offset) {
    sql += ` OFFSET ${offset}`;
  }
  
  return { sql, params };
}

/**
 * Build INSERT query
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Object} Query object with SQL and parameters
 */
function buildInsertQuery(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  return { sql, params: values };
}

/**
 * Build UPDATE query
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} filters - Filter conditions
 * @returns {Object} Query object with SQL and parameters
 */
function buildUpdateQuery(table, data, filters) {
  const setClauses = [];
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;
  
  // Build SET clause
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  // Build WHERE clause
  for (const [key, value] of Object.entries(filters)) {
    whereClauses.push(`${key} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }
  
  const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
  
  return { sql, params };
}

/**
 * Build DELETE query
 * @param {string} table - Table name
 * @param {Object} filters - Filter conditions
 * @returns {Object} Query object with SQL and parameters
 */
function buildDeleteQuery(table, filters) {
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(filters)) {
    whereClauses.push(`${key} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }
  
  const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`;
  
  return { sql, params };
}

/**
 * Build COUNT query
 * @param {string} table - Table name
 * @param {Object} filters - Filter conditions
 * @returns {Object} Query object with SQL and parameters
 */
function buildCountQuery(table, filters = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  return { sql, params };
}

/**
 * Build JOIN query
 * @param {string} table - Main table
 * @param {Array<Object>} joins - Join configurations
 * @param {Object} filters - Filter conditions
 * @param {Object} options - Query options
 * @returns {Object} Query object with SQL and parameters
 */
function buildJoinQuery(table, joins, filters = {}, options = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Build JOIN clauses
  const joinClauses = joins.map(join => {
    const joinType = join.type || 'INNER';
    const joinTable = join.table;
    const joinCondition = join.on;
    return `${joinType} JOIN ${joinTable} ON ${joinCondition}`;
  });
  
  // Build WHERE clause
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  // Build ORDER BY clause
  let orderBy = options.orderBy || `${table}.id`;
  let orderDirection = options.orderDirection || 'ASC';
  
  // Build LIMIT and OFFSET
  let limit = options.limit;
  let offset = options.offset;
  
  // Construct SQL
  let sql = `SELECT * FROM ${table}`;
  
  if (joinClauses.length > 0) {
    sql += ` ${joinClauses.join(' ')}`;
  }
  
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  sql += ` ORDER BY ${orderBy} ${orderDirection}`;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  if (offset) {
    sql += ` OFFSET ${offset}`;
  }
  
  return { sql, params };
}

/**
 * Build batch INSERT query
 * @param {string} table - Table name
 * @param {Array<Object>} dataArray - Array of data objects to insert
 * @returns {Object} Query object with SQL and parameters
 */
function buildBatchInsertQuery(table, dataArray) {
  if (dataArray.length === 0) {
    throw new Error('Cannot build batch insert query with empty data array');
  }
  
  const columns = Object.keys(dataArray[0]);
  const allValues = [];
  const valueGroups = [];
  
  for (const data of dataArray) {
    const values = columns.map(col => data[col]);
    allValues.push(...values);
    const placeholders = values.map((_, index) => `$${valueGroups.length * columns.length + index + 1}`);
    valueGroups.push(`(${placeholders.join(', ')})`);
  }
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueGroups.join(', ')}`;
  
  return { sql, params: allValues };
}

/**
 * Build UPSERT query (INSERT or UPDATE)
 * @param {string} table - Table name
 * @param {Object} data - Data to upsert
 * @param {Object} conflictColumns - Columns that define uniqueness
 * @returns {Object} Query object with SQL and parameters
 */
function buildUpsertQuery(table, data, conflictColumns) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  
  const conflictColumnNames = Array.isArray(conflictColumns) 
    ? conflictColumns 
    : [conflictColumns];
  
  const updateSet = columns
    .filter(col => !conflictColumnNames.includes(col))
    .map(col => `${col} = EXCLUDED.${col}`)
    .join(', ');
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) 
               ON CONFLICT (${conflictColumnNames.join(', ')}) 
               DO UPDATE SET ${updateSet} 
               RETURNING *`;
  
  return { sql, params: values };
}

/**
 * Sanitize column name to prevent SQL injection
 * @param {string} column - Column name
 * @returns {string} Sanitized column name
 */
function sanitizeColumnName(column) {
  // Only allow alphanumeric characters and underscores
  return column.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Validate table name
 * @param {string} table - Table name
 * @returns {boolean} True if table name is valid
 */
function validateTableName(table) {
  // Only allow alphanumeric characters and underscores
  return /^[a-zA-Z0-9_]+$/.test(table);
}

module.exports = {
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildCountQuery,
  buildJoinQuery,
  buildBatchInsertQuery,
  buildUpsertQuery,
  sanitizeColumnName,
  validateTableName
};