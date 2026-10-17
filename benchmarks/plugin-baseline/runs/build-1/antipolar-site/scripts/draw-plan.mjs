// Phase 1 plan: the land, the zones, the streets (with their heights), the shore plots. -> art/plan-1.png, layout.json
import { computeLayout } from "./layout.mjs";
import { plan } from "./plan.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "art/plan-1.png";
const L = computeLayout();
const roads = L.streets.map((s) => ({ cells: s.cells.map((c) => ({ x: c.x, z: c.z })), color: [236, 214, 150] }));
const zones = L.zones.map((z) => ({ rect: z.rect, color: z.color, alpha: z.alpha ?? 0.22 }));
const plots = L.plots.map((p, i) => ({ rect: [p.x0, p.z0, p.x1, p.z1], color: [255, 255, 255], alpha: 0.25, edge: [40, 40, 40] }));
const labels = [
  ...L.zones.map((z) => ({ text: z.name.toUpperCase(), x: (z.rect[0] + z.rect[2] + 1) / 2, z: z.name === "wetland" ? 60 : (z.rect[1] + z.rect[3] + 1) / 2 - 1, scale: 1 })),
  ...L.plots.map((p, i) => ({ text: `H${i + 1}`, x: (p.x0 + p.x1 + 1) / 2, z: (p.z0 + p.z1 + 1) / 2 + 2, scale: 1 })),
  { text: "POLARTON", x: 40, z: 8, scale: 1 }, { text: "VILLAGE", x: 105, z: 8, scale: 1 },
];
// street heights every ~10 blocks
for (const s of L.streets) for (let i = 0; i < s.pts.length; i += 10) labels.push({ text: String(s.prof[i]), x: s.pts[i][0], z: s.pts[i][1] + 1, scale: 1 });
plan(L.site, OUT, { P: 5, zones: [...zones, ...plots], roads, labels });
mkdirSync("delivery", { recursive: true });
writeFileSync("delivery/layout-1.json", JSON.stringify({ frame: "antipolar_expansion_002_raw.nbt; its corner is Polarton's (18,3,64); heights are top-block y", streets: L.streets.map((s) => ({ name: s.name, length: s.length, from: s.from, to: s.to, halfSteps: s.steps, cut: s.cut, fill: s.fill, cellsOverWater: s.overWater, notes: s.notes, centre: s.pts.map(([x, z], i) => [+x.toFixed(1), +z.toFixed(1), s.prof[i]]) })), plots: L.plots.map((p) => ({ x0: p.x0, z0: p.z0, x1: p.x1, z1: p.z1, face: p.face, pad: p.pad, gate: p.gate, driveway: p.setback })), zones: L.zones }, null, 1));
console.log(L.streets.map((s) => `${s.name}: ${s.length} long, ${s.from} -> ${s.to}, ${s.steps} half steps, cut ${s.cut} fill ${s.fill} (over water ${s.overWater}) ${s.notes.join(";")}`).join("\n"));
console.log(L.plots.map((p) => `${p.x0},${p.z0}-${p.x1},${p.z1} ${p.face} pad ${p.pad} road ${p.road} cut ${p.cut} fill ${p.fill}`).join("\n"));
