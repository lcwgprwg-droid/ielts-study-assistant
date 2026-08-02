import { NextResponse } from "next/server";
import { dashboard } from "@/lib/study";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(dashboard()); }
