import "server-only";

import { currentUser } from "@/lib/auth/current-user";
import { getOrganization } from "@/lib/auth/auth";
import { getOrganizationAgents } from "@/db/services/agent";
import type { AgentWith } from "@/db/schema/08_agent";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { env } from "@/env.mjs";
import type { OnboardingDatabase, OnboardingFlowData, OnboardingMeta } from "@/features/onboarding/onboarding.types";

export type ResolvedOnboardingState =
    | { redirect: "/dashboard/home" }
    | { stepId: string; flowData: Partial<OnboardingFlowData> };

export async function resolveOnboardingState(): Promise<ResolvedOnboardingState> {
    // Check settings first (fastest exit)
    const settings = await db.query.setting.findFirst();
    if (settings?.onboarding) {
        return { redirect: "/dashboard/home" };
    }

    const meta: OnboardingMeta = {
        passkeyEnabled: env.AUTH_PASSKEY_ENABLED === "true",
        hasExistingUsers: false,
        ssoProviders: [],
        defaultUserMode: !!(env.AUTH_DEFAULT_USER && env.AUTH_DEFAULT_PASSWORD),
        resumeStepId: "login",
    };

    // Check if any users exist
    const anyUser = await db.query.user.findFirst();
    meta.hasExistingUsers = !!anyUser;

    // SSO providers from env
    if (env.AUTH_OIDC_CLIENT) {
        meta.ssoProviders.push({
            id: env.AUTH_OIDC_ID ?? "oidc",
            label: env.AUTH_OIDC_TITLE ?? "SSO",
        });
    }

    const user = await currentUser();
    if (!user) {
        return { stepId: "login", flowData: { meta } };
    }

    // User exists — check org
    const org = await getOrganization({});
    if (!org) {
        meta.resumeStepId = "org-create";
        return { stepId: "org-create", flowData: { meta } };
    }

    const orgData = { id: org.id, name: org.name, logoDataUrl: org.logo ?? undefined };

    // Check agents
    const agents = await getOrganizationAgents(org.id);
    if (!agents || agents.length === 0) {
        meta.resumeStepId = "agent-create";
        return {
            stepId: "agent-create",
            flowData: {
                meta,
                org: orgData,
            },
        };
    }

    const agentData = agents.map((a) => ({
        id: a.id,
        name: a.name,
    }));

    const databases = (agents as AgentWith[]).flatMap((a) =>
        (a.databases ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            engine: (d.dbms === "postgresql" ? "postgres" : d.dbms) as OnboardingDatabase["engine"],
        }))
    );

    // Check project
    const project = await db.query.project.findFirst({
        where: eq(drizzleDb.schemas.project.organizationId, org.id),
    });

    if (!project) {
        meta.resumeStepId = "agent-key";
        return {
            stepId: "agent-key",
            flowData: {
                meta,
                org: orgData,
                agents: agentData,
                databases,
            },
        };
    }

    // All done
    meta.resumeStepId = "finish";
    return {
        stepId: "finish",
        flowData: {
            meta,
            org: orgData,
            agents: agentData,
            databases,
            project: {
                id: project.id,
                name: project.name,
                description: "",
                databaseIds: [],
            },
        },
    };
}
