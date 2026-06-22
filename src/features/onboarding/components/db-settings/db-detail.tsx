"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Copy,
  Database,
  HardDrive,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  OnboardingDatabase,
  SectionKind,
} from "@/features/onboarding/types";

const SECTIONS: { kind: SectionKind; label: string; icon: React.ReactNode }[] =
  [
    {
      kind: "retention",
      label: "Retention Policy",
      icon: <Shield className="size-4 text-muted-foreground" />,
    },
    {
      kind: "scheduling",
      label: "Scheduling",
      icon: <Clock className="size-4 text-muted-foreground" />,
    },
    {
      kind: "notifications",
      label: "Notifications",
      icon: <Bell className="size-4 text-muted-foreground" />,
    },
    {
      kind: "storage",
      label: "Storage",
      icon: <HardDrive className="size-4 text-muted-foreground" />,
    },
  ];

type DbDetailProps = {
  db: OnboardingDatabase | undefined;
  dbId: string;
  isSectionConfigured: (section: SectionKind) => boolean;
  isMultiDb: boolean;
  hasAnyConfigured: boolean;
  isApplyingToAll: boolean;
  onSelectSection: (section: SectionKind) => void;
  onApplyToAll: () => Promise<void>;
  onBack: () => void;
};

export const DbDetail = ({
  db,
  dbId,
  isSectionConfigured,
  isMultiDb,
  hasAnyConfigured,
  isApplyingToAll,
  onSelectSection,
  onApplyToAll,
  onBack,
}: DbDetailProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
      <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
        <Database className="size-4" />
      </div>
      <p className="flex-1 text-sm font-medium capitalize">
        {db?.name ?? dbId}{" "}
        <span className="text-muted-foreground font-normal">
          ({db?.engine})
        </span>
      </p>
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>
    </div>

    <div className="flex flex-col gap-2">
      {SECTIONS.map(({ kind, label, icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onSelectSection(kind)}
          className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-all text-left hover:bg-accent/50 hover:border-primary/20"
        >
          <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="flex-1 font-medium">{label}</span>
          {isSectionConfigured(kind) && (
            <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto shrink-0">
              <Check
                className="size-3 text-primary-foreground"
                strokeWidth={3}
              />
            </div>
          )}
        </button>
      ))}
    </div>

    {isMultiDb && hasAnyConfigured && (
      <Button
        type="button"
        variant="outline"
        disabled={isApplyingToAll}
        onClick={onApplyToAll}
      >
        <Copy className="size-4 mr-2" />
        {isApplyingToAll ? "Applying…" : "Apply to all databases"}
      </Button>
    )}
  </div>
);
