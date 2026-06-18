"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { generateEdgeKey } from "@/utils/edge_key";
import { env } from "@/env.mjs";

export const generateEdgeKeyAction = userAction
    .schema(z.object({ agentId: z.string() }))
    .action(async ({ parsedInput }) => {
        const serverUrl = env.PROJECT_URL ?? "http://localhost:8887";
        const key = await generateEdgeKey(serverUrl, parsedInput.agentId);
        return { key };
    });
