/**
 * useShipmentData - smoke test.
 */
import { useShipmentData } from '../../../../users/shopkeepers/shipment/hooks/useShipmentData';

describe('useShipmentData', () => {
  it('is a valid hook', () => {
    expect(typeof useShipmentData).toBe('function');
  });
});
