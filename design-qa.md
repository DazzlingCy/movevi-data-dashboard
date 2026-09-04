# MOVEVI Dashboard — Design QA

## Scope

- Visual source of truth: selected option 2, `exec-d9e20499-dae9-4d82-bf39-3e731bca1f32.png` (1487 × 1058).
- Normalized comparison viewport: 1440 × 1024.
- Additional responsive viewports: 1280 × 800 and 1024 × 768.
- Verified routes: `/dashboard`, `/sales`, `/devices`, `/users`, `/content`, `/explore`, `/activities/lottery`, `/activities/checkin`, `/commercial`, `/insights`.

## Comparison artifacts

- `qa/comparison-1440-final.png` — normalized source and final dashboard in one side-by-side comparison image.
- `qa/dashboard-1440-final.png` — final executive dashboard.
- `qa/dashboard-1280.png` — 1280 desktop breakpoint.
- `qa/dashboard-1024.png` — compact sidebar and wide-funnel overflow behavior.
- `qa/ai-insights-1440.png` — representative business module with charts and decision table.
- `qa/requirements-audit/06-reference-vs-supplemented.png` — source visual and requirement-complete dashboard in one comparison input.
- `qa/requirements-audit/03-metric-panorama.png` — 32-item executive panorama state.

## Findings and fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| P0 | None | No blocking rendering, navigation, or console failures found. |
| P1 | Initial entry resolved the placeholder component instead of the TypeScript app. | Removed the obsolete JSX component; production build now resolves the complete app. |
| P1 | Collapsed navigation labels were not exposed to semantic selectors. | Added explicit accessible names and titles to every navigation target. |
| P2 | First iteration left excessive whitespace below the channel table at 1440 × 1024. | Increased KPI, funnel, loss-card, AI panel, and table proportions while retaining a no-scroll first screen. |
| P2 | A page-level horizontal scrollbar appeared at the 1024 breakpoint. | Removed the document minimum width; only the intended funnel/table regions can overflow horizontally. |
| P2 | Filtered business modules originally retained unfiltered headline totals. | Added shared date/channel/product/region scaling to the mock provider and channel-aware sales detail filtering. |
| P2 | 首页增长链路原本包含销售前流量阶段与不再需要的习惯、复购阶段。 | 按最新老板口径收敛为“销量 → 长期留存”的 11 阶段链路，并统一人数规模。 |
| P2 | 首页右侧 AI 判断占用核心链路空间，品牌指数不够直观。 | 移除 AI 判断，将链路改为无横向滚动的 11 阶段单行布局，并以“本月运动用户”替换指数卡。 |
| P2 | 原型为追求首屏密度，大量说明和表格文字低于 12px。 | 参考 Ant Design 建立 12/14/16/20/24px 字阶，覆盖筛选、指标、流程、表格、图表、抽屉和深度分析。 |
| P2 | 增长链路转化率倾斜且矮视口下流失点文字溢出；业务模块 KPI 也受旧高度限制。 | 转化率改为水平连接标签，流失卡改为标题/指标两列结构，模块 KPI 高度统一为 108px；八个路由文字边界扫描无异常。 |
| P2 | 阶段筛选、目标趋势线和销售漏斗激活步骤不符合最新业务口径。 | 移除阶段筛选并自动清理旧 URL 参数；趋势图改为本期/上期环比；销售漏斗及渠道明细同步删除激活。 |
| P2 | Secondary business modules summarized several required dimensions without exposing the underlying detail. | Added complete sales and activation funnels, retention/time/frequency views, route/attraction/replay details, exploration thresholds, subscription behavior, and device-content analysis. |
| P2 | Latest business scope changed the overview name, primary sales channels, and main device models. | Unified navigation, filters, mock facts, tables, device records, cross-analysis, copy, and tests around 数据概览；抖音/天猫/京东/拼多多；TS2/TS2PRO/TS3/TS3PRO. |
| P2 | 用户、内容、探索统计未充分对应 MOVEVI App，且业务 KPI 缺少逐项口径。 | 按 App 的完成城市、完成路线、运动里程/时长、城市图鉴、路线/景点、点亮地球、收藏、勋章与排行榜重组；所有模块 KPI 均可点击查看独立口径。 |
| P2 | 通用活动卡片无法还原现有活动报表的业务链路与专属口径。 | 活动中心拆分为侧栏二级导航和两个独立路由：轻盈之星按“参与 → 勋章兑换 → 抽奖机会 → 实际抽奖 → 奖池履约”分析，并支持全部期次/单期筛选；30天打卡按“区间活跃 → 参与 → 应打卡任务 → 完成 → 全程完成 → 红包领取”分析，并补齐每日趋势、新增用户转化、D1–D30、线路表现、奖励履约与数据质量。 |
| P2 | 内容中心和探索中心属于同一“跑遍全球”业务域，但原导航以两个平级入口呈现。 | 新增“跑遍全球”一级导航，将内容中心、探索中心收拢为可直接访问的二级导航；进入任一子页面时父级与当前子级同步高亮。 |
| P2 | 全局渠道筛选会让设备、用户、内容等非销售指标产生错误的渠道归因。 | 渠道筛选仅保留在销售中心；进入其他路由时自动清理 URL 渠道参数，数据层强制按全渠道汇总，并移除漏斗下钻、设备档案和用户画像中的渠道拆分。数据概览仅保留明确标注为销售数据的渠道概览。 |
| P2 | 侧栏使用临时脉冲图标，未体现正式品牌资产。 | 使用用户上传的 MOVEVI 渐变方形标识，并保留深色侧栏下的清晰对比。 |
| P2 | 设备首次使用漏斗多出“收货”，用户时段仍为宽泛环形图，用户分层缺少直观解释且两张表需要横向滚动。 | 移除“收货”；将顶部时段分布改为星期×3小时时段热力图；在频次与生命周期表内直接补充判定规则；用户画像和频次分层改成带占比条的纵向卡片，并清理城市收藏相关文案。 |
| P2 | 内容中心缺少完整城市/路线目录，区域、城市、路线层级混排，趋势和热度表仍使用收藏分享口径。 | 城市 KPI 展开六大洲 86 城完整列表，路线 KPI 展开 1,248 条可搜索分页目录；正文按区域→城市→路线顺序排列；趋势改为路线完播率，大洲图改为城市数量分布，路线热度表每页 10 条并移除收藏分享字段；区域、城市和路线的经营指标支持表头升降序。 |

## Acceptance checks

- 1440 × 1024 document size is exactly 1440 × 1024 with no vertical or horizontal page scroll.
- 1280 × 800 dashboard fits the viewport; 1024 × 768 collapses the sidebar and preserves the full working area.
- Core path verified: sales channel filter → device center with channel scope cleared → back to dashboard.
- Sales URL-state check verified: `TS3PRO + 拼多多` persists inside the sales route as `product=TS3PRO&channel=拼多多` and both controls remain selected.
- Channel scope check verified: the channel selector and parameter are retained inside sales, then removed when navigating to devices; product/date/region filters remain available.
- Funnel stages and KPI cards are native buttons with visible focus states; drawer is keyboard reachable and labelled as a dialog.
- Activity center exposes two independent child routes; the lottery period selector is keyboard reachable, persists as a scoped URL parameter, and updates every report section from the same selected-period dataset.
- Browser console: 0 errors across all nine routes.
- `npm run typecheck`: passed.
- `npm test`: 17/17 passed, including data derivation, 11-stage coverage, month-over-month series, routing, URL persistence, keyboard flow, activity center, metric definitions, content catalogs/search/pagination, simplified activation funnel, user heatmap/cohort explanations, requirement blocks, and axe serious/critical checks.
- `npm run build`: passed.
- `npm run test:sites`: 4/4 passed.

final result: passed
