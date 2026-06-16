"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const StepPreferences = () => {
    const { next, updateContext, state } = useOnboarding();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setAvatarDataUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, preferences: { theme, avatarDataUrl } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Make yourself at home</h1>
                <p className="text-sm text-muted-foreground mt-1">Pick your theme and add a profile photo.</p>
            </div>
            <div className="flex items-center gap-4">
                <Avatar className="size-12">
                    <AvatarImage src={avatarDataUrl} alt="" />
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <label className="text-sm underline cursor-pointer">
                    Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
                    Light
                </Button>
                <Button type="button" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
                    Dark
                </Button>
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
