import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleAgentIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { inArray, eq, count, and, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { slugify } from "@/utils/slugify";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/agents" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const agentIds = await getAccessibleAgentIds(ctx.userId);

    if (agentIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const agents = await db.query.agent.findMany({
      where: and(
        inArray(drizzleDb.schemas.agent.id, agentIds),
        or(
          eq(drizzleDb.schemas.agent.isArchived, false),
          isNull(drizzleDb.schemas.agent.isArchived)
        )
      ),
    });

    return NextResponse.json({ data: agents });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/agents");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

const CreateAgentSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().min(1, "description is required"),
  organizationId: z.string().uuid("organizationId must be a valid UUID"),
});

export const POST = withApiKey(async (req: Request, ctx: ApiKeyContext) => {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
    }

    const parsed = CreateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { name, description, organizationId } = parsed.data;

    if (!ctx.orgIds.includes(organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdAgent = await db.transaction(async (tx) => {
      const slug = slugify(name);

      const [existing] = await tx
        .select({ count: count() })
        .from(drizzleDb.schemas.agent)
        .where(eq(drizzleDb.schemas.agent.slug, slug));

      if (existing.count > 0) {
        return null; // signal slug conflict
      }

      const [agent] = await tx
        .insert(drizzleDb.schemas.agent)
        .values({ name, description, slug, organizationId })
        .returning();

      if (!agent) throw new Error("Failed to create agent");

      await tx.insert(drizzleDb.schemas.organizationAgent).values({
        organizationId,
        agentId: agent.id,
      });

      return agent;
    });

    if (createdAgent === null) {
      return NextResponse.json(
        { error: "An agent with this name already exists" },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: createdAgent }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "An agent with this name already exists" },
        { status: 422 }
      );
    }
    log.error({ error }, "Error in POST /api/v1/agents");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
