"use client";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";

type Card = { id:string; phrase:string; meaning:string; example:string; collocations:string };
export default function ReviewPage() {
  const [cards,setCards]=useState<Card[]>([]); const [index,setIndex]=useState(0); const [message,setMessage]=useState("");
  const load=()=>fetch("/api/review").then(r=>r.json()).then(setCards); useEffect(()=>{ void load(); },[]);
  const card=cards[index];
  async function grade(rating:string){ if(!card)return; await fetch("/api/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cardId:card.id,rating})}); setMessage("已记录。让记忆在恰当的间隔再次被唤起。"); if(index+1<cards.length)setIndex(index+1); else {setCards([]);load();} }
  return <Shell><header className="topline"><div><div className="eyebrow">FSRS review</div><h1>主动回忆，而不是被动浏览。</h1><p className="subtle">先在心里说出释义和使用场景，再翻开答案。</p></div></header>{card?<section className="card review-card"><div className="eyebrow">{index+1} / {cards.length}</div><div className="phrase">{card.phrase}</div><div className="meaning">{card.meaning}</div><p className="subtle">{card.example}</p><div className="ratings">{[["again","忘了"],["hard","很吃力"],["good","记得"],["easy","很熟练"]].map(([key,label])=><button key={key} onClick={()=>grade(key)}>{label}</button>)}</div></section>:<section className="card review-card"><div className="eyebrow">Queue clear</div><h2>今天的待复习已完成</h2><p className="subtle">{message||"添加新词组或明天回来继续巩固。"}</p></section>}</Shell>;
}
