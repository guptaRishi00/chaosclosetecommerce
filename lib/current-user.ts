import { cache } from "react";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";

/**
 * Session + a DB check that the account still exists. A JWT outlives account deletion (up to
 * 7 days), so anything that acts for a customer — pages behind login, placing orders — uses
 * this instead of getSession() alone. Deduped per request.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await UserModel.findById(session.userId).select("name email role address district country").lean();
  if (!user) return null;
  return { ...session, name: user.name, address: user.address, district: user.district, country: user.country };
});
