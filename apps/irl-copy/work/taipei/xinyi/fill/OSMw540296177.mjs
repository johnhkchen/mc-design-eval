import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296177";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 16;
const key = (x, z) => `${x},${z}`;

// Footprint and per-cell ground
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(key(x, z), gg);
  minG = Math.min(minG, gg);
}

// Flat roof: 11 blocks above the lowest ground (top block index R-1)
const R = minG + 11;

const DIRS = {
  N: { dx: 0, dz: -1 },
  S: { dx: 0, dz: 1 },
  W: { dx: -1, dz: 0 },
  E: { dx: 1, dz: 0 },
};

const inFoot = (x, z) => ground.has(key(x, z));
const facesOf = (x, z) =>
  Object.keys(DIRS).filter(d => !inFoot(x + DIRS[d].dx, z + DIRS[d].dz));
const isRing = (x, z) => inFoot(x, z) && facesOf(x, z).length > 0;
const isInterior = (x, z) => inFoot(x, z) && !isRing(x, z);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: middle cell of the longest exposed street-facing side (S, then N, E, W)
const entrance = (() => {
  for (const d of ["S", "N", "E", "W"]) {
    const list = cells
      .filter(([x, z]) => facesOf(x, z).includes(d))
      .sort((a, b) => (d === "S" || d === "N" ? a[0] - b[0] : a[1] - b[1]));
    if (list.length) {
      const m = list[Math.floor(list.length / 2)];
      return { x: m[0], z: m[1], d };
    }
  }
  return null;
})();

for (const [x, z, grRaw] of cells) {
  const gc = Math.round(grRaw);
  const faces = facesOf(x, z);

  // Foundation under every footprint cell
  for (let y = 0; y < gc; y++) set(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // Interior: floors, floor slabs, roof deck, rooftop plant
    set(x, gc, z, "smooth_stone");
    if (gc + 5 < R - 1) set(x, gc + 5, z, "smooth_stone");
    if (R - 1 > gc) set(x, R - 1, z, "light_gray_concrete");
    if (Math.abs(x - 10) <= 2 && Math.abs(z - 7) <= 1) set(x, R, z, "iron_block");
    continue;
  }

  // Facade cell: pick primary face for orientation and pattern
  const fd = faces[0];
  const { dx, dz } = DIRS[fd];
  const idx = fd === "N" || fd === "S" ? x : z;
  const isPillar = idx % 3 === 0;
  const paneProps = (fd === "N" || fd === "S")
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = entrance && entrance.x === x && entrance.z === z;

  for (let y = gc; y < R; y++) {
    if (y === gc) {
      set(x, y, z, "polished_granite");
    } else if (y <= gc + 3) {
      if (y === gc + 3) {
        set(x, y, z, "quartz_bricks");
      } else if (isDoor && y <= gc + 2) {
        const half = y === gc + 1 ? "lower" : "upper";
        set(x, y, z, "oak_door", {
          facing: entrance.d === "S" ? "south" : entrance.d === "N" ? "north" : entrance.d === "E" ? "east" : "west",
          half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isPillar) {
        set(x, y, z, "smooth_quartz");
      } else {
        set(x, y, z, "glass_pane", paneProps);
      }
    } else if (y === gc + 4) {
      set(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === gc + 5) {
      set(x, y, z, "smooth_quartz");
    } else if (y <= R - 4) {
      // Upper window band
      if (isPillar) set(x, y, z, "smooth_quartz");
      else set(x, y, z, "glass_pane", paneProps);
    } else if (y === R - 3) {
      set(x, y, z, "smooth_quartz");
    } else if (y === R - 2) {
      set(x, y, z, "quartz_bricks");
    } else {
      set(x, y, z, "smooth_quartz"); // parapet cap
    }
  }

  // Warm lights behind some glass, inside the building
  const inX = x - dx, inZ = z - dz;
  if (!isDoor && !isPillar && isInterior(inX, inZ)) {
    if (idx % 6 === 1 && gc + 6 <= R - 4) {
      set(inX, gc + 6, inZ, "shroomlight");
    } else if (idx % 6 === 4 && gc + 1 < gc + 5) {
      set(inX, gc + 1, inZ, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
