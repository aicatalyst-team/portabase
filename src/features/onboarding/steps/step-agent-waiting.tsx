"use client";

import { useEffect, useRef } from "react";
import { useOnboarding } from "@onboardjs/react";
import { simulateAgentPing } from "@/features/onboarding/onboarding.mock";

export const StepAgentWaiting = () => {
    const { next } = useOnboarding();
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        simulateAgentPing().then(() => next());
    }, [next]);

    return (
        <div className="flex flex-col items-center justify-center gap-2 h-full text-center">
            <h1 className="text-xl font-semibold">Waiting for your agent</h1>
            <p className="text-sm text-muted-foreground">Checking connectivity and database health...</p>
        </div>
    );
};
