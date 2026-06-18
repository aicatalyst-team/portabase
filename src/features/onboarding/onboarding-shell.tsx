"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/features/onboarding/onboarding-stepper";
import { OnboardingChecklist } from "@/features/onboarding/onboarding-checklist";
import { Heart } from "lucide-react";
import { AuthLogoSection } from "../auth/auth-logo-section";

const STEP_ORDER = [
  "login",
  "account-info",
  "security",
  "preferences",
  "org-create",
  "invite-members",
  "notifier",
  "storage",
  "defaults",
  "agent-create",
  "agent-key",
  "agent-waiting",
  "project-create",
  "db-settings",
  "finish",
];

export const OnboardingShell = () => {
  const { state, previous, skip, next, renderStep } = useOnboarding();

  const currentStepId = String(state?.currentStep?.id ?? "");
  const currentIndex = STEP_ORDER.indexOf(currentStepId);

  const [latestIndex, setLatestIndex] = useState(currentIndex);

  useEffect(() => {
    setLatestIndex((prev) => Math.max(prev, currentIndex));
  }, [currentIndex]);

  if (!state) return null;

  const showSplit =
    currentStepId !== "agent-waiting" && currentStepId !== "finish";

  const isGoingBack = currentIndex < latestIndex;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 gap-4">
      <AuthLogoSection />
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
            <div className="flex gap-2">
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
              {isGoingBack && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => next()}
                  disabled={state.isLoading}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
        {showSplit && (
          <div className="hidden md:block w-75 border-l border-white/10 bg-zinc-950">
            <OnboardingChecklist />
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground flex flex-col gap-1">
        <p className="flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="size-3 fill-red-500 text-red-500 animate-pulse" />{" "}
          by <span className="font-medium text-foreground">Portabase</span>
        </p>
      </footer>
    </div>
  );
};
