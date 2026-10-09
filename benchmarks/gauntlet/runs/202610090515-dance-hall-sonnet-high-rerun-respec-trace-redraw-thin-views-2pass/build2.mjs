// Art Deco Dance Hall — PASS 2: SIDES, BACK, ROOF (loads round-1.nbt, front face untouched).
// Rule that keeps the front elevation identical: no cell may rise above the front silhouette per x
// (max y by x from round-1: x1-2:15, x3-5:16, x6:18, x7:19, x8:20, x9:21, x10:22 ...). So the side aisles
// (x=2..7) roof out at y=15 and the NAVE (x=8..18) carries the tall stepped roof, as in the concept.
//   x=1  proud piers / ledges (west; mirrored to x=25)    x=2 wall plane    x=3 recessed glass (reveal 1)
//   z=33 rear wall plane    z=34 rear piers and ledges
import { load, B, carve, mirrorX } from "../../../../../minecraft-design/tools/src/build.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const g = load(HERE + "round-1.nbt");

const CORE = "smooth_quartz", TAN = "cut_sandstone", SAND = "sandstone", BLACK = "black_concrete";
const AIR = "minecraft:air";
const PANE = "black_stained_glass_pane", BLUE = "light_blue_stained_glass";

// ---------------------------------------------------------------- nave roof profile (z -> deck y), spec: 20 / 18 / 17
const T = (z) => (z <= 24 ? 20 : z <= 27 ? 18 : 17);
const AISLE = 15;               // aisle roof deck
const Z0 = 6, Z1 = 33;          // side wall run (z=6..10 sits on the front slab, whose x=1..2 face we restyle)

// ---------------------------------------------------------------- 0a. front-visible cells that sit behind z=5 on the outer columns
// (pass 1 owns them: the front elevation reads them), remember and restore them after the side wall is rebuilt
const keep = [];
for (const x of [1, 2, 24, 25]) for (let y = 0; y <= 16; y++) {
  for (let z = 0; z <= 34; z++) {
    if (g.isAir(x, y, z)) continue;
    if (z >= Z0 && z <= 10) { const c = g.get(x, y, z); keep.push([x, y, z, c.block, c.state, c.nbt]); }
    break;
  }
}

// ---------------------------------------------------------------- 0. clear what pass 1 left behind the front slab
carve(g, [1, 0, 11], [25, 15, 34]);
carve(g, [1, 0, Z0], [2, 16, 10]);
carve(g, [24, 0, Z0], [25, 16, 10]);

// ---------------------------------------------------------------- 1. massing: solid core, aisle decks, stepped nave
for (let z = 11; z <= Z1; z++) {
  for (let x = 2; x <= 24; x++) {
    const nave = x >= 8 && x <= 18;
    const H = nave ? T(z) : AISLE;
    for (let y = 0; y <= H; y++) {
      g.set(x, y, z, y === 0 ? BLACK : y === H ? (nave && (x === 8 || x === 18) ? SAND : TAN) : CORE);
    }
  }
}
// roof coursing: a sandstone seam down each aisle deck, a centre seam and blue skylights on the nave
for (let z = 11; z <= Z1; z++) for (const x of [5, 21]) g.set(x, AISLE, z, SAND);
for (let z = 12; z <= 23; z++) g.set(13, 20, z, SAND);
for (const z of [14, 18, 22]) for (const x of [10, 11, 15, 16]) g.set(x, 20, z, BLUE);
for (let z = 29; z <= 32; z++) g.set(13, 17, z, SAND);
// risers of the stepped roof (exposed back faces of each terrace), dark band continues the trace's y=19 line
for (let x = 8; x <= 18; x++) g.set(x, 19, 24, BLACK);
for (let x = 8; x <= 18; x++) g.set(x, 18, 27, SAND);
// rear parapet on the nave (y=18) with a low coping slab on the centre
for (let x = 8; x <= 18; x++) g.set(x, 18, Z1, x === 8 || x === 18 ? SAND : TAN);
for (let x = 10; x <= 16; x++) g.set(x, 19, Z1, ...B.slab(TAN));

// ---------------------------------------------------------------- 2. the west side wall, one bay at a time (mirrored east)
const PIER_Z = { 15: TAN, 18: SAND, 27: TAN, 31: SAND, 33: TAN };
const BAYS = [{ z0: 8, mid: 11 }, { z0: 20, mid: 23 }];
const bayAt = (z) => BAYS.find((b) => z >= b.z0 && z <= b.z0 + 6);
const isDoorZ = (z) => z === 16 || z === 17;
const wallBlock = (y) => (y === 0 ? BLACK : y === 3 || y === 7 ? SAND : y >= 8 && y <= 13 ? CORE : TAN);

function westWall(set) {
  for (let z = Z0; z <= Z1; z++) {
    // wall plane x=2, floor to deck
    for (let y = 0; y <= 15; y++) set(2, y, z, wallBlock(y));
    const pier = PIER_Z[z];
    if (pier) {
      for (let y = 1; y <= 14; y++) set(1, y, z, pier);          // pier proud 1, full height
      set(1, 13, z, CORE);                                         // quartz capital band (also keeps the front read of x=1,y=13)
    } else {
      set(1, 7, z, ...B.slab(SAND));                               // sill ledge on the band line
      set(1, 14, z, ...B.stairs(TAN, "east", "top"));              // cornice lip
    }
    set(1, 15, z, ...B.slab(SAND));                                // coping
    set(1, 0, z, BLACK);

    // cellar slits (blue) in the base band, aligned with the bay mullions
    if (z === 11 || z === 23) { set(2, 2, z, BLUE); set(2, 3, z, BLUE); set(3, 2, z, CORE); set(3, 3, z, CORE); }

    // window bays: quartz field recessed 1, black panes either side of a stained mullion with a glow lamp
    const bay = bayAt(z);
    if (bay) {
      const off = z - bay.z0;
      for (let y = 8; y <= 12; y++) set(2, y, z, AIR);
      set(2, 8, z, ...B.slab(SAND));                                // sill
      if (off <= 1 || off >= 5) for (let y = 8; y <= 12; y++) set(3, y, z, CORE);
      else if (off === 3) {
        set(3, 8, z, CORE); set(3, 9, z, BLUE); set(3, 10, z, "glowstone"); set(3, 11, z, BLUE); set(3, 12, z, CORE);
        for (let y = 8; y <= 12; y++) set(4, y, z, CORE);
      } else {
        set(3, 8, z, CORE);
        for (let y = 9; y <= 12; y++) { set(3, y, z, PANE); set(4, y, z, BLACK); }
      }
    }

    // door bay between the piers: double dark-oak door recessed, stained slit above (blue, yellow, orange)
    if (isDoorZ(z)) {
      for (let y = 0; y <= 2; y++) set(2, y, z, AIR);
      set(3, 0, z, ...B.door("dark_oak", "west", "lower", z === 16 ? "right" : "left"));
      set(3, 1, z, ...B.door("dark_oak", "west", "upper", z === 16 ? "right" : "left"));
      set(3, 2, z, ...B.trapdoor("dark_oak", "west", "top", false));
      for (let y = 0; y <= 2; y++) set(4, y, z, BLACK);
      set(1, 7, z, AIR);
      for (let y = 5; y <= 12; y++) {
        set(2, y, z, AIR);
        set(3, y, z, y <= 6 ? "orange_stained_glass" : y <= 8 ? "yellow_stained_glass" : BLUE);
        set(4, y, z, CORE);
      }
    }

    // rear stretch: one tall black slit between piers
    if (z === 29) { for (let y = 3; y <= 12; y++) { set(2, y, z, AIR); set(3, y, z, PANE); set(4, y, z, BLACK); } }
  }

  // nave clerestory (x=8 plane above the aisle roof): quartz field, stained panes recessed, dark band, tan cap
  for (let z = 11; z <= Z1; z++) {
    const t = T(z);
    set(8, 16, z, CORE);
    if (t >= 18) set(8, 17, z, CORE);
    if (t >= 19) { set(8, 18, z, TAN); set(8, 19, z, BLACK); }
    if (t === 20 && [11, 14, 19, 22].includes(z)) {
      set(8, 16, z, AIR); set(8, 17, z, AIR);
      set(9, 16, z, BLUE); set(9, 17, z, BLUE); set(8, 15, z, TAN);
    }
  }
}
mirrorX(g, 13, westWall);

// ---------------------------------------------------------------- 3. the rear: bays between piers, stained transoms, centre door
const REAR_PIERS = { 2: TAN, 7: SAND, 11: TAN, 15: TAN, 19: SAND, 24: TAN };
for (let x = 1; x <= 25; x++) {
  const mx = Math.min(x, 26 - x);
  const pier = REAR_PIERS[mx] ?? (mx === 1 ? TAN : null);
  const nave = x >= 8 && x <= 18;
  for (let y = 0; y <= 15; y++) g.set(x, y, Z1, y === 0 ? BLACK : y === 3 || y === 7 ? SAND : y >= 8 && y <= 13 ? CORE : TAN);
  if (nave) g.set(x, 16, Z1, CORE);
  if (pier) for (let y = 1; y <= 14; y++) g.set(x, y, 34, pier);
  else {
    g.set(x, 7, 34, ...B.slab(SAND));
    g.set(x, 14, 34, ...B.stairs(TAN, "north", "top"));
  }
  g.set(x, 15, 34, ...B.slab(SAND));
  g.set(x, 0, 34, BLACK);
}
// pane columns per bay (centre bay x=12..14 is the stage door)
const PANE_X = [4, 5, 9, 12, 14, 17, 21, 22];
for (const x of [...PANE_X]) {
  for (let y = 3; y <= 13; y++) g.set(x, y, Z1, AIR);
  for (let y = 3; y <= 12; y++) { g.set(x, y, 32, PANE); g.set(x, y, 31, BLACK); }
  g.set(x, 13, 32, BLUE); g.set(x, 13, 31, CORE);
}
for (let y = 0; y <= 13; y++) g.set(13, y, Z1, AIR);
g.set(13, 0, 32, ...B.door("dark_oak", "north", "lower", "left"));
g.set(13, 1, 32, ...B.door("dark_oak", "north", "upper", "left"));
g.set(13, 2, 32, ...B.trapdoor("dark_oak", "north", "top", false));
for (let y = 3; y <= 12; y++) { g.set(13, y, 32, PANE); g.set(13, y, 31, BLACK); }
g.set(13, 13, 32, BLUE); g.set(13, 13, 31, CORE);
for (let y = 0; y <= 2; y++) g.set(13, y, 31, BLACK);
for (const x of [10, 16]) g.set(x, 8, 33, "glowstone");                // rear lamps on the nave wall

for (const [x, y, z, block, state, nbt] of keep) g.set(x, y, z, block, state, nbt);

g.save(HERE + "round-2.nbt");
console.log("saved round-2.nbt");
