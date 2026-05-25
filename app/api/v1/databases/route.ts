import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { inArray, and, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {getAccessibleAgentIds} from "@/lib/api-v1/services/agents";
import {ApiKeyContext} from "@/lib/api-v1/types";

const log = logger.child({ module: "api/v1/databases" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const agentIds = await getAccessibleAgentIds(ctx.user);

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
