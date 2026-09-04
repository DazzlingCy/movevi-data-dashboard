import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarCheck, CheckCircle, Coins,
  Database, Gift, Info, Medal, Question, SealCheck, TrendUp, WarningCircle, X,
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

function ReportHero({ icon, eyebrow, title, period, asOf, status }: { icon: React.ReactNode; eyebrow: string; title: string; period: string; asOf: string; status: string }) {
  return <section className="activity-report-hero"><div className="activity-report-icon">{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{period}</p></div><aside><SealCheck weight="fill" /><div><b>{status}</b><small>最近数据 {asOf}</small></div></aside></section>;
}

function LightStarBoard({ data, onMetric }: { data: LightStarReport; onMetric: (metric: Metric) => void }) {
  return <div className="activity-board" aria-label="勋章抽奖轻盈之星报表">
    <ReportHero icon={<Medal weight="duotone" />} eyebrow="勋章抽奖 · 轻盈之星报表" title={data.name} period={data.period} asOf={data.asOf} status={`奖池消耗 ${data.poolUsage.toFixed(1)}%`} />
    <section className="activity-metric-grid">{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onClick={() => onMetric(metric)} />)}</section>
    <section className="activity-chain" aria-label="轻盈之星用户转化链路">{data.flow.map((item, index) => <div key={item.label}><article><span>{item.label}</span><strong>{item.value.toLocaleString("zh-CN")} 人</strong>{index > 0 && <small>{(item.value / data.flow[index - 1].value * 100).toFixed(1)}%</small>}</article>{index < data.flow.length - 1 && <ArrowRight />}</div>)}</section>
    <div className="activity-analysis-grid star-grid">
      <section className="activity-panel activity-chart-panel"><header><div><h3>兑换与抽奖趋势</h3><p>活动全周期按日统计，单位：次</p></div><TrendUp /></header><div className="activity-chart" role="img" aria-label="勋章兑换与实际抽奖趋势"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="exchange" name="勋章兑换" fill="#16a39a" radius={[5, 5, 0, 0]} barSize={34} /><Line dataKey="draw" name="实际抽奖" stroke="#ff6b57" strokeWidth={3} dot={{ r: 4 }} /></ComposedChart></ResponsiveContainer></div></section>
      <section className="activity-panel frequency-panel"><header><div><h3>用户抽奖频次</h3><p>观察抽奖深度与机会使用集中度</p></div><Coins /></header><div className="frequency-list">{data.frequency.map((item) => <article key={item.name}><div><span>{item.name}</span><strong>{item.users.toLocaleString("zh-CN")} 人</strong></div><progress max={data.flow[2].value} value={item.users} /><small>{(item.users / data.flow[2].value * 100).toFixed(1)}%</small></article>)}</div></section>
    </div>
    <div className="activity-analysis-grid star-bottom-grid">
      <ReportTable title="勋章兑换排行" subtitle="识别贡献抽奖机会最多的线路与勋章" columns={["排名", "线路", "勋章", "兑换枚数", "兑换用户", "生成机会"]} rows={data.medalRows} />
      <section className="activity-panel cross-period-panel"><header><div><h3>用户跨期与履约</h3><p>参与频次、现金中奖与奖池履约</p></div><Gift /></header><div>{data.crossPeriod.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div><p className="activity-callout warning"><WarningCircle />当前范围仍有 {data.unusedChances.toLocaleString("zh-CN")} 次已生成机会未使用；机会余额为全局账户口径。</p></section>
    </div>
  </div>;
}

function CheckinBoard({ data, onMetric }: { data: ActivityCenterData["checkin"]; onMetric: (metric: Metric) => void }) {
  return <div className="activity-board" aria-label="30天打卡活动报表">
    <ReportHero icon={<CalendarCheck weight="duotone" />} eyebrow="30天打卡 · 打卡活动报表" title={data.name} period={data.period} asOf={data.asOf} status="任务质量检查通过" />
    <section className="activity-metric-grid">{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onClick={() => onMetric(metric)} />)}</section>
    <div className="activity-analysis-grid checkin-grid">
      <section className="activity-panel activity-chart-panel"><header><div><h3>参与、完成与红包领取趋势</h3><p>累计参与使用右轴，其余为阶段新增量</p></div><TrendUp /></header><div className="activity-chart" role="img" aria-label="打卡活动参与完成领取趋势"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend} margin={{ top: 18, right: 2, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis yAxisId="daily" tickLine={false} axisLine={false} /><YAxis yAxisId="total" orientation="right" tickLine={false} axisLine={false} /><Tooltip /><Legend /><Area yAxisId="total" type="monotone" dataKey="cumulative" name="累计参与" stroke="#2563eb" fill="#dbeafe" /><Line yAxisId="daily" type="monotone" dataKey="completed" name="完成任务" stroke="#0d9488" strokeWidth={2.5} dot={false} /><Line yAxisId="daily" type="monotone" dataKey="rewarded" name="领取红包" stroke="#f59e0b" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div></section>
      <section className="activity-panel checkin-funnel"><header><div><h3>D1–D30 完成深度</h3><p>每个 Dn 只统计已经到达该任务日的用户</p></div><CalendarCheck /></header><div>{data.funnel.map((item) => <article key={item.name}><span>{item.name}</span><progress max="3218" value={item.value} /><strong>{item.value.toLocaleString("zh-CN")}</strong><small>{item.rate.toFixed(1)}%</small></article>)}</div></section>
    </div>
    <div className="activity-analysis-grid checkin-detail-grid">
      <ReportTable title="每日趋势明细" subtitle="完成与领取均按当日用户去重" columns={["日期", "参与日增", "完成任务人数", "领取红包人数", "累计参与"]} rows={data.dailyRows} />
      <ReportTable title="新增用户参与与完成转化" subtitle="完成指截至统计日已完成注册日期对应的打卡任务" columns={["日期", "新增用户", "其中参与", "完成当日任务", "参与占比", "完成占比"]} rows={data.newUserTrend.map((item) => [item.date, item.users.toLocaleString("zh-CN"), item.participants.toLocaleString("zh-CN"), item.completed.toLocaleString("zh-CN"), `${(item.participants / item.users * 100).toFixed(1)}%`, `${(item.completed / item.participants * 100).toFixed(1)}%`])} />
    </div>
    <ReportTable title="分配线路完成表现" subtitle="按任务中的线路关联配置，判断路线难度与完成差异" columns={["线路", "分配用户", "到期任务", "完成任务", "完成率", "领取任务", "配置时长", "配置里程"]} rows={data.routeRows} />
    <div className="activity-analysis-grid checkin-bottom-grid">
      <ReportTable title="每日奖励配置与领取" subtitle="完成与领取均按当日用户去重" columns={["日期", "完成人数", "领取人数", "领取率", "应发金额", "已领取金额"]} rows={data.rewardRows} />
      <section className="activity-panel quality-panel"><header><div><h3>数据质量与口径</h3><p>任务唯一性、状态、关联与奖励快照</p></div><CheckCircle weight="fill" /></header><div className="quality-result"><CheckCircle weight="fill" /><div><strong>全部通过</strong><span>未发现重复任务、孤儿关联或奖励状态异常</span></div></div><ul><li>完成：注册日期对应的当日任务已完成</li><li>到期：截至统计日已经到达的任务日</li><li>已赚取：奖励状态为待领取或已领取</li><li>已领取：奖励状态为已领取</li></ul></section>
    </div>
  </div>;
}

export function ActivityCenter({ filters, report }: { filters: ReportFilters; report: "lottery" | "checkin" }) {
  const [result, setResult] = useState<DataResult<ActivityCenterData> | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
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
    {report === "lottery" ? <LightStarBoard data={selectedPeriod} onMetric={setSelectedMetric} /> : <CheckinBoard data={result.data.checkin} onMetric={setSelectedMetric} />}
    <footer className="module-foot"><span>{result.definition}</span><span>{result.source}</span></footer>
    {selectedMetric && <MetricDrawer metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}
  </div>;
}
