import { getSession, type Session } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";

/**
 * Authoritative admin check for Server Components and Server Actions.
 * The JWT's role claim only steers middleware redirects; this re-reads the user
 * from the database so a demoted or deleted admin loses access immediately.
 */
export async function requireAdmin(): Promise<(Session & { name: string }) | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;

  await connectDB();
  const user = await UserModel.findById(session.userId).select("role name").lean();
  if (!user || user.role !== "admin") return null;

  return { ...session, name: user.name };
}
