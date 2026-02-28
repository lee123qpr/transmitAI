import React from 'react';

const mockUser = {
    id: 'test_user_123',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    primaryEmailAddress: { emailAddress: 'leekilcoyne1@gmail.com' },
    imageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
};

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <div data-testid="clerk-provider-mock">
            {children}
        </div>
    );
};

export const SignedIn = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignedOut = (_props: { children: React.ReactNode }) => null;
export const RedirectToSignIn = () => <div>Mock Redirect to Sign In</div>;

interface MockButtonProps {
    children: React.ReactNode;
    mode?: string;
    forceRedirectUrl?: string;
    afterSignInUrl?: string;
    afterSignUpUrl?: string;
}

export const SignInButton = ({ children }: MockButtonProps) => <div data-testid="signin-button-mock">{children}</div>;
export const SignUpButton = ({ children }: MockButtonProps) => <div data-testid="signup-button-mock">{children}</div>;

export const UserButton = (_props: { afterSignOutUrl?: string }) => <div data-testid="user-button-mock">Mock Profile</div>;
UserButton.MenuItems = ({ children }: { children: React.ReactNode }) => <>{children}</>;
UserButton.Action = (_props: { label: string; labelIcon?: React.ReactNode; onClick?: () => void }) => null;
UserButton.UserProfilePage = ({ children }: { children: React.ReactNode; label: string; labelIcon?: React.ReactNode; url: string }) => <>{children}</>;

export const useUser = () => ({
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
});

export const useAuth = () => ({
    getToken: async () => 'mock-token',
    userId: 'test_user_123',
    isSignedIn: true,
    signOut: async () => console.log('Mock Sign Out'),
});
