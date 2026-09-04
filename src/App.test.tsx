import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { App, getBusinessModuleTarget } from "./App";

describe("MOVEVI dashboard", () => {
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
    expect(await screen.findByText("20 分钟路线退出点")).toBeInTheDocument();
    expect(screen.getByText("每条路线完整数据档案")).toBeInTheDocument();
    expect(screen.getAllByText("景点热度").length).toBeGreaterThan(0);
  });

  it("renders the activity center and opens a metric definition", async () => {
    window.history.pushState({}, "", "/activities/lottery");
    render(<App />);
    expect(await screen.findByText("兑换与抽奖趋势")).toBeInTheDocument();
    expect(screen.getByText("轻盈之星整体数据")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "勋章抽奖" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "30天打卡" })).toBeInTheDocument();
    expect(screen.queryByLabelText("渠道")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("选择勋章抽奖期次"), "209");
    expect(await screen.findByText("跑遍全世界（209）")).toBeInTheDocument();
    expect(window.location.search).toContain("period=209");
    expect(screen.getAllByText("29 人").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "查看机会使用率口径说明" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("实际抽奖次数 ÷ 生成抽奖机会数");
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    await userEvent.click(screen.getByRole("link", { name: "30天打卡" }));
    expect(await screen.findByText("D1–D30 完成深度")).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).not.toContain("period="));
    expect(screen.getByText("每日趋势明细")).toBeInTheDocument();
    expect(screen.getByText("新增用户参与与完成转化")).toBeInTheDocument();
    expect(screen.getByText("分配线路完成表现")).toBeInTheDocument();
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
