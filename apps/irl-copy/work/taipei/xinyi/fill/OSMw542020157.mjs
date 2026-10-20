import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020157";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 6 x 15 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey 1990s-2000s Xinyi shophouse / low commercial block:
// white tiled walls, grey base, stone storey lines, glazed shopfront below,
// glazed upper storey above, parapet and a small roof plant box.
const W = 6, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const P = 10;      // parapet top block index (roof top sits at height 11)
const FLOOR = 5;   // storey line / floor belt
const key = (x, z) => `${x},${z}`;
const occ = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// Outward face directions. dx/dz points outside the footprint.
const DIRS = [
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
];

// Glass panes need connection flags set, since structure loading does not
// recompute them. Panes on the x faces run along z, and vice versa.
const pane = (face) => {
  const alongZ = face === "west" || face === "east";
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
};

const lights = [];
const doorCandidates = [];

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(Math.round(gr0), P - 1));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const miss = DIRS.filter((d) => !occ.has(key(x + d.dx, z + d.dz)));
  const edge = miss.length > 0;
  const corner = miss.length >= 2;
  const face = miss[0];

  for (let y = gr; y <= P; y++) {
    if (!edge) {
      // Interior: floor at ground, floor slab at storey line, roof deck.
      if (y === gr || y === FLOOR || y === P) g.set(x, y, z, "smooth_stone");
      continue; // air gap otherwise
    }
    if (y === P || y === FLOOR) {
      g.set(x, y, z, "smooth_stone"); // parapet cap and storey belt
    } else if (y === gr) {
      g.set(x, y, z, "gray_concrete"); // base course
    } else if (corner) {
      g.set(x, y, z, "white_concrete"); // corner pilasters
    } else {
      const s1 = y > gr && y <= FLOOR - 2; // shopfront glazing
      const s2 = y > FLOOR && y <= P - 2;  // upper storey glazing
      if (s1 || s2) {
        g.set(x, y, z, "light_blue_stained_glass_pane", pane(face.f));
        // Warm light behind some windows, in the interior air cell.
        if ((y === FLOOR - 2 || y === P - 2) && (x + z) % 3 === 0) {
          lights.push({ x: x - face.dx, y, z: z - face.dz, gr });
        }
      } else {
        g.set(x, y, z, "white_concrete"); // spandrel / lintel
      }
    }
  }

  if (edge && !corner && miss.some((d) => d.dz === 1)) {
    doorCandidates.push({ x, z, gr });
  }
}

// Warm lanterns in the air behind glazing (only where the interior cell is open).
for (const l of lights) {
  if (!occ.has(key(l.x, l.z))) continue;
  const innerEdge = DIRS.some((d) => !occ.has(key(l.x + d.dx, l.z + d.dz)));
  if (innerEdge) continue;
  if (occ.get(key(l.x, l.z)) >= l.y) continue;
  g.set(l.x, l.y, l.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Entrance: on the south face, nearest the middle of the frontage.
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => Math.abs(a.x - 2.5) - Math.abs(b.x - 2.5));
  const d = doorCandidates[0];
  if (d.gr + 2 < FLOOR) {
    g.set(d.x, d.gr + 1, d.z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(d.x, d.gr + 2, d.z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lintel over the door.
    g.set(d.x, d.gr + 3, d.z, "white_concrete");
  }
}

// Roof plant: a small box on an interior roof cell near the middle.
const interior = cells
  .filter(([x, z]) => DIRS.every((dd) => occ.has(key(x + dd.dx, z + dd.dz))))
  .sort((a, b) => Math.abs(a[0] - 2) + Math.abs(a[1] - 7) - (Math.abs(b[0] - 2) + Math.abs(b[1] - 7)));
if (interior.length) {
  const [x, z] = interior[0];
  g.set(x, P + 1, z, "light_gray_concrete");
  g.set(x, P + 2, z, "light_gray_concrete");
}

g.save(`${dir}/${id}.nbt`);
