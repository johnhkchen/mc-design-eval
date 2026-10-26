// Owner's v2 fix round for the two west towers, run after the parts (it may replace their cells): the belfry stage on
// the north, east and inner faces (two pointed louvred lancets per face, a colonnette between, a pointed hood over the
// pair), string courses at y 69 and y 95, clasping buttresses proud 1 at the free corners, and the top: an openwork
// parapet (sandstone_wall balusters under a slab rail), corner pinnacles and a set-back flat lead roof.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SS = "smooth_sandstone";
const air = (b) => !b || /(^|:)air$/.test(b);

export function fix(g) {
  for (const m of [false, true]) {
    const Z = (z) => (m ? 74 - z : z);
    const F = (f) => (m && (f === "north" || f === "south") ? (f === "north" ? "south" : "north") : f);
    const set = (x, y, z, b, s) => g.set(x, y, Z(z), b, s && s.facing ? { ...s, facing: F(s.facing) } : s);
    const get = (x, y, z) => g.blockAt(x, y, Z(z));
    const setAir = (x, y, z, b, s) => { if (air(get(x, y, z))) set(x, y, z, b, s); };

    // close the v1 north / inner recesses (x 3..18, 3 deep), keeping the west face's own lancets (x <= 4, z 9..25)
    for (let y = 69; y <= 95; y++) for (let x = 3; x <= 18; x++) for (const z of [7, 8, 9, 25, 26, 27]) {
      if (x <= 4 && z >= 9 && z <= 25) continue;
      set(x, y, z, SS);
    }

    // faces in (u along the face, d depth in from the face plane); out = outward facing, plus = facing of +u
    const faces = [
      { at: (u, d) => [u, 7 + d], span: [2, 22], out: "north", plus: "east", y0: 4 },
      { at: (u, d) => [u, 27 - d], span: [2, 22], out: "south", plus: "east", y0: 67 },
      { at: (u, d) => [22 - d, u], span: [7, 27], out: "east", plus: "south", y0: 4 },
    ];
    const minus = { east: "west", south: "north" };
    for (const f of faces) {
      const P = (u, y, d, b, s) => { const [x, z] = f.at(u, d); set(x, y, z, b, s); };
      const PA = (u, y, d, b, s) => { const [x, z] = f.at(u, d); setAir(x, y, z, b, s); };
      const c = (f.span[0] + f.span[1]) / 2;
      // two lancets, 3 wide, y 72..88 (pointed head at 88), reveal 1, louvres 1 back, open behind
      for (const lc of [c - 2, c + 2]) for (let y = 72; y <= 89; y++) for (let du = -1; du <= 1; du++) {
        const u = lc + du;
        if (y === 89 && du !== 0) continue;
        if (y === 89) { P(u, y, 0, ...B.stairs("smooth_sandstone", f.out, "top")); continue; }
        if (y === 88 && du !== 0) { P(u, y, 0, ...B.stairs("smooth_sandstone", du < 0 ? minus[f.plus] : f.plus, "top")); continue; }
        P(u, y, 0, "air");
        P(u, y, 1, ...B.trapdoor("dark_oak", f.out, "bottom", true));
        for (let d = 2; d <= 3; d++) P(u, y, d, "air");
      }
      // colonnette between the pair (in the face plane), with a cut_sandstone capital
      for (let y = 72; y <= 87; y++) P(c, y, 0, "sandstone_wall");
      P(c, 88, 0, "cut_sandstone");
      // pointed hood over the pair, proud 1
      for (let k = 0; k <= 4; k++) {
        const y = 87 + k;
        if (k < 4) {
          PA(c - 4 + k, y, -1, ...B.stairs("smooth_sandstone", f.plus));
          PA(c + 4 - k, y, -1, ...B.stairs("smooth_sandstone", minus[f.plus]));
        } else PA(c, y, -1, "chiseled_sandstone");
      }
      // string courses (lip out) at the belfry base and under the parapet
      for (const y of [69, 95]) for (let u = f.span[0]; u <= f.span[1]; u++) PA(u, y, -1, ...B.stairs("smooth_sandstone", minus[f.out] ?? (f.out === "north" ? "south" : "north"), "top"));
    }

    // clasping buttresses, proud 1, L round each free corner (the NW corner has the facade buttress)
    const clasp = (cells, y0, corner) => {
      for (let y = y0; y <= 94; y++) for (const [x, z] of cells) setAir(x, y, z, y % 8 === 2 ? "cut_sandstone" : SS);
      const [x, z] = corner;
      setAir(x, 95, z, "end_stone_bricks"); setAir(x, 96, z, "end_stone_bricks");
      setAir(x, 97, z, "end_stone_brick_wall"); setAir(x, 98, z, "lightning_rod");
    };
    clasp([[20, 6], [21, 6], [22, 6], [23, 6], [23, 7], [23, 8], [23, 9]], 4, [23, 6]);
    clasp([[20, 28], [21, 28], [22, 28], [23, 28], [23, 27], [23, 26], [23, 25]], 67, [23, 28]);
    clasp([[2, 28], [3, 28], [4, 28]], 69, [2, 28]);

    // top: lead roof set back inside the parapet, openwork parapet, corner pinnacles
    for (let x = 3; x <= 21; x++) for (let z = 8; z <= 26; z++) set(x, 96, z, "deepslate_tiles");
    for (let x = 5; x <= 19; x++) for (let z = 10; z <= 24; z++) set(x, 97, z, ...B.slab("deepslate_tile"));
    for (let x = 2; x <= 22; x++) for (let z = 7; z <= 27; z++) {
      if (x !== 2 && x !== 22 && z !== 7 && z !== 27) continue;
      const corner = (x === 2 || x === 22) && (z === 7 || z === 27);
      if (corner) { set(x, 97, z, "end_stone_bricks"); set(x, 98, z, "end_stone_brick_wall"); continue; }
      set(x, 97, z, "sandstone_wall");
      set(x, 98, z, ...B.slab("smooth_sandstone"));
    }
  }
}
