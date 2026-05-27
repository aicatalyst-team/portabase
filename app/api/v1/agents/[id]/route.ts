import {NextResponse} from "next/server";
import {withApiKey} from "@/lib/api-v1/middleware";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq, and, or, isNull} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {v4 as uuidv4} from "uuid";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {getAgent, resolveAgentAccess} from "@/lib/api-v1/services/agents";
import {deleteAgentService} from "@/features/agents/agent-delete.action";

const log = logger.child({module: "api/v1/agents/[id]"});

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const id = params?.id;
            if (!id) return NextResponse.json({error: "Not found"}, {status: 404});

            const access = await resolveAgentAccess(id, ctx.user);

            if (access === "forbidden") return NextResponse.json({error: "Forbidden"}, {status: 403});
            if (access === "not_found") return NextResponse.json({error: "Not found"}, {status: 404});

            const agent = await getAgent(id, {
                includeDatabases: true,
                includeOrganizations: false,
            });

            if (!agent) return NextResponse.json({error: "Not found"}, {status: 404});
            return NextResponse.json({data: agent});
        } catch (error) {
            log.error({error}, "Error in GET /api/v1/agents/[id]");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);

export const DELETE = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const id = params?.id;
            if (!id) return NextResponse.json({error: "Not found"}, {status: 404});

            const access = await resolveAgentAccess(id, ctx.user);
            if (access === "forbidden") return NextResponse.json({error: "Forbidden"}, {status: 403});
            if (access === "not_found") return NextResponse.json({error: "Not found"}, {status: 404});

            const agent = await getAgent(id, {
                includeDatabases: false,
                includeOrganizations: true,
            });

            if (!agent) return NextResponse.json({error: "Agent no found"}, {status: 404});

            const organizationIds = agent.organizations.map(org => org.organizationId)

            await deleteAgentService({
                agentId: agent.id,
                organizationId: agent.organizationId ?? undefined,
                organizationIds: organizationIds
            });

            return new Response(null, {status: 204});
        } catch (error) {
            log.error({error}, "Error in DELETE /api/v1/agents/[id]");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
