/**
 * useInventoryData - smoke test.
 */
import { useInventoryData } from '../../../../users/shopkeepers/inventory/hooks/useInventoryData';

describe('useInventoryData', () => {
  it('is a valid hook', () => {
    expect(typeof useInventoryData).toBe('function');
  });
});
