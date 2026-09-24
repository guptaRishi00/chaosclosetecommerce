import { NextResponse } from "next/server";

// For uptime monitors / load balancers. Liveness only: deliberately does not
// ping MongoDB, so a brief DB blip doesn't mark every instance unhealthy at once.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
