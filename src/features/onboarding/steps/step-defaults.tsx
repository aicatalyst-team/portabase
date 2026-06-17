"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingChannel } from "@/features/onboarding/onboarding.types";

export const StepDefaults = () => {
    const { next, updateContext, state } = useOnboarding();
    const notifiers = (state?.context.flowData.notifiers ?? []) as OnboardingChannel[];
    const storages = (state?.context.flowData.storages ?? []) as OnboardingChannel[];
    const [notifierId, setNotifierId] = useState<string | undefined>(undefined);
    const [storageId, setStorageId] = useState<string | undefined>(undefined);

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, defaults: { notifierId, storageId } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Set your defaults</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — choose the default notifier and storage for new agents.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Default notifier</Label>
                <Select value={notifierId} onValueChange={setNotifierId} disabled={notifiers.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder={notifiers.length === 0 ? "No notifier connected" : "Choose a notifier"} />
                    </SelectTrigger>
                    <SelectContent>
                        {notifiers.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                                {n.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Default storage</Label>
                <Select value={storageId} onValueChange={setStorageId} disabled={storages.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder={storages.length === 0 ? "No storage connected" : "Choose a storage"} />
                    </SelectTrigger>
                    <SelectContent>
                        {storages.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
