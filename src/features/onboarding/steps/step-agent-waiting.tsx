"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Loader2 } from "lucide-react";
import { useAgentStatus } from "@/features/onboarding/hooks/use-agent-status";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentWaiting = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
  const { data, isLoading } = useAgentStatus();

  useEffect(() => {
    if (data?.connected) {
      next();
    }
  }, [data?.connected, next]);

  // Don't render until the first fetch completes, or if the agent is already
  // connected (next() fires before the spinner is ever displayed).
  if (isLoading || data?.connected) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <h1 className="text-xl font-semibold">Waiting for your agent</h1>
      <p className="text-sm text-muted-foreground">
        Checking connectivity every 3 seconds…
      </p>
      {agents.length > 0 && (
        <p className="text-xs text-muted-foreground">Agent: {agents[0].name}</p>
      )}
    </div>
  );
};
