import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001289.cells.json`, "utf8"));

const W = 44, H = 42, D = 69;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> { x, z, ground, roof }
const map = new Map();
let B = Infinity;     // lowest ground under the footprint (storey datum)
let maxR = 0;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const r = Math.min(H - 6, Math.round(roof));
  map.set(`${x},${z}`, { x, z, ground, roof: r });
  B = Math.min(B, ground);
  maxR = Math.max(maxR, r);
}
if (!Number.isFinite(B)) B = 0;

const has = (x, z) => map.has(`${x},${z}`);
const insetBy = (x, z, d) => {
  for (let dx = -d; dx <= d; dx++)
    for (let dz = -d; dz <= d; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// ---- Main massing, facade and roof ----
for (const c of map.values()) {
  const { x, z, ground, roof } = c;
  const R = Math.max(roof, ground + 3);

  // Foundation below this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const nN = has(x, z - 1), nS = has(x, z + 1);
  const nW = has(x - 1, z), nE = has(x + 1, z);
  const ext = !(nN && nS && nW && nE);
  const alongZ = !nW || !nE;   // exposed west/east -> facade runs along z
  const alongX = !nN || !nS;   // exposed north/south -> facade runs along x
  const along = alongZ && !alongX ? z : alongX && !alongZ ? x : x + z;

  for (let y = ground; y <= R; y++) {
    const rel = y - B;
    const sIdx = Math.floor(rel / 3);
    const band = rel % 3;

    // Roof cap: cornice on the perimeter, tar membrane inside
    if (y === R) {
      put(x, y, z, ext ? "smooth_stone" : "gray_concrete");
      continue;
    }

    // Interior: floor slabs only, air elsewhere
    if (!ext) {
      if (band === 0) put(x, y, z, "white_concrete");
      continue;
    }

    // Exterior shell: parapet, spandrels, piers, glazing
    let b;
    if (y === R - 1) {
      b = "light_gray_concrete";
    } else if (band === 0) {
      b = sIdx === 0 ? "polished_granite" : "light_gray_concrete";
    } else {
      const pier = along % 3 === 0;
      if (sIdx === 0) {
        b = pier ? "polished_granite" : "light_blue_stained_glass";
      } else {
        b = pier ? "white_concrete" : "light_blue_stained_glass";
      }
      // sparse warm-lit offices behind the glass
      if (b === "light_blue_stained_glass" && sIdx > 0 && ((x * 73 + y * 31 + z * 17) % 61 === 0)) {
        b = "glowstone";
      }
    }
    put(x, y, z, b);
  }

  // Mechanical penthouse on the highest, well-inset roof
  if (roof >= maxR && insetBy(x, z, 3)) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
    put(x, R + 3, z, "smooth_stone");
  }
}

// ---- Main entrance on the south (high-z) street face ----
for (const c of map.values()) {
  if (has(c.x, c.z + 1)) continue;
  const gy = c.ground;

  if (c.x === 21) {
    // doors
    put(c.x, gy, c.z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(c.x, gy + 1, c.z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // lintel over the door
    put(c.x, gy + 2, c.z, "polished_granite");
    // warm lanterns flanking the door, inside the entrance bay
    put(c.x - 1, gy + 2, c.z, "lantern", { hanging: "false", waterlogged: "false" });
    put(c.x + 1, gy + 2, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  if (c.x === 20 || c.x === 22) {
    // granite pilasters framing the entrance, two storeys tall
    put(c.x, gy, c.z, "polished_granite");
    put(c.x, gy + 1, c.z, "polished_granite");
    put(c.x, gy + 2, c.z, "polished_granite");
  }

  if (c.x >= 20 && c.x <= 22) {
    // stone hood over the entrance, resting on the pilasters and lintel
    put(c.x, gy + 3, c.z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC1001289.nbt`);
