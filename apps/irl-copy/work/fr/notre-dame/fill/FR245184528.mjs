// FR245184528: an unrecorded-use block on the Latin Quarter side of the river. Haussmann-era stone: four storeys
// (a rez-de-chaussée shopfront and three floors of windows) on a plinth, a cornice and parapet, and a flat zinc-grey
// roof with chimney stacks. The footprint is the lidar cell list; the roof is one clean tier at 22 (the lidar's common
// value, with its stray edge readings clamped to it); the walls start at each cell's own ground, so the downhill side
// shows its foundation. Interiors are a hollow shell with a floor slab per storey, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184528.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184528.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const ROOF = 22;                          // one flat tier (the lidar's mode); y 21 is the parapet top
const SLABS = [5, 10, 15, 20];            // floor slabs, the cornice row sits on the top one
const STRINGS = [5, 10, 15];              // storey lines on the shell
const PARAPET = ROOF - 1;                 // y 21
const UPPER = [6, 11, 16];                // sill rows of the three upper storeys (each 4 rows: sill, 2 glass, head)

const vox = new Voxels([54, 38, 33]);
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inside = (x, z) => ground.has(key(x, z));
const exposure = (x, z) => ({ w: !inside(x - 1, z), e: !inside(x + 1, z), n: !inside(x, z - 1), s: !inside(x, z + 1) });
const isShell = (x, z) => { const e = exposure(x, z); return e.w || e.e || e.n || e.s; };

// the door: on the main south (+z) face near its middle, on a window column (x % 4 == 1), low enough for two door rows
const doorCandidates = cells.filter(([x, z, gr]) => exposure(x, z).s && z >= 28 && gr <= 2 && x % 4 === 1);
const [doorX, doorZ] = doorCandidates.reduce((best, c) => (Math.abs(c[0] - 38) < Math.abs(best[0] - 38) ? c : best))
  .slice(0, 2);
const DOOR_FACING = "south";

const glass = [];                         // every pane, with its wall axis, to connect once the wall is built
const lanterns = [];

// The rhythm of a wall: windows on columns 1 and 2 of each four, piers on 0 and 3; corners are quoins.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");        // foundation to this cell's ground
  const e = exposure(x, z);
  if (!isShell(x, z)) {                                                  // hollow inside: floor slabs and the roof deck only
    for (const y of SLABS) vox.set(x, y, z, "stone");
    vox.set(x, ROOF - 1, z, "gray_concrete");
    continue;
  }
  const corner = (e.w || e.e) && (e.n || e.s);
  const alongX = e.n || e.s;             // the wall runs along x (a +z or -z face)
  const along = alongX ? x : z;
  const window = [1, 2].includes(((along % 4) + 4) % 4);
  for (let y = gr; y <= PARAPET; y++) {
    let block = null, state = null;
    if (y === PARAPET) block = "stone_bricks";                           // parapet
    else if (y === ROOF - 2) block = "smooth_stone";                     // cornice
    else if (STRINGS.includes(y)) block = "stone_bricks";                // storey line
    else if (corner) block = "chiseled_stone_bricks";                    // quoins
    else if (y < 5) {                                                    // rez-de-chaussée
      if (y === gr) block = "stone_bricks";                              // plinth
      else if (window && y >= gr + 1 && y <= Math.min(gr + 2, 4)) block = "glass_pane";   // shopfront (the door overrides below)
      else if (y === gr + 3 && y <= 4) block = "stone_bricks";         // lintel
      else block = "calcite";
    } else {
      const sill = UPPER.findLast((b) => b <= y);
      if (y === sill) block = window ? "smooth_stone_slab" : "calcite";
      else if (y === sill + 3) block = window ? "stone_bricks" : "calcite";
      else if (window && y > sill && y < sill + 3) block = "glass_pane";
      else block = "calcite";
    }
    if (block === "smooth_stone_slab") state = { type: "bottom", waterlogged: "false" };
    if (block === "glass_pane") glass.push({ x, y, z, alongX });
    if (block) vox.set(x, y, z, block, state ?? undefined);
  }
  // the door, two cells tall, in the south wall at (doorX, doorZ)
  if (x === doorX && z === doorZ) {
    const lower = ground.get(key(x, z)) + 1;
    for (const [y, half] of [[lower, "lower"], [lower + 1, "upper"]]) {
      vox.set(x, y, z, "dark_oak_door", { facing: DOOR_FACING, half, hinge: "left", open: "false", powered: "false" });
    }
  }
}

// Window lights: a lantern standing on the floor behind a lit upper-storey sill, a hanging one under the ground-floor
// ceiling behind a shopfront. The lanterns sit in the air inside the glass, never against it.
const inward = (x, z, e) => (e.s ? [x, z - 1] : e.n ? [x, z + 1] : e.e ? [x - 1, z] : [x + 1, z]);
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  if (!isShell(x, z) || (e.w && e.e) || (e.n && e.s)) continue;
  const along = (e.n || e.s) ? x : z;
  if (![1, 2].includes(((along % 4) + 4) % 4)) continue;
  const [ix, iz] = inward(x, z, e);
  if (!inside(ix, iz) || isShell(ix, iz)) continue;
  const h = (x * 31 + z * 17) % 5;
  if (h === 0) lanterns.push([ix, UPPER[(x + z) % UPPER.length], iz, false]);   // standing on that storey's floor
  if (h === 2) lanterns.push([ix, 4, iz, true]);                              // hanging under the shopfront ceiling
}
for (const [x, y, z, hanging] of lanterns) vox.set(x, y, z, "lantern", { hanging: String(hanging), waterlogged: "false" });

// Connect each pane along its wall to what is beside it (glass or wall), as the game does.
for (const p of glass) {
  const [a, b] = p.alongX ? [[p.x - 1, p.y, p.z], [p.x + 1, p.y, p.z]] : [[p.x, p.y, p.z - 1], [p.x, p.y, p.z + 1]];
  const joins = (q) => vox.get(...q) !== null;
  const side = p.alongX ? ["west", "east"] : ["north", "south"];
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (joins(a)) st[side[0]] = "true";
  if (joins(b)) st[side[1]] = "true";
  vox.set(p.x, p.y, p.z, "glass_pane", st);
}

// Roof: stacks of brick on the deck, deep inside the footprint, spaced apart
const deep = (x, z) => [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => inside(x + dx, z + dz)));
const stacks = [];
for (let z = 3; z < 30; z += 3) for (let x = 3; x < 52; x += 3) {
  if (stacks.length < 4 && deep(x, z) && stacks.every(([sx, sz]) => Math.abs(sx - x) + Math.abs(sz - z) >= 12)) stacks.push([x, z]);
}
for (const [sx, sz] of stacks) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  for (let y = ROOF; y <= ROOF + 2; y++) vox.set(sx + dx, y, sz + dz, "bricks");
  vox.set(sx + dx, ROOF + 3, sz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const res = vox.save(OUT);
console.log(`built ${res.blocks} blocks, palette ${res.palette}; door at x=${doorX} z=${doorZ}; ${glass.length} panes, ${lanterns.length} lanterns, ${stacks.length} stacks`);
