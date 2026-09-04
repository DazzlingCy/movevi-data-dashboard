import { useState } from "react";
import {
  ArrowRight, ChartLineUp, CheckCircle, CirclesThreePlus, Clock, Compass, DeviceMobile,
  Info, MapPin, Medal, Path, Sparkle, Tag, TrendDown, UsersThree, X,
} from "@phosphor-icons/react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
const activationFunnel = [["销售",43285],["收货",41102],["注册",36887],["激活",30563],["成功连接",28741],["首次运动",12478],["首条路线",8954],["D7 使用",2770]] as const;
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

function LineVisual({ data, label, unit = "%" }: { data: { name: string; value: number }[]; label: string; unit?: string }) {
  return <div className="deep-line" role="img" aria-label={`${label}：${data.map((item) => `${item.name}${item.value}${unit}`).join("，")}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:15,right:20,left:-20,bottom:0}}><CartesianGrid vertical={false} stroke="#e7edf3" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#758398"}} /><YAxis unit={unit} tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#758398"}} /><Tooltip formatter={(value) => `${value}${unit}`} /><Line type="monotone" dataKey="value" name={label} stroke="#0d9488" strokeWidth={3} dot={{r:4,fill:"#0d9488",strokeWidth:2,stroke:"#fff"}} /></LineChart></ResponsiveContainer></div>;
}

function SalesDeepDive() {
  const rows = [
    ["抖音","468,000","92,300","28,200","18,900","16,842","16,218","1,246"], ["天猫","254,000","48,400","21,100","15,300","12,456","12,180","386"], ["京东","187,000","36,800","18,600","12,800","10,280","10,104","391"], ["拼多多","129,000","27,180","14,960","8,740","6,124","5,986","386"],
  ];
  return <><section className="deep-panel"><SectionHead title="完整销售漏斗" desc="补齐点击、加购、下单、发货与退款，区分卖得多和卖得好。" /><MiniFunnel data={salesFunnel} refundLast /></section><section className="deep-panel"><SectionHead title="四大销售渠道质量" desc="抖音、天猫、京东和拼多多统一比较。" /><SimpleTable caption="四大销售渠道交易漏斗" columns={["渠道","曝光","点击","咨询","加购","支付","发货","退款"]} rows={rows} /></section></>;
}

function DevicesDeepDive() {
  const records = [
    ["MOVEVI-TS3P-000001","TS3PRO","2026-05-18","2026-06-02","U-88201","06-08 10:24","06-08 10:31","186","96.4h","42","无","v3.8.2","v5.6.0"],
    ["MOVEVI-TS3-000418","TS3","2026-06-03","2026-06-21","U-77198","06-28 19:42","06-28 19:47","73","42.1h","19","蓝牙中断×1","v3.8.1","v5.6.0"],
    ["MOVEVI-TS2P-001204","TS2PRO","2026-04-11","2026-05-05","U-55027","05-12 08:20","05-12 08:28","31","18.6h","12","跑带偏移×1","v3.7.9","v5.5.2"],
    ["MOVEVI-TS2-001678","TS2","2026-06-21","2026-07-02","U-44291","07-09 20:15","07-09 20:22","12","8.6h","6","无","v3.8.0","v5.5.2"],
  ];
  return <><section className="deep-panel"><SectionHead title="设备激活与首次使用漏斗" desc="卖出去不等于真正使用；成功连接与首跑是当前最大断点。" /><MiniFunnel data={activationFunnel} /></section><section className="deep-panel"><SectionHead title="一机一档完整字段" desc="以唯一 SN 串联出厂、交易、用户、连接、使用、故障与版本。" /><SimpleTable caption="设备完整档案" columns={["设备唯一 ID","型号","出厂时间","销售时间","用户","激活时间","首次连接","蓝牙连接","使用时长","使用次数","故障记录","固件","APP"]} rows={records} /></section></>;
}

function UserDeepDive() {
  const timeRows = ["00–06","06–09","09–12","12–15","15–18","18–21","21–24"];
  const values = [[9,7,6,6,7,11,13],[32,35,37,36,34,42,48],[18,17,16,17,18,22,26],[13,12,11,12,13,17,21],[20,22,23,24,26,33,36],[58,61,64,63,68,76,81],[31,34,37,36,42,49,53]];
  return <><section className="deep-panel"><SectionHead title="MOVEVI App 用户运动档案" desc="对应个人页的完成城市、完成路线、运动里程、运动时长与城市收藏。" /><div className="summary-strip"><article><MapPin /><span>人均完成城市</span><b>2.4 座</b></article><article><Path /><span>人均完成路线</span><b>7.2 条</b></article><article><ChartLineUp /><span>人均运动里程</span><b>62.0 km</b></article><article><Clock /><span>人均运动时长</span><b>12.0 h</b></article></div></section><div className="deep-grid two"><section className="deep-panel"><SectionHead title="D1–D90 用户留存曲线" desc="可继续按产品、城市与画像细分。" /><LineVisual data={retention} label="留存率" /></section><section className="deep-panel"><SectionHead title="星期 × 时段运动热力" desc="晚间与周末是当前高峰，月份季节趋势纳入下方摘要。" /><div className="heatmap"><div />{["一","二","三","四","五","六","日"].map((day) => <b key={day}>周{day}</b>)}{timeRows.flatMap((time,row) => [<span key={time}>{time}</span>,...values[row].map((value,col) => <i key={`${row}-${col}`} style={{"--heat":value/85} as React.CSSProperties} title={`${time} 周${["一","二","三","四","五","六","日"][col]}：${value}`} />)])}</div><p className="deep-note">月份观察：7–8 月晚间占比 46%，12–2 月日间占比提升 9.2pp。</p></section></div><div className="deep-grid three"><section className="deep-panel compact"><h3>用户画像（已有数据）</h3><SimpleTable caption="用户画像" columns={["维度","主要人群","占比"]} rows={[["年龄","25–35 岁","42%"],["性别","女性 / 男性","54% / 46%"],["地区","华东","41%"],["购买产品","TS3PRO","28%"],["订阅","有效订阅","4.5%"]]} /></section><section className="deep-panel compact"><h3>运动频次分层</h3><SimpleTable caption="运动频次" columns={["月频次","定义","人数"]} rows={[["0 次","购而未用","6,324"],["1 次","尝鲜","5,318"],["2–3 次","轻度","8,584"],["4–7 次","潜力","7,046"],["8–15 次","稳定","6,104"],["15+ 次","核心","2,508"]]} /></section><section className="deep-panel compact"><h3>App 功能使用</h3><ul className="stat-list"><li><span>城市收藏用户</span><b>9,286</b></li><li><span>城市卡片查看率</span><b>38.4%</b></li><li><span>运动记录查看率</span><b>62.8%</b></li><li><span>我的设备访问率</span><b>47.6%</b></li><li><span>排行榜访问率</span><b>21.3%</b></li></ul><div className="lifecycle-tags">{["游客","新手","探索者","城市玩家","世界玩家","核心用户","付费用户","超级用户"].map((item,index)=><span key={item}>{index+1} {item}</span>)}</div></section></div></>;
}

function ContentDeepDive() {
  const routeRows = [["东京 01","12,860","8,420","3,812","4,106","3,202","3,488","78.0%","21.6 分","8 分","1,340","1,086","924","64.0%"],["巴黎 01","10,480","7,930","3,544","3,886","3,108","3,420","88.9%","23.1 分","15 分","1,486","1,204","1,032","72.4%"],["纽约 03","8,760","6,210","2,608","2,914","1,338","1,472","50.5%","16.8 分","8 分","438","326","281","41.8%"]];
  return <><section className="deep-panel"><SectionHead title="MOVEVI App 城市内容盘点" desc="与 App 城市页一致，按大洲查看城市、路线、景点和用户完成进度。" /><SimpleTable caption="大洲城市内容盘点" columns={["区域","上线城市","有效路线","城市景点","城市完成人数","平均完成进度"]} rows={[["中国","18","286","1,642","8,420","61.8%"],["亚洲其他","14","218","1,184","5,860","54.2%"],["欧洲","21","326","1,768","6,240","57.6%"],["非洲","7","92","486","1,420","38.4%"],["北美洲","12","176","892","3,680","49.7%"],["南美洲","6","68","368","986","34.8%"],["大洋洲","8","82","502","1,216","42.6%"]]} /></section><div className="deep-grid two"><section className="deep-panel"><SectionHead title="20 分钟路线退出点" desc="第 8 分钟开始明显掉速，应回看镜头、强度和讲解内容。" /><LineVisual data={exitCurve} label="仍在路线" /></section><section className="deep-panel"><SectionHead title="城市综合热度" desc="综合路线开始、城市完成、复跑、收藏、分享与订阅。" /><SimpleTable caption="城市排行榜" columns={["城市","路线/景点","完成进度","复跑率","人均时长","综合热度"]} rows={[["杭州","3 / 24","3/3","38.2%","126 分","96"],["北京","3 / 15","3/3","31.4%","108 分","92"],["上海","3 / 83","0/3","36.8%","116 分","90"],["西安","3 / 66","0/3","24.1%","89 分","81"],["新加坡","4 / 32","点亮中","29.8%","96 分","84"]]} /></section></div><section className="deep-panel"><SectionHead title="每条路线完整数据档案" desc="路线完成率与下一条启动率是内容团队的首要判断指标。" /><SimpleTable caption="路线完整数据档案" columns={["路线","曝光","点击","开始人数","开始次数","完成人数","完成次数","完成率","平均时长","退出点","复跑","收藏","分享/赞","下一条启动"]} rows={routeRows} /></section><div className="deep-grid three"><section className="deep-panel compact"><h3>复跑原因</h3><div className="reason-list">{[["喜欢风景",28],["想解锁下一条",21],["喜欢训练",17],["想减肥",13],["喜欢音乐",9],["完成任务",7],["其他",5]].map(([name,value])=><div key={name}><span>{name}</span><progress max="30" value={value}/><b>{value}%</b></div>)}</div></section><section className="deep-panel compact"><h3>景点热度</h3><SimpleTable caption="景点热度" columns={["景点","停留","讲解播放","收藏","相关完赛"]} rows={[["埃菲尔铁塔","84秒","68%","1,024","82%"],["浅草寺","72秒","61%","886","78%"],["外滩","91秒","74%","1,286","86%"],["布鲁克林桥","66秒","57%","648","69%"]]} /></section><section className="deep-panel compact"><h3>内容标签体系</h3><div className="tag-cloud">{["东京","城市街道","夜景","慢跑","低强度","浪漫","夜晚","夏季","建筑","海边","历史建筑","自然风光","20分钟"].map((item)=><span key={item}><Tag />{item}</span>)}</div><p className="deep-note">25–35 岁女性更偏好“夜景 + 海边 + 轻运动 + 20分钟”。</p></section></div></>;
}

function ExploreDeepDive() {
  return <><div className="deep-grid two"><section className="deep-panel"><SectionHead title="点亮地球计划转化" desc="从路线解锁、完成路线到点亮城市，定位用户在第几步停止探索。" /><MiniFunnel data={[["解锁路线",18920],["完成 1 条",12860],["完成 3 条",6840],["点亮城市",4620],["点亮 2 城",1860]]} /></section><section className="deep-panel"><SectionHead title="探索深度五级标准" desc="以累计完成路线和点亮城市数定义等级，对应 App 等级与排行榜。" /><div className="level-list">{[["Level 1","初次出发","1 条",38],["Level 2","城市探索者","5 条",29],["Level 3","城市旅行者","10 条",19],["Level 4","世界探索者","30 条",10],["Level 5","环球跑者","100 条",4]].map(([level,name,goal,value])=><article key={level}><span>{level}</span><b>{name}</b><small>{goal}</small><progress max="40" value={value}/><em>{value}%</em></article>)}</div></section></div><section className="deep-panel city-unlock"><SectionHead title="城市图鉴与探索行为" desc="覆盖 App 的城市图鉴、城市收藏、排行榜和城市信号广播。" /><div className="summary-strip"><article><MapPin /><span>城市完成用户</span><b>6,284</b></article><article><Path /><span>人均解锁路线</span><b>3.7 条</b></article><article><Medal /><span>城市收藏用户</span><b>9,286</b></article><article><UsersThree /><span>排行榜访问率</span><b>21.3%</b></article></div></section></>;
}

function CommercialDeepDive() {
  return <><div className="deep-grid two"><section className="deep-panel"><SectionHead title="完成路线数与订阅意愿" desc="内容消费深度越高，用户的付费意愿越明显。" /><div className="conversion-bars">{[["完成 1 条",1],["完成 5 条",5],["完成 10 条",15],["完成 30 条",35]].map(([name,value])=><div key={name}><span>{name}</span><progress max="40" value={value}/><b>{value}%</b></div>)}</div></section><section className="deep-panel"><SectionHead title="订阅前行为画像" desc="用于识别哪些内容行为最容易产生付费。" /><div className="summary-strip compact-strip"><article><MapPin /><span>东京路线</span><b>5 条</b></article><article><Compass /><span>巴黎路线</span><b>3 条</b></article><article><CheckCircle /><span>完成次数</span><b>8 次</b></article><article><Clock /><span>累计运动</span><b>180 分钟</b></article></div></section></div><section className="deep-panel"><SectionHead title="退订原因完整选项" desc="将退订原因直接回流产品、内容、设备与商业团队。" /><div className="cancel-grid">{[["内容不够丰富",18],["没时间运动",27],["城市不喜欢",9],["路线不喜欢",11],["设备问题",8],["APP体验问题",10],["价格问题",14],["其他",3]].map(([name,value])=><article key={name}><span>{name}</span><b>{value}%</b><progress max="30" value={value}/></article>)}</div></section></>;
}

function InsightsDeepDive() {
  return <><section className="deep-panel feature-insight"><SectionHead title="夜景城市路线是下一阶段内容机会" desc="过去 30 天，25–35 岁用户对夜景城市路线的偏好明显高于其他类型。" /><div className="insight-story"><Sparkle weight="fill" /><div><b>结论</b><p>东京、巴黎夜景路线完成率高于城市平均水平 <strong>18%</strong>，其中 25–35 岁女性的收藏率高出 <strong>24%</strong>。</p></div><ArrowRight /><div><b>建议</b><p>下一阶段优先增加 20 分钟、轻运动、海边或地标建筑的夜间城市路线。</p></div></div></section><section className="deep-panel"><SectionHead title="硬件与内容交叉偏好" desc="让产品设计与内容生产互相指导，并用于个性化推荐。" /><SimpleTable caption="设备与内容交叉偏好" columns={["硬件","主要运动","偏好内容","平均强度","平均时长","推荐策略"]} rows={[["TS2","慢走","轻运动城市 / 老街","低","18 分","推荐轻运动路线"],["TS2PRO","快走 / 慢跑","滨水 / 夜景","中低","22 分","推荐 20 分钟夜景路线"],["TS3","跑步","城市街道 / 滨水","中","26 分","推荐节奏跑路线"],["TS3PRO","间歇 / 坡度","HIIT / 山地城市","高","32 分","推荐 HIIT 与坡度路线"]]} /></section></>;
}

export function DeepDiveSections({ moduleKey }: { moduleKey: ModuleKey }) {
  const content = { sales:<SalesDeepDive />, devices:<DevicesDeepDive />, users:<UserDeepDive />, content:<ContentDeepDive />, explore:<ExploreDeepDive />, commercial:<CommercialDeepDive />, insights:<InsightsDeepDive /> }[moduleKey];
  return <section className="deep-dive" aria-label="需求补充的深度分析">{content}</section>;
}
