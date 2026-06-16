import { OnboardingMockDatabase, OnboardingSsoConfig } from '@/features/onboarding/onboarding.types';

export const mockSsoConfig: OnboardingSsoConfig = {
    providers: [
        { id: 'google', label: 'Google' },
        { id: 'github', label: 'GitHub' },
    ],
    forced: false,
    passkeyEnabled: true,
};

export const mockDatabases: OnboardingMockDatabase[] = [
    { id: 'db-primary', name: 'primary', engine: 'postgres' },
    { id: 'db-analytics', name: 'analytics', engine: 'postgres' },
];

export function simulateAgentPing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 2000));
}
