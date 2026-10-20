import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 明德樓 (Mingde Building), Taipei. Mid-century reinforced-concrete commercial/office block:
// cream tiled quartz-finish walls, grey concrete piers and cornice, brown terracotta spandrels,
// stone-brick plinth, metal-framed grey-tinted glazing, a shopfront-height ground storey.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385812667";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 65, H = 23, D = 41;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);

// outward normals: [dx, dz, facing name]
const dirs = [
  [-1, 0, "west"],
  [1, 0, "east"],
  [0, -1, "north"],
  [0, 1, "south"],
];

const setv = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const isEdge = (x, z) => dirs.some(([dx, dz]) => !cellMap.has(key(x + dx, z + dz)));
const isColumn = (x, z) => x % 6 === 3 && z % 6 === 3;

// Storey geometry per cell (relative to that cell's ground):
// plinth at gr, ground storey gr+1..fl-1, floor line fl, upper storey fl+1..T-4,
// spandrel T-3, cornice T-2, parapet/roof cap T-1 (roof about 11 blocks above lowest ground).
const geom = (gr) => {
  const T = Math.max(12, gr + 10);
  const top = T - 1;
  const fl = gr + Math.floor((T - gr) / 2);
  return { T, top, fl };
};

// ---- Pass 1: foundations, plinth, slabs, walls, columns, roof ----
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const { top, fl } = geom(gr);

  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) setv(x, y, z, "stone_bricks");

  if (edge) {
    setv(x, gr, z, "stone_bricks"); // base course
    for (let y = gr + 1; y <= top; y++) setv(x, y, z, "smooth_quartz");
  } else {
    setv(x, gr, z, "smooth_stone"); // ground floor slab
    if (fl > gr) setv(x, fl, z, "smooth_stone"); // floor slab per storey
    setv(x, top, z, "smooth_quartz"); // roof
    if (isColumn(x, z)) {
      for (let y = gr + 1; y < top; y++) setv(x, y, z, "light_gray_concrete");
    }
  }
}

// ---- Pass 2: facade articulation on exposed edge cells ----
const paneProps = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { T, fl } = geom(gr);

  for (const [dx, dz, facing] of dirs) {
    if (cellMap.has(key(x + dx, z + dz))) continue;

    const along = dx !== 0 ? z : x;
    const idx = ((along % 4) + 4) % 4;
    const isDoorCol = along % 12 === 6;
    const ground = (y) => y >= gr + 1 && y <= fl - 2;
    const upper = (y) => y >= fl + 1 && y <= T - 4;

    for (let y = gr + 1; y <= T - 2; y++) {
      if (y === fl) {
        setv(x, y, z, "light_gray_concrete"); // floor line band
        continue;
      }
      if (y === fl - 1) {
        // ground-storey lintel; stone over the entrance so the door reads from the street
        setv(x, y, z, isDoorCol ? "stone_bricks" : "smooth_quartz");
        continue;
      }
      if (y === T - 3) {
        setv(x, y, z, "brown_terracotta"); // spandrel band
        continue;
      }
      if (y === T - 2) {
        setv(x, y, z, "light_gray_concrete"); // cornice
        continue;
      }

      if (ground(y) || upper(y)) {
        // Entrance: stone surround and a door on the ground storey
        if (ground(y) && isDoorCol && y === gr + 3) {
          setv(x, y, z, "stone_bricks");
          continue;
        }
        if (ground(y) && isDoorCol && (y === gr + 1 || y === gr + 2)) {
          const half = y === gr + 1 ? "lower" : "upper";
          setv(x, y, z, "oak_door", {
            facing,
            half,
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }

        if (idx === 0) {
          setv(x, y, z, "smooth_quartz"); // pier
        } else if (idx === 3) {
          setv(x, y, z, "light_gray_concrete"); // mullion/frame
        } else {
          setv(x, y, z, "gray_stained_glass_pane", paneProps(dx)); // glazing
          // Warm light behind some glass (inward cell is air)
          if (upper(y) && idx === 1 && (x * 31 + z * 17 + y * 7) % 5 === 0) {
            const ix = x - dx, iz = z - dz;
            if (cellMap.has(key(ix, iz)) && !isEdge(ix, iz) && !isColumn(ix, iz)) {
              setv(ix, y, iz, "glowstone");
            }
          }
          if (ground(y) && idx === 2 && (x * 13 + z * 29 + y * 3) % 7 === 0) {
            const ix = x - dx, iz = z - dz;
            if (cellMap.has(key(ix, iz)) && !isEdge(ix, iz) && !isColumn(ix, iz)) {
              setv(ix, y, iz, "shroomlight");
            }
          }
        }
      }
    }
  }
}

// ---- Pass 3: grouped roof plant rooms (solid rectangles, not scattered posts) ----
// A plant room is a 4 x 3 block of interior roof cells at one common roof level,
// two blocks tall, with a wider cap course so it reads as one machine room.
const rectOk = (x0, z0, rw, rd) => {
  let T0 = null;
  for (let x = x0; x < x0 + rw; x++) {
    for (let z = z0; z < z0 + rd; z++) {
      if (!cellMap.has(key(x, z))) return null;
      if (isEdge(x, z)) return null;
      const { T } = geom(cellMap.get(key(x, z)));
      if (T0 === null) T0 = T;
      else if (T !== T0) return null;
    }
  }
  return T0;
};

const plants = [];
const wanted = 5;
for (let x = 2; x < W - 6 && plants.length < wanted; x += 1) {
  for (let z = 2; z < D - 4 && plants.length < wanted; z += 1) {
    const T = rectOk(x, z, 4, 3);
    if (T === null || T + 2 > H - 1) continue;
    const cx = x + 2, cz = z + 1;
    if (plants.some(([px, pz]) => Math.abs(px - cx) < 12 && Math.abs(pz - cz) < 10)) continue;
    plants.push([cx, cz]);
    for (let px = x; px < x + 4; px++) {
      for (let pz = z; pz < z + 3; pz++) {
        setv(px, T, pz, "light_gray_concrete");
        setv(px, T + 1, pz, "light_gray_concrete");
      }
    }
    // cap course: a lighter plant-screen top across the middle
    for (let px = x + 1; px < x + 3; px++) {
      setv(px, T + 2, z + 1, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
