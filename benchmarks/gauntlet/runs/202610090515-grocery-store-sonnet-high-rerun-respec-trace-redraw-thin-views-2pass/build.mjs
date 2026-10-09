// Corner Grocery — round 2 (SIDES + BACK + ROOF; front unchanged from round 1). x east, y up, z south; front faces NORTH (z small).
// Wall plane z=2. Depth d (from depth.txt) -> z = 2 - d  (+1 => z=1, +2 => z=0, -1 => z=3, -2 => z=4).
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "round-2.nbt");
const g = new Grid([15, 18, 15]);
// The trace/depth x axis runs left->right as seen from the street; world +x is the viewer's LEFT when facing south,
// so every design coordinate is mirrored on write (X = 14 - x) and east/west facings + door hinges are flipped.
const MX = (x) => 14 - x;
const flip = { east: "west", west: "east", left: "right", right: "left" };
function mirrored(s) {
  if (!s) return s;
  const o = { ...s };
  if (o.facing in flip) o.facing = flip[o.facing];
  if (o.hinge in flip) o.hinge = flip[o.hinge];
  return o;
}
const set = (x, y, z, b, s) => (Array.isArray(b) ? g.set(MX(x), y, z, b[0], mirrored(b[1])) : g.set(MX(x), y, z, b, mirrored(s)));
const fill = (a, b, blk) => g.fill([MX(b[0]), a[1], a[2]], [MX(a[0]), b[1], b[2]], blk);
const carve = (_g, a, b) => fill(a, b, "minecraft:air");
const Z = (d) => 2 - d;

const BRICK = "bricks", QUARTZ = "smooth_quartz", DARK = "dark_oak_planks", PIER = "stripped_dark_oak_log";
const FLOWERS = ["red_tulip", "orange_tulip", "pink_tulip", "allium", "cornflower", "azure_bluet", "poppy", "dandelion"];

// ---------------------------------------------------------------------------------------------------------------
// BODY — the whole volume so it stands (sides / back / roof are the next pass's job). Front slab is 3 thick (z=2..4)
// so recesses up to -2 have backing; interior is hollow behind it.
function body() {
  fill([1, 0, 2], [13, 14, 13], BRICK);
  fill([2, 1, 5], [12, 13, 12], "minecraft:air");             // hollow interior
  fill([2, 0, 5], [12, 0, 12], "spruce_planks");               // floor
  fill([1, 15, 1], [13, 15, 13], "smooth_stone");              // flat roof deck (cornice plate below)
  // plain side walls: slit windows (the sides get their real design next pass)
  fill([0, 0, 0], [14, 0, 14], "smooth_stone");                // sidewalk rim
  // cornice ring: front z=1 (done in front()), sides x=0 / x=14, rear z=14
  fill([0, 15, 1], [0, 15, 14], QUARTZ);
  fill([14, 15, 1], [14, 15, 14], QUARTZ);
  fill([0, 15, 14], [14, 15, 14], QUARTZ);
  fill([1, 15, 1], [13, 15, 1], QUARTZ);
  for (let z = 2; z <= 14; z++) { set(0, 14, z, B.slab("quartz", "top")); set(14, 14, z, B.slab("quartz", "top")); }
  for (let x = 1; x <= 13; x++) set(x, 14, 14, B.slab("quartz", "top"));
}

// ---------------------------------------------------------------------------------------------------------------
// FRONT — everything on the street face. Cell-for-cell from trace.txt, relief from depth.txt.
function front() {
  recessedShopLevel();
  entrance();
  shopWindows();
  piers();
  produce();
  awnings();
  stringCourseAndSign();
  apartmentFloor();
  cornicesAndFrieze();
}

function recessedShopLevel() {   // shop level y1..4 sits 1 behind the wall plane (z=3); shop frame is dark oak
  for (const [x0, x1] of [[1, 5], [9, 13]]) {
    fill([x0, 0, 2], [x1, 5, 4], DARK);
    carve(g, [x0, 1, 2], [x1, 4, 2]);
  }
  // sill row y0 stays at the wall plane (planks); a quartz-less dark course is the frame
}

function entrance() {            // x6..8, y0..3 recessed 2 (door plane z=4) + stepped dark lintel
  carve(g, [6, 0, 2], [8, 3, 4]);
  carve(g, [7, 4, 2], [8, 4, 3]);
  carve(g, [6, 4, 2], [6, 4, 2]);
  fill([6, 0, 2], [8, 0, 4], "spruce_planks");               // spruce floor
  fill([6, 1, 5], [8, 3, 5], "black_concrete");               // dark interior
  fill([5, 1, 5], [5, 3, 5], "black_concrete");               // keep the dark visible past the piers
  fill([9, 1, 5], [9, 3, 5], "black_concrete");
  fill([6, 4, 3], [6, 4, 3], DARK);                          // lintel: x6 -1, x7/8 -2
  fill([7, 4, 4], [8, 4, 4], DARK);
  fill([6, 5, 3], [8, 5, 3], DARK);                          // sign backing, recessed -1
  carve(g, [6, 5, 2], [8, 5, 2]);
  // shelves + counter visible inside
  set(8, 1, 4, "barrel", { facing: "up", open: "false" });
  set(8, 2, 4, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  set(7, 1, 4, "composter", { level: "0" });
  set(6, 1, 4, "barrel", { facing: "up", open: "false" });
  // open door leaf against the left jamb (x=6)
  set(6, 1, 3, "dark_oak_door", { facing: "west", half: "lower", hinge: "right", open: "true", powered: "false" });
  set(6, 2, 3, "dark_oak_door", { facing: "west", half: "upper", hinge: "right", open: "true", powered: "false" });
}

function shopWindows() {         // x2..4 / x10..12: glass y1..2 and dark lintel y3 at z=4 (-2); sill y0 at plane
  for (const [x0, x1] of [[2, 4], [10, 12]]) {
    carve(g, [x0, 1, 2], [x1, 3, 3]);
    fill([x0, 3, 4], [x1, 3, 4], DARK);
    fill([x0, 1, 5], [x1, 2, 5], "light_blue_stained_glass");     // pale glass reads over the dark interior
    for (let x = x0; x <= x1; x++) for (const y of [1, 2]) set(x, y, 4, B.pane("light_blue_stained_glass_pane"));
    // 1-block mullion: a dark fence standing in front of the middle pane
    for (const y of [1, 2]) set((x0 + x1) / 2, y, 3, B.fence("dark_oak"));
    // sill: a dark oak slab one half-block proud in front of the glass
    for (let x = x0; x <= x1; x++) if (x !== (x0 + x1) / 2) set(x, 1, 3, B.slab("dark_oak", "bottom"));
  }
}

function piers() {               // x1,5,9,13 stripped dark-oak logs, recessed -1 (z=3), proud of the -2 windows
  for (const x of [1, 5, 9, 13]) for (let y = 1; y <= 4; y++) set(x, y, 3, B.log("stripped_dark_oak", "y"));
  // pier caps / bases: dark planks course below the awning, already in place at z=2 (y5)
}

function produce() {             // sidewalk goods, z=0..1
  const barrel = () => ["barrel", { facing: "up", open: "false" }];
  const comp = () => ["composter", { level: "0" }];
  // left x1..5
  set(1, 0, 1, comp()); set(2, 0, 1, barrel()); set(3, 0, 1, comp()); set(4, 0, 1, barrel()); set(5, 0, 1, comp());
  set(1, 1, 1, barrel()); set(5, 1, 1, barrel());
  for (const y of [1, 2]) for (const z of [0, 1]) set(2, y, z, "melon");
  set(3, 1, 1, "red_tulip"); set(4, 1, 1, "azure_bluet");
  set(1, 2, 1, "poppy"); set(5, 2, 1, "dandelion");
  // right x9..13
  set(9, 0, 1, comp()); set(10, 0, 1, "pumpkin", { }); set(11, 0, 1, barrel()); set(12, 0, 1, "hay_block", { axis: "y" }); set(13, 0, 1, barrel());
  set(9, 1, 1, barrel()); set(13, 1, 1, barrel());
  set(11, 1, 1, "orange_tulip"); set(13, 2, 1, "cornflower");
  for (const z of [0, 1]) set(10, 1, z, "pumpkin");
  for (const y of [1, 2]) for (const z of [0, 1]) set(12, y, z, "pumpkin");
  set(9, 2, 1, "pink_tulip");
}

function awnings() {             // y4-5, left x1..5 / right x9..13; red at odd x (z=1), white at even x (z=0, 2 proud)
  for (const [x0, x1] of [[1, 5], [9, 13]]) {
    for (let x = x0; x <= x1; x++) {
      const red = x % 2 === 1;
      const wool = red ? "red_wool" : "white_wool";
      for (const y of [4, 5]) {
        set(x, y, 1, wool);
        if (!red) set(x, y, 0, wool);
      }
    }
  }
}

function stringCourseAndSign() {
  const Q = (x, y, z) => set(x, y, z, QUARTZ);
  for (let x = 1; x <= 13; x++) {                         // y7 course, +1; x4/x10 -1 (lantern gaps)
    if (x === 4 || x === 10) Q(x, 7, 3); else Q(x, 7, 1);
  }
  carve(g, [1, 6, 2], [4, 6, 2]); carve(g, [10, 6, 2], [13, 6, 2]);   // sign band recessed 1 (z=3)
  carve(g, [4, 7, 2], [4, 7, 2]); carve(g, [10, 7, 2], [10, 7, 2]);
  for (const x of [1, 2, 3, 11, 12, 13]) set(x, 6, 3, B.slab("quartz", "top"));
  for (const x of [4, 10]) { set(x, 6, 3, B.lantern(true)); fill([x, 6, 4], [x, 6, 4], DARK); }
  // sign: moss field with lime letters, dark frame, +1
  const letters = [0, 1, 0, 1, 0];
  for (let i = 0; i < 5; i++) set(5 + i, 6, 1, letters[i] ? "lime_concrete" : "moss_block");
  set(5, 5, 1, DARK); set(9, 5, 1, DARK);
  // pediment: stepped quartz stairs flank the centre flower box, rising to the middle
  set(5, 8, 1, B.stairs("quartz", "east", "bottom"));
  set(9, 8, 1, B.stairs("quartz", "west", "bottom"));
}

function apartmentFloor() {      // y8..13
  const centres = [3, 7, 11];
  centres.forEach((c, i) => {
    // flower box: planks at the wall plane, open trapdoor face standing proud; box 3 wide, flowers on top
    for (let x = c - 1; x <= c + 1; x++) {
      if (c === 7) { set(x, 8, 1, "jungle_planks"); set(x, 8, 0, B.trapdoor("jungle", "north", "bottom", true)); }
      else { set(x, 8, 2, "jungle_planks"); set(x, 8, 1, B.trapdoor("jungle", "north", "bottom", true)); }
      const fz = c === 7 ? 1 : 2;
      set(x, 9, fz, FLOWERS[(i * 3 + (x - c + 1)) % FLOWERS.length]);
    }
    // window: glass 1x2 in a 1-wide, 2-deep niche (z=4), brick head behind; shutters flank, recessed 1
    carve(g, [c, 10, 2], [c, 12, 3]);
    for (const y of [10, 11]) set(c, y, 4, B.pane("light_blue_stained_glass_pane"));
    set(c, 12, 4, BRICK);
    for (const y of [10, 11]) set(c, y, 5, "light_blue_stained_glass");   // pale glass reads over the dark interior
    set(c, 13, 1, BRICK);                                   // keystone, proud 1
    for (const sx of [c - 1, c + 1]) {
      carve(g, [sx, 10, 2], [sx, 12, 2]);
      for (const y of [10, 11]) set(sx, y, 3, B.trapdoor("dark_oak", "north", "bottom", true));
      set(sx, 12, 3, B.stairs("quartz", sx < c ? "east" : "west", "bottom"));
    }
  });
}

function cornicesAndFrieze() {   // y14 frieze + pilasters, y15 cornice, y16 coping, y17 centre tab
  // frieze: dark panels at z=1; pilasters (quartz) at z=0..1
  for (let x = 1; x <= 13; x++) set(x, 14, 1, DARK);
  for (const x of [1, 5, 9, 13]) {
    for (const y of [14, 15, 16]) for (const z of [0, 1]) set(x, y, z, QUARTZ);
    set(x, 16, 2, QUARTZ);
    set(x, 14, 1, QUARTZ);
  }
  fill([0, 15, 1], [14, 15, 1], QUARTZ);                    // cornice, front z=1 (overhangs sides at x0/x14)
  // coping y16 behind the pilasters: white at x2..4 / x10..12, brick at x6..8
  fill([2, 16, 2], [4, 16, 2], QUARTZ);
  fill([10, 16, 2], [12, 16, 2], QUARTZ);
  fill([6, 16, 2], [8, 16, 2], BRICK);
  fill([6, 17, 1], [8, 17, 2], QUARTZ);                      // raised centre cap
  // slab lip under the front cornice over the frieze
}


// ---------------------------------------------------------------------------------------------------------------
// SIDES — one wall function, run for the street-right wall (design x=13, outward +x) and mirrored for the left (x=1).
// Rhythm (z): front pier z=3 | pier z=4 | slit z=6 | pier z=8 | slit z=10 | stack z=12..13.  Bands: y7 dark belt,
// y14 dark frieze with quartz pilasters at z=4/8/12 under an upside-down stair cornice, y15 slab, y16 dark parapet panels.
const IN = (dir) => (dir > 0 ? "west" : "east");
function sides() {
  sideWall(13, +1);
  sideWall(1, -1);
}
function sideWall(sx, dir) {
  const ox = sx + dir, ix = sx - dir, inward = IN(dir);
  const Z0 = 4, Z1 = 12;
  // piers: stripped dark-oak logs proud 1, y1..6 under the belt; a dark cap stair on top
  for (const z of [4, 8]) {
    for (let y = 1; y <= 2; y++) set(sx, y, z, B.log("stripped_dark_oak", "y"));   // flush below: the sidewalk strip stays walkable
    for (let y = 3; y <= 4; y++) set(ox, y, z, B.log("stripped_dark_oak", "y"));  // proud corbel above head height
    set(ox, 5, z, B.stairs("dark_oak", inward, "bottom"));        // pier cap steps into the wall
  }
  // slit windows 1x3 at z=6, 10: dark-oak backing 1 deep, glass pane in the wall plane, brick head, proud sill slab
  for (const z of [6, 10]) {
    for (let y = 1; y <= 3; y++) {
      set(ix, y, z, DARK);
      set(sx, y, z, B.pane("light_blue_stained_glass_pane"));
    }
    set(ox, 1, z, B.slab("dark_oak", "bottom"));
    for (const dz of [-1, 1]) set(sx, 4, z + dz, DARK);           // little dark head course either side
  }
  // base: a one-course dark skirt at y1 between slit and pier would clutter — keep brick; add the y7 belt course
  for (let z = Z0; z <= 11; z++) {
    set(sx, 7, z, DARK);
  }
  // upper floor: two dark inset windows (backed 1 deep) + one white-framed pane beside the stack
  for (const [z, y] of [[5, 11], [9, 10]]) {
    set(sx, y, z, "minecraft:air");
    set(ix, y, z, DARK);
  }
  {
    const z = 11, y = 9;                                           // white-framed 1x1
    set(sx, y, z, B.pane("light_blue_stained_glass_pane"));
    set(sx, y, z - 1, QUARTZ); set(sx, y + 1, z, QUARTZ); set(sx, y - 1, z, QUARTZ);
    set(sx, y, z + 1, QUARTZ);
    set(ox, y - 2, z, B.slab("quartz", "top"));                    // proud sill under the frame
  }
  // frieze + cornice: dark panels in the wall plane, quartz pilasters proud under the slab, stair lip between
  for (let z = 3; z <= 13; z++) set(sx, 14, z, DARK);
  for (let z = 3; z <= 13; z++) {
    if ([4, 8, 12].includes(z)) set(ox, 14, z, QUARTZ);
    else set(ox, 14, z, B.stairs("quartz", inward, "top"));
  }
  // parapet: dark panels at the wall line, quartz posts above the pilasters, slab coping
  for (let z = 3; z <= 13; z++) {
    const post = [4, 8, 12].includes(z);
    set(sx, 16, z, post ? QUARTZ : DARK);
    set(sx, 17, z, B.slab("quartz", "bottom"));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// BACK — z=14 outward from the rear wall (z=13): three window bays + a back door, same piers/frieze language as the sides.
function back() {
  const oz = 14;
  for (const x of [1, 5, 9, 13]) for (let y = 1; y <= 4; y++) set(x, y, oz, B.log("stripped_dark_oak", "y"));
  // belt course
  for (let x = 1; x <= 13; x++) set(x, 7, 13, DARK);
  // back door at x=7 recessed 1 under a proud dark lintel + stone step; lantern beside
  set(7, 1, 13, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(7, 2, 13, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [6, 7, 8]) set(x, 3, oz, DARK);
  set(7, 3, 13, DARK);
  set(6, 2, oz, B.lantern(true));
  set(8, 2, oz, B.lantern(true));
  // ground windows: 1x2 panes, dark trapdoor shutters, proud sill
  for (const c of [3, 11]) {
    for (const y of [2, 3]) set(c, y, 13, B.pane("light_blue_stained_glass_pane"));
    for (const dx of [-1, 1]) for (const y of [2, 3]) set(c + dx, y, oz, B.trapdoor("dark_oak", "north", "bottom", true));
    set(c, 1, oz, B.slab("dark_oak", "bottom"));
  }
  // upper windows like the front: glass 1x2, open shutters, quartz stair lintels, flower sill
  for (const c of [3, 7, 11]) {
    for (const y of [10, 11]) set(c, y, 13, B.pane("light_blue_stained_glass_pane"));
    for (const dx of [-1, 1]) {
      for (const y of [10, 11]) set(c + dx, y, oz, B.trapdoor("dark_oak", "north", "bottom", true));
      set(c + dx, 12, oz, B.stairs("quartz", dx < 0 ? "east" : "west", "bottom"));
    }
    set(c, 12, oz, B.stairs("quartz", "north", "top"));
    for (const dx of [-1, 0, 1]) set(c + dx, 9, oz, B.slab("quartz", "top"));
  }
  // frieze, pilasters, cornice lip, parapet
  for (let x = 1; x <= 13; x++) set(x, 14, 13, DARK);
  for (let x = 2; x <= 12; x++) {
    if ([5, 9].includes(x)) set(x, 14, oz, QUARTZ);
    else set(x, 14, oz, B.stairs("quartz", "north", "top"));
  }
  for (const x of [1, 13]) set(x, 14, oz, QUARTZ);
  for (let x = 1; x <= 13; x++) {
    set(x, 16, 13, [1, 5, 9, 13].includes(x) ? QUARTZ : DARK);
    set(x, 17, 13, B.slab("quartz", "bottom"));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// ROOF — flat deck behind the parapet: polished-andesite border, a glazed skylight in a quartz curb, hatch, vent pipe.
function roof() {
  for (let x = 2; x <= 12; x++) for (const z of [3, 12]) set(x, 15, z, "polished_andesite");
  for (let z = 3; z <= 12; z++) for (const x of [2, 12]) set(x, 15, z, "polished_andesite");
  fill([6, 15, 7], [8, 15, 9], "light_blue_stained_glass");
  for (let x = 5; x <= 9; x++) for (let z = 6; z <= 10; z++) {
    if (x === 5 || x === 9 || z === 6 || z === 10) set(x, 16, z, B.slab("quartz", "bottom"));
  }
  set(3, 16, 4, B.trapdoor("dark_oak", "south", "bottom", false));
  set(11, 16, 4, "iron_trapdoor", { facing: "south", half: "bottom", open: "false", powered: "false", waterlogged: "false" });
  set(10, 16, 11, B.wall("cobblestone")); set(10, 17, 11, B.wall("cobblestone"));
}

// ---------------------------------------------------------------------------------------------------------------
// CHIMNEY — rear stack on the street-right side, 1 proud of the wall (x=14), through the cornice, topped by a cap.
function chimney() {
  fill([14, 1, 12], [14, 16, 13], BRICK);
  fill([14, 15, 12], [14, 15, 13], BRICK);
  for (let y = 6; y <= 10; y++) for (const z of [12, 13]) {
    if ((y + z) % 5 !== 0) set(14, y, z, "cobblestone");
  }
  for (const z of [12, 13]) { set(14, 5, z, B.stairs("brick", "west", "top")); set(14, 11, z, B.stairs("brick", "west", "bottom")); }
  fill([14, 17, 12], [14, 17, 13], "cobblestone");
  set(14, 17, 12, "stone"); set(14, 17, 13, "stone");
  fill([14, 1, 11], [14, 2, 11], BRICK);                    // flared foot
  set(14, 3, 11, B.stairs("brick", "west", "bottom"));
}

body();
front();
sides();
back();
roof();
chimney();
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0 }));
