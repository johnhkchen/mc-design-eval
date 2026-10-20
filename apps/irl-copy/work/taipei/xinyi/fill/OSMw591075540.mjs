import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075540";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 20, D = 20;
const g = new Voxels([W, H, D]);

// Two-storey low-rise shophouse: smooth quartz render over concrete frame,
// stone-brick plinth and cornice, shopfront glazing on the ground floor,
// punched windows above, flat roof with a parapet and roof plant.
const ROOF = 7;   // roof deck (top surface of solid massing)
const TOP = 8;    // parapet block row, 8 blocks above lowest ground

const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(6, Math.round(gr))));
}
const key = (x, z) => `${x},${z}`;
const has = (x, z) => G.has(key(x, z));
const gr = (x, z) => G.get(key(x, z));

const OFFS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const miss = (x, z) => OFFS.filter(([dx, dz]) => !has(x + dx, z + dz));

const info = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  const m = miss(x, z);
  info.set(key(x, z), {
    edge: m.length > 0,
    corner: m.length >= 2,
    n: m[0] ? m[0][2] : null,
    dx: m[0] ? m[0][0] : 0,
    dz: m[0] ? m[0][1] : 0,
  });
}
const I = (x, z) => info.get(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const air = (x, y, z) => put(x, y, z, "air");

const paneProps = (n) =>
  n === "north" || n === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- Phase 1: massing, foundation, plinth, bands, cornice, parapet ----
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const gg = gr(x, z);
  const c = I(x, z);
  for (let y = 0; y <= ROOF; y++) {
    if (y < gg) { put(x, y, z, "stone_bricks"); continue; }
    if (c.edge) {
      if (y === gg) put(x, y, z, "polished_andesite");
      else if (y === 3) put(x, y, z, "stone_bricks");          // ground-floor lintel
      else if (y === 4) put(x, y, z, "light_gray_concrete");   // storey line
      else if (y === ROOF) put(x, y, z, "stone_bricks");       // cornice
      else put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, y === ROOF ? "smooth_stone" : "white_concrete");
    }
  }
  if (c.edge) put(x, TOP, z, "smooth_quartz"); // parapet
}

// ---- Phase 2: windows, shopfronts, air gaps and warm lights ----
const lit = (i, y, f) => (i + y + f) % 4 === 0;
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const c = I(x, z);
  if (!c.edge || c.corner || !c.n) continue;
  const gg = gr(x, z);
  const i = c.dz !== 0 ? x - minX : z - minZ;
  const f = c.n === "north" || c.n === "west" ? 0 : 1;
  const ix = x - c.dx, iz = z - c.dz;
  const inwardOk = has(ix, iz) && !I(ix, iz).edge;

  // Ground-floor shopfront: glass in two rows, piers between bays
  if (i % 3 !== 0) {
    for (const y of [1, 2]) {
      if (y <= gg) continue;
      put(x, y, z, "glass_pane", paneProps(c.n));
      if (inwardOk) {
        air(ix, y, iz);
        if (y === 1 && lit(i, y, f)) put(ix, y, iz, "glowstone");
      }
    }
  }

  // Upper storey: punched window bays every third cell
  if (i % 3 === 1) {
    for (const y of [5, 6]) {
      if (y <= gg) continue;
      put(x, y, z, "glass_pane", paneProps(c.n));
      if (inwardOk) {
        air(ix, y, iz);
        if (y === 5 && lit(i, y, f)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- Phase 3: recessed entrance on the north (z-min) face, nearest the centre ----
const cx = (minX + maxX) / 2;
let door = null;
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const c = I(x, z);
  if (!c.edge || c.corner || c.n !== "north") continue;
  const gg = gr(x, z);
  if (gg > 2) continue;
  const ix = x - c.dx, iz = z - c.dz;
  if (!has(ix, iz) || I(ix, iz).edge) continue;
  const score = Math.abs(x - cx) + gg * 3;
  if (!door || score < door.score) door = { x, z, gg, ix, iz, score };
}
if (door) {
  const { x, z, gg, ix, iz } = door;
  air(ix, gg, iz);
  air(ix, gg + 1, iz);
  put(x, gg, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // small warm lantern in the recess above the door
  if (gg + 2 <= 3) put(ix, gg + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- Phase 4: roof plant (two small housings on interior roof) ----
const plantTargets = [
  [minX + Math.round((maxX - minX) / 3), Math.round((minZ + maxZ) / 2)],
  [minX + Math.round(2 * (maxX - minX) / 3), Math.round((minZ + maxZ) / 2)],
];
for (const [tx, tz] of plantTargets) {
  let placed = false;
  for (let r = 0; r <= 4 && !placed; r++) {
    for (let dx = -r; dx <= r && !placed; dx++) {
      for (let dz = -r; dz <= r && !placed; dz++) {
        const x0 = tx + dx, z0 = tz + dz;
        const quad = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
        if (quad.every(([x, z]) => has(x, z) && !I(x, z).edge)) {
          for (const [x, z] of quad) {
            put(x, TOP, z, "light_gray_concrete");
            put(x, TOP + 1, z, "light_gray_concrete");
          }
          placed = true;
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
