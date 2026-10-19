// 560 Fifth Avenue, 1907 commercial and office building: a six-storey Renaissance Revival loft block in buff brick on a
// granite base, with cream limestone bands at each storey line and a balustraded cornice. Footprint 28 x 8 (x across the
// long street front, low z = north, high z = south; the south front at z = 7 carries the entrance). The lidar reads 22
// blocks over the west six columns (x 0..5) and 19 to 21 over the rest, so it is two clean tiers: a 20-block main
// body and a 22-block west bay that rises one storey higher, its east wall sealed at x = 5. Storeys are 3 blocks: a
// limestone band at y = 3k, then two rows of glass in the brick piers (y = 3k+1, 3k+2). Ground floor: granite plinth
// at y 0, shopfront glass between granite piers, a double entrance at x 13-14 with a lantern in the vestibule. Upper
// piers are two blocks deep and the upper glass sits one block back in the reveal. Air behind the glass and a floor
// slab per storey (no interiors). Glowstone sits behind some lower panes. Roofs: tar at y 19 (main) and y 21 (bay), a balustrade on the main parapet, two brick stacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034253.cells.json`, "utf8"));
const X = 28, Z = 8, Y = 24;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Roof tiers, smoothed from the lidar: 22 over the west bay, 20 over the main body. Ground is 0 everywhere.
const top = (x) => (x <= 5 ? 22 : 20);
const bay = (x) => x <= 5;
const ring = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const corner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
// Brick piers: every third column on the long fronts (x), and at z 3 on the short sides (z). Corners always.
const pier = (x, z) => corner(x, z) || (z === 0 || z === Z - 1 ? x % 3 === 0 : z === 3);
const door = (x, z, y) => z === Z - 1 && (x === 13 || x === 14) && (y === 1 || y === 2);
// One step in from a ring cell (the shell's interior face), and two steps in: upper windows are recessed one block
// behind the piers and bands, so each pane has a reveal.
const inward = (x, z) => (z === 0 ? [x, 1] : z === Z - 1 ? [x, Z - 2] : x === 0 ? [1, z] : [X - 2, z]);
const inward2 = (x, z) => (z === 0 ? [x, 2] : z === Z - 1 ? [x, Z - 3] : x === 0 ? [2, z] : [X - 3, z]);
const paneState = (x, z) => (z === 0 || z === Z - 1
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }   // pane on a long front
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });  // pane on a short side
const faceIndex = (x, z) => (z === 0 ? 0 : z === Z - 1 ? 1 : x === 0 ? 2 : 3);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

const g = new Voxels([X, Y, Z]);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const T = top(x);
  const outer = ring(x, z);

  for (let y = 0; y < T; y++) {
    // Floors and the tar roof stand on the interior side of the shell; the bay's east wall is sealed at x = 5.
    if (!outer) {
      if (x === 5 && (y === 19 || y === 20)) g.set(x, y, z, "bricks");
      else if (y === 0 || y % 3 === 0) g.set(x, y, z, "smooth_stone");
      else if (y === T - 1) g.set(x, y, z, "gray_concrete");
      continue;
    }

    // Outer shell: granite plinth, limestone bands at each storey line, piers and glass between.
    if (x === 5 && (y === 19 || y === 20)) { g.set(x, y, z, "bricks"); continue; }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }
    if (y === T - 1) {                                             // main parapet: a balustrade, every other block
      if (corner(x, z) || (x + z) % 2 === 0) g.set(x, y, z, "smooth_sandstone");
      continue;
    }

    const ground = y < 3;
    if (door(x, z, y)) continue;                                   // doors are placed below
    if (ground && pier(x, z)) { g.set(x, y, z, "polished_granite"); continue; }
    if (!ground && pier(x, z)) {                                   // upper piers are two blocks deep, but not at corners
      g.set(x, y, z, "bricks");
      if (!corner(x, z)) { const [ix, iz] = inward(x, z); g.set(ix, y, iz, "bricks"); }
      continue;
    }
    // Ground shopfront glass sits flush; upper glass sits one block in, behind the piers and bands.
    const [px, pz] = ground ? [x, z] : inward(x, z);
    g.set(px, y, pz, "glass_pane", paneState(x, z));
    if (y % 3 === 1 && lit(z === 0 || z === Z - 1 ? x : z, y, faceIndex(x, z))) {   // warm glow on the lower pane
      const [bx, bz] = ground ? inward(x, z) : inward2(x, z);
      g.set(bx, y, bz, "glowstone");
    }
  }
}

// Entrance: a double door on the south front, hinged at the granite piers, with a lantern hung in the vestibule.
for (const x of [13, 14]) {
  const hinge = x === 13 ? "left" : "right";
  g.set(x, 1, Z - 1, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, Z - 1, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
g.set(13, 2, Z - 2, "lantern", { hanging: "true", waterlogged: "false" });

// Two brick stacks on the main roof, standing on the tar.
for (const [x, z] of [[9, 3], [20, 4]]) {
  g.set(x, 20, z, "bricks"); g.set(x, 21, z, "bricks"); g.set(x, 22, z, "smooth_sandstone");
}

g.save(`${DIR}/NYC1034253.nbt`);
console.log("NYC1034253.nbt", { blocks: g.count(), size: [X, Y, Z] });
