import dayjs from "dayjs";
import { WeeklyTarget } from "@/lib/fibonacciTarget";
import { DailyRow } from "@/types/revenue";
import { sumRevenue } from "@/lib/aggregate";

interface WeeklyTargetBoxesProps {
  actualRevenue: number;    // cumulative revenue for entire month (for gauge)
  monthlyTarget: number;
  weeklyTargets: WeeklyTarget[];
  currentWeekIndex: number; // 0-based
  filteredDaily: DailyRow[];  // daily rows for the whole month
  today: string;              // current date
  selectedWeekIndex?: number | 'MONTH' | null;
  onSelectWeek?: (index: number | 'MONTH') => void;
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
  filteredDaily,
  today,
  selectedWeekIndex,
  onSelectWeek,
}: WeeklyTargetBoxesProps) {
  // Cumulative progress for gauge bar
  const cumulativePercent = monthlyTarget > 0 ? (actualRevenue / monthlyTarget) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      {/* Weekly cards row */}
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {weeklyTargets.map((w, i) => {
          // Per-week target (NOT cumulative)
          const prevCumAmount = i === 0 ? 0 : weeklyTargets[i - 1].cumulativeAmount;
          const weekTarget = w.cumulativeAmount - prevCumAmount;

          const prevCumPercent = i === 0 ? 0 : weeklyTargets[i - 1].cumulativePercent;
          const weekTargetPercent = w.cumulativePercent - prevCumPercent;

          // Per-week actual revenue: only from days within this week's range (and <= today)
          const weekActual = sumRevenue(
            filteredDaily.filter(
              (r) => r.date >= w.weekStart && r.date <= w.weekEnd && r.date <= today
            )
          );

          // Progress for this specific week
          const weekProgressPercent = weekTarget > 0 ? (weekActual / weekTarget) * 100 : 0;
          const fillPercent = Math.min(weekProgressPercent, 100);

          const isCurrentWeek = i === currentWeekIndex;
          const isPast = i < currentWeekIndex;
          const isFuture = i > currentWeekIndex;
          const isCompleted = weekActual >= weekTarget && weekTarget > 0;
          
          const isSelected = selectedWeekIndex === i;

          // Date range label
          const startDay = dayjs(w.weekStart).date();
          const endDay = dayjs(w.weekEnd).date();

          // Status colors
          let borderColor = "var(--color-paper-line)";
          let barColor = "var(--color-brand)";
          let statusText = "";
          let statusBg = "";
          let statusColor = "";

          if (isPast && isCompleted) {
            borderColor = "var(--color-positive)";
            barColor = "var(--color-positive)";
            statusText = "✓ ผ่าน";
            statusBg = "var(--color-positive-soft)";
            statusColor = "var(--color-positive)";
          } else if (isPast && !isCompleted) {
            borderColor = "var(--color-warning)";
            barColor = "var(--color-warning)";
            statusText = "✗ ไม่ผ่าน";
            statusBg = "var(--color-warning-soft)";
            statusColor = "var(--color-warning)";
          } else if (isCurrentWeek && isCompleted) {
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

          return (
            <div
              key={w.weekIndex}
              className="card"
              onClick={() => onSelectWeek?.(i)}
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
                transition: "all 0.2s ease",
                minWidth: 0,
                cursor: "pointer",
                backgroundColor: isSelected ? "#f4f8fc" : "var(--color-paper)",
                boxShadow: isSelected ? "0 0 0 2px var(--color-brand)" : "var(--shadow-card)",
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

              {/* Weekly Progress % */}
              <div style={{ fontSize: 28, fontWeight: 700, color: isCompleted ? "var(--color-positive)" : isPast ? "var(--color-warning)" : "var(--color-brand)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, marginBottom: 2 }}>
                {weekProgressPercent.toFixed(1)}%
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink-soft)", marginLeft: 4 }}>
                  / {weekTargetPercent.toFixed(0)}%
                </span>
              </div>

              {/* Revenue amount */}
              <div style={{ fontSize: 14, color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
                ฿{formatBaht(weekActual)} / ฿{formatBaht(weekTarget)}
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
                    width: `${fillPercent}%`,
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

      {/* Cumulative Gauge Bar for entire month */}
      <div
        className="card"
        onClick={() => onSelectWeek?.('MONTH')}
        style={{
          padding: "8px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          cursor: "pointer",
          backgroundColor: selectedWeekIndex === 'MONTH' ? "#f4f8fc" : "var(--color-paper)",
          boxShadow: selectedWeekIndex === 'MONTH' ? "0 0 0 2px var(--color-brand)" : "var(--shadow-card)",
          transition: "all 0.2s ease"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>
            ความคืบหน้าสะสมเดือน
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: cumulativePercent >= 100 ? "var(--color-positive)" : "var(--color-brand)", fontVariantNumeric: "tabular-nums" }}>
            {cumulativePercent.toFixed(1)}%
          </span>
        </div>

        {/* Gauge track */}
        <div style={{ position: "relative" }}>
          <div
            className="gauge-track"
            style={{ height: 18, backgroundColor: "var(--color-paper-soft)", borderRadius: 9999, overflow: "visible" }}
          >
            {/* Actual fill */}
            <div
              className="gauge-fill"
              style={{
                width: `${Math.min(cumulativePercent, 100)}%`,
                height: "100%",
                backgroundColor: cumulativePercent >= 100 ? "var(--color-positive)" : "var(--color-brand)",
                borderRadius: 9999,
                transition: "width 0.8s ease",
              }}
            />

            {/* Week checkpoint markers */}
            {weeklyTargets.map((w, idx) => (
              <div
                key={w.weekIndex}
                style={{
                  position: "absolute",
                  top: -3,
                  bottom: -3,
                  left: `${w.cumulativePercent}%`,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 24,
                    backgroundColor: idx === currentWeekIndex ? "var(--color-brand)" : "rgba(43,42,40,0.3)",
                    borderRadius: 1,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: idx === currentWeekIndex ? 700 : 500,
                    color: idx === currentWeekIndex ? "var(--color-brand)" : "var(--color-ink-soft)",
                    whiteSpace: "nowrap",
                    marginTop: 1,
                  }}
                >
                  W{w.weekIndex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Amounts */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", marginTop: 14 }}>
          <span>
            <strong style={{ color: "var(--color-ink)" }}>฿{formatBaht(actualRevenue)}</strong>{" "}รายได้สะสมจริง
          </span>
          <span>
            เป้าเดือน ฿{formatBaht(monthlyTarget)}
          </span>
        </div>
      </div>
    </div>
  );
}
