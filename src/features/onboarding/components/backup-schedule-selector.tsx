"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AdvancedCronSelect } from "@/features/database/cron-advanced-select";

export type BackupScheduleValue = {
  method: "manual" | "automatic";
  cron?: string;
};

const PRESETS = [
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every day", cron: "0 0 * * *" },
  { label: "Every week", cron: "0 0 * * 0" },
  { label: "Custom", cron: "custom" },
] as const;

type PresetCron = (typeof PRESETS)[number]["cron"];

function detectPreset(cron: string | undefined): PresetCron {
  const match = PRESETS.find((p) => p.cron !== "custom" && p.cron === cron);
  return match ? match.cron : "custom";
}

type BackupScheduleSelectorProps = {
  value: BackupScheduleValue;
  onChange: (value: BackupScheduleValue) => void;
};

export const BackupScheduleSelector = ({
  value,
  onChange,
}: BackupScheduleSelectorProps) => {
  const [customCron, setCustomCron] = useState<string>(
    value.cron ?? "0 0 * * *",
  );

  const selectedPreset = detectPreset(value.cron);
  const isCustom = selectedPreset === "custom";

  const handleMethodChange = (method: "manual" | "automatic") => {
    onChange({
      method,
      cron: method === "manual" ? undefined : (value.cron ?? "0 0 * * *"),
    });
  };

  const handlePresetChange = (preset: PresetCron) => {
    if (preset === "custom") {
      onChange({ ...value, cron: customCron });
    } else {
      onChange({ ...value, cron: preset });
    }
  };

  const handleCronPartChange = (
    type: "minute" | "hour" | "day-of-month" | "month" | "day-of-week",
    part: string,
  ) => {
    const indexMap: Record<typeof type, number> = {
      minute: 0,
      hour: 1,
      "day-of-month": 2,
      month: 3,
      "day-of-week": 4,
    };
    const parts = (customCron || "0 0 * * *").split(" ");
    parts[indexMap[type]] = part;
    const newCron = parts.join(" ");
    setCustomCron(newCron);
    onChange({ ...value, cron: newCron });
  };

  const cronParts = (value.cron ?? customCron).split(" ");

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup
        value={value.method}
        onValueChange={(m) => handleMethodChange(m as "manual" | "automatic")}
        className="grid grid-cols-1 gap-3"
      >
        {(
          [
            {
              id: "manual",
              label: "Manual",
              desc: "Backups triggered manually only",
            },
            {
              id: "automatic",
              label: "Automatic",
              desc: "Scheduled via cron expression",
            },
          ] as const
        ).map((opt) => (
          <Label
            key={opt.id}
            htmlFor={opt.id}
            className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              value.method === opt.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <RadioGroupItem value={opt.id} id={opt.id} />
            <div className="flex-1">
              <span className="font-medium">{opt.label}</span>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </div>
          </Label>
        ))}
      </RadioGroup>

      {value.method === "automatic" && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Frequency</Label>
              <Select
                value={selectedPreset}
                onValueChange={(v) => handlePresetChange(v as PresetCron)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.cron} value={p.cron}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <div className="flex flex-col gap-2 pl-1">
                {(
                  [
                    {
                      type: "minute",
                      label: "Minute",
                      options: Array.from({ length: 60 }, (_, i) =>
                        String(i).padStart(2, "0"),
                      ),
                      partIdx: 0,
                    },
                    {
                      type: "hour",
                      label: "Hour",
                      options: Array.from({ length: 24 }, (_, i) =>
                        String(i).padStart(2, "0"),
                      ),
                      partIdx: 1,
                    },
                    {
                      type: "day-of-month",
                      label: "Day of Month",
                      options: Array.from({ length: 31 }, (_, i) =>
                        String(i + 1).padStart(2, "0"),
                      ),
                      partIdx: 2,
                    },
                    {
                      type: "month",
                      label: "Month",
                      options: [
                        "01",
                        "02",
                        "03",
                        "04",
                        "05",
                        "06",
                        "07",
                        "08",
                        "09",
                        "10",
                        "11",
                        "12",
                      ],
                      partIdx: 3,
                    },
                    {
                      type: "day-of-week",
                      label: "Day of Week",
                      options: ["0", "1", "2", "3", "4", "5", "6"],
                      partIdx: 4,
                    },
                  ] as const
                ).map(({ type, label, options, partIdx }) => (
                  <AdvancedCronSelect
                    key={type}
                    id={type}
                    label={label}
                    options={[...options]}
                    type={type}
                    value={cronParts[partIdx] ?? "*"}
                    defaultValue={cronParts[partIdx] ?? "*"}
                    onValueChange={(val) =>
                      handleCronPartChange(
                        type as
                          | "minute"
                          | "hour"
                          | "day-of-month"
                          | "month"
                          | "day-of-week",
                        val,
                      )
                    }
                  />
                ))}
              </div>
            )}

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
              {value.cron ?? "0 0 * * *"}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
