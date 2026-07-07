# Development Document
## Dashboard รายได้ประจำวัน สรุปรายเดือน ปข.6

**เวอร์ชันเอกสาร:** 1.0
**จัดทำสำหรับ:** ทีมพัฒนา Webapp (Next.js + Tailwind CSS)
**สถานะ:** พร้อมนำไปพัฒนา (Ready for Development)

---

## สารบัญ

1. ภาพรวมโครงการ
2. Tech Stack
3. Design System (ธีม/สี/ตัวอักษร/Layout)
4. กลยุทธ์ 16:9 Fixed Layout + Responsive
5. โครงสร้างโปรเจกต์ (Folder Structure)
6. แหล่งข้อมูลและโครงสร้างข้อมูล (Data Source & Data Model)
7. Data Fetching Layer (Google Sheets Integration)
8. Business Logic หลัก
   - 8.1 การแปลงปี พ.ศ.
   - 8.2 อัลกอริทึม Fibonacci Weekly Target (สำคัญที่สุด)
   - 8.3 Aggregation & Filter Logic
   - 8.4 AI Insight Analysis (Rule-based Algorithm)
9. Global State: Filter Context
10. รายละเอียด Component แต่ละส่วน (พร้อมโค้ดตัวอย่าง)
11. การประกอบหน้า Page Layout
12. Performance, Caching, Error Handling
13. Deployment Notes
14. Roadmap / Future Enhancements

---

## 1. ภาพรวมโครงการ

Dashboard นี้ใช้แสดงผล **รายได้ประจำวัน สรุปรายเดือน** ของ ปข.6 โดยมีเป้าหมายหลัก 3 ข้อ:

1. แสดงความคืบหน้ารายได้เทียบเป้าหมายแบบ real-time ในมุมมองที่ผู้บริหารดูแล้วเข้าใจภายใน 5 วินาที
2. สร้างแรงจูงใจ/การแข่งขันเชิงบวกระหว่างจังหวัดและที่ทำการ ผ่านการจัดอันดับ
3. ให้ "มุมมองการวิเคราะห์" อัตโนมัติ (Insight) โดยไม่ต้องรอคนมานั่งอ่านตัวเลขเอง

ข้อกำหนดเชิงการแสดงผลที่ตายตัว (hard requirements):

- ทั้งหมดต้องอยู่ใน **1 หน้าจอเดียว** อัตราส่วน **16:9** เมื่อดูบน PC และห้ามมีการบิดเบี้ยว/ยืดผิดสัดส่วนเด็ดขาด
- บนอุปกรณ์ที่ไม่ใช่ 16:9 (มือถือ/แท็บเล็ต) ให้จัดเรียง element ใหม่แบบ responsive (ไม่ scale แบบ PC)
- แสดงวันที่เป็น **พ.ศ.** ทุกจุด
- โทนสี **ครีมสว่างแบบกระดาษถนอมสายตา** (light paper tone)
- สร้างด้วย **Next.js (App Router) + Tailwind CSS**

---

## 2. Tech Stack

| หมวด | เทคโนโลยี | เหตุผล |
|---|---|---|
| Framework | Next.js 14+ (App Router) | รองรับ Server Component + API Route ในตัว, deploy ง่ายบน Vercel |
| Styling | Tailwind CSS 3.x | ควบคุม design token ผ่าน `tailwind.config.ts` ได้ตรงตามธีมที่กำหนด |
| Charting | `recharts` | รองรับกราฟแท่ง/แนวนอน/โดนัทครบ, ปรับแต่ง custom shape ได้ (ใช้ทำ gauge/checkpoint) |
| Data Source | Google Sheets API v4 (`googleapis`) | อ่านข้อมูลจาก Google Sheet โดยตรงแบบ Service Account (read-only) |
| Date Handling | `dayjs` + plugin `buddhistEra` (custom) | แปลง ค.ศ. → พ.ศ. |
| State (filters) | React Context + `useReducer` (in-page, ไม่ต้องใช้ library หนัก) | ขอบเขต state เล็ก ไม่จำเป็นต้องใช้ Redux/Zustand |
| Data Fetching (client) | `swr` | cache + revalidate ให้ dashboard สดอยู่เสมอ |
| Font | Google Fonts: `Noto Sans Thai` (body) + `Sarabun` (ตัวเลข/หัวข้อ) | อ่านง่าย รองรับภาษาไทยเต็มรูปแบบ |

---

## 3. Design System

### 3.1 แนวคิดธีม

ธีม "กระดาษถนอมสายตา" (soft paper) เน้นพื้นหลังโทนครีมอ่อนที่ไม่สะท้อนแสงจ้าเหมือนพื้นขาวล้วน ใช้สีเน้น (accent) แบบ "หมึกพิมพ์เอกสารราชการ" คือน้ำเงินกรมท่าเข้ม (คล้ายตราไปรษณีย์ไทย) และสีทองแดง/ส้มอิฐอ่อนสำหรับจุดเตือน (under target)

### 3.2 Token สี (Tailwind config)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF6EC", // พื้นหลังหลัก ครีมสว่าง
          soft: "#F3EEDF",    // พื้นหลังการ์ด/แถบรอง
          line: "#E4DCC4",    // เส้นแบ่ง/ตาราง
        },
        ink: {
          DEFAULT: "#2B2A28", // ตัวอักษรหลัก (เกือบดำ อมน้ำตาล ไม่ใช้ดำสนิท)
          soft: "#6B6558",    // ตัวอักษรรอง / caption
        },
        brand: {
          DEFAULT: "#264C73", // น้ำเงินกรมท่า - accent หลัก / เป้าหมาย
          light: "#5E85A8",
        },
        positive: {
          DEFAULT: "#3E7C59", // เขียวเข้ม (ทำได้ตามเป้า / เกินเป้า)
          soft: "#DCEBE1",
        },
        warning: {
          DEFAULT: "#B5652F", // ส้มอิฐ (ต่ำกว่าเป้า)
          soft: "#F3E1D2",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "sans-serif"],
        display: ["'Sarabun'", "'Noto Sans Thai'", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(43,42,40,0.08), 0 1px 2px rgba(43,42,40,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
```

### 3.3 Typography Scale

| ระดับ | ใช้กับ | ขนาด (px @ 1920 design width) |
|---|---|---|
| Display | ชื่อ Dashboard | 28–32px, `font-display font-bold` |
| H2 | ชื่อ section การ์ด | 16–18px, `font-semibold` |
| Body | ตัวเลข/label ทั่วไป | 13–14px |
| Number-lg | ตัวเลขรายได้หลัก | 24–36px, `tabular-nums` |
| Caption | หมายเหตุ, timestamp | 11–12px, `text-ink-soft` |

หมายเหตุ: ใช้ `font-variant-numeric: tabular-nums` กับตัวเลขทุกจุดเพื่อไม่ให้ตัวเลขเลื่อนตำแหน่งเวลาข้อมูลเปลี่ยน (สำคัญมากสำหรับ dashboard ที่ auto-refresh)

---

## 4. กลยุทธ์ 16:9 Fixed Layout + Responsive

นี่คือจุดที่สำคัญที่สุดของ requirement นี้ ใช้แนวทาง **"Design Canvas + Scale Stage"** ซึ่งเป็นเทคนิคที่วงการ TV-wall / broadcast dashboard ใช้กันเป็นมาตรฐาน:

**หลักการ:**
1. ออกแบบทุกอย่างบน "ผืนผ้าใบเสมือน" ขนาดคงที่ เช่น `1920 × 1080px` (16:9 พอดี)
2. เมื่อ render บนจอจริง ให้คำนวณ `scale = min(viewportWidth / 1920, viewportHeight / 1080)`
3. ใช้ CSS `transform: scale(scale)` กับ container ทั้งก้อน (`transform-origin: top left`) แล้ว center ด้วย margin auto
4. วิธีนี้การ์ด/กราฟ/ตัวอักษรทุกจุด**ย่อ-ขยายตามสัดส่วนเดียวกันเป๊ะ** ไม่มีทางบิดเบี้ยว เพราะเป็นการ scale ทั้งภาพ ไม่ใช่การ reflow

**เงื่อนไขสลับโหมด:**
- ถ้า `window.innerWidth >= 1024` → ใช้ **Desktop Stage Mode** (scale ตามข้อ 2-3)
- ถ้า `window.innerWidth < 1024` (มือถือ/แท็บเล็ตแนวตั้ง) → **ปิดการ scale ทั้งหมด** แล้วสลับไปใช้ layout responsive ปกติ (flex-col, กราฟเต็มความกว้างจอ, เลื่อน scroll แนวตั้งได้)

### 4.1 Hook คำนวณ Scale

```tsx
// hooks/useFitStage.ts
"use client";
import { useEffect, useState } from "react";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const DESKTOP_BREAKPOINT = 1024;

export function useFitStage() {
  const [state, setState] = useState({
    scale: 1,
    isDesktopStage: true,
  });

  useEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isDesktopStage = vw >= DESKTOP_BREAKPOINT;

      if (!isDesktopStage) {
        setState({ scale: 1, isDesktopStage: false });
        return;
      }

      const scale = Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
      setState({ scale, isDesktopStage: true });
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  return state;
}
```

### 4.2 การใช้งานใน Layout

```tsx
// app/page.tsx (ตัดมาเฉพาะส่วนโครง Stage)
"use client";
import { useFitStage } from "@/hooks/useFitStage";

export default function DashboardPage() {
  const { scale, isDesktopStage } = useFitStage();

  if (!isDesktopStage) {
    // Mobile/Tablet: responsive stacked layout ปกติ
    return (
      <main className="min-h-screen bg-paper flex flex-col gap-4 p-4">
        {/* ...render components แบบ flex-col เต็มความกว้าง... */}
      </main>
    );
  }

  // Desktop: fixed 16:9 stage ที่ scale ให้พอดีจอเสมอ
  return (
    <div className="w-screen h-screen overflow-hidden bg-ink flex items-center justify-center">
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="bg-paper shadow-2xl origin-center"
      >
        {/* ...เนื้อหา dashboard ทั้งหมดถูกวางในกรอบขนาดคงที่ 1920x1080 นี้... */}
      </div>
    </div>
  );
}
```

> หมายเหตุ: พื้นหลังนอก stage (`bg-ink`) เป็น "letterbox" กันขอบเวลาสัดส่วนจอไม่ตรง 16:9 พอดี (เช่นจอ ultrawide หรือจอเตี้ยกว่ามาตรฐาน) ทำให้เนื้อหาข้างในไม่มีวันเพี้ยน

---

## 5. โครงสร้างโปรเจกต์

```
revenue-dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # หน้า Dashboard หลัก
│   ├── api/
│   │   ├── daily/route.ts        # ดึงข้อมูลจากชีต TOTAL(รายวัน)
│   │   └── monthly/route.ts      # ดึงข้อมูลจากชีต TOTAL(รายเดือน)
│   └── globals.css
├── components/
│   ├── DashboardHeader.tsx
│   ├── FilterBar.tsx
│   ├── TotalSummaryGauge.tsx
│   ├── DailyProgressChart.tsx
│   ├── ProvinceRankingChart.tsx
│   ├── OfficePerformancePanels.tsx
│   ├── BusinessGroupDonut.tsx
│   ├── AIInsightPanel.tsx
│   └── DashboardFooterNote.tsx
├── contexts/
│   └── FilterContext.tsx
├── hooks/
│   ├── useFitStage.ts
│   └── useDashboardData.ts       # รวม SWR fetch + derived data
├── lib/
│   ├── googleSheets.ts           # service account client + parser
│   ├── buddhistDate.ts           # แปลง ค.ศ. → พ.ศ.
│   ├── fibonacciTarget.ts        # อัลกอริทึมเป้าหมายรายสัปดาห์
│   ├── aggregate.ts              # groupBy / sum ตาม filter
│   └── aiInsight.ts              # rule-based insight engine
├── types/
│   └── revenue.ts
├── tailwind.config.ts
└── .env.local                    # GOOGLE_SERVICE_ACCOUNT_*, SHEET_ID
```

---

## 6. แหล่งข้อมูลและโครงสร้างข้อมูล

**Google Sheet ID:** `1N0YGzow88jLN2XfEYwMcDYe6wt2-74Zi_Yft-z8AqBc`

### 6.1 Sheet: `TOTAL(รายวัน)`

| คอลัมน์ | ประเภท | ใช้สำหรับ |
|---|---|---|
| วันที่ | Date | แกน X ของกราฟรายวัน |
| จังหวัด | string | Filter + group by |
| ที่ทำการ | string | Filter + group by |
| กลุ่มธุรกิจ | string | Filter + donut chart |
| รายได้ | number | ค่าที่นำมารวม (sum) |
| ลำดับ | number | ไม่ใช้ในการคำนวณ (เก็บไว้เผื่อ sort ต้นทาง) |

### 6.2 Sheet: `TOTAL(รายเดือน)`

ใช้เฉพาะคอลัมน์: `DATE, จังหวัด, ที่ทำการ, กลุ่มธุรกิจ, รายได้, เป้าหมาย`
(คอลัมน์ `Month, Post, Service, ปี, รหัส ปณ.` ไม่ถูกใช้ในตรรกะการคำนวณ ยกเว้นใช้เป็น reference join key เพิ่มเติมถ้าจำเป็น)

`เป้าหมาย` คือค่าที่ใช้เป็น **เป้าหมายรายเดือน** ของแต่ละ (จังหวัด × ที่ทำการ × กลุ่มธุรกิจ) และเป็น input หลักของอัลกอริทึม Fibonacci ในข้อ 8.2

### 6.3 TypeScript Types

```ts
// types/revenue.ts
export interface DailyRow {
  date: string;        // ISO string, e.g. "2026-07-03"
  province: string;
  office: string;
  businessGroup: string;
  revenue: number;
}

export interface MonthlyRow {
  date: string;         // วันที่อ้างอิงของแถวเป้าหมาย (ต้นเดือน)
  province: string;
  office: string;
  businessGroup: string;
  revenue: number;       // รายได้สะสมล่าสุด (ใช้ cross-check กับ daily)
  target: number;        // เป้าหมายรายเดือน
}

export interface DashboardFilters {
  province: string | "ALL";
  office: string | "ALL";
  businessGroup: string | "ALL";
  dateFrom: string;      // ISO date, default = ต้นเดือนของเดือนปัจจุบัน
  dateTo: string;        // ISO date, default = today()
}
```

---

## 7. Data Fetching Layer (Google Sheets Integration)

ใช้ Service Account (read-only, แชร์สิทธิ์ "Viewer" ให้ service account email ในตัว Google Sheet)

```ts
// lib/googleSheets.ts
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuthClient() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function fetchSheetValues(sheetName: string) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}`, // ทั้งชีต, header อยู่แถวแรก
  });
  return res.data.values ?? [];
}

export async function getDailyRows() {
  const rows = await fetchSheetValues("TOTAL(รายวัน)");
  const [header, ...body] = rows;
  return body.map((r) => ({
    date: r[0],
    province: r[1],
    office: r[2],
    businessGroup: r[3],
    revenue: Number(r[4]?.replace(/,/g, "") || 0),
  }));
}

export async function getMonthlyRows() {
  const rows = await fetchSheetValues("TOTAL(รายเดือน)");
  const [header, ...body] = rows;
  // header index: Month0 Post1 Service2 ปี3 DATE4 จังหวัด5 รหัสปณ.6 ที่ทำการ7 กลุ่มธุรกิจ8 รายได้9 เป้าหมาย10
  return body.map((r) => ({
    date: r[4],
    province: r[5],
    office: r[7],
    businessGroup: r[8],
    revenue: Number(r[9]?.replace(/,/g, "") || 0),
    target: Number(r[10]?.replace(/,/g, "") || 0),
  }));
}
```

### 7.1 API Routes

```ts
// app/api/daily/route.ts
import { NextResponse } from "next/server";
import { getDailyRows } from "@/lib/googleSheets";

export const revalidate = 300; // cache 5 นาที

export async function GET() {
  try {
    const data = await getDailyRows();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรายวันได้" }, { status: 500 });
  }
}
```

```ts
// app/api/monthly/route.ts
import { NextResponse } from "next/server";
import { getMonthlyRows } from "@/lib/googleSheets";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await getMonthlyRows();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรายเดือนได้" }, { status: 500 });
  }
}
```

### 7.2 Client Hook (SWR)

```ts
// hooks/useDashboardData.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboardData() {
  const daily = useSWR("/api/daily", fetcher, { refreshInterval: 5 * 60 * 1000 });
  const monthly = useSWR("/api/monthly", fetcher, { refreshInterval: 5 * 60 * 1000 });

  return {
    dailyRows: daily.data?.data ?? [],
    monthlyRows: monthly.data?.data ?? [],
    isLoading: daily.isLoading || monthly.isLoading,
    isError: daily.error || monthly.error,
  };
}
```

---

## 8. Business Logic หลัก

### 8.1 การแปลงปี พ.ศ.

```ts
// lib/buddhistDate.ts
import dayjs from "dayjs";
import "dayjs/locale/th";

export function formatThaiDate(dateISO: string, pattern = "D MMMM") {
  const d = dayjs(dateISO).locale("th");
  const buddhistYear = d.year() + 543;
  return `${d.format(pattern)} ${buddhistYear}`;
}

// ตัวอย่าง: formatThaiDate("2026-07-07") -> "7 กรกฎาคม 2569"
```

ใช้ฟังก์ชันนี้กับทุกจุดที่แสดงวันที่: หัว filter, แกน X กราฟรายวัน, timestamp ของ AI Insight, footer

### 8.2 อัลกอริทึม Fibonacci Weekly Target (หัวใจของ Gauge)

**โจทย์:** เป้าหมายรายเดือน (จากคอลัมน์ `เป้าหมาย`) ต้องถูกกระจายเป็นเป้าหมาย**สะสมรายสัปดาห์** โดยสัปดาห์ต้นเดือนมีเป้าต่ำ สัปดาห์ปลายเดือนมีเป้าสูง (เพราะปกติยอดจะไหลเข้าเยอะขึ้นช่วงปลายเดือน/ใกล้วันตัดยอด) และ **สัปดาห์ในที่นี้นับแบบศุกร์–พฤหัสบดี** เพราะวันสรุปยอดคือวันศุกร์

**ขั้นตอนคำนวณ:**

1. **แบ่งเดือนเป็นสัปดาห์ศุกร์–พฤหัสบดี**
   ตัวอย่าง ก.ค. 2569 (31 วัน, 1 ก.ค. ตรงกับวันพุธ) จะได้ 6 สัปดาห์ โดยจำนวนวันในแต่ละสัปดาห์คือ `[2, 7, 7, 7, 7, 1]` (สัปดาห์แรกกับสัปดาห์สุดท้ายอาจไม่เต็ม 7 วัน เพราะถูกตัดด้วยขอบเขตของเดือน)

2. **กำหนดน้ำหนัก Fibonacci ให้แต่ละสัปดาห์ตามลำดับ** (สัปดาห์ที่ 1 น้ำหนักต่ำสุด ไล่ขึ้นไปสัปดาห์สุดท้ายน้ำหนักสูงสุด) โดยใช้เลขชุด Fibonacci: `1, 1, 2, 3, 5, 8, 13, ...` ตามจำนวนสัปดาห์ที่มีจริงในเดือนนั้น (เดือนหนึ่งมักมี 4-6 สัปดาห์)

3. **ถ่วงน้ำหนักด้วยจำนวนวันจริงของสัปดาห์นั้น**: `weightedScore(week) = fib(week) × จำนวนวันในสัปดาห์นั้น`
   (ป้องกันปัญหาสัปดาห์ต้น/ท้ายเดือนที่มีวันไม่ครบ 7 วัน ไม่ให้ได้สัดส่วนเพี้ยนไปจากที่ควรเป็น)

4. **คำนวณสัดส่วน % ของแต่ละสัปดาห์** = `weightedScore(week) / Σ weightedScore(ทุกสัปดาห์) × 100%`

5. **สะสม (cumulative)**: เป้าหมาย % สะสมของสัปดาห์ที่ n = ผลรวม % ของสัปดาห์ที่ 1 ถึง n (สัปดาห์สุดท้ายจะสะสมได้ 100% พอดี)

6. **แปลงเป็นจำนวนเงิน**: `เป้าหมายสะสม (บาท) ของสัปดาห์ n = เป้าหมายรายเดือนทั้งหมด × %สะสมของสัปดาห์ n`

7. **เป้าหมายรายวัน (สำหรับกราฟแท่งรายวัน)**: ภายในแต่ละสัปดาห์ ให้เฉลี่ยเป้าหมายของสัปดาห์นั้นแบบเส้นตรง (linear) ต่อจำนวนวันในสัปดาห์ แล้วสะสมต่อเนื่องข้ามสัปดาห์ไปเรื่อยๆ จนได้เส้นเป้าหมายสะสมรายวันตลอดทั้งเดือน

```ts
// lib/fibonacciTarget.ts
import dayjs from "dayjs";

/** คืนค่าลำดับ Fibonacci ความยาว n เริ่มที่ 1,1,2,3,5,8,... */
function fibonacciSequence(n: number): number[] {
  const seq = [1, 1];
  while (seq.length < n) {
    seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  }
  return seq.slice(0, n);
}

/** แบ่งเดือน (year, month 1-12) เป็นสัปดาห์ศุกร์-พฤหัสบดี คืนค่าจำนวนวันของแต่ละสัปดาห์ */
export function splitMonthIntoFriThuWeeks(year: number, month: number): number[] {
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const end = start.endOf("month");
  const totalDays = end.date();

  const weeks: number[] = [];
  let cursor = start;
  let daysCounted = 0;

  while (daysCounted < totalDays) {
    // หา "วันพฤหัสบดี" ถัดไป (นับรวมวันปัจจุบันถ้าตรงพฤหัส) เป็นจุดตัดสัปดาห์
    const dayOfWeek = cursor.day(); // 0=อาทิตย์ ... 4=พฤหัส 5=ศุกร์ 6=เสาร์
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    let weekEnd = cursor.add(daysUntilThursday, "day");
    if (weekEnd.isAfter(end)) weekEnd = end;

    const daysInWeek = weekEnd.diff(cursor, "day") + 1;
    weeks.push(daysInWeek);
    daysCounted += daysInWeek;
    cursor = weekEnd.add(1, "day");
  }

  return weeks;
}

export interface WeeklyTarget {
  weekIndex: number;
  daysInWeek: number;
  weekStart: string;
  weekEnd: string;
  percentOfMonth: number;      // % ของสัปดาห์นี้เดี่ยวๆ
  cumulativePercent: number;   // % สะสมถึงสัปดาห์นี้
  cumulativeAmount: number;    // จำนวนเงินสะสมถึงสัปดาห์นี้
}

export function calculateFibonacciWeeklyTargets(
  year: number,
  month: number,
  monthlyTarget: number
): WeeklyTarget[] {
  const daysPerWeek = splitMonthIntoFriThuWeeks(year, month);
  const fib = fibonacciSequence(daysPerWeek.length);

  const weightedScores = daysPerWeek.map((days, i) => days * fib[i]);
  const totalScore = weightedScores.reduce((a, b) => a + b, 0);

  let cumulativePercent = 0;
  let cursorDate = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);

  return daysPerWeek.map((days, i) => {
    const percentOfMonth = (weightedScores[i] / totalScore) * 100;
    cumulativePercent += percentOfMonth;

    const weekStart = cursorDate;
    const weekEnd = cursorDate.add(days - 1, "day");
    cursorDate = weekEnd.add(1, "day");

    return {
      weekIndex: i + 1,
      daysInWeek: days,
      weekStart: weekStart.format("YYYY-MM-DD"),
      weekEnd: weekEnd.format("YYYY-MM-DD"),
      percentOfMonth: Number(percentOfMonth.toFixed(2)),
      cumulativePercent: Number(Math.min(cumulativePercent, 100).toFixed(2)),
      cumulativeAmount: Number(
        ((Math.min(cumulativePercent, 100) / 100) * monthlyTarget).toFixed(2)
      ),
    };
  });
}

/**
 * ขยายเป้าหมายรายสัปดาห์ (แบบสะสม) ให้เป็นเส้นเป้าหมายสะสมรายวัน
 * โดยเฉลี่ยเชิงเส้น (linear) ภายในแต่ละสัปดาห์
 */
export function expandToDailyCumulativeTarget(
  weeklyTargets: WeeklyTarget[],
  monthlyTarget: number
): { date: string; cumulativeTarget: number }[] {
  const result: { date: string; cumulativeTarget: number }[] = [];
  let prevCumulative = 0;

  weeklyTargets.forEach((week) => {
    const weekAmount = ((week.cumulativePercent / 100) * monthlyTarget) - prevCumulative;
    const perDay = weekAmount / week.daysInWeek;

    let d = dayjs(week.weekStart);
    for (let i = 0; i < week.daysInWeek; i++) {
      prevCumulative += perDay;
      result.push({ date: d.format("YYYY-MM-DD"), cumulativeTarget: prevCumulative });
      d = d.add(1, "day");
    }
  });

  return result;
}
```

**ตัวอย่างผลลัพธ์ (ก.ค. 2569, เป้าหมายเดือน = 10,000,000 บาท):**

| สัปดาห์ | จำนวนวัน | Fibonacci | Weighted Score | % สัปดาห์นี้ | % สะสม |
|---|---|---|---|---|---|
| 1 (1–2 ก.ค.) | 2 | 1 | 2 | 2.30% | 2.30% |
| 2 (3–9 ก.ค.) | 7 | 1 | 7 | 8.05% | 10.34% |
| 3 (10–16 ก.ค.) | 7 | 2 | 14 | 16.09% | 26.44% |
| 4 (17–23 ก.ค.) | 7 | 3 | 21 | 24.14% | 50.57% |
| 5 (24–30 ก.ค.) | 7 | 5 | 35 | 40.23% | 90.80% |
| 6 (31 ก.ค.) | 1 | 8 | 8 | 9.20% | 100.00% |

> หมายเหตุ: ตัวเลขในโจทย์ตั้งต้น (10%, 18%...) เป็นตัวอย่างสมมติเพื่ออธิบายแนวคิดสะสมเท่านั้น ค่าจริงคำนวณจากสูตรข้างต้น หากทีมพัฒนาต้องการ curve ที่ชันกว่านี้ (ปลายเดือนสูงกว่านี้อีก) สามารถปรับจุดเริ่มของลำดับ Fibonacci ได้ (เช่นเริ่มที่ 1,2,3,5,8,13 แทน 1,1,2,3,5,8)

### 8.3 Aggregation & Filter Logic

```ts
// lib/aggregate.ts
import { DailyRow, MonthlyRow, DashboardFilters } from "@/types/revenue";

export function applyFilters<T extends { province: string; office: string; businessGroup: string; date: string }>(
  rows: T[],
  filters: DashboardFilters
): T[] {
  return rows.filter((r) => {
    if (filters.province !== "ALL" && r.province !== filters.province) return false;
    if (filters.office !== "ALL" && r.office !== filters.office) return false;
    if (filters.businessGroup !== "ALL" && r.businessGroup !== filters.businessGroup) return false;
    if (r.date < filters.dateFrom || r.date > filters.dateTo) return false;
    return true;
  });
}

export function sumRevenue(rows: { revenue: number }[]): number {
  return rows.reduce((s, r) => s + r.revenue, 0);
}

export function groupByKey<T>(rows: T[], keyFn: (row: T) => string) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return map;
}
```

### 8.4 AI Insight Analysis (Rule-based, ไม่ใช่ AI จริง)

หลักการ: ใช้กฎเชิงสถิติล้วนๆ (ไม่มี LLM/ML) เพื่อสร้างประโยควิเคราะห์ที่ดูน่าเชื่อถือ โดยพิจารณา:

1. **จังหวัด "มาแรง"** = จังหวัดที่มี `%ความคืบหน้าเทียบเป้าสะสม ณ วันนี้` สูงกว่าค่าเฉลี่ยของทุกจังหวัด **และ** มี growth rate ของ 3 วันล่าสุด (เทียบ 3 วันก่อนหน้า) เป็นบวกมากที่สุด
2. **กลุ่มธุรกิจที่ขับเคลื่อน** = กลุ่มธุรกิจที่มีสัดส่วนรายได้สูงสุดของจังหวัดนั้น ณ ช่วงเวลาที่เลือก
3. **มุมมองวิเคราะห์** = ประกอบประโยคจาก template ที่สอดคล้องกับตัวเลขจริง (ไม่ hardcode ชื่อจังหวัด)

```ts
// lib/aiInsight.ts
import { DailyRow, MonthlyRow } from "@/types/revenue";
import { groupByKey, sumRevenue } from "@/lib/aggregate";

interface ProvinceProgress {
  province: string;
  progressPercent: number;
  momentum: number; // % เปลี่ยนแปลงของ 3 วันล่าสุด เทียบ 3 วันก่อนหน้า
  topBusinessGroup: string;
  topBusinessGroupShare: number;
}

export function computeProvinceProgress(
  dailyRows: DailyRow[],
  monthlyRows: MonthlyRow[],
  asOfDate: string
): ProvinceProgress[] {
  const byProvince = groupByKey(dailyRows, (r) => r.province);
  const targetByProvince = groupByKey(monthlyRows, (r) => r.province);

  const results: ProvinceProgress[] = [];

  byProvince.forEach((rows, province) => {
    const actual = sumRevenue(rows.filter((r) => r.date <= asOfDate));
    const target = sumRevenue(targetByProvince.get(province) ?? []);
    const progressPercent = target > 0 ? (actual / target) * 100 : 0;

    // momentum: เทียบผลรวม 3 วันล่าสุด vs 3 วันก่อนหน้านั้น
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const last3 = sorted.slice(-3).reduce((s, r) => s + r.revenue, 0);
    const prev3 = sorted.slice(-6, -3).reduce((s, r) => s + r.revenue, 0);
    const momentum = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0;

    const byGroup = groupByKey(rows, (r) => r.businessGroup);
    let topGroup = "";
    let topGroupSum = 0;
    byGroup.forEach((groupRows, groupName) => {
      const s = sumRevenue(groupRows);
      if (s > topGroupSum) {
        topGroupSum = s;
        topGroup = groupName;
      }
    });
    const totalProvinceRevenue = sumRevenue(rows);

    results.push({
      province,
      progressPercent: Number(progressPercent.toFixed(1)),
      momentum: Number(momentum.toFixed(1)),
      topBusinessGroup: topGroup,
      topBusinessGroupShare: totalProvinceRevenue > 0
        ? Number(((topGroupSum / totalProvinceRevenue) * 100).toFixed(1))
        : 0,
    });
  });

  return results.sort((a, b) => b.momentum - a.momentum);
}

export function generateInsightText(progress: ProvinceProgress[]): string {
  if (progress.length === 0) return "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์";

  const top = progress[0];
  const avgProgress = progress.reduce((s, p) => s + p.progressPercent, 0) / progress.length;
  const comparedToAvg = top.progressPercent - avgProgress;

  const momentumWord = top.momentum >= 0 ? "เพิ่มขึ้น" : "ลดลง";

  return (
    `จังหวัด${top.province} มาแรงที่สุดในช่วงนี้ ด้วยความคืบหน้าเป้าหมายสะสมที่ ${top.progressPercent}% ` +
    `ซึ่งสูงกว่าค่าเฉลี่ยของทุกจังหวัด ${comparedToAvg >= 0 ? "+" : ""}${comparedToAvg.toFixed(1)} จุด ` +
    `โดยแนวโน้มรายได้ 3 วันล่าสุด${momentumWord} ${Math.abs(top.momentum)}% เทียบกับ 3 วันก่อนหน้า ` +
    `แรงขับเคลื่อนหลักมาจากกลุ่มธุรกิจ${top.topBusinessGroup} ` +
    `ซึ่งคิดเป็นสัดส่วนถึง ${top.topBusinessGroupShare}% ของรายได้ทั้งหมดในจังหวัดนี้`
  );
}
```

> **ข้อควรระวังในการนำไปใช้จริง:** ควรมี threshold ขั้นต่ำ (เช่น จังหวัดต้องมีข้อมูลอย่างน้อย 6 วันขึ้นไปถึงจะคำนวณ momentum) ป้องกันข้อมูลน้อยเกินไปทำให้ % ผันผวนเกินจริง

---

## 9. Global State: Filter Context

```tsx
// contexts/FilterContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import dayjs from "dayjs";
import { DashboardFilters } from "@/types/revenue";

const defaultFilters: DashboardFilters = {
  province: "ALL",
  office: "ALL",
  businessGroup: "ALL",
  dateFrom: dayjs().startOf("month").format("YYYY-MM-DD"),
  dateTo: dayjs().format("YYYY-MM-DD"),
};

const FilterContext = createContext<{
  filters: DashboardFilters;
  setFilters: (f: Partial<DashboardFilters>) => void;
}>({ filters: defaultFilters, setFilters: () => {} });

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(defaultFilters);

  const setFilters = (partial: Partial<DashboardFilters>) =>
    setFiltersState((prev) => ({ ...prev, ...partial }));

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
```

---

## 10. รายละเอียด Component แต่ละส่วน

### 10.1 DashboardHeader

```tsx
// components/DashboardHeader.tsx
import { formatThaiDate } from "@/lib/buddhistDate";

export function DashboardHeader({ lastUpdated }: { lastUpdated: string }) {
  return (
    <header className="flex items-baseline justify-between px-8 py-4 border-b border-paper-line">
      <h1 className="font-display text-[28px] font-bold text-ink">
        Dashboard รายได้ประจำวัน สรุปรายเดือน ปข.6
      </h1>
      <span className="text-xs text-ink-soft">
        ข้อมูล ณ วันที่ {formatThaiDate(lastUpdated, "D MMMM")}
      </span>
    </header>
  );
}
```

### 10.2 FilterBar

รองรับ 4 ตัวกรอง: จังหวัด, ที่ทำการ (options เปลี่ยนตามจังหวัดที่เลือก), กลุ่มธุรกิจ, ช่วงวันที่ (date range picker, default = ต้นเดือน–วันนี้)

```tsx
// components/FilterBar.tsx
"use client";
import { useFilters } from "@/contexts/FilterContext";

export function FilterBar({
  provinces, offices, businessGroups,
}: { provinces: string[]; offices: string[]; businessGroups: string[] }) {
  const { filters, setFilters } = useFilters();

  return (
    <div className="flex items-center gap-3 px-8 py-3 bg-paper-soft border-b border-paper-line text-sm">
      <select
        className="rounded-md border border-paper-line bg-paper px-3 py-1.5"
        value={filters.province}
        onChange={(e) => setFilters({ province: e.target.value, office: "ALL" })}
      >
        <option value="ALL">ทุกจังหวัด</option>
        {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select
        className="rounded-md border border-paper-line bg-paper px-3 py-1.5"
        value={filters.office}
        onChange={(e) => setFilters({ office: e.target.value })}
      >
        <option value="ALL">ทุกที่ทำการ</option>
        {offices.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <select
        className="rounded-md border border-paper-line bg-paper px-3 py-1.5"
        value={filters.businessGroup}
        onChange={(e) => setFilters({ businessGroup: e.target.value })}
      >
        <option value="ALL">ทุกกลุ่มธุรกิจ</option>
        {businessGroups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>

      <div className="flex items-center gap-2 ml-auto">
        <input
          type="date"
          className="rounded-md border border-paper-line bg-paper px-2 py-1.5"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ dateFrom: e.target.value })}
        />
        <span className="text-ink-soft">ถึง</span>
        <input
          type="date"
          className="rounded-md border border-paper-line bg-paper px-2 py-1.5"
          value={filters.dateTo}
          onChange={(e) => setFilters({ dateTo: e.target.value })}
        />
      </div>
    </div>
  );
}
```

### 10.3 TotalSummaryGauge (พร้อม Fibonacci Checkpoint)

Gauge เป็นแถบแนวนอน (bar gauge) แสดง % ความคืบหน้าจริง เทียบเส้น checkpoint ที่มาจาก `calculateFibonacciWeeklyTargets` — จุด checkpoint แต่ละจุดคือปลายสัปดาห์แต่ละสัปดาห์ (ตำแหน่ง = % สะสมของสัปดาห์นั้น)

```tsx
// components/TotalSummaryGauge.tsx
import { WeeklyTarget } from "@/lib/fibonacciTarget";

export function TotalSummaryGauge({
  actualRevenue, monthlyTarget, weeklyTargets,
}: { actualRevenue: number; monthlyTarget: number; weeklyTargets: WeeklyTarget[] }) {
  const actualPercent = Math.min((actualRevenue / monthlyTarget) * 100, 100);

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex justify-between items-end mb-2">
        <span className="text-ink-soft text-sm">รายได้สะสมเทียบเป้าหมาย</span>
        <span className="font-display text-3xl font-bold text-brand tabular-nums">
          {actualPercent.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-6 bg-paper-soft rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            actualPercent >= (weeklyTargets.at(-1)?.cumulativePercent ?? 100)
              ? "bg-positive"
              : "bg-brand"
          }`}
          style={{ width: `${actualPercent}%` }}
        />
        {/* จุด Checkpoint รายสัปดาห์ */}
        {weeklyTargets.map((w) => (
          <div
            key={w.weekIndex}
            className="absolute top-0 h-full w-[2px] bg-ink/30"
            style={{ left: `${w.cumulativePercent}%` }}
            title={`สัปดาห์ ${w.weekIndex}: เป้าสะสม ${w.cumulativePercent}%`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-3 text-xs text-ink-soft tabular-nums">
        <span>{actualRevenue.toLocaleString()} บาท</span>
        <span>เป้าหมาย {monthlyTarget.toLocaleString()} บาท</span>
      </div>
    </div>
  );
}
```

### 10.4 DailyProgressChart (กราฟแท่งรายวัน เทียบเป้าสะสม)

```tsx
// components/DailyProgressChart.tsx
"use client";
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatThaiDate } from "@/lib/buddhistDate";

interface DataPoint { date: string; actual: number; cumulativeTarget: number }

export function DailyProgressChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 h-full">
      <h2 className="text-sm font-semibold text-ink mb-2">รายได้รายวันเทียบเป้าหมายสะสม</h2>
      <ResponsiveContainer width="100%" height="88%">
        <ComposedChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatThaiDate(d, "D MMM")}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(d) => formatThaiDate(String(d), "D MMMM")}
            formatter={(v: number) => v.toLocaleString() + " บาท"}
          />
          <Bar dataKey="actual" fill="#264C73" radius={[4, 4, 0, 0]} name="รายได้จริง" />
          <Line
            dataKey="cumulativeTarget"
            stroke="#B5652F"
            strokeWidth={2}
            dot={false}
            name="เป้าหมายสะสม"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 10.5 ProvinceRankingChart (กราฟแท่งแนวนอน จัดอันดับจังหวัด)

```tsx
// components/ProvinceRankingChart.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface RankItem { province: string; progressPercent: number; revenue: number }

export function ProvinceRankingChart({ data }: { data: RankItem[] }) {
  const sorted = [...data].sort((a, b) => b.progressPercent - a.progressPercent);

  return (
    <div className="bg-white rounded-xl shadow-card p-4 h-full">
      <h2 className="text-sm font-semibold text-ink mb-2">อันดับความคืบหน้ารายจังหวัด</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 40 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="province" tick={{ fontSize: 11 }} width={90} />
          <Tooltip
            formatter={(v: number, name, props) =>
              [`${v}% (${props.payload.revenue.toLocaleString()} บาท)`, "ความคืบหน้า"]
            }
          />
          <Bar dataKey="progressPercent" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={entry.progressPercent >= 100 ? "#3E7C59" : "#264C73"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 10.6 OfficePerformancePanels (2 Element: เกินเป้า / ต่ำกว่าเป้า)

```tsx
// components/OfficePerformancePanels.tsx
interface OfficeItem { office: string; progressPercent: number; revenue: number }

function OfficeList({ title, items, tone }: { title: string; items: OfficeItem[]; tone: "positive" | "warning" }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 flex-1">
      <h2 className={`text-sm font-semibold mb-2 ${tone === "positive" ? "text-positive" : "text-warning"}`}>
        {title}
      </h2>
      <ul className="space-y-1.5 text-xs">
        {items.map((o) => (
          <li key={o.office} className="flex justify-between items-center">
            <span className="text-ink">{o.office}</span>
            <span className={`tabular-nums font-medium ${tone === "positive" ? "text-positive" : "text-warning"}`}>
              {o.progressPercent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OfficePerformancePanels({
  outperforming, underperforming,
}: { outperforming: OfficeItem[]; underperforming: OfficeItem[] }) {
  return (
    <div className="flex gap-4 h-full">
      <OfficeList title="ที่ทำการ ทำได้เกินเป้าคาดหมาย" items={outperforming} tone="positive" />
      <OfficeList title="ที่ทำการ ต่ำกว่าเป้าคาดหมาย" items={underperforming} tone="warning" />
    </div>
  );
}
```

### 10.7 BusinessGroupDonut

```tsx
// components/BusinessGroupDonut.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#264C73", "#5E85A8", "#B5652F", "#3E7C59", "#9C8F6B", "#8A7D5C"];

export function BusinessGroupDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 h-full">
      <h2 className="text-sm font-semibold text-ink mb-2">สัดส่วนรายได้ตามกลุ่มธุรกิจ</h2>
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString() + " บาท"} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 10.8 AIInsightPanel

```tsx
// components/AIInsightPanel.tsx
export function AIInsightPanel({ insightText }: { insightText: string }) {
  return (
    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-brand font-semibold text-sm">AI Insight Analysis</span>
        <span className="text-[10px] text-ink-soft bg-paper-soft rounded-full px-2 py-0.5">
          วิเคราะห์อัตโนมัติ
        </span>
      </div>
      <p className="text-sm text-ink leading-relaxed">{insightText}</p>
    </div>
  );
}
```

### 10.9 DashboardFooterNote

```tsx
// components/DashboardFooterNote.tsx
export function DashboardFooterNote() {
  return (
    <footer className="text-center text-[11px] text-ink-soft py-2 border-t border-paper-line">
      ข้อมูลนี้เป็นเพียงการคาดการณ์รายได้เท่านั้น
    </footer>
  );
}
```

---

## 11. การประกอบหน้า Page Layout

โครง grid ภายใน stage 1920×1080 (แนะนำ CSS grid แบบ 12 คอลัมน์ x หลายแถว):

```
┌─────────────────────────────────────────────────────────────┐
│ Header (ชื่อ Dashboard + วันที่อัปเดต)                          │  ~64px
├─────────────────────────────────────────────────────────────┤
│ FilterBar (จังหวัด / ที่ทำการ / กลุ่มธุรกิจ / ช่วงวันที่)          │  ~52px
├───────────────────────────┬───────────────────────────────────┤
│ TotalSummaryGauge          │ AIInsightPanel                    │  ~140px
├───────────────────────────┴───────────────────────────────────┤
│ DailyProgressChart (กราฟแท่งรายวัน เทียบเป้าสะสม)                │  ~300px
├───────────────────────────┬───────────────────────────────────┤
│ ProvinceRankingChart        │ BusinessGroupDonut                │  ~300px
├───────────────────────────┴───────────────────────────────────┤
│ OfficePerformancePanels (เกินเป้า | ต่ำกว่าเป้า)                  │  ~180px
├─────────────────────────────────────────────────────────────┤
│ FooterNote                                                    │  ~32px
└─────────────────────────────────────────────────────────────┘
```

```tsx
// app/page.tsx (โครงสร้างการประกอบ ภายใน stage 1920x1080)
<div className="w-[1920px] h-[1080px] flex flex-col bg-paper">
  <DashboardHeader lastUpdated={lastUpdated} />
  <FilterBar provinces={provinces} offices={offices} businessGroups={businessGroups} />

  <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 p-4 overflow-hidden">
    <div className="col-span-8 row-span-1"><TotalSummaryGauge {...gaugeProps} /></div>
    <div className="col-span-4 row-span-1"><AIInsightPanel insightText={insightText} /></div>

    <div className="col-span-12 row-span-2"><DailyProgressChart data={dailySeries} /></div>

    <div className="col-span-8 row-span-2"><ProvinceRankingChart data={rankingData} /></div>
    <div className="col-span-4 row-span-2"><BusinessGroupDonut data={donutData} /></div>

    <div className="col-span-12 row-span-1">
      <OfficePerformancePanels outperforming={topOffices} underperforming={bottomOffices} />
    </div>
  </div>

  <DashboardFooterNote />
</div>
```

### 11.1 Responsive Layout (มือถือ/แท็บเล็ต, < 1024px)

เมื่อ `isDesktopStage = false` ให้ใช้ layout stack แนวตั้งแทน grid:

```tsx
<main className="flex flex-col gap-4 p-4 bg-paper min-h-screen">
  <DashboardHeader lastUpdated={lastUpdated} />
  <FilterBar {...filterProps} /> {/* ปรับเป็น select แบบ full-width วางต่อกันแนวตั้ง */}
  <TotalSummaryGauge {...gaugeProps} />
  <AIInsightPanel insightText={insightText} />
  <div className="h-[260px]"><DailyProgressChart data={dailySeries} /></div>
  <div className="h-[300px]"><ProvinceRankingChart data={rankingData} /></div>
  <div className="h-[280px]"><BusinessGroupDonut data={donutData} /></div>
  <OfficePerformancePanels outperforming={topOffices} underperforming={bottomOffices} />
  <DashboardFooterNote />
</main>
```

บนมือถือ `OfficePerformancePanels` ควรปรับ `flex gap-4` เป็น `flex-col gap-4` (ผ่าน Tailwind breakpoint `sm:flex-row`) เพื่อไม่ให้การ์ด 2 อันบีบแคบเกินไป

---

## 12. Performance, Caching, Error Handling

- **Server-side revalidate**: ตั้ง `export const revalidate = 300` ใน API route เพื่อลดการเรียก Google Sheets API ถี่เกินไป (ลด rate limit risk)
- **Client cache**: ใช้ SWR `refreshInterval` 5 นาที คู่กับปุ่ม "รีเฟรชข้อมูล" แบบ manual (เผื่อกรณีต้องการข้อมูลสดทันที)
- **Loading state**: แสดง skeleton (การ์ด/กราฟสีเทาอ่อนกระพริบ) ระหว่างรอข้อมูล ไม่ปล่อยหน้าจอว่างเปล่า
- **Error state**: ถ้า fetch ไม่สำเร็จ แสดงข้อความ "ไม่สามารถโหลดข้อมูลได้ในขณะนี้" พร้อมปุ่มลองใหม่ ไม่ทำให้ทั้งหน้า crash (ใช้ React Error Boundary ครอบแต่ละ section)
- **Data validation**: ก่อนคำนวณ ควร filter แถวที่ `รายได้`/`เป้าหมาย` parse เป็นตัวเลขไม่ได้ทิ้ง และ log แจ้งเตือนแยกไว้ (กันชีตต้นทางพิมพ์ผิดพลาด)

---

## 13. Deployment Notes

- แนะนำ deploy บน **Vercel** (รองรับ Next.js App Router + ISR/revalidate โดยตรง)
- เก็บ credential ของ Service Account ใน Environment Variables:
  - `GOOGLE_SHEET_ID`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- ต้องแชร์สิทธิ์ "Viewer" ของ Google Sheet ให้กับ service account email ก่อนใช้งานจริง
- ถ้าต้องการ auto-refresh แบบ real-time มากขึ้น พิจารณาใช้ Google Apps Script webhook แจ้งเตือนแทนการ poll ถี่เกินไป

---

## 14. Roadmap / Future Enhancements

- เพิ่มการ export เป็น PDF/PNG ของ dashboard ปัจจุบัน (screenshot การ์ดแบบ snapshot)
- เพิ่มโหมดเปรียบเทียบปีปัจจุบัน vs ปีก่อนหน้า (YoY) ในกราฟรายวัน
- เพิ่ม Notification เมื่อจังหวัด/ที่ทำการใดหลุดต่ำกว่าเป้า checkpoint ประจำสัปดาห์ (แจ้งเตือนผ่าน LINE Notify)
- ปรับ AI Insight ให้รองรับหลายประโยค (จังหวัดมาแรงอันดับ 2-3) แบบ carousel

---

**จบเอกสาร Development Document**
