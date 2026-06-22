import { NextResponse, type NextRequest } from "next/server";

import { parseIndexVariant, refreshEventIndex } from "@/lib/server/event-indexer";

export async function GET(request: NextRequest) {
  return refresh(request);
}

export async function POST(request: NextRequest) {
  return refresh(request);
}

async function refresh(request: NextRequest) {
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variants = variantParam ? [parseIndexVariant(variantParam)] : (["base", "nft"] as const);

  try {
    const results = await Promise.all(variants.map((variant) => refreshEventIndex(variant)));
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh event index." },
      { status: 500 },
    );
  }
}
