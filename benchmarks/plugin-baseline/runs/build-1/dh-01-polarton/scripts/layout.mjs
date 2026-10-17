// the agreed layout as data: streets (centre points + heights + cells), module plots, extra plots
import { readSite } from "./site.mjs";
import { street } from "./street.mjs";
import { packPlots } from "./pack.mjs";
import { fillPlots } from "./fill.mjs";
import { contourPoints } from "./contours.mjs";
import { readFileSync } from "node:fs";
export const GREEN = [[66, 18, 81, 39]], WILD = [[0, 0, 21, 89]], VILLAGE = [[82, 0, 92, 89]];
export function computeLayout(spec = JSON.parse(readFileSync(new URL("./spec-g.json", import.meta.url)))) {
  const site = readSite(), keepOut = [...GREEN, ...WILD, ...VILLAGE];
  const streets = spec.streets.map((s0) => { const s = { ...s0 }; if (s.contour) { s.points = contourPoints(site, s.contour.level, s.contour); s.level ??= s.contour.level; } const st = street(site, { keepOut, ...s }); st.name = s.name; st.spec = s; return st; });
  const plots = packPlots(site, streets, { keepOut, ...(spec.plots ?? {}) });
  const extras = fillPlots(site, streets, plots, { keepOut });
  return { site, streets, plots, extras, keepOut };
}
