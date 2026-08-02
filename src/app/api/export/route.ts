import { NextResponse } from "next/server";
import { exportData, importData } from "@/lib/study";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(exportData(), { headers: { "Content-Disposition": "attachment; filename=ielts-study-backup.json" } }); }
export async function POST(request: Request) { try { importData(await request.json()); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "备份格式无效" }, { status: 400 }); } }
