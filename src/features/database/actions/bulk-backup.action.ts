"use server";

import {z} from "zod";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {userAction} from "@/lib/safe-actions/actions";
import {assertDatabasesInOrgProject} from "@/features/database/actions/bulk-restore.action";

const bulkSchema = z.object({
    projectId: z.string().uuid(),
    databaseIds: z.array(z.string().uuid()).min(1),
});

export const bulkBackupAction = userAction
    .schema(bulkSchema)
    .action(async ({parsedInput}): Promise<ServerActionResult<{queued: number}>> => {
        try {
            const {projectId, databaseIds} = parsedInput;
            await assertDatabasesInOrgProject(projectId, databaseIds);

            await db
                .insert(drizzleDb.schemas.backup)
                .values(databaseIds.map((databaseId) => ({databaseId, status: "waiting" as const})));

            return {
                success: true,
                value: {queued: databaseIds.length},
                actionSuccess: {message: `Queued ${databaseIds.length} backup(s).`},
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to queue backups.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });
