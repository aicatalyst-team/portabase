# Onboarding Channel Config + Style Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-phase provider-select → configure flow to the notifier and storage onboarding steps (fake data, stored in flowData), restyle all toggle cards/buttons across onboarding steps to use design-system tokens matching organization-combobox.tsx, and wire conditional step skipping when no agents are created.

**Architecture:** `step-notifier` and `step-storage` manage a local `phase` state (`"grid"` | `"configuring"`). In "configuring" phase they render a `<Form>` using the existing `NotificationChannelFormSchema`/`StorageChannelFormSchema` and `renderChannelForm(provider, form)`. On submit, the configured channel `{ id, provider, label, name, config }` is appended to local state; no server action is called. All toggle `<button>` elements across steps replace hardcoded `border-white/10` with design-system tokens (`border-border`, `border-primary/20`, `bg-primary/10`, `hover:bg-accent/50`). The `agent-create` step gets a dynamic `nextStep` function that skips `agent-waiting`, `project-create`, and `db-settings` when `flowData.agents` is empty.

**Tech Stack:** Next.js App Router, `@onboardjs/react` 1.0.0-rc.5, `react-hook-form` + zod via `useZodForm`/`Form` from `@/components/ui/form`, existing `renderChannelForm` from `@/features/channel/channels-helpers`, `NotificationChannelFormSchema`/`StorageChannelFormSchema` from `@/features/channel/channel-form.schema`, shadcn/radix UI, lucide-react.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/onboarding/onboarding.types.ts` | Modify | Extend `OnboardingChannel` with `name` + `config` fields |
| `src/features/onboarding/steps/step-notifier.tsx` | Rewrite | Two-phase grid→config flow for notification providers |
| `src/features/onboarding/steps/step-storage.tsx` | Rewrite | Two-phase grid→config flow for storage providers |
| `src/features/onboarding/steps/step-sso-gate.tsx` | Modify | Restyle SSO provider buttons to org-combobox card style |
| `src/features/onboarding/steps/step-security.tsx` | Modify | Restyle passkey/2FA choice to org-combobox card style |
| `src/features/onboarding/steps/step-preferences.tsx` | Modify | Restyle theme toggle buttons to org-combobox card style |
| `src/features/onboarding/steps/step-project-create.tsx` | Modify | Replace `border-white/10` with `border-border` on DB toggles |
| `src/features/onboarding/onboarding-steps.tsx` | Modify | Change `agent-create.nextStep` to a conditional function |

---

### Task 1: Extend `OnboardingChannel` type

**Files:**
- Modify: `src/features/onboarding/onboarding.types.ts`

- [ ] **Step 1: Update `OnboardingChannel`**

Replace lines 31–35 in `src/features/onboarding/onboarding.types.ts`:

```typescript
export type OnboardingChannel = {
    id: string;
    provider: string;
    label: string;
    name: string;
    config: Record<string, unknown>;
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: only the existing `step-account-info.tsx:28` better-auth error — `step-notifier.tsx` and `step-storage.tsx` will error until rewritten in Tasks 2 and 3, which is expected. No errors in `onboarding.types.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/onboarding.types.ts
git commit -m "feat(onboarding): extend OnboardingChannel with name and config fields"
```

---

### Task 2: Rewrite `step-notifier.tsx` — two-phase config flow + style

**Files:**
- Rewrite: `src/features/onboarding/steps/step-notifier.tsx`

**Context:** This step manages a `phase` local state. In `"grid"` phase it shows the provider selection grid. When the user clicks a provider, `phase` switches to `"configuring"` with the selected provider ID. In `"configuring"` phase it renders a full form using `NotificationChannelFormSchema` and `renderChannelForm`. On valid submit the channel is added to a local `channels` list and phase returns to `"grid"`. Clicking Continue saves `channels` to `flowData.notifiers` and calls `next()`. Provider cards use org-combobox design tokens. No server action is called.

- [ ] **Step 1: Write the file**

```typescript
// src/features/onboarding/steps/step-notifier.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useZodForm,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { notificationProviders } from "@/features/channel/channels-notification-helper";
import { renderChannelForm } from "@/features/channel/channels-helpers";
import { NotificationChannelFormSchema } from "@/features/channel/channel-form.schema";
import { OnboardingChannel } from "@/features/onboarding/onboarding.types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepNotifier = () => {
    const { next, updateContext, state } = useOnboarding();
    const [phase, setPhase] = useState<Phase>({ kind: "grid" });
    const [channels, setChannels] = useState<OnboardingChannel[]>([]);

    // @ts-expect-error — discriminated union schema, provider set on phase entry
    const form = useZodForm({ schema: NotificationChannelFormSchema });

    const startConfiguring = (provider: string) => {
        // @ts-expect-error — discriminated union
        form.reset({ provider, enabled: true, name: "", config: {} });
        setPhase({ kind: "configuring", provider });
    };

    const removeChannel = (id: string) => {
        setChannels((prev) => prev.filter((c) => c.id !== id));
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, notifiers: channels } });
        await next();
    };

    if (phase.kind === "configuring") {
        const providerDetails = notificationProviders.find((p) => p.value === phase.provider);
        const Icon = providerDetails?.icon;

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                    {Icon && (
                        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center">
                            <Icon className="size-5" />
                        </div>
                    )}
                    <p className="flex-1 text-sm font-medium">
                        Configuring {providerDetails?.label}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhase({ kind: "grid" })}
                    >
                        <ArrowLeft className="size-4 mr-1" />
                        Back
                    </Button>
                </div>
                <Form
                    form={form}
                    className="flex flex-col gap-4"
                    onSubmit={async (values: any) => {
                        const details = notificationProviders.find(
                            (p) => p.value === values.provider
                        );
                        setChannels((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                provider: values.provider,
                                label: details?.label ?? values.provider,
                                name: values.name,
                                config: values.config as Record<string, unknown>,
                            },
                        ]);
                        // @ts-expect-error — discriminated union
                        form.reset({ enabled: true });
                        setPhase({ kind: "grid" });
                    }}
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Channel name *</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder={`e.g. ${providerDetails?.label ?? ""} alerts`}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                            <input type="hidden" {...field} value={field.value || ""} />
                        )}
                    />
                    {renderChannelForm(phase.provider, form)}
                    <Button type="submit">Add channel</Button>
                </Form>
            </div>
        );
    }

    // Phase: grid
    const configuredProviderIds = channels.map((c) => c.provider);
    const availableProviders = notificationProviders.filter((p) => !p.preview);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Connect a notifier</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Optional — get notified about backups, restores and health checks.
                </p>
            </div>

            {channels.length > 0 && (
                <div className="flex flex-col gap-1">
                    {channels.map((ch) => {
                        const details = notificationProviders.find((p) => p.value === ch.provider);
                        const Icon = details?.icon;
                        return (
                            <div
                                key={ch.id}
                                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm text-primary"
                            >
                                {Icon && (
                                    <div className="size-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                        <Icon className="size-4" />
                                    </div>
                                )}
                                <span className="flex-1 truncate">
                                    {ch.name}{" "}
                                    <span className="opacity-60">({ch.label})</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeChannel(ch.id)}
                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {availableProviders.map((provider) => {
                    const Icon = provider.icon;
                    const isConfigured = configuredProviderIds.includes(provider.value);
                    return (
                        <button
                            key={provider.value}
                            type="button"
                            onClick={() => startConfiguring(provider.value)}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                                isConfigured
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            }`}
                        >
                            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                <Icon className="size-4" />
                            </div>
                            <span className="flex-1 text-left">{provider.label}</span>
                            {isConfigured && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-notifier.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-notifier.tsx
git commit -m "feat(onboarding): add two-phase config flow and org-combobox style to notifier step"
```

---

### Task 3: Rewrite `step-storage.tsx` — two-phase config flow + style

**Files:**
- Rewrite: `src/features/onboarding/steps/step-storage.tsx`

**Context:** Identical pattern to Task 2 but for storage providers. Use `StorageChannelFormSchema` and `storageProviders`. Filter out `p.value === "local"` from the grid (local storage has no config form). `renderChannelForm("s3", form)` etc. renders the correct sub-form from `channels-helpers.tsx`.

- [ ] **Step 1: Write the file**

```typescript
// src/features/onboarding/steps/step-storage.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useZodForm,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { storageProviders } from "@/features/channel/channels-storage-helper";
import { renderChannelForm } from "@/features/channel/channels-helpers";
import { StorageChannelFormSchema } from "@/features/channel/channel-form.schema";
import { OnboardingChannel } from "@/features/onboarding/onboarding.types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepStorage = () => {
    const { next, updateContext, state } = useOnboarding();
    const [phase, setPhase] = useState<Phase>({ kind: "grid" });
    const [channels, setChannels] = useState<OnboardingChannel[]>([]);

    // @ts-expect-error — discriminated union schema, provider set on phase entry
    const form = useZodForm({ schema: StorageChannelFormSchema });

    const startConfiguring = (provider: string) => {
        // @ts-expect-error — discriminated union
        form.reset({ provider, enabled: true, name: "", config: {} });
        setPhase({ kind: "configuring", provider });
    };

    const removeChannel = (id: string) => {
        setChannels((prev) => prev.filter((c) => c.id !== id));
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, storages: channels } });
        await next();
    };

    if (phase.kind === "configuring") {
        const providerDetails = storageProviders.find((p) => p.value === phase.provider);
        const Icon = providerDetails?.icon;

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                    {Icon && (
                        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center">
                            <Icon className="size-5" />
                        </div>
                    )}
                    <p className="flex-1 text-sm font-medium">
                        Configuring {providerDetails?.label}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhase({ kind: "grid" })}
                    >
                        <ArrowLeft className="size-4 mr-1" />
                        Back
                    </Button>
                </div>
                <Form
                    form={form}
                    className="flex flex-col gap-4"
                    onSubmit={async (values: any) => {
                        const details = storageProviders.find(
                            (p) => p.value === values.provider
                        );
                        setChannels((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                provider: values.provider,
                                label: details?.label ?? values.provider,
                                name: values.name,
                                config: values.config as Record<string, unknown>,
                            },
                        ]);
                        // @ts-expect-error — discriminated union
                        form.reset({ enabled: true });
                        setPhase({ kind: "grid" });
                    }}
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Channel name *</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder={`e.g. ${providerDetails?.label ?? ""} backup`}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                            <input type="hidden" {...field} value={field.value || ""} />
                        )}
                    />
                    {renderChannelForm(phase.provider, form)}
                    <Button type="submit">Add storage</Button>
                </Form>
            </div>
        );
    }

    // Phase: grid — filter "local" (no config form, no credentials)
    const availableProviders = storageProviders.filter(
        (p) => !p.preview && p.value !== "local"
    );
    const configuredProviderIds = channels.map((c) => c.provider);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Connect a storage</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Optional — choose where backups and files are stored.
                </p>
            </div>

            {channels.length > 0 && (
                <div className="flex flex-col gap-1">
                    {channels.map((ch) => {
                        const details = storageProviders.find((p) => p.value === ch.provider);
                        const Icon = details?.icon;
                        return (
                            <div
                                key={ch.id}
                                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm text-primary"
                            >
                                {Icon && (
                                    <div className="size-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                        <Icon className="size-4" />
                                    </div>
                                )}
                                <span className="flex-1 truncate">
                                    {ch.name}{" "}
                                    <span className="opacity-60">({ch.label})</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeChannel(ch.id)}
                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {availableProviders.map((provider) => {
                    const Icon = provider.icon;
                    const isConfigured = configuredProviderIds.includes(provider.value);
                    return (
                        <button
                            key={provider.value}
                            type="button"
                            onClick={() => startConfiguring(provider.value)}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                                isConfigured
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            }`}
                        >
                            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                <Icon className="size-4" />
                            </div>
                            <span className="flex-1 text-left">{provider.label}</span>
                            {isConfigured && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-storage.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-storage.tsx
git commit -m "feat(onboarding): add two-phase config flow and org-combobox style to storage step"
```

---

### Task 4: Restyle `step-sso-gate.tsx`

**Files:**
- Modify: `src/features/onboarding/steps/step-sso-gate.tsx`

**Context:** SSO provider buttons currently use shadcn `Button variant="outline"`. Replace with org-combobox card style using a `Globe` icon as placeholder (mockSsoConfig providers have no icon). "Continue with email" stays as a shadcn `Button`.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/features/onboarding/steps/step-sso-gate.tsx
"use client";

import { useOnboarding } from "@onboardjs/react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSsoConfig } from "@/features/onboarding/onboarding.mock";

export const StepSsoGate = () => {
    const { next, updateContext, state } = useOnboarding();

    const chooseProvider = async (providerId: string) => {
        await updateContext({ flowData: { ...state?.context.flowData, sso: { providerId } } });
        await next();
    };

    const continueWithEmail = async () => {
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Welcome to Portabase</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Sign in with your organisation provider, or continue with email.
                </p>
            </div>
            <div className="flex flex-col gap-2">
                {mockSsoConfig.providers.map((provider) => (
                    <button
                        key={provider.id}
                        type="button"
                        onClick={() => chooseProvider(provider.id)}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                    >
                        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                            <Globe className="size-4 text-muted-foreground" />
                        </div>
                        <span>Continue with {provider.label}</span>
                    </button>
                ))}
            </div>
            {!mockSsoConfig.forced && (
                <Button type="button" onClick={continueWithEmail}>
                    Continue with email
                </Button>
            )}
        </div>
    );
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-sso-gate.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-sso-gate.tsx
git commit -m "style(onboarding): restyle sso-gate provider buttons to org-combobox card style"
```

---

### Task 5: Restyle `step-security.tsx`

**Files:**
- Modify: `src/features/onboarding/steps/step-security.tsx`

**Context:** Single-button choice (passkey or two-factor). Replace `Button` with an org-combobox card. Add a relevant lucide icon (`KeyRound` for passkey, `ShieldCheck` for two-factor) inside the icon container.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/features/onboarding/steps/step-security.tsx
"use client";

import { useOnboarding } from "@onboardjs/react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { mockSsoConfig } from "@/features/onboarding/onboarding.mock";

export const StepSecurity = () => {
    const { next, updateContext, state } = useOnboarding();

    const choose = async (method: "passkey" | "two-factor") => {
        await updateContext({ flowData: { ...state?.context.flowData, security: { method } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Secure your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {mockSsoConfig.passkeyEnabled
                        ? "Set up a passkey for faster, safer sign-in."
                        : "Set up two-factor authentication to protect your account."}
                </p>
            </div>
            {mockSsoConfig.passkeyEnabled ? (
                <button
                    type="button"
                    onClick={() => choose("passkey")}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left"
                >
                    <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                        <KeyRound className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Set up passkey</span>
                        <span className="text-xs text-muted-foreground">Faster, safer sign-in</span>
                    </div>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => choose("two-factor")}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left"
                >
                    <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Set up two-factor</span>
                        <span className="text-xs text-muted-foreground">Add an extra layer of security</span>
                    </div>
                </button>
            )}
        </div>
    );
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-security.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-security.tsx
git commit -m "style(onboarding): restyle security method choice to org-combobox card style"
```

---

### Task 6: Restyle `step-preferences.tsx`

**Files:**
- Modify: `src/features/onboarding/steps/step-preferences.tsx`

**Context:** Theme toggle currently uses shadcn `Button` with `variant="default"/"outline"` switching. Replace with org-combobox toggle cards: active state `bg-primary/10 text-primary border-primary/20`, inactive `border-border hover:bg-accent/50`, check badge on active. Sun/Moon icons in icon containers.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/features/onboarding/steps/step-preferences.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export const StepPreferences = () => {
    const { next, updateContext, state } = useOnboarding();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            toast.error("Image is too large. Please select a file under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setAvatarDataUrl(reader.result as string);
        reader.onerror = () => toast.error("Failed to read the selected image. Please try again.");
        reader.readAsDataURL(file);
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, preferences: { theme, avatarDataUrl } } });
        await next();
    };

    const themeOptions: { value: "light" | "dark"; label: string; Icon: typeof Sun }[] = [
        { value: "light", label: "Light", Icon: Sun },
        { value: "dark", label: "Dark", Icon: Moon },
    ];

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
                {themeOptions.map(({ value, label, Icon }) => {
                    const isActive = theme === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors flex-1 ${
                                isActive
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            }`}
                        >
                            <div className="size-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                <Icon className="size-4" />
                            </div>
                            <span className="flex-1 text-left">{label}</span>
                            {isActive && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-preferences.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-preferences.tsx
git commit -m "style(onboarding): restyle theme toggles in preferences step to org-combobox card style"
```

---

### Task 7: Restyle `step-project-create.tsx`

**Files:**
- Modify: `src/features/onboarding/steps/step-project-create.tsx`

**Context:** DB toggle buttons have hardcoded `border-white/10` for inactive state. Replace with design-system tokens. Add icon container and check badge for active state (use `Database` icon from lucide).

- [ ] **Step 1: Rewrite the file**

```typescript
// src/features/onboarding/steps/step-project-create.tsx
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
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `step-project-create.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/step-project-create.tsx
git commit -m "style(onboarding): restyle DB toggle buttons in project-create step to org-combobox card style"
```

---

### Task 8: Update `onboarding-steps.tsx` — conditional agent-create nextStep

**Files:**
- Modify: `src/features/onboarding/onboarding-steps.tsx`

**Context:** Change `agent-create.nextStep` from the static string `"agent-waiting"` to a function that checks `ctx.flowData.agents`. If agents were added → `"agent-waiting"` (normal flow). If none → `"finish"` (skips agent-waiting, project-create, db-settings). The `ctx` argument is the OnboardJS context object; its `flowData` property is `{ [key: string]: any }`.

- [ ] **Step 1: Update the `agent-create` entry in `onboarding-steps.tsx`**

Replace lines 82–87:

```typescript
    {
        id: "agent-create",
        component: StepAgentCreate,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: (ctx) => {
            const agents = ctx.flowData?.agents as unknown[] | undefined;
            return agents && agents.length > 0 ? "agent-waiting" : "finish";
        },
    },
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `onboarding-steps.tsx`. If TypeScript complains about the function signature for `nextStep`, check the `OnboardingStep` type in `node_modules/@onboardjs/react/dist/**/*.d.ts` and cast `ctx` as needed (e.g. `(ctx: any) => ...`).

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/onboarding-steps.tsx
git commit -m "feat(onboarding): skip agent-waiting/project-create/db-settings when no agents created"
```

---

### Task 9: Final verification

**Files:** None — read-only checks.

- [ ] **Step 1: Full type-check**

Run: `pnpm exec tsc --noEmit 2>&1 | grep "onboarding"`
Expected: only the pre-existing `step-account-info.tsx:28` better-auth error. No new errors in any onboarding file.

- [ ] **Step 2: Verify step-invite-members and step-agent-create have no hardcoded colors**

Run:
```bash
grep -n "white/10\|zinc-\|#[0-9a-f]\{3,6\}" \
  src/features/onboarding/steps/step-invite-members.tsx \
  src/features/onboarding/steps/step-agent-create.tsx
```
Expected: no output. If any hardcoded color is found, replace with the design-system equivalent (`border-white/10` → `border-border`).

- [ ] **Step 3: Verify the step graph conditional skip**

Run: `grep -A8 '"agent-create"' src/features/onboarding/onboarding-steps.tsx`
Expected: output shows `nextStep: (ctx) => {` function, not a plain string.

- [ ] **Step 4: Commit if Step 2 required fixes**

Only commit if `step-invite-members.tsx` or `step-agent-create.tsx` were modified:

```bash
git add src/features/onboarding/steps/step-invite-members.tsx \
        src/features/onboarding/steps/step-agent-create.tsx
git commit -m "style(onboarding): remove hardcoded colors from invite-members and agent-create"
```
