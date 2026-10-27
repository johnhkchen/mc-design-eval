// Way 260091882: a three-storey interwar brick commercial block (c. 1925-35) on a sloping Auckland site. Red brick
// walls, cream stone string courses and cornice, dark-oak shopfronts on the ground floor, a brick parapet, and a plant
// room on the flat roof. Storeys sit on the common datum y 0 (0, 4, 8), so the downhill (NW) side shows all three and the
// uphill (SE) side is half buried; the foundation fills under every cell to its own ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260091882.cells.json", "utf8"));

// The lidar roof reads 12 on 609 of the 641 cells; the 13/14 cells are spikes and the 2/8/9 cells at the edge sit below
// their own ground. So the massing is one flat roof tier at 12 for the whole footprint, not the noisy per-cell values.
const ROOF = 12;
const BASES = [0, 4, 8];          // storey lines: ground, first, second; each storey is 4 blocks, the top one ends at the roof
const X = 26, Y = 27, Z = 39;

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inside = (x, z) => ground.has(key(x, z));
const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// facade cells: the first side (N, S, W, E) with no footprint cell beyond it; along = the index along that wall
const facades = [];
const isFacade = new Map();
for (const [x, z, gr] of cells) {
  const d = Object.keys(SIDE).find(k => !inside(x + SIDE[k][0], z + SIDE[k][1]));
  if (!d) continue;
  const f = { x, z, gr, d, along: d === "N" || d === "S" ? x : z };
  facades.push(f); isFacade.set(key(x, z), f);
}

const g = new Voxels([X, Y, Z]);

// a solid core under every footprint cell, from y 0 to the roof deck: the floor slabs are the solid storey rows
for (const [x, z] of cells) {
  for (let y = 0; y < ROOF; y++) g.set(x, y, z, "stone");
  g.set(x, ROOF, z, "smooth_stone");                                                             // roof deck: light enough to read as a tier from the air
}

// the wall skin: foundation, string courses, window grid of glass panes in brick piers, spandrels, cornice, parapet
const storeyBase = (y) => BASES.filter(b => y >= b).pop();
const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const f of facades) {
  const { x, z, gr, d, along } = f;
  const pier = along % 3 === 0;
  for (let y = 0; y <= ROOF + 1; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                                      // foundation to its ground
    if (y === ROOF + 1) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; } // coping
    if (y === ROOF) { g.set(x, y, z, "bricks"); continue; }                                        // parapet
    const b = storeyBase(y), r = y - b;
    if (r === 0) g.set(x, y, z, "smooth_stone");                                                   // string course / sill
    else if (r === 3) g.set(x, y, z, b === 0 ? "dark_oak_planks" : b === 8 ? "smooth_stone" : "bricks"); // fascia, spandrel, cornice
    else if (pier) g.set(x, y, z, b === 0 ? "dark_oak_planks" : "bricks");                         // piers
    else if (b === 0) g.set(x, y, z, "glass");                                                     // shopfront glass
    else g.set(x, y, z, "glass_pane", paneState(d));                                              // upper window panes
  }
}

// behind each window an air gap one cell deep (the floor slabs stay solid), with a warm light in some of them
for (const f of facades) {
  const { x, z, gr, d, along } = f;
  if (along % 3 === 0) continue;
  const ix = x - SIDE[d][0], iz = z - SIDE[d][1];
  if (!inside(ix, iz) || isFacade.has(key(ix, iz))) continue;
  for (const b of BASES.slice(0, 3)) {
    const glow = b === 0
      ? (along % 4 === 1 ? "glowstone" : null)
      : ((along * 5 + b) % 11 === 0 ? (along % 2 ? "glowstone" : "shroomlight") : null);
    for (const y of [b + 1, b + 2]) {
      if (y < gr || y >= ROOF) continue;
      g.set(ix, y, iz, glow ?? "air");
    }
  }
}

// the entrance: a dark-oak door on the west facade at a ground-level cell, a flush canopy over it and a hanging lantern
const westGround = facades.filter(f => f.d === "W" && f.gr === 0).sort((a, b) => a.z - b.z);
const door = westGround[Math.floor(westGround.length / 2)];
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, 0, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, 1, door.z, "dark_oak_door", doorState("upper"));
for (const f of facades) if (f.d === "W" && Math.abs(f.z - door.z) <= 1) g.set(f.x, 3, f.z, "dark_oak_planks");
g.set(door.x, 2, door.z, "lantern", { hanging: "true", waterlogged: "false" });

// roof equipment: a plant room of light concrete with a stone lid, set on the roof deck in the north-east
for (let x = 12; x <= 14; x++) for (let z = 2; z <= 4; z++) {
  g.set(x, ROOF + 1, z, "light_gray_concrete");
  g.set(x, ROOF + 2, z, "light_gray_concrete");
  g.set(x, ROOF + 3, z, "smooth_stone");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260091882.nbt");
console.log(`way_260091882.nbt: ${out.blocks} blocks, ${out.palette} palette entries; ${facades.length} facade cells; door at x=${door.x} z=${door.z}`);
