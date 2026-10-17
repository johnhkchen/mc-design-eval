import { readSite } from "./site.mjs";
import { street } from "./street.mjs";
import { packPlots } from "./pack.mjs";
import { fillPlots } from "./fill.mjs";
import { renderSite } from "./render.mjs";
import { contourPoints } from "./contours.mjs";
const site = readSite();
const GREEN = [[66, 18, 81, 39]], WILD = [[0, 0, 21, 89]], VILLAGE = [[82, 0, 92, 89]], keepOut = [...GREEN, ...WILD, ...VILLAGE];
const spec = JSON.parse(process.argv[2]);
const streets = [];
for (const s of spec.streets) { if (s.contour) { s.points = contourPoints(site, s.contour.level, s.contour); s.level ??= s.contour.level; } const st = street(site, { keepOut, ...s }); if (!st) { console.log("no route", JSON.stringify(s)); continue; } st.name = s.name; streets.push(st);
  console.log(`${s.name}: y ${st.y[0].toFixed(1)}..${st.y.at(-1).toFixed(1)}, ${st.len} long, climb ${st.climb}, max grade ${st.maxGrade}, ${st.steep} blocks over 1:6, cut ${st.cut} fill ${st.fill} deepest ${st.deep}`); }
const taken = new Set(streets.flatMap((s) => s.cells.map((c) => `${c.x},${c.z}`)));
const plots = packPlots(site, streets, { keepOut, ...(spec.plots ?? {}) });
let tc = 0, tf = 0, tw = 0; for (const p of plots) { tc += p.cut; tf += p.fill; tw += p.wall; }
const rc = streets.reduce((a, s) => a + s.cut, 0), rf = streets.reduce((a, s) => a + s.fill, 0);
console.log(`plots ${plots.length}: cut ${tc} fill ${tf} retaining-wall face ${tw} | roads cut ${rc} fill ${rf} | earth per plot ${Math.round((tc + tf + rc + rf) / Math.max(1, plots.length))}`);
for (const p of plots) console.log(`  ${p.face.padEnd(5)} x${p.x0}-${p.x1} z${p.z0}-${p.z1} pad +${p.pad} (street +${p.road}, driveway ${p.setback} long: ${p.ramp.join(" ") || "level"}) cut ${p.cut}/${p.dc} fill ${p.fill}/${p.df} wall ${p.wall}`);
const extra = fillPlots(site, streets, plots, { keepOut });
const COL = { "small build": [255, 170, 60], farm: [240, 230, 80], pasture: [150, 230, 120], park: [60, 200, 120] };
const byKind = {}; for (const e of extra) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
console.log("extra plots", JSON.stringify(byKind)); for (const e of extra) console.log(`  ${e.kind.padEnd(11)} ${e.w}x${e.d} x${e.x0}-${e.x1} z${e.z0}-${e.z1} ground ${e.lo}..${e.hi} earth ${e.earth} trees ${e.trees}${e.track ? ` track ${e.track}` : ""}`);
renderSite(site, spec.out, { roads: streets, plots: [...plots, ...extra.map((e) => ({ ...e, color: COL[e.kind] }))], wild: WILD, green: GREEN });
