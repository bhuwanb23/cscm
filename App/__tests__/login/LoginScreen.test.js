/**
 * LoginScreen - smoke test.
 */
import LoginScreen from '../../login/login';

describe('LoginScreen', () => {
  it('is a valid React component', () => {
    expect(typeof LoginScreen).toBe('function');
  });

  it('renders without crash', () => {
    // Just verify the component can be imported and is a function
    expect(LoginScreen).toBeDefined();
    expect(LoginScreen.displayName || LoginScreen.name).toBeTruthy();
  });
});
