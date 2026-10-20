import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858015";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint and foundation level: F = highest ground under the footprint.
// Two 5-block storeys (4 walls + 1 slab each), roof slab, parapet: roof ~ F+11.
const fp = new Map();
let F = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.round(gr);
  fp.set(`${x},${z}`, gg);
  F = Math.max(F, gg);
}
F = Math.min(F, 10); // keep parapet and rooftop plant inside the 23-block height

const inFp = (x, z) => fp.has(`${x},${z}`);
const missing = (x, z) => ({
  n: !inFp(x, z - 1),
  s: !inFp(x, z + 1),
  e: !inFp(x + 1, z),
  w: !inFp(x - 1, z),
});
const isWall = (x, z) => {
  const m = missing(x, z);
  return m.n || m.s || m.e || m.w;
};

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const cells2 = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  cells2.push([x, z]);
}

// Front door: north-facing wall cell closest to the centre line.
let door = null;
for (const [x, z] of cells2) {
  if (!isWall(x, z) || !missing(x, z).n) continue;
  if (!door || Math.abs(x - W / 2) < Math.abs(door[0] - W / 2)) door = [x, z];
}

// 1. Foundation: solid from y 0 up to F under every footprint cell.
for (const [x, z] of cells2) {
  for (let y = 0; y <= F; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs (storey lines, 2nd floor, roof) across the whole footprint.
for (const [x, z] of cells2) {
  put(x, F + 5, z, "smooth_quartz");
  put(x, F + 10, z, "light_gray_concrete");
}

// 3. Walls, base course, windows, piers, lintels, parapet.
for (const [x, z] of cells2) {
  if (!isWall(x, z)) continue;
  const m = missing(x, z);
  const onNS = m.n || m.s;          // facade runs east-west
  const onEW = m.e || m.w;          // facade runs north-south
  const corner = onNS && onEW;
  const u = onNS ? x : z;
  const pier = corner || u % 3 === 0;

  // Base course
  put(x, F + 1, z, "stone_bricks");

  // Storey 1 and storey 2 bodies
  const storeys = [
    { lo: F + 2, hi: F + 3, lintel: F + 4 },
    { lo: F + 7, hi: F + 8, lintel: F + 9 },
  ];
  for (const s of storeys) {
    for (let y = s.lo; y <= s.lintel; y++) {
      const isWin = y <= s.hi;
      if (isWin && !pier) {
        const props = onNS
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
      } else if (y === s.lintel) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, pier ? "quartz_block" : "white_concrete");
      }
    }
  }
  // Upper-storey sill band and piers continue to roof slab
  put(x, F + 6, z, pier ? "quartz_block" : "white_concrete");

  // Parapet on top of roof slab
  put(x, F + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Entrance: door in the chosen north-facing wall cell, lantern on lintel.
if (door) {
  const [dx, dz] = door;
  put(dx, F + 1, dz, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, F + 2, dz, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(dx, F + 4, dz, "lantern", { hanging: "true", waterlogged: "false" });
  // Shopfront glazing either side of the door at ground level
  for (const off of [-1, 1]) {
    const x = dx + off;
    if (isWall(x, dz) && missing(x, dz).n) {
      put(x, F + 2, dz, "light_blue_stained_glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
    }
  }
}

// 5. Warm lights inside, behind glass (interior cells only).
for (const [x, z] of cells2) {
  if (isWall(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) put(x, F + 2, z, "shroomlight");
  if (x % 5 === 3 && z % 5 === 1) put(x, F + 7, z, "glowstone");
}

// 6. Roof plant: a small mechanical box on the roof, if it fits.
if (F + 12 <= H - 1) {
  for (let x = 6; x <= 11; x++) {
    for (let z = 7; z <= 12; z++) {
      if (!inFp(x, z) || isWall(x, z)) continue;
      put(x, F + 11, z, "gray_concrete");
      if (x >= 7 && x <= 10 && z >= 8 && z <= 11) put(x, F + 12, z, "light_gray_concrete");
    }
  }
}

g.save(`${SRC}/${ID}.nbt`);
