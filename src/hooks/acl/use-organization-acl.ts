"use client";

import type { MemberWithUser } from "@/db/schemas/organization";
import { computeOrganizationPermissions } from "@/lib/acl/organization-acl";

export const useOrganizationPermissions = (
	activeMember: MemberWithUser | null,
) => {
	return computeOrganizationPermissions(activeMember);
};
