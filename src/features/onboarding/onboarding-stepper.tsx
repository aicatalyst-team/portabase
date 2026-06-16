"use client";

import { useOnboarding } from "@onboardjs/react";
import { Progress } from "@/components/ui/progress";

export const OnboardingStepper = () => {
    const { state } = useOnboarding();

    if (!state) return null;

    return (
        <div className="flex flex-col gap-2 w-full max-w-sm">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Step {state.currentStepNumber} of {state.totalSteps}</span>
                <span>{Math.round(state.progressPercentage)}%</span>
            </div>
            <Progress value={state.progressPercentage} />
        </div>
    );
};
