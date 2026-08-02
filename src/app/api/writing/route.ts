import { NextResponse } from "next/server";
import { reviseWriting } from "@/lib/ai";
import { saveWriting } from "@/lib/study";
export const runtime = "nodejs";
export async function POST(request: Request) { try { const input = await request.json(); const result = await reviseWriting(input); const id = saveWriting({ ...input, ...result }); return NextResponse.json({ id, ...result }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "批改失败，请检查模型设置。" }, { status: 500 }); } }
