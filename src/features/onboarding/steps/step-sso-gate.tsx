"use client";

import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { mockSsoConfig } from "@/features/onboarding/onboarding.mock";

export const StepSsoGate = () => {
    const { next, updateContext, state } = useOnboarding();

    const chooseProvider = async (providerId: string) => {
        await updateContext({ flowData: { ...state?.context.flowData, sso: { providerId } } });
        await next();
    };

    const continueWithEmail = async () => {
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Welcome to Portabase</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Sign in with your organisation provider, or continue with email.
                </p>
            </div>
            <div className="flex flex-col gap-2">
                {mockSsoConfig.providers.map((provider) => (
                    <Button key={provider.id} variant="outline" type="button" onClick={() => chooseProvider(provider.id)}>
                        Continue with {provider.label}
                    </Button>
                ))}
            </div>
            {!mockSsoConfig.forced && (
                <Button type="button" onClick={continueWithEmail}>
                    Continue with email
                </Button>
            )}
        </div>
    );
};
