"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Check, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { mockDatabases } from "@/features/onboarding/onboarding.mock";

export const StepProjectCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [databaseIds, setDatabaseIds] = useState<string[]>([]);

    const toggleDb = (id: string) => {
        setDatabaseIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, project: { name, description, databaseIds } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create a project</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — group databases under a project.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My project" />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>Databases</Label>
                <div className="flex flex-col gap-2">
                    {mockDatabases.map((db) => {
                        const isSelected = databaseIds.includes(db.id);
                        return (
                            <button
                                key={db.id}
                                type="button"
                                onClick={() => toggleDb(db.id)}
                                className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors text-left ${
                                    isSelected
                                        ? "border-primary/20 bg-primary/10 text-primary"
                                        : "border-border hover:bg-accent/50 hover:border-primary/20"
                                }`}
                            >
                                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                    <Database className="size-4 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="font-medium">{db.name}</span>
                                    <span className="text-xs text-muted-foreground">{db.engine}</span>
                                </div>
                                {isSelected && (
                                    <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                                        <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <Button type="button" onClick={onContinue} disabled={!name.trim()}>
                Continue
            </Button>
        </div>
    );
};
