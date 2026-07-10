/**
 * useCommunicationData - smoke test.
 */
import { useCommunicationData } from '../../../../users/shopkeepers/communication/hooks/useCommunicationData';

describe('useCommunicationData', () => {
  it('is a valid hook', () => {
    expect(typeof useCommunicationData).toBe('function');
  });
});
