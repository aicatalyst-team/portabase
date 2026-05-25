import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {getAccessibleDatabaseIds} from "@/lib/api-v1/services/databases";

const log = logger.child({ module: "api/v1/databases/[id]/status" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const accessibleIds = await getAccessibleDatabaseIds(ctx.user);
      if (!accessibleIds.includes(id)) {
        const exists = await db.query.database.findFirst({
          where: eq(drizzleDb.schemas.database.id, id),
          columns: { id: true },
        });
        return NextResponse.json(
          { error: exists ? "Forbidden" : "Not found" },
          { status: exists ? 403 : 404 }
        );
      }

      const [database, latestBackup, latestRestoration] = await Promise.all([
        db.query.database.findFirst({
          where: and(
              eq(drizzleDb.schemas.database.id, id),
              isNull(drizzleDb.schemas.database.deletedAt)
          )
        }),
        db.query.backup.findFirst({
          where: and(
            eq(drizzleDb.schemas.backup.databaseId, id),
            isNull(drizzleDb.schemas.backup.deletedAt)
          ),
          orderBy: [desc(drizzleDb.schemas.backup.createdAt)],
        }),
        db.query.restoration.findFirst({
          where: and(
            eq(drizzleDb.schemas.restoration.databaseId, id),
            isNull(drizzleDb.schemas.restoration.deletedAt)
          ),
          orderBy: [desc(drizzleDb.schemas.restoration.createdAt)],
        }),
      ]);

      if (!database){
        return NextResponse.json({ error: "Database not found" });
      }

      return NextResponse.json({
        data: {
          isWaitingForBackup: database.isWaitingForBackup,
          lastContact: database.lastContact,
          latestBackup: latestBackup ?? null,
          latestRestoration: latestRestoration ?? null,
        },
      });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/databases/[id]/status");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
