import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys over a granite
// shopfront plinth, white tiled-concrete piers, tinted glazing in
// dark-framed bays, light-grey string courses and cornice, a parapet, and a
// central roof plant room. Floor levels are global (G0 + L), so the roof is
// level at G0 + 11 and the downhill side shows extra foundation below.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119875";
const W = 32, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : raw.cells ?? []).map(([x, z, gr]) => [
  x, z, Math.round(gr),
]);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const cellSet = new Map();
for (const [x, z, gr] of list) cellSet.set(key(x, z), gr);
const has = (x, z) => cellSet.has(key(x, z));

const G0 = Math.min(...list.map((c) => c[2]));
const roofL = 11;

// Outward directions missing from the footprint for a cell.
function missingSides(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  return out;
}

// Pick the entrance: a south-facing single-sided perimeter cell nearest the
// footprint's centre line; fall back to any single-sided cell.
const xs = list.map((c) => c[0]);
const zs = list.map((c) => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;

let entrance = null;
{
  const cands = list
    .map(([x, z]) => ({ x, z, s: missingSides(x, z) }))
    .filter((c) => c.s.length === 1);
  const south = cands.filter((c) => c.s[0] === "south");
  const pool = south.length ? south : cands;
  pool.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
  if (pool.length) entrance = { x: pool[0].x, z: pool[0].z, facing: pool[0].s[0] };
}

// Facade material by global level L (y = G0 + L) and along-wall index u.
function facade(L, u, facing, isPier) {
  if (L === 1) return ["polished_granite"];
  if (L === 4 || L === 5) return ["light_gray_concrete"];
  if (L === 10) return ["light_gray_concrete"];
  if (L === 11) return ["smooth_stone"];
  if (L === 6 || L === 9) return ["white_concrete"];
  if (L === 2 || L === 3 || L === 7 || L === 8) {
    if (isPier) return ["white_concrete"];
    const lit = (L === 2 || L === 7) &&
      ((u * 7 + L * 2 + (facing === "north" || facing === "south" ? 3 : 5)) % 11 === 0);
    if (lit) return ["shroomlight"];
    if (L === 2 || L === 3) return ["glass"];
    return ["light_blue_stained_glass"];
  }
  return ["white_concrete"];
}

// Foundation and building columns.
for (const [x, z, gr] of list) {
  const gd = Math.max(0, Math.min(gr, H - 14));

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gd; y++) {
    put(x, y, z, y === gd ? "polished_andesite" : "stone_bricks");
  }

  const sides = missingSides(x, z);
  const perim = sides.length > 0;
  const corner = sides.length >= 2;
  const facing = sides[0];
  const isEntrance = entrance && entrance.x === x && entrance.z === z;
  const onNS = facing === "north" || facing === "south";

  for (let L = 1; L <= roofL; L++) {
    const y = G0 + L;
    if (y <= gd || y >= H) continue;

    if (!perim) {
      // Interior: floor slabs at L5 and L10, air otherwise.
      if (L === 5 || L === 10) put(x, y, z, "smooth_quartz");
      continue;
    }

    if (corner) {
      if (L === 1) put(x, y, z, "polished_granite");
      else if (L === 11) put(x, y, z, "smooth_stone");
      else if (L === 4 || L === 5 || L === 10) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "white_concrete");
      continue;
    }

    const u = onNS ? x : z;
    const isPier = u % 3 === 0;

    if (isEntrance) {
      if (L === 1) {
        put(x, y, z, "dark_oak_door", {
          facing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (L === 2) {
        put(x, y, z, "dark_oak_door", {
          facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (L === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }

    const [id] = facade(L, u, facing, isPier);
    put(x, y, z, id);
  }

  // Roof plant room on interior cells near the centre.
  if (!perim && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) {
    const y11 = G0 + 11;
    if (y11 > gd && y11 < H) put(x, y11, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
      const y12 = G0 + 12;
      if (y12 > gd && y12 < H) {
        put(x, y12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
