// components/TotalSummaryGauge.tsx
import { WeeklyTarget } from "@/lib/fibonacciTarget";

interface TotalSummaryGaugeProps {
  actualRevenue: number;
  monthlyTarget: number;
  weeklyTargets: WeeklyTarget[];
  currentWeekIndex: number; // 0-based
}

function formatMoney(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

export function TotalSummaryGauge({
  actualRevenue,
  monthlyTarget,
  weeklyTargets,
  currentWeekIndex,
}: TotalSummaryGaugeProps) {
  const actualPercent = monthlyTarget > 0
    ? Math.min((actualRevenue / monthlyTarget) * 100, 100)
    : 0;

  // เป้าสัปดาห์ปัจจุบัน (cumulative %)
  const currentWeekTarget = weeklyTargets[currentWeekIndex];
  const weekTargetPercent = currentWeekTarget?.cumulativePercent ?? 0;
  const isOnTrack = actualPercent >= weekTargetPercent;

  const gaugeColor = isOnTrack ? "var(--color-positive)" : "var(--color-brand)";

  return (
    <div
      className="card"
      style={{ padding: "16px 20px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
    >
      {/* Top row: title + big percent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--color-ink-soft)", margin: 0 }}>
            รายได้สะสมเทียบเป้าหมายรายเดือน
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 38,
                fontWeight: 700,
                color: isOnTrack ? "var(--color-positive)" : "var(--color-brand)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {actualPercent.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 9999,
                backgroundColor: isOnTrack ? "var(--color-positive-soft)" : "var(--color-warning-soft)",
                color: isOnTrack ? "var(--color-positive)" : "var(--color-warning)",
                fontWeight: 600,
              }}
            >
              {isOnTrack ? `เกินเป้าสัปดาห์` : `ต่ำกว่าเป้า ${(weekTargetPercent - actualPercent).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Week target info */}
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "var(--color-ink-soft)", margin: 0 }}>
            เป้าสะสมสัปดาห์ที่ {currentWeekIndex + 1}
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-brand)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {weekTargetPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Gauge bar */}
      <div style={{ position: "relative", margin: "4px 0" }}>
        <div
          className="gauge-track"
          style={{ height: 12, backgroundColor: "var(--color-paper-soft)", borderRadius: 9999, overflow: "visible" }}
        >
          {/* Actual fill */}
          <div
            className="gauge-fill"
            style={{
              width: `${actualPercent}%`,
              height: "100%",
              backgroundColor: gaugeColor,
              borderRadius: 9999,
              transition: "width 0.8s ease",
            }}
          />

          {/* Week checkpoint markers */}
          {weeklyTargets.slice(0, -1).map((w) => (
            <div
              key={w.weekIndex}
              className="gauge-checkpoint"
              style={{ left: `${w.cumulativePercent}%` }}
              title={`สัปดาห์ ${w.weekIndex}: เป้าสะสม ${w.cumulativePercent}%`}
            />
          ))}

          {/* Current week target marker (highlighted) */}
          {currentWeekTarget && (
            <div
              style={{
                position: "absolute",
                top: -3,
                left: `${weekTargetPercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 18,
                  backgroundColor: "var(--color-brand)",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--color-brand)",
                  whiteSpace: "nowrap",
                }}
              >
                สัปดาห์ {currentWeekIndex + 1}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: amounts */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 12,
          color: "var(--color-ink-soft)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>
          <strong style={{ color: "var(--color-ink)", fontSize: 13 }}>
            ฿{actualRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          </strong>{" "}
          รายได้จริง
        </span>
        <span>
          เป้าหมาย ฿{monthlyTarget.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Weekly checkpoints legend */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        {weeklyTargets.map((w, i) => (
          <div
            key={w.weekIndex}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: i === currentWeekIndex ? "var(--color-brand)" : "var(--color-paper-soft)",
              color: i === currentWeekIndex ? "white" : "var(--color-ink-soft)",
              border: `1px solid ${i === currentWeekIndex ? "var(--color-brand)" : "var(--color-paper-line)"}`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            สป.{w.weekIndex}: {w.cumulativePercent}%
          </div>
        ))}
      </div>
    </div>
  );
}
