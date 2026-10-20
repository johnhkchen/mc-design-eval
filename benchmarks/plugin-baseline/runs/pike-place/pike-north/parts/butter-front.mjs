// P5 Butterworth east front, pavilion, back and Kells (plan.md PARTS 5). Plot-local coordinates: the main wall face is
// x114 (the shell's), trim and pilasters stand proud at x115, the shopfront frames sit one block in at x113, and the
// pavilion's face is x116 with its pilasters, tablet and coping at x117. Every write goes through put(), which keeps to
// the footprint; the shell's and roof's cells are locked, so runParts reports any trim the shell already filled.
import { arch_window, cornice_run, pavilion_door, kells_front, groundAt, onFootprint } from "../vocab.mjs";

const WALL = 114;
const PROUD = 115;
const SHOP = 113;
const PAV = 116;
const PAV_OUT = 117;

// Ground-storey floor by z (plan FLOORS): y11 z0..35, y10 z36..83, y9 z84..139, y8 z140..155.
const floorAt = (z) => (z <= 35 ? 11 : z <= 83 ? 10 : z <= 139 ? 9 : 8);
// Pier pairs (2 wide) on the ground storey; pilasters above stand on the same z.
const PIERS = [0, 11, 23, 35, 47, 59, 71, 83, 95, 107, 119, 131, 138];
// The shopfront spans between the piers.
const SPANS = [[2, 10], [13, 22], [25, 34], [37, 46], [49, 58], [61, 70], [73, 82], [85, 94], [97, 106], [109, 118], [121, 130], [133, 137]];
// Upper-floor bays: window at z 6k+1..6k+3; bays 23 and 25 are the pavilion flanks (left as brick).
const BAYS = [...Array(26).keys()].filter((k) => k !== 23 && k !== 25);

// A slab from its material stem ("brick" -> brick_slab, with its state); B.slab() would give bricks_slab.
const slab = (id, type = "bottom") => [`${id}_slab`, { type, waterlogged: "false" }];
const log = (id, axis = "y") => [id, { axis }];

export function build(g) {
  const put = (x, y, z, ...b) => {
    if (!onFootprint(x, z)) return;
    g.set(x, y, z, ...b);
  };
  const box = (x0, y0, z0, x1, y1, z1, ...b) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, ...b);
  };

  // Plinth course at the foot of the front, on the proud layer only: the shell already lays stone_bricks at x114 from the
  // ground up two courses, and bricks above them, so nothing on the wall plane itself is free to write.
  for (let z = 0; z <= 155; z++) {
    const F = floorAt(z);
    const gy = groundAt(PROUD, z);
    if (gy == null) continue;
    for (let y = gy; y < F; y++) put(PROUD, y, z, "stone_bricks");
  }

  // Ground storey: sandstone base blocks proud at floor+1 on each pier pair (the piers themselves are the shell's bricks).
  for (const z0 of PIERS) {
    const F = floorAt(z0);
    box(PROUD, F + 1, z0, PROUD, F + 1, z0 + 1, "cut_sandstone");
  }

  // Ground-storey shopfront frames: bulkhead at floor+1, mullion posts every 4 (not at the door). The head beam at y16
  // is the shell's brick course (solid there), so it is not written.
  for (const [a, b] of SPANS) {
    const F = floorAt(a);
    const zc = a + 4; // the door pair's cell: the shop's centre
    for (let z = a; z <= b; z++) put(SHOP, F + 1, z, "dark_oak_planks");
    for (let z = a; z <= b; z++) {
      if (z === zc) continue;
      if ((z - a) % 4 === 0 || z === b) for (let y = F + 2; y <= 15; y++) put(SHOP, y, z, ...log("stripped_dark_oak_log"));
    }
  }

  // Belt courses on the proud layer: the smooth slab top at y17 (drip) and the slab bottom at y24 under the F3 sills.
  // The cut_sandstone band itself would sit on the shell's wall face, so it is not written.
  for (let z = 0; z <= 155; z++) {
    put(PROUD, 17, z, ...slab("smooth_sandstone", "top"));
    put(PROUD, 24, z, ...slab("smooth_sandstone", "bottom"));
  }
  // Under each F3 sill the course is a full block: a top sill slab can't stand on a bottom slab (half a block of air).
  for (const k of BAYS) for (let z = 6 * k + 1; z <= 6 * k + 3; z++) put(PROUD, 24, z, "smooth_sandstone");

  // Upper floors, bay by bay: F2 rectangular windows (sill y19; the lintel y23 is the shell's wall face, not written),
  // F3 and F4 arched windows.
  for (const k of BAYS) {
    const z0 = 6 * k + 1;
    for (let z = z0; z <= z0 + 2; z++) put(PROUD, 19, z, ...slab("smooth_sandstone", "top"));
    arch_window(g, { x: WALL, z: z0, y0: 26, y1: 29, face: "east" });
    arch_window(g, { x: WALL, z: z0, y0: 31, y1: 34, face: "east" });
  }

  // Pilasters, 1 proud at x115, on every pier pair above the ground storey: quoins every third course, a brick head
  // at y40 and a stone_brick_slab cap at y41. The corner pilasters: z0 (one wide, clear of bay 0's window) and z154..155.
  for (const z0 of PIERS.slice(1, -1)) {
    for (let y = 18; y <= 39; y++) {
      const cut = y % 3 === 0;
      put(PROUD, y, z0, cut ? "cut_sandstone" : "bricks");
      put(PROUD, y, z0 + 1, cut ? "cut_sandstone" : "bricks");
    }
    put(PROUD, 40, z0, "bricks");
    put(PROUD, 40, z0 + 1, "bricks");
    put(PROUD, 41, z0, ...slab("stone_brick", "bottom"));
    put(PROUD, 41, z0 + 1, ...slab("stone_brick", "bottom"));
  }
  for (let y = 18; y <= 39; y++) {
    put(PROUD, y, 0, y % 3 === 0 ? "cut_sandstone" : "bricks");
  }
  put(PROUD, 40, 0, "bricks");
  put(PROUD, 41, 0, ...slab("stone_brick", "bottom"));
  for (let y = 18; y <= 39; y++) {
    put(PROUD, y, 154, y % 3 === 0 ? "cut_sandstone" : "bricks");
    put(PROUD, y, 155, y % 3 === 0 ? "cut_sandstone" : "bricks");
  }
  put(PROUD, 40, 154, "bricks");
  put(PROUD, 40, 155, "bricks");
  put(PROUD, 41, 154, ...slab("stone_brick", "bottom"));
  put(PROUD, 41, 155, ...slab("stone_brick", "bottom"));

  // A heavier cornice: a dentil course under the bed mould (x115 y34, two per bay on the brick between the windows), and a
  // second corona course (x115 y37 full, a slab cap at y38) over the first.
  for (let z = 0; z <= 155; z++) {
    if (z >= 140 && z <= 151) continue;
    const pil = z === 0 || z >= 154 || PIERS.slice(1, -1).some((p) => z === p || z === p + 1);
    if (pil) continue;
    if (z % 6 === 4 || z % 6 === 0) put(PROUD, 34, z, "cut_sandstone"); // on the brick between the windows
    put(PROUD, 37, z, "smooth_sandstone");
    put(PROUD, 38, z, ...slab("smooth_sandstone", "bottom"));
  }

  // Main cornice: frieze at x114 (cut_sandstone), bed mould at x115, corona at y36, cap slab at y37. It returns round
  // the pavilion's flank, so it runs z0..139 and z152..155; the pavilion carries its own profile.
  cornice_run(g, { x: WALL, y: 35, z0: 0, z1: 139, face: "east", stairs: "smooth_sandstone", frieze: "cut_sandstone" });
  cornice_run(g, { x: WALL, y: 35, z0: 152, z1: 155, face: "east", stairs: "smooth_sandstone", frieze: "cut_sandstone" });

  // Pavilion: cornice at x116..117, a raised brick parapet at x116 y37..41 with a coping slab at y42, and the BUTTERWORTH
  // tablet (smooth_sandstone) on x117 y38..39 for the glazier's and sign part's lettering.
  cornice_run(g, { x: PAV, y: 35, z0: 140, z1: 151, face: "east", stairs: "smooth_sandstone", frieze: "cut_sandstone" });
  box(PAV, 37, 140, PAV, 41, 151, "bricks");
  for (let z = 140; z <= 151; z++) put(PAV, 42, z, ...slab("smooth_sandstone", "bottom"));
  for (let z = 140; z <= 151; z++) for (let y = 38; y <= 39; y++) put(PAV_OUT, y, z, "smooth_sandstone");
  // The tablet's base is a full block: the cornice cap slab under it would leave half a block of air.
  for (let z = 140; z <= 151; z++) put(PAV_OUT, 37, z, "smooth_sandstone");

  // The pavilion doorway, with the door pair, transom and voussoirs (the helper writes into air only).
  pavilion_door(g, { x: PAV, z: 144, y: 9, face: "east" });

  // The back (Pike Place) sills are not written: each sits in the shell's brick wall cell below its opening (the back
  // wall is solid there), so a brick slab would replace a wall block.

  // The KELLS pub front on the x64 projection (its face is west).
  kells_front(g, { x: 64, z0: 90, floorY: 3, face: "west" });
}
