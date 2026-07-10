/**
 * useInventoryData (wholesaler) - smoke test.
 */
import { useInventoryData } from '../../../../users/wholesalers/inventory/hooks/useInventoryData';

describe('useInventoryData (wholesaler)', () => {
  it('is a valid hook', () => {
    expect(typeof useInventoryData).toBe('function');
  });
});
