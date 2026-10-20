import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119874";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const inside = (x, z) => groundOf.has(`${x},${z}`);
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Datum: highest ground under the footprint. Foundation fills up to it, so nothing floats.
const B = Math.max(...cells.map(c => c[2]));

// Storey levels relative to B (2 storeys of 5, parapet to B+10 = 11 blocks tall)
const L = {
  gfTop: 3,      // ground floor shopfront B..B+3
  transom: 4,    // transom band
  slab1: 5,      // storey line / floor slab
  upTop: 8,      // upper windows B+6..B+8
  cornice: 9,    // cornice and roof slab
  parapet: 10,   // parapet top
};

// Inward offset for a perimeter cell: the neighbour that is inside the footprint
function inward(x, z) {
  const oL = !inside(x - 1, z), oR = !inside(x + 1, z);
  const oN = !inside(x, z - 1), oS = !inside(x, z + 1);
  const ix = x + (oL ? 1 : 0) - (oR ? 1 : 0);
  const iz = z + (oN ? 1 : 0) - (oS ? 1 : 0);
  return inside(ix, iz) && !isEdge(ix, iz) ? [ix, iz] : null;
}

// Entrance: middle of the southern-most perimeter run (faces the street)
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
const maxZ = Math.max(...edgeCells.map(c => c[1]));
const southRun = edgeCells.filter(c => c[1] === maxZ).sort((a, b) => a[0] - b[0]);
const door = southRun[Math.floor(southRun.length / 2)] || edgeCells[0];
const [doorX, doorZ] = door;
const doorIn = inward(doorX, doorZ);

for (const [x, z] of cells) {
  // Plinth / foundation: solid from y 0 up to the datum under every cell
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const u = x + z; // position along the facade for rhythm

  if (!edge) {
    // Interior: floor slab at the storey line, roof slab, air between
    g.set(x, B + L.slab1, z, "light_gray_concrete");
    g.set(x, B + L.cornice, z, "light_gray_concrete");

    // Rooftop AC units, sparse
    if (x % 5 === 2 && z % 5 === 2) {
      g.set(x, B + L.parapet, z, "iron_block");
    }
    continue;
  }

  // Storey line, cornice, parapet on the perimeter
  g.set(x, B + L.slab1, z, "smooth_stone");
  g.set(x, B + L.cornice, z, "smooth_stone");
  g.set(x, B + L.parapet, z, "white_concrete");

  // Ground floor shopfront
  for (let dy = 0; dy <= L.gfTop; dy++) {
    const y = B + dy;
    if (x === doorX && z === doorZ) {
      if (dy <= 1) {
        g.set(x, y, z, "iron_door", {
          facing: "south",
          half: dy === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        g.set(x, y, z, dy === 2 ? "white_concrete" : "glass");
      }
    } else if (u % 4 === 0) {
      g.set(x, y, z, "white_concrete"); // pillar
    } else {
      g.set(x, y, z, "glass");
    }
  }
  g.set(x, B + L.transom, z, "white_concrete");

  // Upper storey windows with mullions
  for (let dy = L.slab1 + 1; dy <= L.upTop; dy++) {
    const y = B + dy;
    if (u % 3 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "cyan_stained_glass");
    }
  }

  // Warm light behind some upper windows
  if (u % 6 === 1) {
    const iw = inward(x, z);
    if (iw) g.set(iw[0], B + 7, iw[1], "glowstone");
  }
}

// Entrance lantern on the floor just inside the door
if (doorIn) {
  g.set(doorIn[0], B, doorIn[1], "lantern");
}

// Entrance lintel accent, stone sill line along the street front
for (const [x, z] of southRun) {
  if (!(x === doorX && z === doorZ)) {
    g.set(x, B, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
