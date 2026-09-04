import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarCheck, CaretDown, CheckCircle, Coins,
  Clock, Database, Gift, Info, MagnifyingGlass, Medal, Path, Question, SealCheck, TrendUp, WarningCircle, X,
} from "@phosphor-icons/react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ActivityCenterData, DataResult, LightStarReport, Metric, ReportFilters, dataProvider } from "./data";

function MetricCard({ metric, onClick }: { metric: Metric; onClick: () => void }) {
  const isNegative = metric.changeTone === "negative";
  return <button className="activity-metric" onClick={onClick} aria-label={`查看${metric.label}口径说明`} title={`口径：${metric.definition}`}>
    <span>{metric.label}<Question /></span>
    <strong>{metric.value}</strong>
    <small className={isNegative ? "negative" : "positive"}>{isNegative ? <ArrowDownRight /> : <ArrowUpRight />}{metric.change}</small>
    <p>{metric.note}</p>
  </button>;
}

function ReportTable({ title, subtitle, columns, rows }: { title: string; subtitle: string; columns: string[]; rows: (string | number)[][] }) {
  return <section className="activity-panel activity-table-panel">
    <header><div><h3>{title}</h3><p>{subtitle}</p></div><Database /></header>
    <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
  </section>;
}

function MetricDrawer({ metric, onClose }: { metric: Metric; onClose: () => void }) {
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭口径说明" onClick={onClose} /><aside className="drawer activity-definition" role="dialog" aria-modal="true" aria-labelledby="activity-definition-title">
    <button className="drawer-close" aria-label="关闭" onClick={onClose}><X /></button>
    <div className="drawer-head"><span>口径说明</span><h2 id="activity-definition-title">{metric.label}</h2><p>{metric.definition}</p></div>
    <div className="drawer-number"><span>当前值</span><strong>{metric.value}</strong><small>{metric.note}</small></div>
    <div className="definition-card"><Info /><div><b>对比方式</b><p>{metric.change}，与上一可比活动周期比较。</p></div></div>
  </aside></div>;
}

function ReportHero({ icon, eyebrow, title, period, asOf, status, onShowRules }: { icon: React.ReactNode; eyebrow: string; title: string; period: string; asOf: string; status: string; onShowRules?: () => void }) {
  return <section className="activity-report-hero"><div className="activity-report-icon">{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{period}</p></div><div className="activity-report-controls">{onShowRules && <button type="button" className="activity-rules-trigger" onClick={onShowRules}><Info />查看活动规则<ArrowRight /></button>}<aside><SealCheck weight="fill" /><div><b>{status}</b><small>最近数据 {asOf}</small></div></aside></div></section>;
}

function ActivityRulesDrawer({ onClose }: { onClose: () => void }) {
  const rules = [
    ["完成路线得勋章", "每完成一条路线，一般获得 2–3 枚勋章。"],
    ["每天晚上八点开奖", "每天 20:00 开启抽奖，奖池抽完即止。"],
    ["一枚兑换一次机会", "每枚勋章兑换 1 次抽奖机会，抽奖次数不设上限。"],
    ["每期 200 个奖励", "每期设置 200 个奖励，奖励总金额 100 元，抽完即止。"],
    ["勋章永久有效", "未兑换勋章不会过期，可保留至下一期继续使用。"],
  ];
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭活动规则" onClick={onClose} /><aside className="drawer activity-rules-drawer" role="dialog" aria-modal="true" aria-labelledby="activity-rules-title">
    <button autoFocus className="drawer-close" aria-label="关闭" onClick={onClose}><X /></button>
    <div className="drawer-head"><span>活动规则</span><h2 id="activity-rules-title">勋章抽奖规则</h2><p>勋章获得、兑换、开奖、奖励发放和跨期结转均按以下规则统计。</p></div>
    <div className="activity-rule-list">{rules.map(([title, description], index) => <article key={title}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{title}</strong><p>{description}</p></div></article>)}</div>
    <div className="activity-rule-summary"><Clock /><div><b>开奖与奖池</b><span>每天 20:00 开奖 · 每期 200 个奖励 · 总金额 100 元</span></div></div>
  </aside></div>;
}

type LotterySortKey = "routes" | "badgesEarned" | "badgesExchanged" | "draws" | "rewards" | "rewardAmount";

function LotteryUserTable({ rows }: { rows: LightStarReport["userRows"] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: LotterySortKey; direction: "asc" | "desc" }>({ key: "draws", direction: "desc" });
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [rows]);
  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    if (!keyword) return rows;
    return rows.filter((row) => `${row.nickname} ${row.userId} ${row.phone}`.toLocaleLowerCase("zh-CN").includes(keyword));
  }, [query, rows]);
  const sortedRows = useMemo(() => [...filteredRows].sort((a, b) => {
    const result = a[sort.key] - b[sort.key];
    return sort.direction === "asc" ? result : -result;
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleRows = sortedRows.slice(start, start + pageSize);
  const toggleSort = (key: LotterySortKey) => setSort((current) => current.key === key ? { key, direction: current.direction === "desc" ? "asc" : "desc" } : { key, direction: "desc" });
  const sortableColumns: { key: LotterySortKey; label: string }[] = [
    { key: "routes", label: "完成路线" }, { key: "badgesEarned", label: "获得勋章" }, { key: "badgesExchanged", label: "兑换勋章" },
    { key: "draws", label: "抽奖次数" }, { key: "rewards", label: "中奖次数" }, { key: "rewardAmount", label: "中奖金额" },
  ];
  return <section className="activity-panel lottery-user-table">
    <header><div><h3>用户抽奖列表</h3><p>按当前期次展示实际参与抽奖的用户，每页 10 条</p></div><Database /></header>
    <div className="device-record-toolbar"><label className="table-search"><MagnifyingGlass /><span className="sr-only">查询抽奖用户</span><input type="search" aria-label="查询抽奖用户" placeholder="输入昵称、用户编号或手机号" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><span>支持点击数值表头排序</span></div>
    <div className="table-scroll"><table aria-label="用户抽奖列表"><thead><tr><th>用户</th><th>手机号</th>{sortableColumns.map((column) => <th key={column.key} aria-sort={sort.key === column.key ? (sort.direction === "desc" ? "descending" : "ascending") : "none"}><button type="button" className={sort.key === column.key ? `sort content-sort active ${sort.direction}` : "sort content-sort"} aria-label={`${column.label}排序`} onClick={() => toggleSort(column.key)}>{column.label}<CaretDown /></button></th>)}<th>最近抽奖</th></tr></thead><tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={row.userId}><td><strong>{row.nickname}</strong><small>{row.userId}</small></td><td>{row.phone}</td><td>{row.routes} 条</td><td>{row.badgesEarned} 枚</td><td>{row.badgesExchanged} 枚</td><td>{row.draws} 次</td><td>{row.rewards} 次</td><td>¥{row.rewardAmount.toFixed(2)}</td><td>{row.lastDrawAt}</td></tr>) : <tr><td className="empty-table-cell" colSpan={9}>未找到匹配用户，请更换昵称、用户编号或手机号</td></tr>}</tbody></table></div>
    <footer className="table-pagination"><span>共 {sortedRows.length.toLocaleString("zh-CN")} 名用户 · 第 {currentPage} / {totalPages} 页{sortedRows.length > 0 && ` · 当前 ${start + 1}–${Math.min(start + pageSize, sortedRows.length)} 条`}</span><div><button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ArrowRight />上一页</button><button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>下一页<ArrowRight /></button></div></footer>
  </section>;
}

function LightStarBoard({ data, onMetric, onShowRules }: { data: LightStarReport; onMetric: (metric: Metric) => void; onShowRules: () => void }) {
  return <div className="activity-board" aria-label="勋章抽奖报表">
    <ReportHero icon={<Medal weight="duotone" />} eyebrow="活动中心 · 按期次统计" title={data.name} period={data.period} asOf={data.asOf} status={`奖励发放 ${data.pool.rewardIssued} / ${data.pool.rewardLimit}`} onShowRules={onShowRules} />
    <section className="activity-metric-grid">{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onClick={() => onMetric(metric)} />)}</section>
    <section className="activity-chain" aria-label="勋章抽奖用户转化链路">{data.flow.map((item, index) => <div key={item.label}><article><span>{item.label}</span><strong>{item.value.toLocaleString("zh-CN")} 人</strong>{index > 0 && <small>{(item.value / data.flow[index - 1].value * 100).toFixed(1)}%</small>}</article>{index < data.flow.length - 1 && <ArrowRight />}</div>)}</section>
    <div className="activity-analysis-grid star-grid">
      <section className="activity-panel activity-chart-panel"><header><div><h3>勋章获得、兑换与抽奖趋势</h3><p>路线产出勋章后兑换机会；实际抽奖受单期 200 次奖池限制</p></div><TrendUp /></header><div className="activity-chart" role="img" aria-label="勋章获得兑换与实际抽奖趋势"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="earned" name="获得勋章" fill="#8bbeb9" radius={[5, 5, 0, 0]} barSize={30} /><Line dataKey="exchange" name="兑换勋章" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} /><Line dataKey="draw" name="实际抽奖" stroke="#ff6b57" strokeWidth={2.5} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div></section>
      <section className="activity-panel pool-panel"><header><div><h3>单期奖池履约</h3><p>奖励份数与金额均不得超过活动配置</p></div><Gift /></header><div className="pool-progress-list"><article><div><span>奖励份数</span><strong>{data.pool.rewardIssued} / {data.pool.rewardLimit} 个</strong></div><progress max={data.pool.rewardLimit} value={data.pool.rewardIssued} /><small>{(data.pool.rewardIssued / data.pool.rewardLimit * 100).toFixed(1)}%</small></article><article><div><span>奖励金额</span><strong>¥{data.pool.amountIssued.toFixed(2)} / ¥{data.pool.budget.toFixed(2)}</strong></div><progress max={data.pool.budget} value={data.pool.amountIssued} /><small>{(data.pool.amountIssued / data.pool.budget * 100).toFixed(1)}%</small></article></div><div className="pool-result"><SealCheck weight="fill" /><div><strong>奖池已抽完</strong><span>{data.isAggregate ? data.pool.soldOutAt : `本期 ${data.pool.soldOutAt} 抽完`}</span></div></div></section>
    </div>
    <div className="activity-analysis-grid star-secondary-grid">
      <section className="activity-panel activity-chart-panel"><header><div><h3>开奖后 24 小时抽奖节奏</h3><p>当日 20:00 至次日 19:59，按小时汇总实际抽奖次数</p></div><Clock /></header><div className="activity-chart" role="img" aria-label="当日晚上八点至次日十九点抽奖次数分布"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.hourly} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="time" tickLine={false} axisLine={false} interval={2} tick={{ fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip labelFormatter={(label) => `${label}–下一小时`} formatter={(value) => [`${Number(value).toLocaleString("zh-CN")} 次`, "实际抽奖"]} /><Bar dataKey="draws" name="实际抽奖" fill="#ff6b57" radius={[5, 5, 0, 0]} maxBarSize={28} /></ComposedChart></ResponsiveContainer></div></section>
      <section className="activity-panel frequency-panel"><header><div><h3>用户抽奖频次</h3><p>单个用户抽奖次数不设上限，观察机会集中度</p></div><Coins /></header><div className="frequency-list">{data.frequency.map((item) => <article key={item.name}><div><span>{item.name}</span><strong>{item.users.toLocaleString("zh-CN")} 人</strong></div><progress max={data.flow[2].value} value={item.users} /><small>{(item.users / data.flow[2].value * 100).toFixed(1)}%</small></article>)}</div></section>
    </div>
    <div className="activity-analysis-grid star-bottom-grid">
      <ReportTable title="路线与勋章产出" subtitle="检查每条路线的勋章产出是否保持在 2–3 枚，并观察兑换与结转" columns={["排名", "路线", "完成次数", "获得勋章", "单次平均", "兑换勋章", "结转勋章"]} rows={data.medalRows} />
      <section className="activity-panel cross-period-panel"><header><div><h3>勋章结转与活动履约</h3><p>奖池配置、抽奖用户与下期可用勋章</p></div><Path /></header><div>{data.crossPeriod.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div><p className="activity-callout warning"><WarningCircle />当前范围有 {data.carryoverBadges.toLocaleString("zh-CN")} 枚未兑换勋章可自动结转；另有 {data.unusedChances.toLocaleString("zh-CN")} 次已生成但未使用的抽奖机会，需单独监控机会跨期配置。</p></section>
    </div>
    <LotteryUserTable rows={data.userRows} />
  </div>;
}

function CheckinBoard({ data, onMetric }: { data: ActivityCenterData["checkin"]; onMetric: (metric: Metric) => void }) {
  return <div className="activity-board" aria-label="30天打卡活动报表">
    <ReportHero icon={<CalendarCheck weight="duotone" />} eyebrow="连接中 · 每日路线打卡" title={data.name} period={data.period} asOf={data.asOf} status="30天累计红包 ¥8.80" />
    <section className="activity-metric-grid">{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onClick={() => onMetric(metric)} />)}</section>
    <section className="checkin-business-flow" aria-label="30天打卡核心转化链路">{data.businessFlow.map((item, index) => <div key={item.label}><article><span>{item.label}</span><strong>{item.value.toLocaleString("zh-CN")} 人</strong><small>{item.note}</small></article>{index < data.businessFlow.length - 1 && <ArrowRight />}</div>)}</section>
    <div className="activity-analysis-grid checkin-grid">
      <section className="activity-panel activity-chart-panel"><header><div><h3>每日路线完成与红包领取趋势</h3><p>累计开启计划使用右轴，完成路线与领取红包按日统计</p></div><TrendUp /></header><div className="activity-chart" role="img" aria-label="30天计划开启、每日路线完成和红包领取趋势"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend} margin={{ top: 18, right: 2, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis yAxisId="daily" tickLine={false} axisLine={false} /><YAxis yAxisId="total" orientation="right" tickLine={false} axisLine={false} /><Tooltip /><Legend /><Area yAxisId="total" type="monotone" dataKey="cumulative" name="累计开启计划" stroke="#2563eb" fill="#dbeafe" /><Line yAxisId="daily" type="monotone" dataKey="completed" name="完成推荐路线" stroke="#0d9488" strokeWidth={2.5} dot={false} /><Line yAxisId="daily" type="monotone" dataKey="rewarded" name="领取打卡红包" stroke="#f59e0b" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div></section>
      <section className="activity-panel checkin-funnel"><header><div><h3>D1–D30 路线完成深度</h3><p>分母为开启计划用户，D1/7/15/21/30为重点红包日</p></div><CalendarCheck /></header><div>{data.funnel.map((item) => <article key={item.name}><span>{item.name}</span><progress max="3218" value={item.value} /><strong>{item.value.toLocaleString("zh-CN")}</strong><small>{item.rate.toFixed(1)}%</small></article>)}</div></section>
    </div>
    <div className="activity-analysis-grid checkin-detail-grid">
      <ReportTable title="重点红包日完成与领取" subtitle="第1、7、15、21、30天金额较高；30天累计红包8.8元" columns={["任务日", "单日红包", "到达用户", "完成路线", "领取红包", "领取率", "领取金额"]} rows={data.rewardRows} />
      <ReportTable title="新手红包任务" subtitle="与30天打卡红包分开统计，避免奖励金额重复计算" columns={["任务", "单人红包", "可参与用户", "完成人数", "领取人数", "领取率", "领取金额"]} rows={data.newbieRows} />
    </div>
    <div className="activity-analysis-grid checkin-detail-grid">
      <ReportTable title="每日打卡趋势明细" subtitle="每天完成对应推荐路线后获得1个固定金额红包" columns={["日期", "开启计划", "完成路线", "获得红包", "领取红包", "累计开启"]} rows={data.dailyRows} />
      <ReportTable title="新增用户计划转化" subtitle="按新用户注册日观察开启计划与首日路线完成" columns={["日期", "新增用户", "开启计划", "完成首日路线", "计划开启率", "首日完成率"]} rows={data.newUserTrend.map((item) => [item.date, item.users.toLocaleString("zh-CN"), item.participants.toLocaleString("zh-CN"), item.completed.toLocaleString("zh-CN"), `${(item.participants / item.users * 100).toFixed(1)}%`, `${(item.completed / item.participants * 100).toFixed(1)}%`])} />
    </div>
    <ReportTable title="推荐路线完成表现" subtitle="每日一条推荐路线，可在当天开始前更换路线" columns={["推荐路线", "到达任务", "完成路线", "完成率", "领取红包", "红包领取率", "建议时长", "路线里程"]} rows={data.routeRows} />
    <div className="activity-analysis-grid checkin-bottom-grid">
      <section className="activity-panel quality-panel"><header><div><h3>活动规则与数据口径</h3><p>基于 MOVEVI App“打卡领红包”当前规则</p></div><CheckCircle weight="fill" /></header><div className="quality-result"><CheckCircle weight="fill" /><div><strong>30天累计可领 ¥8.80</strong><span>每天完成对应推荐路线，获得并领取当日固定金额红包</span></div></div><ul><li>开启计划：用户点击“开启30天打卡”，每人仅记录一次</li><li>完成路线：在对应任务日完成当天推荐路线</li><li>重点红包日：第1、7、15、21、30天，红包金额高于普通任务日</li><li>新手红包：首次连接激活¥1.80、首次完成路线¥2.80，独立统计</li><li>领取红包：用户点击领取后进入“我的钱包”</li></ul></section>
      <section className="activity-panel checkin-reward-summary"><header><div><h3>30天红包构成</h3><p>固定金额配置，普通日与重点日合计8.8元</p></div><Gift /></header><div><article><span>普通任务日</span><strong>25 天 × ¥0.18</strong><b>¥4.50</b></article><article><span>重点红包日</span><strong>¥0.38 / 0.68 / 0.88 / 1.08 / 1.28</strong><b>¥4.30</b></article><article className="total"><span>30天累计</span><strong>完成30条推荐路线</strong><b>¥8.80</b></article></div></section>
    </div>
  </div>;
}

export function ActivityCenter({ filters, report }: { filters: ReportFilters; report: "lottery" | "checkin" }) {
  const [result, setResult] = useState<DataResult<ActivityCenterData> | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [showRules, setShowRules] = useState(false);
  useEffect(() => { let mounted = true; dataProvider.getActivityCenter(filters).then((next) => { if (mounted) setResult(next); }); return () => { mounted = false; }; }, [filters.channel, filters.from, filters.product, filters.region, filters.to]);
  if (!result) return <div className="loading-grid" aria-label="活动数据加载中"><span /><span /><span /><span /></div>;
  const periodId = report === "lottery" ? searchParams.get("period") ?? "all" : "all";
  const selectedPeriod = result.data.lightStarPeriods.find((item) => item.id === periodId) ?? result.data.lightStarPeriods[0];
  const changePeriod = (nextPeriod: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextPeriod === "all") next.delete("period"); else next.set("period", nextPeriod);
    setSearchParams(next, { replace: true });
  };
  return <div className="activity-center-page">
    {report === "lottery" && <section className="activity-period-toolbar" aria-label="勋章抽奖期次筛选"><div><Medal weight="duotone" /><div><b>统计期次</b><span>支持查看全部期次或单期明细</span></div></div><label><span>选择期次</span><select aria-label="选择勋章抽奖期次" value={selectedPeriod.id} onChange={(event) => changePeriod(event.target.value)}>{result.data.lightStarPeriods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><aside><Database /><div><b>{selectedPeriod.isAggregate ? "整体数据" : "单期数据"}</b><small>演示数据 · 最近更新 {selectedPeriod.asOf}</small></div></aside></section>}
    {report === "lottery" ? <LightStarBoard data={selectedPeriod} onMetric={setSelectedMetric} onShowRules={() => setShowRules(true)} /> : <CheckinBoard data={result.data.checkin} onMetric={setSelectedMetric} />}
    <footer className="module-foot"><span>{result.definition}</span><span>{result.source}</span></footer>
    {selectedMetric && <MetricDrawer metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}
    {showRules && <ActivityRulesDrawer onClose={() => setShowRules(false)} />}
  </div>;
}
