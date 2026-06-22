"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DEFAULT_RETENTION } from "@/features/onboarding/constants/db-settings";
import type { OnboardingDbSettings } from "@/features/onboarding/types";

type RetentionSectionProps = {
  initial: OnboardingDbSettings["retention"];
  onSave: (
    value: NonNullable<OnboardingDbSettings["retention"]>,
  ) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

export const RetentionSection = ({
  initial,
  onSave,
  onBack,
  isPending,
}: RetentionSectionProps) => {
  const [settings, setSettings] = useState<
    NonNullable<OnboardingDbSettings["retention"]>
  >(initial ?? DEFAULT_RETENTION);

  const totalFiles = () => {
    if (settings.type === "gfs") {
      return (
        settings.gfs.daily +
        settings.gfs.weekly +
        settings.gfs.monthly +
        settings.gfs.yearly
      );
    }
    return settings.type === "count" ? settings.count : settings.days;
  };

  const storageEstimate = () => {
    const t = totalFiles();
    if (t <= 10) return "Low";
    if (t <= 30) return "Medium";
    return "High";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium">Retention Policy Type</Label>
        <RadioGroup
          value={settings.type ?? ""}
          onValueChange={(v) =>
            setSettings((prev) => ({
              ...prev,
              type: v as "count" | "days" | "gfs",
            }))
          }
          className="grid grid-cols-1 gap-4"
        >
          {[
            {
              id: "count",
              label: "Keep last N backups",
              desc: "Simple count-based retention (e.g., keep last 10 backups)",
            },
            {
              id: "days",
              label: "Keep backups for X days",
              desc: "Time-based retention (e.g., keep backups for 30 days)",
            },
            {
              id: "gfs",
              label: "GFS Rotation",
              desc: "Grandfather-Father-Son rotation for enterprise/critical systems",
              badge: "Recommended",
            },
          ].map((opt) => (
            <Label
              key={opt.id}
              htmlFor={opt.id}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                settings.type === opt.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={opt.id} id={opt.id} />
              <div className="flex-1">
                <span className="font-medium flex items-center gap-2">
                  {opt.label}
                  {opt.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {opt.badge}
                    </Badge>
                  )}
                </span>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {settings.type && <Separator />}

      {settings.type === "count" && (
        <div className="space-y-2">
          <Label htmlFor="backup-count">Number of backups to keep</Label>
          <Input
            id="backup-count"
            type="number"
            min={1}
            max={100}
            className="w-32"
            value={settings.count}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                count: parseInt(e.target.value) || 1,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Older backups beyond this count will be automatically deleted.
          </p>
        </div>
      )}

      {settings.type === "days" && (
        <div className="space-y-2">
          <Label htmlFor="retention-days">Retention period (days)</Label>
          <Input
            id="retention-days"
            type="number"
            min={1}
            max={3650}
            className="w-32"
            value={settings.days}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                days: parseInt(e.target.value) || 1,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Backups older than {settings.days} days will be automatically
            deleted.
          </p>
        </div>
      )}

      {settings.type === "gfs" && (
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              { key: "daily", label: "Daily backups", min: 1, max: 31 },
              { key: "weekly", label: "Weekly backups", min: 0, max: 52 },
              { key: "monthly", label: "Monthly backups", min: 0, max: 120 },
              { key: "yearly", label: "Yearly backups", min: 0, max: 50 },
            ] as const
          ).map(({ key, label, min, max }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={settings.gfs[key]}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    gfs: { ...prev.gfs, [key]: parseInt(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Keep N {key} backups
              </p>
            </div>
          ))}
        </div>
      )}

      {settings.type && (
        <>
          <Separator />
          <div className="rounded-lg border p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Storage Impact</span>
              <Badge
                variant={
                  storageEstimate() === "Low"
                    ? "default"
                    : storageEstimate() === "Medium"
                      ? "secondary"
                      : "destructive"
                }
              >
                {storageEstimate()} Usage
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ~{totalFiles()} backup files per database
            </p>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={!settings.type || isPending}
          onClick={() => onSave(settings)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};
