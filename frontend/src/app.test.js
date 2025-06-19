// Accept: "We recommend installing an extension to run jest tests."
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './app';
import keycloak from './keycloak';

jest.mock('./keycloak', () => ({
    __esModule: true,
    default: {
        init: jest.fn().mockResolvedValue(true),
        token: 'test-token',
        tokenParsed: { aud: 'frontend' }
    }
}));

describe('App component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls keycloak.init with the correct config', () => {
        render(<App />);
        expect(keycloak.init).toHaveBeenCalledWith({
            onLoad: 'login-required',
            checkLoginIframe: false,
            pkceMethod: 'S256'
        });
    });

    it('shows loading screen initially', () => {
        // make init never resolve to simulate the loading state
        keycloak.init.mockReturnValue(new Promise(() => {}));
        render(<App />);
        expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
    });

    it('removes loading screen after successful authentication', async () => {
        render(<App />);
        // wait until the loading text disappears
        await waitFor(() => {
            expect(screen.queryByText(/Ładowanie.../i)).toBeNull();
        });
    });

    it('stays on loading screen if authentication fails', async () => {
        keycloak.init.mockResolvedValue(false);
        render(<App />);
        // wait for init to be called and state to settle
        await waitFor(() => expect(keycloak.init).toHaveBeenCalled());
        expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
    });
});