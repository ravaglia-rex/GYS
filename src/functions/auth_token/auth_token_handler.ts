import { auth } from '../../firebase/firebase';

interface AuthTokenState {
    authToken: string | null;
    createdAt: Date | null;
}

class AuthTokenHandler {
    private static instance: AuthTokenHandler;
    private tokenRefreshPromise: Promise<string | null> | null = null;
    private readonly TOKEN_EXPIRY_MINUTES = 60;
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

    private async refreshToken(): Promise<string | null> {
        if (this.tokenRefreshPromise) {
            return this.tokenRefreshPromise;
        }

        this.tokenRefreshPromise = (async () => {
            const user = auth.currentUser;
            if (!user) {
                return null;
            }

            try {
                const token = await user.getIdToken(true);
                this.setState({
                    authToken: token,
                    createdAt: new Date()
                });
                return token;
            } catch (error) {
                throw new Error("Failed to refresh token");
            } finally {
                this.tokenRefreshPromise = null;
            }
        })();

        return this.tokenRefreshPromise;
    }

    private async isTokenValid(): Promise<boolean> {
        const { authToken, createdAt } = this.state;
        if (!authToken || !createdAt) {
            return false;
        }

        const now = new Date();
        const diff = now.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diff / 1000 / 60);

        return diffInMinutes <= this.TOKEN_EXPIRY_MINUTES;
    }

    public async getAuthToken(): Promise<string | null> {
        const isValid = await this.isTokenValid();
        
        if (isValid) {
            return this.state.authToken;
        }

        return await this.refreshToken();
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
        } catch (error) {
            throw new Error("Failed to set auth token");
        }
    }
}

// Create a pre-instantiated instance
const authTokenHandler = AuthTokenHandler.getInstance();

export default authTokenHandler;
