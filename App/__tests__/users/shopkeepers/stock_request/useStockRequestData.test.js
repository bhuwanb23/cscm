/**
 * useStockRequestData - smoke test.
 */
import { useStockRequestData } from '../../../../users/shopkeepers/stock_request/hooks/useStockRequestData';

describe('useStockRequestData', () => {
  it('is a valid hook', () => {
    expect(typeof useStockRequestData).toBe('function');
  });
});
