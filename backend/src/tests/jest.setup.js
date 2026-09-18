process.env.KAFKA_BROKERS = '';
process.env.REDIS_HOST = '';
process.env.MQTT_URL = '';
process.env.NODE_ENV = 'test';

// SECURITY NOTE: the auth rate limiter (5 req/15min per IP) is intentionally
// active in test runs — auth.test.js previously tripped it with rapid logins.
// Tests that exercise login more than 5 times must reset the limiter state
// between cases (see auth.test.js).