// The Oak Lake neighbourhood as a master plan (a garden suburb of the mail-order years, about 1910-1930): the lake as a
// public park ringed by Lake Drive, an entry avenue on the flat west plain with the streetcar stop and village green,
// a contour drive on the east slope, a school on the south-east plateau, a church on a west corner, and house lots
// packed along every street (16 x 20, the kit's plot). Writes plan.json and plan.png (a labelled plan over the ground).
//   node plan.mjs [outDir]
import { computePlan } from "./layout.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../plan", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const P = computePlan(), { site, SPEC, ZONES, FEATURES, LAKE_DRIVE, streets, roadAt, median, park, zoneAt, PARK, trailAt, lots } = P, { X, Z, H, water } = site;

// ---- the plan picture ---------------------------------------------------------------------------------------------------
const S = 5, img = Buffer.alloc(X * S * Z * S * 3);
const COL = { water: [70, 120, 190], park: [150, 196, 120], green: [170, 210, 130], shops: [214, 160, 120], school: [232, 190, 110], church: [190, 160, 210], woods: [96, 140, 84], field: [118, 178, 88], courts: [176, 104, 82], picnic: [196, 214, 120], beach: [236, 222, 170], play: [240, 176, 110], building: [210, 150, 90], trail: [150, 110, 70], dock: [120, 80, 50], ramp: [150, 150, 150], road: [226, 208, 168], lot: [246, 240, 222], edge: [120, 96, 70] };
const lotAt = new Map(); lots.forEach((p, i) => { for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) lotAt.set(`${x},${z}`, i); });
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const k = `${x},${z}`, h = H[z][x], zn = zoneAt(x, z); let c;
  const ar = PARK.inArea(x, z), dk = PARK.dockAt.get(k);
  if (dk) c = COL[dk.kind]; else if (water[z][x]) c = COL.water; else if (median.has(k)) c = COL.park; else if (roadAt.has(k)) c = COL.road; else if (trailAt.has(k)) c = COL.trail; else if (ar) c = COL[ar.kind]; else if (lotAt.has(k)) c = COL.lot; else if (zn) c = COL[zn.kind]; else if (park(x, z)) c = COL.park;
  else { const t = Math.max(0, Math.min(1, h / 26)); c = [110 + 60 * t, 140 + 50 * t, 90 + 40 * t]; }
  // contour lines every 2 blocks of height
  const cont = !water[z][x] && x + 1 < X && z + 1 < Z && (Math.floor(h / 2) !== Math.floor(H[z][x + 1] / 2) || Math.floor(h / 2) !== Math.floor(H[z + 1][x] / 2));
  for (let dz = 0; dz < S; dz++) for (let dx = 0; dx < S; dx++) { let cc = c;
    const li = lotAt.get(k); if (li != null) { const p = lots[li]; if ((x === p.x0 && dx === 0) || (x === p.x1 && dx === S - 1) || (z === p.z0 && dz === 0) || (z === p.z1 && dz === S - 1)) cc = COL.edge; }
    if (cont && li == null && !roadAt.has(k) && !zn && (dx === S - 1 || dz === S - 1)) cc = cc.map((v) => v * 0.85);
    const o = ((z * S + dz) * X * S + x * S + dx) * 3; img[o] = cc[0]; img[o + 1] = cc[1]; img[o + 2] = cc[2]; } }
writeFileSync(`${OUT}/plan.ppm`, Buffer.concat([Buffer.from(`P6 ${X * S} ${Z * S} 255\n`), img]));
const labels = [
  ...PARK.areas.map((a) => [a.name, (a.rect[0] + a.rect[2]) / 2, (a.rect[1] + a.rect[3]) / 2]),
  ...PARK.docks.map((d) => [d.name, d.shore[0] + (d.dir[0] ? -d.dir[0] * 8 : 0), d.shore[1] + (d.dir[1] ? -d.dir[1] * 4 : 3)]),
  ["Oak Woods trail", 146, 108], ["Shore path", 96, 62],
  ...streets.filter((s) => s.name.trim() === s.name).map((s) => { const p = s.pts[Math.floor(s.pts.length / 2)]; return [s.name, p[0], p[1]]; }),
  ...ZONES.filter((zn) => !PARK.areas.some((a) => a.rect[0] >= zn.rect[0] && a.rect[2] <= zn.rect[2] && a.rect[1] >= zn.rect[1] && a.rect[3] <= zn.rect[3])).map((zn) => [zn.name, (zn.rect[0] + zn.rect[2]) / 2, (zn.rect[1] + zn.rect[3]) / 2]),
  ["Lake park", 70, 76], ["Oak Lake", 88, 86], ...FEATURES.map((f) => ["• " + f.name, f.at[0] + f.name.length / 2, f.at[1]]),
  ...lots.map((p, i) => [String(i + 1), (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2]),
];
const args = [`${OUT}/plan.ppm`, "-font", "/System/Library/Fonts/Supplemental/Arial.ttf", "-gravity", "NorthWest"];
for (const [t, x, z] of labels) { const small = /^\d+$/.test(t); const lx = (xx) => Math.max(4, Math.min(X * S - t.length * 10, xx));
  args.push("-pointsize", small ? "16" : "20", "-fill", small ? "#5a4630" : "#1c2420", "-stroke", small ? "none" : "#ffffffcc", "-strokewidth", small ? "0" : "4", "-annotate", `+${Math.round(lx(x * S - t.length * (small ? 4 : 5)))}+${Math.round(z * S - 10)}`, t);
  if (!small) args.push("-stroke", "none", "-annotate", `+${Math.round(lx(x * S - t.length * 5))}+${Math.round(z * S - 10)}`, t); }
execFileSync("magick", [...args, `${OUT}/plan.png`]);

// ---- the road layout alone: streets coloured by kind over pale ground, with names and lengths ------------------------
{
  const KIND = { avenue: [150, 60, 40], drive: [40, 90, 150], street: [70, 70, 70] };
  const R = Buffer.alloc(X * S * Z * S * 3);
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const k = `${x},${z}`, st = roadAt.get(k), h = H[z][x];
    const t = Math.max(0, Math.min(1, h / 26));
    let c = water[z][x] ? [170, 200, 232] : median.has(k) ? [96, 150, 80] : st ? KIND[st.kind] : park(x, z) ? [214, 232, 200] : [238 - 30 * (1 - t), 236 - 24 * (1 - t), 226 - 20 * (1 - t)];
    const cont = !st && !water[z][x] && x + 1 < X && z + 1 < Z && (Math.floor(h / 2) !== Math.floor(H[z][x + 1] / 2) || Math.floor(h / 2) !== Math.floor(H[z + 1][x] / 2));
    for (let dz = 0; dz < S; dz++) for (let dx = 0; dx < S; dx++) { const cc = cont && (dx === S - 1 || dz === S - 1) ? c.map((v) => v * 0.88) : c;
      const o = ((z * S + dz) * X * S + x * S + dx) * 3; R[o] = cc[0]; R[o + 1] = cc[1]; R[o + 2] = cc[2]; } }
  writeFileSync(`${OUT}/roads.ppm`, Buffer.concat([Buffer.from(`P6 ${X * S} ${Z * S} 255\n`), R]));
  const a = [`${OUT}/roads.ppm`, "-font", "/System/Library/Fonts/Supplemental/Arial.ttf", "-gravity", "NorthWest", "-pointsize", "19"];
  const byName = {}; for (const st of streets) { const n = st.name.trim(); (byName[n] ??= []).push(st); }
  for (const [n, sts] of Object.entries(byName)) { const P = sts.at(-1).pts, p = P[Math.floor(P.length / 2)];
    const len = sts.reduce((t, q) => t + q.len, 0), g = Math.max(...sts.map((q) => q.maxGrade)), txt = `${n} · ${len} blocks${g > 0.01 ? ` · steepest 1 in ${Math.round(1 / g)}` : " · level"}`;
    const nudge = { "Lake Drive": [-10, 42] }[n] ?? [0, 0]; /* clear of a crossing street's label */
    const x = Math.max(4, Math.min(X * S - txt.length * 10, p[0] * S + 14 + nudge[0])), y = Math.max(4, Math.min(Z * S - 26, p[1] * S - 10 + nudge[1]));
    a.push("-fill", "#ffffffdd", "-draw", `rectangle ${x - 4},${y - 2} ${x + txt.length * 9.6},${y + 22}`, "-fill", "#1c2420", "-annotate", `+${x}+${y}`, txt); }
  a.push("-pointsize", "15", "-fill", "#ffffffdd", "-draw", "rectangle 6,6 380,70", "-fill", "#963c28", "-annotate", "+12+10", "avenue", "-fill", "#285a96", "-annotate", "+12+30", "drives", "-fill", "#464646", "-annotate", "+12+50", "streets", "-fill", "#1c2420", "-annotate", "+80+10", "avenue 7 wide (planted strip), others 5", "-annotate", "+80+30", "contours every 2 blocks", "-annotate", "+80+50", "160 x 160 blocks, north up");
  execFileSync("magick", [...a, `${OUT}/roads.png`]);
}
const summary = { docks: PARK.docks.map((d) => ({ name: d.name, kind: d.kind, run: d.run, width: d.width, ...(d.grade ? { drop: d.drop, grade: d.grade } : {}) })), park: PARK.areas.map((a) => ({ name: a.name, size: a.size.join(" x "), ...(a.level ? { pad: a.pad, cut: a.cut, fill: a.fill } : {}), water: a.water })), trails: PARK.trails.map((t) => ({ name: t.name, cells: t.cells.size })), streets: streets.map((s) => ({ name: s.name, len: s.len, maxGrade: s.maxGrade, cut: s.cut, fill: s.fill })), lots: lots.length, zones: ZONES.map((z) => z.name), lotEarth: lots.reduce((a, p) => a + p.cut + p.fill, 0), perStreet: Object.fromEntries([...new Set(lots.map((l) => l.street))].map((n) => [n, lots.filter((l) => l.street === n).length])) };
writeFileSync(`${OUT}/plan.json`, JSON.stringify({ spec: SPEC, zones: ZONES, features: FEATURES, park: { docks: PARK.docks, areas: PARK.areas, trails: PARK.trails.map((t) => ({ name: t.name, cells: [...t.cells] })) }, lakeDrive: LAKE_DRIVE, lots, summary }, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 1));
