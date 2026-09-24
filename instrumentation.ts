// Runs once when the server process starts (not during `next build`).
// Fails the boot on missing/invalid config instead of the first request that needs it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("@/lib/env");
    env();
  }
}
