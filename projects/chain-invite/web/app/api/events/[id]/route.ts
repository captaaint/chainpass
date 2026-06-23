import { NextResponse, type NextRequest } from "next/server";

import { getIndexedEventState } from "@/lib/server/event-index-store";
import { parseIndexVariant, refreshEventIndex } from "@/lib/server/event-indexer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const variant = parseIndexVariant(request.nextUrl.searchParams.get("variant"));

  try {
    await refreshEventIndex(variant);
    const event = await getIndexedEventState(variant, id);
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load event index." },
      { status: 500 },
    );
  }
}
