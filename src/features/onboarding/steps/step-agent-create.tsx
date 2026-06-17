"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { OnboardingAgent, OnboardingDefaultsData } from "@/features/onboarding/onboarding.types";

export const StepAgentCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const defaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
    const [name, setName] = useState("");
    const [agents, setAgents] = useState<OnboardingAgent[]>([]);

    const addAgent = () => {
        if (!name.trim()) return;
        setAgents((prev) => [
            ...prev,
            { id: `agent-${prev.length + 1}`, name: name.trim(), notifierId: defaults.notifierId, storageId: defaults.storageId },
        ]);
        setName("");
    };

    const removeAgent = (id: string) => {
        setAgents((prev) => prev.filter((a) => a.id !== id));
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, agents } });
        await next();
    };

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
                    onKeyDown={(e) => e.key === "Enter" && addAgent()}
                />
                <Button type="button" variant="outline" onClick={addAgent}>
                    Add
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {agents.map((agent) => (
                    <Badge key={agent.id} variant="secondary" className="gap-1">
                        {agent.name}
                        <button type="button" onClick={() => removeAgent(agent.id)}>
                            <X className="size-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
