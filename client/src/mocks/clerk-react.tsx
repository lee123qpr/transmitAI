/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

// Mock User Data
const mockUser = {
    id: 'test_user_123',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    imageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
};

type UserContextType = {
    user: typeof mockUser;
    isLoaded: boolean;
    isSignedIn: boolean;
};

// Context
const UserContext = createContext<UserContextType | null>(null);

// Provider
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
    const value = React.useMemo(() => ({ user: mockUser, isLoaded: true, isSignedIn: true }), []);
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// Hooks
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) return { user: null, isLoaded: false, isSignedIn: false };
    return context;
};

export const useClerk = () => {
    return React.useMemo(() => ({
        signOut: () => console.log('Mock signOut called'),
        openSignIn: () => console.log('Mock openSignIn called'),
    }), []);
};

export const useAuth = () => {
    const getToken = React.useCallback(async () => 'mock_token', []);
    return React.useMemo(() => ({
        userId: mockUser.id,
        sessionId: 'mock_session',
        getToken
    }), [getToken]);
};

// Components
export const SignedIn = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignedOut = () => null;
export const RedirectToSignIn = () => <div>Redirecting to Sign In...</div>;
export const SignInButton = () => <button>Sign In</button>;
export const SignUpButton = () => <button>Sign Up</button>;
export const UserButton = () => <button className="text-xs font-mono text-slate-400">Mock Profile (E2E)</button>;
