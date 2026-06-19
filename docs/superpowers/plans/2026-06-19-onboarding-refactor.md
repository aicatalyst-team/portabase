# Onboarding Feature Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganise `src/features/onboarding/` into typed sub-directories (types/, constants/, schemas/, hooks/) and replace all ad-hoc `useState(loading)` + try/finally patterns with `useMutation`/`useQuery` hooks from TanStack Query.

**Architecture:** Each hook calls `useOnboarding()` internally — steps pass nothing to hooks, they only call hooks and render JSX. Mutations handle API call + `updateContext`. Steps handle UI side-effects (form.reset, phase transitions) via per-call `onSuccess`.

**Tech Stack:** Next.js 15 App Router, TanStack Query v5 (`@tanstack/react-query`), `@onboardjs/react`, `next-safe-action`, TypeScript.

## Global Constraints

- All hooks live under `src/features/onboarding/hooks/`
- Hooks call `useOnboarding()` themselves — never accept `state`/`updateContext`/`next` as props
- `useMutation` for write operations, `useQuery` for polling/fetch
- `toast.error` in hook's `onError` — steps never duplicate error toasts
- Import types from `@/features/onboarding/types` (after Task 1 migration)
- No new UI/UX changes — refactor only
- No hooks for: `step-login` (auth-specific), `step-preferences` (no server calls), `step-invite-members` (local-only), `step-security` (context-only), `step-db-settings` (local-only), `step-defaults` (too specific)

---

### Task 1: Foundation — types/, constants/, schemas/

**Files:**
- Create: `src/features/onboarding/types/index.ts`
- Create: `src/features/onboarding/constants/steps.ts`
- Create: `src/features/onboarding/schemas/account.schema.ts`
- Delete: `src/features/onboarding/onboarding.types.ts` (after updating all imports)
- Modify: all 14 files that import from `onboarding.types` (listed below)

**Imports to migrate** (all `@/features/onboarding/onboarding.types` → `@/features/onboarding/types`):
```
src/features/onboarding/onboarding-state.ts
src/features/onboarding/steps/step-preferences.tsx
src/features/onboarding/steps/step-security.tsx
src/features/onboarding/steps/step-login.tsx
src/features/onboarding/steps/step-account-info.tsx
src/features/onboarding/steps/step-agent-waiting.tsx
src/features/onboarding/steps/step-storage.tsx
src/features/onboarding/steps/step-agent-key.tsx
src/features/onboarding/steps/step-agent-create.tsx
src/features/onboarding/steps/step-notifier.tsx
src/features/onboarding/steps/step-project-create.tsx
src/features/onboarding/steps/step-invite-members.tsx
src/features/onboarding/steps/step-db-settings.tsx
src/features/onboarding/steps/step-defaults.tsx
```

- [ ] **Step 1: Create types/index.ts**

Copy the full content of `onboarding.types.ts` verbatim:

```typescript
// src/features/onboarding/types/index.ts
export type OnboardingSsoProvider = { id: string; label: string };

export type OnboardingMeta = {
  passkeyEnabled: boolean;
  hasExistingUsers: boolean;
  ssoProviders: OnboardingSsoProvider[];
  defaultUserMode: boolean;
  resumeStepId: string;
  emailPasswordEnabled: boolean;
};

export type OnboardingAccountData = {
  firstName: string;
  lastName: string;
  email: string;
};

export type OnboardingSecurityData = {
  method: "passkey" | "two-factor" | "skipped";
};

export type OnboardingPreferencesData = {
  theme: "light" | "dark";
  avatarUrl?: string;
};

export type OnboardingOrgData = {
  id: string;
  name: string;
};

export type OnboardingMember = {
  email: string;
  role: "member" | "admin";
};

export type OnboardingChannel = {
  id: string;
  provider: string;
  label: string;
  name: string;
  config: Record<string, unknown>;
};

export type OnboardingDefaultsData = {
  notifierId?: string;
  storageId?: string;
};

export type OnboardingAgent = {
  id: string;
  name: string;
  notifierId?: string;
  storageId?: string;
};

export type OnboardingDatabase = {
  id: string;
  name: string;
  engine: "postgres" | "mysql" | "mongodb";
};

export type OnboardingDbSettings = {
  retentionDays: number;
  notifierId?: string;
  storageId?: string;
};

export type OnboardingProjectData = {
  id: string;
  name: string;
  description: string;
  databaseIds: string[];
};

export type OnboardingFlowData = {
  meta?: OnboardingMeta;
  account?: OnboardingAccountData;
  security?: OnboardingSecurityData;
  preferences?: OnboardingPreferencesData;
  org?: OnboardingOrgData;
  members?: OnboardingMember[];
  notifiers?: OnboardingChannel[];
  storages?: OnboardingChannel[];
  defaults?: OnboardingDefaultsData;
  agents?: OnboardingAgent[];
  databases?: OnboardingDatabase[];
  project?: OnboardingProjectData;
  dbSettings?: Record<string, OnboardingDbSettings>;
};
```

- [ ] **Step 2: Create constants/steps.ts**

```typescript
// src/features/onboarding/constants/steps.ts
export const STEP_IDS = {
  LOGIN: "login",
  ACCOUNT_INFO: "account-info",
  SECURITY: "security",
  PREFERENCES: "preferences",
  ORG_CREATE: "org-create",
  INVITE_MEMBERS: "invite-members",
  NOTIFIER: "notifier",
  STORAGE: "storage",
  DEFAULTS: "defaults",
  AGENT_CREATE: "agent-create",
  AGENT_KEY: "agent-key",
  AGENT_WAITING: "agent-waiting",
  PROJECT_CREATE: "project-create",
  DB_SETTINGS: "db-settings",
  FINISH: "finish",
} as const;

export const STEP_ORDER: string[] = [
  STEP_IDS.LOGIN,
  STEP_IDS.ACCOUNT_INFO,
  STEP_IDS.SECURITY,
  STEP_IDS.PREFERENCES,
  STEP_IDS.ORG_CREATE,
  STEP_IDS.INVITE_MEMBERS,
  STEP_IDS.NOTIFIER,
  STEP_IDS.STORAGE,
  STEP_IDS.DEFAULTS,
  STEP_IDS.AGENT_CREATE,
  STEP_IDS.AGENT_KEY,
  STEP_IDS.AGENT_WAITING,
  STEP_IDS.PROJECT_CREATE,
  STEP_IDS.DB_SETTINGS,
  STEP_IDS.FINISH,
];
```

- [ ] **Step 3: Create schemas/account.schema.ts**

Extract the two schemas currently inline in `step-account-info.tsx`:

```typescript
// src/features/onboarding/schemas/account.schema.ts
import { z } from "zod";

export const BaseSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
});

export const WithPasswordSchema = BaseSchema.extend({
  password: z.string().min(8, "Min. 8 characters"),
});
```

- [ ] **Step 4: Update all 14 import paths**

In each file listed above, replace:
```typescript
from "@/features/onboarding/onboarding.types"
```
with:
```typescript
from "@/features/onboarding/types"
```

Also in `step-account-info.tsx`, replace the inline schema definitions with imports:
```typescript
import { BaseSchema, WithPasswordSchema } from "@/features/onboarding/schemas/account.schema";
```
And remove the two `const BaseSchema = ...` and `const WithPasswordSchema = ...` blocks.

- [ ] **Step 5: Update onboarding-shell.tsx to use constants**

Replace the hardcoded `STEP_ORDER` array with an import:

```typescript
// Replace this:
const STEP_ORDER = [
  "login",
  "account-info",
  ...
];

// With:
import { STEP_ORDER } from "@/features/onboarding/constants/steps";
```

- [ ] **Step 6: Delete onboarding.types.ts**

```bash
rm src/features/onboarding/onboarding.types.ts
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors, fix import paths.

- [ ] **Step 8: Commit**

```bash
git add src/features/onboarding/types/index.ts \
        src/features/onboarding/constants/steps.ts \
        src/features/onboarding/schemas/account.schema.ts \
        src/features/onboarding/onboarding-shell.tsx \
        src/features/onboarding/steps/ \
        src/features/onboarding/onboarding-state.ts
git commit -m "refactor(onboarding): move types, constants, schemas to sub-directories"
```

---

### Task 2: Agent hooks — useCreateAgent + useDeleteAgent

**Files:**
- Create: `src/features/onboarding/hooks/use-create-agent.ts`
- Create: `src/features/onboarding/hooks/use-delete-agent.ts`
- Modify: `src/features/onboarding/steps/step-agent-create.tsx`

**Interfaces:**
- Consumes: `createAgentAction` from `@/features/agents/agents.action`, `deleteAgentAction` from `@/features/agents/agent-delete.action`
- Produces: `useCreateAgent()` → `UseMutationResult<OnboardingAgent, Error, string>`, `useDeleteAgent()` → `UseMutationResult<void, Error, string>`

- [ ] **Step 1: Create use-create-agent.ts**

```typescript
// src/features/onboarding/hooks/use-create-agent.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { createAgentAction } from "@/features/agents/agents.action";
import type { OnboardingAgent, OnboardingDefaultsData } from "@/features/onboarding/types";

export const useCreateAgent = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (name: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      if (!orgId) throw new Error("Missing org ID — cannot create agent");

      const defaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
      const result = await createAgentAction({
        organizationId: orgId,
        data: { name, description: "" },
      });
      if (!result?.data?.data) {
        throw new Error(result?.serverError ?? `Failed to create agent "${name}"`);
      }

      const newAgent: OnboardingAgent = {
        id: result.data.data.id,
        name: result.data.data.name,
        notifierId: defaults.notifierId,
        storageId: defaults.storageId,
      };
      const agents = [
        ...((state?.context.flowData.agents ?? []) as OnboardingAgent[]),
        newAgent,
      ];
      await updateContext({ flowData: { ...state?.context.flowData, agents } });
      return newAgent;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 2: Create use-delete-agent.ts**

```typescript
// src/features/onboarding/hooks/use-delete-agent.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { deleteAgentAction } from "@/features/agents/agent-delete.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const useDeleteAgent = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await deleteAgentAction({ agentId, organizationId: orgId });
      if (result?.data?.success === false) throw new Error("Failed to delete agent");

      const agents = (
        (state?.context.flowData.agents ?? []) as OnboardingAgent[]
      ).filter((a) => a.id !== agentId);
      await updateContext({ flowData: { ...state?.context.flowData, agents } });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 3: Update step-agent-create.tsx**

Replace the full file content:

```typescript
// src/features/onboarding/steps/step-agent-create.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateAgent } from "@/features/onboarding/hooks/use-create-agent";
import { useDeleteAgent } from "@/features/onboarding/hooks/use-delete-agent";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentCreate = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];

  const [name, setName] = useState("");
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  const onAdd = () => {
    if (!name.trim()) return;
    createAgent.mutate(name.trim(), { onSuccess: () => setName("") });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Create an agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — agents will use your default notifier and storage.
        </p>
      </div>

      {agents.length > 0 && (
        <div className="flex flex-col gap-1">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm text-primary"
            >
              <span className="flex-1 truncate">{agent.name}</span>
              <button
                type="button"
                onClick={() => deleteAgent.mutate(agent.id)}
                disabled={deleteAgent.isPending}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="agent-prod"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          disabled={createAgent.isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={createAgent.isPending || !name.trim()}
        >
          {createAgent.isPending ? "Adding…" : "Add"}
        </Button>
      </div>

      <Button type="button" onClick={() => next()}>
        Continue
      </Button>
    </div>
  );
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/hooks/use-create-agent.ts \
        src/features/onboarding/hooks/use-delete-agent.ts \
        src/features/onboarding/steps/step-agent-create.tsx
git commit -m "refactor(onboarding): extract useCreateAgent and useDeleteAgent hooks"
```

---

### Task 3: Org + Project hooks

**Files:**
- Create: `src/features/onboarding/hooks/use-create-org.ts`
- Create: `src/features/onboarding/hooks/use-create-project.ts`
- Modify: `src/features/onboarding/steps/step-org-create.tsx`
- Modify: `src/features/onboarding/steps/step-project-create.tsx`

**Interfaces:**
- `useCreateOrg()` → `UseMutationResult<void, Error, string>` (mutate receives org name)
- `useCreateProject()` → `UseMutationResult<void, Error, { name: string; description: string; databaseIds: string[] }>`

- [ ] **Step 1: Create use-create-org.ts**

```typescript
// src/features/onboarding/hooks/use-create-org.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import {
  createOrganizationAction,
  updateOrganizationAction,
} from "@/features/organizations/organization.action";
import { slugify } from "@/utils/slugify";

export const useCreateOrg = () => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Organisation name is required");
      const existingOrg = state?.context.flowData.org;

      if (existingOrg) {
        const result = await updateOrganizationAction({
          organizationId: existingOrg.id,
          data: { name: trimmed, slug: slugify(trimmed), users: [] },
        });
        if (!result?.data?.success) {
          const err = result?.data as { success: false; actionError?: any };
          throw new Error(err?.actionError?.message ?? "Failed to update organisation");
        }
        await updateContext({
          flowData: { ...state?.context.flowData, org: { id: existingOrg.id, name: trimmed } },
        });
      } else {
        const result = await createOrganizationAction({ name: trimmed });
        if (!result?.data?.success) {
          const err = result?.data as { success: false; actionError?: any };
          throw new Error(err?.actionError?.message ?? "Failed to create organisation");
        }
        const org = result.data.value;
        if (!org) throw new Error("Failed to create organisation");
        await updateContext({
          flowData: { ...state?.context.flowData, org: { id: org.id, name: org.name } },
        });
      }
      await next();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 2: Update step-org-create.tsx**

```typescript
// src/features/onboarding/steps/step-org-create.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateOrg } from "@/features/onboarding/hooks/use-create-org";

export const StepOrgCreate = () => {
  const { state } = useOnboarding();
  const existingOrg = state?.context.flowData.org;
  const isEditMode = !!existingOrg;
  const [name, setName] = useState(existingOrg?.name ?? "");

  const mutation = useCreateOrg();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? "Edit your organisation" : "Create your organisation"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode ? "Rename your organisation." : "This step can't be skipped."}
        </p>
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
      <Button
        type="button"
        onClick={() => mutation.mutate(name)}
        disabled={!name.trim() || mutation.isPending}
      >
        {mutation.isPending
          ? isEditMode ? "Saving…" : "Creating…"
          : "Continue"}
      </Button>
    </div>
  );
};
```

- [ ] **Step 3: Create use-create-project.ts**

```typescript
// src/features/onboarding/hooks/use-create-project.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import {
  createProjectAction,
  updateProjectAction,
} from "@/features/projects/projects.action";
import type { OnboardingProjectData } from "@/features/onboarding/types";

type ProjectInput = { name: string; description: string; databaseIds: string[] };

export const useCreateProject = () => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async ({ name, description, databaseIds }: ProjectInput) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      if (!orgId) throw new Error("No organisation ID found");
      const existingProject = state?.context.flowData.project as OnboardingProjectData | undefined;

      if (existingProject?.id) {
        const result = await updateProjectAction({
          data: { name, databases: databaseIds },
          organizationId: orgId,
          projectId: existingProject.id,
        });
        if (!result?.data?.success) {
          throw new Error(result?.data?.actionError?.message ?? "Failed to update project");
        }
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            project: { id: existingProject.id, name, description, databaseIds },
          },
        });
      } else {
        const result = await createProjectAction({
          data: { name, databases: databaseIds },
          organizationId: orgId,
        });
        if (!result?.data?.success) {
          throw new Error(result?.data?.actionError?.message ?? "Failed to create project");
        }
        const project = result.data.value;
        if (!project) throw new Error("Failed to create project");
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            project: { id: project.id, name: project.name, description, databaseIds },
          },
        });
      }
      await next();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 4: Update step-project-create.tsx**

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
import { useCreateProject } from "@/features/onboarding/hooks/use-create-project";
import type { OnboardingDatabase, OnboardingProjectData } from "@/features/onboarding/types";

export const StepProjectCreate = () => {
  const { state } = useOnboarding();
  const existingProject = state?.context.flowData.project as OnboardingProjectData | undefined;
  const databases = (state?.context.flowData.databases ?? []) as OnboardingDatabase[];
  const isUpdateMode = !!existingProject;

  const [name, setName] = useState(existingProject?.name ?? "");
  const [description, setDescription] = useState(existingProject?.description ?? "");
  const [databaseIds, setDatabaseIds] = useState<string[]>(existingProject?.databaseIds ?? []);

  const mutation = useCreateProject();

  const toggleDb = (id: string) =>
    setDatabaseIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isUpdateMode ? "Update project" : "Create a project"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Optional — group databases under a project.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My project"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {databases.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Databases</Label>
          <div className="flex flex-col gap-2">
            {databases.map((db) => {
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
      )}
      <Button
        type="button"
        onClick={() => mutation.mutate({ name, description, databaseIds })}
        disabled={!name.trim() || mutation.isPending}
      >
        {mutation.isPending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
};
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/hooks/use-create-org.ts \
        src/features/onboarding/hooks/use-create-project.ts \
        src/features/onboarding/steps/step-org-create.tsx \
        src/features/onboarding/steps/step-project-create.tsx
git commit -m "refactor(onboarding): extract useCreateOrg and useCreateProject hooks"
```

---

### Task 4: Account hook

**Files:**
- Create: `src/features/onboarding/hooks/use-update-account.ts`
- Modify: `src/features/onboarding/steps/step-account-info.tsx`

**Interfaces:**
- `useUpdateAccount()` → `UseMutationResult<void, Error, z.infer<typeof WithPasswordSchema>>`

- [ ] **Step 1: Create use-update-account.ts**

```typescript
// src/features/onboarding/hooks/use-update-account.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient, signUp, passkey, signIn } from "@/lib/auth/auth-client";
import { updateAccountAction } from "@/features/onboarding/actions/update-account.action";
import { generatePasskeyContextAction } from "@/features/onboarding/actions/generate-passkey-context.action";
import { WithPasswordSchema } from "@/features/onboarding/schemas/account.schema";
import type { OnboardingMeta } from "@/features/onboarding/types";

type AccountInput = z.infer<typeof WithPasswordSchema>;

export const useUpdateAccount = (refetchSession: () => Promise<any>) => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async (values: AccountInput) => {
      const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
      const existingAccount = state?.context.flowData.account;
      const isUpdateMode = !!existingAccount;
      const passkeyEnabled = meta?.passkeyEnabled ?? false;

      if (isUpdateMode) {
        const result = await updateAccountAction({
          firstName: values.firstName,
          lastName: values.lastName,
        });
        if (!result?.data) throw new Error("Failed to update account");
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            account: { firstName: values.firstName, lastName: values.lastName, email: values.email },
          },
        });
        await next();
        return;
      }

      if (passkeyEnabled) {
        const name = `${values.firstName} ${values.lastName}`;
        const context = await generatePasskeyContextAction(name, values.email);
        const result = await passkey.addPasskey({ name: values.email, context });
        if (result?.error) {
          throw new Error(result.error.message ?? "Passkey registration failed");
        }
        await refetchSession();
        const { data: freshSession } = await authClient.getSession();
        if (!freshSession?.user) {
          const signInResult = await (signIn as any).passkey();
          if (signInResult?.error) {
            throw new Error("Registration succeeded but sign-in failed. Please reload and sign in.");
          }
        }
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            account: { firstName: values.firstName, lastName: values.lastName, email: values.email },
            security: { method: "passkey" },
          },
        });
        await next();
        return;
      }

      await signUp.email(
        {
          name: `${values.firstName} ${values.lastName}`,
          email: values.email,
          password: values.password ?? "",
        } as any,
        {
          onSuccess: async () => {
            await updateContext({
              flowData: {
                ...state?.context.flowData,
                account: { firstName: values.firstName, lastName: values.lastName, email: values.email },
              },
            });
            await next();
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 2: Update step-account-info.tsx**

```typescript
// src/features/onboarding/steps/step-account-info.tsx
"use client";

import { useEffect } from "react";
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
import { BaseSchema, WithPasswordSchema } from "@/features/onboarding/schemas/account.schema";
import { useUpdateAccount } from "@/features/onboarding/hooks/use-update-account";
import type { OnboardingMeta } from "@/features/onboarding/types";

export const StepAccountInfo = () => {
  const { next, state } = useOnboarding();
  const { data: session, refetch: refetchSession } = useSession();
  const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
  const existingAccount = state?.context.flowData.account;
  const isUpdateMode = !!existingAccount;
  const passkeyEnabled = meta?.passkeyEnabled ?? false;

  useEffect(() => {
    if (session?.user && !isUpdateMode) {
      next();
    }
  }, [session?.user?.id]);

  const schema = passkeyEnabled ? BaseSchema : WithPasswordSchema;
  const form = useZodForm({ schema }) as unknown as ReturnType<
    typeof useZodForm<typeof WithPasswordSchema>
  >;

  const mutation = useUpdateAccount(refetchSession);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isUpdateMode ? "Update your account" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">This step can&apos;t be skipped.</p>
      </div>
      <Form
        form={form}
        className="flex flex-col gap-4"
        onSubmit={async (values) => mutation.mutateAsync(values as any)}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            defaultValue={existingAccount?.firstName ?? ""}
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl><Input placeholder="John" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Doe" {...field} /></FormControl>
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
              <FormControl><Input placeholder="john@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!passkeyEnabled && !isUpdateMode && (
          <FormField
            control={form.control}
            name="password"
            defaultValue=""
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><PasswordInput placeholder="Min. 8 characters" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {isUpdateMode
            ? "Update account"
            : passkeyEnabled
              ? "Create account with passkey"
              : "Create account"}
        </Button>
      </Form>
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/hooks/use-update-account.ts \
        src/features/onboarding/steps/step-account-info.tsx
git commit -m "refactor(onboarding): extract useUpdateAccount hook"
```

---

### Task 5: Notifier hooks

**Files:**
- Create: `src/features/onboarding/hooks/use-add-notifier.ts`
- Create: `src/features/onboarding/hooks/use-remove-notifier.ts`
- Modify: `src/features/onboarding/steps/step-notifier.tsx`

**Interfaces:**
- `useAddNotifier()` → `UseMutationResult<OnboardingChannel, Error, { provider: string; name: string; config: Record<string, unknown>; label: string }>`
- `useRemoveNotifier()` → `UseMutationResult<void, Error, string>` (mutate receives channel id)

- [ ] **Step 1: Create use-add-notifier.ts**

```typescript
// src/features/onboarding/hooks/use-add-notifier.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { addNotificationChannelAction } from "@/features/channel/notifications/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

type NotifierInput = {
  provider: string;
  name: string;
  config: Record<string, unknown>;
  label: string;
};

export const useAddNotifier = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async ({ provider, name, config, label }: NotifierInput) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await addNotificationChannelAction({
        organizationId: orgId,
        data: { provider: provider as any, name, config, enabled: true },
      });
      const inner = result?.data;
      if (!inner?.success || !inner.value) throw new Error("Failed to save channel");

      const channel: OnboardingChannel = { id: inner.value.id, provider, label, name, config };
      const notifiers = [
        ...((state?.context.flowData.notifiers ?? []) as OnboardingChannel[]),
        channel,
      ];
      await updateContext({ flowData: { ...state?.context.flowData, notifiers } });
      return channel;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 2: Create use-remove-notifier.ts**

```typescript
// src/features/onboarding/hooks/use-remove-notifier.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { removeNotificationChannelAction } from "@/features/channel/notifications/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

export const useRemoveNotifier = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await removeNotificationChannelAction({
        organizationId: orgId,
        notificationChannelId: id,
      });
      if (result?.data?.success === false) throw new Error("Failed to remove channel");
      const notifiers = (
        (state?.context.flowData.notifiers ?? []) as OnboardingChannel[]
      ).filter((c) => c.id !== id);
      await updateContext({ flowData: { ...state?.context.flowData, notifiers } });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 3: Update step-notifier.tsx**

Replace the full file:

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
import { useAddNotifier } from "@/features/onboarding/hooks/use-add-notifier";
import { useRemoveNotifier } from "@/features/onboarding/hooks/use-remove-notifier";
import type { OnboardingChannel } from "@/features/onboarding/types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepNotifier = () => {
  const { next, updateContext, state } = useOnboarding();
  const notifiers = (state?.context.flowData.notifiers ?? []) as OnboardingChannel[];
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });
  const form = useZodForm({ schema: NotificationChannelFormSchema });

  const addNotifier = useAddNotifier();
  const removeNotifier = useRemoveNotifier();

  const startConfiguring = (provider: string) => {
    if (notifiers.some((c) => c.provider === provider)) return;
    form.reset({ provider, enabled: true, name: "", config: {} } as any);
    setPhase({ kind: "configuring", provider });
  };

  const onContinue = async () => {
    await updateContext({ flowData: { ...state?.context.flowData, notifiers } });
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
          <p className="flex-1 text-sm font-medium">Configuring {providerDetails?.label}</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPhase({ kind: "grid" })}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>
        <Form
          form={form}
          className="flex flex-col gap-4"
          onSubmit={async (values: any) => {
            const details = notificationProviders.find((p) => p.value === values.provider);
            addNotifier.mutate(
              {
                provider: values.provider,
                name: values.name,
                config: values.config,
                label: details?.label ?? values.provider,
              },
              {
                onSuccess: () => {
                  form.reset({ enabled: true } as any);
                  setPhase({ kind: "grid" });
                },
              },
            );
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
          <Button type="submit" disabled={addNotifier.isPending}>
            {addNotifier.isPending ? "Saving…" : "Add channel"}
          </Button>
        </Form>
      </div>
    );
  }

  const configuredProviderIds = notifiers.map((c) => c.provider);
  const availableProviders = notificationProviders.filter((p) => !p.preview);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Connect a notifier</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — get notified about backups, restores and health checks.
        </p>
      </div>

      {notifiers.length > 0 && (
        <div className="flex flex-col gap-1">
          {notifiers.map((ch) => {
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
                  {ch.name} <span className="opacity-60">({ch.label})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeNotifier.mutate(ch.id)}
                  disabled={removeNotifier.isPending}
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

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/hooks/use-add-notifier.ts \
        src/features/onboarding/hooks/use-remove-notifier.ts \
        src/features/onboarding/steps/step-notifier.tsx
git commit -m "refactor(onboarding): extract useAddNotifier and useRemoveNotifier hooks"
```

---

### Task 6: Storage hooks

**Files:**
- Create: `src/features/onboarding/hooks/use-add-storage.ts`
- Create: `src/features/onboarding/hooks/use-remove-storage.ts`
- Modify: `src/features/onboarding/steps/step-storage.tsx`

**Interfaces:**
- `useAddStorage()` → `UseMutationResult<OnboardingChannel, Error, { provider: string; name: string; config: Record<string, unknown>; label: string }>`
- `useRemoveStorage()` → `UseMutationResult<void, Error, string>`

- [ ] **Step 1: Create use-add-storage.ts**

```typescript
// src/features/onboarding/hooks/use-add-storage.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { addStorageChannelAction } from "@/features/channel/storages/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

type StorageInput = {
  provider: string;
  name: string;
  config: Record<string, unknown>;
  label: string;
};

export const useAddStorage = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async ({ provider, name, config, label }: StorageInput) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await addStorageChannelAction({
        organizationId: orgId,
        data: { provider: provider as any, name, config, enabled: true },
      });
      const inner = result?.data;
      if (!inner?.success || !inner.value) throw new Error("Failed to save storage");

      const channel: OnboardingChannel = { id: inner.value.id, provider, label, name, config };
      const storages = [
        ...((state?.context.flowData.storages ?? []) as OnboardingChannel[]),
        channel,
      ];
      await updateContext({ flowData: { ...state?.context.flowData, storages } });
      return channel;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 2: Create use-remove-storage.ts**

```typescript
// src/features/onboarding/hooks/use-remove-storage.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { removeStorageChannelAction } from "@/features/channel/storages/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

export const useRemoveStorage = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await removeStorageChannelAction({ organizationId: orgId, id });
      if (result?.data?.success === false) throw new Error("Failed to remove storage");
      const storages = (
        (state?.context.flowData.storages ?? []) as OnboardingChannel[]
      ).filter((c) => c.id !== id);
      await updateContext({ flowData: { ...state?.context.flowData, storages } });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

- [ ] **Step 3: Update step-storage.tsx**

Replace the full file:

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
import { useAddStorage } from "@/features/onboarding/hooks/use-add-storage";
import { useRemoveStorage } from "@/features/onboarding/hooks/use-remove-storage";
import type { OnboardingChannel } from "@/features/onboarding/types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepStorage = () => {
  const { next, updateContext, state } = useOnboarding();
  const storages = (state?.context.flowData.storages ?? []) as OnboardingChannel[];
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });
  const form = useZodForm({ schema: StorageChannelFormSchema });

  const addStorage = useAddStorage();
  const removeStorage = useRemoveStorage();

  const startConfiguring = (provider: string) => {
    if (storages.some((c) => c.provider === provider)) return;
    form.reset({ provider, enabled: true, name: "", config: {} } as any);
    setPhase({ kind: "configuring", provider });
  };

  const onContinue = async () => {
    await updateContext({ flowData: { ...state?.context.flowData, storages } });
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
          <p className="flex-1 text-sm font-medium">Configuring {providerDetails?.label}</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPhase({ kind: "grid" })}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>
        <Form
          form={form}
          className="flex flex-col gap-4"
          onSubmit={async (values: any) => {
            const details = storageProviders.find((p) => p.value === values.provider);
            addStorage.mutate(
              {
                provider: values.provider,
                name: values.name,
                config: values.config,
                label: details?.label ?? values.provider,
              },
              {
                onSuccess: () => {
                  form.reset({ enabled: true } as any);
                  setPhase({ kind: "grid" });
                },
              },
            );
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
          <Button type="submit" disabled={addStorage.isPending}>
            {addStorage.isPending ? "Saving…" : "Add storage"}
          </Button>
        </Form>
      </div>
    );
  }

  const availableProviders = storageProviders.filter((p) => !p.preview && p.value !== "local");
  const configuredProviderIds = storages.map((c) => c.provider);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Connect a storage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — choose where backups and files are stored.
        </p>
      </div>

      {storages.length > 0 && (
        <div className="flex flex-col gap-1">
          {storages.map((ch) => {
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
                  {ch.name} <span className="opacity-60">({ch.label})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeStorage.mutate(ch.id)}
                  disabled={removeStorage.isPending}
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

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/hooks/use-add-storage.ts \
        src/features/onboarding/hooks/use-remove-storage.ts \
        src/features/onboarding/steps/step-storage.tsx
git commit -m "refactor(onboarding): extract useAddStorage and useRemoveStorage hooks"
```

---

### Task 7: Agent status + edge key hooks

**Files:**
- Create: `src/features/onboarding/hooks/use-agent-status.ts`
- Create: `src/features/onboarding/hooks/use-generate-edge-key.ts`
- Modify: `src/features/onboarding/steps/step-agent-waiting.tsx`
- Modify: `src/features/onboarding/steps/step-agent-key.tsx`

**Interfaces:**
- `useAgentStatus()` → `UseQueryResult<{ connected: boolean }, Error>`
- `useGenerateEdgeKey(agentId: string)` → `UseQueryResult<string, Error>`

- [ ] **Step 1: Create use-agent-status.ts**

```typescript
// src/features/onboarding/hooks/use-agent-status.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { getAgentStatusAction } from "@/features/onboarding/actions/get-agent-status.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const useAgentStatus = () => {
  const { state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
  const firstAgentId = agents[0]?.id;

  return useQuery({
    queryKey: ["onboarding-agent-status", firstAgentId],
    queryFn: async () => {
      if (!firstAgentId) return { connected: false };
      const result = await getAgentStatusAction({ agentId: firstAgentId });
      return result?.data ?? { connected: false };
    },
    refetchInterval: 3_000,
    enabled: !!firstAgentId,
  });
};
```

- [ ] **Step 2: Update step-agent-waiting.tsx**

```typescript
// src/features/onboarding/steps/step-agent-waiting.tsx
"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Loader2 } from "lucide-react";
import { useAgentStatus } from "@/features/onboarding/hooks/use-agent-status";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentWaiting = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
  const { data } = useAgentStatus();

  useEffect(() => {
    if (data?.connected) {
      next();
    }
  }, [data?.connected, next]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <h1 className="text-xl font-semibold">Waiting for your agent</h1>
      <p className="text-sm text-muted-foreground">Checking connectivity every 3 seconds…</p>
      {agents.length > 0 && (
        <p className="text-xs text-muted-foreground">Agent: {agents[0].name}</p>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Create use-generate-edge-key.ts**

```typescript
// src/features/onboarding/hooks/use-generate-edge-key.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { generateEdgeKeyAction } from "@/features/onboarding/actions/generate-edge-key.action";

export const useGenerateEdgeKey = (agentId: string) => {
  return useQuery({
    queryKey: ["onboarding-edge-key", agentId],
    queryFn: async () => {
      const result = await generateEdgeKeyAction({ agentId });
      if (!result?.data?.key) throw new Error("Failed to generate key");
      return result.data.key;
    },
    staleTime: Infinity,
    enabled: !!agentId,
  });
};
```

- [ ] **Step 4: Update step-agent-key.tsx**

```typescript
// src/features/onboarding/steps/step-agent-key.tsx
"use client";

import { useOnboarding } from "@onboardjs/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeSnippet } from "@/components/common/code-snippet";
import { useGenerateEdgeKey } from "@/features/onboarding/hooks/use-generate-edge-key";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentKey = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Connect your agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run the command below on your server. The next step waits for the agent to connect.
        </p>
      </div>
      {agents.map((agent) => (
        <AgentKeyBlock key={agent.id} agent={agent} />
      ))}
      <Button type="button" onClick={() => next()}>
        I&apos;ve run the command →
      </Button>
    </div>
  );
};

const AgentKeyBlock = ({ agent }: { agent: OnboardingAgent }) => {
  const { data, isLoading } = useGenerateEdgeKey(agent.id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Generating key for {agent.name}…
      </div>
    );
  }

  const command = `portabase agent "${agent.name}" --key ${data}`;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
      <p className="text-sm font-medium">{agent.name}</p>
      <CodeSnippet title="Installation Command" code={command} />
      <CodeSnippet title="Agent Key (manual)" code={data ?? ""} />
    </div>
  );
};
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/hooks/use-agent-status.ts \
        src/features/onboarding/hooks/use-generate-edge-key.ts \
        src/features/onboarding/steps/step-agent-waiting.tsx \
        src/features/onboarding/steps/step-agent-key.tsx
git commit -m "refactor(onboarding): extract useAgentStatus and useGenerateEdgeKey hooks"
```

---

### Task 8: Mark-done hook

**Files:**
- Create: `src/features/onboarding/hooks/use-mark-onboarding-done.ts`
- Modify: `src/features/onboarding/steps/step-finish.tsx`

**Interfaces:**
- `useMarkOnboardingDone()` → `UseMutationResult<unknown, Error, void>`

- [ ] **Step 1: Create use-mark-onboarding-done.ts**

```typescript
// src/features/onboarding/hooks/use-mark-onboarding-done.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { markOnboardingDoneAction } from "@/features/onboarding/actions/onboarding-mark-done.action";

export const useMarkOnboardingDone = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await markOnboardingDoneAction({});
      if (!result?.data) throw new Error("Failed to mark onboarding done");
      return result.data;
    },
  });
};
```

- [ ] **Step 2: Update step-finish.tsx**

```typescript
// src/features/onboarding/steps/step-finish.tsx
"use client";

import { useEffect, useRef } from "react";
import { useOnboarding } from "@onboardjs/react";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkOnboardingDone } from "@/features/onboarding/hooks/use-mark-onboarding-done";

export const StepFinish = () => {
  const { next } = useOnboarding();
  const fired = useRef(false);
  const mutation = useMarkOnboardingDone();

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
      <CheckCircle2 className="size-16 text-green-500" />
      <h1 className="text-2xl font-semibold">You&apos;re all set!</h1>
      <p className="text-sm text-muted-foreground">Your workspace is ready to use.</p>
      <Button
        type="button"
        disabled={mutation.isPending}
        onClick={async () => {
          await mutation.mutateAsync();
          await next();
        }}
      >
        Go to dashboard
      </Button>
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Delete .gitkeep files now that directories are populated**

```bash
rm src/features/onboarding/constants/.gitkeep
rm src/features/onboarding/hooks/.gitkeep
rm src/features/onboarding/schemas/.gitkeep
rm src/features/onboarding/types/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/hooks/use-mark-onboarding-done.ts \
        src/features/onboarding/steps/step-finish.tsx
git add -u src/features/onboarding/constants/ \
           src/features/onboarding/hooks/ \
           src/features/onboarding/schemas/ \
           src/features/onboarding/types/
git commit -m "refactor(onboarding): extract useMarkOnboardingDone hook, remove .gitkeep files"
```
