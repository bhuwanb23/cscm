process.env.KAFKA_BROKERS = '';
process.env.REDIS_HOST = '';
process.env.MQTT_URL = '';
process.env.NODE_ENV = 'test';

// Pin the database to SQLite for the test run.
//
// api/server.js calls dotenv.config() at require time, so an ambient backend/.env
// leaks into every suite. A developer .env points at the live Render Postgres,
// which made the auth/orders/inventory/shipments suites attempt real network
// connections and fail with "Connection terminated due to connection timeout"
// - locally only, because .env is gitignored and CI never had one. The unit
// tests exercise handlers and models, not the production database, so SQLite
// (the documented default) is what they should run against.
process.env.DATABASE_TYPE = 'sqlite';
process.env.DATABASE_URL = '';

// SECURITY NOTE: the auth rate limiter (5 req/15min per IP) is intentionally
// active in test runs — auth.test.js previously tripped it with rapid logins.
// Tests that exercise login more than 5 times must reset the limiter state
// between cases (see auth.test.js).