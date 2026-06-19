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
