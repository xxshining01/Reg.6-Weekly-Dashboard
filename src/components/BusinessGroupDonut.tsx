"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PALETTE = [
  "#264C73", // brand
  "#3E7C59", // positive
  "#B5652F", // warning
  "#5E85A8", // brand-light
  "#9C8F6B", // warm tan
  "#7B6FA0", // muted purple
  "#2E8B8B", // teal
  "#8A7D5C", // dark tan
];

interface DonutItem {
  name: string;
  value: number;
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { percent?: number } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  const percent = d.payload.percent || 0;
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid var(--color-paper-line)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 16,
        boxShadow: "var(--shadow-card)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p style={{ fontWeight: 700, margin: "0 0 2px", color: "var(--color-ink)" }}>
        {d.name}
      </p>
      <p style={{ margin: 0, color: "var(--color-ink-soft)" }}>
        ฿{Number(d.value).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
      </p>
      <p style={{ margin: 0, color: "var(--color-ink-soft)" }}>
        {(percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

function CustomLegend({ payload, total }: {
  payload?: { value: string; color: string; payload: DonutItem }[];
  total: number;
}) {
  if (!payload || total === 0) return null;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {payload.map((entry, i) => {
        const pct = (entry.payload.value / total) * 100;
        return (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 15,
              color: "var(--color-ink)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {entry.value}
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-brand)", fontVariantNumeric: "tabular-nums" }}>
              {pct.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // hide very small labels

  return (
    <text
      x={x}
      y={y}
      fill="#1a1a1a"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
      fontFamily="var(--font-sans)"
      style={{ textShadow: "0px 0px 4px rgba(255,255,255,0.9), 0px 0px 8px rgba(255,255,255,0.7)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function BusinessGroupDonut({ data }: { data: DonutItem[] }) {
  const filtered = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card" style={{ padding: "14px 16px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>
          สัดส่วนรายได้ตามกลุ่มธุรกิจ
        </h2>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              innerRadius="35%"
              outerRadius="90%"
              strokeWidth={2}
              stroke="var(--color-paper)"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<CustomLegend total={total} />}
              wrapperStyle={{ paddingLeft: 8, width: 220 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 8, fontSize: 15, color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
        รวม: ฿{total.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
