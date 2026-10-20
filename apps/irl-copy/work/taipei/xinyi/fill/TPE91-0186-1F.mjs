import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0186-1F";
const W = 45, H = 19, D = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

// outward faces: N = -z, S = +z, W = -x, E = +x
const DIRS = [
  { k: "N", dx: 0, dz: -1, ix: 0, iz: 1 },
  { k: "S", dx: 0, dz: 1, ix: 0, iz: -1 },
  { k: "W", dx: -1, dz: 0, ix: 1, iz: 0 },
  { k: "E", dx: 1, dz: 0, ix: -1, iz: 0 },
];

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// per-cell info
const info = new Map();
for (const [x, z, gr] of cells) {
  const faces = DIRS.filter((d) => !inside(x + d.dx, z + d.dz)).map((d) => d.k);
  const T = Math.max(7, gr + 3);      // roof level: ~7 blocks above lowest ground
  info.set(`${x},${z}`, { x, z, gr, T, faces, edge: faces.length > 0 });
}

// entrance: median x of exposed north-face cells
const northXs = [];
for (const c of info.values()) if (c.faces.includes("N")) northXs.push(c.x);
northXs.sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -999;

// ---------- pass 1: foundation, floors, walls, roof ----------
for (const c of info.values()) {
  const { x, z, gr, T, faces, edge } = c;

  // foundation fill up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slab / base course
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  if (!edge) {
    put(x, T - 1, z, "smooth_stone"); // lighter roof deck, reads from the air
    continue;
  }

  const corner = faces.length > 1;
  const isNorthCell = faces.includes("N");
  const a = (faces.includes("N") || faces.includes("S")) ? x : z;
  const onEntrance = isNorthCell && !corner && Math.abs(x - entranceX) <= 1;

  for (let y = gr + 1; y <= T - 1; y++) {
    const r = y - gr;

    if (y === T - 1) { put(x, y, z, "quartz_block"); continue; } // cornice

    // entrance recess: door centred, flanked by quartz jambs, canopy above
    if (onEntrance && x === entranceX) {
      if (r === 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    if (isNorthCell && !corner && Math.abs(x - entranceX) <= 2 && r === 3) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (isNorthCell && !corner && Math.abs(x - entranceX) === 2 && r === 2) {
      // hanging lanterns either side of the door, under the canopy
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (onEntrance && r <= 2) { put(x, y, z, "quartz_block"); continue; } // door jambs

    if (corner || a % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; } // mullions and corners

    if (y === T - 2) { put(x, y, z, "white_concrete"); continue; }              // frieze / spandrel

    if (r === 1) { put(x, y, z, "polished_andesite"); continue; }              // shopfront plinth

    // glass pane window
    const ns = faces.includes("N") || faces.includes("S");
    const props = ns
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", props);
  }
}

// ---------- pass 2: warm lights behind glass, rooftop plant ----------
for (const c of info.values()) {
  const { x, z, gr, T, faces, edge } = c;

  if (edge && faces.length === 1) {
    const f = DIRS.find((d) => d.k === faces[0]);
    const a = (faces[0] === "N" || faces[0] === "S") ? x : z;
    const nearEntrance = faces[0] === "N" && Math.abs(x - entranceX) <= 2;
    if (a % 8 === 2 && !nearEntrance) {
      const ix = x + f.ix, iz = z + f.iz;
      const inner = info.get(`${ix},${iz}`);
      if (inner && !inner.edge) put(ix, gr + 3, iz, "glowstone");
    }
  }
}

// entrance interior glow: warm light visible through the recess
if (entranceX !== -999) {
  const ce = info.get(`${entranceX},${info.size ? 0 : 0}`);
  for (const c of info.values()) {
    if (c.x === entranceX && c.faces.includes("N")) {
      put(c.x, c.gr + 2, c.z + 1, "glowstone");
      break;
    }
  }
}

// rooftop plant: 2x2 boxes on interior roof, with iron caps
for (const c of info.values()) {
  const { x, z, T, edge } = c;
  if (edge) continue;
  if (x % 9 === 4 && z % 9 === 4) {
    const cluster = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
      const cc = info.get(`${x + dx},${z + dz}`);
      return cc && !cc.edge;
    });
    if (cluster) {
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        put(x + dx, T, z + dz, "light_gray_concrete");
      }
      put(x, T + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
