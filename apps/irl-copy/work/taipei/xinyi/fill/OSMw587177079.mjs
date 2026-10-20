import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587177079";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 12 x 13 footprint, roof ~25 blocks above lowest ground: five storeys of 5 blocks,
// mid-century Taipei concrete mid-rise: quartz-clad piers, white spandrels, glazed bays,
// stone base course, shopfront storey, parapet and a small rooftop plant room.
const W = 12, H = 37, D = 13;
const STOREY = 5;
const ROOF_Y = 24;

const minG = Math.min(...cells.map((c) => c[2]));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr - minG);

const gAt = (x, z) => G.get(`${x},${z}`);
const inside = (x, z) => G.has(`${x},${z}`);
const exposed = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  e: !inside(x + 1, z),
  w: !inside(x - 1, z),
});
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.n || e.s || e.e || e.w;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (ns) =>
  ns
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const lights = [];

function facadeCell(x, z, y, e) {
  const ns = e.n || e.s;
  const ew = e.e || e.w;
  const corner = ns && ew;
  let pier;
  if (corner) pier = true;
  else if (ns) pier = x % 3 === 0 || x === W - 1;
  else pier = z % 3 === 0 || z === D - 1;

  const storey0 = y < STOREY;

  // Entrance: centre bay of the north face, glazed double door.
  if (e.n && x === 5 && z === 0 && (y === 1 || y === 2)) {
    const half = y === 1 ? "lower" : "upper";
    put(x, y, z, "oak_door", {
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    return "door";
  }

  if (pier) {
    if (y % STOREY === 4) return ["white_concrete"];
    if (storey0 && y === 1) return ["stone_bricks"];
    return ["smooth_quartz"];
  }
  if (y % STOREY === 4) return ["white_concrete"];
  if (storey0) {
    if (y === 1) return ["stone_bricks"];
    return ["pane", ns];
  }
  if (y % STOREY === 1) return ["gray_concrete"];
  return ["pane", ns];
}

for (const [x, z, _] of cells) {
  const ground = gAt(x, z);
  const perim = isPerim(x, z);
  const e = exposed(x, z);

  for (let y = 0; y <= 26; y++) {
    // Foundation up to the cell's own ground.
    if (y < ground) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    // Roof slab over the whole footprint; perimeter reads as cornice.
    if (y === ROOF_Y) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // Parapet on perimeter only.
    if (y === 25) {
      if (perim) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === 26) {
      if (perim) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    // Floor slabs / storey lines across the whole footprint.
    if (y % STOREY === 0) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // Facade rows on perimeter; interior stays air behind the glass.
    if (perim) {
      const r = facadeCell(x, z, y, e);
      if (r === "door") continue;
      const [id, ns] = r;
      if (id === "pane") {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(ns));
        // Warm light in some upper-storey bays, placed just behind the glass.
        if (y >= STOREY && ((x * 5 + z * 7 + y * 3) % 9 === 0)) {
          const outN = e.n, outS = e.s, outE = e.e;
          let dx = 0, dz = 0;
          if (outN) dz = 1;
          else if (outS) dz = -1;
          else if (outE) dx = -1;
          else dx = 1;
          lights.push({ x: x + dx, y, z: z + dz, gx: x, gz: z });
        }
      } else {
        put(x, y, z, id);
      }
    }
  }
}

// Glowstone behind glass, only where the inner cell is genuine interior space.
for (const L of lights) {
  if (!inside(L.x, L.z) || isPerim(L.x, L.z)) continue;
  if (L.y < gAt(L.x, L.z)) continue;
  put(L.x, L.y, L.z, "glowstone");
}

// Rooftop plant room and lightning rod.
for (let x = 3; x <= 8; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!inside(x, z) || isPerim(x, z)) continue;
    put(x, 25, z, "white_concrete");
    put(x, 26, z, "white_concrete");
    put(x, 27, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (inside(9, 6)) {
  for (let y = 25; y <= 28; y++) {
    put(9, y, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
