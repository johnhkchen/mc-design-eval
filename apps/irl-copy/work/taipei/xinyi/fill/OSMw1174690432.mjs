import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690432";
const W = 25, H = 23, D = 29;

// Footprint: [x, z, ground] per cell.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));
const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), Number(gr));
const fp = (x, z) => groundOf.has(key(x, z));
const minG = Math.min(...cells.map((c) => Number(c[2])));

// Ground offset per cell, clamped so the storeys stay inside the volume.
const gOf = (x, z) => Math.max(0, Math.min(7, Math.round(groundOf.get(key(x, z)) - minG)));

// Exterior faces: a side is exterior when the neighbour is outside the footprint.
const facesOf = (x, z) => {
  const f = [];
  if (!fp(x, z - 1)) f.push("N");
  if (!fp(x, z + 1)) f.push("S");
  if (!fp(x - 1, z)) f.push("W");
  if (!fp(x + 1, z)) f.push("E");
  return f;
};

// Entrance: a non-corner north-facing (street) wall cell nearest the middle, fallback south.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
function pickEntrance(face) {
  const cand = cells.filter(([x, z]) => {
    const f = facesOf(x, z);
    return f.length === 1 && f[0] === face;
  });
  if (!cand.length) return null;
  cand.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  return { x: cand[0][0], z: cand[0][1], face };
}
const entrance = pickEntrance("N") || pickEntrance("S");

const g = new Voxels([W, H, D]);

for (const [x, z] of cells) {
  const ground = gOf(x, z);
  const f = facesOf(x, z);
  const ext = f.length > 0;
  const corner = f.length >= 2;
  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  // Foundation below ground: solid up to the cell's ground level.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Base course / floor at ground level.
  g.set(x, ground, z, ext ? "polished_andesite" : "smooth_stone");

  // Walls, storey lines and windows from ground+1 to y=10.
  for (let y = ground + 1; y <= 10; y++) {
    if (y === 5) {
      // Storey line; also the upper-storey floor slab over interior cells.
      g.set(x, y, z, ext ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!ext) continue; // Interior: air behind the glass, no partitions.

    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    const idx = f.includes("N") || f.includes("S") ? x : z;
    const pier = idx % 3 === 0;

    if (isEntrance) {
      if (y === ground + 1 || y === ground + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: entrance.face === "N" ? "north" : "south",
          half: y === ground + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === ground + 3) {
        g.set(x, y, z, "light_blue_stained_glass");
        continue;
      }
    }

    if (pier || y === 6 || y === 10) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Warm interior lamps on the floor slab behind some upper windows.
  if (ext && !corner) {
    const idx = f.includes("N") || f.includes("S") ? x : z;
    if (idx % 6 === 1 && !isEntrance && ground + 1 <= 6) {
      let ix = x, iz = z;
      if (f[0] === "N") iz = z + 1;
      else if (f[0] === "S") iz = z - 1;
      else if (f[0] === "W") ix = x + 1;
      else if (f[0] === "E") ix = x - 1;
      if (fp(ix, iz) && !facesOf(ix, iz).length) {
        g.set(ix, 6, iz, "glowstone");
      }
    }
  }

  // Roof deck with cornice on the exterior ring.
  g.set(x, 11, z, ext ? "chiseled_stone_bricks" : "smooth_stone");

  // Parapet on the exterior ring; corner lanterns sit on top of it.
  if (ext) {
    g.set(x, 12, z, "stone_bricks");
    if (corner) g.set(x, 13, z, "lantern", { hanging: "false" });
  }

  // Rooftop plant room on the interior roof deck.
  if (!ext && x >= 6 && x <= 10 && z >= 9 && z <= 15) {
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "light_gray_concrete");
    g.set(x, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
