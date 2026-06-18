"use client";

import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingAccountData, OnboardingMeta } from "@/features/onboarding/onboarding.types";

const AVATAR_COLORS = [
    { name: "indigo",   hex: "#4f46e5" },
    { name: "violet",  hex: "#7c3aed" },
    { name: "rose",    hex: "#e11d48" },
    { name: "orange",  hex: "#ea580c" },
    { name: "amber",   hex: "#d97706" },
    { name: "emerald", hex: "#059669" },
    { name: "cyan",    hex: "#0891b2" },
    { name: "zinc",    hex: "#52525b" },
];

const THEME_OPTIONS = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
] as const;

export const StepPreferences = () => {
    const { next, updateContext, state } = useOnboarding();
    const preferences = state?.context.flowData.preferences ?? { theme: "dark" as const };
    const account = state?.context.flowData.account as OnboardingAccountData | undefined;

    const initials = account
        ? `${account.firstName[0] ?? ""}${account.lastName[0] ?? ""}`.toUpperCase()
        : "PB";

    const selectedAvatarUrl = preferences.avatarUrl;

    const selectAvatar = async (color: string) => {
        const url = `/api/avatar?initials=${initials}&color=${encodeURIComponent(color)}`;
        await updateContext({
            flowData: {
                ...state?.context.flowData,
                preferences: { ...preferences, avatarUrl: url },
            },
        });
    };

    const selectTheme = async (theme: "dark" | "light") => {
        await updateContext({
            flowData: {
                ...state?.context.flowData,
                preferences: { ...preferences, theme },
            },
        });
    };

    const onContinue = async () => {
        await next();
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Your preferences</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — personalise your workspace.</p>
            </div>

            {/* Theme */}
            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Theme</p>
                <div className="flex gap-2">
                    {THEME_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => selectTheme(opt.value)}
                            className={cn(
                                "flex-1 rounded-lg border p-3 text-sm transition-colors",
                                preferences.theme === opt.value
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Avatar picker */}
            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Avatar</p>
                <div className="grid grid-cols-8 gap-2">
                    {AVATAR_COLORS.map((c) => {
                        const url = `/api/avatar?initials=${initials}&color=${encodeURIComponent(c.hex)}`;
                        const isSelected = selectedAvatarUrl === url;
                        return (
                            <button
                                key={c.name}
                                type="button"
                                onClick={() => selectAvatar(c.hex)}
                                className={cn(
                                    "rounded-full overflow-hidden transition-all",
                                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-zinc-900" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt={c.name}
                                    width={40}
                                    height={40}
                                    className="size-10 rounded-full"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
