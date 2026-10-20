import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989983";
const W = 20, H = 38, D = 17;
const STOREYS = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and ground -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const rel = new Map();
let B = 0; // common floor datum = highest cell ground (relative to lowest)
for (const [k, gr] of ground) {
  const r = gr - minG;
  rel.set(k, r);
  B = Math.max(B, r);
}

// storey height: 5 blocks, reduced only if the roof would overflow the grid
const SH = Math.max(3, Math.min(5, Math.floor((36 - B) / STOREYS)));
const R = B + STOREYS * SH; // roof deck row
const P = R + 1;            // parapet row

const inFp = (x, z) => ground.has(key(x, z));
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];
const outs = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
const isEdge = (x, z) => inFp(x, z) && outs(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- 1. foundation: solid from y 0 up to the datum under every cell -------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. storeys ------------------------------------------------------------
for (let s = 0; s < STOREYS; s++) {
  const y0 = B + s * SH;
  const ground_floor = s === 0;

  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    const o = outs(x, z);

    if (o.length === 0) {
      // interior: floor slab, air gap above, occasional warm light behind glass
      put(x, y0, z, "light_gray_concrete");
      const nearEdge = DIRS.some((d) => isEdge(x + d.dx, z + d.dz));
      if (nearEdge && (x * 31 + z * 17 + s * 7) % 5 === 0) {
        put(x, y0 + 2, z, "glowstone");
      }
      continue;
    }

    // exterior: storey line band
    put(x, y0, z, ground_floor ? "stone_bricks" : "white_concrete");

    const corner = o.length >= 2;
    const dir = o[0];
    const idx = dir.dx !== 0 ? z : x; // position along the facade
    const pier = corner || idx % 3 === 0;

    for (let y = y0 + 1; y <= y0 + SH - 1; y++) {
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (ground_floor && y === y0 + SH - 1) {
        put(x, y, z, "smooth_stone"); // shopfront lintel
      } else {
        const props = dir.dx !== 0 ? PANE_EW : PANE_NS;
        put(x, y, z, "light_blue_stained_glass_pane", props);
      }
    }
  }
}

// ---- 3. roof: cornice, parapet, roof deck ---------------------------------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) {
    put(x, R, z, "smooth_quartz");
    put(x, P, z, "white_concrete");
  } else {
    put(x, R, z, "light_gray_concrete");
  }
}

// ---- 4. rooftop plant room (ring walls, roof, lightning rod) --------------
const cx = 10, cz = 8;
const rect = [];
for (let x = cx - 3; x <= cx + 2; x++)
  for (let z = cz - 2; z <= cz + 2; z++)
    if (inFp(x, z) && !isEdge(x, z)) rect.push([x, z]);
const rectSet = new Set(rect.map(([x, z]) => key(x, z)));
for (const [x, z] of rect) {
  const ring = !rectSet.has(key(x - 1, z)) || !rectSet.has(key(x + 1, z)) ||
               !rectSet.has(key(x, z - 1)) || !rectSet.has(key(x, z + 1));
  for (let y = R + 1; y <= R + 2; y++) {
    if (ring) put(x, y, z, "light_gray_concrete");
  }
  put(x, R + 3, z, "stone_bricks");
}
put(cx, R + 4, cz, "lightning_rod");
put(cx, R + 5, cz, "lightning_rod");

// ---- 5. entrance on the south face, with door and canopy ------------------
const south = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outs(x, z).some((d) => d.n === "south")) south.push([x, z]);
}
if (south.length) {
  const mx = south.reduce((a, [x]) => a + x, 0) / south.length;
  const [ex, ez] = south.reduce((best, c) =>
    Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best);
  const yb = B + 1;
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(ex, yb, ez, "oak_door", doorProps("lower"));
  put(ex, yb + 1, ez, "oak_door", doorProps("upper"));
  // canopy over the doorway
  for (let dx = -1; dx <= 1; dx++) {
    if (inFp(ex + dx, ez)) {
      put(ex + dx, B + 3, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // lit entrance lantern
  put(ex, B + 3, ez - 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
