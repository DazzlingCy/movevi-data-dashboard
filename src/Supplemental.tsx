import { useState } from "react";
import {
  ArrowRight, CaretDown, ChartLineUp, CheckCircle, CirclesThreePlus, Clock, Compass, DeviceMobile,
  Info, MagnifyingGlass, MapPin, Medal, Path, Sparkle, Tag, TrendDown, UsersThree, X,
} from "@phosphor-icons/react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ModuleData } from "./data";

type ModuleKey = "sales" | "devices" | "users" | "content" | "explore" | "commercial" | "insights";

const executiveGroups = [
  { title: "销售", tone: "blue", items: [["销售额", "¥1,286,400"], ["销量", "4,328 台"], ["新增用户数", "6,324"], ["客单价", "¥297"], ["主销产品", "TS3PRO"], ["渠道销售额", "抖音 ¥496,300"], ["渠道占比", "38.6%"], ["退货率", "5.1%"]] },
  { title: "用户", tone: "teal", items: [["注册用户", "36,887"], ["激活用户", "30,563"], ["激活率", "82.8%"], ["首次运动人数", "12,478"], ["首次运动率", "40.8%"], ["DAU / WAU / MAU", "7,842 / 24,680 / 38,910"], ["7日留存", "22.3%"], ["30日留存", "13.8%"]] },
  { title: "内容", tone: "orange", items: [["总路线数", "200（规划数据）"], ["总城市数", "10（规划数据）"], ["总内容时长", "2,000 分钟"], ["总路线里程", "5,000 公里"], ["景点数", "600"], ["路线完成次数", "42,680"], ["路线复跑次数", "11,268"], ["城市解锁数量", "7,230 节点"]] },
  { title: "商业", tone: "violet", items: [["订阅用户", "1,286"], ["订阅转化率", "4.5%"], ["续费率", "68.2%"], ["ARPU", "¥38.6"], ["预测 LTV", "¥486"], ["退款金额", "¥65,640"], ["月有效运动用户", "8,326"], ["WORLD RUNNING INDEX", "42,680"]] },
];

export function ExecutivePanorama({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭经营指标全景" onClick={onClose} /><aside className="panorama-drawer" role="dialog" aria-modal="true" aria-labelledby="panorama-title"><button className="drawer-close" aria-label="关闭" onClick={onClose}><X /></button><header><h2 id="panorama-title">经营指标全景</h2><p>首屏只保留四个决策指标，这里集中查看文本要求的 32 项经营指标。</p></header><div className="panorama-scroll">{executiveGroups.map((group) => <section key={group.title} className={`panorama-group ${group.tone}`}><h3>{group.title}<small>8 项</small></h3><div>{group.items.map(([label, value]) => <article key={label}><span>{label}</span><b>{value}</b></article>)}</div></section>)}</div><footer><Info />内容资产中的“200 条路线 / 10 个城市”等为规划口径；运营态数据仍使用统一演示事实集。</footer></aside></div>;
}

const salesFunnel = [["曝光",978120],["点击",212680],["咨询",128340],["加购",81240],["下单",51260],["支付",43285],["发货",42210],["退款",2207]] as const;
const activationFunnel = [["销售",43285],["注册",36887],["激活",30563],["成功连接",28741],["首次运动",12478],["首条路线",8954],["D7 使用",2770]] as const;
const retention = [{name:"D1",value:49.6},{name:"D3",value:33.8},{name:"D7",value:22.3},{name:"D14",value:17.4},{name:"D30",value:13.8},{name:"D60",value:10.7},{name:"D90",value:8.0}];
const exitCurve = [{name:"0分",value:100},{name:"5分",value:93},{name:"8分",value:84},{name:"10分",value:81},{name:"15分",value:67},{name:"20分",value:58}];

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return <div className="deep-head"><div><h2>{title}</h2><p>{desc}</p></div><CirclesThreePlus weight="duotone" /></div>;
}

function MiniFunnel({ data, refundLast = false }: { data: readonly (readonly [string, number])[]; refundLast?: boolean }) {
  const max = Math.max(...data.map((item) => item[1]));
  return <div className="mini-funnel" role="img" aria-label={data.map(([name,value]) => `${name}${value.toLocaleString("zh-CN")}`).join("，")}>{data.map(([name,value], index) => { const prev = index ? data[index - 1][1] : value; const rate = index ? value / prev * 100 : 100; return <div key={name} className={refundLast && index === data.length - 1 ? "refund" : ""}><span>{name}</span><b>{value.toLocaleString("zh-CN")}</b><progress max={max} value={value} /><small>{index ? `${rate.toFixed(1)}%` : "起点"}</small></div>; })}</div>;
}

function SimpleTable({ columns, rows, caption }: { columns: string[]; rows: (string | number)[][]; caption: string }) {
  return <div className="table-scroll deep-table"><table><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

type ContentSort = { index: number; direction: "asc" | "desc" } | null;

function numericCellValue(cell: string | number) {
  const matched = String(cell).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : 0;
}

function sortContentRows(rows: (string | number)[][], sort: ContentSort) {
  if (!sort) return rows;
  return [...rows].sort((left, right) => (numericCellValue(left[sort.index]) - numericCellValue(right[sort.index])) * (sort.direction === "asc" ? 1 : -1));
}

function SortableContentTable({ columns, rows, caption, sortableColumns }: { columns: string[]; rows: (string | number)[][]; caption: string; sortableColumns: number[] }) {
  const [sort, setSort] = useState<ContentSort>(null);
  const toggleSort = (index: number) => setSort((current) => current?.index === index ? { index, direction: current.direction === "desc" ? "asc" : "desc" } : { index, direction: "desc" });
  const sortedRows = sortContentRows(rows, sort);
  return <div className="table-scroll deep-table"><table><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column,index) => sortableColumns.includes(index) ? <th key={column} aria-sort={sort?.index === index ? (sort.direction === "desc" ? "descending" : "ascending") : "none"}><button type="button" className={sort?.index === index ? `sort content-sort active ${sort.direction}` : "sort content-sort"} aria-label={`${column}排序`} title={`点击按${column}${sort?.index === index && sort.direction === "desc" ? "升序" : "降序"}排列`} onClick={() => toggleSort(index)}>{column}<CaretDown /></button></th> : <th key={column}>{column}</th>)}</tr></thead><tbody>{sortedRows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function LineVisual({ data, label, unit = "%" }: { data: { name: string; value: number }[]; label: string; unit?: string }) {
  return <div className="deep-line" role="img" aria-label={`${label}：${data.map((item) => `${item.name}${item.value}${unit}`).join("，")}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:15,right:20,left:-20,bottom:0}}><CartesianGrid vertical={false} stroke="#e7edf3" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#758398"}} /><YAxis unit={unit} tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#758398"}} /><Tooltip formatter={(value) => `${value}${unit}`} /><Line type="monotone" dataKey="value" name={label} stroke="#0d9488" strokeWidth={3} dot={{r:4,fill:"#0d9488",strokeWidth:2,stroke:"#fff"}} /></LineChart></ResponsiveContainer></div>;
}

function SalesDeepDive() {
  const rows = [
    ["抖音","468,000","92,300","28,200","18,900","16,842","16,218","1,246"], ["天猫","254,000","48,400","21,100","15,300","12,456","12,180","386"], ["京东","187,000","36,800","18,600","12,800","10,280","10,104","391"], ["拼多多","129,000","27,180","14,960","8,740","6,124","5,986","386"],
  ];
  return <><section className="deep-panel"><SectionHead title="完整销售漏斗" desc="补齐点击、加购、下单、发货与退款，区分卖得多和卖得好。" /><MiniFunnel data={salesFunnel} refundLast /></section><section className="deep-panel"><SectionHead title="四大销售渠道质量" desc="抖音、天猫、京东和拼多多统一比较。" /><SimpleTable caption="四大销售渠道交易漏斗" columns={["渠道","曝光","点击","咨询","加购","支付","发货","退款"]} rows={rows} /></section></>;
}

function DeviceRecordTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const filteredRows = normalizedQuery ? rows.filter((row) => row.some((cell) => String(cell).toLocaleLowerCase("zh-CN").includes(normalizedQuery))) : rows;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleRows = filteredRows.slice(pageStart, pageStart + pageSize);

  return <section className="deep-panel device-records">
    <SectionHead title="一机一档完整字段表" desc="以唯一 SN 串联出厂、交易、用户、连接、使用、故障与版本。" />
    <div className="device-record-toolbar"><label className="table-search"><MagnifyingGlass /><span className="sr-only">搜索设备</span><input type="search" aria-label="搜索一机一档设备" placeholder="搜索设备、型号、用户、固件或故障" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><span>每页显示 10 条</span></div>
    <div className="table-scroll deep-table"><table><caption className="sr-only">一机一档完整字段表</caption><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{visibleRows.length > 0 ? visibleRows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td className="empty-table-cell" colSpan={columns.length}>未找到匹配设备，请更换搜索条件</td></tr>}</tbody></table></div>
    <footer className="table-pagination"><span>共 {filteredRows.length} 台设备 · 第 {currentPage} / {totalPages} 页{filteredRows.length > 0 && ` · 当前 ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredRows.length)} 条`}</span><div><button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ArrowRight />上一页</button><button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>下一页<ArrowRight /></button></div></footer>
  </section>;
}

function DevicesDeepDive({ data }: { data: ModuleData }) {
  return <><section className="deep-panel"><SectionHead title="设备激活与首次使用漏斗" desc="卖出去不等于真正使用；成功连接与首跑是当前最大断点。" /><MiniFunnel data={activationFunnel} /></section><DeviceRecordTable columns={data.columns} rows={data.rows} /></>;
}

function UserDeepDive() {
  const profiles = [["年龄","25–35 岁",42],["性别","女性 54% · 男性 46%",54],["地区","华东",41],["购买产品","TS3PRO",28],["订阅","有效订阅",4.5]] as const;
  const frequencyTiers = [["未启动","近 30 日 0 次","6,324",17],["尝鲜用户","近 30 日 1 次","5,318",14],["轻度用户","近 30 日 2–3 次","8,584",23],["潜力用户","近 30 日 4–7 次","7,046",19],["稳定用户","近 30 日 8–15 次","6,104",16],["核心用户","近 30 日 15 次以上","2,508",7]] as const;
  const newUserTrend = [{name:"08-04",value:1_086},{name:"08-09",value:1_214},{name:"08-14",value:1_168},{name:"08-19",value:1_326},{name:"08-24",value:1_418},{name:"08-29",value:1_512},{name:"09-02",value:1_624}];
  const newUserCohorts = [["08-01–08-07","1,086","912","382","276","25.4%"],["08-08–08-14","1,214","1,026","418","304","25.0%"],["08-15–08-21","1,326","1,148","472","346","26.1%"],["08-22–08-28","1,512","1,312","516","382","25.3%"],["08-29–09-02","1,186","1,060","446","—","观察中"]];
  return <>
    <div className="deep-grid two user-new-grid">
      <section className="deep-panel"><SectionHead title="新用户首周关键转化" desc="新增用户按首次注册去重，观察连接激活、首次运动、首条路线与D7留存。" /><MiniFunnel data={[["新增注册",6324],["连接激活",5458],["首次运动",2234],["首条路线",1686],["D7留存",978]]} /></section>
      <section className="deep-panel"><SectionHead title="新增用户趋势" desc="按注册日期统计新增用户，单位：人。" /><LineVisual data={newUserTrend} label="新增用户" unit="人" /></section>
    </div>
    <section className="deep-panel new-user-cohort-panel"><SectionHead title="新用户分批次首周表现" desc="最近一批用户尚未完整到达D7，留存标记为观察中。" /><SimpleTable caption="新用户分批次首周表现" columns={["注册批次","新增用户","连接激活","首次运动","D7留存人数","D7留存率"]} rows={newUserCohorts} /></section>
    <section className="deep-panel"><SectionHead title="MOVEVI App 用户运动档案" desc="对应个人页的完成城市、完成路线、运动里程、运动时长与路线进度。" /><div className="summary-strip"><article><MapPin /><span>人均完成城市</span><b>2.4 座</b></article><article><Path /><span>人均完成路线</span><b>7.2 条</b></article><article><ChartLineUp /><span>人均运动里程</span><b>62.0 km</b></article><article><Clock /><span>人均运动时长</span><b>12.0 h</b></article></div></section>
    <section className="deep-panel user-retention-panel"><SectionHead title="D1–D90 用户留存曲线" desc="可继续按产品、城市与画像细分。" /><LineVisual data={retention} label="留存率" /></section>
    <div className="deep-grid three user-analysis-grid"><section className="deep-panel compact"><h3>用户画像</h3><p className="card-helper">展示当前筛选范围内占比最高的主要特征。</p><div className="profile-breakdown" aria-label="用户画像主要特征">{profiles.map(([dimension,value,percent])=><article key={dimension}><div><span>{dimension}</span><strong>{value}</strong><b>{percent}%</b></div><progress max="100" value={percent} /></article>)}</div></section><section className="deep-panel compact"><h3>运动频次分层</h3><p className="card-helper">按近 30 日有效运动次数划分，人数占比可直接比较。</p><div className="frequency-tier-list" aria-label="运动频次分层说明">{frequencyTiers.map(([name,rule,users,percent])=><article key={name}><div><strong>{name}</strong><span>{rule}</span><b>{users} 人</b></div><progress max="25" value={percent} /><small>{percent}%</small></article>)}</div></section><section className="deep-panel compact"><h3>App 功能使用</h3><p className="card-helper">近 30 日进入对应功能的活跃用户占比。</p><ul className="stat-list"><li><span>路线详情访问率</span><b>36.9%</b></li><li><span>城市卡片查看率</span><b>38.4%</b></li><li><span>运动记录查看率</span><b>62.8%</b></li><li><span>我的设备访问率</span><b>47.6%</b></li><li><span>排行榜访问率</span><b>21.3%</b></li></ul><div className="lifecycle-tags" aria-label="用户成长阶段">{["游客","新手","探索者","城市玩家","世界玩家","核心用户","付费用户","超级用户"].map((item,index)=><span key={item}>{index+1} {item}</span>)}</div></section></div>
  </>;
}

function ContentRoutePerformanceTable({ data }: { data: ModuleData }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ContentSort>(null);
  const pageSize = 10;
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const filteredRows = normalizedQuery ? data.rows.filter((row) => String(row[0]).toLocaleLowerCase("zh-CN").includes(normalizedQuery)) : data.rows;
  const sortedRows = sortContentRows(filteredRows, sort);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleRows = sortedRows.slice(start, start + pageSize);
  const sortableColumns = [3, 4, 5, 6, 7];
  const toggleSort = (index: number) => { setSort((current) => current?.index === index ? { index, direction: current.direction === "desc" ? "asc" : "desc" } : { index, direction: "desc" }); setPage(1); };
  return <section className="deep-panel content-route-performance"><SectionHead title="路线" desc="按路线查看经营数据；点击高亮表头可切换升序、降序。" /><div className="device-record-toolbar"><label className="table-search"><MagnifyingGlass /><span className="sr-only">搜索路线名称</span><input type="search" aria-label="搜索路线名称" placeholder="输入路线名称搜索" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><span>每页显示 10 条</span></div><div className="table-scroll deep-table"><table aria-label="城市与路线综合热度"><thead><tr>{data.columns.map((column,index) => sortableColumns.includes(index) ? <th key={column} aria-sort={sort?.index === index ? (sort.direction === "desc" ? "descending" : "ascending") : "none"}><button type="button" className={sort?.index === index ? `sort content-sort active ${sort.direction}` : "sort content-sort"} aria-label={`${column}排序`} title={`点击按${column}${sort?.index === index && sort.direction === "desc" ? "升序" : "降序"}排列`} onClick={() => toggleSort(index)}>{column}<CaretDown /></button></th> : <th key={column}>{column}</th>)}</tr></thead><tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={String(row[0])}>{row.map((cell,index) => <td key={index}>{cell}</td>)}</tr>) : <tr><td className="empty-table-cell" colSpan={data.columns.length}>未找到匹配路线，请更换路线名称</td></tr>}</tbody></table></div><footer className="table-pagination"><span>共 {filteredRows.length} 条路线 · 第 {currentPage} / {totalPages} 页{filteredRows.length > 0 && ` · 当前 ${start + 1}–${Math.min(start + pageSize, filteredRows.length)} 条`}</span><div><button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ArrowRight />上一页</button><button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>下一页<ArrowRight /></button></div></footer></section>;
}

function ContentDeepDive({ data }: { data: ModuleData }) {
  const regionRows = [["亚洲","32","480","2,826","14,280","61.8%"],["欧洲","21","315","1,768","6,240","57.6%"],["非洲","7","105","486","1,420","38.4%"],["北美洲","12","180","892","3,680","49.7%"],["南美洲","6","90","368","986","34.8%"],["大洋洲","8","78","502","1,216","42.6%"]];
  const cityRows = [["杭州","亚洲","15","24","3,197","79.1%","96"],["东京","亚洲","15","31","3,086","82.7%","95"],["巴黎","欧洲","15","28","2,940","80.4%","93"],["北京","亚洲","15","15","2,512","68.5%","92"],["上海","亚洲","15","83","3,842","82.4%","91"],["纽约","北美洲","15","36","2,174","77.4%","89"],["新加坡","亚洲","15","32","1,986","83.1%","88"],["伦敦","欧洲","15","26","2,068","76.8%","87"],["悉尼","大洋洲","15","24","1,842","78.5%","86"],["西安","亚洲","15","66","1,764","72.6%","84"]];
  return <><section className="deep-panel"><SectionHead title="区域" desc="按大洲汇总上线城市、有效路线、景点与用户完成进度；点击高亮表头排序。" /><SortableContentTable caption="大洲内容数据" columns={["大洲","上线城市","有效路线","城市景点","城市完成人数","平均完成度"]} rows={regionRows} sortableColumns={[4,5]} /></section><section className="deep-panel"><SectionHead title="城市" desc="按城市比较路线供给、景点数量、完成人数和内容热度；点击高亮表头排序。" /><SortableContentTable caption="城市内容数据" columns={["城市","所属大洲","有效路线","城市景点","完成人数","平均完播率","综合热度"]} rows={cityRows} sortableColumns={[4,5,6]} /></section><ContentRoutePerformanceTable data={data} /><section className="deep-panel"><SectionHead title="20 分钟路线退出点" desc="第 8 分钟开始明显掉速，应回看镜头、强度和讲解内容。" /><LineVisual data={exitCurve} label="仍在路线" /></section><div className="deep-grid three"><section className="deep-panel compact"><h3>复跑原因</h3><div className="reason-list">{[["喜欢风景",28],["想解锁下一条",21],["喜欢训练",17],["想减肥",13],["喜欢音乐",9],["完成任务",7],["其他",5]].map(([name,value])=><div key={name}><span>{name}</span><progress max="30" value={value}/><b>{value}%</b></div>)}</div></section><section className="deep-panel compact"><h3>景点热度</h3><SimpleTable caption="景点热度" columns={["景点","停留","讲解播放","相关完赛"]} rows={[["埃菲尔铁塔","84秒","68%","82%"],["浅草寺","72秒","61%","78%"],["外滩","91秒","74%","86%"],["布鲁克林桥","66秒","57%","69%"]]} /></section><section className="deep-panel compact"><h3>内容标签体系</h3><div className="tag-cloud">{["东京","城市街道","夜景","慢跑","低强度","浪漫","夜晚","夏季","建筑","海边","历史建筑","自然风光","20分钟"].map((item)=><span key={item}><Tag />{item}</span>)}</div><p className="deep-note">25–35 岁女性更偏好“夜景 + 海边 + 轻运动 + 20分钟”。</p></section></div></>;
}

function ExploreDeepDive() {
  return <><div className="deep-grid two"><section className="deep-panel"><SectionHead title="点亮地球计划转化" desc="从路线解锁、完成路线到点亮城市，定位用户在第几步停止探索。" /><MiniFunnel data={[["解锁路线",18920],["完成 1 条",12860],["完成 3 条",6840],["点亮城市",4620],["点亮 2 城",1860]]} /></section><section className="deep-panel"><SectionHead title="探索深度五级标准" desc="以累计完成路线和点亮城市数定义等级，对应 App 等级与排行榜。" /><div className="level-list">{[["Level 1","初次出发","1 条",38],["Level 2","城市探索者","5 条",29],["Level 3","城市旅行者","10 条",19],["Level 4","世界探索者","30 条",10],["Level 5","环球跑者","100 条",4]].map(([level,name,goal,value])=><article key={level}><span>{level}</span><b>{name}</b><small>{goal}</small><progress max="40" value={value}/><em>{value}%</em></article>)}</div></section></div><section className="deep-panel city-unlock"><SectionHead title="城市图鉴与探索行为" desc="覆盖 App 的城市图鉴、排行榜和城市信号广播。" /><div className="summary-strip"><article><MapPin /><span>城市完成用户</span><b>6,284</b></article><article><Path /><span>人均解锁路线</span><b>3.7 条</b></article><article><Medal /><span>勋章获得用户</span><b>5,318</b></article><article><UsersThree /><span>排行榜访问率</span><b>21.3%</b></article></div></section></>;
}

function CommercialDeepDive() {
  return <><div className="deep-grid two"><section className="deep-panel"><SectionHead title="完成路线数与订阅意愿" desc="内容消费深度越高，用户的付费意愿越明显。" /><div className="conversion-bars">{[["完成 1 条",1],["完成 5 条",5],["完成 10 条",15],["完成 30 条",35]].map(([name,value])=><div key={name}><span>{name}</span><progress max="40" value={value}/><b>{value}%</b></div>)}</div></section><section className="deep-panel"><SectionHead title="订阅前行为画像" desc="用于识别哪些内容行为最容易产生付费。" /><div className="summary-strip compact-strip"><article><MapPin /><span>东京路线</span><b>5 条</b></article><article><Compass /><span>巴黎路线</span><b>3 条</b></article><article><CheckCircle /><span>完成次数</span><b>8 次</b></article><article><Clock /><span>累计运动</span><b>180 分钟</b></article></div></section></div><section className="deep-panel"><SectionHead title="退订原因完整选项" desc="将退订原因直接回流产品、内容、设备与商业团队。" /><div className="cancel-grid">{[["内容不够丰富",18],["没时间运动",27],["城市不喜欢",9],["路线不喜欢",11],["设备问题",8],["APP体验问题",10],["价格问题",14],["其他",3]].map(([name,value])=><article key={name}><span>{name}</span><b>{value}%</b><progress max="30" value={value}/></article>)}</div></section></>;
}

function InsightsDeepDive() {
  return <><section className="deep-panel feature-insight"><SectionHead title="夜景城市路线是下一阶段内容机会" desc="过去 30 天，25–35 岁用户对夜景城市路线的偏好明显高于其他类型。" /><div className="insight-story"><Sparkle weight="fill" /><div><b>结论</b><p>东京、巴黎夜景路线完成率高于城市平均水平 <strong>18%</strong>，其中 25–35 岁女性的收藏率高出 <strong>24%</strong>。</p></div><ArrowRight /><div><b>建议</b><p>下一阶段优先增加 20 分钟、轻运动、海边或地标建筑的夜间城市路线。</p></div></div></section><section className="deep-panel"><SectionHead title="硬件与内容交叉偏好" desc="让产品设计与内容生产互相指导，并用于个性化推荐。" /><SimpleTable caption="设备与内容交叉偏好" columns={["硬件","主要运动","偏好内容","平均强度","平均时长","推荐策略"]} rows={[["TS2","慢走","轻运动城市 / 老街","低","18 分","推荐轻运动路线"],["TS2PRO","快走 / 慢跑","滨水 / 夜景","中低","22 分","推荐 20 分钟夜景路线"],["TS3","跑步","城市街道 / 滨水","中","26 分","推荐节奏跑路线"],["TS3PRO","间歇 / 坡度","HIIT / 山地城市","高","32 分","推荐 HIIT 与坡度路线"]]} /></section></>;
}

export function DeepDiveSections({ moduleKey, moduleData }: { moduleKey: ModuleKey; moduleData: ModuleData }) {
  const content = { sales:<SalesDeepDive />, devices:<DevicesDeepDive data={moduleData} />, users:<UserDeepDive />, content:<ContentDeepDive data={moduleData} />, explore:<ExploreDeepDive />, commercial:<CommercialDeepDive />, insights:<InsightsDeepDive /> }[moduleKey];
  return <section className="deep-dive" aria-label="需求补充的深度分析">{content}</section>;
}
