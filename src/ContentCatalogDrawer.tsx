import { useEffect, useMemo, useState } from "react";
import { ArrowRight, GlobeHemisphereWest, MagnifyingGlass, MapPin, Path, X } from "@phosphor-icons/react";
import { contentCityGroups, contentRouteCatalog } from "./contentCatalogData";

export type ContentCatalogKind = "cities" | "routes";

export function ContentCatalogDrawer({ kind, onClose }: { kind: ContentCatalogKind; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const filteredRoutes = useMemo(() => normalizedQuery ? contentRouteCatalog.filter((route) => route.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery)) : contentRouteCatalog, [normalizedQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleRoutes = filteredRoutes.slice(start, start + pageSize);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const isCities = kind === "cities";
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="关闭内容目录" onClick={onClose} /><aside className="drawer content-catalog-drawer" role="dialog" aria-modal="true" aria-labelledby="content-catalog-title"><button autoFocus className="drawer-close" onClick={onClose} aria-label="关闭"><X /></button><header className="content-catalog-head"><span>{isCities ? <GlobeHemisphereWest /> : <Path />}{isCities ? "城市内容目录" : "有效路线目录"}</span><h2 id="content-catalog-title">{isCities ? "已上线城市" : "有效路线"}</h2><p>{isCities ? "共 86 座城市，按六大洲完整罗列。" : "共 1,248 条有效路线，可按路线名称搜索并分页查看。"}</p></header>{isCities ? <div className="content-city-groups">{contentCityGroups.map((group) => <section key={group.continent}><header><div><GlobeHemisphereWest /><h3>{group.continent}</h3></div><b>{group.cities.length} 座</b></header><div>{group.cities.map((city) => <span key={city}><MapPin />{city}</span>)}</div></section>)}</div> : <div className="content-route-catalog"><div className="catalog-search-row"><label className="table-search"><MagnifyingGlass /><span className="sr-only">搜索有效路线</span><input type="search" aria-label="搜索有效路线" placeholder="输入路线名称，例如：东京" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><span>每页 10 条</span></div><div className="table-scroll"><table aria-label="有效路线目录"><thead><tr><th>路线名称</th><th>大洲</th><th>距离</th><th>建议时长</th><th>难度</th><th>上线日期</th></tr></thead><tbody>{visibleRoutes.length ? visibleRoutes.map((route) => <tr key={route.name}><td>{route.name}</td><td>{route.continent}</td><td>{route.distance}</td><td>{route.duration}</td><td><span className={`difficulty-tag ${route.difficulty}`}>{route.difficulty}</span></td><td>{route.onlineDate}</td></tr>) : <tr><td className="empty-table-cell" colSpan={6}>未找到匹配路线，请更换路线名称</td></tr>}</tbody></table></div><footer className="table-pagination"><span>共 {filteredRoutes.length.toLocaleString("zh-CN")} 条路线 · 第 {currentPage} / {totalPages} 页{filteredRoutes.length > 0 && ` · 当前 ${start + 1}–${Math.min(start + pageSize, filteredRoutes.length)} 条`}</span><div><button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ArrowRight />上一页</button><button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>下一页<ArrowRight /></button></div></footer></div>}</aside></div>;
}
