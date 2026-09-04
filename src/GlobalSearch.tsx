import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Brain, ChartLineUp, CurrencyCircleDollar, DeviceMobile, Gauge,
  GlobeHemisphereWest, MagnifyingGlass, Path, ShoppingCart, Trophy, UsersThree, X,
} from "@phosphor-icons/react";

type SearchItem = {
  id: string;
  title: string;
  description: string;
  module: string;
  path: string;
  keywords: string[];
  icon: React.ComponentType<{ size?: number; weight?: "duotone" }>;
  quick?: boolean;
};

export const globalSearchItems: SearchItem[] = [
  { id: "dashboard", title: "数据概览", description: "核心指标、增长链路与经营指标全景", module: "数据概览", path: "/dashboard", keywords: ["首页", "看板", "增长链路", "经营指标"], icon: Gauge, quick: true },
  { id: "sales", title: "销售中心", description: "销售额、销量、渠道质量与完整销售漏斗", module: "销售中心", path: "/sales", keywords: ["订单", "营收", "抖音", "天猫", "京东", "拼多多"], icon: ShoppingCart, quick: true },
  { id: "devices", title: "设备中心", description: "设备激活、连接、使用、故障与一机一档", module: "设备中心", path: "/devices", keywords: ["硬件", "绑定", "固件", "SN"], icon: DeviceMobile, quick: true },
  { id: "users", title: "用户中心", description: "活跃、留存、运动时段与生命周期", module: "用户中心", path: "/users", keywords: ["DAU", "MAU", "画像", "运动用户"], icon: UsersThree, quick: true },
  { id: "content", title: "内容中心", description: "区域、城市、路线、景点与路线完播率", module: "跑遍全球", path: "/content", keywords: ["内容", "城市列表", "有效路线", "大洲"], icon: GlobeHemisphereWest, quick: true },
  { id: "explore", title: "探索中心", description: "城市点亮、路线解锁、探索深度与等级", module: "跑遍全球", path: "/explore", keywords: ["探索", "解锁城市", "点亮地球", "世界跑者"], icon: Path, quick: true },
  { id: "lottery", title: "勋章抽奖", description: "按期次查看勋章、抽奖节奏、奖池履约与用户明细", module: "活动中心", path: "/activities/lottery", keywords: ["奖池", "兑换", "抽奖机会", "期次", "勋章结转", "用户抽奖列表", "抽奖次数"], icon: Trophy, quick: true },
  { id: "checkin", title: "30天打卡", description: "每日推荐路线、红包领取与30天完成", module: "活动中心", path: "/activities/checkin", keywords: ["打卡活动", "红包", "连接激活", "推荐路线", "8.8元"], icon: Trophy, quick: true },
  { id: "commercial", title: "商业中心", description: "订阅转化、续费、ARPU 与 LTV", module: "商业中心", path: "/commercial", keywords: ["付费", "退订", "会员", "收入"], icon: CurrencyCircleDollar },
  { id: "insights", title: "AI 洞察", description: "经营机会、证据、建议与业务闭环", module: "AI 洞察", path: "/insights", keywords: ["AI", "机会清单", "智能分析", "建议"], icon: Brain },
  { id: "sales-revenue", title: "销售额与销售量", description: "查看核心销售指标、环比与日趋势", module: "销售中心", path: "/sales", keywords: ["销售额", "销售量", "销量", "成交金额", "有效订单"], icon: ChartLineUp },
  { id: "sales-funnel", title: "完整销售漏斗", description: "曝光、点击、咨询、加购、下单、支付、发货与退款", module: "销售中心", path: "/sales", keywords: ["转化率", "退款率", "渠道漏斗"], icon: ShoppingCart },
  { id: "channel-quality", title: "渠道质量", description: "比较抖音、天猫、京东和拼多多的销售质量", module: "销售中心", path: "/sales", keywords: ["抖音", "天猫", "京东", "拼多多", "退货率", "客单价"], icon: ShoppingCart },
  { id: "activation", title: "设备激活率", description: "查看设备激活、成功连接和首次使用漏斗", module: "设备中心", path: "/devices", keywords: ["激活", "APP绑定", "首次连接", "首跑"], icon: DeviceMobile },
  { id: "device-ledger", title: "一机一档", description: "搜索设备、用户、型号、固件、连接与故障记录", module: "设备中心", path: "/devices", keywords: ["设备SN", "累计运动", "累计时长", "累计里程", "最近连接", "30日连接"], icon: DeviceMobile },
  { id: "retention", title: "用户留存", description: "查看 D1–D90 留存和活跃用户趋势", module: "用户中心", path: "/users", keywords: ["D1", "D7", "D30", "D90", "留存率"], icon: UsersThree },
  { id: "time-heatmap", title: "运动时段热力图", description: "按星期和 3 小时时段查看运动分布", module: "用户中心", path: "/users", keywords: ["运动时段", "热力", "18-21", "活跃时间"], icon: UsersThree },
  { id: "user-profile", title: "用户画像与频次分层", description: "查看年龄、性别、地区、运动频次和生命周期", module: "用户中心", path: "/users", keywords: ["用户画像", "高频跑者", "稳定跑者", "低频跑者", "沉默用户"], icon: UsersThree },
  { id: "route-completion", title: "路线完播率", description: "查看完播趋势以及区域、城市和路线表现", module: "内容中心", path: "/content", keywords: ["路线完成率", "完播率趋势", "完成度"], icon: Path },
  { id: "city-route", title: "城市与路线数据", description: "搜索路线并按完成人数、完播率、复跑率和热度排序", module: "内容中心", path: "/content", keywords: ["城市列表", "路线列表", "综合热度", "复跑率", "退出点"], icon: GlobeHemisphereWest },
  { id: "explore-depth", title: "探索深度", description: "查看第二条路线、城市点亮与五级用户成长", module: "探索中心", path: "/explore", keywords: ["第二条路线", "探索等级", "勋章获得率", "点亮城市"], icon: Path },
  { id: "lottery-usage", title: "抽奖机会使用率", description: "实际抽奖次数 ÷ 生成抽奖机会数", module: "勋章抽奖", path: "/activities/lottery", keywords: ["机会使用率", "实际抽奖", "生成机会", "奖池剩余"], icon: Trophy },
  { id: "checkin-depth", title: "D1–D30 打卡深度", description: "查看到达各任务日的路线完成用户与完成率", module: "30天打卡", path: "/activities/checkin", keywords: ["D1", "D3", "D7", "D15", "D21", "D30", "全程完成"], icon: Trophy },
  { id: "new-users", title: "新增用户", description: "查看注册、连接激活、首次运动和D7留存", module: "用户中心", path: "/users", keywords: ["新用户", "新增注册", "首周转化", "首次运动", "新用户留存"], icon: UsersThree },
  { id: "subscription", title: "订阅与续费", description: "查看订阅转化、到期续费、退订原因和付费关系", module: "商业中心", path: "/commercial", keywords: ["订阅转化率", "续费率", "ARPU", "LTV", "退订"], icon: CurrencyCircleDollar },
  { id: "ai-opportunity", title: "经营机会清单", description: "按优先级查看结论、证据、建议、目标页面和状态", module: "AI 洞察", path: "/insights", keywords: ["高优机会", "中优机会", "本月闭环", "预计增量"], icon: Brain },
];

const normalize = (value: string) => value.toLocaleLowerCase("zh-CN").replace(/[\s·—–_/]+/g, "");

function scoreItem(item: SearchItem, query: string) {
  const needle = normalize(query);
  const title = normalize(item.title);
  const module = normalize(item.module);
  const keywords = item.keywords.map(normalize);
  const description = normalize(item.description);
  if (title === needle) return 100;
  if (title.startsWith(needle)) return 80;
  if (title.includes(needle)) return 65;
  if (module.includes(needle)) return 50;
  if (keywords.some((keyword) => keyword === needle)) return 45;
  if (keywords.some((keyword) => keyword.includes(needle))) return 35;
  if (description.includes(needle)) return 20;
  return 0;
}

export function GlobalSearch({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return globalSearchItems.filter((item) => item.quick);
    return globalSearchItems
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title, "zh-CN"))
      .slice(0, 10)
      .map(({ item }) => item);
  }, [query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open]);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const select = (item: SearchItem) => {
    onNavigate(item.path);
    close(false);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length) setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length) setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  return <>
    <button ref={triggerRef} type="button" className="global-search-trigger" aria-label="全局搜索" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <MagnifyingGlass />
      <span>搜索数据或功能</span>
      <kbd>Ctrl K</kbd>
    </button>
    {open && <div className="global-search-layer">
      <button type="button" className="global-search-scrim" aria-label="关闭全局搜索" onClick={() => close()} />
      <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="全局搜索">
        <div className="global-search-input">
          <MagnifyingGlass />
          <input
            ref={inputRef}
            type="search"
            aria-label="搜索模块、指标或报表"
            aria-describedby="global-search-status"
            placeholder="搜索模块、指标或报表，例如：一机一档"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {query && <button type="button" aria-label="清空搜索" title="清空" onClick={() => setQuery("")}><X /></button>}
          <kbd>Esc</kbd>
        </div>
        <div className="global-search-results">
          <header>
            <strong>{query.trim() ? "搜索结果" : "快捷入口"}</strong>
            <span id="global-search-status" aria-live="polite">{query.trim() ? `找到 ${results.length} 项` : "常用业务模块"}</span>
          </header>
          {results.length ? <ul aria-label="搜索结果列表">
            {results.map((item, index) => {
              const Icon = item.icon;
              return <li key={item.id}>
                <button
                  type="button"
                  className={index === activeIndex ? "active" : ""}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(item)}
                >
                  <span className="global-search-icon"><Icon size={19} weight="duotone" /></span>
                  <span className="global-search-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                  <span className="global-search-module">{item.module}</span>
                  <ArrowRight />
                </button>
              </li>;
            })}
          </ul> : <div className="global-search-empty">
            <MagnifyingGlass />
            <strong>未找到“{query.trim()}”</strong>
            <p>可尝试搜索“设备激活”“路线完播率”或“30天打卡”。</p>
          </div>}
        </div>
        <footer>
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 进入</span>
          <span>仅展示可访问页面</span>
        </footer>
      </section>
    </div>}
  </>;
}
