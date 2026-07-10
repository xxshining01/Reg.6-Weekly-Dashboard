"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface RankItem {
  name: string; // province or office name
  progressPercent: number;
  revenue: number;
  target: number;
}

function formatBaht(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { payload: RankItem }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
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
      <p style={{ fontWeight: 700, margin: "0 0 4px", color: "var(--color-ink)" }}>
        {d.name}
      </p>
      <p style={{ margin: "2px 0", color: "var(--color-ink-soft)" }}>
        ความคืบหน้า: <strong style={{ color: d.progressPercent >= 100 ? "var(--color-positive)" : "var(--color-brand)" }}>{d.progressPercent.toFixed(1)}%</strong>
      </p>
      <p style={{ margin: "2px 0", color: "var(--color-ink-soft)" }}>
        รายได้: ฿{d.revenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
      </p>
      <p style={{ margin: "2px 0", color: "var(--color-ink-soft)" }}>
        เป้าหมาย: ฿{d.target.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

export function RankingChart({ data, title, isDrillDown }: { data: RankItem[]; title: string; isDrillDown?: boolean }) {
  // Filter out items with 0 target
  const validData = data.filter((d) => d.target > 0);
  const sorted = [...validData].sort((a, b) => b.progressPercent - a.progressPercent);

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const item = sorted[index];
    if (!item) return null;
    
    const revStr = formatBaht(item.revenue);
    const tgtStr = formatBaht(item.target);

    return (
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        fill="var(--color-ink-soft)"
        fontSize={12}
        fontFamily="var(--font-sans)"
        fontWeight={600}
      >
        {Number(value).toFixed(1)}% <tspan fill="var(--color-ink-soft)" fontWeight={400} fontSize={11}>({revStr} / {tgtStr})</tspan>
      </text>
    );
  };

  return (
    <div className="card" style={{ padding: "14px 16px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 15, color: "var(--color-ink-soft)" }}>
          % เทียบเป้าหมาย
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 2, right: 110, bottom: 2, left: 8 }}
          >
            <XAxis
              type="number"
              domain={[0, Math.max(100, ...sorted.map((d) => d.progressPercent))]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 14, fill: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-paper-line)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickFormatter={(name) => (isDrillDown && name.length >= 5 ? name.substring(0, 5) : name)}
              tick={{ fontSize: 15, fill: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
              tickLine={false}
              axisLine={false}
              width={100}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="progressPercent" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {sorted.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.progressPercent >= 100
                      ? "var(--color-positive)"
                      : entry.progressPercent >= 80
                      ? "var(--color-brand)"
                      : "var(--color-warning)"
                  }
                />
              ))}
              <LabelList content={renderCustomLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
