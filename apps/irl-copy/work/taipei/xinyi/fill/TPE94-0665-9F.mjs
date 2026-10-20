import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0665-9F: 2005 Xinyi mid-rise office tower, ~9 storeys, blue-tinted glass
// curtain wall over white concrete spandrels, granite plinth, shopfront at grade,
// quartz corner and mullion frames, rooftop plant penthouse with antenna mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0665-9F";
const W = 10, H = 57, D = 30;
const ROOF = 45;          // roof deck level (lidar: ~45 above lowest ground)
const PH_BASE = 46;       // penthouse starts above roof deck
const PH_TOP = 49;        // penthouse walls end here
const PH_CAP = 50;        // penthouse cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));
const has = (x, z) => ground.has(k(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Ring index: 0 = facade cell (touches outside), 1 = first interior ring, etc.
const ring = new Map();
const q = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) {
    ring.set(k(x, z), 0);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const r = ring.get(k(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !ring.has(k(nx, nz))) {
      ring.set(k(nx, nz), r + 1);
      q.push([nx, nz]);
    }
  }
}

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const mid = Math.floor(W / 2);

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const r = ring.get(k(x, z));
  const missing = NB.filter(([dx, dz]) => !has(x + dx, z + dz));
  const corner = missing.length >= 2;
  const onZFace = missing.some(([, dz]) => dz !== 0);   // north/south face
  const pos = onZFace ? x : z;
  const mull = corner || pos % 3 === 0;
  const gTop = 5 * Math.ceil((gr + 1) / 5) - 1;          // top row of ground storey
  const onFront = missing.some(([dx, dz]) => dx === 0 && dz === -1) && (x === mid - 1 || x === mid);
  const entrance = onFront && gr + 2 <= gTop;
  const canopy = onFront && x >= mid - 2 && x <= mid + 1;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  // Interior: ground slab, floor slabs at each storey line, roof deck
  if (r >= 1) {
    put(x, gr, z, "smooth_stone");
    for (let y = gr + 1; y < ROOF; y++) {
      if (y % 5 === 0) put(x, y, z, "smooth_stone");
    }
    put(x, ROOF, z, "light_gray_concrete");

    // Warm lamps set back behind the glass (ring 2, one air gap in from the facade)
    if (r === 2) {
      for (let y = gr + 1; y < ROOF; y++) {
        const ground1 = y <= gTop;
        if (ground1 && y === gr + 2 && (x + z) % 4 === 0) put(x, y, z, "glowstone");
        if (!ground1 && y % 5 === 2 && (x + z) % 3 === 0) put(x, y, z, "glowstone");
      }
    }

    // Small rooftop AC units
    if (r === 1 && (x + z) % 7 === 0) put(x, ROOF + 1, z, "iron_block");

    // Plant penthouse: ring 3 is a glazed wall, deeper rings are solid plant rooms
    if (r >= 3) {
      for (let y = PH_BASE; y <= PH_TOP; y++) {
        if (r >= 4) {
          put(x, y, z, "light_gray_concrete");
        } else {
          const pm = (x + z) % 3 === 0;
          let id;
          if (y === PH_BASE || y === PH_TOP) id = "white_concrete";
          else id = pm ? "smooth_quartz" : "light_blue_stained_glass";
          put(x, y, z, id);
        }
      }
      put(x, PH_CAP, z, "smooth_quartz");
    }
  }

  // Facade (ring 0)
  if (r === 0) {
    for (let y = gr; y <= ROOF + 1; y++) {
      if (y >= ROOF) {
        // parapet
        put(x, y, z, "smooth_quartz");
        continue;
      }

      if (y <= gTop) {
        // Ground storey: granite plinth, shopfront, entrance
        if (y === gr) {
          put(x, y, z, entrance ? "smooth_stone" : "polished_granite");
          continue;
        }
        if (y === gTop) {
          put(x, y, z, canopy ? "black_concrete" : "white_concrete");
          continue;
        }
        if (entrance && (y === gr + 1 || y === gr + 2)) {
          const hinge = x === mid - 1 ? "left" : "right";
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "iron_door", {
            facing: "north", half, hinge, open: "false", powered: "false",
          });
          continue;
        }
        if (entrance && y === gr + 3) {
          put(x, y, z, "light_blue_stained_glass");
          continue;
        }
        // Shopfront mullions in light stone so the base does not read as solid black
        put(x, y, z, mull ? "light_gray_concrete" : "light_blue_stained_glass");
        continue;
      }

      // Upper storeys: white concrete spandrel at each storey line, glass between
      if (y % 5 === 0) put(x, y, z, mull ? "smooth_quartz" : "white_concrete");
      else put(x, y, z, mull ? "smooth_quartz" : "light_blue_stained_glass");
    }
  }
}

// Antenna mast on the penthouse centre, topped by a lightning rod for legibility
if (has(mid, Math.floor(D / 2))) {
  for (let y = PH_CAP + 1; y <= PH_CAP + 5; y++) {
    put(mid, y, Math.floor(D / 2), "iron_bars");
  }
  put(mid, PH_CAP + 6, Math.floor(D / 2), "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
