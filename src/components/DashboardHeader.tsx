// components/DashboardHeader.tsx
import { formatThaiDate, getThaiMonthYear } from "@/lib/buddhistDate";

interface DashboardHeaderProps {
  lastUpdated: string; // ISO date
  monthYear: string;   // ISO date of the month being shown
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({
  lastUpdated,
  monthYear,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        height: "64px",
        borderBottom: "1px solid var(--color-paper-line)",
        backgroundColor: "var(--color-paper)",
        flexShrink: 0,
      }}
    >
      {/* Left: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Thai Post emblem-inspired dot */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "white", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            ป
          </span>
        </div>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Dashboard รายได้ประจำวัน สรุปรายเดือน ปข.6
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-ink-soft)",
              margin: 0,
              marginTop: 2,
            }}
          >
            ประจำเดือน{getThaiMonthYear(monthYear)}
          </p>
        </div>
      </div>

      {/* Right: Last updated + Refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "var(--color-ink-soft)", margin: 0 }}>
            ข้อมูล ณ วันที่
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatThaiDate(lastUpdated, "D MMMM")}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-paper-line)",
              backgroundColor: "var(--color-paper)",
              color: "var(--color-ink-soft)",
              fontSize: 12,
              cursor: isRefreshing ? "wait" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            title="รีเฟรชข้อมูล"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
