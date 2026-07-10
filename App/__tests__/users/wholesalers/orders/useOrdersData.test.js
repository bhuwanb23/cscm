/**
 * useOrdersData (wholesaler) - smoke test.
 */
import { useOrdersData } from '../../../../users/wholesalers/orders/hooks/useOrdersData';

describe('useOrdersData', () => {
  it('is a valid hook', () => {
    expect(typeof useOrdersData).toBe('function');
  });
});
