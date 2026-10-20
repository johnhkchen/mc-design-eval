import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE101-6668-21F";
const W = 75, D = 94, H = 142;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw));
const norm = (c) => Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? c.y ?? 0];

const key = (x, z) => x + "," + z;
const G = new Map();
for (const c of list) {
  const [x, z, g] = norm(c);
  G.set(key(x, z), g);
}
const minG = Math.min(...G.values());
const ROOF = minG + 130;           // roof ~130 blocks above lowest ground
const at = (x, z) => G.has(key(x, z));
const missing = (x, z) => {
  const m = [];
  if (!at(x, z - 1)) m.push("N");
  if (!at(x, z + 1)) m.push("S");
  if (!at(x - 1, z)) m.push("W");
  if (!at(x + 1, z)) m.push("E");
  return m;
};

// Depth from the outer edge (1 = outer ring). Used for stepped setbacks.
const depth = new Map();
const queue = [];
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (missing(x, z).length) { depth.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]]) {
    const nk = key(nx, nz);
    if (G.has(nk) && !depth.has(nk)) { depth.set(nk, d + 1); queue.push([nx, nz]); }
  }
}
const dep = (x, z) => depth.get(key(x, z)) ?? 0;

// Stepped massing by height above lowest ground: full mass, then two setbacks.
const S = (h) => (h < 80 ? 1 : h < 100 ? 4 : 8);

// Outward direction of an edge cell: the missing side at the rim, or the neighbour one step closer to the rim.
const outward = (x, z, d) => {
  if (d === 1) { const m = missing(x, z); if (m.length) return m[0]; }
  if (dep(x, z - 1) === d - 1) return "N";
  if (dep(x, z + 1) === d - 1) return "S";
  if (dep(x - 1, z) === d - 1) return "W";
  if (dep(x + 1, z) === d - 1) return "E";
  return null;
};
const inwardOf = (o) => ({ N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] })[o] ?? [0, 0];

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (alongZ) => alongZ
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs, setback terraces, exterior walls, penthouse and lights, per column.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const d = dep(x, z);
  const out = outward(x, z, d);
  const alongZ = out === "W" || out === "E";
  const coord = alongZ ? z : x;
  const pier = coord % 4 === 0;
  const bay = Math.floor(coord / 4);
  const [ix, iz] = out ? inwardOf(out) : [0, 0];

  for (let y = gr; y < ROOF; y++) {
    const h = y - minG;
    const hh = y - gr;
    const floorLine = (h === gr - minG) || (h >= 10 && h <= 120 && (h - 10) % 5 === 0);
    const cur = h <= 120 ? d >= S(h) : (h <= 127 ? d >= 8 : false);

    // Floor slab per storey; on a setback it also caps the terrace below.
    if (floorLine) {
      if (cur || d >= S(h - 1)) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!cur) continue;

    // Penthouse above the roof deck, set back from the parapet.
    if (h >= 121) {
      if (h <= 126 && d >= 10) {
        if (d === 10) {
          const hot = (h === 121 || h === 126);
          if (hot) put(x, y, z, "light_gray_concrete");
          else put(x, y, z, "light_blue_stained_glass_pane", pane(alongZ));
        } else {
          put(x, y, z, "gray_concrete");
        }
        continue;
      }
      if (h === 127 && d >= 10) { put(x, y, z, "smooth_quartz"); continue; }
      if (h <= 123 && d === 8) {
        put(x, y, z, h === 123 ? "smooth_quartz" : "white_concrete");
        continue;
      }
      continue;
    }

    // Interior cells of a tier: air behind glass, nothing to place.
    if (d !== S(h)) continue;

    // Edge (rim) walls of the current tier.
    if (h < 10) {
      // Podium: granite plinth, shopfront, lintel band, upper podium windows.
      if (hh === 4) { put(x, y, z, "polished_granite"); continue; }
      if (hh >= 1 && hh <= 3) {
        put(x, y, z, pier ? "polished_granite" : "glass");
        continue;
      }
      if (hh >= 5) {
        if (pier) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", pane(alongZ));
      }
      continue;
    }

    // Tower storeys.
    const off = (h - 10) % 5;
    if (off === 4) { put(x, y, z, "white_concrete"); continue; }
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", pane(alongZ));
    // Warm light behind some glass: shroomlight in the cell just inside.
    if (off === 2 && bay % 5 === 2 && (ix || iz)) {
      put(x + ix, y, z + iz, "shroomlight");
    }
  }
}

// 3. Mast: a slim lightning-rod spire on core cells, standing on the penthouse cap.
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (dep(x, z) >= 14 && x % 6 === 0 && z % 6 === 0) {
    for (const h of [128, 129]) {
      put(x, minG + h, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

// 4. Entrance on the north face of the podium, near the middle, with a hanging lantern.
{
  const xs = [...G.keys()].map((k) => Number(k.split(",")[0]));
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = null;
  for (const [k, gr] of G) {
    const [x, z] = k.split(",").map(Number);
    if (dep(x, z) !== 1 || !missing(x, z).includes("N")) continue;
    if (!best || Math.abs(x - cx) < Math.abs(best.x - cx)) best = { x, z, gr };
  }
  if (best) {
    const { x, z, gr } = best;
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
