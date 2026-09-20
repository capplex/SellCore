import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "SellCore",
    build: "2026-09-20-pipeline-storefront-repair",
  }, {
    headers: {
      "cache-control": "no-store",
      "x-sellcore-build": "2026-09-20-pipeline-storefront-repair",
    },
  });
}
