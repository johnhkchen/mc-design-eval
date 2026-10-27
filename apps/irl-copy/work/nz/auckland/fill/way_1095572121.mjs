// Mt Eden / Eden Terrace, Auckland: a single-storey 1920s-30s brick shop with cream render bands, a stone parapet and a
// flat roof. Built on the footprint cells only. y 0 is the lowest ground (ground = 0 here, so the floor sits on it);
// the ground storey is y 1-3, the render band is at roof-2 (y 4), the parapet at roof-1 (y 5), roof = 6 from the lidar.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572121.cells.json`, "utf8"));   // [x, z, ground, roof]
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const NEIGH = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.keys(NEIGH).filter((d) => !has(x + NEIGH[d][0], z + NEIGH[d][1]));
// the coordinate that runs along a wall: x on north/south faces, z on east/west faces
const along = (x, z, side) => (side === "north" || side === "south" ? x : z);

// walls on the outer ring, depth from the ring (1 = wall, 2+ = inside) so lamps can sit an air gap behind the glass
const ring = cells.filter(([x, z]) => exposed(x, z).length > 0).map(([x, z]) => [x, z]);
const depth = new Map(ring.map(([x, z]) => [`${x},${z}`, 1]));
for (const [x, z] of ring) {
  const q = [[x, z]];
  for (let i = 0; i < q.length; i++) {
    const [cx, cz] = q[i], d = depth.get(`${cx},${cz}`);
    for (const [dx, dz] of Object.values(NEIGH)) {
      const k = `${cx + dx},${cz + dz}`;
      if (has(cx + dx, cz + dz) && !depth.has(k)) { depth.set(k, d + 1); q.push([cx + dx, cz + dz]); }
    }
  }
}

// the front is the side with the most plain (single-face) wall
const count = {};
for (const [x, z] of ring) { const s = exposed(x, z); if (s.length === 1) count[s[0]] = (count[s[0]] || 0) + 1; }
const front = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const frontWall = ring.filter(([x, z]) => { const s = exposed(x, z); return s.length === 1 && s[0] === front; })
  .sort((a, b) => along(a[0], a[1], front) - along(b[0], b[1], front));
const [doorX, doorZ] = frontWall[Math.floor(frontWall.length / 2)];

// glass panes connect along the wall they sit in
const pane = (side) => {
  const ew = side === "north" || side === "south";
  return { north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false" };
};

const g = new Voxels([11, 19, 9]);
for (const [x, z, ground, roof] of cells) {
  const base = ground, deck = roof - 2, top = roof - 1;
  // foundation and floor slab
  for (let y = 0; y <= base; y++) g.set(x, y, z, "stone_bricks");
  const sides = exposed(x, z);
  if (!sides.length) { g.set(x, deck, z, "smooth_stone"); continue; }   // inside: roof deck, air between it and the floor

  const side = sides[0], c = along(x, z, side);
  const isDoor = x === doorX && z === doorZ;
  for (let y = base + 1; y <= top; y++) {
    let b = "bricks", st = null;
    if (y === top) b = "stone_bricks";                          // parapet cap
    else if (y === deck) b = "white_concrete";                  // render band / storey line
    else if (sides.length > 1) b = "white_concrete";            // corner pilaster
    else if (isDoor) {
      if (y <= base + 2) { b = "dark_oak_door"; st = { facing: front, half: y === base + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
      else b = "chiseled_stone_bricks";                         // lintel over the door
    } else if (c % 4 !== 0) {                                   // bays of three between piers
      if (y === base + 1) b = "white_concrete";                 // sill
      else { b = "glass_pane"; st = pane(side); }
    }                                                           // else a brick pier
    g.set(x, y, z, b, st);
  }
}

// inside: a warm lantern hanging from the deck two cells in from the glass, and two roof units on the deck
const inside = cells.filter(([x, z]) => !exposed(x, z).length).map(([x, z, , roof]) => [x, z, roof]);
for (const [x, z, roof] of inside) {
  if (depth.get(`${x},${z}`) === 3 && (x + z) % 2 === 0) g.set(x, roof - 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}
const units = inside.filter(([x, z]) => depth.get(`${x},${z}`) >= 2).filter((_, i) => i % 7 === 3).slice(0, 2);
for (const [x, z, roof] of units) g.set(x, roof - 1, z, "iron_block");

g.save(`${DIR}/way_1095572121.nbt`);
console.log({ front, door: [doorX, doorZ], lanterns: inside.filter(([x, z]) => depth.get(`${x},${z}`) === 3).length, units: units.length, cells: g.count() });
