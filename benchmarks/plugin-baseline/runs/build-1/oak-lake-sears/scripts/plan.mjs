// The Oak Lake neighbourhood as a master plan (a garden suburb of the mail-order years, about 1910-1930): the lake as a
// public park ringed by Lake Drive, an entry avenue on the flat west plain with the streetcar stop and village green,
// a contour drive on the east slope, a school on the south-east plateau, a church on a west corner, and house lots
// packed along every street (16 x 20, the kit's plot). Writes plan.json and plan.png (a labelled plan over the ground).
//   node plan.mjs [outDir]
import { readSite } from "./site.mjs";
import { street, plotsAlong } from "./street.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../plan", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const site = readSite(), { X, Z, H, water } = site;

// ---- streets (centre-line way points in the export's x, z) -----------------------------------------------------------
const LAKE_DRIVE = [[48, 46], [70, 40], [100, 38], [122, 50], [126, 80], [122, 108], [100, 120], [70, 120], [50, 108], [46, 76], [48, 46]];
const SPEC = [
  { name: "West Avenue", kind: "avenue", points: [[22, 0], [22, 159]] },
  // the loop in two halves (a closed polyline collapses in the street simplifier: its ends coincide)
  { name: "Lake Drive", kind: "drive", points: LAKE_DRIVE.slice(0, 6) },
  { name: "Lake Drive ", kind: "drive", points: LAKE_DRIVE.slice(5) },
  { name: "Hillside Drive", kind: "drive", points: [[132, 0], [131, 30], [128, 56], [124, 64]] },
  { name: "Green Street", kind: "street", points: [[24, 44], [47, 46]] },
  { name: "Church Street", kind: "street", points: [[24, 108], [49, 108]] },
  { name: "North Lane", kind: "street", points: [[99, 37], [98, 0]] },
  { name: "Park Lane", kind: "street", points: [[88, 121], [88, 159]] },
];
// ---- zones: what is not house lots ------------------------------------------------------------------------------------
const ZONES = [
  { name: "Village green", kind: "green", rect: [27, 4, 44, 22] },
  { name: "Shops", kind: "shops", rect: [0, 2, 19, 38] },
  { name: "School", kind: "school", rect: [96, 126, 156, 158] },
  { name: "Church", kind: "church", rect: [27, 112, 46, 134] },
  // the east slope climbs 8 -> 20 above the lake in 20 blocks: kept wooded with a trail, not terraced for lots
  { name: "Oak Woods", kind: "woods", rect: [129, 66, 159, 124] },
];
// buildings and places in the lake park (designed later, like the school and church)
const FEATURES = [{ name: "Boathouse", at: [58, 84] }, { name: "Bandstand", at: [66, 56] }, { name: "Playground", at: [104, 108] }, { name: "Shore path", at: [86, 64] }];
const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const park = (x, z) => inPoly(x + 0.5, z + 0.5, LAKE_DRIVE);
const zoneAt = (x, z) => ZONES.find((zn) => x >= zn.rect[0] && x <= zn.rect[2] && z >= zn.rect[1] && z <= zn.rect[3]);

const streets = SPEC.map((s) => { const st = street(site, { points: s.points, half: 2, maxGrade: 0.2, straightIn: 0 }); st.name = s.name; st.kind = s.kind; return st; });
const roadAt = new Map(); for (const st of streets) for (const c of st.cells) roadAt.set(`${c.x},${c.z}`, st);
// lots shoulder to shoulder along each side of each street (Lake Drive's lake-view lots first), one block apart
const taken = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (roadAt.has(`${x},${z}`) || park(x, z) || zoneAt(x, z)) taken.add(`${x},${z}`);
const lots = [];
for (const st of streets) for (const side of ["left", "right"]) {
  // the street's own cells are free to plotsAlong (it tests them itself); everything else stays taken
  const own = st.cells.map((c) => `${c.x},${c.z}`); own.forEach((k) => taken.delete(k));
  for (const p of plotsAlong(site, st, side, { wide: 16, deep: 20, setback: 0, maxCut: 6, maxFill: 5, pitch: 17, taken })) lots.push({ ...p, street: st.name.trim() });
  own.forEach((k) => taken.add(k));
}

// ---- the plan picture ---------------------------------------------------------------------------------------------------
const S = 5, img = Buffer.alloc(X * S * Z * S * 3);
const COL = { water: [70, 120, 190], park: [150, 196, 120], green: [170, 210, 130], shops: [214, 160, 120], school: [232, 190, 110], church: [190, 160, 210], woods: [96, 140, 84], road: [226, 208, 168], lot: [246, 240, 222], edge: [120, 96, 70] };
const lotAt = new Map(); lots.forEach((p, i) => { for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) lotAt.set(`${x},${z}`, i); });
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const k = `${x},${z}`, h = H[z][x], zn = zoneAt(x, z); let c;
  if (water[z][x]) c = COL.water; else if (roadAt.has(k)) c = COL.road; else if (lotAt.has(k)) c = COL.lot; else if (zn) c = COL[zn.kind]; else if (park(x, z)) c = COL.park;
  else { const t = Math.max(0, Math.min(1, h / 26)); c = [110 + 60 * t, 140 + 50 * t, 90 + 40 * t]; }
  // contour lines every 2 blocks of height
  const cont = !water[z][x] && x + 1 < X && z + 1 < Z && (Math.floor(h / 2) !== Math.floor(H[z][x + 1] / 2) || Math.floor(h / 2) !== Math.floor(H[z + 1][x] / 2));
  for (let dz = 0; dz < S; dz++) for (let dx = 0; dx < S; dx++) { let cc = c;
    const li = lotAt.get(k); if (li != null) { const p = lots[li]; if ((x === p.x0 && dx === 0) || (x === p.x1 && dx === S - 1) || (z === p.z0 && dz === 0) || (z === p.z1 && dz === S - 1)) cc = COL.edge; }
    if (cont && li == null && !roadAt.has(k) && !zn && (dx === S - 1 || dz === S - 1)) cc = cc.map((v) => v * 0.85);
    const o = ((z * S + dz) * X * S + x * S + dx) * 3; img[o] = cc[0]; img[o + 1] = cc[1]; img[o + 2] = cc[2]; } }
writeFileSync(`${OUT}/plan.ppm`, Buffer.concat([Buffer.from(`P6 ${X * S} ${Z * S} 255\n`), img]));
const labels = [
  ...SPEC.filter((s) => s.name.trim() === s.name).map((s) => { const p = s.points[Math.floor(s.points.length / 2)]; return [s.name, p[0], p[1]]; }),
  ...ZONES.map((zn) => [zn.name, (zn.rect[0] + zn.rect[2]) / 2, (zn.rect[1] + zn.rect[3]) / 2]),
  ["Lake park", 76, 48], ["Oak Lake", 88, 86], ...FEATURES.map((f) => ["• " + f.name, f.at[0] + f.name.length / 2, f.at[1]]),
  ...lots.map((p, i) => [String(i + 1), (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2]),
];
const args = [`${OUT}/plan.ppm`, "-font", "/System/Library/Fonts/Supplemental/Arial.ttf", "-gravity", "NorthWest"];
for (const [t, x, z] of labels) { const small = /^\d+$/.test(t); args.push("-pointsize", small ? "16" : "20", "-fill", small ? "#5a4630" : "#1c2420", "-stroke", small ? "none" : "#ffffffcc", "-strokewidth", small ? "0" : "4", "-annotate", `+${Math.round(x * S - t.length * (small ? 4 : 5))}+${Math.round(z * S - 10)}`, t);
  if (!small) args.push("-stroke", "none", "-annotate", `+${Math.round(x * S - t.length * 5)}+${Math.round(z * S - 10)}`, t); }
execFileSync("magick", [...args, `${OUT}/plan.png`]);

const summary = { streets: streets.map((s) => ({ name: s.name, len: s.len, maxGrade: s.maxGrade, cut: s.cut, fill: s.fill })), lots: lots.length, zones: ZONES.map((z) => z.name), lotEarth: lots.reduce((a, p) => a + p.cut + p.fill, 0), perStreet: Object.fromEntries([...new Set(lots.map((l) => l.street))].map((n) => [n, lots.filter((l) => l.street === n).length])) };
writeFileSync(`${OUT}/plan.json`, JSON.stringify({ spec: SPEC, zones: ZONES, features: FEATURES, lakeDrive: LAKE_DRIVE, lots, summary }, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 1));
