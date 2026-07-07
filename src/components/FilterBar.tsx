// components/FilterBar.tsx
"use client";
import { useFilters } from "@/contexts/FilterContext";

interface FilterBarProps {
  provinces: string[];
  offices: string[];
  businessGroups: string[];
}

export function FilterBar({ provinces, offices, businessGroups }: FilterBarProps) {
  const { filters, setFilters, resetFilters } = useFilters();

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
          fontSize: 11,
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
        style={{ minWidth: 180 }}
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
        style={{ minWidth: 200 }}
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

      {/* ช่วงวันที่ */}
      <span style={{ fontSize: 11, color: "var(--color-ink-soft)", flexShrink: 0 }}>
        วันที่:
      </span>
      <input
        id="filter-date-from"
        type="date"
        className="date-input"
        value={filters.dateFrom}
        onChange={(e) => setFilters({ dateFrom: e.target.value })}
      />
      <span style={{ fontSize: 11, color: "var(--color-ink-soft)", flexShrink: 0 }}>
        ถึง
      </span>
      <input
        id="filter-date-to"
        type="date"
        className="date-input"
        value={filters.dateTo}
        onChange={(e) => setFilters({ dateTo: e.target.value })}
      />

      {/* Reset */}
      <button
        id="filter-reset"
        onClick={resetFilters}
        style={{
          marginLeft: "auto",
          fontSize: 11,
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
