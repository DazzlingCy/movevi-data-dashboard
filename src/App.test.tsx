import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { App, getBusinessModuleTarget } from "./App";

describe("MOVEVI dashboard", () => {
  it("searches business content and only navigates to valid module routes", async () => {
    window.history.pushState({}, "", "/dashboard?product=TS3PRO");
    render(<App />);

    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: "全局搜索" });
    const searchbox = within(dialog).getByRole("searchbox", { name: "搜索模块、指标或报表" });
    await userEvent.type(searchbox, "一机一档");
    expect(within(dialog).getByText("找到 2 项")).toBeInTheDocument();
    expect(within(dialog).getByText("搜索设备、用户、型号、固件、连接与故障记录")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { name: "一机一档完整字段表" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/devices");
    expect(window.location.search).toContain("product=TS3PRO");

    await userEvent.keyboard("{Control>}k{/Control}");
    const reopened = await screen.findByRole("dialog", { name: "全局搜索" });
    await userEvent.type(within(reopened).getByRole("searchbox", { name: "搜索模块、指标或报表" }), "不存在的业务指标");
    expect(within(reopened).getByText("未找到“不存在的业务指标”")).toBeInTheDocument();
    expect(within(reopened).queryByRole("button", { name: /进入/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "全局搜索" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全局搜索" })).toHaveFocus();
  });

  it("renders all routes and opens a keyboard-operable funnel drilldown", async () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    expect(await screen.findByText("本月运动用户")).toBeInTheDocument();
    expect(screen.queryByText("AI 经营判断")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "跑遍全球" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "内容中心" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "探索中心" })).toBeInTheDocument();
    const stage = (await screen.findAllByRole("button", { name: /首次运动/ }))[0];
    stage.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toHaveTextContent("设备激活后 7 日内产生首个有效运动记录");
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await userEvent.click(screen.getByRole("link", { name: /设备中心/ }));
    expect(await screen.findByRole("heading", { name: "一机一档完整字段表" })).toBeInTheDocument();
  });

  it("keeps the channel filter exclusive to sales", async () => {
    window.history.pushState({}, "", "/sales?stage=%E6%96%B0%E5%AE%A2");
    render(<App />);
    await screen.findByText("完整销售漏斗");
    expect(screen.queryByLabelText("用户阶段")).not.toBeInTheDocument();
    await waitFor(() => expect(window.location.search).not.toContain("stage="));
    await userEvent.selectOptions(screen.getByLabelText("渠道"), "天猫");
    await userEvent.selectOptions(screen.getByLabelText("型号"), "TS3PRO");
    await waitFor(() => expect(window.location.search).toContain("channel=%E5%A4%A9%E7%8C%AB"));
    expect(window.location.search).toContain("product=TS3PRO");
    await userEvent.click(screen.getByRole("link", { name: "设备中心" }));
    expect(await screen.findByRole("heading", { name: "一机一档完整字段表" })).toBeInTheDocument();
    expect(screen.queryByLabelText("渠道")).not.toBeInTheDocument();
    await waitFor(() => expect(window.location.search).not.toContain("channel="));
    expect(window.location.search).toContain("product=TS3PRO");
  });

  it("has no serious accessibility violations on the executive route", async () => {
    window.history.pushState({}, "", "/dashboard");
    const { container } = render(<App />);
    await screen.findByText("销售渠道概览");
    const results = await axe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toHaveLength(0);
  });

  it("exposes the complete executive metric panorama", async () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "全部经营指标" }));
    const dialog = await screen.findByRole("dialog", { name: "经营指标全景" });
    expect(dialog).toHaveTextContent("32 项经营指标");
    expect(dialog).toHaveTextContent("总内容时长");
    expect(dialog).toHaveTextContent("预测 LTV");
  });

  it("renders the missing deep-dive requirement blocks", async () => {
    window.history.pushState({}, "", "/sales");
    const { unmount } = render(<App />);
    const salesFunnel = (await screen.findByText("完整销售漏斗")).closest("section");
    expect(salesFunnel).toBeInTheDocument();
    expect(salesFunnel).not.toHaveTextContent("激活");
    expect(salesFunnel).toHaveTextContent("退款");
    expect(screen.getByText("四大销售渠道质量")).toBeInTheDocument();
    expect(screen.getAllByText("拼多多").length).toBeGreaterThan(0);
    unmount();
    window.history.pushState({}, "", "/content");
    render(<App />);
    const region = await screen.findByRole("heading", { name: "区域" });
    const city = screen.getByRole("heading", { name: "城市" });
    const route = screen.getByRole("heading", { name: "路线" });
    expect(region.compareDocumentPosition(city) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(city.compareDocumentPosition(route) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(route.compareDocumentPosition(screen.getByText("20 分钟路线退出点")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("景点热度").length).toBeGreaterThan(0);
  });

  it("shows new-user acquisition, conversion and first-week retention in the user center", async () => {
    window.history.pushState({}, "", "/users");
    render(<App />);
    expect((await screen.findAllByText("新增用户")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("6,324 人").length).toBeGreaterThan(0);
    expect(screen.getByText("新用户首周关键转化")).toBeInTheDocument();
    expect(screen.getByText("新增用户趋势")).toBeInTheDocument();
    expect(screen.getAllByText("新用户分批次首周表现").length).toBeGreaterThan(0);
    expect(screen.getAllByText("新增注册").length).toBeGreaterThan(0);
    expect(screen.getAllByText("D7留存").length).toBeGreaterThan(0);
  });

  it("expands complete content catalogs and paginates route performance", async () => {
    window.history.pushState({}, "", "/content");
    render(<App />);
    expect(await screen.findByText("路线完播率趋势")).toBeInTheDocument();
    expect(screen.getByText("城市路线分布")).toBeInTheDocument();
    expect(screen.getByText("32座")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("收藏分享");

    await userEvent.click(screen.getByRole("button", { name: "展开已上线城市列表" }));
    const cityDialog = await screen.findByRole("dialog", { name: "已上线城市" });
    ["亚洲", "欧洲", "非洲", "北美洲", "南美洲", "大洋洲"].forEach((continent) => expect(within(cityDialog).getByRole("heading", { name: continent })).toBeInTheDocument());
    expect(within(cityDialog).getByText("32 座")).toBeInTheDocument();
    expect(within(cityDialog).getByText("霍巴特")).toBeInTheDocument();
    await userEvent.click(within(cityDialog).getByRole("button", { name: "关闭" }));

    await userEvent.click(screen.getByRole("button", { name: "展开有效路线列表" }));
    const routeDialog = await screen.findByRole("dialog", { name: "有效路线" });
    const catalogTable = within(routeDialog).getByRole("table", { name: "有效路线目录" });
    expect(within(catalogTable).getAllByRole("row")).toHaveLength(11);
    expect(routeDialog).toHaveTextContent("共 1,248 条路线 · 第 1 / 125 页");
    await userEvent.type(within(routeDialog).getByRole("searchbox", { name: "搜索有效路线" }), "东京");
    expect(routeDialog).toHaveTextContent("共 15 条路线 · 第 1 / 2 页");
    await userEvent.click(within(routeDialog).getByRole("button", { name: "关闭" }));

    const performanceTable = screen.getByRole("table", { name: "城市与路线综合热度" });
    expect(within(performanceTable).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("共 30 条路线 · 第 1 / 3 页 · 当前 1–10 条")).toBeInTheDocument();
    expect(within(performanceTable).queryByRole("columnheader", { name: /收藏|分享/ })).not.toBeInTheDocument();

    const regionTable = screen.getByRole("table", { name: "大洲内容数据" });
    expect(within(regionTable).getByRole("button", { name: "城市完成人数排序" })).toBeInTheDocument();
    expect(within(regionTable).getByRole("button", { name: "平均完成度排序" })).toBeInTheDocument();
    await userEvent.click(within(regionTable).getByRole("button", { name: "城市完成人数排序" }));
    await userEvent.click(within(regionTable).getByRole("button", { name: "城市完成人数排序" }));
    expect(within(regionTable).getAllByRole("row")[1]).toHaveTextContent("南美洲");

    const cityTable = screen.getByRole("table", { name: "城市内容数据" });
    ["完成人数", "平均完播率", "综合热度"].forEach((column) => expect(within(cityTable).getByRole("button", { name: `${column}排序` })).toBeInTheDocument());
    await userEvent.click(within(cityTable).getByRole("button", { name: "综合热度排序" }));
    await userEvent.click(within(cityTable).getByRole("button", { name: "综合热度排序" }));
    expect(within(cityTable).getAllByRole("row")[1]).toHaveTextContent("西安");

    ["启动人数", "完播率", "复跑率", "平均时长", "综合热度"].forEach((column) => expect(within(performanceTable).getByRole("button", { name: `${column}排序` })).toBeInTheDocument());
    await userEvent.click(within(performanceTable).getByRole("button", { name: "启动人数排序" }));
    await userEvent.click(within(performanceTable).getByRole("button", { name: "启动人数排序" }));
    expect(within(performanceTable).getAllByRole("row")[1]).toHaveTextContent("布宜诺斯艾利斯");
    await userEvent.type(screen.getByRole("searchbox", { name: "搜索路线名称" }), "塞纳河左岸");
    expect(within(performanceTable).getAllByRole("row")).toHaveLength(2);
    expect(within(performanceTable).getByText("巴黎 · 塞纳河左岸")).toBeInTheDocument();
  });

  it("renders the activity center and opens a metric definition", async () => {
    window.history.pushState({}, "", "/activities/lottery");
    render(<App />);
    expect(await screen.findByText("勋章获得、兑换与抽奖趋势")).toBeInTheDocument();
    expect(screen.getByText("勋章抽奖（全部期次）")).toBeInTheDocument();
    expect(screen.queryByText("轻盈之星报表")).not.toBeInTheDocument();
    expect(screen.queryByText("初夏漫游计划（207）")).not.toBeInTheDocument();
    expect(screen.queryByText("每完成一条路线，一般获得 2–3 枚勋章。")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "查看活动规则" }));
    const rulesDialog = await screen.findByRole("dialog", { name: "勋章抽奖规则" });
    expect(rulesDialog).toHaveTextContent("每完成一条路线，一般获得 2–3 枚勋章。");
    expect(rulesDialog).toHaveTextContent("每天晚上八点开奖");
    expect(rulesDialog).toHaveTextContent("每期设置 200 个奖励，奖励总金额 100 元，抽完即止。");
    expect(rulesDialog).toHaveTextContent("勋章永久有效");
    await userEvent.click(within(rulesDialog).getByRole("button", { name: "关闭" }));
    expect(screen.getByRole("link", { name: "勋章抽奖" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "30天打卡" })).toBeInTheDocument();
    expect(screen.queryByLabelText("渠道")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("选择勋章抽奖期次"), "209");
    expect(await screen.findByText("勋章抽奖（209）")).toBeInTheDocument();
    expect(window.location.search).toContain("period=209");
    expect(screen.getAllByText("29 人").length).toBeGreaterThan(0);
    expect(screen.getByText("开奖后 24 小时抽奖节奏")).toBeInTheDocument();
    expect(screen.getByText("路线与勋章产出")).toBeInTheDocument();
    const lotteryUserTable = screen.getByRole("table", { name: "用户抽奖列表" });
    expect(within(lotteryUserTable).getAllByRole("row")).toHaveLength(11);
    ["完成路线", "获得勋章", "兑换勋章", "抽奖次数", "中奖次数", "中奖金额"].forEach((column) => expect(within(lotteryUserTable).getByRole("button", { name: `${column}排序` })).toBeInTheDocument());
    await userEvent.type(screen.getByRole("searchbox", { name: "查询抽奖用户" }), "MVU20910001");
    expect(within(lotteryUserTable).getAllByRole("row")).toHaveLength(2);
    expect(within(lotteryUserTable).getByText("MVU20910001")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "查看机会使用率口径说明" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("实际抽奖次数 ÷ 生成抽奖机会数");
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await userEvent.click(screen.getByRole("link", { name: "30天打卡" }));
    expect(await screen.findByText("D1–D30 路线完成深度")).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).not.toContain("period="));
    expect(screen.getByText("30天打卡领红包")).toBeInTheDocument();
    expect(screen.getByText("重点红包日完成与领取")).toBeInTheDocument();
    expect(screen.getByText("新手红包任务")).toBeInTheDocument();
    expect(screen.getByText("每日打卡趋势明细")).toBeInTheDocument();
    expect(screen.getByText("新增用户计划转化")).toBeInTheDocument();
    expect(screen.getByText("推荐路线完成表现")).toBeInTheDocument();
    expect(screen.getByText("30天红包构成")).toBeInTheDocument();
  });

  it("maps dashboard drilldowns to the correct business modules", () => {
    expect(getBusinessModuleTarget("sales")).toEqual({ path: "/sales", label: "进入销售中心" });
    expect(getBusinessModuleTarget("sales-volume")).toEqual({ path: "/sales", label: "进入销售中心" });
    expect(getBusinessModuleTarget("activation")).toEqual({ path: "/devices", label: "进入设备中心" });
    expect(getBusinessModuleTarget("activate")).toEqual({ path: "/devices", label: "进入设备中心" });
    expect(getBusinessModuleTarget("register")).toEqual({ path: "/users", label: "进入用户中心" });
    expect(getBusinessModuleTarget("first-run")).toEqual({ path: "/users", label: "进入用户中心" });
    expect(getBusinessModuleTarget("retention")).toEqual({ path: "/users", label: "进入用户中心" });
    expect(getBusinessModuleTarget("active-users")).toEqual({ path: "/users", label: "进入用户中心" });
    expect(getBusinessModuleTarget("first-route")).toEqual({ path: "/content", label: "进入内容中心" });
    expect(getBusinessModuleTarget("second-route")).toEqual({ path: "/explore", label: "进入探索中心" });
    expect(getBusinessModuleTarget("continuous-route")).toEqual({ path: "/explore", label: "进入探索中心" });
    expect(getBusinessModuleTarget("unlock-city")).toEqual({ path: "/explore", label: "进入探索中心" });
    expect(getBusinessModuleTarget("explore-cities")).toEqual({ path: "/explore", label: "进入探索中心" });
    expect(getBusinessModuleTarget("subscription")).toEqual({ path: "/commercial", label: "进入商业中心" });
    expect(getBusinessModuleTarget("long-retention")).toEqual({ path: "/users", label: "进入用户中心" });
    expect(getBusinessModuleTarget("unknown")).toBeUndefined();
  });

  it("only shows a business jump when the selected metric has a useful target", async () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    const firstRun = (await screen.findAllByRole("button", { name: /首次运动/ }))[0];
    await userEvent.click(firstRun);
    await userEvent.click(screen.getByRole("button", { name: "进入用户中心" }));
    expect(await screen.findByText("用户频次与生命周期")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "查看DAU口径说明" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("自然日内至少产生 1 次有效运动");
    expect(screen.queryByRole("button", { name: /进入.+中心/ })).not.toBeInTheDocument();
  });

  it("opens an accessible date range popover and applies quick ranges", async () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    const trigger = await screen.findByRole("button", { name: /选择日期范围，当前 2026\/08\/01 至 2026\/09\/02/ });
    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "日期范围筛选" });
    ["数据截止日", "近 7 天", "近 30 天", "近 90 天", "本周", "本月", "上月", "今年至今"].forEach((label) => expect(within(dialog).getByRole("button", { name: new RegExp(`^${label}`) })).toBeInTheDocument());
    await userEvent.click(within(dialog).getByRole("button", { name: /^近 7 天/ }));
    await waitFor(() => expect(window.location.search).toContain("from=2026-08-27"));
    expect(window.location.search).not.toContain("to=");
    expect(screen.queryByRole("dialog", { name: "日期范围筛选" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /选择日期范围，当前 2026\/08\/27 至 2026\/09\/02/ })).toBeInTheDocument();
  });

  it("shows ten device records per page and supports paging and search", async () => {
    window.history.pushState({}, "", "/devices");
    render(<App />);
    const table = await screen.findByRole("table", { name: "一机一档完整字段表" });
    expect(screen.getAllByRole("heading", { name: "一机一档完整字段表" })).toHaveLength(1);
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    ["最近连接", "30日连接", "累计运动", "累计时长", "累计里程"].forEach((column) => expect(within(table).getByRole("columnheader", { name: column })).toBeInTheDocument());
    expect(screen.getByText(/共 24 台设备 · 第 1 \/ 3 页 · 当前 1–10 条/)).toBeInTheDocument();
    expect(screen.queryByText("主要断点：激活后首跑")).not.toBeInTheDocument();
    expect(screen.queryByText("固件升级建议")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "返回数据概览" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByText(/第 2 \/ 3 页 · 当前 11–20 条/)).toBeInTheDocument();
    expect(within(table).getByText("MV26-374951")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("searchbox", { name: "搜索一机一档设备" }), "故障");
    expect(screen.getByText(/共 6 台设备 · 第 1 \/ 1 页 · 当前 1–6 条/)).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
  });

  it("uses the simplified device funnel and explained user heatmap cohorts", async () => {
    window.history.pushState({}, "", "/devices");
    const { unmount } = render(<App />);
    const activation = (await screen.findByRole("heading", { name: "设备激活与首次使用漏斗" })).closest("section");
    expect(activation).toHaveTextContent("销售");
    expect(activation).toHaveTextContent("注册");
    expect(activation).not.toHaveTextContent("收货");

    unmount();
    window.history.pushState({}, "", "/users");
    render(<App />);
    expect(await screen.findByText("运动里程")).toBeInTheDocument();
    expect(screen.getByText("运动时长")).toBeInTheDocument();
    expect(screen.queryByText("月运动里程")).not.toBeInTheDocument();
    expect(screen.queryByText("月运动时长")).not.toBeInTheDocument();
    expect(screen.getByText("本期与上期环比 · 单位：人")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /星期与三小时时段运动分布热力图/ })).toBeInTheDocument();
    expect(screen.getByTitle("周三 18–21：33%")).toBeInTheDocument();
    ["00–03", "03–06", "06–09", "09–12", "12–15", "15–18", "18–21", "21–24"].forEach((time) => expect(screen.getByText(time)).toBeInTheDocument());
    expect(screen.getByText("近 30 日有效运动 ≥ 8 次")).toBeInTheDocument();
    expect(screen.getByText("连续 3 个月保持活跃")).toBeInTheDocument();
    expect(screen.getByLabelText("用户画像主要特征")).toBeInTheDocument();
    expect(screen.getByLabelText("运动频次分层说明")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("城市收藏");
  });
});
