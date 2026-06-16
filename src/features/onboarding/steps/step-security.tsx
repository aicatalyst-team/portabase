"use client";

import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { mockSsoConfig } from "@/features/onboarding/onboarding.mock";

export const StepSecurity = () => {
    const { next, updateContext, state } = useOnboarding();

    const choose = async (method: "passkey" | "two-factor") => {
        await updateContext({ flowData: { ...state?.context.flowData, security: { method } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Secure your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {mockSsoConfig.passkeyEnabled
                        ? "Set up a passkey for faster, safer sign-in."
                        : "Set up two-factor authentication to protect your account."}
                </p>
            </div>
            {mockSsoConfig.passkeyEnabled ? (
                <Button type="button" onClick={() => choose("passkey")}>
                    Set up passkey
                </Button>
            ) : (
                <Button type="button" onClick={() => choose("two-factor")}>
                    Set up two-factor
                </Button>
            )}
        </div>
    );
};
