// Phase 1 plan: the land, the levee ring and polders, streets, the waterfront, the boatyard and channel, zones, plots,
// cannon sections. -> art/plan-3.png, delivery/layout-3.json
import { computeLayout } from "./layout.mjs";
import { sectionBoxes } from "./sections.mjs";
import { plan } from "./plan.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "art/plan-3.png";
const L = computeLayout(), { T } = L;
const KIND = { floor: [125, 175, 85], levee: [95, 150, 60], bank: [100, 155, 65], "seepage ditch": [60, 110, 200], canal: [40, 80, 180], "field ditch": [60, 110, 200], paddy: [80, 150, 190], bund: [125, 175, 85], sluice: [150, 150, 150],
  "farm lane": [200, 175, 120], ramp: [230, 210, 160], "polder road": [215, 195, 140], bridge: [150, 105, 60], "raised lot": [150, 200, 100], street: [236, 214, 150],
  "made land": [175, 145, 105], bulkhead: [110, 80, 50], boardwalk: [150, 105, 60], alley: [150, 105, 60], pier: [150, 105, 60], "island boardwalk": [150, 105, 60], "landing path": [230, 210, 160], landing: [150, 105, 60],
  yard: [175, 145, 105], ways: [110, 80, 50], channel: [30, 70, 200] };
const cellsOf = (pred) => [...T].filter(([, v]) => pred(v)).map(([key]) => { const [x, z] = key.split(",").map(Number); return { x, z }; });
const roads = [...Object.entries(KIND).map(([k, color]) => ({ color, cells: cellsOf((v) => v.kind === k) })), { color: [140, 140, 140], cells: cellsOf((v) => v.riprap) }];
const zones = [...L.zones, ...L.areas].map((z) => ({ rect: z.rect, color: z.color, alpha: z.alpha ?? 0.1 }));
const outline = [...L.plots, ...L.waterfront, ...L.yardPlots.map((q) => ({ x0: q.rect[0], z0: q.rect[1], x1: q.rect[2], z1: q.rect[3] }))].map((p) => ({ rect: [p.x0, p.z0, p.x1, p.z1], color: [255, 255, 255], alpha: 0.12, edge: [40, 40, 40] }));
const secs = sectionBoxes(T);
const secZones = secs.map((s) => ({ rect: [s.x0, s.z0, s.x1, s.z1], color: [255, 255, 255], alpha: 0, edge: [230, 40, 160] }));
let m = 0;
const labels = [
  ...L.zones.filter((z) => z.name !== "wetland").map((z) => ({ text: z.name.toUpperCase(), x: (z.rect[0] + z.rect[2] + 1) / 2, z: (z.rect[1] + z.rect[3] + 1) / 2, scale: 1 })),
  ...L.areas.map((a) => ({ text: a.name.toUpperCase(), x: (a.rect[0] + a.rect[2] + 1) / 2 + 9, z: a.rect[1] + 4, scale: 1 })),
  ...L.plots.map((p, i) => ({ text: `H${i + 1}`, x: (p.x0 + p.x1 + 1) / 2, z: (p.z0 + p.z1 + 1) / 2, scale: 1 })),
  ...L.waterfront.map((p) => ({ text: /distillery/.test(p.use) ? "DISTILLERY" : /brewhouse/.test(p.use) ? "BREWHOUSE" : `M${++m}`, x: (p.x0 + p.x1 + 1) / 2, z: (p.z0 + p.z1 + 1) / 2, scale: 1 })),
  ...L.yardPlots.map((q) => ({ text: q.name.toUpperCase(), x: (q.rect[0] + q.rect[2] + 1) / 2, z: (q.rect[1] + q.rect[3] + 1) / 2, scale: 1 })),
  ...secs.map((s) => ({ text: s.name.split(" ")[0], x: s.x0 + 3, z: s.z0 + 3, scale: 2 })),
  ...L.streets.filter((s) => s.stub).map((s) => ({ text: "STUB", x: s.pts.at(-1)[0], z: s.pts.at(-1)[1] - 3, scale: 1 })),
  { text: "POLARTON", x: 40, z: 8, scale: 1 }, { text: "VILLAGE", x: 105, z: 8, scale: 1 }, { text: "WETLAND", x: 118, z: 105, scale: 1 }, { text: "BOATYARD", x: 100, z: 151, scale: 1 },
  { text: "CREST 2", x: 14, z: 125, scale: 1 }, { text: "FLOOR -2", x: 33, z: 100, scale: 1 },
];
plan(L.site, OUT, { P: 5, zones: [...zones, ...outline, ...secZones], roads, labels });
mkdirSync("delivery", { recursive: true });
writeFileSync("delivery/layout-3.json", JSON.stringify({ frame: "antipolar_expansion_002_raw.nbt; its corner is Polarton's (18,3,64); heights are top-block y; water surface y 0", earth: L.earth, sections: secs, streets: L.streets.map((s) => ({ name: s.name, length: s.length, from: s.from, to: s.to, stub: s.stub, centre: s.pts.map(([x, z], i) => [+x.toFixed(1), +z.toFixed(1), s.prof[i]]) })), areas: L.areas, ramps: L.ramps, sluices: L.sluices, ditchesZ: L.ditches, plots: L.plots, waterfront: L.waterfront, piers: L.piers, yard: L.yard, yardPlots: L.yardPlots, channel: L.channel, fleet: L.fleet, zones: L.zones }, null, 1));
console.log(JSON.stringify({ earth: L.earth, houses: L.plots.length, waterfront: L.waterfront.length, piers: L.piers.length, channel: { cells: L.channel.cells, dredged: L.channel.dredged, failed: L.channel.routes.filter((r) => !r.ok).map((r) => r.from) }, sections: secs.map((s) => `${s.name}: x ${s.x0}-${s.x1}, z ${s.z0}-${s.z1}`), stubs: L.streets.filter((s) => s.stub).map((s) => `${s.name} -> ${s.stub}`), ramps: L.ramps.map((r) => r.prof.join(" ")) }, null, 1));
