import { NextResponse } from "next/server";
import { analyzeQuestion } from "@/lib/ai";
import { saveQuestion } from "@/lib/study";
export const runtime = "nodejs";
export async function POST(request: Request) { try { const input = await request.json(); const result = await analyzeQuestion(input); const id = saveQuestion({ ...input, analysis: result, errorType: result.errorType }); return NextResponse.json({ id, ...result }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "分析失败，请检查模型设置。" }, { status: 500 }); } }
