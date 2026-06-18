"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createOrganizationAction } from "@/features/organizations/organization.action";

export const StepOrgCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const existingOrg = state?.context.flowData.org;
    const [name, setName] = useState(existingOrg?.name ?? "");
    const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(existingOrg?.logoDataUrl);

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

    const mutation = useMutation({
        mutationFn: async () => {
            if (!name.trim()) return;
            const result = await createOrganizationAction({ name: name.trim() });
            if (!result?.data?.success) {
                const data = result?.data;
                throw new Error((!data?.success && data?.actionError?.message) ? data.actionError.message : "Failed to create organisation");
            }
            const org = result.data.value;
            if (!org) throw new Error("Failed to create organisation");
            await updateContext({
                flowData: {
                    ...state?.context.flowData,
                    org: { id: org.id, name: org.name, logoDataUrl },
                },
            });
            await next();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create your organisation</h1>
                <p className="text-sm text-muted-foreground mt-1">This step can&apos;t be skipped.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="org-name">Organisation name</Label>
                <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Inc."
                />
            </div>
            <label className="text-sm underline cursor-pointer w-fit">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            {logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="" className="size-12 rounded-md object-cover" />
            )}
            <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!name.trim() || mutation.isPending}
            >
                {mutation.isPending ? "Creating…" : "Continue"}
            </Button>
        </div>
    );
};
