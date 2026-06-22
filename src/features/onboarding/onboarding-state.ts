import "server-only";

import { currentUser } from "@/lib/auth/current-user";
import { getSettings } from "@/db/services/setting";
import { hasUsers } from "@/db/services/user";
import { getUserOrganization } from "@/db/services/organization";
import { getOrganizationProject } from "@/db/services/project";
import { getOrganizationAgents } from "@/db/services/agent";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import type { AgentWith } from "@/db/schema/08_agent";
import { env } from "@/env.mjs";
import type {
  OnboardingDatabase,
  OnboardingFlowData,
  OnboardingMeta,
} from "@/features/onboarding/types";
import { generateEdgeKey } from "@/utils/edge_key";
import { getServerUrl } from "@/utils/get-server-url";

export type ResolvedOnboardingState =
  | { redirect: "/dashboard/home" }
  | { stepId: string; flowData: Partial<OnboardingFlowData> };

export async function resolveOnboardingState(): Promise<ResolvedOnboardingState> {
  const settings = await getSettings();
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

  meta.hasExistingUsers = await hasUsers();

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

  const org = await getUserOrganization(user.id);
  if (!org) {
    meta.resumeStepId = "preferences";
    return { stepId: "preferences", flowData: { meta } };
  }

  const orgData = { id: org.id, name: org.name };

  const [notifierChannels, storageChannels, agents, project] =
    await Promise.all([
      getOrganizationChannels(org.id),
      getOrganizationStorageChannels(org.id),
      getOrganizationAgents(org.id),
      getOrganizationProject(org.id),
    ]);

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

  const defaults = {
    notifierId: settings?.defaultNotificationChannelId ?? undefined,
    storageId: settings?.defaultStorageChannelId ?? undefined,
  };

  const agentData = await Promise.all(
    (agents ?? []).map(async (a) => ({
      id: a.id,
      name: a.name,
      edgeKey: await generateEdgeKey(getServerUrl(), a.id),
      connected: !!a.lastContact,
    }))
  );

  const databases = (agents as AgentWith[]).flatMap((a) =>
    (a.databases ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      engine: (d.dbms === "postgresql"
        ? "postgres"
        : d.dbms) as OnboardingDatabase["engine"],
    })),
  );

  const fullData: Partial<OnboardingFlowData> = {
    meta,
    org: orgData,
    notifiers,
    storages,
    defaults,
    agents: agentData,
    databases,
    ...(project
      ? {
          project: {
            id: project.id,
            name: project.name,
            description: "",
            databaseIds: (project as any).databases?.map((db: any) => db.id) ?? [],
          },
        }
      : {}),
  };

  const hasAgents = agents && agents.length > 0;

  // Has project → late stage (project was created after agent-key)
  if (project) {
    if (!hasAgents) {
      // Project without agents: missed earlier steps
      if (notifiers.length === 0) {
        meta.resumeStepId = "notifier";
        return { stepId: "notifier", flowData: fullData };
      }
      if (storages.length === 0) {
        meta.resumeStepId = "storage";
        return { stepId: "storage", flowData: fullData };
      }
      meta.resumeStepId = "agent-create";
      return { stepId: "agent-create", flowData: fullData };
    }

    const agentHasPinged = !!agents[0]?.lastContact;
    if (!agentHasPinged) {
      meta.resumeStepId = "agent-key";
      return { stepId: "agent-key", flowData: fullData };
    }

    meta.resumeStepId = "finish";
    return { stepId: "finish", flowData: fullData };
  }

  // Has agents but no project → past notifier/storage, waiting on project
  if (hasAgents) {
    const agentHasPinged = !!agents[0]?.lastContact;
    const stepId = agentHasPinged ? "project-create" : "agent-key";
    meta.resumeStepId = stepId;
    return { stepId, flowData: fullData };
  }

  // No agents, no project → check earlier steps in order
  if (notifiers.length === 0) {
    meta.resumeStepId = "notifier";
    return { stepId: "notifier", flowData: fullData };
  }

  if (storages.length === 0) {
    meta.resumeStepId = "storage";
    return { stepId: "storage", flowData: fullData };
  }

  meta.resumeStepId = "agent-create";
  return { stepId: "agent-create", flowData: fullData };
}
