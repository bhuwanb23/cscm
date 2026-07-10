/**
 * useShipmentsData (wholesaler) - smoke test.
 */
import { useShipmentsData } from '../../../../users/wholesalers/shipments/hooks/useShipmentsData';

describe('useShipmentsData', () => {
  it('is a valid hook', () => {
    expect(typeof useShipmentsData).toBe('function');
  });
});
