"use client";

import { useOnboarding } from "@onboardjs/react";
import { Globe } from "lucide-react";
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
                    <button
                        key={provider.id}
                        type="button"
                        onClick={() => chooseProvider(provider.id)}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                    >
                        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                            <Globe className="size-4 text-muted-foreground" />
                        </div>
                        <span>Continue with {provider.label}</span>
                    </button>
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
