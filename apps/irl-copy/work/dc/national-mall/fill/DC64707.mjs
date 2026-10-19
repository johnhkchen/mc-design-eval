// DC64707: a vacant red-brick and limestone office block on Massachusetts Ave NE, DC 20002, as a 1.21.1 module.
// Read as a 1910s-1920s Beaux-Arts commercial block: red brick walls, calcite (limestone) quoins, sills, string courses
// and cornice, granite plinth. The lidar roof is smoothed (3x3 median) and snapped to four flat tiers: 5 (one-storey
// wings), 8 (a step), 15 (the four-storey body) and 18 (the corner pavilions), so the massing steps in as it rises.
// Each storey is 4 blocks (3 of glazing and sill + a string course), as in the other DC modules. Every column stands
// on its own ground (granite foundation below), the interior is floor slabs per storey with air between, and the
// windows are glass panes behind brick piers. The ground floor is boarded (vacant); a few upper windows have a warm
// glowstone behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64707.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64707.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, then snapped to flat tiers.
const tier = (h) => (h <= 6 ? 5 : h <= 11 ? 8 : h <= 15 ? 15 : 18);
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  c.top = tier(vals[vals.length >> 1]);
}

// Outward faces: a neighbour outside the footprint, or one whose tier is lower (a step up the massing).
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const c of F.values()) {
  c.exp = Object.entries(DIRS).filter(([, [dx, dz]]) => {
    const o = F.get(key(c.x + dx, c.z + dz)); return !o || o.top < c.top;
  }).map(([n]) => n);
  c.ext = c.exp.length > 0;
}

// Palette
const PLINTH = "polished_granite";
const STONE = "calcite";           // limestone: quoins, sills, string courses, cornice, lintels
const BRICK = "bricks";            // the walls and piers
const GLASS = "glass_pane";
const BOARD = "spruce_planks";     // ground-floor windows, boarded (vacant)
const SLAB = "smooth_stone";       // floor slabs and the roof membrane
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const STEP = "polished_granite_stairs";
const LAMP = "glowstone";
const AC = "iron_block";
const CAP = "lantern";

const g = new Voxels([62, 30, 84]);
const wallState = (d) => (d === "north" || d === "south"
  ? { north: "false", south: "false", east: "true", west: "true" }     // a north/south wall runs along x
  : { north: "true", south: "true", east: "false", west: "false" });   // an east/west wall runs along z

for (const c of F.values()) {
  const { x, z, g: gr, top, exp, ext } = c;
  const T = top - gr;                                  // the roof, measured from this cell's own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH); // foundation: nothing floats on a slope

  if (!ext) {                                          // interior: floor slab per storey, air between, roof membrane
    for (let rel = 0; rel < T; rel++) if (rel % 4 === 0 || rel === T - 1) g.set(x, gr + rel, z, SLAB);
    // Roof equipment on the membrane: AC units on the body, lanterns on the pavilions.
    if (top === 15 && x % 12 === 6 && z % 10 === 5) g.set(x, gr + T, z, AC);
    if (top === 18 && x % 9 === 4 && z % 9 === 4) g.set(x, gr + T, z, CAP, { hanging: "false" });
    continue;
  }

  // Exterior
  // The diagonal sides are stair-stepped, so most cells face two ways; each takes one face's pattern (outer faces first)
  // and the corners fall on the piers. No quoin blocks: the stair-step would make the whole diagonal limestone.
  {
    const outerDirs = exp.filter((n) => !inF(x + DIRS[n][0], z + DIRS[n][1]));
    const d = outerDirs[0] ?? exp[0];
    const [dx, dz] = DIRS[d];
    const along = d === "north" || d === "south" ? x : z;
    const bay = along % 4;                             // 4-bay rhythm: piers at 0 and 3, windows at 1 and 2
    const outside = !inF(x + dx, z + dz);              // an outer face (not a step against a lower roof)
    const doorHere = outside && bay === 1 && along % 16 === 9 && T >= 6;
    const inner = F.get(key(x - dx, z - dz));          // the room behind this face (for a lamp behind the glass)
    for (let rel = 0; rel < T; rel++) {
      const y = gr + rel;
      let b = null, st;
      if (rel === 0) b = PLINTH;
      else if (rel === T - 1 || rel % 4 === 0) b = STONE;          // cornice and string courses
      else if (doorHere && rel <= 2) { b = DOOR; st = { facing: d, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (doorHere && rel === 3) b = STONE;                   // door lintel
      else if (bay === 0 || bay === 3) b = BRICK;                  // piers
      else if (rel % 4 === 1 && rel !== T - 2) b = STONE;          // sills
      else if (rel < 4) b = BOARD;                                 // ground floor boarded
      else {
        b = GLASS; st = wallState(d);
        const lamp = inner && inF(x - dx, z - dz) && rel % 4 === 2 && (along * 5 + rel * 3 + x + z) % 9 === 0 && inner.top - gr > rel;
        if (lamp) g.set(x - dx, y, z - dz, LAMP);
      }
      if (doorHere && rel === 0) g.set(x, y, z, STEP, { facing: d, half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, b, st);
    }
  }
}

// Parapets: a low wall on the roof edge of every exterior cell, linked to its neighbouring parapets.
for (const c of F.values()) {
  if (!c.ext) continue;
  const side = (n) => {
    const [dx, dz] = DIRS[n]; const o = F.get(key(c.x + dx, c.z + dz));
    return o && o.ext && o.top === c.top ? "low" : "none";
  };
  g.set(c.x, c.top, c.z, PARAPET, {
    up: "true", north: side("north"), south: side("south"), east: side("east"), west: side("west"),
  });
}

const r = g.save(OUT);
console.log(`wrote ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
