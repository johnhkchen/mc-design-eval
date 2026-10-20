import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 2005 Xinyi office tower: 3-storey glazed podium with a shopfront entrance,
// a 12-storey glass shaft on a terrace, a 3-storey crown with a parapet and mast.
// Roof about 93 blocks above lowest ground; storeys 5 blocks high.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0007-14F";
const W = 33, H = 105, D = 49;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(key(x, z), gr);
}
const cells = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const minX = Math.min(...cells.map(c => c.x));
const maxX = Math.max(...cells.map(c => c.x));
const minZ = Math.min(...cells.map(c => c.z));
const maxZ = Math.max(...cells.map(c => c.z));
const midX = Math.round((minX + maxX) / 2);

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => ground.has(key(x, z));
const grAt = (x, z) => ground.get(key(x, z));
const inset = (x, z) => Math.min(x - minX, maxX - x, z - minZ, maxZ - z);
const inTier = (t, x, z) => has(x, z) && inset(x, z) >= t.inset;
const outsOf = (t, x, z) => DIRS.filter(([dx, dz]) => !inTier(t, x + dx, z + dz));
const isRing = (t, x, z) => inTier(t, x, z) && outsOf(t, x, z).length > 0;

const tiers = [
  { name: "podium", inset: 0, b0: 0, b1: 15, coreInset: 7 },
  { name: "tower", inset: 4, b0: 15, b1: 75, coreInset: 10 },
  { name: "crown", inset: 9, b0: 75, b1: 90, coreInset: null },
];
const [P, T, C] = tiers;

// 1. Foundations: solid from y 0 up to each cell's ground
for (const c of cells) {
  for (let y = 0; y < c.gr; y++) put(c.x, y, c.z, "stone");
}

// 2. Entrance: a three-bay doorway on the street-side (low z) podium wall, near the middle
const podRing = cells.filter(c => isRing(P, c.x, c.z) && outsOf(P, c.x, c.z).length === 1);
let door = null;
if (podRing.length) {
  const best = podRing.reduce((a, b) => {
    const sa = (a.z - minZ) * 10 + Math.abs(a.x - midX);
    const sb = (b.z - minZ) * 10 + Math.abs(b.x - midX);
    return sb < sa ? b : a;
  });
  door = { x: best.x, z: best.z, dir: outsOf(P, best.x, best.z)[0][2] };
}
// bays of the entrance: the door cell and its wall neighbours on the same face
const doorBays = new Set();
if (door) {
  for (const off of [-1, 0, 1]) {
    const bx = door.dir === "north" || door.dir === "south" ? door.x + off : door.x;
    const bz = door.dir === "east" || door.dir === "west" ? door.z + off : door.z;
    if (has(bx, bz) && isRing(P, bx, bz)) doorBays.add(key(bx, bz));
  }
}

// 3. Storeys of each tier: floor slab, facade ring, interior lights
for (const t of tiers) {
  for (let b = t.b0; b < t.b1; b += 5) {
    for (const c of cells) {
      const { x, z, gr } = c;
      if (!inTier(t, x, z)) continue;
      const Y = dy => gr + b + dy;
      const ring = isRing(t, x, z);
      const ground0 = t === P && b === 0;

      // floor slab (base course on the ground storey ring)
      put(x, Y(0), z, ring && ground0 ? "polished_granite" : "light_gray_concrete");
      if (!ring) continue;

      const outs = outsOf(t, x, z);
      const [odx, odz] = outs[0];
      const mull = outs.length >= 2 || (x + z) % 3 === 0;
      const isBay = ground0 && doorBays.has(key(x, z));
      const isDoor = door && door.x === x && door.z === z && ground0;

      for (let dy = 1; dy <= 3; dy++) {
        if (isDoor) {
          if (dy <= 2) {
            put(x, Y(dy), z, "dark_oak_door", {
              facing: door.dir,
              half: dy === 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else {
            put(x, Y(dy), z, "smooth_stone");
          }
        } else if (isBay && dy <= 2) {
          // glazed entrance bays flanking the door, with a lantern over each
          put(x, Y(dy), z, "glass");
        } else if (isBay && dy === 3) {
          put(x, Y(dy), z, "smooth_stone");
        } else if (mull) {
          put(x, Y(dy), z, "quartz_block");
        } else if (ground0 && dy === 3) {
          put(x, Y(dy), z, "smooth_stone");
        } else {
          put(x, Y(dy), z, ground0 ? "glass" : "light_blue_stained_glass");
        }
      }

      // storey line / spandrel
      if (mull) put(x, Y(4), z, "quartz_block");
      else if (ground0) put(x, Y(4), z, "smooth_stone");
      else put(x, Y(4), z, "white_concrete");

      // warm lights behind some glazing, sitting on the floor slab
      if (!mull && !isDoor && ((x * 31 + z * 17 + b) % 9 === 0)) {
        const ix = x - odx, iz = z - odz;
        if (inTier(t, ix, iz) && !isRing(t, ix, iz)) {
          const gi = grAt(ix, iz);
          put(ix, gi + b + 1, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
        }
      }
    }
  }

  // roof slab of this tier (also the floor/terrace of the next tier)
  for (const c of cells) {
    if (inTier(t, c.x, c.z)) put(c.x, c.gr + t.b1, c.z, "light_gray_concrete");
  }
}

// Entrance lanterns hung under the lintel above the door
if (door) {
  const gd = grAt(door.x, door.z);
  put(door.x, gd + 3, door.z, "lantern", { hanging: "true" });
}

// 4. Structural core: solid columns inside the floorplates so floors are carried
for (const t of tiers) {
  if (t.coreInset == null) continue;
  for (const c of cells) {
    if (!inTier(t, c.x, c.z) || inset(c.x, c.z) < t.coreInset) continue;
    for (let y = t.b0; y <= t.b1; y++) put(c.x, c.gr + y, c.z, "light_gray_concrete");
  }
}

// 5. Terrace guardrail on the podium edge
for (const c of cells) {
  if (isRing(P, c.x, c.z)) put(c.x, c.gr + 16, c.z, "stone_brick_wall");
}

// 6. Crown parapet and mast with aviation light
const crownCells = cells.filter(c => inTier(C, c.x, c.z));
for (const c of crownCells) {
  if (!isRing(C, c.x, c.z)) continue;
  put(c.x, c.gr + 91, c.z, "quartz_block");
  put(c.x, c.gr + 92, c.z, "quartz_block");
  put(c.x, c.gr + 93, c.z, "smooth_quartz");
}
if (crownCells.length) {
  const cx = crownCells.reduce((s, c) => s + c.x, 0) / crownCells.length;
  const cz = crownCells.reduce((s, c) => s + c.z, 0) / crownCells.length;
  const mast = crownCells.reduce((a, b) =>
    (Math.hypot(b.x - cx, b.z - cz) < Math.hypot(a.x - cx, a.z - cz) ? b : a));
  for (let y = 91; y <= 99; y++) put(mast.x, mast.gr + y, mast.z, "iron_bars");
  put(mast.x, mast.gr + 100, mast.z, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
