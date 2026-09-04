import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Brain, CaretDown,
  ChartLineUp, CheckCircle, CurrencyCircleDollar, Database, DeviceMobile, Gauge, GlobeHemisphereWest,
  Info, List, MagnifyingGlass, Question, SealCheck, ShoppingCart,
  Trophy, TrendDown, TrendUp, UsersThree, WarningCircle, X,
} from "@phosphor-icons/react";
import { FaTiktok } from "react-icons/fa6";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ChannelPerformance, DataResult, DataStatus, defaultFilters, ExecutiveData, formatNumber,
  FunnelStage, Metric, ModuleData, northStarFormula, ReportFilters, dataProvider,
} from "./data";
import { DeepDiveSections, ExecutivePanorama } from "./Supplemental";
import { ActivityCenter } from "./ActivityCenter";

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
  "/users": { title: "用户中心", subtitle: "活跃、留存和运动生命周期" },
  "/content": { title: "内容中心", subtitle: "城市、路线与真实内容价值" },
  "/explore": { title: "探索中心", subtitle: "路线解锁与世界跑者成长" },
  "/activities": { title: "活动中心", subtitle: "活动经营数据" },
  "/activities/lottery": { title: "勋章抽奖", subtitle: "轻盈之星分期与整体经营报表" },
  "/activities/checkin": { title: "30天打卡", subtitle: "任务完成与奖励履约报表" },
  "/commercial": { title: "商业中心", subtitle: "订阅增长与长期用户价值" },
  "/insights": { title: "AI 洞察", subtitle: "将数据信号变成经营动作" },
};

function Logo() {
  return <div className="brand" aria-label="MOVEVI 数据后台"><img className="brand-logo" src={`${import.meta.env.BASE_URL}movevi-logo.png`} alt="" /><span><b>MOVEVI</b><small>WORLD RUNNING</small></span></div>;
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
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
    normalized.delete("stage");
    if (!isSalesPage) normalized.delete("channel");
    if (isActivityPage) activityFilterKeys.forEach((key) => normalized.delete(key));
    if (!isLotteryPage) normalized.delete("period");
    searchParamsRef.current = normalized;
    if (hadStageFilter || hadOutOfScopeChannel || hadOutOfScopeActivityFilters || hadOutOfScopePeriod) setSearchParams(normalized, { replace: true });
  }, [isActivityPage, isLotteryPage, isSalesPage, searchParams, setSearchParams]);
  const filters = useMemo<ReportFilters>(() => ({
    from: searchParams.get("from") ?? defaultFilters.from,
    to: searchParams.get("to") ?? defaultFilters.to,
    channel: isSalesPage ? searchParams.get("channel") ?? defaultFilters.channel : defaultFilters.channel,
    product: searchParams.get("product") ?? defaultFilters.product,
    region: searchParams.get("region") ?? defaultFilters.region,
  }), [isSalesPage, searchParams]);

  const changeFilter = (key: keyof ReportFilters, value: string) => {
    const next = new URLSearchParams(searchParamsRef.current);
    if (value === defaultFilters[key]) next.delete(key); else next.set(key, value);
    searchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  };

  const pathWithFilters = (path: string) => {
    const next = new URLSearchParams(searchParams);
    if (path !== "/sales") next.delete("channel");
    if (path.startsWith("/activities")) ["from", "to", "channel", "product", "region"].forEach((key) => next.delete(key));
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
      <div className="sidebar-foot"><div className="avatar">林</div><div><strong>林总</strong><span>管理员 · 演示环境</span></div></div>
    </aside>
    {menuOpen && <button className="menu-scrim" aria-label="关闭导航" onClick={() => setMenuOpen(false)} />}
    <div className="workspace">
      <header className="topbar">
        <div className="title-wrap"><button className="mobile-menu" aria-label="打开导航" onClick={() => setMenuOpen(true)}><List /></button><div><h1>{meta.title}</h1><p>{meta.subtitle}</p></div></div>
        <div className="top-actions"><span className="data-pill"><span className="live-dot" />演示数据 · 截止 09-02</span><button className="icon-button" aria-label="搜索"><MagnifyingGlass /></button><button className="icon-button notification" aria-label="通知"><Bell /><i /></button></div>
      </header>
      <main className="main-content">
        {!isActivityPage && <FilterBar filters={filters} onChange={changeFilter} showChannel={isSalesPage} />}
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

function FilterBar({ filters, onChange, showChannel }: { filters: ReportFilters; onChange: (key: keyof ReportFilters, value: string) => void; showChannel: boolean }) {
  const resetKeys: (keyof ReportFilters)[] = showChannel ? ["from", "to", "channel", "product", "region"] : ["from", "to", "product", "region"];
  return <section className="filter-bar" aria-label="报表筛选">
    <div className="date-range"><label><span>开始日期</span><input aria-label="开始日期" type="date" value={filters.from} onChange={(e) => onChange("from", e.target.value)} /></label><ArrowRight size={14} /><label><span>结束日期</span><input aria-label="结束日期" type="date" value={filters.to} max="2026-09-02" onChange={(e) => onChange("to", e.target.value)} /></label></div>
    {showChannel && <FilterSelect label="渠道" value={filters.channel} options={["全部渠道", "抖音", "天猫", "京东", "拼多多"]} onChange={(v) => onChange("channel", v)} />}
    <FilterSelect label="型号" value={filters.product} options={["全部型号", "TS2", "TS2PRO", "TS3", "TS3PRO"]} onChange={(v) => onChange("product", v)} />
    <FilterSelect label="地区" value={filters.region} options={["全国", "华东", "华南", "华北", "西部"]} onChange={(v) => onChange("region", v)} />
    <button className="reset-button" onClick={() => resetKeys.forEach((key) => onChange(key, defaultFilters[key]))}>重置</button>
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
  const [sortKey, setSortKey] = useState<keyof ChannelPerformance>("sales");
  if (!result) return <LoadingState />;
  const { data } = result;
  const sortedChannels = [...data.channels].sort((a, b) => typeof a[sortKey] === "number" ? Number(b[sortKey]) - Number(a[sortKey]) : String(a[sortKey]).localeCompare(String(b[sortKey]), "zh-CN"));
  return <div className="dashboard-page">
    <DataState status={result.status} />
    <section className="kpi-grid" aria-label="核心经营指标">
      {data.metrics.map((metric) => <KpiCard key={metric.id} metric={metric} accent={metric.id === "active-users"} onClick={() => setSelectedMetric(metric)} />)}
    </section>
    <section className="dashboard-middle">
      <article className="panel funnel-panel">
        <PanelHeader title="核心增长链路" meta="11 阶段完整链路 · 去重用户 / 设备" action={<><button onClick={() => setPanoramaOpen(true)}>全部经营指标</button><button onClick={() => navigate("/devices")}>查看激活漏斗 <ArrowRight /></button></>} />
        <Funnel stages={data.funnel} onSelect={setSelectedStage} />
        <div className="loss-row">
          <button className="loss-card critical" onClick={() => setSelectedStage(data.funnel.find((stage) => stage.id === "first-run") ?? null)}><span><TrendDown />主要流失点 01</span><b>设备激活 → 首次运动</b><p><strong>40.8%</strong> 转化率 · 流失 1,808</p></button>
          <button className="loss-card warning" onClick={() => setSelectedStage(data.funnel.find((stage) => stage.id === "second-route") ?? null)}><span><TrendDown />主要流失点 02</span><b>首条路线 → 第二条路线</b><p><strong>55.0%</strong> 转化率 · 流失 403</p></button>
        </div>
      </article>
    </section>
    <section className="panel channel-panel">
      <PanelHeader title="销售渠道概览" meta="仅展示销售数据 · 不影响其他业务指标" action={<span className="source-inline"><Database />统一模拟数据</span>} />
      <div className="table-scroll"><table><thead><tr><SortableTh label="渠道" field="channel" active={sortKey} onSort={setSortKey} /><th>渠道类型</th><SortableTh label="销售额" field="sales" active={sortKey} onSort={setSortKey} /><SortableTh label="销量" field="salesVolume" active={sortKey} onSort={setSortKey} /><SortableTh label="客单价" field="unitPrice" active={sortKey} onSort={setSortKey} /><SortableTh label="退款率" field="refundRate" active={sortKey} onSort={setSortKey} /><th>销售表现</th></tr></thead><tbody>{sortedChannels.map((row) => <tr key={row.channel}><td><ChannelMark name={row.channel} />{row.channel}</td><td className="muted">{row.group}</td><td>¥{formatNumber(row.sales)}</td><td>{formatNumber(row.salesVolume)} 台</td><td>¥{formatNumber(row.unitPrice)}</td><td>{row.refundRate}%</td><td><StatusTag status={row.status} /></td></tr>)}</tbody></table></div>
    </section>
    <footer className="dashboard-foot"><span><Info />{northStarFormula}</span><span>数据截止 {result.asOf} · {result.source}</span></footer>
    {(selectedStage || selectedMetric) && <DetailDrawer stage={selectedStage} metric={selectedMetric} onClose={() => { setSelectedStage(null); setSelectedMetric(null); }} navigate={navigate} />}
    <ExecutivePanorama open={panoramaOpen} onClose={() => setPanoramaOpen(false)} />
  </div>;
}

function KpiCard({ metric, accent, onClick }: { metric: Metric; accent?: boolean; onClick: () => void }) {
  return <button className={accent ? "kpi-card accent" : "kpi-card"} onClick={onClick} aria-label={`查看${metric.label}口径说明`} title={`口径：${metric.definition}`}><span className="kpi-label">{metric.label}<Question size={14} /></span><div><strong>{metric.value}</strong><span className={metric.changeTone === "negative" ? "change negative" : "change positive"}>{metric.changeTone === "negative" ? <ArrowDownRight /> : <ArrowUpRight />}{metric.change}</span></div><p>{metric.note}</p></button>;
}

function PanelHeader({ title, meta, action }: { title: string; meta: string; action: React.ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2><span>{meta}</span></div><div className="panel-action">{action}</div></div>;
}

function Funnel({ stages, onSelect }: { stages: FunnelStage[]; onSelect: (stage: FunnelStage) => void }) {
  return <div className="funnel-scroll"><div className="funnel" role="list" aria-label="十一阶段增长链路">{stages.map((stage, index) => <div className="funnel-step" role="listitem" key={stage.id}><button className={stage.id === "first-run" || stage.id === "second-route" ? "stage-box alerted" : "stage-box"} onClick={() => onSelect(stage)}><span>{String(index + 1).padStart(2, "0")}</span><b>{stage.name}</b><strong>{formatNumber(stage.value)}</strong></button>{index < stages.length - 1 && <div className={stage.id === "activate" || stage.id === "first-route" ? "funnel-rate risk" : "funnel-rate"}><small>{stages[index + 1].rate}%</small><ArrowRight /></div>}</div>)}</div></div>;
}

function SortableTh({ label, field, active, onSort }: { label: string; field: keyof ChannelPerformance; active: keyof ChannelPerformance; onSort: (field: keyof ChannelPerformance) => void }) {
  return <th><button className={active === field ? "sort active" : "sort"} onClick={() => onSort(field)}>{label}<CaretDown /></button></th>;
}

function ChannelMark({ name }: { name: string }) {
  const content = name === "抖音" ? <FaTiktok /> : <ShoppingCart weight="fill" />;
  return <span className={`channel-mark ${name}`}>{content}</span>;
}

function StatusTag({ status }: { status: ChannelPerformance["status"] }) {
  return <span className={`status-tag ${status}`}>{status === "健康" && <CheckCircle weight="fill" />}{status === "异常" && <WarningCircle weight="fill" />}{status}</span>;
}

type BusinessModuleTarget = { path: string; label: string };

const businessModuleTargets: Record<string, BusinessModuleTarget> = {
  sales: { path: "/sales", label: "进入销售中心" },
  "sales-volume": { path: "/sales", label: "进入销售中心" },
  activation: { path: "/devices", label: "进入设备中心" },
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
  subscription: { path: "/commercial", label: "进入商业中心" },
  "long-retention": { path: "/users", label: "进入用户中心" },
};

export function getBusinessModuleTarget(id: string | undefined) {
  return id ? businessModuleTargets[id] : undefined;
}

function DetailDrawer({ stage, metric, onClose, navigate }: { stage: FunnelStage | null; metric: Metric | null; onClose: () => void; navigate?: (path: string) => void }) {
  const title = stage?.name ?? metric?.label ?? "指标详情";
  const target = getBusinessModuleTarget(stage?.id ?? metric?.id);
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭详情" onClick={onClose} /><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><button className="drawer-close" onClick={onClose} aria-label="关闭"><X /></button><div className="drawer-head"><span>指标下钻</span><h2 id="drawer-title">{title}</h2><p>{stage?.definition ?? metric?.definition}</p></div>{stage ? <><div className="drawer-number"><span>当前数量</span><strong>{formatNumber(stage.value)}</strong><small>上一步转化 {stage.rate}%</small></div><div className="definition-card"><Info /><div><b>统计范围</b><p>该阶段按全部销售来源汇总，不按渠道拆分。</p></div></div></> : <><div className="drawer-number"><span>当前值</span><strong>{metric?.value}</strong><small>{metric?.change} · 较上期</small></div><div className="definition-card"><Info /><div><b>口径说明</b><p>{metric?.definition}</p></div></div></>}{target && navigate && <button className="primary-button full" onClick={() => { navigate(target.path); onClose(); }}>{target.label} <ArrowRight /></button>}</aside></div>;
}

type ModuleKey = "sales" | "devices" | "users" | "content" | "explore" | "commercial" | "insights";

function ModulePage({ moduleKey, filters, loader }: { moduleKey: ModuleKey; filters: ReportFilters; loader: (filters: ReportFilters) => Promise<DataResult<ModuleData>> }) {
  const stableLoader = useMemo(() => loader, [loader]);
  const result = useData(filters, stableLoader);
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  if (!result) return <LoadingState />;
  const { data } = result;
  const pieColors = ["#0d9488", "#2563eb", "#f59e0b", "#8b5cf6", "#64748b"];
  return <div className="module-page">
    <DataState status={result.status} />
    <section className="module-hero"><div><h2>{data.title}</h2><p>{data.description}</p></div><div className="quality-chip"><SealCheck weight="fill" /><div><b>数据可用</b><span>截止 {result.asOf}</span></div></div></section>
    <section className="kpi-grid module-kpis">{data.metrics.map((item) => <KpiCard key={item.id} metric={item} onClick={() => setSelectedMetric(item)} />)}</section>
    <section className="module-charts"><article className="panel chart-panel"><PanelHeader title={data.chartTitle} meta={`本期与上期环比 · 单位：${data.chartUnit}`} action={<ChartLineUp />} /><div className="chart-wrap" role="img" aria-label={`${data.chartTitle}，本期与上期对比趋势`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}><defs><linearGradient id={`fill-${data.title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488" stopOpacity={0.32} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#738095", fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#738095", fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dce4ed", boxShadow: "0 10px 30px rgba(15,23,42,.1)" }} /><Area type="monotone" dataKey="value" name={`本期（${data.chartUnit}）`} stroke="#0d9488" strokeWidth={2.5} fill={`url(#fill-${data.title})`} /><Line type="monotone" dataKey="secondary" name={`上期（${data.chartUnit}）`} stroke="#94a3b8" strokeDasharray="4 4" dot={false} /></AreaChart></ResponsiveContainer></div></article><article className="panel donut-panel"><PanelHeader title={data.distributionTitle} meta="当前筛选范围" action={<Info />} /><div className="donut-wrap"><div className="pie-area" role="img" aria-label={`${data.distributionTitle}环形图`}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.distribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{data.distribution.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip formatter={(value) => `${value}%`} /></PieChart></ResponsiveContainer><div className="pie-center"><b>{data.distribution.length}</b><span>类</span></div></div><ul className="legend-list">{data.distribution.map((item, index) => <li key={item.name}><i style={{ background: pieColors[index % pieColors.length] }} /><span>{item.name}</span><b>{item.value}%</b></li>)}</ul></div></article></section>
    <section className="module-bottom"><article className="panel data-table-panel"><PanelHeader title={data.sectionTitle} meta="支持横向滚动查看" action={<Database />} /><div className="table-scroll"><table><thead><tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div></article><aside className="signal-list">{data.notes.map((note) => <article key={note.title} className={`signal ${note.tone}`}><span>{note.tone === "red" ? <WarningCircle /> : note.tone === "teal" ? <TrendUp /> : <Info />}</span><div><h3>{note.title}</h3><p>{note.text}</p></div></article>)}<button className="back-button" onClick={() => navigate(`/dashboard?${new URLSearchParams(filters as unknown as Record<string, string>).toString()}`)}><ArrowRight />返回数据概览</button></aside></section>
    <DeepDiveSections moduleKey={moduleKey} />
    <footer className="module-foot"><span>{result.definition}</span><span>{result.source}</span></footer>
    {selectedMetric && <DetailDrawer stage={null} metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}
  </div>;
}

const routerBase = import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");

export function App() { return <BrowserRouter basename={routerBase}><Shell /></BrowserRouter>; }
