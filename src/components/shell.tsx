import Link from "next/link";
import { BookOpen, ClipboardCheck, FilePenLine, LayoutDashboard, LineChart, Settings, Sparkles } from "lucide-react";

const nav = [
  ["/", "总览", LayoutDashboard], ["/review", "词汇复习", BookOpen], ["/questions", "试题分析", ClipboardCheck],
  ["/writing", "写作修改", FilePenLine], ["/reports", "学习报告", LineChart], ["/settings", "设置", Settings],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="shell"><aside className="sidebar"><div className="brand"><div className="crest">I</div><span>IELTS Atelier</span></div><nav className="nav">{nav.map(([href,label,Icon]) => <Link key={href} href={href}><Icon size={17}/>{label}</Link>)}</nav><div className="sidebar-note"><Sparkles size={15} /><br/>积累有证据的进步。每一次练习都会成为下一次更精准的建议。</div></aside><main className="main"><div className="mobile-head"><div className="brand"><div className="crest">I</div><span>IELTS Atelier</span></div><Link href="/review">开始复习</Link></div>{children}</main></div>;
}
