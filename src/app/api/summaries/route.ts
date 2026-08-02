import { NextResponse } from "next/server";
import { buildSummary } from "@/lib/study";
export const runtime = "nodejs";
export async function POST(request: Request) { const { scope } = await request.json(); return NextResponse.json(buildSummary(scope === "daily" ? "daily" : "session")); }
