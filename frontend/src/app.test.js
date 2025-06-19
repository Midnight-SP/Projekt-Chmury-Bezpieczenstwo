import '@testing-library/jest-dom';
import keycloak from './keycloak';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './app';

// Accept: "We recommend installing an extension to run jest tests."
jest.mock('./keycloak', () => ({
    __esModule: true,
    default: {
        init: jest.fn().mockResolvedValue(true),
        token: 'test-token',
        tokenParsed: { aud: 'frontend' }
    }
}));

describe('App component', () => {
    beforeEach(() => jest.clearAllMocks());

    it('calls keycloak.init with the correct config', () => {
        render(<App />);
        expect(keycloak.init).toHaveBeenCalledWith({
            onLoad: 'login-required',
            checkLoginIframe: false,
            pkceMethod: 'S256'
        });
    });

    it('shows loading screen initially', () => {
        keycloak.init.mockReturnValue(new Promise(() => {}));
        render(<App />);
        expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
    });

    it('removes loading screen after successful authentication', async () => {
        render(<App />);
        await waitFor(() => expect(screen.queryByText(/Ładowanie.../i)).toBeNull());
    });

    it('stays on loading screen if authentication fails', async () => {
        keycloak.init.mockResolvedValue(false);
        render(<App />);
        await waitFor(() => expect(keycloak.init).toHaveBeenCalled());
        expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
    });
});