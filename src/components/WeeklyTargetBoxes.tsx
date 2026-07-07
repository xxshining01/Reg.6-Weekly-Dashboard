import dayjs from "dayjs";
import { WeeklyTarget } from "@/lib/fibonacciTarget";

interface WeeklyTargetBoxesProps {
  actualRevenue: number;
  monthlyTarget: number;
  weeklyTargets: WeeklyTarget[];
  currentWeekIndex: number; // 0-based
}

function formatBaht(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function WeeklyTargetBoxes({
  actualRevenue,
  monthlyTarget,
  weeklyTargets,
  currentWeekIndex,
}: WeeklyTargetBoxesProps) {
  const actualPercent = monthlyTarget > 0 ? (actualRevenue / monthlyTarget) * 100 : 0;

  return (
    <div style={{ display: "flex", gap: 8, height: "100%" }}>
      {weeklyTargets.map((w, i) => {
        const prevCum = i === 0 ? 0 : weeklyTargets[i - 1].cumulativePercent;
        const thisCumTarget = w.cumulativePercent;
        const prevCumAmount = (prevCum / 100) * monthlyTarget;
        const thisCumAmount = w.cumulativeAmount;

        // Fill progress within this card's range
        let fillPercent = 0;
        if (actualPercent >= thisCumTarget) {
          fillPercent = 100;
        } else if (actualPercent > prevCum) {
          fillPercent = ((actualPercent - prevCum) / (thisCumTarget - prevCum)) * 100;
        }

        const isCurrentWeek = i === currentWeekIndex;
        const isPast = i < currentWeekIndex;
        const isFuture = i > currentWeekIndex;
        const isCompleted = fillPercent >= 100;

        // Date range label: "1-7" format
        const startDay = dayjs(w.weekStart).date();
        const endDay = dayjs(w.weekEnd).date();

        // Status colors
        let borderColor = "var(--color-paper-line)";
        let barColor = "var(--color-brand)";
        let statusText = "";
        let statusBg = "";
        let statusColor = "";

        if (isCompleted) {
          borderColor = "var(--color-positive)";
          barColor = "var(--color-positive)";
          statusText = "✓ ผ่าน";
          statusBg = "var(--color-positive-soft)";
          statusColor = "var(--color-positive)";
        } else if (isCurrentWeek) {
          borderColor = "var(--color-brand)";
          barColor = "var(--color-brand)";
          statusText = "◉ สัปดาห์นี้";
          statusBg = "rgba(38,76,115,0.1)";
          statusColor = "var(--color-brand)";
        } else if (isFuture) {
          statusText = "รอ";
          statusBg = "var(--color-paper-soft)";
          statusColor = "var(--color-ink-soft)";
        }

        // How much of cumulative revenue falls into this week's box
        const weekActualRevenue = Math.min(actualRevenue, thisCumAmount) - Math.min(actualRevenue, prevCumAmount);
        const weekActualRevenueDisplay = Math.max(0, weekActualRevenue);

        return (
          <div
            key={w.weekIndex}
            className="card"
            style={{
              flex: 1,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor,
              borderWidth: isCurrentWeek ? 2 : 1,
              borderStyle: "solid",
              opacity: isFuture ? 0.5 : 1,
              transition: "all 0.3s ease",
              minWidth: 0,
            }}
          >
            {/* Header: Week Label + Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isCurrentWeek ? "var(--color-brand)" : "var(--color-ink)",
                }}
              >
                W{w.weekIndex} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink-soft)" }}>({startDay}-{endDay})</span>
              </span>
              {statusText && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    backgroundColor: statusBg,
                    color: statusColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusText}
                </span>
              )}
            </div>

            {/* Cumulative Progress % */}
            <div style={{ fontSize: 28, fontWeight: 700, color: isCompleted ? "var(--color-positive)" : "var(--color-brand)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, marginBottom: 2 }}>
              {Math.min(actualPercent, thisCumTarget).toFixed(1)}%
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink-soft)", marginLeft: 4 }}>
                / {thisCumTarget.toFixed(0)}%
              </span>
            </div>

            {/* Revenue amount */}
            <div style={{ fontSize: 14, color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
              ฿{formatBaht(Math.min(actualRevenue, thisCumAmount))} / ฿{formatBaht(thisCumAmount)}
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: 10,
                backgroundColor: "var(--color-paper-soft)",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(fillPercent, 100)}%`,
                  height: "100%",
                  backgroundColor: barColor,
                  borderRadius: 5,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
