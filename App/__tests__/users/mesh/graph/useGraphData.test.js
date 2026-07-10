/**
 * useGraphData - smoke test.
 */
import { useGraphData } from '../../../../users/mesh/graph/hooks/useGraphData';

describe('useGraphData', () => {
  it('is a valid hook', () => {
    expect(typeof useGraphData).toBe('function');
  });
});
