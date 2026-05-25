import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and, or, isNull } from "drizzle-orm";
import {getAccessibleAgentIds} from "@/lib/api-v1/services/agents";
import {ApiKeyContextUser} from "@/lib/api-v1/types";


export async function getAccessibleDatabaseIds(user: ApiKeyContextUser): Promise<string[]> {
    const agentIds = await getAccessibleAgentIds(user);
    if (agentIds.length === 0) return [];

    const databases = await db.query.database.findMany({
        where: and(
            inArray(drizzleDb.schemas.database.agentId, agentIds),
            isNull(drizzleDb.schemas.database.deletedAt)
        ),
        columns: { id: true },
    });

    return databases.map((d) => d.id);
}
