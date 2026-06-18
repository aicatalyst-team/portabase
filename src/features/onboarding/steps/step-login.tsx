"use client";

import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
    useZodForm,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { signIn } from "@/lib/auth/auth-client";
import type { OnboardingMeta } from "@/features/onboarding/onboarding.types";

const LoginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password required"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export const StepLogin = () => {
    const { next, state } = useOnboarding();
    const meta = state?.context.flowData.meta as OnboardingMeta | undefined;

    const form = useZodForm({ schema: LoginSchema });

    const loginMutation = useMutation({
        mutationFn: async (values: LoginValues) => {
            const result = await signIn.email(
                { email: values.email, password: values.password },
                {
                    onSuccess: async () => {
                        await next();
                    },
                    onError: (error) => {
                        toast.error(error.error.message);
                    },
                }
            );
            return result;
        },
    });

    const handleSso = async (providerId: string) => {
        await signIn.social({ provider: providerId as any });
    };

    // Case 1: No existing users — registration flow (SSO or continue to account-info)
    if (!meta?.hasExistingUsers) {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Welcome to Portabase</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set up your instance by creating the first account.
                    </p>
                </div>
                {meta?.ssoProviders && meta.ssoProviders.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {meta.ssoProviders.map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                onClick={() => handleSso(provider.id)}
                                className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                            >
                                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                    <Globe className="size-4 text-muted-foreground" />
                                </div>
                                <span>Continue with {provider.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <Button type="button" onClick={() => next()}>
                    <Mail className="size-4 mr-2" />
                    Register with email
                </Button>
            </div>
        );
    }

    // Case 2 & 3: Login form (default user mode or session expired resume)
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {meta?.defaultUserMode
                        ? "Sign in to continue onboarding."
                        : "Your session expired. Sign in to continue where you left off."}
                </p>
            </div>
            {meta?.ssoProviders && meta.ssoProviders.length > 0 && !meta.defaultUserMode && (
                <div className="flex flex-col gap-2">
                    {meta.ssoProviders.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleSso(provider.id)}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                        >
                            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                <Globe className="size-4 text-muted-foreground" />
                            </div>
                            <span>Continue with {provider.label}</span>
                        </button>
                    ))}
                </div>
            )}
            <Form
                form={form}
                className="flex flex-col gap-4"
                onSubmit={async (values) => loginMutation.mutateAsync(values)}
            >
                <FormField
                    control={form.control}
                    name="email"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder="Your password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loginMutation.isPending}>
                    Sign in
                </Button>
            </Form>
        </div>
    );
};
