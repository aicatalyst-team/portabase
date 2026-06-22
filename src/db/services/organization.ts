"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { member } from "@/db/schema/04_member";
import { organization } from "@/db/schema/03_organization";

export async function getUserOrganization(userId: string) {
  const memberRow = await db.query.member.findFirst({
    columns: { organizationId: true },
    where: eq(member.userId, userId),
  });
  if (!memberRow) return null;
  return db.query.organization.findFirst({
    where: eq(organization.id, memberRow.organizationId),
  });
}
