// way 326735492: a three-storey Auckland commercial block of the 1920s-30s, on a street in Mt Eden / Eden Terrace.
// Rendered plaster walls (smooth quartz with quartz-brick belt courses), white-concrete pilasters on every third
// cell, sash-style window ribbons on the two upper floors, and a dark timber shopfront at street level with a
// dark fascia and a door under lanterns. Stone foundations stand on the downhill side. The lidar roof sits at
// 13-14 above y 0 (13 on the flat, 14 in the middle): smoothed to one deck at y 12 with a parapet at y 13, and
// roof plant on the raised cells. Warm glowstone sits in the air gap behind some shop and window glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735492.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735492.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const XZ = (key) => key.split(",").map(Number);
const groundAt = new Map(), roofAt = new Map();
for (const [x, z, ground, roof] of cells) { groundAt.set(K(x, z), ground); roofAt.set(K(x, z), roof); }
const inF = (x, z) => roofAt.has(K(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces into the building
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const isWall = (x, z) => outsOf(x, z).length > 0;                 // footprint edge: street and side walls
const isInner = (x, z) => inF(x, z) && !isWall(x, z);             // the air gap behind the walls

// Storeys (4 blocks each): ground floor y 1-4 (stallriser, glass, fascia), second y 5-8, third y 9-12.
// Floor slabs at y 1, 5, 9; the roof deck at y 12; the parapet at y 13.
const FLOORS = [1, 5, 9], DECK = 12, PARAPET = 13;
function wallRole(y) {
  if (y === 1) return "base";
  if (y <= 3) return "shop";
  if (y === 4) return "fascia";
  if (y === 5 || y === 9) return "belt";
  if (y === 8) return "span";
  if (y === 12) return "cornice";
  if (y === PARAPET) return "parapet";
  return "win";                                                   // y 6-7 and 10-11
}

// Entrances: the two longest runs of street-facing wall cells on ground level 1 (one face each). The door is the
// middle cell of a run; bays either side carry a lantern under the fascia.
function pickEntrances() {
  const faces = { N: [], S: [], W: [], E: [] };
  for (const key of roofAt.keys()) {
    const [x, z] = XZ(key);
    if (groundAt.get(key) !== 1) continue;
    const outs = outsOf(x, z);
    if (outs.length === 1) faces[outs[0]].push({ x, z });
  }
  const ranked = Object.entries(faces).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  return ranked.map(([d, cs]) => {
    const vertical = d === "N" || d === "S";
    cs.sort((a, b) => (vertical ? a.x - b.x : a.z - b.z));
    const mid = Math.floor(cs.length / 2);
    return { d, door: cs[mid], bays: [cs[mid - 1], cs[mid + 1]].filter(Boolean) };
  });
}
const entranceAt = new Map();
const entrances = pickEntrances();
for (const e of entrances) {
  entranceAt.set(K(e.door.x, e.door.z), "door");
  for (const b of e.bays) entranceAt.set(K(b.x, b.z), "bay");
}

// Pane connections follow the wall: a pane joins the footprint cells beside it on its own face.
function paneState(d, x, z) {
  const c = (dx, dz) => (inF(x + dx, z + dz) ? "true" : "false");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (d === "N" || d === "S") { st.east = c(1, 0); st.west = c(-1, 0); }
  else { st.north = c(0, -1); st.south = c(0, 1); }
  return st;
}

const g = new Voxels([17, 27, 10]);
const glassCells = [];   // glass that may get a warm light set in the air gap behind it
const deckCells = [];
for (const [key, roof] of roofAt) {
  const [x, z] = XZ(key);
  const ground = groundAt.get(key);
  const wall = isWall(x, z);
  const outs = outsOf(x, z);
  const d = outs[0];
  const along = d === "N" || d === "S" ? x : z;
  const corner = outs.length > 1;
  const pier = corner || along % 3 === 0;

  // foundation under every cell, up to its own ground: nothing floats on a slope
  for (let y = 0; y < Math.max(ground, 1); y++) g.set(x, y, z, "stone_bricks");

  if (!wall) {
    // interior: floor slabs and the roof deck, air between them
    for (const f of FLOORS) if (f >= ground) g.set(x, f, z, "smooth_stone");
    g.set(x, DECK, z, "light_gray_concrete");
    deckCells.push({ x, z, raised: roof >= 14 });
    continue;
  }

  for (let y = Math.max(ground, 1); y <= PARAPET; y++) {
    const role = wallRole(y);
    const ent = y <= 3 ? entranceAt.get(K(x, z)) : undefined;
    let block = null, state = null;

    if (ent === "door" && y <= 2) {
      block = "dark_oak_door";
      state = { facing: FACING[d], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    } else if (ent === "bay" && y === 3) {
      block = "lantern"; state = { hanging: "true", waterlogged: "false" };
    } else {
      switch (role) {
        case "base": block = pier ? "dark_oak_planks" : "polished_andesite"; break;
        case "shop": block = pier ? "dark_oak_planks" : "glass"; break;
        case "fascia": block = "dark_oak_planks"; break;
        case "belt": case "cornice": block = "quartz_bricks"; break;
        case "span": block = pier ? "white_concrete" : "smooth_quartz"; break;
        case "win":
          if (pier) block = "white_concrete";
          else { block = "glass_pane"; state = paneState(d, x, z); }
          break;
        case "parapet": block = pier ? "white_concrete" : "smooth_quartz"; break;
      }
    }
    g.set(x, y, z, block, state);

    if (role === "shop" && !pier && !ent) glassCells.push({ x, y, z, d, along, tier: "shop" });
    if (role === "win" && !pier) glassCells.push({ x, y, z, d, along, tier: "upper" });
  }
}

// Roof plant on the raised cells (lidar 14): a small checker of plant boxes on the deck, parapet height.
for (const { x, z, raised } of deckCells) {
  if (raised && (x + z) % 2 === 0) g.set(x, PARAPET, z, "light_gray_concrete");
}

// Warm light in the air gap behind some glass: glowstone behind the shopfront and the upper windows.
for (const c of glassCells) {
  if ((c.along * 3 + c.y) % 7 !== 0) continue;
  const [dx, dz] = DIRS[c.d];
  const ix = c.x - dx, iz = c.z - dz;
  if (!isInner(ix, iz)) continue;
  g.set(ix, c.y, iz, "glowstone");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, entrances: entrances.map((e) => `${e.d}@${e.door.x},${e.door.z}`), glass: glassCells.length, ...stats }));
