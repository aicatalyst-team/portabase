import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and } from "drizzle-orm";

export async function getAccessibleAgentIds(userId: string): Promise<string[]> {
  const memberships = await db.query.member.findMany({
    where: eq(drizzleDb.schemas.member.userId, userId),
    columns: { organizationId: true },
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);

  const orgAgents = await db.query.organizationAgent.findMany({
    where: inArray(drizzleDb.schemas.organizationAgent.organizationId, orgIds),
    columns: { agentId: true },
  });

  if (orgAgents.length === 0) return [];

  const agentIds = orgAgents.map((oa) => oa.agentId);

  const agents = await db.query.agent.findMany({
    where: and(
      inArray(drizzleDb.schemas.agent.id, agentIds),
      eq(drizzleDb.schemas.agent.isArchived, false)
    ),
    columns: { id: true },
  });

  return agents.map((a) => a.id);
}

export async function getAccessibleDatabaseIds(userId: string): Promise<string[]> {
  const agentIds = await getAccessibleAgentIds(userId);
  if (agentIds.length === 0) return [];

  const databases = await db.query.database.findMany({
    where: inArray(drizzleDb.schemas.database.agentId, agentIds),
    columns: { id: true },
  });

  return databases.map((d) => d.id);
}
