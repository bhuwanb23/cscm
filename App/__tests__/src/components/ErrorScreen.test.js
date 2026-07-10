/**
 * ErrorScreen - smoke test.
 */
import React from 'react';
import { ErrorScreen } from '../../../src/components/ErrorScreen';

describe('ErrorScreen', () => {
  it('is a valid React component', () => {
    expect(typeof ErrorScreen).toBe('function');
  });

  it('has expected props', () => {
    expect(ErrorScreen.toString()).toContain('onRetry');
  });
});
