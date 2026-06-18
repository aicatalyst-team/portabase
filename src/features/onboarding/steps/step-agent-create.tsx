"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createAgentAction } from "@/features/agents/agents.action";
import type { OnboardingAgent, OnboardingDefaultsData } from "@/features/onboarding/onboarding.types";

export const StepAgentCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const defaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
    const existingAgents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
    const orgId = (state?.context.flowData.org as any)?.id as string | undefined;

    const [name, setName] = useState("");
    const [pendingAgents, setPendingAgents] = useState<{ tempId: string; name: string }[]>([]);

    const addPending = () => {
        if (!name.trim()) return;
        setPendingAgents((prev) => [...prev, { tempId: crypto.randomUUID(), name: name.trim() }]);
        setName("");
    };

    const removePending = (tempId: string) => {
        setPendingAgents((prev) => prev.filter((a) => a.tempId !== tempId));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const created: OnboardingAgent[] = [];
            for (const pa of pendingAgents) {
                const result = await createAgentAction({
                    organizationId: orgId,
                    data: {
                        name: pa.name,
                        description: "",
                    },
                });
                if (!result?.data?.data) {
                    throw new Error(`Failed to create agent "${pa.name}"`);
                }
                created.push({
                    id: result.data.data.id,
                    name: result.data.data.name,
                    notifierId: defaults.notifierId,
                    storageId: defaults.storageId,
                });
            }
            const allAgents = [...existingAgents, ...created];
            await updateContext({
                flowData: { ...state?.context.flowData, agents: allAgents },
            });
            await next();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const allDisplayed = [
        ...existingAgents.map((a) => ({ id: a.id, name: a.name, persisted: true })),
        ...pendingAgents.map((p) => ({ id: p.tempId, name: p.name, persisted: false })),
    ];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create an agent</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — agents will use your default notifier and storage.</p>
            </div>
            <div className="flex gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="agent-prod"
                    onKeyDown={(e) => e.key === "Enter" && addPending()}
                />
                <Button type="button" variant="outline" onClick={addPending}>
                    Add
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {allDisplayed.map((a) => (
                    <Badge key={a.id} variant={a.persisted ? "default" : "secondary"} className="gap-1">
                        {a.name}
                        {!a.persisted && (
                            <button type="button" onClick={() => removePending(a.id)}>
                                <X className="size-3" />
                            </button>
                        )}
                    </Badge>
                ))}
            </div>
            <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
            >
                {mutation.isPending ? "Creating…" : "Continue"}
            </Button>
        </div>
    );
};
