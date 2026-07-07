// components/DailyProgressChart.tsx
"use client";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatThaiDateShort } from "@/lib/buddhistDate";

interface DataPoint {
  date: string;
  actual: number;        // รายได้วันนั้น (ไม่สะสม)
  cumulative: number;    // รายได้สะสม
  cumulativeTarget: number; // เป้าหมายสะสม
}

interface DailyProgressChartProps {
  data: DataPoint[];
  today: string;
}

function formatYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid var(--color-paper-line)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        boxShadow: "var(--shadow-card)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p style={{ fontWeight: 600, margin: "0 0 4px", color: "var(--color-ink)" }}>
        {label ? formatThaiDateShort(label) : ""}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: ฿{Number(p.value).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

export function DailyProgressChart({ data, today }: DailyProgressChartProps) {
  return (
    <div className="card" style={{ padding: "14px 16px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>
          รายได้รายวันเทียบเป้าหมายสะสม
        </h2>
        <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "var(--color-brand)", display: "inline-block" }} />
            รายได้จริง (รายวัน)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 3, backgroundColor: "var(--color-positive)", display: "inline-block" }} />
            สะสมจริง
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 3, backgroundColor: "var(--color-warning)", display: "inline-block", borderTop: "2px dashed var(--color-warning)" }} />
            เป้าหมายสะสม
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-line)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatThaiDateShort(d)}
              tick={{ fontSize: 10, fill: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-paper-line)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="daily"
              orientation="left"
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <YAxis
              yAxisId="cumulative"
              orientation="right"
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* วันปัจจุบัน */}
            <ReferenceLine
              yAxisId="daily"
              x={today}
              stroke="var(--color-ink-soft)"
              strokeDasharray="4 2"
              strokeWidth={1}
            />
            {/* แท่งรายวัน */}
            <Bar
              yAxisId="daily"
              dataKey="actual"
              name="รายได้รายวัน"
              fill="var(--color-brand)"
              radius={[3, 3, 0, 0]}
              opacity={0.85}
              maxBarSize={28}
            />
            {/* เส้นสะสมจริง */}
            <Line
              yAxisId="cumulative"
              dataKey="cumulative"
              name="สะสมจริง"
              stroke="var(--color-positive)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {/* เส้นเป้าหมายสะสม */}
            <Line
              yAxisId="cumulative"
              dataKey="cumulativeTarget"
              name="เป้าหมายสะสม"
              stroke="var(--color-warning)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
