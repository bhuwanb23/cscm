/**
 * useNetworkData - smoke test.
 */
import { useNetworkData } from '../../../../users/mesh/network/hooks/useNetworkData';

describe('useNetworkData', () => {
  it('is a valid hook', () => {
    expect(typeof useNetworkData).toBe('function');
  });
});
