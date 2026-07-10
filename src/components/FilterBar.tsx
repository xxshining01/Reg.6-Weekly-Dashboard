// components/FilterBar.tsx
"use client";
import dayjs from "dayjs";
import { useFilters } from "@/contexts/FilterContext";

interface FilterBarProps {
  provinces: string[];
  offices: string[];
  businessGroups: string[];
}

export function FilterBar({ provinces, offices, businessGroups }: FilterBarProps) {
  const { filters, setFilters, resetFilters } = useFilters();

  // Derive current month value from filters (YYYY-MM format)
  const currentMonthValue = dayjs(filters.dateFrom).format("YYYY-MM");

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "YYYY-MM"
    if (!val) return;
    const selected = dayjs(val + "-01");
    const now = dayjs();
    const dateFrom = selected.format("YYYY-MM-DD");
    // If selected month is current month, dateTo = today; else last day of selected month
    const dateTo =
      selected.year() === now.year() && selected.month() === now.month()
        ? now.format("YYYY-MM-DD")
        : selected.endOf("month").format("YYYY-MM-DD");
    setFilters({ dateFrom, dateTo });
  };

  // กรอง offices ตาม province ที่เลือก (ถ้าไม่ใช่ ALL)
  const filteredOffices = offices;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 36px",
        height: "48px",
        borderBottom: "1px solid var(--color-paper-line)",
        backgroundColor: "var(--color-paper-soft)",
        flexShrink: 0,
        flexWrap: "nowrap",
        overflowX: "auto",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 16,
          color: "var(--color-ink-soft)",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        ตัวกรอง:
      </span>

      {/* จังหวัด */}
      <select
        id="filter-province"
        className="filter-select"
        value={filters.province}
        onChange={(e) =>
          setFilters({ province: e.target.value, office: "ALL" })
        }
        style={{ fontSize: 16 }}
      >
        <option value="ALL">ทุกจังหวัด</option>
        {provinces.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* ที่ทำการ */}
      <select
        id="filter-office"
        className="filter-select"
        value={filters.office}
        onChange={(e) => setFilters({ office: e.target.value })}
        style={{ minWidth: 180, fontSize: 16 }}
      >
        <option value="ALL">ทุกที่ทำการ</option>
        {filteredOffices.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* กลุ่มธุรกิจ */}
      <select
        id="filter-business-group"
        className="filter-select"
        value={filters.businessGroup}
        onChange={(e) => setFilters({ businessGroup: e.target.value })}
        style={{ minWidth: 200, fontSize: 16 }}
      >
        <option value="ALL">ทุกกลุ่มธุรกิจ</option>
        {businessGroups.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 20,
          backgroundColor: "var(--color-paper-line)",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />

      {/* เดือน/ปี */}
      <span style={{ fontSize: 16, color: "var(--color-ink-soft)", flexShrink: 0 }}>
        เดือน/ปี:
      </span>
      <input
        id="filter-month"
        type="month"
        className="date-input"
        value={currentMonthValue}
        onChange={handleMonthChange}
        style={{ fontSize: 16 }}
      />

      {/* Reset */}
      <button
        id="filter-reset"
        onClick={resetFilters}
        style={{
          marginLeft: "auto",
          fontSize: 16,
          color: "var(--color-brand)",
          background: "none",
          border: "1px solid var(--color-brand-light)",
          borderRadius: 6,
          padding: "4px 10px",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          flexShrink: 0,
        }}
      >
        รีเซ็ต
      </button>
    </div>
  );
}
