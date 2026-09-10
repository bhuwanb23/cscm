/**
 * Authorization Middleware for Gateway
 * Provides role-based access control (RBAC)
 */

const logger = require('../../utils/logger');

// Role permissions
const ROLE_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'admin'],
  shopkeeper: ['read', 'write'],
  transporter: ['read', 'write'],
  wholesaler: ['read', 'write'],
  service: ['read', 'write', 'delete']
};

// Route permissions
const ROUTE_PERMISSIONS = {
  // Admin only routes
  '/api/v1/admin': ['admin'],
  '/api/v1/users': ['admin'],
  
  // All authenticated users
  '/api/v1/inventory': ['admin', 'shopkeeper', 'wholesaler', 'service'],
  '/api/v1/orders': ['admin', 'shopkeeper', 'wholesaler', 'service'],
  '/api/v1/shipments': ['admin', 'transporter', 'service'],
  
  // Read-only for most users
  '/api/v1/events': ['admin', 'shopkeeper', 'transporter', 'wholesaler', 'service'],
  
  // AI/ML routes - service only
  '/api/v1/demand': ['admin', 'service'],
  '/api/v1/inventory/optimize': ['admin', 'service'],
  '/api/v1/routing': ['admin', 'service'],
  '/api/v1/supplier': ['admin', 'service'],
  '/api/v1/anomaly': ['admin', 'service'],
  
  // Public routes (no auth required)
  '/health': [],
  '/metrics': []
};

/**
 * Check if user has required permission
 */
function hasPermission(userRole, requiredPermission) {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has required role
 */
function hasRole(userRole, requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  return requiredRoles.includes(userRole);
}

/**
 * Check route permissions
 */
function checkRoutePermission(path, userRole) {
  // Find matching route permission
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route)) {
      return hasRole(userRole, allowedRoles);
    }
  }
  
  // Default: allow all authenticated users
  return true;
}

/**
 * Authorization middleware
 */
function authorize(requiredPermission = null) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'service';

    // Check route-based permissions
    if (!checkRoutePermission(req.path, userRole)) {
      logger.warn(`Authorization failed for ${userRole} on ${req.path}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this resource'
      });
    }

    // Check specific permission if required
    if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
      logger.warn(`Permission ${requiredPermission} denied for ${userRole}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${requiredPermission}' required`
      });
    }

    next();
  };
}

/**
 * Role-based authorization middleware
 */
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'service';

    if (!hasRole(userRole, allowedRoles)) {
      logger.warn(`Role authorization failed for ${userRole} on ${req.path}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${userRole}' not authorized for this resource`
      });
    }

    next();
  };
}

/**
 * Admin-only authorization
 */
function authorizeAdmin(req, res, next) {
  return authorizeRole('admin')(req, res, next);
}

/**
 * Service-only authorization
 */
function authorizeService(req, res, next) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (req.user.type !== 'service') {
      logger.warn(`Service authorization failed for ${req.user.type} on ${req.path}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Service-only endpoint'
      });
    }

    next();
  };
}

module.exports = {
  authorize,
  authorizeRole,
  authorizeAdmin,
  authorizeService,
  hasPermission,
  hasRole,
  checkRoutePermission
};
