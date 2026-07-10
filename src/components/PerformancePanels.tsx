interface PerformanceItem {
  name: string;
  progressPercent: number;
  revenue: number;
  target: number;
}

function formatBaht(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function PerformanceList({
  title,
  items,
  tone,
  emptyMessage,
}: {
  title: string;
  items: PerformanceItem[];
  tone: "positive" | "warning";
  emptyMessage?: string;
}) {
  const color = tone === "positive" ? "var(--color-positive)" : "var(--color-warning)";
  const bgColor = tone === "positive" ? "var(--color-positive-soft)" : "var(--color-warning-soft)";

  return (
    <div
      className="card"
      style={{
        flex: 1,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: "1px solid var(--color-paper-line)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <h2 style={{ fontSize: 17, fontWeight: 700, color, margin: 0 }}>{title}</h2>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 15,
            backgroundColor: bgColor,
            color,
            padding: "2px 8px",
            borderRadius: 9999,
            fontWeight: 600,
          }}
        >
          {items.length} รายการ
        </span>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p style={{ fontSize: 16, color: "var(--color-ink-soft)", textAlign: "center", margin: "auto 0" }}>
          {emptyMessage ?? "ไม่มีข้อมูล"}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((o, i) => {
            const pct = o.progressPercent;
            return (
              <li
                key={o.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 16,
                }}
              >
                {/* Rank */}
                <span
                  style={{
                    width: 20,
                    fontSize: 15,
                    color: "var(--color-ink-soft)",
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                  }}
                >
                  {i + 1}.
                </span>

                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    color: "var(--color-ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                  title={o.name}
                >
                  {o.name}
                </span>

                {/* Amounts (Rev / Target) */}
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-ink-soft)",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                    marginRight: 4,
                  }}
                >
                  {formatBaht(o.revenue)} / {formatBaht(o.target)}
                </span>

                {/* Mini bar */}
                <div
                  style={{
                    width: 60,
                    height: 8,
                    backgroundColor: "var(--color-paper-soft)",
                    borderRadius: 4,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: "100%",
                      backgroundColor: color,
                      borderRadius: 4,
                    }}
                  />
                </div>

                {/* Percent */}
                <span
                  style={{
                    width: 64,
                    textAlign: "right",
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PerformancePanels({
  outperforming,
  underperforming,
  titlePrefix,
}: {
  outperforming: PerformanceItem[];
  underperforming: PerformanceItem[];
  titlePrefix: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, height: "100%" }}>
      <PerformanceList
        title={`${titlePrefix} ทำได้ตามหรือเกินเป้าสะสม`}
        items={outperforming}
        tone="positive"
        emptyMessage={`ยังไม่มี${titlePrefix}ที่ทำได้ตามเป้า`}
      />
      <PerformanceList
        title={`${titlePrefix} ต่ำกว่าเป้าสะสม`}
        items={underperforming}
        tone="warning"
        emptyMessage={`ทุก${titlePrefix}ทำได้ตามเป้า 🎉`}
      />
    </div>
  );
}

export type { PerformanceItem };
