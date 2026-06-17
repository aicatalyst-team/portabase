"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const StepOrgCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const [name, setName] = useState("");
    const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return;
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onerror = () => setLogoDataUrl(undefined);
        reader.onload = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onContinue = async () => {
        if (!name.trim()) return;
        await updateContext({ flowData: { ...state?.context.flowData, org: { name: name.trim(), logoDataUrl } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create your organisation</h1>
                <p className="text-sm text-muted-foreground mt-1">This step can&apos;t be skipped.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="org-name">Organisation name</Label>
                <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
            </div>
            <label className="text-sm underline cursor-pointer w-fit">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            <Button type="button" onClick={onContinue} disabled={!name.trim()}>
                Continue
            </Button>
        </div>
    );
};
