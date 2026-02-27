import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:3000', // Assuming backend is on port 3000
});

export const {
    signIn,
    signOut,
    signUp,
    useSession
} = authClient;
