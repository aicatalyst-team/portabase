"use client";

import { useState } from "react";
import { ArrowLeft, HardDrive, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import type {
  OnboardingChannel,
  OnboardingStoragePolicy,
} from "@/features/onboarding/types";

type StorageSectionProps = {
  initial: OnboardingStoragePolicy[];
  storages: OnboardingChannel[];
  onSave: (policies: OnboardingStoragePolicy[]) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

export const StorageSection = ({
  initial,
  storages,
  onSave,
  onBack,
  isPending,
}: StorageSectionProps) => {
  const [policies, setPolicies] = useState<OnboardingStoragePolicy[]>(initial);

  const addPolicy = () =>
    setPolicies((prev) => [...prev, { channelId: "", enabled: true }]);

  const removePolicy = (index: number) =>
    setPolicies((prev) => prev.filter((_, i) => i !== index));

  const updatePolicy = (
    index: number,
    patch: Partial<OnboardingStoragePolicy>,
  ) =>
    setPolicies((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );

  const selectedChannelIds = policies.map((p) => p.channelId).filter(Boolean);

  if (storages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
          <HardDrive className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-sm">No storages configured</p>
          <p className="text-xs text-muted-foreground">
            Go back and configure storages in the &quot;Connect a storage&quot;
            step first.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Storage Policies</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={policies.length >= storages.length}
          onClick={addPolicy}
        >
          <Plus className="size-4 mr-1" />
          Add Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/20 text-center gap-1">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Policy&quot; to assign a storage to this database.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((policy, index) => {
            const available = storages.filter(
              (s) =>
                s.id === policy.channelId || !selectedChannelIds.includes(s.id),
            );
            const selected = storages.find((s) => s.id === policy.channelId);

            return (
              <Card
                key={policy.channelId || index}
                className="p-4 flex items-end gap-2"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Storage Channel
                  </Label>
                  <Select
                    value={policy.channelId}
                    onValueChange={(v) => updatePolicy(index, { channelId: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select storage">
                        {selected && (
                          <div className="flex items-center gap-2">
                            {getChannelIcon(selected.provider)}
                            <span className="truncate font-medium text-sm">
                              {selected.name}
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(s.provider)}
                            <span>{s.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Status
                  </Label>
                  <div className="flex items-center h-9 px-3 rounded-md border border-input bg-background gap-2">
                    <Label className="text-xs cursor-pointer">
                      {policy.enabled ? "Active" : "Off"}
                    </Label>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={(v) =>
                        updatePolicy(index, { enabled: v })
                      }
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 shrink-0"
                  onClick={() => removePolicy(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={isPending || policies.some((p) => !p.channelId)}
          onClick={() => onSave(policies)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};
