/**
 * useAnalysis - smoke test.
 */
import { useAnalysis } from '../../../../users/shopkeepers/analysis/hooks/useAnalysis';

describe('useAnalysis', () => {
  it('is a valid hook', () => {
    expect(typeof useAnalysis).toBe('function');
  });
});
