import { describe, expect, it } from "vitest";
import { dataProvider, defaultFilters } from "./data";

describe("MockDataProvider", () => {
  it("keeps the executive funnel monotonic and exposes metadata", async () => {
    const result = await dataProvider.getExecutiveDashboard(defaultFilters);
    expect(result.asOf).toContain("2026-09-02");
    expect(result.source).toContain("演示数据");
    expect(result.data.funnel).toHaveLength(11);
    expect(result.data.funnel[0]).toMatchObject({ name: "销量", value: 4328 });
    expect(result.data.funnel.map((stage) => stage.name)).toEqual(expect.arrayContaining(["连续完成路线", "解锁城市", "探索更多城市", "长期留存"]));
    expect(result.data.funnel.map((stage) => stage.name)).not.toEqual(expect.arrayContaining(["流量", "咨询", "购买", "收货", "形成运动习惯", "复购 / 推荐"]));
    expect(result.data.funnel.map((stage) => stage.name)).not.toContain("APP绑定");
    expect(result.data.metrics[1]).toMatchObject({ id: "sales-volume", label: "本月销售量", value: "4,328 台" });
    expect(result.data.metrics[4]).toMatchObject({ id: "active-users", label: "本月运动用户", value: "8,326 人" });
    result.data.funnel.slice(1).forEach((stage, index) => expect(stage.value).toBeLessThanOrEqual(result.data.funnel[index].value));
  });

  it("applies channel only to sales data", async () => {
    const all = await dataProvider.getExecutiveDashboard(defaultFilters);
    const tmall = await dataProvider.getExecutiveDashboard({ ...defaultFilters, channel: "天猫" });
    expect(tmall.data.metrics[0].raw).toBe(all.data.metrics[0].raw);
    expect(tmall.data.channels.map((row) => row.channel)).toEqual(["抖音", "天猫", "京东", "拼多多"]);

    const allSales = await dataProvider.getSalesCenter(defaultFilters);
    const tmallSales = await dataProvider.getSalesCenter({ ...defaultFilters, channel: "天猫" });
    expect(tmallSales.data.metrics[0].raw).toBe(Math.round(allSales.data.metrics[0].raw * 0.29));
    expect(tmallSales.data.rows.map((row) => row[0])).toEqual(["天猫"]);
  });

  it("uses previous-period series for month-over-month comparison", async () => {
    const result = await dataProvider.getSalesCenter(defaultFilters);
    expect(result.data.trend.every((point) => point.secondary != null)).toBe(true);
    expect(result.data.trend.every((point) => !("target" in point))).toBe(true);
  });

  it("provides a complete searchable device ledger", async () => {
    const result = await dataProvider.getDeviceCenter(defaultFilters);
    expect(result.data.sectionTitle).toBe("一机一档完整字段表");
    expect(result.data.columns).toHaveLength(16);
    expect(result.data.columns).toEqual(expect.arrayContaining(["设备唯一 ID", "出厂时间", "销售时间", "绑定用户", "激活时间", "首次连接", "最近连接", "30日连接", "累计运动", "累计时长", "累计里程", "故障记录", "固件版本", "APP版本", "状态"]));
    expect(result.data.rows).toHaveLength(24);
    expect(result.data.rows.every((row) => row.length === result.data.columns.length)).toBe(true);
    const ts3 = await dataProvider.getDeviceCenter({ ...defaultFilters, product: "TS3" });
    expect(ts3.data.rows).toHaveLength(6);
    expect(ts3.data.rows.every((row) => row[1] === "TS3")).toBe(true);
  });

  it("provides the two activity reports with understandable definitions", async () => {
    const activity = await dataProvider.getActivityCenter(defaultFilters);
    expect(activity.data.lightStarPeriods).toHaveLength(4);
    expect(activity.data.lightStarPeriods[0]).toMatchObject({ id: "all", isAggregate: true });
    expect(activity.data.lightStarPeriods.every((period) => period.metrics.length === 12)).toBe(true);
    expect(activity.data.checkin.name).toBe("30天打卡领红包");
    expect(activity.data.checkin.metrics).toHaveLength(12);
    expect([...activity.data.lightStarPeriods.flatMap((period) => period.metrics), ...activity.data.checkin.metrics].every((item) => item.definition.length > 12)).toBe(true);
    expect(activity.data.lightStarPeriods[1].metrics.map((item) => item.label)).toEqual(expect.arrayContaining(["完成路线数", "获得勋章", "平均每路线勋章", "兑换勋章", "实际抽奖", "奖励发放", "奖励金额", "期末结转勋章"]));
    expect(activity.data.lightStarPeriods.slice(1).every((period) => period.pool.rewardLimit === 200 && period.pool.budget === 100 && period.pool.rewardIssued <= 200 && period.pool.amountIssued <= 100)).toBe(true);
    expect(activity.data.lightStarPeriods.slice(1).every((period) => (period.metrics.find((item) => item.label === "实际抽奖")?.raw ?? 201) <= 200)).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => {
      const average = period.metrics.find((item) => item.label === "平均每路线勋章")?.raw ?? 0;
      return average >= 2 && average <= 3;
    })).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => period.carryoverBadges > 0)).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => period.hourly.length === 24 && period.hourly.at(-1)?.time === "次日19:00后")).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => period.hourly.reduce((sum, item) => sum + item.draws, 0) === (period.metrics.find((item) => item.label === "实际抽奖")?.raw ?? 0))).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => period.userRows.length === period.flow[2].value)).toBe(true);
    expect(activity.data.lightStarPeriods.every((period) => period.userRows.reduce((sum, item) => sum + item.draws, 0) === (period.metrics.find((item) => item.label === "实际抽奖")?.raw ?? 0))).toBe(true);
    expect(activity.data.checkin.dailyRows).toHaveLength(5);
    expect(activity.data.checkin.newUserTrend.length).toBeGreaterThan(5);
    expect(activity.data.checkin.businessFlow.map((item) => item.label)).toEqual(["连接激活", "开启计划", "完成首日路线", "领取首日红包", "完成30天"]);
    expect(activity.data.checkin.funnel.at(-1)).toMatchObject({ name: "D30", value: 1062 });
    expect(activity.data.checkin.rewardRows[0]).toEqual(expect.arrayContaining(["第1天", "¥0.38"]));
    expect(activity.data.checkin.rewardRows.at(-1)).toEqual(expect.arrayContaining(["第30天", "¥1.28"]));
    expect(activity.data.checkin.newbieRows.flat()).toEqual(expect.arrayContaining(["¥1.80", "¥2.80"]));
    expect(activity.data.checkin.metrics.find((item) => item.label === "已领取金额")?.value).toBe("¥10,223.64");
  });

  it("adds new-user acquisition and first-week conversion data to the user center", async () => {
    const users = await dataProvider.getUserCenter(defaultFilters);
    expect(users.data.metrics[0]).toMatchObject({ id: "new-users", label: "新增用户", value: "6,324 人" });
    expect(users.data.metrics).toHaveLength(5);
    expect(users.definition).toContain("首次完成注册时间去重");
  });
});
