"use client";

import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useZodForm, Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth/auth-client";

const AccountStepSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Min. 8 characters"),
});

type AccountStepType = z.infer<typeof AccountStepSchema>;

export const StepAccountInfo = () => {
    const { next, updateContext, state } = useOnboarding();
    const form = useZodForm({ schema: AccountStepSchema });

    const mutation = useMutation({
        mutationFn: async (values: AccountStepType) => {
            await signUp.email(
                { name: values.name, email: values.email, password: values.password },
                {
                    onSuccess: async () => {
                        await updateContext({
                            flowData: { ...state?.context.flowData, account: { name: values.name, email: values.email } },
                        });
                        await next();
                    },
                    onError: (error) => {
                        toast.error(error.error.message);
                    },
                }
            );
        },
    });

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create your account</h1>
                <p className="text-sm text-muted-foreground mt-1">This step can&apos;t be skipped.</p>
            </div>
            <Form form={form} className="flex flex-col gap-4" onSubmit={async (values) => mutation.mutateAsync(values)}>
                <FormField
                    control={form.control}
                    name="name"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="example@portabase.io" {...field} />
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
                <Button type="submit" disabled={mutation.isPending}>
                    Create account
                </Button>
            </Form>
        </div>
    );
};
