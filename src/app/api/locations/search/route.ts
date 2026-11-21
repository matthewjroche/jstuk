import { NextResponse } from "next/server";
import { safeFetch } from "@/lib/safe-fetch";
import {
  suggestionLabels,
  UK_IRELAND_VIEWBOX,
  type NominatimResult,
} from "@/lib/profile/location-suggestions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upstream = new URL("https://nominatim.openstreetmap.org/search");
  upstream.searchParams.set("q", query);
  upstream.searchParams.set("format", "jsonv2");
  upstream.searchParams.set("addressdetails", "1");
  // Fetch more than are shown: streets and businesses are filtered out below,
  // and a small town can sit below several of them in the raw order.
  upstream.searchParams.set("limit", "20");
  upstream.searchParams.set("accept-language", "en");
  // Rank the UK and Ireland first without excluding anywhere else — the same box
  // also serves the remote-regions field, where a user may type "Germany".
  upstream.searchParams.set("viewbox", UK_IRELAND_VIEWBOX);
  upstream.searchParams.set("bounded", "0");

  try {
    const response = await safeFetch(upstream.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Job Search Terminal local app (https://github.com/uxdesignlab/job-search-terminal)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }

    const data = await response.json() as NominatimResult[];
    return NextResponse.json({ results: suggestionLabels(data) });
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
