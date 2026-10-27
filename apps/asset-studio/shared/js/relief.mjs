#!/usr/bin/env node
// Relief census: how much of each facade has depth and detail, measured from outside. For each face (south, north,
// east, west) it looks along the face's normal at every (along, y) point of the walls, from the ground up to the eaves,
// and takes the first block it meets.
//   relief: the share of those points whose surface is set back or stands proud of a neighbour by 1+ (articulation)
//   detail: the share that are detail shapes (stairs, slabs, trapdoors, fences, walls, panes, bars, doors, buttons,
//           lanterns, pots, banners, signs, chains): what a flat block wall lacks
// Flat walls fail by number before anyone looks. Thresholds come from quality.json (relief section) when present.
//   node tools/relief.mjs <file.nbt>... [--json] [--faces south,north] [--min-relief 0.3] [--min-detail 0.2]
import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { gunzipSync, inflateSync } from "node:zlib";

function readNbt(buf) {                                          // the same minimal reader as check-asset.mjs
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf); else if (buf[0] === 0x78) buf = inflateSync(buf);
  let o = 0;
  const str = () => { const n = buf.readUInt16BE(o); o += 2; const s = buf.toString("utf8", o, o + n); o += n; return s; };
  const arr = (n, f) => Array.from({ length: n }, f);
  const read = (t) => {
    switch (t) {
      case 1: return buf.readInt8(o++); case 2: o += 2; return buf.readInt16BE(o - 2); case 3: o += 4; return buf.readInt32BE(o - 4);
      case 4: o += 8; return buf.readBigInt64BE(o - 8); case 5: o += 4; return buf.readFloatBE(o - 4); case 6: o += 8; return buf.readDoubleBE(o - 8);
      case 7: { const n = read(3); const v = [...buf.subarray(o, o + n)]; o += n; return v; } case 8: return str();
      case 9: { const et = buf[o++], n = read(3); return arr(n, () => read(et)); }
      case 10: { const c = {}; for (let k = buf[o++]; k !== 0; k = buf[o++]) { const name = str(); c[name] = read(k); } return c; }
      case 11: { const n = read(3); return arr(n, () => read(3)); } case 12: { const n = read(3); return arr(n, () => read(4)); }
      default: throw new Error(`nbt: tag ${t}`);
    }
  };
  if (buf[o++] !== 10) throw new Error("nbt: root is not a compound"); str(); return read(10);
}

const DETAIL = /(_stairs|_slab|_trapdoor|_fence|_fence_gate|_wall|_pane|_bars|_door|_button|lantern|^potted_|flower_pot|_banner|_sign|^chain$|_chain$|lightning_rod|end_rod|_carpet|ladder|scaffolding|^bell$)$|^potted_/;
const SKIP = /^(air|cave_air|structure_void|light)$/;
const PLANT = /(_leaves|grass|fern|flower|tulip|poppy|daisy|orchid|allium|bluet|cornflower|lily|rose|bush|vine|sapling|wheat|carrots|potatoes|beetroots|farmland|dirt|grass_block|hay_block|_log$|_wood$)/;

export function relief(file, { ground = 2 } = {}) {
  const r = readNbt(readFileSync(file)), pal = (r.palette || r.palettes[0]).map((p) => p.Name.replace(/^minecraft:/, ""));
  const [W, H, D] = r.size, cell = new Map();
  for (const b of r.blocks) cell.set(`${b.pos[0]},${b.pos[1]},${b.pos[2]}`, pal[b.state]);
  const at = (x, y, z) => cell.get(`${x},${y},${z}`);
  // the eaves: the lowest layer above which the roof begins is hard to know in general; use the walls' band:
  // layers from ground+1 up to the highest layer where a face still has a non-roof, non-plant hit near its plane
  const faces = {
    south: { n: W, depth: D, hit: (u, y) => { for (let z = D - 1; z >= 0; z--) { const b = at(u, y, z); if (b && !SKIP.test(b)) return [D - 1 - z, b]; } return null; } },
    north: { n: W, depth: D, hit: (u, y) => { for (let z = 0; z < D; z++) { const b = at(W - 1 - u, y, z); if (b && !SKIP.test(b)) return [z, b]; } return null; } },
    east: { n: D, depth: W, hit: (u, y) => { for (let x = W - 1; x >= 0; x--) { const b = at(x, y, D - 1 - u); if (b && !SKIP.test(b)) return [W - 1 - x, b]; } return null; } },
    west: { n: D, depth: W, hit: (u, y) => { for (let x = 0; x < W; x++) { const b = at(x, y, u); if (b && !SKIP.test(b)) return [x, b]; } return null; } },
  };
  const out = {};
  for (const [name, f] of Object.entries(faces)) {
    const grid = new Map();
    for (let y = ground + 1; y < H; y++) for (let u = 0; u < f.n; u++) { const h = f.hit(u, y); if (h && !PLANT.test(h[1]) && !/^(stone|cobblestone|dirt)$/.test(h[1]) ) grid.set(`${u},${y}`, h); }
    // the wall band: rows until the roof starts (a row where most hits are roof stairs or slabs deeper than the wall)
    const depths = [...grid.values()].map((h) => h[0]).sort((a, b) => a - b), base = depths[Math.floor(depths.length * 0.25)] ?? 0;
    let n = 0, articulated = 0, detail = 0;
    for (const [k, [d, b]] of grid) {
      if (d > base + 3) continue;                                // far behind the face: roof slope or another mass
      n++;
      const [u, y] = k.split(",").map(Number);
      const nb = [[u - 1, y], [u + 1, y], [u, y - 1], [u, y + 1]].map(([a, c]) => grid.get(`${a},${c}`)).filter(Boolean);
      if (nb.some((h) => Math.abs(h[0] - d) >= 1)) articulated++;
      if (DETAIL.test(b)) detail++;
    }
    out[name] = { points: n, relief: n ? +(articulated / n).toFixed(2) : 0, detail: n ? +(detail / n).toFixed(2) : 0 };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  const q = existsSync(new URL("../quality.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("../quality.json", import.meta.url), "utf8")).relief || {} : {};
  const minR = +opt("--min-relief", q.min_relief ?? 0.3), minD = +opt("--min-detail", q.min_detail ?? 0.2);
  const faces = opt("--faces", q.faces || "south,north,east,west").split(",");
  const files = argv.filter((a, i) => a.endsWith(".nbt") && !argv[i - 1]?.startsWith("--"));
  let ok = true; const all = [];
  for (const f of files) {
    const r = relief(f), pass = faces.every((k) => r[k].relief >= minR && r[k].detail >= minD); ok &&= pass;
    all.push({ file: basename(f), pass, ...r });
    if (!argv.includes("--json")) console.log(`${pass ? "PASS" : "FAIL"}  ${basename(f)}  ${Object.entries(r).map(([k, v]) => `${k} relief ${v.relief} detail ${v.detail}`).join(" | ")}`);
  }
  if (argv.includes("--json")) console.log(JSON.stringify(all, null, 2));
  process.exit(ok ? 0 : 1);
}
