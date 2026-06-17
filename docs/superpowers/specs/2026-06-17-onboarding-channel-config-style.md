# Onboarding Channel Config + Style Refactor

**Date:** 2026-06-17  
**Branch:** poc/onboarding-setup  
**Scope:** Two concerns:
1. Notifier/storage steps gain a real two-phase configuration flow (fake data, stored in flowData)
2. All onboarding step cards, toggles, and inputs adopt the org-combobox design language

---

## 1. Configuration Flow — Notifier & Storage Steps

### Goal

When a user clicks a provider in the notifier or storage step, they should be able to configure it (Slack webhook URL, S3 credentials, etc.) before it is added to their list. Data is stored in `flowData` only — no server actions are called during onboarding.

### Phase Machine

Each step manages a local phase:

```ts
type Phase =
  | { kind: "grid" }
  | { kind: "configuring"; provider: string }
```

**Phase "grid"**
- Shows the provider selection grid (style: see Section 2)
- Already-configured providers show at top with check badge and remove button
- Unconfigured providers are clickable → transition to `configuring`
- "Continue" button visible if at least 0 channels configured (step is optional)
- "Add another" link/button visible when at least 1 configured

**Phase "configuring"**
- Header: provider icon + name + "Back" button (returns to grid, no save)
- Channel name `Input` (required, min 5 chars per existing schema)
- `renderChannelForm(provider, form)` renders the provider-specific fields
- `useZodForm` with `NotificationChannelFormSchema` (notifier) or `StorageChannelFormSchema` (storage)
- Submit validates → appends `{ id: crypto.randomUUID(), provider, label, name, config }` to local channels list → returns to grid phase
- No server action called

### Updated `OnboardingChannel` type

```ts
export type OnboardingChannel = {
    id: string;
    provider: string;
    label: string;
    name: string;
    config: Record<string, unknown>;
};
```

`step-defaults.tsx` reads `id` and `label` from notifiers/storages — unchanged, continues to work.

### Files

- `src/features/onboarding/onboarding.types.ts` — extend `OnboardingChannel`
- `src/features/onboarding/steps/step-notifier.tsx` — full rewrite
- `src/features/onboarding/steps/step-storage.tsx` — full rewrite

### Dependencies reused

- `renderChannelForm` from `@/features/channel/channels-helpers`
- `NotificationChannelFormSchema` / `StorageChannelFormSchema` from `@/features/channel/channel-form.schema`
- `useZodForm`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@/components/ui/form`
- `notificationProviders` / `storageProviders` from their respective helpers

---

## 2. Style Refactor — All Onboarding Steps

### Goal

Replace hardcoded dark colors and inconsistent `<button>` styling across all step components with design-system tokens matching the org-combobox visual language.

### Design Tokens

**Toggle/selection cards** (provider cards, theme buttons, DB toggles, SSO buttons, security method buttons):

| State    | Classes |
|----------|---------|
| Inactive | `border border-border rounded-lg hover:bg-accent/50 hover:border-primary/20 transition-colors` |
| Active   | `border border-primary/20 bg-primary/10 text-primary rounded-lg` |

**Icon container** (inside provider cards):
```
size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center
```

**Check badge** (selected state on provider cards):
```
size-5 rounded-full bg-primary flex items-center justify-center ml-auto
  → Check className="size-3 text-primary-foreground" strokeWidth={3}
```

**Inputs** (`Input`, `Textarea`): already shadcn — remove any hardcoded color overrides. No component change.

**Navigation buttons** (`Button` shadcn variants `default`/`outline`/`ghost`): unchanged, already correct.

**Shell** (`onboarding-shell.tsx`): `bg-zinc-950`/`bg-zinc-900` intentionally kept dark — not changed.

### Files Affected

| File | Change |
|------|--------|
| `step-sso-gate.tsx` | SSO provider buttons → toggle card style |
| `step-security.tsx` | Passkey/2FA method buttons → toggle card style |
| `step-preferences.tsx` | Theme toggle buttons → toggle card style |
| `step-project-create.tsx` | DB toggle buttons → toggle card style |
| `step-notifier.tsx` | Provider cards → toggle card style (done as part of config flow rewrite) |
| `step-storage.tsx` | Provider cards → toggle card style (done as part of config flow rewrite) |
| `step-invite-members.tsx` | Audit for hardcoded colors, clean if needed |
| `step-agent-create.tsx` | Audit for hardcoded colors, clean if needed |

---

## 3. Conditional Step Graph — Skip Agent Steps When No Agents

### Rule

If the user skips or submits `agent-create` with zero agents (`flowData.agents` empty or undefined), skip `agent-waiting`, `project-create`, and `db-settings` — jump directly to `finish`.

### Step Graph Change

`onboarding-steps.tsx` — `agent-create` entry:

```ts
{
    id: "agent-create",
    component: StepAgentCreate,
    isSkippable: true,
    nextStep: (ctx) => {
        const agents = ctx.flowData?.agents as unknown[] | undefined;
        return agents && agents.length > 0 ? "agent-waiting" : "finish";
    },
}
```

All other steps unchanged.

### Rationale

- `agent-waiting` pings the agent — no agent to ping
- `project-create` groups databases under an agent project — no agent, no project
- `db-settings` configures agent DB retention — no project selected, empty state anyway

### Files

- `src/features/onboarding/onboarding-steps.tsx` — update `agent-create.nextStep`

---

## Out of Scope

- Server actions / real DB persistence during onboarding (fake data only)
- `step-account-info.tsx`, `step-org-create.tsx`, `step-defaults.tsx`, `step-agent-waiting.tsx`, `step-finish.tsx` — no toggle cards, no hardcoded colors
- `onboarding-shell.tsx` background colors — intentionally dark
- Any changes outside `src/features/onboarding/`

---

## Acceptance Criteria

1. Clicking a provider in notifier/storage step → shows config form with correct provider-specific fields
2. Submit config form → validates with existing schema → provider appears in grid with check badge and remove button
3. Continue → saves all configured channels (with `name` + `config`) to `flowData.notifiers` / `flowData.storages`
4. All toggle cards across steps use design-system tokens (no `border-white/10`, no hardcoded bg)
5. `step-defaults.tsx` selects still work (reads `id` + `label` from channels)
6. `pnpm exec tsc --noEmit` — no new errors in onboarding files
7. Skip agent-create with 0 agents → jumps to finish (agent-waiting, project-create, db-settings not shown)
8. Create agents → normal flow through agent-waiting → project-create → db-settings → finish
