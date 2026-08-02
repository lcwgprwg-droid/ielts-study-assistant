import { NextResponse } from "next/server";
import { addVocabulary, ensureSeed, listVocabulary } from "@/lib/study";
export const runtime = "nodejs";
export async function GET() { ensureSeed(); return NextResponse.json(listVocabulary()); }
export async function POST(request: Request) { try { return NextResponse.json(addVocabulary(await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 }); } }
