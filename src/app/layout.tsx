import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CofferGate",
  description: "AI 제안과 정책 판정을 함께 보여주는 자율 트레저리 운영 콘솔",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
