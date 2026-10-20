import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001478";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 17, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  map.set(key(c[0], c[1]), { g: Math.round(c[2]), r: Math.round(c[3]) });
}
const has = (x, z) => map.has(key(x, z));

// Four cardinal faces: outward offset and the facing name used by doors.
const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];
const exposedOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => exposedOf(x, z).length > 0;

// Flatten the roof: median lidar roof, never lower than 4 blocks above the highest ground.
const roofs = [...map.values()].map((v) => v.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...[...map.values()].map((v) => v.g));
const topY = Math.min(H - 1, Math.max(medianRoof, maxGround + 4));

// Foundation, walls, floors, cornice, parapet lip.
for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const gi = Math.max(0, v.g);
  const perim = isPerim(x, z);
  const exposed = exposedOf(x, z);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gi; y++) g.set(x, y, z, "cobblestone");

  // Storeys from ground to the top wall course.
  for (let y = gi; y <= topY - 2; y++) {
    const rel = y - gi;
    if (perim) {
      const face = exposed[0];
      const along = face.dz !== 0 ? x : z; // face runs along x for n/s faces
      if (rel === 0) {
        g.set(x, y, z, "stone_bricks");            // base course
      } else if (rel % 2 === 0) {
        g.set(x, y, z, "stone_bricks");            // floor-line band
      } else if (rel === 1) {
        // Ground floor: iron louvres on alternate bays, brick piers between.
        if (along % 2 === 1) g.set(x, y, z, "iron_bars");
        else g.set(x, y, z, "bricks");
      } else {
        // Upper storeys: full glass bays framed by brick piers.
        if (along % 2 === 1) g.set(x, y, z, "glass");
        else g.set(x, y, z, "bricks");
      }
    } else {
      // Interior: only floor slabs, air otherwise (no interiors).
      if (rel % 2 === 0 || y === topY - 2) g.set(x, y, z, "smooth_stone");
    }
  }

  // Roof edge: smooth cornice course, then a low stone slab lip. Concrete deck inside.
  if (perim) {
    g.set(x, topY - 1, z, "smooth_stone");
    g.set(x, topY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, topY - 1, z, "gray_concrete");
  }
}

// Warm light behind some upper-storey windows.
for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const gi = Math.max(0, v.g);
  const y = gi + 3;
  if (y >= topY - 2) continue;
  const face = exposedOf(x, z)[0];
  const along = face.dz !== 0 ? x : z;
  if (along % 4 !== 1) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
}

// Entrance: on the lowest-z north face, nearest the middle of the width.
let doorCell = null;
{
  let zmin = Infinity;
  for (const [k] of map) {
    const [x, z] = k.split(",").map(Number);
    if (exposedOf(x, z).some((d) => d.dz === -1) && z < zmin) zmin = z;
  }
  const cands = [];
  for (const [k] of map) {
    const [x, z] = k.split(",").map(Number);
    if (z === zmin && exposedOf(x, z).some((d) => d.dz === -1)) cands.push(x);
  }
  if (cands.length) {
    const mid = (W - 1) / 2;
    const bx = cands.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    doorCell = { x: bx, z: zmin, g: map.get(key(bx, zmin)).g };
  }
}
if (doorCell) {
  const { x, z } = doorCell;
  const gi = Math.max(0, doorCell.g);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(x, gi + 1, z, "iron_door", doorProps("lower"));
  g.set(x, gi + 2, z, "iron_door", doorProps("upper"));
  g.set(x, gi + 3, z, "stone_bricks"); // lintel over the door
  // Warm lantern-style light flanking the entrance at ground level.
  for (const dx of [-1, 1]) {
    const nx = x + dx;
    if (has(nx, z) && isPerim(nx, z)) g.set(nx, gi + 1, z, "bricks");
  }
}

// Roof vent stack over the centre, if the centre cell is interior.
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  if (has(cx, cz) && !isPerim(cx, cz)) {
    g.set(cx, topY, cz, "iron_block");
    if (topY + 1 < H) g.set(cx, topY + 1, cz, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
