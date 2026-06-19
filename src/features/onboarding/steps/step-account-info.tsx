"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useSession } from "@/lib/auth/auth-client";
import { z } from "zod";
import {
  useZodForm,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  BaseSchema,
  WithPasswordSchema,
} from "@/features/onboarding/schemas/account.schema";
import { useUpdateAccount } from "@/features/onboarding/hooks/use-update-account";
import type { OnboardingMeta } from "@/features/onboarding/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const StepAccountInfo = () => {
  const { next, state } = useOnboarding();
  const { data: session, refetch: refetchSession } = useSession();
  const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
  const existingAccount = state?.context.flowData.account;
  const isUpdateMode = !!existingAccount;
  const passkeyEnabled = meta?.passkeyEnabled ?? false;
  const emailPasswordEnabled = meta?.emailPasswordEnabled ?? false;

  const [selectedMethod, setSelectedMethod] = useState<"passkey" | "password">(
    passkeyEnabled && !emailPasswordEnabled ? "passkey" : "password"
  );

  useEffect(() => {
    if (session?.user && !isUpdateMode) {
      next();
    }
  }, [session?.user?.id, next, session?.user, isUpdateMode]);

  const schema = selectedMethod === "password" && !isUpdateMode ? WithPasswordSchema : BaseSchema;
  const form = useZodForm({ schema }) as unknown as ReturnType<
    typeof useZodForm<typeof WithPasswordSchema>
  >;

  const mutation = useUpdateAccount(refetchSession, selectedMethod);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isUpdateMode ? "Update your account" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          This step can&apos;t be skipped.
        </p>
      </div>
      <Form
        form={form}
        className="flex flex-col gap-4"
        onSubmit={async (values) => mutation.mutateAsync(values as any)}
      >
        {!isUpdateMode && passkeyEnabled && emailPasswordEnabled && (
          <Tabs
            value={selectedMethod}
            onValueChange={(v) => setSelectedMethod(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="passkey">Passkey</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            defaultValue={existingAccount?.firstName ?? ""}
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            defaultValue={existingAccount?.lastName ?? ""}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          defaultValue={existingAccount?.email ?? ""}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isUpdateMode && selectedMethod === "password" && (
          <FormField
            control={form.control}
            name="password"
            defaultValue=""
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Min. 8 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {isUpdateMode
            ? "Update account"
            : selectedMethod === "passkey"
              ? "Create account with passkey"
              : "Create account"}
        </Button>
      </Form>
    </div>
  );
};
