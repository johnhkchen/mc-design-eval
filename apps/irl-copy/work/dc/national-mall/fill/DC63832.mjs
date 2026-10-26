import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63832.cells.json`, "utf8"));

const W = 44, H = 33, D = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, rf] of cells) info.set(key(x, z), { gr, rf });
const has = (x, z) => info.has(key(x, z));

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

function facesOf(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
}

const STOREY = 4;

// Pass 1: foundations, floors, roof deck, with storeys snapped to the lidar roof.
const plan = new Map();
for (const [x, z, gr0, rf0] of cells) {
  const gr = Math.max(0, Math.min(H - 8, gr0));
  const n = Math.max(2, Math.round((rf0 - gr) / STOREY));
  const deck = Math.min(H - 4, gr + n * STOREY);
  plan.set(key(x, z), { gr, deck });

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_quartz");
  for (let k = 1; k < n; k++) put(x, gr + k * STOREY, z, "smooth_quartz");
  put(x, deck - 1, z, "stone");
}

// Front entrance: north-facing edge cell nearest the middle of the run.
const northEdge = cells.filter(([x, z]) => !has(x, z - 1)).map(([x, z]) => [x, z]);
let doorX = null, doorZ = null;
if (northEdge.length) {
  const xs = northEdge.map(([x]) => x);
  const mid = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
  let best = null;
  for (const [x, z] of northEdge) {
    const d = Math.abs(x - mid);
    if (!best || d < best.d || (d === best.d && z < best.z)) best = { x, z, d };
  }
  doorX = best.x; doorZ = best.z;
}

// Pass 2: facade, cornice, lights, entrance, rooftop plant.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { gr, deck } = plan.get(key(x, z));
  const f = facesOf(x, z);

  if (f.length === 0) {
    // Interior: rooftop plant on a sparse grid, set back from the parapet.
    if (x % 10 === 5 && z % 8 === 4 && deck + 3 < H) {
      for (let dx = 0; dx < 2; dx++)
        for (let dz = 0; dz < 2; dz++)
          for (let dy = 0; dy < 2; dy++)
            put(x + dx, deck + dy, z + dz, "light_gray_concrete");
    }
    continue;
  }

  const corner = f.length >= 2;
  const face = f[0];
  const t = face === "W" || face === "E" ? z : x;

  for (let y = gr; y <= deck - 1; y++) {
    const rel = y - gr;
    let b;
    if (y === gr) b = "polished_granite";              // base course
    else if (corner) b = "smooth_quartz";              // corner column, full height
    else if (y === deck - 1) b = "smooth_quartz";      // cornice course
    else if (rel % STOREY === 0) b = "smooth_quartz";  // storey band
    else if (rel % STOREY === 3) b = "calcite";        // sill / spandrel
    else if (rel < STOREY) {                           // shopfront level
      b = t % 3 === 0 ? "polished_granite" : "glass_pane";
    } else {                                           // office windows
      b = t % 3 === 0 ? "calcite" : "light_blue_stained_glass_pane";
    }
    put(x, y, z, b);
  }

  // Projecting parapet cap and cornice slab on the outer edge.
  if (deck < H) put(x, deck, z, "calcite");
  if (deck + 1 < H) put(x, deck + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Pilaster caps every third cell so the facade reads as a bay rhythm.
  if (!corner && t % 3 === 0 && deck + 1 < H) put(x, deck + 1, z, "calcite");

  // Warm lights set back behind some upper-floor windows.
  if (!corner) {
    for (let y = gr + STOREY; y <= deck - 2; y++) {
      const rel = y - gr;
      if ((rel % STOREY === 1 || rel % STOREY === 2) && t % 3 !== 0 && (t + y) % 8 === 0) {
        let ix = x, iz = z;
        if (face === "W") ix = x + 1;
        if (face === "E") ix = x - 1;
        if (face === "N") iz = z + 1;
        if (face === "S") iz = z - 1;
        if (has(ix, iz)) put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Entrance: recessed doorway with stone surround, lantern and lit transom.
  if (face === "N" && x === doorX && z === doorZ) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "shroomlight");
    put(x, gr + 4, z, "calcite");
    for (const dx of [-1, 1]) {
      if (has(x + dx, z)) {
        put(x + dx, gr + 1, z, "polished_granite");
        put(x + dx, gr + 2, z, "polished_granite");
        put(x + dx, gr + 3, z, "calcite");
      }
    }
  }
}

g.save(`${DIR}/DC63832.nbt`);
