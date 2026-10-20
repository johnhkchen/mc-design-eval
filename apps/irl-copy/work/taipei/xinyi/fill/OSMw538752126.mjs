import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 25 x 17 footprint, roof ~11 blocks above lowest ground.
// Reading: a 1990s-2000s Xinyi mid-rise office/commercial block (two storeys of
// tall glazed bays over a shopfront, quartz-tiled facade, white concrete piers,
// stone base, roof plant and a lightning rod). Roof plane sits at y 10, parapet at 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752126";
const W = 25, H = 23, D = 17;
const ROOF = 10;      // roof deck / cornice level
const PARAPET = 11;   // parapet top course
const TOP_WALL = 9;   // last wall course below cornice

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(TOP_WALL, Math.round(gr))));
}
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => gmap.has(key(x, z));
const grd = (x, z) => gmap.get(key(x, z));

const P = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for an edge cell at height y. t = coordinate along the face.
function facadeBlock(y, b, t, axis, corner) {
  if (corner) return ["white_concrete"];
  const rel = y - b;
  if (rel === 4 || rel === 8 || y === TOP_WALL) return ["smooth_quartz"];
  if ((rel >= 1 && rel <= 3) || (rel >= 5 && rel <= 7)) {
    if (t % 3 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass_pane", paneProps(axis)];
  }
  return ["smooth_quartz"];
}

// Pass 1: foundations, slabs, walls, roof deck.
for (const [x, z] of [...gmap.keys()].map((k) => k.split(",").map(Number))) {
  const b = grd(x, z);

  // Foundation fill up to the cell's ground, then base course.
  for (let y = 0; y < b; y++) P(x, y, z, "stone");
  P(x, b, z, "smooth_stone");

  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const edge = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);

  // Second-storey floor slab (spandrel line on the facade).
  if (b + 4 <= TOP_WALL) P(x, b + 4, z, "smooth_stone");

  if (edge) {
    // Facade axis: N/S faces run along x, E/W faces run along z.
    const axis = (nN || nS) ? "x" : "z";
    const t = axis === "x" ? x : z;
    for (let y = b + 1; y <= TOP_WALL; y++) {
      const [id, props] = facadeBlock(y, b, t, axis, corner);
      P(x, y, z, id, props);
    }
    P(x, ROOF, z, "smooth_stone");          // cornice
    P(x, PARAPET, z, "white_concrete");     // parapet
  } else {
    // Interior: air gap behind glass, roof deck overhead.
    P(x, ROOF, z, "gray_concrete");
    // Warm lamps on the floor just inside the glazing.
    const nearEdge = !inF(x, z - 1) || !inF(x, z + 1) || !inF(x - 1, z) || !inF(x + 1, z)
      || !inF(x, z - 2) || !inF(x, z + 2) || !inF(x - 2, z) || !inF(x + 2, z);
    if (nearEdge && (x * 3 + z) % 5 === 0 && b + 1 <= TOP_WALL) {
      P(x, b + 1, z, "glowstone");
    }
  }
}

// Pass 2: main entrance on the south (+z) face, centred on the frontage.
const southCells = [];
for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inF(x, z + 1)) southCells.push([x, z]);
}
if (southCells.length) {
  const xs = southCells.map((c) => c[0]).sort((a, b) => a - b);
  const x0 = xs[Math.floor(xs.length / 2)];
  const zc = southCells.find((c) => c[0] === x0)[1];
  const b = grd(x0, zc);

  // Clear glazing in the door cell, then place door (two blocks high).
  P(x0, b + 1, zc, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  P(x0, b + 2, zc, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });

  // Canopy/lintel over the entrance, spanning the bay.
  for (const [cx, cz] of southCells) {
    if (Math.abs(cx - x0) <= 1) {
      const bb = grd(cx, cz);
      P(cx, bb + 3, cz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }

  // Shopfront glazing either side of the door at the base.
  for (const [cx, cz] of southCells) {
    if (Math.abs(cx - x0) === 2) {
      const bb = grd(cx, cz);
      P(cx, bb + 1, cz, "light_blue_stained_glass_pane", paneProps("x"));
      P(cx, bb + 2, cz, "light_blue_stained_glass_pane", paneProps("x"));
    }
  }
}

// Pass 3: roof plant on the interior deck and a lightning rod.
const interior = [...gmap.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) =>
    inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1));
if (interior.length) {
  const cxs = interior.map((c) => c[0]);
  const czs = interior.map((c) => c[1]);
  const cx = Math.round((Math.min(...cxs) + Math.max(...cxs)) / 2);
  const cz = Math.round((Math.min(...czs) + Math.max(...czs)) / 2);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      if (!inF(x, z)) continue;
      if (dx === 0 && dz === 0) {
        P(x, PARAPET, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
        P(x, PARAPET + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
        P(x, PARAPET + 2, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      } else if ((dx + dz) % 2 === 0) {
        P(x, PARAPET, z, "light_gray_concrete");
        P(x, PARAPET + 1, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
