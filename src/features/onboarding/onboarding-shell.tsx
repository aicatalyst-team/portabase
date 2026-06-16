"use client";

import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/features/onboarding/onboarding-stepper";
import { OnboardingPreview } from "@/features/onboarding/onboarding-preview";

export const OnboardingShell = () => {
    const { state, previous, skip, renderStep } = useOnboarding();

    if (!state) return null;

    const showSplit = state.currentStep?.id !== "agent-waiting" && state.currentStep?.id !== "finish";

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
                <div className="flex-1 flex flex-col gap-6 p-8">
                    <OnboardingStepper />
                    <div className="flex-1">{renderStep()}</div>
                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => previous()}
                            disabled={state.isFirstStep || state.isLoading}
                        >
                            Back
                        </Button>
                        {state.isSkippable && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => skip()}
                                disabled={state.isLoading}
                            >
                                Skip
                            </Button>
                        )}
                    </div>
                </div>
                {showSplit && (
                    <div className="hidden md:block w-[360px] border-l border-white/10 bg-zinc-950">
                        <OnboardingPreview />
                    </div>
                )}
            </div>
        </div>
    );
};
