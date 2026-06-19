# Onboarding Theme Persistence & Progress Bar Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two independent bugs in the onboarding flow — theme not persisted to DB on selection, and progress bar not reflecting the user's true position in the full 15-step flow.

**Architecture:** Two surgical edits in two separate files. Task 1 adds a single `authClient.updateUser({ theme })` call in `StepPreferences`. Task 2 replaces OnboardJS-relative progress values in `OnboardingStepper` with a manual calculation based on `STEP_ORDER`.

**Tech Stack:** Next.js (App Router), React, TypeScript, OnboardJS (`@onboardjs/react`), `next-themes`, `better-auth` (`authClient`)

## Global Constraints

- TypeScript — no `any` introduced, no type assertions added
- No new dependencies
- No API, schema, or DB migration changes
- Follow existing import alias `@/` for all internal imports
- Commits in English, conventional-commits format (`fix:`)

---

### Task 1: Persist theme to DB on selection in StepPreferences

**Files:**
- Modify: `src/features/onboarding/steps/step-preferences.tsx` (lines ~51-61)

**Interfaces:**
- Consumes: `authClient.updateUser` from `@/lib/auth/auth-client` (already imported in the file)
- Produces: nothing consumed by Task 2

- [ ] **Step 1: Locate the `selectTheme` function**

  Open `src/features/onboarding/steps/step-preferences.tsx`. Find the `selectTheme` function (~line 51). It currently reads:

  ```ts
  const selectTheme = async (theme: ThemeKey) => {
    // Apply immediately to the UI
    setTheme(theme);
    //mettre à jour aussi en db!
    await updateContext({
      flowData: {
        ...state?.context.flowData,
        preferences: { ...preferences, theme },
      },
    });
  };
  ```

- [ ] **Step 2: Add `authClient.updateUser({ theme })` call**

  Replace the `selectTheme` function with:

  ```ts
  const selectTheme = async (theme: ThemeKey) => {
    // Apply immediately to the UI
    setTheme(theme);
    // Persist to DB so it survives page reload
    await authClient.updateUser({ theme });
    await updateContext({
      flowData: {
        ...state?.context.flowData,
        preferences: { ...preferences, theme },
      },
    });
  };
  ```

  Note: `authClient` is already imported at the top of the file (`import { authClient } from "@/lib/auth/auth-client";`). No new import needed.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  cd /path/to/portabase && pnpm tsc --noEmit 2>&1 | grep step-preferences
  ```

  Expected: no output (no errors on that file).

- [ ] **Step 4: Manual smoke test**

  1. Start the dev server: `pnpm dev`
  2. Open the onboarding flow in the browser
  3. Navigate to the **Preferences** step
  4. Click a theme (e.g. **Light**)
  5. Verify the UI switches immediately
  6. Open the Network tab → confirm a `PATCH` (or `POST`) request to the auth user update endpoint was made with `theme: "light"` in the payload
  7. Hard-reload the page → theme should persist

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/onboarding/steps/step-preferences.tsx
  git commit -m "fix(onboarding): persist theme to db on selection in StepPreferences"
  ```

---

### Task 2: Fix progress bar to reflect full 15-step position

**Files:**
- Modify: `src/features/onboarding/onboarding-stepper.tsx`

**Interfaces:**
- Consumes: `STEP_ORDER` from `@/features/onboarding/constants/steps` (already exported, already used in `onboarding-shell.tsx`)
- Produces: nothing consumed by Task 1

- [ ] **Step 1: Open the current stepper**

  Open `src/features/onboarding/onboarding-stepper.tsx`. It currently reads:

  ```tsx
  "use client";

  import { useOnboarding } from "@onboardjs/react";
  import { Progress } from "@/components/ui/progress";

  export const OnboardingStepper = () => {
    const { state } = useOnboarding();

    if (!state) return null;

    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {state.currentStepNumber} of {state.totalSteps}
          </span>
          <span>{Math.round(state.progressPercentage)}%</span>
        </div>
        <Progress value={state.progressPercentage} />
      </div>
    );
  };
  ```

- [ ] **Step 2: Replace with STEP_ORDER-based calculation**

  Replace the entire file content with:

  ```tsx
  "use client";

  import { useOnboarding } from "@onboardjs/react";
  import { Progress } from "@/components/ui/progress";
  import { STEP_ORDER } from "@/features/onboarding/constants/steps";

  export const OnboardingStepper = () => {
    const { state } = useOnboarding();

    if (!state) return null;

    const currentId = String(state.currentStep?.id ?? "");
    const currentIndex = Math.max(0, STEP_ORDER.indexOf(currentId));
    const totalSteps = STEP_ORDER.length;
    const stepNumber = currentIndex + 1;
    const progress = Math.round((currentIndex / (totalSteps - 1)) * 100);

    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {stepNumber} of {totalSteps}
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    );
  };
  ```

  **Why `Math.max(0, ...)`:** If `currentId` is not in `STEP_ORDER` (unknown step), `indexOf` returns `-1`. Clamping to `0` gives a safe fallback of "Step 1 of 15 — 0%" rather than a negative/NaN value.

  **Why `totalSteps - 1` in the divisor:** At `login` (index 0) → 0%. At `finish` (index 14) → 14/14 = 100%. Without the `-1` the last step would be 93%.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  pnpm tsc --noEmit 2>&1 | grep onboarding-stepper
  ```

  Expected: no output.

- [ ] **Step 4: Manual smoke test**

  1. Simulate resuming onboarding mid-flow (e.g. log out, log back in as a user who already has an org — should resume at `invite-members`, index 5)
  2. Verify the stepper shows **"Step 6 of 15 — 36%"** and the progress bar is ~1/3 filled
  3. Click through a few steps and verify the number and percentage increase correctly each time
  4. Reach the `finish` step and verify **"Step 15 of 15 — 100%"**

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/onboarding/onboarding-stepper.tsx
  git commit -m "fix(onboarding): recalculate progress bar from full STEP_ORDER position"
  ```
