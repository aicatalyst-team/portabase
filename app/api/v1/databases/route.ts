import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleAgentIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { inArray, and, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/databases" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const agentIds = await getAccessibleAgentIds(ctx.userId);

    if (agentIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const databases = await db.query.database.findMany({
      where: and(
        inArray(drizzleDb.schemas.database.agentId, agentIds),
        isNull(drizzleDb.schemas.database.deletedAt)
      ),
    });

    return NextResponse.json({ data: databases });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/databases");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
