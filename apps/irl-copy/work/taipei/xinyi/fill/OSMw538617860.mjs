import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617860";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr)]);

const W = 8, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey plan (2 storeys of 5 blocks, roof at +11 above lowest ground).
const G0 = Math.min(...cells.map(c => c[2]));
const ROOF_CAP = G0 + 10;       // roof slab / parapet cap block
const EQUIP = G0 + 11;          // rooftop plant sits on the cap

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const OPP = { N: "S", S: "N", E: "W", W: "E" };

const missing = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k].dx, z + DIRS[k].dz));

// Classify footprint cells.
const info = new Map();
for (const [x, z, gr] of cells) {
  const m = missing(x, z);
  info.set(`${x},${z}`, {
    x, z, gr, m,
    interior: m.length === 0,
    corner: m.length >= 2,
    facade: m.length === 1,
    out: m.length === 1 ? m[0] : null,
  });
}

// Choose a single entrance on the N-facing (street-side) wall nearest the middle.
let doorInfo = null;
{
  const cands = [...info.values()].filter(c => c.facade);
  const northCands = cands.filter(c => c.out === "N");
  const pool = northCands.length ? northCands : cands;
  if (pool.length) {
    const mid = (W - 1) / 2;
    pool.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
    doorInfo = pool[0];
  }
}

// Main column build.
for (const c of info.values()) {
  const { x, z, gr } = c;
  const capY = Math.max(ROOF_CAP, gr);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= capY; y++) {
    // Roof cap / roof membrane.
    if (y === capY) {
      put(x, y, z, c.interior ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    // Corner pillars run full height.
    if (c.corner) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Interior: floor slabs at ground floor and 2nd floor, air between.
    if (c.interior) {
      if (y === G0) put(x, y, z, "polished_andesite");
      else if (y === G0 + 5) put(x, y, z, "smooth_stone");
      continue;
    }

    // Facade cells.
    const pos = (c.out === "N" || c.out === "S") ? x : z;
    const mullion = pos % 3 === 0;
    let id;
    if (y === G0) {
      id = "polished_andesite";                        // base course
    } else if (y === G0 + 4 || y === G0 + 5) {
      id = "smooth_stone";                             // lintel and storey band
    } else if (y === G0 + 9) {
      id = "quartz_block";                             // sill course
    } else if (y >= G0 + 6 && y <= G0 + 8) {
      id = mullion ? "white_concrete" : "light_blue_stained_glass";   // storey 2 windows
    } else if (y >= G0 + 1 && y <= G0 + 3) {
      id = mullion ? "white_concrete" : "cyan_stained_glass";        // shopfront glazing
    } else {
      id = "quartz_block";
    }
    put(x, y, z, id);
  }
}

// Warm lights: glowstone just inside some storey-2 windows.
for (const c of info.values()) {
  if (!c.facade) continue;
  const pos = (c.out === "N" || c.out === "S") ? c.x : c.z;
  if (pos % 6 !== 1) continue;
  const inward = OPP[c.out];
  const ix = c.x + DIRS[inward].dx;
  const iz = c.z + DIRS[inward].dz;
  const ic = info.get(`${ix},${iz}`);
  if (!ic || !ic.interior) continue;
  if (ic.gr > G0 + 6) continue;
  put(ix, G0 + 6, iz, "glowstone");
}

// Entrance: double door on ground floor, lintel above, hanging lantern.
if (doorInfo) {
  const { x, z, gr, out } = doorInfo;
  const base = Math.max(gr, G0 + 1);
  if (base + 1 <= G0 + 3) {
    const facing = DIRS[out].facing;
    const hinge = "left";
    put(x, base, z, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
    put(x, base + 1, z, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
    if (base === G0 + 1) {
      put(x, G0 + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Rooftop plant: a few small units on the interior roof.
for (const c of info.values()) {
  if (!c.interior) continue;
  if (c.gr > ROOF_CAP) continue;
  if ((c.x === 3 || c.x === 4) && c.z % 6 === 3) {
    put(c.x, EQUIP, c.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
