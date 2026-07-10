/**
 * ApiProvider - smoke test (exports and API).
 */
import { ApiProvider, ApiHealthGate, useApiHealth, HEALTH_STATES } from '../../../src/api/ApiProvider';

describe('ApiProvider exports', () => {
  it('exports ApiProvider', () => {
    expect(typeof ApiProvider).toBe('function');
  });

  it('exports ApiHealthGate', () => {
    expect(typeof ApiHealthGate).toBe('function');
  });

  it('exports useApiHealth', () => {
    expect(typeof useApiHealth).toBe('function');
  });

  it('exports HEALTH_STATES', () => {
    expect(HEALTH_STATES.CHECKING).toBe('checking');
    expect(HEALTH_STATES.HEALTHY).toBe('healthy');
    expect(HEALTH_STATES.UNHEALTHY).toBe('unhealthy');
  });
});
