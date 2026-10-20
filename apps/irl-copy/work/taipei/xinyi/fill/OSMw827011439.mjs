import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011439";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 38, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let B = 0;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  B = Math.max(B, gr);
}
const list = [...ground.keys()].map((k) => k.split(",").map(Number));
const has = (x, z) => ground.has(key(x, z));

// outward normal of a facade cell (first missing 4-neighbour), or null if interior
const out = (x, z) => {
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (!has(x + dx, z + dz)) return [dx, dz];
  }
  return null;
};

// ---- massing: 5 storeys of 5 blocks, roof at about y 25-26 --------------------
// Floors are level at B (highest ground under footprint); foundation fills below.
const n = Math.max(3, Math.min(5, Math.floor((25 - B) / 5)));
const R = B + 5 * n; // roof slab level

// ---- entrance: prefer the -z (north) face, nearest the centre ------------------
const cx = (W - 1) / 2;
let entrance = null;
{
  const prefs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [pdx, pdz] of prefs) {
    const cand = list.filter(([x, z]) => {
      const o = out(x, z);
      return o && o[0] === pdx && o[1] === pdz;
    });
    if (cand.length) {
      cand.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
      entrance = cand[0];
      break;
    }
  }
}
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

const dirName = ([dx, dz]) =>
  dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east";

const paneProps = (o) =>
  o[1] !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- pass 1: foundation, floor slabs, roof slab ----------------------------
for (const [x, z] of list) {
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
  for (let k = 0; k <= n; k++) {
    const y = B + 5 * k;
    g.set(x, y, z, k === n ? "smooth_stone" : "light_gray_concrete");
  }
}

// ---- pass 2: facade, storey bands, windows, entrance -----------------------
for (const [x, z] of list) {
  const o = out(x, z);
  if (!o) continue;
  const pillar = (x + z) % 2 === 0;

  for (let k = 0; k < n; k++) {
    const F = B + 5 * k;
    // sill / plinth course
    g.set(x, F + 1, z, k === 0 ? "polished_andesite" : "light_gray_concrete");
    // window zone
    for (const yy of [F + 2, F + 3]) {
      if (pillar) {
        g.set(x, yy, z, "smooth_quartz");
      } else {
        const id = k === 0 ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane";
        g.set(x, yy, z, id, paneProps(o));
      }
    }
    // head course / storey line
    g.set(x, F + 4, z, "smooth_quartz");

    // warm light behind some windows (interior air cell, not a facade cell)
    if (!pillar && (x + z + k) % 3 === 0) {
      const ix = x + o[0] * -1;
      const iz = z + o[1] * -1;
      if (has(ix, iz) && out(ix, iz) === null) {
        g.set(ix, F + 2, iz, "glowstone");
      }
    }
  }

  // parapet
  g.set(x, R + 1, z, "light_gray_concrete");
  if (pillar) g.set(x, R + 2, z, "smooth_quartz");
}

// entrance: glass shopfront, door, transom, canopy band over the bay
if (entrance) {
  const [ex, ez] = entrance;
  const o = out(ex, ez);
  const facing = dirName(o);
  g.set(ex, B + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, B + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, B + 3, ez, "light_blue_stained_glass_pane", paneProps(o));
  // canopy: slab band across the entrance bay and its neighbours along the facade
  for (const [dx, dz] of [[0, 0], [o[1] !== 0 ? 1 : 0, o[0] !== 0 ? 1 : 0], [o[1] !== 0 ? -1 : 0, o[0] !== 0 ? -1 : 0]]) {
    const bx = ex + dx, bz = ez + dz;
    if (has(bx, bz) && out(bx, bz)) {
      g.set(bx, B + 4, bz, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// ---- pass 3: rooftop water tank and plant --------------------------------
const tcx = Math.floor(W / 2), tcz = Math.floor(D / 2);
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    if (Math.abs(dx) + Math.abs(dz) === 2) continue; // rounded: skip corners
    const x = tcx + dx, z = tcz + dz;
    if (!has(x, z) || out(x, z)) continue;
    for (let y = R + 1; y <= R + 3; y++) g.set(x, y, z, "white_concrete");
    g.set(x, R + 4, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
