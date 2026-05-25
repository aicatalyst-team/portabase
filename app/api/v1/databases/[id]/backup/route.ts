import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleDatabaseIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, desc, isNull, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/databases/[id]/backup" });

async function resolveDatabaseAccess(id: string, userId: string) {
  const accessibleIds = await getAccessibleDatabaseIds(userId);
  if (accessibleIds.includes(id)) return "ok";
  const exists = await db.query.database.findFirst({
    where: eq(drizzleDb.schemas.database.id, id),
    columns: { id: true },
  });
  return exists ? "forbidden" : "not_found";
}

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const access = await resolveDatabaseAccess(id, ctx.userId);
      if (access === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (access === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });

      const backups = await db.query.backup.findMany({
        where: and(
          eq(drizzleDb.schemas.backup.databaseId, id),
          isNull(drizzleDb.schemas.backup.deletedAt)
        ),
        orderBy: [desc(drizzleDb.schemas.backup.createdAt)],
      });

      return NextResponse.json({ data: backups });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/databases/[id]/backup");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const POST = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const access = await resolveDatabaseAccess(id, ctx.userId);
      if (access === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (access === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });

      const [createdBackup] = await db
        .insert(drizzleDb.schemas.backup)
        .values({ databaseId: id, status: "waiting" })
        .returning();

      if (!createdBackup) {
        return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
      }

      return NextResponse.json({ data: createdBackup }, { status: 201 });
    } catch (error) {
      log.error({ error }, "Error in POST /api/v1/databases/[id]/backup");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
