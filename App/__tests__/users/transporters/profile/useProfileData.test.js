/**
 * useProfileData (transporter) - smoke test.
 */
import { useProfileData } from '../../../../users/transporters/profile/hooks/useProfileData';

describe('useProfileData (transporter)', () => {
  it('is a valid hook', () => {
    expect(typeof useProfileData).toBe('function');
  });
});
