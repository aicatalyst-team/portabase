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
