import { auth } from '../../firebase/firebase';

interface AuthTokenState {
    authToken: string | null;
    createdAt: Date | null;
}

class AuthTokenHandler {
    private static instance: AuthTokenHandler;
    private tokenRefreshPromise: Promise<string | null> | null = null;
    private tokenRefreshForced = false;
    private state: AuthTokenState = {
        authToken: null,
        createdAt: null
    };

    private constructor() {
        // Private constructor to prevent direct construction calls with 'new'
    }

    public static getInstance(): AuthTokenHandler {
        if (!AuthTokenHandler.instance) {
            AuthTokenHandler.instance = new AuthTokenHandler();
        }
        return AuthTokenHandler.instance;
    }

    private setState(newState: Partial<AuthTokenState>) {
        this.state = {
            ...this.state,
            ...newState
        };
    }

    /**
     * Ask Firebase Auth for an ID token. The SDK returns a cached token when still valid
     * and refreshes when expired / near expiry (or always when forceRefresh is true).
     */
    private async fetchFromFirebase(forceRefresh: boolean): Promise<string | null> {
        // Reuse an in-flight fetch unless caller needs a forced refresh and the in-flight one isn't forced.
        if (this.tokenRefreshPromise && (!forceRefresh || this.tokenRefreshForced)) {
            return this.tokenRefreshPromise;
        }

        this.tokenRefreshForced = forceRefresh;
        this.tokenRefreshPromise = (async () => {
            const user = auth.currentUser;
            if (!user) {
                this.clearToken();
                return null;
            }

            try {
                const token = await user.getIdToken(forceRefresh);
                this.setState({
                    authToken: token,
                    createdAt: new Date()
                });
                return token;
            } catch {
                this.clearToken();
                return null;
            } finally {
                this.tokenRefreshPromise = null;
                this.tokenRefreshForced = false;
            }
        })();

        return this.tokenRefreshPromise;
    }

    public async getAuthToken(forceRefresh = false): Promise<string | null> {
        // Always go through Firebase Auth so we never send a locally-cached expired JWT.
        // getIdToken(false) is cheap when the SDK cache is still valid.
        return await this.fetchFromFirebase(forceRefresh);
    }

    public async isAuthenticated(): Promise<boolean> {
        const token = await this.getAuthToken();
        return token !== null;
    }

    public clearToken(): void {
        this.setState({
            authToken: null,
            createdAt: null
        });
    }

    public getState(): AuthTokenState {
        return { ...this.state }; // Return copy to prevent direct mutations
    }

    public setAuthToken(token: string): void {
        try {
            const createdAt = new Date();
            this.setState({
                authToken: token,
                createdAt
            });
        } catch {
            throw new Error("Failed to set auth token");
        }
    }
}

// Create a pre-instantiated instance
const authTokenHandler = AuthTokenHandler.getInstance();

export default authTokenHandler;
