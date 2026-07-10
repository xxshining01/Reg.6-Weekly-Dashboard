// components/AIInsightPanel.tsx
interface AIInsightPanelProps {
  insightText: string;
  generatedAt?: string; // ISO date
}

export function AIInsightPanel({ insightText, generatedAt }: AIInsightPanelProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(38,76,115,0.06) 0%, rgba(38,76,115,0.02) 100%)",
        border: "1px solid rgba(38,76,115,0.18)",
        borderRadius: 12,
        padding: "14px 16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {/* Icon */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: "var(--color-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--color-brand)",
          }}
        >
          AI Insight Analysis
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-ink-soft)",
            backgroundColor: "var(--color-paper-soft)",
            border: "1px solid var(--color-paper-line)",
            borderRadius: 9999,
            padding: "1px 7px",
          }}
        >
          วิเคราะห์อัตโนมัติ
        </span>
      </div>

      {/* Insight text */}
      <p
        style={{
          fontSize: 14.5,
          color: "var(--color-ink)",
          lineHeight: 1.7,
          margin: 0,
          flex: 1,
          overflow: "auto",
        }}
      >
        {insightText}
      </p>

      {/* Footer */}
      {generatedAt && (
        <p
          style={{
            fontSize: 11,
            color: "var(--color-ink-soft)",
            margin: "8px 0 0",
            borderTop: "1px solid rgba(38,76,115,0.1)",
            paddingTop: 6,
          }}
        >
          อัปเดตล่าสุด: {generatedAt}
        </p>
      )}
    </div>
  );
}
