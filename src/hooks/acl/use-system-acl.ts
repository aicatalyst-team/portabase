"use client";

import type { User } from "@/db/schemas/user";
import { computeSystemPermissions } from "@/lib/acl/system-acl";

export const useSystemPermissions = (user: User | null) => {
	return computeSystemPermissions(user);
};
