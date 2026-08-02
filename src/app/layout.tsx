import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "IELTS Atelier", description: "本地优先的雅思学习助手" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
