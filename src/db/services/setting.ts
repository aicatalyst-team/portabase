import { db } from "@/db";

export async function getSettings() {
    return db.query.setting.findFirst();
}
