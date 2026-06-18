import "server-only";

import { currentUser } from "@/lib/auth/current-user";
import { getOrganization } from "@/lib/auth/auth";
import { getOrganizationAgents } from "@/db/services/agent";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import type { AgentWith } from "@/db/schema/08_agent";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { env } from "@/env.mjs";
import type {
  OnboardingDatabase,
  OnboardingFlowData,
  OnboardingMeta,
} from "@/features/onboarding/onboarding.types";

export type ResolvedOnboardingState =
  | { redirect: "/dashboard/home" }
  | { stepId: string; flowData: Partial<OnboardingFlowData> };

export async function resolveOnboardingState(): Promise<ResolvedOnboardingState> {
  const settings = await db.query.setting.findFirst();
  if (settings?.onboarding) {
    return { redirect: "/dashboard/home" };
  }

  const meta: OnboardingMeta = {
    passkeyEnabled: env.AUTH_PASSKEY_ENABLED === "true",
    emailPasswordEnabled: env.AUTH_EMAIL_PASSWORD_ENABLED === "true",
    hasExistingUsers: false,
    ssoProviders: [],
    defaultUserMode: !!(env.AUTH_DEFAULT_USER && env.AUTH_DEFAULT_PASSWORD),
    resumeStepId: "login",
  };

  const anyUser = await db.query.user.findFirst();
  meta.hasExistingUsers = !!anyUser;

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

  const org = await getOrganization({});
  if (!org) {
    meta.resumeStepId = "org-create";
    return { stepId: "org-create", flowData: { meta } };
  }

  const orgData = { id: org.id, name: org.name };

  // Query persisted channels
  const notifierChannels = await getOrganizationChannels(org.id);
  const storageChannels = await getOrganizationStorageChannels(org.id);

  const notifiers = notifierChannels.map((n) => ({
    id: n.id,
    provider: n.provider,
    label: n.provider,
    name: n.name,
    config: (n.config as Record<string, unknown>) ?? {},
  }));

  const storages = storageChannels.map((s) => ({
    id: s.id,
    provider: s.provider,
    label: s.provider,
    name: s.name,
    config: (s.config as Record<string, unknown>) ?? {},
  }));

  // Resume at notifier if none configured
  if (notifiers.length === 0) {
    meta.resumeStepId = "notifier";
    return { stepId: "notifier", flowData: { meta, org: orgData } };
  }

  // Resume at storage if none configured
  if (storages.length === 0) {
    meta.resumeStepId = "storage";
    return { stepId: "storage", flowData: { meta, org: orgData, notifiers } };
  }

  // Check agents
  const agents = await getOrganizationAgents(org.id);
  if (!agents || agents.length === 0) {
    meta.resumeStepId = "agent-create";
    return {
      stepId: "agent-create",
      flowData: { meta, org: orgData, notifiers, storages },
    };
  }

  const agentData = agents.map((a) => ({ id: a.id, name: a.name }));

  const databases = (agents as AgentWith[]).flatMap((a) =>
    (a.databases ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      engine: (d.dbms === "postgresql"
        ? "postgres"
        : d.dbms) as OnboardingDatabase["engine"],
    })),
  );

  // Check agent connection status via direct DB query (no request context needed)
  const firstAgent = agents[0];
  let agentConnected = false;
  if (firstAgent) {
    const agentRow = await db.query.agent.findFirst({
      where: eq(drizzleDb.schemas.agent.id, firstAgent.id),
      columns: { lastContact: true },
    });
    if (agentRow?.lastContact) {
      const lastContact = new Date(agentRow.lastContact);
      agentConnected = Date.now() - lastContact.getTime() < 60_000;
    }
  }

  // Check project
  const project = await db.query.project.findFirst({
    where: eq(drizzleDb.schemas.project.organizationId, org.id),
  });

  if (!project) {
    // Agent connected but no project → project-create
    // Agent not connected → agent-key
    const stepId = agentConnected ? "project-create" : "agent-key";
    meta.resumeStepId = stepId;
    return {
      stepId,
      flowData: { meta, org: orgData, notifiers, storages, agents: agentData, databases },
    };
  }

  meta.resumeStepId = "finish";
  return {
    stepId: "finish",
    flowData: {
      meta,
      org: orgData,
      notifiers,
      storages,
      agents: agentData,
      databases,
      project: { id: project.id, name: project.name, description: "", databaseIds: [] },
    },
  };
}
