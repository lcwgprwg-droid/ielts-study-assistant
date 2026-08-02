import { NextResponse } from "next/server";
import { dueCards, gradeCard } from "@/lib/study";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(dueCards()); }
export async function POST(request: Request) { try { const { cardId, rating } = await request.json(); return NextResponse.json(gradeCard(cardId, rating)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "复习保存失败" }, { status: 400 }); } }
