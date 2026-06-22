"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BackupScheduleSelector,
  type BackupScheduleValue,
} from "@/features/onboarding/components/backup-schedule-selector";
import { DEFAULT_SCHEDULE } from "@/features/onboarding/constants/db-settings";
import type { OnboardingDbSettings } from "@/features/onboarding/types";

type SchedulingSectionProps = {
  initial: Pick<OnboardingDbSettings, "backupMethod" | "backupCron">;
  onSave: (method: "manual" | "automatic", cron?: string) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

export const SchedulingSection = ({
  initial,
  onSave,
  onBack,
  isPending,
}: SchedulingSectionProps) => {
  const [schedule, setSchedule] = useState<BackupScheduleValue>({
    method: initial.backupMethod ?? DEFAULT_SCHEDULE.method,
    cron: initial.backupCron ?? DEFAULT_SCHEDULE.cron,
  });

  return (
    <div className="flex flex-col gap-6">
      <BackupScheduleSelector value={schedule} onChange={setSchedule} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onSave(schedule.method, schedule.cron)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};
