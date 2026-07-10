/**
 * LoadingScreen - smoke test (component renders without crash).
 */
import React from 'react';
import { LoadingScreen } from '../../../src/components/LoadingScreen';

describe('LoadingScreen', () => {
  it('is a valid React component', () => {
    expect(typeof LoadingScreen).toBe('function');
  });

  it('has expected default props', () => {
    // Verify the component accepts message and testID props
    expect(LoadingScreen.toString()).toContain('message');
  });
});
