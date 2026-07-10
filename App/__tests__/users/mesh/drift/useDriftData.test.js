/**
 * useDriftData - smoke test.
 */
import { useDriftData } from '../../../../users/mesh/drift/hooks/useDriftData';

describe('useDriftData', () => {
  it('is a valid hook', () => {
    expect(typeof useDriftData).toBe('function');
  });
});
