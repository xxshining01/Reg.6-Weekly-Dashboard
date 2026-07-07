// components/DashboardFooterNote.tsx
export function DashboardFooterNote({ refreshedAt }: { refreshedAt?: string }) {
  return (
    <footer
      style={{
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        borderTop: "1px solid var(--color-paper-line)",
        backgroundColor: "var(--color-paper-soft)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
        ⚠️ ข้อมูลนี้เป็นเพียงการคาดการณ์รายได้เท่านั้น ไม่ใช่ตัวเลขยืนยันทางการ
      </span>
      {refreshedAt && (
        <span style={{ fontSize: 10, color: "var(--color-ink-soft)" }}>
          โหลดข้อมูลล่าสุด: {refreshedAt}
        </span>
      )}
      <span style={{ fontSize: 10, color: "var(--color-ink-soft)" }}>
        ปข.6 Revenue Dashboard v2.0
      </span>
    </footer>
  );
}
