import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and, or, isNull } from "drizzle-orm";
import {ApiKeyContextUser} from "@/lib/api-v1/types";

export async function getAccessibleAgentIds(
    user: ApiKeyContextUser
): Promise<string[]> {

    const memberships = await db.query.member.findMany({
        where: and(
            eq(drizzleDb.schemas.member.userId, user.id),
            or(
                eq(drizzleDb.schemas.member.role, "admin"),
                eq(drizzleDb.schemas.member.role, "owner")
            )
        ),
        columns: { organizationId: true },
    });

    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
        return [];
    }

    const isActiveAgent = or(
        eq(drizzleDb.schemas.agent.isArchived, false),
        isNull(drizzleDb.schemas.agent.isArchived)
    );

    const orgAgents = await db.query.organizationAgent.findMany({
        where: inArray(
            drizzleDb.schemas.organizationAgent.organizationId,
            orgIds
        ),
        columns: { agentId: true },
    });

    const junctionAgentIds = orgAgents.map((oa) => oa.agentId);

    let directAgentIds: string[] = [];

    if (user.permissions.isAdmin || user.permissions.isSuperAdmin) {
        const directAgents = await db.query.agent.findMany({
            where: isActiveAgent,
            columns: { id: true },
        });

        directAgentIds = directAgents.map((a) => a.id);
    }

    const allAgentIds = [
        ...new Set([
            ...junctionAgentIds,
            ...directAgentIds,
        ]),
    ];

    if (allAgentIds.length === 0) {
        return [];
    }

    const agents = await db.query.agent.findMany({
        where: and(
            inArray(drizzleDb.schemas.agent.id, allAgentIds),
            isActiveAgent
        ),
        columns: { id: true },
    });

    return agents.map((a) => a.id);
}