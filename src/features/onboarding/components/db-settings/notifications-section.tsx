"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Plus, Trash2 } from "lucide-react";
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
import { MultiSelect } from "@/components/common/multi-select";
import { EVENT_KIND_OPTIONS } from "@/features/database/channels-policy.schema";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import type {
  EventKind,
  OnboardingChannel,
  OnboardingNotificationPolicy,
} from "@/features/onboarding/types";

type NotificationsSectionProps = {
  initial: OnboardingNotificationPolicy[];
  notifiers: OnboardingChannel[];
  onSave: (policies: OnboardingNotificationPolicy[]) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

export const NotificationsSection = ({
  initial,
  notifiers,
  onSave,
  onBack,
  isPending,
}: NotificationsSectionProps) => {
  const [policies, setPolicies] =
    useState<OnboardingNotificationPolicy[]>(initial);

  const addPolicy = () =>
    setPolicies((prev) => [
      ...prev,
      { channelId: "", eventKinds: [], enabled: true },
    ]);

  const removePolicy = (index: number) =>
    setPolicies((prev) => prev.filter((_, i) => i !== index));

  const updatePolicy = (
    index: number,
    patch: Partial<OnboardingNotificationPolicy>,
  ) =>
    setPolicies((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );

  const selectedChannelIds = policies.map((p) => p.channelId).filter(Boolean);

  if (notifiers.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
          <Bell className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-sm">No notifiers configured</p>
          <p className="text-xs text-muted-foreground">
            Go back and configure notifiers in the &quot;Connect a
            notifier&quot; step first.
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
        <Label className="text-sm font-medium">Notification Policies</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={policies.length >= notifiers.length}
          onClick={addPolicy}
        >
          <Plus className="size-4 mr-1" />
          Add Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/20 text-center gap-1">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Policy&quot; to start receiving notifications.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((policy, index) => {
            const available = notifiers.filter(
              (n) =>
                n.id === policy.channelId || !selectedChannelIds.includes(n.id),
            );
            const selected = notifiers.find((n) => n.id === policy.channelId);

            return (
              <Card
                key={policy.channelId || index}
                className="p-4 flex flex-col gap-3"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Channel
                    </Label>
                    <Select
                      value={policy.channelId}
                      onValueChange={(v) =>
                        updatePolicy(index, { channelId: v })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select channel">
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
                        {available.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(n.provider)}
                              <span>{n.name}</span>
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
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trigger Events
                  </Label>
                  <MultiSelect
                    options={EVENT_KIND_OPTIONS}
                    onValueChange={(v) =>
                      updatePolicy(index, { eventKinds: v as EventKind[] })
                    }
                    defaultValue={policy.eventKinds}
                    placeholder="Select events…"
                    variant="inverted"
                    animation={0}
                    className="bg-background/50 w-full"
                  />
                </div>
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
          disabled={
            isPending ||
            policies.some((p) => !p.channelId || p.eventKinds.length === 0)
          }
          onClick={() => onSave(policies)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};
