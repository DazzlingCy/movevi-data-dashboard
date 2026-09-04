export type DataStatus = "ready" | "delayed" | "empty" | "definition_pending" | "source_unavailable";

export type ReportFilters = {
  from: string;
  to: string;
  channel: string;
  product: string;
  region: string;
};

export type Metric = {
  id: string;
  label: string;
  value: string;
  raw: number;
  change: string;
  changeTone: "positive" | "negative" | "neutral";
  note: string;
  definition: string;
  unit?: string;
};

export type FunnelStage = {
  id: string;
  name: string;
  value: number;
  rate: number;
  definition: string;
};

export type ChannelPerformance = {
  channel: string;
  group: string;
  sales: number;
  salesVolume: number;
  unitPrice: number;
  refundRate: number;
  status: "健康" | "关注" | "异常";
};

export type TimeSeriesPoint = { date: string; value: number; secondary?: number };

export type Insight = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  conclusion: string;
  evidence: string[];
  suggestion: string;
  targetPage: string;
  targetLabel: string;
};

export type DataResult<T> = {
  asOf: string;
  status: DataStatus;
  definition: string;
  source: string;
  data: T;
};

export type ExecutiveData = {
  metrics: Metric[];
  funnel: FunnelStage[];
  channels: ChannelPerformance[];
  insights: Insight[];
};

export type ModuleData = {
  title: string;
  description: string;
  metrics: Metric[];
  trend: TimeSeriesPoint[];
  chartTitle: string;
  chartUnit: string;
  distribution: { name: string; value: number; color?: string }[];
  distributionTitle: string;
  columns: string[];
  rows: (string | number)[][];
  sectionTitle: string;
  notes: { title: string; text: string; tone: "teal" | "blue" | "orange" | "red" }[];
};

export type LightStarReport = {
  id: string;
  label: string;
  isAggregate?: boolean;
  name: string;
  period: string;
  asOf: string;
  poolUsage: number;
  metrics: Metric[];
  flow: { label: string; value: number }[];
  unusedChances: number;
  trend: { date: string; exchange: number; draw: number }[];
  frequency: { name: string; users: number }[];
  medalRows: (string | number)[][];
  crossPeriod: { label: string; value: string; note: string }[];
};

export type CheckinReport = {
  name: string;
  period: string;
  asOf: string;
  metrics: Metric[];
  trend: { date: string; cumulative: number; participants: number; completed: number; rewarded: number }[];
  newUserTrend: { date: string; users: number; participants: number; completed: number }[];
  funnel: { name: string; value: number; rate: number }[];
  dailyRows: (string | number)[][];
  routeRows: (string | number)[][];
  rewardRows: (string | number)[][];
};

export type ActivityCenterData = {
  lightStarPeriods: LightStarReport[];
  checkin: CheckinReport;
};

export interface DataProvider {
  getExecutiveDashboard(filters: ReportFilters): Promise<DataResult<ExecutiveData>>;
  getSalesCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getDeviceCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getUserCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getContentCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getExploreCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getActivityCenter(filters: ReportFilters): Promise<DataResult<ActivityCenterData>>;
  getCommercialCenter(filters: ReportFilters): Promise<DataResult<ModuleData>>;
  getAiInsights(filters: ReportFilters): Promise<DataResult<ModuleData>>;
}

export const defaultFilters: ReportFilters = {
  from: "2026-08-01",
  to: "2026-09-02",
  channel: "全部渠道",
  product: "全部型号",
  region: "全国",
};

const baseFunnel: FunnelStage[] = [
  ["sales-volume", "销量", 4328, 100, "完成支付且未即时关闭的有效设备订单"],
  ["register", "注册", 3689, 85.2, "购买设备后完成 MOVEVI 账号注册"],
  ["activate", "设备激活", 3056, 82.8, "成功绑定 MOVEVI APP 即视为设备激活"],
  ["first-run", "首次运动", 1248, 40.8, "设备激活后 7 日内产生首个有效运动记录"],
  ["first-route", "完成首条路线", 895, 71.7, "完成首条路线且有效里程不少于 1 公里"],
  ["second-route", "解锁第二条路线", 492, 55.0, "完成首条路线后启动不同路线"],
  ["continuous-route", "连续完成路线", 328, 66.7, "近 30 日连续完成至少 3 条路线"],
  ["unlock-city", "解锁城市", 250, 76.2, "完成城市要求的核心路线并点亮城市"],
  ["explore-cities", "探索更多城市", 172, 68.8, "解锁首个城市后开始第二个城市"],
  ["subscription", "订阅", 61, 35.5, "产生有效订阅或续费订单"],
  ["long-retention", "长期留存", 44, 72.1, "首次运动后第 90 日仍有有效运动"],
].map(([id, name, value, rate, definition]) => ({
  id: String(id), name: String(name), value: Number(value), rate: Number(rate), definition: String(definition),
}));

const executive: ExecutiveData = {
  metrics: [
    { id: "sales", label: "本月销售额", value: "¥1,286,400", raw: 1286400, change: "+8.6%", changeTone: "positive", note: "本月累计成交金额", definition: "本月支付成功且未全额退款订单的实付金额之和。" },
    { id: "sales-volume", label: "本月销售量", value: "4,328 台", raw: 4328, change: "+11.2%", changeTone: "positive", note: "较上月 · 支付成功订单", definition: "本月支付成功且未即时关闭订单中的设备数量。" },
    { id: "activation", label: "设备激活率", value: "82.8%", raw: 82.8, change: "-3.4pp", changeTone: "negative", note: "签收后 7 日内激活", definition: "签收后 7 日内成功绑定 MOVEVI App 的去重设备数 ÷ 已签收设备数。" },
    { id: "retention", label: "D7 留存率", value: "22.3%", raw: 22.3, change: "-1.1pp", changeTone: "negative", note: "首次运动用户口径", definition: "首次产生有效运动后的第 7 日仍有有效运动记录的用户数 ÷ 首次运动用户数。" },
    { id: "active-users", label: "本月运动用户", value: "8,326 人", raw: 8326, change: "+4.6%", changeTone: "positive", note: "本月至少完成 1 次运动", definition: "本月至少产生 1 次有效运动记录的去重 MOVEVI App 用户数。" },
  ],
  funnel: baseFunnel,
  channels: [
    { channel: "抖音", group: "内容电商", sales: 496300, salesVolume: 1601, unitPrice: 310, refundRate: 8.2, status: "关注" },
    { channel: "天猫", group: "货架电商", sales: 364800, salesVolume: 1255, unitPrice: 291, refundRate: 4.1, status: "健康" },
    { channel: "京东", group: "货架电商", sales: 283600, salesVolume: 952, unitPrice: 298, refundRate: 3.8, status: "健康" },
    { channel: "拼多多", group: "货架电商", sales: 141700, salesVolume: 520, unitPrice: 273, refundRate: 9.6, status: "异常" },
  ],
  insights: [
    { id: "i1", severity: "high", title: "销量增长没有转化为使用增长", conclusion: "本月成交增长 8.6%，但首次运动转化下降 6.2pp。", evidence: ["设备激活 → 首次运动仅 40.8%", "抖音新客首跑率低于均值 7.0pp"], suggestion: "优先修复首次连接与首跑引导，并对抖音渠道做差异化 onboarding。", targetPage: "/devices", targetLabel: "查看激活漏斗" },
    { id: "i2", severity: "medium", title: "第二条路线是留存分水岭", conclusion: "完成第二条路线的用户 D7 留存高出 18.7pp。", evidence: ["首条 → 第二条仅 55.0%", "第二条路线完成者 D7 为 38.6%"], suggestion: "在首条完成页推荐同城低门槛路线，并给予限时勋章。", targetPage: "/explore", targetLabel: "查看探索转化" },
  ],
};

const trend = (values: number[]): TimeSeriesPoint[] => values.map((value, i) => ({ date: `${8 + i * 3}日`, value, secondary: Math.round(value * (0.91 + (i % 3) * 0.02)) }));
const metricDefinitions: Record<string, string> = {
  "销售额": "筛选周期内支付成功且未全额退款订单的实付金额之和。",
  "销量": "筛选周期内支付成功且未即时关闭订单中的设备数量。",
  "客单价": "销售额 ÷ 支付成功订单数。",
  "退货率": "完成退货退款的订单数 ÷ 支付成功订单数。",
  "已激活设备": "已成功绑定 MOVEVI App 的去重设备数，设备激活与 App 绑定为同一状态。",
  "7日激活率": "签收后 7 日内成功绑定 MOVEVI App 的设备数 ÷ 已签收设备数。",
  "30日使用率": "近 30 日至少产生 1 次有效运动记录的设备数 ÷ 累计激活设备数。",
  "故障设备率": "统计周期内有有效故障记录的设备数 ÷ 有连接记录的设备数。",
  "DAU": "自然日内至少产生 1 次有效运动或路线行为的去重 MOVEVI App 用户数。",
  "WAU": "连续 7 日内至少产生 1 次有效运动或路线行为的去重 MOVEVI App 用户数。",
  "MAU": "连续 30 日内至少产生 1 次有效运动或路线行为的去重 MOVEVI App 用户数。",
  "D30 留存": "首次运动后的第 30 日仍有有效运动记录的用户数 ÷ 首次运动用户数。",
  "完成路线用户": "统计周期内在 MOVEVI App 至少完成 1 条有效路线的去重用户数。",
  "月运动里程": "本月全部有效运动记录的里程合计，单次需不少于 1 公里且不少于 8 分钟。",
  "月运动时长": "本月全部有效运动记录的运动时长合计，剔除异常中断与无设备数据。",
  "已上线城市": "MOVEVI App 内至少有 1 条已发布且可开始路线的城市数。",
  "有效路线": "已通过内容审核且近 90 日至少被启动 1 次的 MOVEVI App 路线数。",
  "城市景点数": "已配置在上线路线中并可在 MOVEVI App 展示的去重景点数。",
  "路线完成率": "完成路线的去重启动次数 ÷ 有效开始路线次数。",
  "30日复跑率": "完成路线后 30 日内再次完成同一路线的用户数 ÷ 路线完成人数。",
  "第二条路线启动率": "完成首条路线后 14 日内启动不同路线的用户数 ÷ 首条路线完成人数。",
  "城市解锁用户": "在 MOVEVI App 内达到城市解锁条件的去重用户数。",
  "人均探索深度": "月活跃用户完成的不同有效路线数 ÷ 月活跃用户数。",
  "勋章获得率": "统计周期内至少获得 1 枚探索勋章的用户数 ÷ 探索活跃用户数。",
  "点亮城市用户": "在 MOVEVI App 完成该城市规定路线并点亮至少 1 座城市的去重用户数。",
  "解锁路线用户": "统计周期内在 MOVEVI App 解锁至少 1 条城市路线的去重用户数。",
  "人均解锁路线": "探索活跃用户累计解锁的不同路线数 ÷ 探索活跃用户数。",
  "活动参与用户": "统计周期内至少报名或参与 1 项活动的去重 MOVEVI App 用户数。",
  "活动完成率": "达到对应活动完成条件的用户数 ÷ 活动报名用户数。",
  "活动拉新用户": "通过活动页面首次注册 MOVEVI App 的去重用户数。",
  "活动后D7留存": "完成或参与活动后第 7 日仍有有效运动记录的用户数 ÷ 活动参与用户数。",
  "识别参与用户": "所选活动期内发生报名、勋章兑换或抽奖任一行为的去重用户数。",
  "兑换勋章": "所选活动期内兑换为抽奖机会的勋章枚数；同一用户可兑换多枚。",
  "生成抽奖机会": "勋章兑换后生成的抽奖机会数；当前活动每枚勋章兑换 1 次机会。",
  "实际抽奖": "所选活动期内已产生奖励日志的抽奖次数。",
  "机会使用率": "实际抽奖次数 ÷ 生成抽奖机会数。",
  "人均抽奖": "实际抽奖次数 ÷ 发生抽奖的去重用户数。",
  "现金奖励": "所选活动期内现金奖励日志金额之和，实物奖品不折算。",
  "奖池剩余": "配置奖池次数减去已履约抽奖次数；用户全局机会余额不计入。",
  "区间活跃人数": "活动最早日至统计截止日有有效 App 行为的去重用户数。",
  "参与用户": "活动内至少产生一条有效打卡任务记录的去重用户数。",
  "活跃参与率": "参与用户数 ÷ 区间活跃人数。",
  "应打卡任务": "截至统计日，已到达任务日的用户应完成任务总数。",
  "已完成任务": "已完成注册日期所对应当日打卡任务的记录数。",
  "任务完成率": "已完成任务数 ÷ 应打卡任务数。",
  "全程完成人数": "已到达第 30 天且 D1–D30 应完成任务全部完成的去重用户数。",
  "已领取金额": "状态为已领取的红包奖励金额之和。",
  "订阅转化率": "产生首笔有效订阅订单的用户数 ÷ 可订阅的设备激活用户数。",
  "到期续费率": "在订阅到期后 7 日内完成续费的用户数 ÷ 本期到期订阅用户数。",
  "ARPU": "统计周期订阅收入 ÷ 月活跃用户数。",
  "预测 LTV": "基于演示留存与付费规则估算的用户生命周期收入，并非真实财务结果。",
  "高优机会": "同时满足高影响与高紧迫度阈值、待业务决策的机会数量。",
  "中优机会": "满足中等影响或需进一步验证条件的机会数量。",
  "本月闭环": "本月已完成验证且记录结论的机会数量。",
  "预计增量": "按演示规则估算机会完成后可能带来的月度收入增量。",
};
const metric = (id: string, label: string, value: string, raw: number, change: string, note: string, tone: Metric["changeTone"] = "positive"): Metric => ({
  id, label, value, raw, change, note, changeTone: tone,
  definition: metricDefinitions[label] ?? "当前筛选周期内按统一模拟事实数据集去重汇总，环比对比上一相同长度周期。",
});

function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const modules: Record<string, ModuleData> = {
  sales: {
    title: "销售中心", description: "从渠道曝光到退款，判断增长的规模、质量与可持续性。",
    metrics: [metric("revenue", "销售额", "¥1,286,400", 1286400, "+8.6%", "本月累计成交金额"), metric("orders", "销量", "4,328 台", 4328, "+11.2%", "支付成功订单"), metric("aov", "客单价", "¥297", 297, "-2.3%", "受抖音组合装影响", "negative"), metric("refund", "退货率", "5.1%", 5.1, "+0.8pp", "高于 4.5% 预警线", "negative")],
    trend: trend([27, 31, 29, 38, 36, 42, 47, 44, 51]), chartTitle: "销售额与有效订单趋势", chartUnit: "万元",
    distribution: [{ name: "TS2", value: 24 }, { name: "TS2PRO", value: 28 }, { name: "TS3", value: 20 }, { name: "TS3PRO", value: 28 }], distributionTitle: "产品销售结构",
    columns: ["渠道", "曝光", "咨询率", "支付转化", "退货率", "销售额"], rows: [["抖音", "46.8万", "14.2%", "3.6%", "7.4%", "¥496,300"], ["天猫", "25.4万", "12.8%", "5.3%", "3.1%", "¥364,800"], ["京东", "18.7万", "10.9%", "5.7%", "3.8%", "¥283,600"], ["拼多多", "12.9万", "11.6%", "4.2%", "6.3%", "¥141,700"]], sectionTitle: "渠道质量明细",
    notes: [{ title: "华东贡献增长主力", text: "上海、杭州、苏州贡献新增销售额的 41%。", tone: "teal" }, { title: "抖音退货需关注", text: "退货率 7.4%，主要集中在未激活用户。", tone: "red" }],
  },
  devices: {
    title: "设备中心", description: "看清每一台设备从签收到激活、连接、使用和故障的完整状态。",
    metrics: [metric("activated", "已激活设备", "30,563 台", 30563, "+6.2%", "累计激活"), metric("rate", "7日激活率", "82.8%", 82.8, "-3.4pp", "签收设备口径", "negative"), metric("usage", "30日使用率", "63.6%", 63.6, "+2.1pp", "近 30 日有连接"), metric("fault", "故障设备率", "1.8%", 1.8, "-0.4pp", "较上月下降 0.4pp")],
    trend: trend([71, 74, 76, 80, 79, 83, 82, 86, 88]), chartTitle: "设备激活与连接趋势", chartUnit: "%",
    distribution: [{ name: "活跃", value: 64 }, { name: "低频", value: 21 }, { name: "沉默", value: 13 }, { name: "故障", value: 2 }], distributionTitle: "设备状态分布",
    columns: ["设备唯一 ID", "型号", "出厂时间", "销售时间", "绑定用户", "激活时间", "首次连接", "最近连接", "30日连接", "累计运动", "累计时长", "累计里程", "故障记录", "固件版本", "APP版本", "状态"],
    rows: ([
      ["MV26-884201", "TS3PRO", "v3.8.2", "2026-04-18", "今天 09:42", "48 次", "126 次", "186h", "1,284 km", 0, "MVU-2458", "活跃"],
      ["MV26-773198", "TS3", "v3.8.1", "2026-05-02", "昨天 21:06", "39 次", "84 次", "73h", "526 km", 0, "MVU-9183", "活跃"],
      ["MV26-550027", "TS2PRO", "v3.7.9", "2026-02-21", "14 天前", "6 次", "18 次", "12h", "86 km", 1, "MVU-5067", "低频"],
      ["MV26-442911", "TS2", "v3.8.2", "2025-12-08", "32 天前", "0 次", "7 次", "4h", "31 km", 0, "MVU-1294", "沉默"],
      ["MV26-930614", "TS3PRO", "v3.8.2", "2026-07-11", "今天 08:17", "52 次", "96 次", "142h", "1,018 km", 0, "MVU-6371", "活跃"],
      ["MV26-821507", "TS3", "v3.8.2", "2026-06-26", "今天 07:35", "44 次", "71 次", "98h", "692 km", 0, "MVU-4702", "活跃"],
      ["MV26-718392", "TS2PRO", "v3.8.0", "2026-03-15", "3 天前", "21 次", "55 次", "61h", "408 km", 0, "MVU-3526", "活跃"],
      ["MV26-607284", "TS2", "v3.7.9", "2026-01-19", "9 天前", "9 次", "26 次", "23h", "146 km", 1, "MVU-8041", "低频"],
      ["MV26-596173", "TS3PRO", "v3.8.2", "2026-08-03", "今天 10:03", "57 次", "88 次", "117h", "834 km", 0, "MVU-2938", "活跃"],
      ["MV26-485062", "TS3", "v3.8.1", "2026-07-29", "昨天 18:48", "32 次", "49 次", "66h", "472 km", 0, "MVU-7154", "活跃"],
      ["MV26-374951", "TS2PRO", "v3.8.0", "2026-04-06", "5 天前", "14 次", "42 次", "38h", "258 km", 0, "MVU-6280", "低频"],
      ["MV26-263840", "TS2", "v3.7.8", "2025-11-24", "27 天前", "1 次", "12 次", "7h", "48 km", 2, "MVU-1437", "故障"],
      ["MV26-152739", "TS3PRO", "v3.8.2", "2026-08-18", "今天 06:52", "49 次", "63 次", "82h", "596 km", 0, "MVU-9672", "活跃"],
      ["MV26-041628", "TS3", "v3.8.2", "2026-06-09", "2 天前", "26 次", "58 次", "74h", "511 km", 0, "MVU-3815", "活跃"],
      ["MV25-938517", "TS2PRO", "v3.7.9", "2025-10-17", "16 天前", "4 次", "21 次", "15h", "97 km", 1, "MVU-5264", "低频"],
      ["MV25-827406", "TS2", "v3.8.1", "2026-02-08", "35 天前", "0 次", "9 次", "6h", "39 km", 0, "MVU-6709", "沉默"],
      ["MV25-716395", "TS3PRO", "v3.8.2", "2026-05-23", "今天 11:26", "61 次", "132 次", "204h", "1,462 km", 0, "MVU-4581", "活跃"],
      ["MV25-605284", "TS3", "v3.8.0", "2026-03-30", "4 天前", "18 次", "47 次", "53h", "367 km", 0, "MVU-8926", "活跃"],
      ["MV25-594173", "TS2PRO", "v3.7.8", "2025-09-14", "22 天前", "2 次", "15 次", "9h", "62 km", 2, "MVU-2148", "故障"],
      ["MV25-483062", "TS2", "v3.8.1", "2026-01-05", "12 天前", "7 次", "24 次", "19h", "128 km", 0, "MVU-7395", "低频"],
      ["MV25-372951", "TS3PRO", "v3.8.2", "2026-08-21", "今天 09:18", "46 次", "54 次", "69h", "503 km", 0, "MVU-8462", "活跃"],
      ["MV25-261840", "TS3", "v3.8.1", "2026-07-07", "昨天 20:14", "35 次", "67 次", "91h", "648 km", 0, "MVU-1753", "活跃"],
      ["MV25-150739", "TS2PRO", "v3.8.0", "2026-04-27", "7 天前", "11 次", "36 次", "31h", "219 km", 0, "MVU-6048", "低频"],
      ["MV25-049628", "TS2", "v3.7.9", "2025-08-12", "41 天前", "0 次", "5 次", "3h", "18 km", 1, "MVU-9327", "沉默"],
    ] as (string | number)[][]).map((row, index) => {
      const [sn, model, firmware, activatedAt, latestConnection, connections30d, totalWorkouts, totalDuration, totalDistance, faultCount, user, status] = row;
      return [sn, model, shiftIsoDate(String(activatedAt), -32), shiftIsoDate(String(activatedAt), -8), user, activatedAt, `${activatedAt} 当日`, latestConnection, connections30d, totalWorkouts, totalDuration, totalDistance, Number(faultCount) > 0 ? `故障×${faultCount}` : "无", firmware, index % 3 === 0 ? "v5.6.0" : index % 3 === 1 ? "v5.5.2" : "v5.6.1", status];
    }),
    sectionTitle: "一机一档完整字段表",
    notes: [{ title: "主要断点：激活后首跑", text: "16,263 台设备完成激活后 7 日内未产生首次运动。", tone: "red" }, { title: "固件升级建议", text: "v3.7.x 连接失败率是最新版本的 2.4 倍。", tone: "orange" }],
  },
  users: {
    title: "用户中心", description: "围绕 MOVEVI App 的完成城市、完成路线、运动里程和运动时长理解用户。",
    metrics: [metric("dau", "DAU", "7,842", 7842, "+5.7%", "日有效运动用户"), metric("route-users", "完成路线用户", "18,426", 18426, "+7.3%", "本月至少完成 1 条路线"), metric("distance", "月运动里程", "286,400 km", 286400, "+8.9%", "有效运动里程合计"), metric("duration", "月运动时长", "61,820 h", 61820, "+6.8%", "有效运动时长合计")],
    trend: trend([18, 20, 22, 21, 24, 23, 26, 27, 29]), chartTitle: "活跃用户与留存趋势", chartUnit: "千人",
    distribution: [{ name: "晨跑 05–09", value: 34 }, { name: "日间 09–18", value: 18 }, { name: "晚间 18–22", value: 41 }, { name: "深夜 22–05", value: 7 }], distributionTitle: "运动时段分布",
    columns: ["频次分层", "用户数", "月均次数", "单次时长", "D30", "生命周期"], rows: [["高频跑者", "6,214", "14.2", "46 分钟", "42.6%", "习惯期"], ["稳定跑者", "11,870", "7.4", "38 分钟", "27.1%", "成长期"], ["低频跑者", "13,902", "2.6", "25 分钟", "9.8%", "尝试期"], ["沉默用户", "6,924", "0.4", "12 分钟", "1.6%", "流失期"]], sectionTitle: "用户频次与生命周期",
    notes: [{ title: "晚间是黄金时段", text: "18–22 点贡献 41% 的有效运动，完赛率也最高。", tone: "blue" }, { title: "D7–D14 下滑最快", text: "应在第 8 天前触发第二条路线和同城推荐。", tone: "orange" }],
  },
  content: {
    title: "内容中心", description: "按大洲、城市、路线与景点管理 MOVEVI App 城市内容资产和完成进度。",
    metrics: [metric("cities", "已上线城市", "86", 86, "+8", "覆盖 7 个大洲分区"), metric("routes", "有效路线", "1,248", 1248, "+6.4%", "本月新增 76 条"), metric("spots", "城市景点数", "6,842", 6842, "+5.8%", "路线内可识别景点"), metric("completion", "路线完成率", "71.8%", 71.8, "+2.6pp", "有效开始路线")],
    trend: trend([61, 64, 63, 68, 70, 69, 73, 75, 78]), chartTitle: "路线完成与收藏趋势", chartUnit: "%",
    distribution: [{ name: "城市探索", value: 35 }, { name: "文化地标", value: 27 }, { name: "滨水绿道", value: 23 }, { name: "夜跑友好", value: 15 }], distributionTitle: "内容标签结构",
    columns: ["城市 / 路线", "启动人数", "完成率", "复跑率", "收藏分享", "综合热度"], rows: [["上海 · 外滩夜航", "3,842", "82.4%", "34.8%", "1,286", "96"], ["杭州 · 西湖十景", "3,197", "79.1%", "31.6%", "1,044", "93"], ["成都 · 锦城绿道", "2,786", "74.8%", "28.3%", "886", "88"], ["北京 · 中轴线", "2,512", "68.5%", "21.9%", "742", "82"]], sectionTitle: "城市与路线综合热度",
    notes: [{ title: "3–4 公里处退出集中", text: "路线退出曲线在补给提示前出现明显抬升。", tone: "orange" }, { title: "滨水路线复跑更高", text: "同等难度下，滨水标签复跑率高 8.3pp。", tone: "teal" }],
  },
  explore: {
    title: "探索中心", description: "围绕点亮地球计划，衡量城市点亮、路线解锁、探索深度与勋章成长。",
    metrics: [metric("lit-city", "点亮城市用户", "12,486", 12486, "+9.2%", "至少点亮 1 座城市"), metric("unlocked-route", "解锁路线用户", "18,920", 18920, "+8.4%", "至少解锁 1 条路线"), metric("depth", "人均解锁路线", "3.7 条", 3.7, "+0.4", "探索活跃用户口径"), metric("badge", "勋章获得率", "42.6%", 42.6, "+2.1pp", "探索活跃用户口径")],
    trend: trend([32, 35, 38, 37, 42, 46, 49, 53, 55]), chartTitle: "第二条路线与探索深度", chartUnit: "%",
    distribution: [{ name: "L1 初识", value: 31 }, { name: "L2 漫游", value: 28 }, { name: "L3 探索", value: 22 }, { name: "L4 远行", value: 13 }, { name: "L5 世界跑者", value: 6 }], distributionTitle: "五级用户等级",
    columns: ["等级", "用户数", "完成路线", "城市数", "勋章率", "活动参与"], rows: [["L5 世界跑者", "2,336", "28.6", "7.8", "92%", "64%"], ["L4 远行", "5,058", "14.2", "4.6", "78%", "41%"], ["L3 探索", "8,560", "7.8", "2.9", "56%", "24%"], ["L2 漫游", "10,895", "3.6", "1.7", "31%", "13%"], ["L1 初识", "12,061", "1.2", "1.0", "12%", "5%"]], sectionTitle: "探索等级与参与",
    notes: [{ title: "第二条路线决定探索意愿", text: "完成第二条路线后，人均探索深度提升至 6.4 条。", tone: "teal" }, { title: "勋章触发偏晚", text: "42% 用户在获得首枚勋章前已停止探索。", tone: "orange" }],
  },
  commercial: {
    title: "商业中心", description: "连接订阅、续费和运动行为，识别可持续的用户价值。",
    metrics: [metric("sub", "订阅转化率", "4.5%", 4.5, "+0.7pp", "设备激活用户"), metric("renew", "到期续费率", "68.2%", 68.2, "+2.4pp", "本月到期用户"), metric("arpu", "ARPU", "¥38.6", 38.6, "+5.1%", "月活跃用户"), metric("ltv", "预测 LTV", "¥486", 486, "+7.8%", "模拟经营场景")],
    trend: trend([16, 18, 20, 22, 21, 24, 27, 29, 31]), chartTitle: "订阅收入与续费趋势", chartUnit: "万元",
    distribution: [{ name: "价格因素", value: 34 }, { name: "使用频次低", value: 29 }, { name: "内容不匹配", value: 21 }, { name: "其他", value: 16 }], distributionTitle: "退订原因（模拟）",
    columns: ["完成路线数", "用户数", "付费转化", "续费率", "ARPU", "预测 LTV"], rows: [["0–1 条", "11,624", "1.2%", "36.4%", "¥12.8", "¥86"], ["2–3 条", "9,846", "3.9%", "57.8%", "¥27.4", "¥268"], ["4–8 条", "8,182", "8.6%", "74.1%", "¥48.2", "¥558"], ["9 条以上", "4,896", "16.8%", "86.3%", "¥73.6", "¥1,126"]], sectionTitle: "完成路线数与付费关系",
    notes: [{ title: "路线深度驱动付费", text: "完成 4 条以上路线的用户付费转化为整体 2.6 倍。", tone: "teal" }, { title: "退订前运动已衰减", text: "退订用户在到期前 21 天运动频次下降 43%。", tone: "orange" }],
  },
  insights: {
    title: "AI 洞察", description: "将经营信号整理为可验证、可跟进的机会清单；结论由演示规则生成。",
    metrics: [metric("high", "高优机会", "3 项", 3, "+1", "需本周决策", "negative"), metric("medium", "中优机会", "6 项", 6, "+2", "进入验证队列", "neutral"), metric("closed", "本月闭环", "8 项", 8, "+33%", "有明确结果"), metric("impact", "预计增量", "¥186,000", 186000, "+12.4%", "模拟经营场景")],
    trend: trend([8, 11, 9, 14, 13, 17, 16, 20, 22]), chartTitle: "机会发现与闭环趋势", chartUnit: "项",
    distribution: [{ name: "转化", value: 38 }, { name: "留存", value: 31 }, { name: "内容", value: 19 }, { name: "设备", value: 12 }], distributionTitle: "机会类型",
    columns: ["优先级", "结论", "核心证据", "建议动作", "目标页面", "状态"], rows: [["高", "销量未转化为使用增长", "首跑转化 -6.2pp", "重做首跑引导", "设备中心", "待决策"], ["高", "抖音退货与低激活相关", "未激活退货占 61%", "售后前置激活辅导", "销售中心", "验证中"], ["中", "第二条路线拉动留存", "D7 +18.7pp", "推荐低门槛同城路线", "探索中心", "已排期"], ["中", "滨水路线价值更高", "复跑 +8.3pp", "扩充滨水内容", "内容中心", "观察中"]], sectionTitle: "结论—证据—建议—目标页面",
    notes: [{ title: "规则引擎说明", text: "本页为演示数据，通过阈值与交叉指标规则生成，不调用外部 AI 服务。", tone: "blue" }, { title: "建议验证方式", text: "所有建议需经业务 owner 确认口径并进入实验或排期。", tone: "orange" }],
  },
};

const activityCenter: ActivityCenterData = {
  lightStarPeriods: [
    {
      id: "all", label: "全部期次", isAggregate: true, name: "轻盈之星整体数据",
      period: "2026-06-15 20:00 至 2026-10-02 20:00", asOf: "2026-09-03 16:59", poolUsage: 94.6,
      metrics: [
        metric("star-participants-all", "识别参与用户", "508 人", 508, "+12.9%", "三期报名、兑换或抽奖用户跨期去重"),
        metric("star-exchange-all", "兑换勋章", "4,070 枚", 4070, "+18.4%", "389 名去重用户完成兑换"),
        metric("star-chances-all", "生成抽奖机会", "4,070 次", 4070, "+18.4%", "每枚勋章兑换 1 次机会"),
        metric("star-draws-all", "实际抽奖", "3,026 次", 3026, "+16.8%", "356 名去重用户产生奖励日志"),
        metric("star-use-all", "机会使用率", "74.3%", 74.3, "+1.7pp", "实际抽奖 ÷ 生成机会"),
        metric("star-average-all", "人均抽奖", "8.50 次", 8.5, "+0.42", "按跨期去重抽奖用户计算"),
        metric("star-cash-all", "现金奖励", "¥1,512.40", 1512.4, "+¥186.20", "三期现金奖励日志汇总"),
        metric("star-pool-all", "奖池剩余", "174 次", 174, "-126 次", "各期剩余奖池合计", "negative"),
      ],
      flow: [{ label: "识别参与", value: 508 }, { label: "兑换勋章", value: 389 }, { label: "实际抽奖", value: 356 }],
      unusedChances: 1044,
      trend: [{ date: "第207期", exchange: 2286, draw: 1874 }, { date: "第208期", exchange: 1286, draw: 952 }, { date: "第209期", exchange: 498, draw: 200 }],
      frequency: [{ name: "1次", users: 38 }, { name: "2次", users: 29 }, { name: "3次", users: 46 }, { name: "4次以上", users: 243 }],
      medalRows: [[1, "长安街绝代风华·上篇", "王府井", 286, 214, 286], [2, "巴黎浪漫漫步", "埃菲尔铁塔", 248, 196, 248], [3, "东京夜景轻跑", "东京塔", 226, 184, 226], [4, "杭州西湖十景", "断桥残雪", 198, 172, 198], [5, "艺术园区彩霓虹", "751D·Park", 176, 148, 176], [6, "牛街护国食味飘香", "牛街礼拜寺", 162, 135, 162]],
      crossPeriod: [{ label: "纳入活动期", value: "3 期", note: "第207–209期" }, { label: "重复参与用户", value: "29 人", note: "跨期参与占比 5.7%" }, { label: "现金中奖人数", value: "356 人", note: "跨期用户去重" }, { label: "现金中奖金额", value: "¥1,512.40", note: "实物奖品不折算" }],
    },
    {
      id: "209", label: "第209期 · 进行中", name: "跑遍全世界（209）",
      period: "2026-09-02 20:00 至 2026-10-02 20:00", asOf: "2026-09-03 16:59", poolUsage: 100,
      metrics: [metric("star-participants-209", "识别参与用户", "29 人", 29, "+4 人", "报名、兑换或抽奖用户去重"), metric("star-exchange-209", "兑换勋章", "498 枚", 498, "+86 枚", "24 名用户完成兑换"), metric("star-chances-209", "生成抽奖机会", "498 次", 498, "+86 次", "每枚勋章兑换 1 次"), metric("star-draws-209", "实际抽奖", "200 次", 200, "+32 次", "22 名用户产生奖励日志"), metric("star-use-209", "机会使用率", "40.2%", 40.2, "+2.6pp", "抽奖次数 ÷ 生成机会"), metric("star-average-209", "人均抽奖", "9.09 次", 9.09, "+0.72", "按抽奖用户计算"), metric("star-cash-209", "现金奖励", "¥99.90", 99.9, "+¥18.40", "现金奖励日志汇总"), metric("star-pool-209", "奖池剩余", "0 次", 0, "已耗尽", "配置奖池 200 次", "negative")],
      flow: [{ label: "识别参与", value: 29 }, { label: "兑换勋章", value: 24 }, { label: "实际抽奖", value: 22 }], unusedChances: 298,
      trend: [{ date: "09-02", exchange: 386, draw: 154 }, { date: "09-03", exchange: 112, draw: 46 }],
      frequency: [{ name: "1次", users: 2 }, { name: "2次", users: 1 }, { name: "3次", users: 3 }, { name: "4次以上", users: 16 }],
      medalRows: [[1, "长安街绝代风华·上篇", "王府井", 4, 4, 4], [2, "长安街绝代风华·上篇", "东单", 4, 4, 4], [3, "长安街绝代风华·上篇", "建国门", 4, 4, 4], [4, "艺术园区彩霓虹", "751D·Park", 3, 3, 3], [5, "长安街绝代风华·下篇", "天安门", 3, 3, 3], [6, "牛街护国食味飘香", "牛街礼拜寺", 3, 3, 3]],
      crossPeriod: [{ label: "所选活动期", value: "1 期", note: "第209期" }, { label: "重复参与用户", value: "0 人", note: "当前单期无需去重" }, { label: "现金中奖人数", value: "22 人", note: "仅统计现金奖励" }, { label: "现金中奖金额", value: "¥99.90", note: "实物奖品不折算" }],
    },
    {
      id: "208", label: "第208期 · 已结束", name: "盛夏城市探索（208）",
      period: "2026-08-01 20:00 至 2026-09-01 20:00", asOf: "2026-09-01 23:59", poolUsage: 95.2,
      metrics: [metric("star-participants-208", "识别参与用户", "186 人", 186, "+9.4%", "本期报名、兑换或抽奖用户去重"), metric("star-exchange-208", "兑换勋章", "1,286 枚", 1286, "+14.8%", "155 名用户完成兑换"), metric("star-chances-208", "生成抽奖机会", "1,286 次", 1286, "+14.8%", "每枚勋章兑换 1 次"), metric("star-draws-208", "实际抽奖", "952 次", 952, "+11.6%", "148 名用户产生奖励日志"), metric("star-use-208", "机会使用率", "74.0%", 74, "+1.2pp", "抽奖次数 ÷ 生成机会"), metric("star-average-208", "人均抽奖", "6.43 次", 6.43, "+0.36", "按抽奖用户计算"), metric("star-cash-208", "现金奖励", "¥476.00", 476, "+¥52.80", "现金奖励日志汇总"), metric("star-pool-208", "奖池剩余", "48 次", 48, "-18 次", "配置奖池 1,000 次", "negative")],
      flow: [{ label: "识别参与", value: 186 }, { label: "兑换勋章", value: 155 }, { label: "实际抽奖", value: 148 }], unusedChances: 334,
      trend: [{ date: "08-01", exchange: 168, draw: 96 }, { date: "08-08", exchange: 246, draw: 174 }, { date: "08-15", exchange: 312, draw: 238 }, { date: "08-22", exchange: 338, draw: 276 }, { date: "09-01", exchange: 222, draw: 168 }],
      frequency: [{ name: "1次", users: 18 }, { name: "2次", users: 12 }, { name: "3次", users: 21 }, { name: "4次以上", users: 97 }],
      medalRows: [[1, "巴黎浪漫漫步", "埃菲尔铁塔", 86, 68, 86], [2, "东京夜景轻跑", "东京塔", 74, 61, 74], [3, "杭州西湖十景", "断桥残雪", 68, 56, 68], [4, "上海外滩夜航", "外白渡桥", 61, 52, 61], [5, "成都锦城绿道", "东门市井", 58, 49, 58], [6, "长安街绝代风华", "天安门", 52, 46, 52]],
      crossPeriod: [{ label: "所选活动期", value: "1 期", note: "第208期" }, { label: "参与用户", value: "186 人", note: "本期用户去重" }, { label: "现金中奖人数", value: "148 人", note: "仅统计现金奖励" }, { label: "现金中奖金额", value: "¥476.00", note: "实物奖品不折算" }],
    },
    {
      id: "207", label: "第207期 · 已结束", name: "初夏漫游计划（207）",
      period: "2026-06-15 20:00 至 2026-07-15 20:00", asOf: "2026-07-15 23:59", poolUsage: 93.7,
      metrics: [metric("star-participants-207", "识别参与用户", "322 人", 322, "+16.2%", "本期报名、兑换或抽奖用户去重"), metric("star-exchange-207", "兑换勋章", "2,286 枚", 2286, "+21.5%", "244 名用户完成兑换"), metric("star-chances-207", "生成抽奖机会", "2,286 次", 2286, "+21.5%", "每枚勋章兑换 1 次"), metric("star-draws-207", "实际抽奖", "1,874 次", 1874, "+19.8%", "230 名用户产生奖励日志"), metric("star-use-207", "机会使用率", "82.0%", 82, "+2.4pp", "抽奖次数 ÷ 生成机会"), metric("star-average-207", "人均抽奖", "8.15 次", 8.15, "+0.61", "按抽奖用户计算"), metric("star-cash-207", "现金奖励", "¥936.50", 936.5, "+¥114.20", "现金奖励日志汇总"), metric("star-pool-207", "奖池剩余", "126 次", 126, "-74 次", "配置奖池 2,000 次", "negative")],
      flow: [{ label: "识别参与", value: 322 }, { label: "兑换勋章", value: 244 }, { label: "实际抽奖", value: 230 }], unusedChances: 412,
      trend: [{ date: "06-15", exchange: 286, draw: 214 }, { date: "06-22", exchange: 436, draw: 352 }, { date: "06-29", exchange: 512, draw: 426 }, { date: "07-06", exchange: 568, draw: 482 }, { date: "07-15", exchange: 484, draw: 400 }],
      frequency: [{ name: "1次", users: 24 }, { name: "2次", users: 18 }, { name: "3次", users: 28 }, { name: "4次以上", users: 160 }],
      medalRows: [[1, "长安街绝代风华·上篇", "王府井", 146, 108, 146], [2, "巴黎浪漫漫步", "凯旋门", 132, 101, 132], [3, "东京夜景轻跑", "浅草寺", 124, 96, 124], [4, "杭州西湖十景", "雷峰塔", 116, 92, 116], [5, "艺术园区彩霓虹", "751D·Park", 108, 86, 108], [6, "成都锦城绿道", "宽窄巷子", 96, 78, 96]],
      crossPeriod: [{ label: "所选活动期", value: "1 期", note: "第207期" }, { label: "参与用户", value: "322 人", note: "本期用户去重" }, { label: "现金中奖人数", value: "230 人", note: "仅统计现金奖励" }, { label: "现金中奖金额", value: "¥936.50", note: "实物奖品不折算" }],
    },
  ],
  checkin: {
    name: "30天运动打卡返购机款",
    period: "2026-08-01 00:00 至 2026-09-30 23:59",
    asOf: "2026-09-02 23:59",
    metrics: [
      metric("checkin-active", "区间活跃人数", "38,910 人", 38910, "+6.1%", "活动最早日至统计截止日"),
      metric("checkin-participants", "参与用户", "3,218 人", 3218, "+12.8%", "活动内用户去重"),
      metric("checkin-rate", "活跃参与率", "8.3%", 8.3, "+0.5pp", "参与用户 ÷ 区间活跃用户"),
      metric("checkin-due", "应打卡任务", "54,286 次", 54286, "+9.4%", "3,082 人已到任务日"),
      metric("checkin-completed", "已完成任务", "42,680 次", 42680, "+11.2%", "按注册日期对应任务统计"),
      metric("checkin-completion", "任务完成率", "78.6%", 78.6, "+1.8pp", "已完成 ÷ 应打卡任务"),
      metric("checkin-overdue", "逾期未完成", "11,606 次", 11606, "-2.1%", "不含截止日当天", "positive"),
      metric("checkin-full", "全程完成人数", "1,062 人", 1062, "+15.6%", "成熟用户完成率 34.5%"),
      metric("checkin-pending", "待领取任务", "11,482 次", 11482, "-4.6%", "已完成但奖励未领取", "positive"),
      metric("checkin-claimed", "已领取任务", "31,198 次", 31198, "+13.1%", "红包领取率 73.1%"),
      metric("checkin-reward", "已领取金额", "¥62,408", 62408, "+13.4%", "奖励状态为已领取"),
    ],
    trend: [
      { date: "08-01", cumulative: 482, participants: 482, completed: 356, rewarded: 214 },
      { date: "08-05", cumulative: 894, participants: 412, completed: 628, rewarded: 438 },
      { date: "08-09", cumulative: 1286, participants: 392, completed: 846, rewarded: 612 },
      { date: "08-13", cumulative: 1624, participants: 338, completed: 1032, rewarded: 726 },
      { date: "08-17", cumulative: 1986, participants: 362, completed: 1246, rewarded: 904 },
      { date: "08-21", cumulative: 2368, participants: 382, completed: 1428, rewarded: 1026 },
      { date: "08-25", cumulative: 2716, participants: 348, completed: 1562, rewarded: 1142 },
      { date: "08-29", cumulative: 3024, participants: 308, completed: 1698, rewarded: 1218 },
      { date: "09-02", cumulative: 3218, participants: 194, completed: 1816, rewarded: 1324 },
    ],
    newUserTrend: [{ date: "08-01", users: 624, participants: 96, completed: 71 }, { date: "08-05", users: 702, participants: 118, completed: 86 }, { date: "08-09", users: 686, participants: 112, completed: 82 }, { date: "08-13", users: 748, participants: 128, completed: 96 }, { date: "08-17", users: 816, participants: 142, completed: 108 }, { date: "08-21", users: 784, participants: 136, completed: 104 }, { date: "08-25", users: 862, participants: 154, completed: 118 }, { date: "08-29", users: 908, participants: 168, completed: 126 }, { date: "09-02", users: 936, participants: 176, completed: 132 }],
    funnel: [
      { name: "D1", value: 3218, rate: 100 }, { name: "D3", value: 2864, rate: 89.0 },
      { name: "D7", value: 2432, rate: 75.6 }, { name: "D14", value: 1846, rate: 57.4 },
      { name: "D21", value: 1432, rate: 44.5 }, { name: "D30", value: 1062, rate: 33.0 },
    ],
    dailyRows: [["08-25", "348", "1,562", "1,142", "2,716"], ["08-27", "326", "1,604", "1,176", "2,868"], ["08-29", "308", "1,698", "1,218", "3,024"], ["08-31", "252", "1,742", "1,286", "3,146"], ["09-02", "194", "1,816", "1,324", "3,218"]],
    routeRows: [
      ["东京夜景轻跑", "886", "12,468", "10,286", "82.5%", "7,842", "20 分钟", "3.2 km"],
      ["巴黎浪漫漫步", "742", "10,684", "8,214", "76.9%", "5,986", "25 分钟", "3.8 km"],
      ["西湖晨光环线", "698", "9,842", "7,686", "78.1%", "5,602", "22 分钟", "3.5 km"],
      ["长安街城市记忆", "612", "8,906", "6,494", "72.9%", "4,516", "30 分钟", "4.2 km"],
    ],
    rewardRows: [
      ["08-25", "1,562", "1,142", "73.1%", "¥2,284", "¥1,986"],
      ["08-27", "1,604", "1,176", "73.3%", "¥2,352", "¥2,046"],
      ["08-29", "1,698", "1,218", "71.7%", "¥2,436", "¥2,128"],
      ["08-31", "1,742", "1,286", "73.8%", "¥2,572", "¥2,246"],
      ["09-02", "1,816", "1,324", "72.9%", "¥2,648", "¥2,316"],
    ],
  },
};

function scaleFor(filters: ReportFilters) {
  const channelScale: Record<string, number> = { "全部渠道": 1, "抖音": 0.37, "天猫": 0.29, "京东": 0.22, "拼多多": 0.12 };
  const productScale: Record<string, number> = { "全部型号": 1, "TS2": 0.24, "TS2PRO": 0.28, "TS3": 0.2, "TS3PRO": 0.28 };
  const regionScale: Record<string, number> = { "全国": 1, "华东": 0.41, "华南": 0.24, "华北": 0.2, "西部": 0.15 };
  const from = new Date(`${filters.from}T00:00:00`);
  const to = new Date(`${filters.to}T00:00:00`);
  const days = Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) ? Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000) + 1) : 33;
  const dateScale = Math.min(1.25, days / 33);
  return (channelScale[filters.channel] ?? 1) * (productScale[filters.product] ?? 1) * (regionScale[filters.region] ?? 1) * dateScale;
}

function filteredExecutive(filters: ReportFilters): ExecutiveData {
  const scale = scaleFor({ ...filters, channel: "全部渠道" });
  if (scale === 1) return executive;
  return {
    ...executive,
    metrics: executive.metrics.map((item) => item.id === "sales" || item.id === "sales-volume" || item.id === "active-users" ? { ...item, raw: Math.round(item.raw * scale), value: item.id === "sales" ? `¥${Math.round(item.raw * scale).toLocaleString("zh-CN")}` : item.id === "sales-volume" ? `${Math.round(item.raw * scale).toLocaleString("zh-CN")} 台` : `${Math.round(item.raw * scale).toLocaleString("zh-CN")} 人` } : item),
    funnel: executive.funnel.map((item) => ({ ...item, value: Math.max(1, Math.round(item.value * scale)) })),
    channels: executive.channels,
  };
}

function dataStatus(filters: ReportFilters): DataStatus {
  if (filters.from > filters.to) return "empty";
  if (filters.to > "2026-09-02") return "delayed";
  if (filters.region === "海外") return "source_unavailable";
  return "ready";
}

function formatScaledValue(value: string, raw: number) {
  const rounded = Math.round(raw);
  if (value.startsWith("¥")) return `¥${rounded.toLocaleString("zh-CN")}`;
  if (value.includes("台")) return `${rounded.toLocaleString("zh-CN")} 台`;
  if (/^[\d,]+$/.test(value)) return rounded.toLocaleString("zh-CN");
  return value;
}

function filteredModule(key: keyof typeof modules, filters: ReportFilters): ModuleData {
  const source = modules[key];
  const scopedFilters = key === "sales" ? filters : { ...filters, channel: "全部渠道" };
  const scale = scaleFor(scopedFilters);
  const scaleTrend = ["sales", "commercial", "insights", "users"].includes(key) ? scale : 1 + (scale - 1) * 0.08;
  const rows = key === "sales" && filters.channel !== "全部渠道"
    ? source.rows.filter((row) => row[0] === filters.channel)
    : key === "devices" && filters.product !== "全部型号"
      ? source.rows.filter((row) => row[1] === filters.product)
      : source.rows;
  return {
    ...source,
    metrics: source.metrics.map((item) => item.raw > 100 ? { ...item, raw: Math.round(item.raw * scale), value: formatScaledValue(item.value, item.raw * scale) } : item),
    trend: source.trend.map((item) => ({ ...item, value: Number((item.value * scaleTrend).toFixed(1)), secondary: item.secondary == null ? undefined : Number((item.secondary * scaleTrend).toFixed(1)) })),
    rows,
  };
}

const result = <T,>(data: T, definition: string, filters: ReportFilters): DataResult<T> => ({ asOf: "2026-09-02 23:59", status: dataStatus(filters), definition, source: "MOVEVI 统一模拟事实数据集 · 演示数据", data });

export class MockDataProvider implements DataProvider {
  async getExecutiveDashboard(filters: ReportFilters) { return result(filteredExecutive(filters), "老板经营视角：交易、激活、使用、留存与商业化统一链路", filters); }
  async getSalesCenter(filters: ReportFilters) { return result(filteredModule("sales", filters), "支付成功、退款完成和签收状态按订单事实表统计", filters); }
  async getDeviceCenter(filters: ReportFilters) { return result(filteredModule("devices", filters), "一台物理设备按唯一 SN 统计，激活以首次联网成功为准", filters); }
  async getUserCenter(filters: ReportFilters) { return result(filteredModule("users", filters), "有效运动指里程不少于 1 公里且时长不少于 8 分钟", filters); }
  async getContentCenter(filters: ReportFilters) { return result(filteredModule("content", filters), "有效路线需通过内容审核且近 90 天有启动记录", filters); }
  async getExploreCenter(filters: ReportFilters) { return result(filteredModule("explore", filters), "探索深度为月活用户完成的不同有效路线数", filters); }
  async getActivityCenter(filters: ReportFilters) { return result(activityCenter, "轻盈之星按活动期统计勋章兑换与抽奖；30天打卡按注册日期对应任务统计完成与领取", filters); }
  async getCommercialCenter(filters: ReportFilters) { return result(filteredModule("commercial", filters), "订阅数据为模拟经营场景，不代表真实财务结果", filters); }
  async getAiInsights(filters: ReportFilters) { return result(filteredModule("insights", filters), "基于统一模拟数据的固定阈值规则，不调用外部 AI 服务", filters); }
}

export const dataProvider = new MockDataProvider();

export const formatNumber = (value: number) => value.toLocaleString("zh-CN");
export const northStarFormula = "月度有效运动用户 × 人均完成路线数 = MOVEVI WORLD RUNNING INDEX";
