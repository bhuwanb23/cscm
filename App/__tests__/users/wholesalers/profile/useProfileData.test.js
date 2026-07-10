/**
 * useProfileData (wholesaler) - smoke test.
 */
import { useProfileData } from '../../../../users/wholesalers/profile/hooks/useProfileData';

describe('useProfileData (wholesaler)', () => {
  it('is a valid hook', () => {
    expect(typeof useProfileData).toBe('function');
  });
});
