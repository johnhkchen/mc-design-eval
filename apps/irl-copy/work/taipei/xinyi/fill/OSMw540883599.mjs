import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883599.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883599.nbt";

// Record: 15x15 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century commercial block: pale tiled/concrete
// facade, shopfront ground floor, storey band at y=5 and y=10, flat roof
// with parapet and rooftop AC plant at y=12.
const W = 15, H = 23, D = 15;
const ROOF = 11;          // roof slab level (absolute, y0 = lowest ground)
const SLAB = [5, 10];     // floor slabs
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, g] of cells) {
  G.set(key(x, z), Math.min(10, Math.max(0, Math.round(g))));
}
const has = (x, z) => G.has(key(x, z));

// Outward horizontal directions where the neighbour is outside the footprint.
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const outwardFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const g = new Voxels([W, H, D]);

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, ground0] of cells) {
  const gr = G.get(key(x, z));
  const faces = outwardFaces(x, z);
  const edge = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground course at the cell's own ground level.
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storeys, floor slabs, roof.
  for (let y = gr + 1; y <= ROOF; y++) {
    if (SLAB.includes(y)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === ROOF) {
      g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (!edge) continue; // interior stays air behind the facade
  }

  if (!edge) {
    // Interior glow: warm glowstone just behind some upper-floor windows
    // is placed from the facade pass below; nothing more here.
  } else {
    // Facade for each outward face of this edge cell.
    for (const f of faces) {
      const i = f.dx === 0 ? x : z; // index along the face
      const pier = i % 3 === 0 || i === 14;
      const isSouthEntrance = f.name === "south" && x === 7 && gr <= 2;

      for (let y = gr + 1; y <= ROOF - 1; y++) {
        if (SLAB.includes(y)) continue; // slabs already placed
        const ground = y <= 4;
        const upper = y >= 6 && y <= 9;
        if (!ground && !upper) continue;

        // Entrance door in the south-centre bay.
        if (isSouthEntrance && (y === gr + 1 || y === gr + 2)) {
          if (y === gr + 1) g.set(x, y, z, "dark_oak_door", DOOR_LOWER);
          else g.set(x, y, z, "dark_oak_door", DOOR_UPPER);
          continue;
        }
        if (isSouthEntrance && y === gr + 3) {
          g.set(x, y, z, "smooth_quartz"); // lintel over door
          continue;
        }

        if (pier) {
          g.set(x, y, z, "smooth_quartz");
          continue;
        }

        if (ground) {
          g.set(x, y, z, "light_blue_stained_glass"); // shopfront glazing
          continue;
        }

        // Upper floor: glass between sills and heads, spandrels at 6 and 9.
        if (y === 6 || y === 9) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "light_blue_stained_glass");
          // Warm light behind some upper windows.
          if ((x + z + i) % 4 === 0 && y === 7) {
            const ix = x - f.dx;
            const iz = z - f.dz;
            if (has(ix, iz) && !outwardFaces(ix, iz).length) {
              g.set(ix, 7, iz, "glowstone");
            }
          }
        }
      }
    }

    // Parapet on the roof edge.
    g.set(x, ROOF + 1, z, "smooth_quartz");
  }
}

// Rooftop plant: two AC blocks and a small pair of lanterns on the roof.
const plant = [[4, 4], [5, 4], [4, 5], [5, 5], [9, 9], [10, 9]];
for (const [px, pz] of plant) {
  if (has(px, pz) && G.get(key(px, pz)) <= 10) {
    g.set(px, ROOF + 1, pz, "iron_block");
  }
}
for (const [lx, lz] of [[7, 3], [7, 11]]) {
  if (has(lx, lz)) g.set(lx, ROOF + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
