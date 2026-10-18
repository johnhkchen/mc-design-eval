// Set the mail-order kit's modules on the Lake Street plots: module i (plot i of the sample row, x 16i..16i+15,
// z 5..24, facing north onto its street strip) onto site plot i, turned to face the street (east), its yard surface on
// the pad's top. Writes, in the export's frame (taller if a house needs it):
//   street.nbt          everything (land + street + houses)
//   street-changes.nbt  against the original export (explicit air where earth or trees were cleared)
//   kit-changes.nbt     against site.nbt: the houses alone, no air (paste with Replace Solid with Solid)
//   node place-kit.mjs <kit.nbt> [outDir]
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { rotateState } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/sockets.mjs";
import { GRADE } from "./site.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const here = (p) => new URL(p, import.meta.url).pathname;
const KIT = process.argv[2] ?? die("kit .nbt required"), OUT = process.argv[3] ?? here("../delivery");
function die(m) { console.error(m); process.exit(2); }
const layout = JSON.parse(readFileSync(`${OUT}/layout.json`, "utf8"));
const original = load(here("../input/oak_lake_001.nbt")), site = load(`${OUT}/site.nbt`), kit = load(KIT);
const Q = { north: 0, east: 1, south: 2, west: 3 }, W = 16, D = 20, Z0 = 5;
// the 1.21.1 server: newer blocks as their 1.21.1 equivalents
const FOR_1_21_1 = [[/^minecraft:pale_oak_log$/, "minecraft:stripped_birch_log"], [/^minecraft:pale_oak_/, "minecraft:birch_"], [/^minecraft:iron_chain$/, "minecraft:chain"]];
const older = (b) => { for (const [re, to] of FOR_1_21_1) if (re.test(b)) return b.replace(re, to); return b; };

// the kit's yard surface: the commonest height of grass in the plots' front lawns
const lawn = {}; for (const c of kit.cells.values()) { const [x, y, z] = c.pos; if (z >= Z0 && z < Z0 + 4 && /grass_block$/.test(c.block)) lawn[y] = (lawn[y] || 0) + 1; }
const YARD = +Object.entries(lawn).sort((a, b) => b[1] - a[1])[0][0];

let need = site.size[1];
layout.plots.forEach((p, i) => { for (const c of kit.cells.values()) if (c.pos[0] >= W * i && c.pos[0] < W * i + W && c.pos[2] >= Z0) need = Math.max(need, p.pad + GRADE + c.pos[1] - YARD + 1); });
const grow = (g) => { if (g.size[1] >= need) return g; const o = new Grid([g.size[0], need, g.size[2]], { dataVersion: g.dataVersion }); for (const c of g.cells.values()) o.set(...c.pos, c.block, c.state, c.nbt); return o; };
const street = grow(site), placed = [];
layout.plots.forEach((p, i) => {
  const q = Q[p.face], { x0, z0, x1, z1 } = p, py = p.pad + GRADE;
  const map = (lx, lz) => q === 0 ? [x0 + lx, z0 + lz] : q === 1 ? [x1 - lz, z0 + lx] : q === 2 ? [x1 - lx, z1 - lz] : [x0 + lz, z1 - lx];
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) for (let y = py + 1; y < need; y++) if (street.get(x, y, z)) street.set(x, y, z, "air");
  let n = 0;
  for (const c of kit.cells.values()) {
    const [kx, ky, kz] = c.pos; if (kx < W * i || kx >= W * i + W || kz < Z0 || kz >= Z0 + D || ky < YARD) continue;
    if (/air$/.test(c.block)) continue;
    const [x, z] = map(kx - W * i, kz - Z0);
    street.set(x, py + ky - YARD, z, older(c.block), rotateState(c.state, q), c.nbt); n++;
  }
  placed.push({ module: i, face: p.face, pad: p.pad, blocks: n });
});

const diff = (a, b, { air }) => { const o = new Grid(b.size, { dataVersion: b.dataVersion });
  for (let y = 0; y < b.size[1]; y++) for (let z = 0; z < b.size[2]; z++) for (let x = 0; x < b.size[0]; x++) {
    const p = y < a.size[1] ? a.get(x, y, z) : null, q = b.get(x, y, z), pb = p?.block ?? "minecraft:air", qb = q?.block ?? "minecraft:air";
    if (pb === qb && JSON.stringify(p?.state ?? {}) === JSON.stringify(q?.state ?? {})) continue;
    if (/air$/.test(qb) && !air) continue; o.set(x, y, z, qb, q?.state, q?.nbt); }
  return o; };
street.save(`${OUT}/street.nbt`);
diff(original, street, { air: true }).save(`${OUT}/street-changes.nbt`);
diff(site, street, { air: false }).save(`${OUT}/kit-changes.nbt`);
console.log(JSON.stringify({ yard: YARD, height: need, placed }));
