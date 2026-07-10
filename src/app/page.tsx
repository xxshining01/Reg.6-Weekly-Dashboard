// app/page.tsx
"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";

import { useFitStage } from "@/hooks/useFitStage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";

import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { WeeklyTargetBoxes } from "@/components/WeeklyTargetBoxes";
import { DailyProgressChart } from "@/components/DailyProgressChart";
import { RankingChart } from "@/components/RankingChart";
import { PerformancePanels } from "@/components/PerformancePanels";
import { BusinessGroupDonut } from "@/components/BusinessGroupDonut";
import { AIInsightPanel } from "@/components/AIInsightPanel";
import { DashboardFooterNote } from "@/components/DashboardFooterNote";
import { DashboardSkeleton, DashboardError } from "@/components/DashboardSkeleton";

import { applyFilters, sumRevenue, groupByKey, calcDailyRevenues, toCumulativeDaily, calcBusinessGroupRevenues } from "@/lib/aggregate";
import { calculateLinearWeeklyTargets, expandToDailyCumulativeTarget, getCurrentWeekIndex } from "@/lib/fibonacciTarget";
import { computeProvinceProgress, generateInsightText } from "@/lib/aiInsight";

import { formatThaiDate } from "@/lib/buddhistDate";
import { DailyRow, MonthlyRow } from "@/types/revenue";

function DashboardInner() {
  const { filters } = useFilters();

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | 'MONTH' | null>(null);

  const actualToday = dayjs().format("YYYY-MM-DD");
  const today = filters.dateTo || actualToday;
  const filterDate = dayjs(today);
  const currentYear = filterDate.year();
  const currentMonth = filterDate.month() + 1;

  const { dailyRows, monthlyRows, rawTargets, isLoading, isError, mutate } = useDashboardData();

  // 1. Determine dropdown options
  const provinces = useMemo(() => {
    // Unique provinces from both daily and target/monthly
    const s = new Set<string>();
    dailyRows.forEach(r => { if(r.province) s.add(r.province); });
    rawTargets.forEach(t => { if(t.province) s.add(t.province); });
    return Array.from(s).sort();
  }, [dailyRows, rawTargets]);

  const offices = useMemo(() => {
    const s = new Set<string>();
    const match = (p: string) => filters.province === "ALL" || p === filters.province;
    dailyRows.forEach(r => { if(r.office && match(r.province)) s.add(r.office); });
    rawTargets.forEach(t => { if(t.office && match(t.province)) s.add(t.office); });
    return Array.from(s).sort();
  }, [dailyRows, rawTargets, filters.province]);

  const businessGroups = useMemo(() => {
    const s = new Set<string>();
    dailyRows.forEach(r => { if(r.businessGroup) s.add(r.businessGroup); });
    rawTargets.forEach(t => { if(t.businessGroup) s.add(t.businessGroup); });
    return Array.from(s).sort();
  }, [dailyRows, rawTargets]);

  // 2. Filter data for selected month and criteria
  const monthStart = filterDate.startOf("month").format("YYYY-MM-DD");
  const monthEnd = filterDate.endOf("month").format("YYYY-MM-DD");

  const currentMonthFilter = {
    ...filters,
    dateFrom: filters.dateFrom < monthStart ? monthStart : filters.dateFrom,
    dateTo: filters.dateTo > monthEnd ? monthEnd : filters.dateTo,
  };

  const filteredDaily: DailyRow[] = useMemo(
    () => applyFilters(dailyRows, currentMonthFilter),
    [dailyRows, currentMonthFilter]
  );

  const filteredMonthly: MonthlyRow[] = useMemo(
    () =>
      monthlyRows.filter((r) => {
        // ตัวเลขประธาน has date as YYYY-MM-01, match by month start
        if (r.date !== monthStart) return false;
        if (filters.province !== "ALL" && r.province !== filters.province) return false;
        if (filters.office !== "ALL" && r.office !== filters.office) return false;
        // ตัวเลขประธาน doesn't have businessGroup breakdown (it's "รวม"), so skip BG filter for monthly
        return true;
      }),
    [monthlyRows, filters, monthStart]
  );

  // Filter targets by month+year AND province/office/BG
  const filteredTargets = useMemo(
    () => 
      rawTargets.filter((t: any) => {
        // Match month and year (targets now have month/year fields in ค.ศ.)
        if (t.month !== currentMonth || t.year !== currentYear) return false;
        if (filters.province !== "ALL" && t.province !== filters.province) return false;
        if (filters.office !== "ALL" && t.office !== filters.office) return false;
        if (filters.businessGroup !== "ALL" && t.businessGroup !== filters.businessGroup) return false;
        return true;
      }),
    [rawTargets, filters, currentMonth, currentYear]
  );

  // 3. Fallback logic
  // Check if monthly data (ตัวเลขประธาน) for the selected month has sum != 0
  const monthlyRevenueSum = sumRevenue(filteredMonthly);
  const useDailyFallback = monthlyRevenueSum === 0;

  // Actual revenue for overall progress (use fallback if needed)
  const actualRevenue = useMemo(() => {
    if (useDailyFallback) {
      return sumRevenue(filteredDaily.filter((r) => r.date <= today));
    }
    return monthlyRevenueSum;
  }, [useDailyFallback, filteredDaily, monthlyRevenueSum, today]);

  const monthlyTarget = useMemo(
    () => filteredTargets.reduce((sum: number, t: any) => sum + (t.target || 0), 0),
    [filteredTargets]
  );

  // 4. Weekly targets
  const weeklyTargets = useMemo(
    () =>
      monthlyTarget > 0
        ? calculateLinearWeeklyTargets(currentYear, currentMonth, monthlyTarget)
        : [],
    [currentYear, currentMonth, monthlyTarget]
  );

  const currentWeekIndex = useMemo(
    () => (weeklyTargets.length > 0 ? getCurrentWeekIndex(weeklyTargets, actualToday) : 0),
    [weeklyTargets, actualToday]
  );

  const defaultWeekIndex = useMemo(() => {
    if (weeklyTargets.length === 0) return 0;
    let idx = currentWeekIndex - 1;
    if (idx < 0) idx = 0;
    if (idx >= weeklyTargets.length) idx = weeklyTargets.length - 1;
    return idx;
  }, [currentWeekIndex, weeklyTargets.length]);

  const effectiveFilter = selectedWeekIndex !== null ? selectedWeekIndex : defaultWeekIndex;

  // 5. Ranking & Performance Data (Drill-down logic)
  const isDrillDown = filters.province !== "ALL";
  const drillDownKey = isDrillDown ? (r: any) => r.office : (r: any) => r.province;
  const drillDownTitle = isDrillDown ? "ที่ทำการ" : "จังหวัด";

  const rankingData = useMemo(() => {
    // Determine data source
    const revenueSource = useDailyFallback 
      ? filteredDaily.filter((r) => r.date <= today) 
      : filteredMonthly;
    
    const revGrouped = groupByKey(revenueSource, drillDownKey);
    const targetGrouped = groupByKey(filteredTargets, drillDownKey);
    
    const result: any[] = [];
    
    // Combine keys from both revenue and target
    const allKeys = new Set([...Array.from(revGrouped.keys()), ...Array.from(targetGrouped.keys())]);
    
    allKeys.forEach((key) => {
      const revenue = sumRevenue(revGrouped.get(key) ?? []);
      const target = (targetGrouped.get(key) ?? []).reduce((sum, t) => sum + (t.target || 0), 0);
      const progressPercent = target > 0 ? (revenue / target) * 100 : 0;
      
      // Skip if both revenue and target are 0
      if (revenue > 0 || target > 0) {
        result.push({
          name: key,
          progressPercent: Number(progressPercent.toFixed(1)),
          revenue,
          target,
        });
      }
    });

    return result;
  }, [useDailyFallback, filteredDaily, filteredMonthly, filteredTargets, drillDownKey, today]);

  const performancePanelsData = useMemo(() => {
    // If MONTH filter is active
    if (effectiveFilter === 'MONTH') {
      const revenueSource = useDailyFallback 
        ? filteredDaily.filter((r) => r.date <= today) 
        : filteredMonthly;
        
      const revGrouped = groupByKey(revenueSource, drillDownKey);
      const targetGrouped = groupByKey(filteredTargets, drillDownKey);
      const allKeys = new Set([...Array.from(revGrouped.keys()), ...Array.from(targetGrouped.keys())]);
      
      const mappedToWeekly: any[] = [];
      allKeys.forEach((key) => {
        const revenue = sumRevenue(revGrouped.get(key) ?? []);
        const target = (targetGrouped.get(key) ?? []).reduce((sum, t) => sum + (t.target || 0), 0);
        
        if (target > 0) {
          const progressPercent = (revenue / target) * 100;
          mappedToWeekly.push({
            name: key,
            progressPercent: Number(progressPercent.toFixed(1)),
            revenue,
            target
          });
        }
      });

      const outperforming = mappedToWeekly
        .filter((o) => o.progressPercent >= 100)
        .sort((a, b) => b.progressPercent - a.progressPercent)
        .slice(0, 15);

      const underperforming = mappedToWeekly
        .filter((o) => o.progressPercent < 100)
        .sort((a, b) => a.progressPercent - b.progressPercent)
        .slice(0, 15);

      return { outperforming, underperforming };
    }

    // Week-by-week calculation
    const weekIndex = effectiveFilter as number;
    const currentWeekTarget = weeklyTargets[weekIndex];
    
    if (!currentWeekTarget) return { outperforming: [], underperforming: [] };

    const weekTargetPercent = currentWeekTarget.cumulativePercent - (weekIndex === 0 ? 0 : weeklyTargets[weekIndex - 1].cumulativePercent);
    const weekStart = currentWeekTarget.weekStart;
    const weekEnd = currentWeekTarget.weekEnd;

    // Filter revenue specifically for THIS week's date range, capped at today
    const revenueSource = filteredDaily.filter((r) => r.date >= weekStart && r.date <= weekEnd && r.date <= today);
      
    const revGrouped = groupByKey(revenueSource, drillDownKey);
    const targetGrouped = groupByKey(filteredTargets, drillDownKey);
    const allKeys = new Set([...Array.from(revGrouped.keys()), ...Array.from(targetGrouped.keys())]);
    
    const mappedToWeekly: any[] = [];
    allKeys.forEach((key) => {
      const revenue = sumRevenue(revGrouped.get(key) ?? []);
      const monthlyTargetValue = (targetGrouped.get(key) ?? []).reduce((sum, t) => sum + (t.target || 0), 0);
      
      if (monthlyTargetValue > 0) {
        const weeklyTarget = (monthlyTargetValue * weekTargetPercent) / 100;
        const weeklyProgressPercent = weeklyTarget > 0 ? (revenue / weeklyTarget) * 100 : 0;
        mappedToWeekly.push({
          name: key,
          progressPercent: Number(weeklyProgressPercent.toFixed(1)),
          revenue,
          target: weeklyTarget
        });
      }
    });

    const outperforming = mappedToWeekly
      .filter((o) => o.progressPercent >= 100)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 15);

    const underperforming = mappedToWeekly
      .filter((o) => o.progressPercent < 100)
      .sort((a, b) => a.progressPercent - b.progressPercent)
      .slice(0, 15);

    return { outperforming, underperforming };
  }, [filteredDaily, filteredMonthly, filteredTargets, drillDownKey, useDailyFallback, today, weeklyTargets, effectiveFilter]);

  // 6. Donut Data — ALWAYS uses TOTAL(รายวัน) to preserve businessGroup breakdown
  const donutData = useMemo(() => {
    const revenueSource = filteredDaily.filter((r) => r.date <= today);
    
    const byGroup = groupByKey(revenueSource, (r) => r.businessGroup);
    const result: any[] = [];
    byGroup.forEach((rows, name) => {
      result.push({ name, value: sumRevenue(rows) });
    });
    return result;
  }, [filteredDaily, today]);

  // 7. Daily Chart Data (ALWAYS uses dailyRows)
  const dailyChartData = useMemo(() => {
    const dailyRevs = calcDailyRevenues(filteredDaily);
    const withCumulative = toCumulativeDaily(dailyRevs);
    const targetLine = monthlyTarget > 0 ? expandToDailyCumulativeTarget(weeklyTargets, monthlyTarget) : [];
    const targetMap = new Map(targetLine.map((t) => [t.date, t.cumulativeTarget]));

    return withCumulative.map((d) => ({
      date: d.date,
      actual: d.actual,
      cumulative: Math.round(d.cumulative),
      cumulativeTarget: targetMap.get(d.date) ?? 0,
    }));
  }, [filteredDaily, weeklyTargets, monthlyTarget]);

  // 8. AI Insight
  const insightText = useMemo(() => {
    if (rankingData.length === 0) return "กำลังวิเคราะห์ข้อมูล...";
    const progress = computeProvinceProgress(rankingData, filteredDaily, today, isDrillDown);
    return generateInsightText(progress, isDrillDown);
  }, [rankingData, filteredDaily, today, isDrillDown]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <DashboardError message="ไม่สามารถโหลดข้อมูลได้" onRetry={mutate} />;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-paper)",
      }}
    >
      <DashboardHeader lastUpdated={today} monthYear={monthStart} onRefresh={mutate} />
      <FilterBar provinces={provinces} offices={offices} businessGroups={businessGroups} />

      {/* Layout Grid: 4 rows */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "auto 1fr 170px",
          gap: 10,
          padding: "10px 16px",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Row 1: Weekly Target Cards (full width) + AI Insight */}
        <div style={{ gridColumn: "1 / 10", gridRow: "1", minHeight: 0 }}>
          {weeklyTargets.length > 0 ? (
            <WeeklyTargetBoxes
              actualRevenue={actualRevenue}
              monthlyTarget={monthlyTarget}
              weeklyTargets={weeklyTargets}
              currentWeekIndex={currentWeekIndex}
              filteredDaily={filteredDaily}
              today={today}
              selectedWeekIndex={effectiveFilter}
              onSelectWeek={(i) => setSelectedWeekIndex(i === effectiveFilter ? null : i)}
            />
          ) : (
            <div className="card" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 17, color: "var(--color-ink-soft)" }}>ไม่มีข้อมูลเป้าหมาย</p>
            </div>
          )}
        </div>
        <div style={{ gridColumn: "10 / 13", gridRow: "1" }}>
          <AIInsightPanel insightText={insightText} generatedAt={formatThaiDate(today, "D MMMM")} />
        </div>

        {/* Row 2: Ranking (col 1-5) & Performance Panels (col 6-12) — BIGGEST SECTION */}
        <div style={{ gridColumn: "1 / 5", gridRow: "2" }}>
          <RankingChart data={rankingData} title={`อันดับความคืบหน้าราย${drillDownTitle}`} isDrillDown={isDrillDown} />
        </div>
        <div style={{ gridColumn: "5 / 13", gridRow: "2" }}>
          <PerformancePanels
            outperforming={performancePanelsData.outperforming}
            underperforming={performancePanelsData.underperforming}
            titlePrefix={drillDownTitle}
          />
        </div>

        {/* Row 3: Daily Progress Chart (col 1-9) & Donut (col 10-12) — smaller */}
        <div style={{ gridColumn: "1 / 10", gridRow: "3" }}>
          <DailyProgressChart data={dailyChartData} today={today} />
        </div>
        <div style={{ gridColumn: "10 / 13", gridRow: "3" }}>
          <BusinessGroupDonut data={donutData} />
        </div>
      </div>

      <DashboardFooterNote refreshedAt={new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} />
    </div>
  );
}

function DashboardMobile() {
  const { filters } = useFilters();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | 'MONTH' | null>(null);
  
  const actualToday = dayjs().format("YYYY-MM-DD");
  const today = filters.dateTo || actualToday;
  const filterDate = dayjs(today);
  const currentYear = filterDate.year();
  const currentMonth = filterDate.month() + 1;

  const { dailyRows, monthlyRows, rawTargets, isLoading, isError, mutate } = useDashboardData();

  // Exactly the same logic as above, just rendered differently
  // Since it's a mobile view, we stack everything. I will summarize the data here.
  // We can just reuse DashboardInner hooks, but to keep it simple without refactoring into a generic custom hook right now:
  
   const monthStart = filterDate.startOf("month").format("YYYY-MM-DD");
  const monthEnd = filterDate.endOf("month").format("YYYY-MM-DD");
  const currentMonthFilter = {
    ...filters,
    dateFrom: filters.dateFrom < monthStart ? monthStart : filters.dateFrom,
    dateTo: filters.dateTo > monthEnd ? monthEnd : filters.dateTo,
  };
  const filteredDaily = useMemo(() => applyFilters(dailyRows, currentMonthFilter), [dailyRows, currentMonthFilter]);
  const filteredMonthly = useMemo(() => monthlyRows.filter(r => r.date === monthStart && (filters.province === "ALL" || r.province === filters.province) && (filters.office === "ALL" || r.office === filters.office)), [monthlyRows, filters, monthStart]);
  const filteredTargets = useMemo(() => rawTargets.filter((t: any) => t.month === currentMonth && t.year === currentYear && (filters.province === "ALL" || t.province === filters.province) && (filters.office === "ALL" || t.office === filters.office) && (filters.businessGroup === "ALL" || t.businessGroup === filters.businessGroup)), [rawTargets, filters, currentMonth, currentYear]);

  const monthlyRevenueSum = sumRevenue(filteredMonthly);
  const useDailyFallback = monthlyRevenueSum === 0;
  const actualRevenue = useMemo(() => useDailyFallback ? sumRevenue(filteredDaily.filter(r => r.date <= today)) : monthlyRevenueSum, [useDailyFallback, filteredDaily, monthlyRevenueSum, today]);
  const monthlyTarget = useMemo(() => filteredTargets.reduce((s: number, t: any) => s + (t.target || 0), 0), [filteredTargets]);
  
  const weeklyTargets = useMemo(() => monthlyTarget > 0 ? calculateLinearWeeklyTargets(currentYear, currentMonth, monthlyTarget) : [], [currentYear, currentMonth, monthlyTarget]);
  const currentWeekIndex = useMemo(() => weeklyTargets.length > 0 ? getCurrentWeekIndex(weeklyTargets, actualToday) : 0, [weeklyTargets, actualToday]);
  
  const defaultWeekIndex = useMemo(() => {
    if (weeklyTargets.length === 0) return 0;
    let idx = currentWeekIndex - 1;
    if (idx < 0) idx = 0;
    if (idx >= weeklyTargets.length) idx = weeklyTargets.length - 1;
    return idx;
  }, [currentWeekIndex, weeklyTargets.length]);

  const effectiveFilter = selectedWeekIndex !== null ? selectedWeekIndex : defaultWeekIndex;

  const isDrillDown = filters.province !== "ALL";
  const drillDownKey = isDrillDown ? (r: any) => r.office : (r: any) => r.province;
  const drillDownTitle = isDrillDown ? "ที่ทำการ" : "จังหวัด";

  const rankingData = useMemo(() => {
    const revSource = useDailyFallback ? filteredDaily.filter(r => r.date <= today) : filteredMonthly;
    const revG = groupByKey(revSource, drillDownKey);
    const tarG = groupByKey(filteredTargets, drillDownKey);
    const res: any[] = [];
    new Set([...Array.from(revG.keys()), ...Array.from(tarG.keys())]).forEach(k => {
      const r = sumRevenue(revG.get(k) ?? []);
      const t = (tarG.get(k) ?? []).reduce((sum, item) => sum + (item.target || 0), 0);
      if (r > 0 || t > 0) res.push({ name: k, progressPercent: t > 0 ? Number(((r/t)*100).toFixed(1)) : 0, revenue: r, target: t });
    });
    return res;
  }, [useDailyFallback, filteredDaily, filteredMonthly, filteredTargets, drillDownKey, today]);

  const pData = useMemo(() => {
    if (effectiveFilter === 'MONTH') {
      const rs = useDailyFallback ? filteredDaily.filter(r => r.date <= today) : filteredMonthly;
      const revG = groupByKey(rs, drillDownKey);
      const tarG = groupByKey(filteredTargets, drillDownKey);
      const keys = new Set([...Array.from(revG.keys()), ...Array.from(tarG.keys())]);
      
      const mappedToWeekly: any[] = [];
      keys.forEach(k => {
        const r = sumRevenue(revG.get(k) ?? []);
        const t = (tarG.get(k) ?? []).reduce((sum, item) => sum + (item.target || 0), 0);
        if (t > 0) {
          const wPct = (r / t) * 100;
          mappedToWeekly.push({ name: k, progressPercent: wPct, revenue: r, target: t });
        }
      });
      return {
        outperforming: mappedToWeekly.filter(o => o.progressPercent >= 100).sort((a,b) => b.progressPercent - a.progressPercent).slice(0, 10),
        underperforming: mappedToWeekly.filter(o => o.progressPercent < 100).sort((a,b) => a.progressPercent - b.progressPercent).slice(0, 10)
      };
    }

    const weekIndex = effectiveFilter as number;
    const currentWeekTarget = weeklyTargets[weekIndex];
    if (!currentWeekTarget) return { outperforming: [], underperforming: [] };

    const weekTargetPercent = currentWeekTarget.cumulativePercent - (weekIndex === 0 ? 0 : weeklyTargets[weekIndex - 1].cumulativePercent);
    const rs = filteredDaily.filter((r) => r.date >= currentWeekTarget.weekStart && r.date <= currentWeekTarget.weekEnd && r.date <= today);
    const revG = groupByKey(rs, drillDownKey);
    const tarG = groupByKey(filteredTargets, drillDownKey);
    const keys = new Set([...Array.from(revG.keys()), ...Array.from(tarG.keys())]);
    
    const mappedToWeekly: any[] = [];
    keys.forEach(k => {
      const r = sumRevenue(revG.get(k) ?? []);
      const t = (tarG.get(k) ?? []).reduce((sum, item) => sum + (item.target || 0), 0);
      if (t > 0) {
        const wTarget = (t * weekTargetPercent) / 100;
        const wPct = wTarget > 0 ? (r / wTarget) * 100 : 0;
        mappedToWeekly.push({ name: k, progressPercent: wPct, revenue: r, target: wTarget });
      }
    });

    return {
      outperforming: mappedToWeekly.filter(o => o.progressPercent >= 100).sort((a,b) => b.progressPercent - a.progressPercent).slice(0, 10),
      underperforming: mappedToWeekly.filter(o => o.progressPercent < 100).sort((a,b) => a.progressPercent - b.progressPercent).slice(0, 10)
    };
  }, [filteredDaily, filteredMonthly, filteredTargets, drillDownKey, useDailyFallback, today, weeklyTargets, effectiveFilter]);

  const donutData = useMemo(() => {
    const rs = filteredDaily.filter(r => r.date <= today);
    const bg = groupByKey(rs, r => r.businessGroup);
    return Array.from(bg.entries()).map(([name, rows]) => ({ name, value: sumRevenue(rows) }));
  }, [filteredDaily, today]);

  const dailyChartData = useMemo(() => {
    const dr = calcDailyRevenues(filteredDaily);
    const cum = toCumulativeDaily(dr);
    const tar = monthlyTarget > 0 ? expandToDailyCumulativeTarget(weeklyTargets, monthlyTarget) : [];
    const tm = new Map(tar.map(t => [t.date, t.cumulativeTarget]));
    return cum.map(d => ({ date: d.date, actual: d.actual, cumulative: Math.round(d.cumulative), cumulativeTarget: tm.get(d.date) ?? 0 }));
  }, [filteredDaily, weeklyTargets, monthlyTarget]);

  const insightText = useMemo(() => {
    if (rankingData.length === 0) return "กำลังวิเคราะห์...";
    return generateInsightText(computeProvinceProgress(rankingData, filteredDaily, today, isDrillDown), isDrillDown);
  }, [rankingData, filteredDaily, today, isDrillDown]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <DashboardError message="ไม่สามารถโหลดข้อมูลได้" onRetry={mutate} />;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--color-paper)", display: "flex", flexDirection: "column", color: "var(--color-ink)" }}>
      <DashboardHeader lastUpdated={today} monthYear={monthStart} onRefresh={mutate} />
      {/* Mobile filter bar is omitted for brevity, but normally handled if fully implemented. FilterContext defaults are fine for mock */}
      
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}>
        {weeklyTargets.length > 0 && (
          <div style={{ minHeight: 160 }}>
            <WeeklyTargetBoxes actualRevenue={actualRevenue} monthlyTarget={monthlyTarget} weeklyTargets={weeklyTargets} currentWeekIndex={currentWeekIndex} filteredDaily={filteredDaily} today={today} selectedWeekIndex={effectiveFilter} onSelectWeek={(i) => setSelectedWeekIndex(i === effectiveFilter ? null : i)} />
          </div>
        )}
        <AIInsightPanel insightText={insightText} generatedAt={formatThaiDate(today, "D MMMM")} />
        
        {/* Prioritized ranking */}
        <div style={{ height: 300 }}>
          <RankingChart data={rankingData} title={`อันดับความคืบหน้าราย${drillDownTitle}`} isDrillDown={isDrillDown} />
        </div>
        <PerformancePanels outperforming={pData.outperforming} underperforming={pData.underperforming} titlePrefix={drillDownTitle} />

        {/* Deprioritized charts */}
        <div style={{ height: 260 }}>
          <DailyProgressChart data={dailyChartData} today={today} />
        </div>
        <div style={{ height: 280 }}>
          <BusinessGroupDonut data={donutData} />
        </div>
      </div>

      <DashboardFooterNote />
    </main>
  );
}

export default function DashboardPage() {
  const { scale, isDesktopStage } = useFitStage();

  if (!isDesktopStage) {
    return (
      <FilterProvider>
        <DashboardMobile />
      </FilterProvider>
    );
  }

  return (
    <FilterProvider>
      <div className="stage-wrapper">
        <div
          className="stage-canvas"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <DashboardInner />
        </div>
      </div>
    </FilterProvider>
  );
}
