import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './app';

jest.mock('./keycloak', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(true),
    token: 'test-token',
    tokenParsed: { aud: 'frontend' }
  }
}));

test('pokazuje ekran ładowania', () => {
  render(<App />);
  expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
});