"use client";

import { useOnboarding } from "@onboardjs/react";
import { Loader2 } from "lucide-react";

const DASHBOARD_PREVIEW_STEP_IDS = [
    "account-info",
    "security",
    "preferences",
    "org-create",
];

export const OnboardingPreview = () => {
    const { state } = useOnboarding();
    const stepId = state?.currentStep?.id;

    if (stepId === "agent-waiting") {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="size-10 animate-spin text-primary" />
            </div>
        );
    }

    if (stepId === "finish") {
        return null;
    }

    const org = state?.context.flowData.org as { name?: string; logoDataUrl?: string } | undefined;
    const preferences = state?.context.flowData.preferences as { theme?: string; avatarDataUrl?: string } | undefined;

    const isDashboardPreview = typeof stepId === "string" && DASHBOARD_PREVIEW_STEP_IDS.includes(stepId);

    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <div
                className={`w-full max-w-sm rounded-lg border border-white/10 overflow-hidden ${preferences?.theme === "light" ? "bg-white text-black" : "bg-zinc-900 text-white"}`}
            >
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    {org?.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={org.logoDataUrl} alt="" className="size-5 rounded" />
                    ) : (
                        <div className="size-5 rounded bg-primary" />
                    )}
                    <span className="text-sm font-medium">{org?.name || "Your organisation"}</span>
                </div>
                {isDashboardPreview && (
                    <div className="flex">
                        <div className="w-16 border-r border-white/10 p-2 flex flex-col gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-2 rounded bg-white/10" />
                            ))}
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-2">
                            <div className="h-3 w-1/2 rounded bg-white/10" />
                            <div className="h-16 rounded bg-white/5" />
                            <div className="h-16 rounded bg-white/5" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
