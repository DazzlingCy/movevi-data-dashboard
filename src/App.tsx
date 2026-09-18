import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Brain, CalendarBlank, CaretDown,
  ChartLineUp, CurrencyCircleDollar, Database, DeviceMobile, Gauge, GlobeHemisphereWest,
  Info, List, Question, SealCheck, ShoppingCart,
  Trophy, TrendDown, TrendUp, UsersThree, WarningCircle, X,
} from "@phosphor-icons/react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  DataResult, DataStatus, defaultFilters, ExecutiveData, formatNumber,
  FunnelStage, Metric, ModuleData, northStarFormula, ReportFilters, dataProvider,
} from "./data";
import { DeepDiveSections, ExecutivePanorama } from "./Supplemental";
import { ActivityCenter } from "./ActivityCenter";
import { ContentCatalogDrawer } from "./ContentCatalogDrawer";
import { GlobalSearch } from "./GlobalSearch";

type NavItem = { path: string; label: string; icon: React.ComponentType<{ size?: number; weight?: "duotone" }>; children?: { path: string; label: string }[] };

const navItems: NavItem[] = [
  { path: "/dashboard", label: "数据概览", icon: Gauge },
  { path: "/sales", label: "销售中心", icon: ShoppingCart },
  { path: "/devices", label: "设备中心", icon: DeviceMobile },
  { path: "/users", label: "用户中心", icon: UsersThree },
  { path: "/content", label: "跑遍全球", icon: GlobeHemisphereWest, children: [{ path: "/content", label: "内容中心" }, { path: "/explore", label: "探索中心" }] },
  { path: "/activities/lottery", label: "活动中心", icon: Trophy, children: [{ path: "/activities/lottery", label: "勋章抽奖" }, { path: "/activities/checkin", label: "30天打卡" }] },
  { path: "/commercial", label: "商业中心", icon: CurrencyCircleDollar },
  { path: "/insights", label: "AI 洞察", icon: Brain },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "数据概览", subtitle: "从增长到使用，看见业务真正发生的地方" },
  "/sales": { title: "销售中心", subtitle: "渠道规模、质量和地区结构" },
  "/devices": { title: "设备中心", subtitle: "激活、连接、使用与故障全景" },
  "/users": { title: "用户中心", subtitle: "新增、转化、活跃、留存和运动生命周期" },
  "/content": { title: "内容中心", subtitle: "城市、路线与真实内容价值" },
  "/explore": { title: "探索中心", subtitle: "路线解锁与世界跑者成长" },
  "/activities": { title: "活动中心", subtitle: "活动经营数据" },
  "/activities/lottery": { title: "勋章抽奖", subtitle: "按期次查看勋章、抽奖节奏与用户明细" },
  "/activities/checkin": { title: "30天打卡", subtitle: "每日推荐路线、红包领取与30天完成报表" },
  "/commercial": { title: "商业中心", subtitle: "订阅增长与长期用户价值" },
  "/insights": { title: "AI 洞察", subtitle: "将数据信号变成经营动作" },
};

type DashboardPeriodKind = "total" | "month" | "quarter" | "year";

const dashboardPeriodKinds: { value: DashboardPeriodKind; label: string }[] = [
  { value: "total", label: "总" },
  { value: "month", label: "月份" },
  { value: "quarter", label: "季度" },
  { value: "year", label: "年份" },
];
const dashboardMonthOptions = ["2026-09", "2026-08", "2026-07", "2026-06", "2026-05", "2026-04"];
const dashboardQuarterOptions = ["2026-Q3", "2026-Q2", "2026-Q1", "2025-Q4"];
const dashboardYearOptions = ["2026", "2025", "2024"];

function resolveDashboardPeriod(params: URLSearchParams) {
  const kind = (params.get("dashboardPeriod") ?? "total") as DashboardPeriodKind | "lastMonth";
  const safeKind: DashboardPeriodKind = dashboardPeriodKinds.some((item) => item.value === kind) ? kind as DashboardPeriodKind : "total";
  const value = params.get("dashboardPeriodValue") ?? (safeKind === "month" ? "2026-08" : safeKind === "quarter" ? "2026-Q3" : safeKind === "year" ? "2026" : "");
  if (safeKind === "total") return { kind: safeKind, value: "", from: "2020-01-01", to: "2026-09-02", label: "总" };
  if (safeKind === "month") {
    const [year, month] = (dashboardMonthOptions.includes(value) ? value : "2026-08").split("-");
    const lastDay = year === "2026" && month === "09" ? "02" : new Date(Number(year), Number(month), 0).getDate().toString().padStart(2, "0");
    return { kind: safeKind, value: `${year}-${month}`, from: `${year}-${month}-01`, to: `${year}-${month}-${lastDay}`, label: `${year}年${Number(month)}月` };
  }
  if (safeKind === "quarter") {
    const selected = dashboardQuarterOptions.includes(value) ? value : "2026-Q3";
    const [year, quarter] = selected.split("-Q");
    const ranges: Record<string, [string, string, string]> = { "1": ["01-01", "03-31", "第1季度"], "2": ["04-01", "06-30", "第2季度"], "3": ["07-01", year === "2026" ? "09-02" : "09-30", "第3季度"], "4": ["10-01", "12-31", "第4季度"] };
    const [from, to, label] = ranges[quarter] ?? ranges["3"];
    return { kind: safeKind, value: selected, from: `${year}-${from}`, to: `${year}-${to}`, label: `${year}年${label}` };
  }
  const selectedYear = dashboardYearOptions.includes(value) ? value : "2026";
  return { kind: safeKind, value: selectedYear, from: `${selectedYear}-01-01`, to: selectedYear === "2026" ? "2026-09-02" : `${selectedYear}-12-31`, label: `${selectedYear}年` };
}

function Logo() {
  return <div className="brand" aria-label="MOVEVI 数据后台"><img className="brand-logo" src={`${import.meta.env.BASE_URL}movevi-logo.png`} alt="" /><span><b>MOVEVI</b><small>WORLD RUNNING</small></span></div>;
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardPage = location.pathname === "/dashboard" || location.pathname === "/";
  const isSalesPage = location.pathname === "/sales";
  const isActivityPage = location.pathname.startsWith("/activities");
  const isLotteryPage = location.pathname === "/activities/lottery";
  const meta = pageMeta[location.pathname] ?? pageMeta["/dashboard"];
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { document.title = `MOVEVI · ${meta.title}`; }, [meta.title]);
  useEffect(() => {
    const normalized = new URLSearchParams(searchParams);
    const hadStageFilter = normalized.has("stage");
    const hadOutOfScopeChannel = !isSalesPage && normalized.has("channel");
    const activityFilterKeys: (keyof ReportFilters)[] = ["from", "to", "channel", "product", "region"];
    const hadOutOfScopeActivityFilters = isActivityPage && activityFilterKeys.some((key) => normalized.has(key));
    const hadOutOfScopePeriod = !isLotteryPage && normalized.has("period");
    const hadRegionFilter = normalized.has("region");
    const hadOutOfScopeDashboardPeriod = isActivityPage && (normalized.has("dashboardPeriod") || normalized.has("dashboardPeriodValue"));
    const hadOutOfScopeDateRange = normalized.has("from") || normalized.has("to");
    normalized.delete("stage");
    normalized.delete("region");
    if (!isSalesPage) normalized.delete("channel");
    if (isActivityPage) activityFilterKeys.forEach((key) => normalized.delete(key));
    if (!isLotteryPage) normalized.delete("period");
    if (isActivityPage) {
      normalized.delete("dashboardPeriod");
      normalized.delete("dashboardPeriodValue");
    }
    normalized.delete("from");
    normalized.delete("to");
    searchParamsRef.current = normalized;
    if (hadStageFilter || hadOutOfScopeChannel || hadOutOfScopeActivityFilters || hadOutOfScopePeriod || hadRegionFilter || hadOutOfScopeDashboardPeriod || hadOutOfScopeDateRange) setSearchParams(normalized, { replace: true });
  }, [isActivityPage, isDashboardPage, isLotteryPage, isSalesPage, searchParams, setSearchParams]);
  const dashboardPeriod = useMemo(() => resolveDashboardPeriod(searchParams), [searchParams]);
  const filters = useMemo<ReportFilters>(() => ({
    from: isActivityPage ? defaultFilters.from : dashboardPeriod.from,
    to: isActivityPage ? defaultFilters.to : dashboardPeriod.to,
    channel: isSalesPage ? searchParams.get("channel") ?? defaultFilters.channel : defaultFilters.channel,
    product: searchParams.get("product") ?? defaultFilters.product,
    region: defaultFilters.region,
    periodLabel: isActivityPage ? undefined : dashboardPeriod.label,
  }), [dashboardPeriod.from, dashboardPeriod.label, dashboardPeriod.to, isActivityPage, isSalesPage, searchParams]);

  const changeFilter = (key: keyof ReportFilters, value: string) => {
    const next = new URLSearchParams(searchParamsRef.current);
    if (value === defaultFilters[key]) next.delete(key); else next.set(key, value);
    searchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  };

  const changeDateRange = (from: string, to: string) => {
    const next = new URLSearchParams(searchParamsRef.current);
    if (from === defaultFilters.from) next.delete("from"); else next.set("from", from);
    if (to === defaultFilters.to) next.delete("to"); else next.set("to", to);
    searchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  };

  const changeDashboardPeriod = (kind: DashboardPeriodKind, value = "") => {
    const next = new URLSearchParams(searchParamsRef.current);
    if (kind === "total") next.delete("dashboardPeriod"); else next.set("dashboardPeriod", kind);
    if (value) next.set("dashboardPeriodValue", value); else next.delete("dashboardPeriodValue");
    next.delete("from");
    next.delete("to");
    searchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  };

  const pathWithFilters = (path: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("region");
    if (path !== "/sales") next.delete("channel");
    next.delete("from");
    next.delete("to");
    if (path.startsWith("/activities")) ["from", "to", "channel", "product", "region", "dashboardPeriod", "dashboardPeriodValue"].forEach((key) => next.delete(key));
    if (path !== "/activities/lottery") next.delete("period");
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  };
  const navigateKeepingFilters = (path: string) => navigate(pathWithFilters(path));

  return <div className="app-shell">
    <aside className={menuOpen ? "sidebar open" : "sidebar"}>
      <Logo />
      <nav aria-label="主导航">
        {navItems.map(({ path, label, icon: Icon, children }) => {
          const groupActive = children?.some((child) => location.pathname === child.path) ?? false;
          return <div className={children ? "nav-group" : "nav-group single"} key={path}><NavLink aria-label={label} title={label} to={pathWithFilters(path)} className={({ isActive }) => isActive || groupActive ? "nav-item active" : "nav-item"} onClick={() => setMenuOpen(false)}><Icon size={18} weight="duotone" /><span>{label}</span></NavLink>{children && <div className="sub-nav" aria-label={`${label}子导航`}>{children.map((child) => <NavLink key={child.path} aria-label={child.label} title={child.label} to={pathWithFilters(child.path)} className={({ isActive }) => isActive ? "sub-nav-item active" : "sub-nav-item"} onClick={() => setMenuOpen(false)}><i /><span>{child.label}</span></NavLink>)}</div>}</div>;
        })}
      </nav>
      <div className="sidebar-account" aria-label="当前用户 admin"><div className="account-avatar" aria-hidden="true">A</div><strong>admin</strong></div>
    </aside>
    {menuOpen && <button className="menu-scrim" aria-label="关闭导航" onClick={() => setMenuOpen(false)} />}
    <div className="workspace">
      <header className="topbar">
        <div className="title-wrap"><button className="mobile-menu" aria-label="打开导航" onClick={() => setMenuOpen(true)}><List /></button><div><h1>{meta.title}</h1><p>{meta.subtitle}</p></div></div>
        <div className="top-actions"><span className="data-pill"><span className="live-dot" />演示数据 · 截止 09-02</span><GlobalSearch onNavigate={navigateKeepingFilters} /><button className="icon-button notification" aria-label="通知"><Bell /><i /></button></div>
      </header>
      <main className="main-content">
        {!isActivityPage && <DashboardPeriodBar period={dashboardPeriod} product={filters.product} channel={filters.channel} onChange={changeDashboardPeriod} onProductChange={(value) => changeFilter("product", value)} onChannelChange={(value) => changeFilter("channel", value)} showChannel={isSalesPage} />}
        <Routes>
          <Route path="/dashboard" element={<Dashboard filters={filters} navigate={navigateKeepingFilters} />} />
          <Route path="/sales" element={<ModulePage moduleKey="sales" filters={filters} loader={dataProvider.getSalesCenter.bind(dataProvider)} />} />
          <Route path="/devices" element={<ModulePage moduleKey="devices" filters={filters} loader={dataProvider.getDeviceCenter.bind(dataProvider)} />} />
          <Route path="/users" element={<ModulePage moduleKey="users" filters={filters} loader={dataProvider.getUserCenter.bind(dataProvider)} />} />
          <Route path="/content" element={<ModulePage moduleKey="content" filters={filters} loader={dataProvider.getContentCenter.bind(dataProvider)} />} />
          <Route path="/explore" element={<ModulePage moduleKey="explore" filters={filters} loader={dataProvider.getExploreCenter.bind(dataProvider)} />} />
          <Route path="/activities" element={<Navigate to={pathWithFilters("/activities/lottery")} replace />} />
          <Route path="/activities/lottery" element={<ActivityCenter filters={filters} report="lottery" />} />
          <Route path="/activities/checkin" element={<ActivityCenter filters={filters} report="checkin" />} />
          <Route path="/commercial" element={<ModulePage moduleKey="commercial" filters={filters} loader={dataProvider.getCommercialCenter.bind(dataProvider)} />} />
          <Route path="/insights" element={<ModulePage moduleKey="insights" filters={filters} loader={dataProvider.getAiInsights.bind(dataProvider)} />} />
          <Route path="*" element={<Dashboard filters={filters} navigate={navigateKeepingFilters} />} />
        </Routes>
      </main>
    </div>
  </div>;
}

const maxReportDate = "2026-09-02";
const launchDate = "2020-01-01";
const datePresets = [
  { label: "数据截止日", from: "2026-09-02", to: "2026-09-02" },
  { label: "近 7 天", from: "2026-08-27", to: "2026-09-02" },
  { label: "近 30 天", from: "2026-08-04", to: "2026-09-02" },
  { label: "近 90 天", from: "2026-06-05", to: "2026-09-02" },
  { label: "本周", from: "2026-08-31", to: "2026-09-02" },
  { label: "本月", from: "2026-09-01", to: "2026-09-02" },
  { label: "上月", from: "2026-08-01", to: "2026-08-31" },
  { label: "今年至今", from: "2026-01-01", to: "2026-09-02" },
  { label: "总", from: launchDate, to: maxReportDate },
];

function DashboardPeriodBar({ period, product, channel = defaultFilters.channel, onChange, onProductChange, onChannelChange, showChannel = false }: { period: ReturnType<typeof resolveDashboardPeriod>; product: string; channel?: string; onChange: (kind: DashboardPeriodKind, value?: string) => void; onProductChange: (value: string) => void; onChannelChange?: (value: string) => void; showChannel?: boolean }) {
  const valueOptions = period.kind === "month" ? dashboardMonthOptions : period.kind === "quarter" ? dashboardQuarterOptions : period.kind === "year" ? dashboardYearOptions : [];
  const formatOption = (value: string) => {
    if (period.kind === "month") {
      const [year, month] = value.split("-");
      return `${year}年${Number(month)}月`;
    }
    if (period.kind === "quarter") {
      const [year, quarter] = value.split("-Q");
      return `${year}年第${quarter}季度`;
    }
    return `${value}年`;
  };
  return <section className="filter-bar dashboard-period-bar" aria-label="首页时间筛选">
    <div className="period-label"><CalendarBlank /><div><b>数据周期</b><span>{period.label} · {formatDisplayDate(period.from)} 至 {formatDisplayDate(period.to)}</span></div></div>
    <label className="select-wrap period-kind"><span>周期类型</span><select aria-label="周期类型" value={period.kind} onChange={(event) => onChange(event.target.value as DashboardPeriodKind)}>{dashboardPeriodKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><CaretDown size={12} /></label>
    {valueOptions.length > 0 && <label className="select-wrap period-value"><span>周期值</span><select aria-label="周期值" value={period.value} onChange={(event) => onChange(period.kind, event.target.value)}>{valueOptions.map((value) => <option key={value} value={value}>{formatOption(value)}</option>)}</select><CaretDown size={12} /></label>}
    {showChannel && onChannelChange && <FilterSelect label="渠道" value={channel} options={["全部渠道", "抖音", "天猫", "京东", "拼多多"]} onChange={onChannelChange} />}
    <FilterSelect label="型号" value={product} options={["全部型号", "TS2", "TS2PRO", "TS3", "TS3PRO"]} onChange={onProductChange} />
    <button className="reset-button" onClick={() => { onChange("total"); if (showChannel && onChannelChange) onChannelChange(defaultFilters.channel); onProductChange(defaultFilters.product); }}>重置</button>
  </section>;
}

function formatDisplayDate(value: string) {
  return value.replaceAll("-", "/");
}

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openPicker = () => {
    setDraftFrom(from);
    setDraftTo(to);
    setError("");
    setOpen((current) => !current);
  };
  const closePicker = () => {
    setOpen(false);
    setError("");
    triggerRef.current?.focus();
  };
  const applyRange = (nextFrom: string, nextTo: string) => {
    if (!nextFrom || !nextTo) return setError("请选择完整的开始和结束日期");
    if (nextFrom > nextTo) return setError("开始日期不能晚于结束日期");
    if (nextTo > maxReportDate) return setError("完整数据仅更新至 2026/09/02");
    onChange(nextFrom, nextTo);
    setOpen(false);
    setError("");
    triggerRef.current?.focus();
  };

  return <div className="range-picker" ref={rootRef}>
    <button ref={triggerRef} type="button" className={open ? "range-trigger active" : "range-trigger"} aria-haspopup="dialog" aria-expanded={open} aria-label={`选择日期范围，当前 ${formatDisplayDate(from)} 至 ${formatDisplayDate(to)}`} onClick={openPicker}><CalendarBlank /><span>{formatDisplayDate(from)}</span><ArrowRight /><span>{formatDisplayDate(to)}</span><CaretDown /></button>
    {open && <div className="range-popover" role="dialog" aria-label="日期范围筛选">
      <aside className="range-presets"><strong>快捷时间</strong>{datePresets.map((preset) => <button type="button" key={preset.label} className={from === preset.from && to === preset.to ? "selected" : ""} onClick={() => applyRange(preset.from, preset.to)}>{preset.label}<span>{formatDisplayDate(preset.from) === formatDisplayDate(preset.to) ? formatDisplayDate(preset.to).slice(5) : `${formatDisplayDate(preset.from).slice(5)} – ${formatDisplayDate(preset.to).slice(5)}`}</span></button>)}</aside>
      <section className="range-custom"><header><strong>自定义日期范围</strong><span>完整数据截止 2026/09/02</span></header><div className="range-fields"><label><span>开始日期</span><input aria-label="自定义开始日期" type="date" value={draftFrom} max={maxReportDate} onChange={(event) => { setDraftFrom(event.target.value); setError(""); }} /></label><ArrowRight /><label><span>结束日期</span><input aria-label="自定义结束日期" type="date" value={draftTo} max={maxReportDate} onChange={(event) => { setDraftTo(event.target.value); setError(""); }} /></label></div>{error && <p className="range-error" role="alert">{error}</p>}<footer><button type="button" onClick={closePicker}>取消</button><button type="button" className="range-confirm" onClick={() => applyRange(draftFrom, draftTo)}>确定</button></footer></section>
    </div>}
  </div>;
}

function FilterBar({ filters, onChange, onDateChange, showChannel }: { filters: ReportFilters; onChange: (key: keyof ReportFilters, value: string) => void; onDateChange: (from: string, to: string) => void; showChannel: boolean }) {
  return <section className="filter-bar" aria-label="报表筛选">
    <DateRangePicker from={filters.from} to={filters.to} onChange={onDateChange} />
    {showChannel && <FilterSelect label="渠道" value={filters.channel} options={["全部渠道", "抖音", "天猫", "京东", "拼多多"]} onChange={(v) => onChange("channel", v)} />}
    <FilterSelect label="型号" value={filters.product} options={["全部型号", "TS2", "TS2PRO", "TS3", "TS3PRO"]} onChange={(v) => onChange("product", v)} />
    <button className="reset-button" onClick={() => { onDateChange(defaultFilters.from, defaultFilters.to); if (showChannel) onChange("channel", defaultFilters.channel); onChange("product", defaultFilters.product); }}>重置</button>
  </section>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="select-wrap"><span>{label}</span><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><CaretDown size={12} /></label>;
}

function useData<T>(filters: ReportFilters, loader: (filters: ReportFilters) => Promise<DataResult<T>>) {
  const [result, setResult] = useState<DataResult<T> | null>(null);
  useEffect(() => { let active = true; setResult(null); loader(filters).then((value) => { if (active) setResult(value); }); return () => { active = false; }; }, [filters, loader]);
  return result;
}

function DataState({ status }: { status: DataStatus }) {
  if (status === "ready") return null;
  const copy = { delayed: "数据延迟：部分数据源仍在同步，当前结果截止昨日 20:00。", empty: "当前筛选范围暂无数据，请调整筛选条件。", definition_pending: "口径待确认：相关指标暂以业务草案计算。", source_unavailable: "数据源未接入：该区域暂不可用。" }[status];
  return <div className="state-banner"><WarningCircle />{copy}</div>;
}

function LoadingState() {
  return <div className="loading-grid" aria-label="数据加载中"><span /><span /><span /><span /></div>;
}

function Dashboard({ filters, navigate }: { filters: ReportFilters; navigate: (path: string) => void }) {
  const loader = useMemo(() => dataProvider.getExecutiveDashboard.bind(dataProvider), []);
  const result = useData(filters, loader);
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [panoramaOpen, setPanoramaOpen] = useState(false);
  if (!result) return <LoadingState />;
  const { data } = result;
  return <div className="dashboard-page">
    <DataState status={result.status} />
    <section className="kpi-grid" aria-label="核心经营指标">
      {data.metrics.map((metric) => <KpiCard key={metric.id} metric={metric} accent={metric.id === "active-devices"} onClick={() => setSelectedMetric(metric)} />)}
    </section>
    <section className="dashboard-middle">
      <article className="panel funnel-panel">
        <PanelHeader title="核心增长链路" meta="10 阶段完整链路 · 去重用户 / 设备" action={<><button onClick={() => setPanoramaOpen(true)}>全部经营指标</button><button onClick={() => navigate("/devices")}>查看激活漏斗 <ArrowRight /></button></>} />
        <Funnel stages={data.funnel} onSelect={setSelectedStage} />
        <div className="loss-row">
          <button className="loss-card critical" onClick={() => setSelectedStage(data.funnel.find((stage) => stage.id === "first-run") ?? null)}><span><TrendDown />主要流失点 01</span><b>设备激活 → 首次运动</b><p><strong>40.8%</strong> 转化率 · 流失 1,808</p></button>
          <button className="loss-card warning" onClick={() => setSelectedStage(data.funnel.find((stage) => stage.id === "second-route") ?? null)}><span><TrendDown />主要流失点 02</span><b>首条路线 → 启动第二条路线</b><p><strong>55.0%</strong> 转化率 · 流失 403</p></button>
        </div>
      </article>
    </section>
    <section className="panel business-overview-panel">
      <PanelHeader title="核心业务概览" meta="设备、用户、跑遍全球与活动中心关键数据" action={<span className="source-inline"><Database />统一模拟数据</span>} />
      <div className="business-overview-grid">
        {data.businessOverview.map((group) => <BusinessOverviewCard key={group.id} group={group} navigate={navigate} onMetricClick={setSelectedMetric} />)}
      </div>
    </section>
    <footer className="dashboard-foot"><span><Info />{northStarFormula}</span><span>数据截止 {result.asOf} · {result.source}</span></footer>
    {(selectedStage || selectedMetric) && <DetailDrawer stage={selectedStage} metric={selectedMetric} onClose={() => { setSelectedStage(null); setSelectedMetric(null); }} navigate={navigate} />}
    <ExecutivePanorama open={panoramaOpen} onClose={() => setPanoramaOpen(false)} />
  </div>;
}

function BusinessOverviewCard({ group, navigate, onMetricClick }: { group: ExecutiveData["businessOverview"][number]; navigate: (path: string) => void; onMetricClick: (metric: Metric) => void }) {
  const Icon = group.id === "devices" ? DeviceMobile : group.id === "users" ? UsersThree : group.id === "world" ? GlobeHemisphereWest : Trophy;
  return <article className={`business-card ${group.id}`}>
    <header><span><Icon weight="duotone" /></span><div><h3>{group.title}</h3><p>{group.summary}</p></div></header>
    <div className="business-metrics">
      {group.metrics.map((metric) => <button key={metric.id} type="button" onClick={() => onMetricClick(metric)} title={`口径：${metric.definition}`} aria-label={`查看${group.title}${metric.label}口径说明`}><span>{metric.label}<Question size={13} /></span><strong>{metric.value}</strong><small className={metric.changeTone === "negative" ? "negative" : "positive"}>{metric.changeTone === "negative" ? <ArrowDownRight /> : <ArrowUpRight />}{metric.change}</small><em>{metric.secondaryValue && <b>{metric.secondaryLabel} {metric.secondaryValue}</b>}{metric.secondaryValue ? " · " : ""}{metric.note}</em></button>)}
    </div>
    <button type="button" className="business-link" onClick={() => navigate(group.path)}>进入{group.title} <ArrowRight /></button>
  </article>;
}

function KpiCard({ metric, accent, catalog, onClick }: { metric: Metric; accent?: boolean; catalog?: boolean; onClick: () => void }) {
  return <button className={accent ? "kpi-card accent" : "kpi-card"} onClick={onClick} aria-label={catalog ? `展开${metric.label}列表` : `查看${metric.label}口径说明`} title={catalog ? `展开${metric.label}列表` : `口径：${metric.definition}`}><span className="kpi-label">{metric.label}{catalog ? <List size={14} /> : <Question size={14} />}</span><div><strong>{metric.value}</strong>{metric.secondaryValue && <b className="kpi-inline-secondary">{metric.secondaryLabel} {metric.secondaryValue}</b>}<span className={metric.changeTone === "negative" ? "change negative" : "change positive"}>{metric.changeTone === "negative" ? <ArrowDownRight /> : <ArrowUpRight />}{metric.change}</span></div><p>{metric.note}</p></button>;
}

function PanelHeader({ title, meta, action }: { title: string; meta?: string; action: React.ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2>{meta && <span>{meta}</span>}</div><div className="panel-action">{action}</div></div>;
}

function Funnel({ stages, onSelect }: { stages: FunnelStage[]; onSelect: (stage: FunnelStage) => void }) {
  return <div className="funnel-scroll"><div className="funnel" role="list" aria-label="十阶段增长链路">{stages.map((stage, index) => <div className="funnel-step" role="listitem" key={stage.id}><button className={stage.id === "first-run" || stage.id === "second-route" ? "stage-box alerted" : "stage-box"} onClick={() => onSelect(stage)}><span>{String(index + 1).padStart(2, "0")}</span><b>{stage.name}</b><strong>{formatNumber(stage.value)}</strong></button>{index < stages.length - 1 && <div className={stage.id === "activate" || stage.id === "first-route" ? "funnel-rate risk" : "funnel-rate"}><small>{stages[index + 1].rate}%</small><ArrowRight /></div>}</div>)}</div></div>;
}

type BusinessModuleTarget = { path: string; label: string };

const businessModuleTargets: Record<string, BusinessModuleTarget> = {
  sales: { path: "/sales", label: "进入销售中心" },
  "total-machines": { path: "/devices", label: "进入设备中心" },
  "sales-volume": { path: "/sales", label: "进入销售中心" },
  activation: { path: "/devices", label: "进入设备中心" },
  "device-d7-active": { path: "/devices", label: "进入设备中心" },
  "active-devices": { path: "/devices", label: "进入设备中心" },
  retention: { path: "/users", label: "进入用户中心" },
  "active-users": { path: "/users", label: "进入用户中心" },
  register: { path: "/users", label: "进入用户中心" },
  activate: { path: "/devices", label: "进入设备中心" },
  "first-run": { path: "/users", label: "进入用户中心" },
  "first-route": { path: "/content", label: "进入内容中心" },
  "second-route": { path: "/explore", label: "进入探索中心" },
  "continuous-route": { path: "/explore", label: "进入探索中心" },
  "unlock-city": { path: "/explore", label: "进入探索中心" },
  "explore-cities": { path: "/explore", label: "进入探索中心" },
  "long-retention": { path: "/users", label: "进入用户中心" },
};

export function getBusinessModuleTarget(id: string | undefined) {
  return id ? businessModuleTargets[id] : undefined;
}

function DetailDrawer({ stage, metric, onClose, navigate }: { stage: FunnelStage | null; metric: Metric | null; onClose: () => void; navigate?: (path: string) => void }) {
  const title = stage?.name ?? metric?.label ?? "指标详情";
  const target = getBusinessModuleTarget(stage?.id ?? metric?.id);
  const stageScope = stage?.scope ?? "该阶段按当前筛选时间统计。";
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭详情" onClick={onClose} /><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><button className="drawer-close" onClick={onClose} aria-label="关闭"><X /></button><div className="drawer-head"><span>指标下钻</span><h2 id="drawer-title">{title}</h2><p>{stage?.definition ?? metric?.definition}</p></div>{stage ? <><div className="drawer-number"><span>当前数量</span><strong>{formatNumber(stage.value)}</strong><small>上一步转化 {stage.rate}%</small></div><div className="definition-card"><Info /><div><b>统计范围</b><p>{stageScope}</p></div></div></> : <><div className="drawer-number"><span>当前值</span><strong>{metric?.value}</strong><small>{metric?.change} · 较上期</small></div><div className="definition-card"><Info /><div><b>口径说明</b><p>{metric?.definition}</p></div></div></>}{target && navigate && <button className="primary-button full" onClick={() => { navigate(target.path); onClose(); }}>{target.label} <ArrowRight /></button>}</aside></div>;
}

function StatusDefinitionDrawer({ definitions, onClose }: { definitions: NonNullable<ModuleData["distributionDefinitions"]>; onClose: () => void }) {
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭设备状态定义" onClick={onClose} /><aside className="drawer status-definition-drawer" role="dialog" aria-modal="true" aria-labelledby="status-definition-title"><button className="drawer-close" onClick={onClose} aria-label="关闭"><X /></button><div className="drawer-head"><span>定义说明</span><h2 id="status-definition-title">设备状态定义</h2><p>说明设备状态分布中各分类的统计含义。</p></div><div className="status-definition-cards">{definitions.map((item) => <article key={item.name}><b>{item.name}</b><p>{item.definition}</p></article>)}</div></aside></div>;
}

type ModuleKey = "sales" | "devices" | "users" | "content" | "explore" | "commercial" | "insights";

const frequencyDefinitions: Record<string, string> = {
  高频跑者: "近 30 日有效运动 ≥ 8 次",
  稳定跑者: "近 30 日有效运动 4–7 次",
  低频跑者: "近 30 日有效运动 1–3 次",
  沉默用户: "近 30 日无有效运动",
};

const lifecycleDefinitions: Record<string, string> = {
  习惯期: "连续 3 个月保持活跃",
  成长期: "近 30 日运动频次上升",
  尝试期: "首次运动后的 30 日内",
  流失期: "连续 30 日未产生运动",
};

const userTimeHeatmap = [
  { label: "00–03", values: [3, 3, 2, 2, 3, 3, 3] },
  { label: "03–06", values: [5, 4, 5, 5, 5, 4, 4] },
  { label: "06–09", values: [24, 27, 26, 28, 26, 29, 30] },
  { label: "09–12", values: [7, 7, 6, 6, 6, 7, 8] },
  { label: "12–15", values: [5, 5, 4, 4, 4, 5, 5] },
  { label: "15–18", values: [8, 7, 8, 8, 7, 7, 7] },
  { label: "18–21", values: [31, 31, 33, 31, 32, 29, 27] },
  { label: "21–24", values: [17, 16, 16, 16, 17, 16, 16] },
];

function UserTimeHeatmap() {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return <article className="panel donut-panel user-time-panel"><PanelHeader title="运动时段热力" meta="星期 × 3小时时段 · 单位：占比" action={<Info />} /><div className="user-time-heatmap" role="img" aria-label="星期与三小时时段运动分布热力图，18点至21点运动占比最高"><div className="user-time-grid"><span />{days.map((day) => <b key={day}>{day}</b>)}{userTimeHeatmap.flatMap((row) => [<strong key={row.label}>{row.label}</strong>, ...row.values.map((value, index) => <i key={`${row.label}-${days[index]}`} title={`${days[index]} ${row.label}：${value}%`} style={{ backgroundColor: `rgba(13, 148, 136, ${0.12 + value / 45})` }}>{value}</i>)])}</div><div className="heat-legend"><span>占比较低</span><i /><i /><i /><i /><span>占比较高</span></div></div></article>;
}

function ModuleDataTable({ data, moduleKey }: { data: ModuleData; moduleKey: ModuleKey }) {
  return <article className="panel data-table-panel">
    <PanelHeader title={data.sectionTitle} meta={moduleKey === "users" ? "频次按近 30 日运动次数 · 生命周期按活跃状态" : "支持横向滚动查看"} action={<Database />} />
    <div className="table-scroll"><table className={moduleKey === "users" ? "user-cohort-table" : undefined} aria-label={data.sectionTitle}><thead><tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => moduleKey === "users" && (cellIndex === 0 || cellIndex === 5) ? <td className="cohort-cell" key={cellIndex}><strong>{cell}</strong><small>{cellIndex === 0 ? frequencyDefinitions[String(cell)] : lifecycleDefinitions[String(cell)]}</small></td> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
  </article>;
}

function TrendChartPanel({ data, moduleKey }: { data: ModuleData; moduleKey: ModuleKey }) {
  const chartMeaning = moduleKey === "devices"
    ? ["实线：销售量", "虚线：激活量"]
    : moduleKey === "users"
      ? ["实线：活跃用户", "虚线：新增用户"]
      : moduleKey === "content"
        ? ["实线：路线播放量", "虚线：路线完播率"]
        : moduleKey === "explore"
          ? ["实线：路线完成人数", "虚线：路线启动人数", "点线：完播率"]
      : null;
  const primarySeriesName = moduleKey === "devices" ? "销售量" : moduleKey === "users" ? "活跃用户" : moduleKey === "content" ? "路线播放量" : moduleKey === "explore" ? "路线完成人数" : "本期";
  const secondarySeriesName = moduleKey === "devices" ? "激活量" : moduleKey === "users" ? "新增用户" : moduleKey === "content" ? "路线完播率" : moduleKey === "explore" ? "路线启动人数" : "上期";
  const primarySeriesUnit = moduleKey === "devices" ? "台" : moduleKey === "content" ? "次" : data.chartUnit;
  const secondarySeriesUnit = moduleKey === "devices" ? "台" : moduleKey === "content" ? "%" : data.chartUnit;
  return <article className={chartMeaning ? "panel chart-panel annotated-chart-panel" : "panel chart-panel"}>
    <PanelHeader title={data.chartTitle} meta={moduleKey === "devices" ? undefined : moduleKey === "users" ? `单位：${data.chartUnit}` : moduleKey === "content" ? "播放量：次 · 完播率：%" : moduleKey === "explore" ? "启动/完成人数：人 · 完播率：%" : `本期与上期环比 · 单位：${data.chartUnit}`} action={<ChartLineUp />} />
    {chartMeaning && <div className="chart-meaning" aria-label={`${data.chartTitle}图表含义`}>
      <span><i className="current" />{chartMeaning[0]}</span>
      <span><i className="previous" />{chartMeaning[1]}</span>
      {chartMeaning[2] && <span><i className="rate" />{chartMeaning[2]}</span>}
    </div>}
    <div className="chart-wrap" role="img" aria-label={moduleKey === "users" ? `${data.chartTitle}，活跃用户与新增用户对比趋势` : moduleKey === "content" ? `${data.chartTitle}，路线播放量与路线完播率对比趋势` : moduleKey === "explore" ? `${data.chartTitle}，路线完成人数、路线启动人数与完播率趋势` : `${data.chartTitle}，本期与上期对比趋势`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.trend} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
          <defs><linearGradient id={`fill-${data.title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488" stopOpacity={0.32} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#e8edf3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#738095", fontSize: 12 }} />
          <YAxis yAxisId="primary" domain={moduleKey === "users" ? [0, 1000] : undefined} ticks={moduleKey === "users" ? [0, 200, 400, 600, 800, 1000] : undefined} tickLine={false} axisLine={false} tick={{ fill: "#738095", fontSize: 12 }} />
          {(moduleKey === "content" || moduleKey === "explore") && <YAxis yAxisId="secondary" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />}
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dce4ed", boxShadow: "0 10px 30px rgba(15,23,42,.1)" }} />
          <Area yAxisId="primary" type="monotone" dataKey="value" name={`${primarySeriesName}（${primarySeriesUnit}）`} stroke="#0d9488" strokeWidth={2.5} fill={`url(#fill-${data.title})`} />
          <Line yAxisId={moduleKey === "content" ? "secondary" : "primary"} type="monotone" dataKey="secondary" name={`${secondarySeriesName}（${secondarySeriesUnit}）`} stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
          {moduleKey === "explore" && <Line yAxisId="secondary" type="monotone" dataKey="tertiary" name="完播率（%）" stroke="#f59e0b" strokeDasharray="2 3" strokeWidth={2} dot={false} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </article>;
}

function ModulePage({ moduleKey, filters, loader }: { moduleKey: ModuleKey; filters: ReportFilters; loader: (filters: ReportFilters) => Promise<DataResult<ModuleData>> }) {
  const stableLoader = useMemo(() => loader, [loader]);
  const result = useData(filters, stableLoader);
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [statusDefinitionsOpen, setStatusDefinitionsOpen] = useState(false);
  if (!result) return <LoadingState />;
  const { data } = result;
  const pieColors = ["#0d9488", "#2563eb", "#f59e0b", "#8b5cf6", "#64748b", "#ec4899"];
  return <div className="module-page">
    <DataState status={result.status} />
    <section className="module-hero"><div><h2>{data.title}</h2><p>{data.description}</p></div><div className="quality-chip"><SealCheck weight="fill" /><div><b>数据可用</b><span>截止 {result.asOf}</span></div></div></section>
    <section className={moduleKey === "users" ? "kpi-grid module-kpis user-kpis" : moduleKey === "devices" ? "kpi-grid module-kpis device-kpis" : "kpi-grid module-kpis"}>{data.metrics.map((item) => <KpiCard key={item.id} metric={item} catalog={moduleKey === "content" && (item.id === "cities" || item.id === "routes")} onClick={() => setSelectedMetric(item)} />)}</section>
    <section className="module-charts"><TrendChartPanel data={data} moduleKey={moduleKey} />{moduleKey === "users" ? <UserTimeHeatmap /> : <article className="panel donut-panel"><PanelHeader title={data.distributionTitle} meta="当前筛选范围" action={moduleKey === "devices" && data.distributionDefinitions ? <button type="button" className="icon-action-button" onClick={() => setStatusDefinitionsOpen(true)}><Question />定义说明</button> : <Info />} /><div className={moduleKey === "devices" ? "donut-wrap device-status-wrap" : "donut-wrap"}><div className="pie-area" role="img" aria-label={`${data.distributionTitle}环形图`}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.distribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{data.distribution.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip formatter={(value) => `${value}${data.distributionUnit ?? "%"}`} /></PieChart></ResponsiveContainer><div className="pie-center"><b>{moduleKey === "content" ? data.distribution.reduce((sum, item) => sum + item.value, 0) : data.distribution.length}</b><span>{moduleKey === "content" ? "座城市" : "类"}</span></div></div><ul className="legend-list">{data.distribution.map((item, index) => <li key={item.name}><i style={{ background: pieColors[index % pieColors.length] }} /><span>{item.name}</span><b>{item.value}{data.distributionUnit ?? "%"}</b></li>)}</ul></div></article>}</section>
    {moduleKey !== "devices" && moduleKey !== "content" && <section className="module-bottom"><ModuleDataTable data={data} moduleKey={moduleKey} /><aside className="signal-list">{data.notes.map((note) => <article key={note.title} className={`signal ${note.tone}`}><span>{note.tone === "red" ? <WarningCircle /> : note.tone === "teal" ? <TrendUp /> : <Info />}</span><div><h3>{note.title}</h3><p>{note.text}</p></div></article>)}<button className="back-button" onClick={() => navigate(`/dashboard?${new URLSearchParams(filters as unknown as Record<string, string>).toString()}`)}><ArrowRight />返回数据概览</button></aside></section>}
    <DeepDiveSections moduleKey={moduleKey} moduleData={data} />
    <footer className="module-foot"><span>{result.definition}</span><span>{result.source}</span></footer>
    {selectedMetric && moduleKey === "content" && (selectedMetric.id === "cities" || selectedMetric.id === "routes") ? <ContentCatalogDrawer kind={selectedMetric.id === "cities" ? "cities" : "routes"} onClose={() => setSelectedMetric(null)} /> : selectedMetric && <DetailDrawer stage={null} metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}
    {statusDefinitionsOpen && data.distributionDefinitions && <StatusDefinitionDrawer definitions={data.distributionDefinitions} onClose={() => setStatusDefinitionsOpen(false)} />}
  </div>;
}

const routerBase = import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");

export function App() { return <BrowserRouter basename={routerBase}><Shell /></BrowserRouter>; }
