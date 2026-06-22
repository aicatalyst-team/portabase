import { createHash } from "crypto";
import type { Setting } from "@/db/schema/01_setting";
import type { User } from "@/db/schema/02_user";

export function resolveAvatarUrl(
  user: Pick<User, "email" | "image">,
  settings: Pick<Setting, "avatarMode" | "dicebearStyle"> | null | undefined,
): string | undefined {
  const mode = settings?.avatarMode ?? "internal";

  if (mode === "gravatar") {
    const hash = createHash("md5")
      .update((user.email ?? "").trim().toLowerCase())
      .digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;
  }

  if (mode === "dicebear") {
    const style = settings?.dicebearStyle ?? "thumbs";
    const hash = createHash("md5")
      .update((user.email ?? "").trim().toLowerCase())
      .digest("hex");
    return `https://api.dicebear.com/10.x/${style}/svg?seed=${hash}`;
  }

  return user.image ?? undefined;
}
