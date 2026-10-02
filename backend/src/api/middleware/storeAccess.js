/**
 * Store-scoped object-level authorization (BOLA / IDOR guard).
 *
 * Authentication alone is not authorization: it proves WHO is calling, not
 * WHICH store they may act on. Without this guard any authenticated
 * shopkeeper could read (and mutate) every other store's orders and inventory
 * simply by changing the :storeId path segment.
 *
 * Ownership model (no DB migration required):
 *   - admins and transporters may act across stores — they are not store-bound.
 *   - shopkeepers and wholesalers are bound to the store encoded in their
 *     JWT subject. The token carries `storeId` when the app issues it; the
 *     legacy `shopkeeper_00N` / `wholesaler_00N` usernames map to STORE00N so
 *     existing issued tokens keep working.
 *
 * When a store cannot be determined for the caller we FAIL CLOSED. Silently
 * allowing the request is what produced the original finding.
 */

const ROLE_STORE_SCOPED = new Set(['shopkeeper', 'wholesaler']);

/**
 * Derive the store a user is bound to.
 * @param {Object} user - decoded JWT payload
 * @returns {string|null} store id, or null when not store-bound
 */
function storeIdForUser(user) {
  if (!user) return null;

  // Preferred: explicit claim minted by the issuing flow.
  if (typeof user.storeId === 'string' && user.storeId.trim()) {
    return user.storeId.trim();
  }
  if (user.store_id) return String(user.store_id);

  // Fallback: legacy username convention, e.g. shopkeeper_003 -> STORE003.
  if (typeof user.username === 'string') {
    const match = /^(?:shopkeeper|wholesaler)_0*(\d+)$/i.exec(user.username);
    if (match) return `STORE${match[1].padStart(3, '0')}`;
  }

  return null;
}

/**
 * Express middleware factory. Enforces that the caller may act on :storeId.
 * Unauthenticated requests are rejected here too so the guard is safe to
 * mount even if a route forgets `authenticate`.
 */
function requireStoreAccess(options = {}) {
  const paramName = options.paramName || 'storeId';
  // Writes are the dangerous case; reads default to the same rule so the
  // guard cannot be bypassed by switching verbs.
  const requireOwnership = options.requireOwnership !== false;

  return function storeAccess(req, res, next) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No user authenticated.',
      });
    }

    // Cross-store roles.
    if (user.role === 'admin' || user.role === 'transporter') {
      return next();
    }

    if (!ROLE_STORE_SCOPED.has(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
    }

    const requested =
      (req.params && req.params[paramName]) ||
      (req.body && req.body[paramName]) ||
      (req.query && req.query[paramName]);

    if (!requested) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required',
      });
    }

    if (!requireOwnership) return next();

    const owned = storeIdForUser(user);
    if (!owned) {
      // Fail closed: a store-scoped role with no resolvable store must not
      // be handed another store's data.
      return res.status(403).json({
        success: false,
        error:
          'Access denied. This account is not associated with a store. ' +
          'Re-authenticate or contact an administrator.',
      });
    }

    if (String(requested).toUpperCase() !== owned.toUpperCase()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You may only access your own store.',
      });
    }

    return next();
  };
}

module.exports = { requireStoreAccess, storeIdForUser };
