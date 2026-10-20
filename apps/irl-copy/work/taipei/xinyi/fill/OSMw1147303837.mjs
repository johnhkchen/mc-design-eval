import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 逸林華廈: 1970s-80s Taipei reinforced-concrete residential block, four storeys
// of about 5 blocks, cream tiled walls, aluminium-sash windows, a shopfront on the
// street face, rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147303837";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 33, D = 27;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const minG = Math.min(...cells.map(c => c[2]));

// Absolute storey system: floor slabs at minG + 0, 5, 10, 15; roof slab at minG + 19;
// parapet at minG + 20 (so the roof reads about 21 blocks above the lowest ground).
const ROOF = minG + 19;
const PARAPET = minG + 20;

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const isFloor = (y, gr) =>
  y === gr || y === ROOF || (y > gr && (y - minG) % 5 === 0 && y - minG > 0 && y - minG <= 15);

// Describes the exterior face of a footprint cell (null if fully interior).
const info = (x, z) => {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  if (mN || mS) {
    return {
      axis: "x", p: x, lo: minX, hi: maxX,
      street: mN && z === minZ,
      inward: [0, mN ? 1 : -1],
    };
  }
  if (mW || mE) {
    return {
      axis: "z", p: z, lo: minZ, hi: maxZ,
      street: false,
      inward: [mW ? 1 : -1, 0],
    };
  }
  return null;
};

// Street door sits on the middle of the street-side cells.
const streetXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = streetXs[Math.floor(streetXs.length / 2)];

const pane = axis =>
  axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const isPier = f => f.p === f.lo || f.p === f.hi || (f.p - f.lo) % 3 === 0;

// Pass 1: foundations, floors, walls, windows, shopfront, parapet.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = info(x, z);
  for (let y = gr; y <= PARAPET; y++) {
    if (isFloor(y, gr)) {
      put(x, y, z, y === gr ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (y === PARAPET) {
      if (f) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!f) continue;

    const rel = y - minG;
    const r = rel % 5;

    // Street-level shopfront with entrance.
    if (f.street && y > gr && y <= gr + 3) {
      if (f.p === doorX && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (f.p === doorX) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isPier(f)) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane", pane(f.axis));
      }
      continue;
    }

    // Upper storeys: spandrel, window band, lintel.
    if (r === 2 || r === 3) {
      if (isPier(f)) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(f.axis));
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// Pass 2: warm lights behind some upper-storey windows (interior cells only).
for (const [x, z, gr] of cells) {
  const f = info(x, z);
  if (!f || f.street) continue;
  for (let y = gr + 1; y < PARAPET; y++) {
    if (isFloor(y, gr)) continue;
    const r = (y - minG) % 5;
    if (r !== 2) continue;
    if (isPier(f)) continue;
    if (f.p % 4 !== 1) continue;
    const ix = x + f.inward[0], iz = z + f.inward[1];
    if (!has(ix, iz) || info(ix, iz)) continue;
    const block = f.p % 8 === 1 ? "shroomlight" : "glowstone";
    put(ix, y, iz, block);
  }
}

// Pass 3: rooftop water tank and antenna on the roof slab.
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
const interior = cells
  .filter(([x, z, gr]) => gr <= ROOF && !info(x, z))
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));

let tank = null;
for (const [x, z] of interior) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([qx, qz]) => has(qx, qz) && !info(qx, qz) && (ground.get(`${qx},${qz}`) <= ROOF))) {
    tank = quad;
    break;
  }
}
if (tank) {
  for (const [qx, qz] of tank) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(qx, y, qz, "iron_block");
  }
}

const antennaCell = interior.find(([x, z]) =>
  !(tank && tank.some(([qx, qz]) => qx === x && qz === z)) &&
  !(tank && tank.some(([qx, qz]) => Math.abs(qx - x) <= 1 && Math.abs(qz - z) <= 1))
);
if (antennaCell) {
  const [ax, az] = antennaCell;
  for (let y = ROOF + 1; y <= ROOF + 4; y++) {
    put(ax, y, az, "iron_bars", {
      north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
