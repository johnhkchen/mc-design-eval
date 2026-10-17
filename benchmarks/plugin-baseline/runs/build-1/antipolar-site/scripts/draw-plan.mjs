// Phase 1 plan: the land, the levee ring and polders, streets with their heights, zones, plots, cannon sections.
import { computeLayout } from "./layout.mjs";
import { sectionBoxes } from "./sections.mjs";
import { plan } from "./plan.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "art/plan-2.png";
const L = computeLayout(), { T } = L;
const KIND = { floor: [120, 170, 80], levee: [95, 150, 60], dike: [110, 160, 70], "dike lane": [200, 175, 120], ditch: [60, 110, 200], paddy: [80, 150, 190], bund: [120, 170, 80], ramp: [230, 210, 160], "polder street": [215, 195, 140], street: [236, 214, 150], bank: [100, 155, 65], boardwalk: [150, 105, 60], pier: [150, 105, 60], alley: [190, 140, 85] };
const roads = Object.entries(KIND).map(([k, color]) => ({ color, cells: [...T].filter(([, v]) => v.kind === k).map(([key]) => { const [x, z] = key.split(",").map(Number); return { x, z }; }) }));
const zones = [...L.zones, ...L.polders].map((z) => ({ rect: z.rect, color: z.color, alpha: z.alpha ?? 0.12 }));
const plots = [...L.plots, ...L.waterfront].map((p) => ({ rect: [p.x0, p.z0, p.x1, p.z1], color: [255, 255, 255], alpha: 0.2, edge: [40, 40, 40] }));
const secs = sectionBoxes(T);
const secZones = secs.map((s) => ({ rect: [s.x0, s.z0, s.x1, s.z1], color: [255, 255, 255], alpha: 0, edge: [230, 40, 160] }));
const labels = [
  ...L.zones.map((z) => ({ text: z.name.toUpperCase(), x: (z.rect[0] + z.rect[2] + 1) / 2, z: z.name === "wetland" ? 60 : (z.rect[1] + z.rect[3] + 1) / 2 - 1, scale: 1 })),
  ...L.polders.map((p, i) => ({ text: ["POLDER 1 FAUBOURG", "POLDER 2 FIELDS", "POLDER 3 RICE"][i], x: (p.rect[0] + p.rect[2] + 1) / 2, z: p.rect[1] + 3, scale: 1 })),
  ...L.plots.map((p, i) => ({ text: `H${i + 1}`, x: (p.x0 + p.x1 + 1) / 2, z: (p.z0 + p.z1 + 1) / 2 + 1, scale: 1 })),
  ...L.waterfront.map((p, i) => ({ text: `M${i + 1}`, x: (p.x0 + p.x1 + 1) / 2, z: (p.z0 + p.z1 + 1) / 2 + 1, scale: 1 })),
  ...secs.map((s) => ({ text: s.name.split(" ")[0], x: s.x1 - 2, z: s.z0 + 3, scale: 2 })),
  { text: "POLARTON", x: 40, z: 8, scale: 1 }, { text: "VILLAGE", x: 105, z: 8, scale: 1 },
  { text: "CREST 2", x: 20, z: 70, scale: 1 }, { text: "CREST 2", x: 63, z: 125, scale: 1 }, { text: "FLOOR -1", x: 42, z: 79, scale: 1 },
];
for (const s of L.streets.filter((s) => !/levee/.test(s.name))) for (let i = 0; i < s.pts.length; i += 8) labels.push({ text: String(s.prof[i]), x: s.pts[i][0], z: s.pts[i][1] + 1, scale: 1 });
plan(L.site, OUT, { P: 5, zones: [...zones, ...plots, ...secZones], roads, labels });
mkdirSync("delivery", { recursive: true });
writeFileSync("delivery/layout-2.json", JSON.stringify({ frame: "antipolar_expansion_002_raw.nbt; its corner is Polarton's (18,3,64); heights are top-block y; water surface y 0", earth: L.earth, sections: secs, streets: L.streets.map((s) => ({ name: s.name, length: s.length, from: s.from, to: s.to, notes: s.notes, centre: s.pts.map(([x, z], i) => [+x.toFixed(1), +z.toFixed(1), s.prof[i]]) })), polders: L.polders, ramps: L.ramps, waterfront: L.waterfront, piers: L.piers, ditchesZ: L.ditches, plots: L.plots, zones: L.zones }, null, 1));
console.log(JSON.stringify({ earth: L.earth, plots: L.plots.length, mixedUse: L.waterfront.length, piers: L.piers.length, sections: secs.map((s) => `${s.name}: x ${s.x0}-${s.x1}, z ${s.z0}-${s.z1}`), streets: L.streets.map((s) => `${s.name} ${s.length} ${s.from}->${s.to} ${s.notes.join(";")}`) }, null, 1));
