// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard รายได้ประจำวัน สรุปรายเดือน ปข.6",
  description: "Dashboard แสดงผลรายได้ประจำวันและสรุปรายเดือน ของ ปข.6 แยกตามจังหวัด ที่ทำการ และกลุ่มธุรกิจ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
