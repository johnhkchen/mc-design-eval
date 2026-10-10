// Desert adobe market hall. Stage 1 (walls + openings) -> shell.nbt, then `mcd roof --preset desert`, then stage 2 (finish).
// x east, y up, z south; the street front faces north (-z). Body x1..15, z3..11, walls y1..5, ceiling y5, roof deck y6+.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Grid, load, B, arch, dome, paint, signboard, tile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const ROOF_ARGS = process.env.ROOF_ARGS ? process.env.ROOF_ARGS.split(" ") : ["--preset", "desert", "--footprint", "1,3,15,11", "--y", "6", "--tower", "3,8,3,2,cap"];

const WALL = "sandstone", SMOOTH = "smooth_sandstone", CUT = "cut_sandstone", BAND = "orange_terracotta";
const X0 = 1, X1 = 15, Z0 = 3, Z1 = 11, CX = 8;

const SHOPS = [[3, 5], [11, 13]];          // stall bays (x ranges), centre portal x7..9

// ---- stage 1: the walls ----------------------------------------------------------------------------------------
function walls(g) {
  // floor / plinth
  g.fill([X0, 0, Z0], [X1, 0, Z1], SMOOTH);
  // body: 1-thick shell with a 2-thick front (reveals), ceiling at y5 (the vigas are its beam ends)
  for (let y = 1; y <= 5; y++) {
    for (let x = X0; x <= X1; x++) { g.set(x, y, Z0, WALL); g.set(x, y, Z0 + 1, WALL); g.set(x, y, Z1, WALL); }
    for (let z = Z0; z <= Z1; z++) { g.set(X0, y, z, WALL); g.set(X1, y, z, WALL); }
  }
  g.fill([X0, 5, Z0], [X1, 5, Z1], WALL);   // ceiling course (flat, becomes the roof support)
  // smoother frieze course under the ceiling and a cut-sandstone cap course at y4 (lintel line)
  for (let x = X0; x <= X1; x++) { g.set(x, 4, Z0, CUT); }
  // orange bands at y2-3 on piers and around the sides/back (restrained: only the piers on the street front)
  const band = (x, y, z) => g.set(x, y, z, BAND);
  for (const y of [2, 3]) {
    for (const x of [1, 2, 6, 10, 14, 15]) band(x, y, Z0);
    for (let z = Z0; z <= Z1; z++) { band(X0, y, z); band(X1, y, z); }
    for (let x = X0; x <= X1; x++) band(x, y, Z1);
  }
  // smooth base course and string course under the vigas on all sides
  for (let x = X0; x <= X1; x++) { g.set(x, 1, Z0, SMOOTH); g.set(x, 1, Z1, SMOOTH); }
  for (let z = Z0; z <= Z1; z++) { g.set(X0, 1, z, SMOOTH); g.set(X1, 1, z, SMOOTH); }

  // corner buttress piers (thick adobe corners): 2x2 stepping out from each corner
  for (const [cx, cz, dx, dz] of [[X0, Z0, -1, -1], [X1, Z0, 1, -1], [X0, Z1, -1, 1], [X1, Z1, 1, 1]]) {
    for (let y = 1; y <= 5; y++) {
      for (const [ox, oz] of [[dx, 0], [0, dz], [dx, dz]]) g.set(cx + ox, y, cz + oz, y === 1 ? SMOOTH : (y === 2 || y === 3) ? BAND : WALL);
    }
    g.set(cx + dx, 0, cz, SMOOTH); g.set(cx, 0, cz + dz, SMOOTH); g.set(cx + dx, 0, cz + dz, SMOOTH);
  }

  // front stall openings, carved through the 2-thick wall (the reveal)
  for (const [a, b] of SHOPS) g.fill([a, 1, Z0], [b, 3, Z0 + 1], "minecraft:air");
  // dark oak lintel beams over each stall (stripped logs, axis x), proud by 1 at the awning line
  for (const [a, b] of SHOPS) for (let x = a - 1; x <= b + 1; x++) g.set(x, 4, Z0 - 1, ...B.log("stripped_dark_oak", "x"));

  // the arched portal through the front wall
  arch(g, { at: [7, 1, Z0], width: 3, height: 4, depth: 2, axis: "x", profile: "round", block: WALL });

  // side windows: narrow 1x2 slots; back door + windows
  for (const [x, zs] of [[X0, [5, 7, 9]], [X1, [6, 8, 10]]]) for (const z of zs) g.fill([x, 2, z], [x, 3, z], "minecraft:air");
  for (const x of [4, 12]) g.fill([x, 2, Z1], [x, 3, Z1], "minecraft:air");
  g.fill([CX, 1, Z1], [CX, 2, Z1], "minecraft:air");
}

// ---- stage 2: everything the roof tool does not do ---------------------------------------------------------------
const stairsFacing = (g, x, y, z, mat, facing, half = "bottom") => g.set(x, y, z, ...B.stairs(mat, facing, half));
const air = "minecraft:air";
// a connected fence run along x (z fixed) or along z (x fixed)
function rail(g, mat, [x0, z0], [x1, z1], y, skip = () => false) {
  const alongX = z0 === z1, a = alongX ? x0 : z0, b = alongX ? x1 : z1;
  for (let i = a; i <= b; i++) {
    const [x, z] = alongX ? [i, z0] : [x0, i];
    if (skip(x, z)) continue;
    const st = alongX ? { west: String(i > a && !skip(x - 1, z)), east: String(i < b && !skip(x + 1, z)) } : { north: String(i > a && !skip(x, z - 1)), south: String(i < b && !skip(x, z + 1)) };
    g.set(x, y, z, `${mat}_fence`, { ...st, waterlogged: "false" });
  }
}

function finish(g) {
  // street platform and the step: z1..2 full blocks, z0 stair row (one riser up to the floor)
  for (let x = 0; x <= 16; x++) { g.set(x, 0, 1, SMOOTH); g.set(x, 0, 2, SMOOTH); g.set(x, 0, 0, ...B.slab("smooth_sandstone", "bottom")); }
  // extra broad step in front of the portal
  for (let x = 6; x <= 10; x++) g.set(x, 0, 0, SMOOTH);
  // (the full-block row z0 at x6..10 is the landing; the stair row below it is the first riser on both sides)

  // vigas: dark oak log ends, every 2, proud 1 from the wall at the frieze (y5) on all four sides
  for (let x = 2; x <= 14; x += 2) { if (x !== 8) g.set(x, 5, 2, ...B.log("dark_oak", "z")); g.set(x, 5, 12, ...B.log("dark_oak", "z")); }
  for (const z of [5, 7, 9]) g.set(0, 5, z, ...B.log("dark_oak", "x"));
  for (const z of [4, 6, 8, 10]) g.set(16, 5, z, ...B.log("dark_oak", "x"));
  // wall sign over the portal (the viga at x8 is dropped for it)
  const sb = signboard(g, "BAZAAR", { at: [9, 5, 3], face: "north", width: 3, height: 1, wood: "dark_oak" });
  console.log("signboard", JSON.stringify(sb).slice(0, 200));

  // stripe awnings over the two stalls: orange / white columns on a 2-row slope (z2 high, z1 low), on dark oak posts
  for (const [a, b] of [[2, 6], [10, 14]]) {
    for (let x = a; x <= b; x++) {
      const orange = (x - a) % 2 === 0, mat = orange ? "red_sandstone" : "smooth_quartz";
      stairsFacing(g, x, 4, 2, mat, "south"); stairsFacing(g, x, 3, 1, mat, "south");
    }
    for (const x of [a, b]) { g.set(x, 1, 1, ...B.fence("dark_oak")); g.set(x, 2, 1, ...B.fence("dark_oak")); }
  }

  // portal frame: dark oak beams across the head and hanging lanterns inside
  for (const x of [7, 9]) { g.set(x, 3, Z0, ...B.lantern(true)); g.set(x, 3, Z0 + 1, ...B.lantern(true)); }

  // cap the buttresses with slabs
  for (const [cx, cz, dx, dz] of [[X0, Z0, -1, -1], [X1, Z0, 1, -1], [X0, Z1, -1, 1], [X1, Z1, 1, 1]])
    for (const [ox, oz] of [[dx, 0], [0, dz], [dx, dz]]) g.set(cx + ox, 6, cz + oz, ...B.slab("smooth_sandstone", "bottom"));

  // portal head: dark oak corbels each side of the crown, over the lanterns
  stairsFacing(g, 7, 4, 2, "dark_oak", "east", "top"); stairsFacing(g, 9, 4, 2, "dark_oak", "west", "top");
  g.set(8, 4, 2, ...B.slab("dark_oak", "top"));

  // window grilles (iron bars) + open dark oak shutters beside every slit
  for (const [z, x, out] of [[5, X0, "west"], [7, X0, "west"], [9, X0, "west"], [6, X1, "east"], [8, X1, "east"], [10, X1, "east"]]) {
    for (const y of [2, 3]) { g.set(x, y, z, ...B.block("iron_bars")); const ox = x + (out === "west" ? -1 : 1); for (const dz of [-1, 1]) g.set(ox, y, z + dz, ...B.trapdoor("dark_oak", out, "bottom", true)); }
    g.set(x + (out === "west" ? -1 : 1), 1, z, ...B.slab("smooth_sandstone", "top"));
  }
  for (const x of [4, 12]) {
    for (const y of [2, 3]) { g.set(x, y, Z1, ...B.block("iron_bars")); for (const dx of [-1, 1]) g.set(x + dx, y, Z1 + 1, ...B.trapdoor("dark_oak", "south", "bottom", true)); }
    g.set(x, 1, Z1 + 1, ...B.slab("smooth_sandstone", "top"));
  }
  // back door (double height, dark oak) and lantern
  g.set(CX, 1, Z1, ...B.door("dark_oak", "south", "lower")); g.set(CX, 2, Z1, ...B.door("dark_oak", "south", "upper"));

  // ---- the roof: retone, then wind tower, dome, terrace ---------------------------------------------------------
  const swap = { mud_brick_slab: "smooth_red_sandstone_slab", deepslate_bricks: "cut_sandstone", smooth_quartz: "smooth_sandstone", smooth_quartz_slab: "smooth_sandstone_slab" };
  for (let x = 0; x < g.size[0]; x++) for (let y = 6; y < g.size[1]; y++) for (let z = 0; z < g.size[2]; z++) {
    const b = g.blockAt(x, y, z).replace("minecraft:", "");
    if (swap[b]) g.set(x, y, z, swap[b], (b === "smooth_quartz_slab" || b === "mud_brick_slab") ? { type: "bottom", waterlogged: "false" } : undefined);
  }
  g.fill([2, 7, 7], [4, g.size[1] - 1, 9], air);                       // the tool's tower, rebuilt below
  // wind tower: 3x3 shaft, slits near the top on every face, viga ends, slab cap
  for (let y = 7; y <= 9; y++) for (let x = 2; x <= 4; x++) for (let z = 7; z <= 9; z++) if (x !== 3 || z !== 8) g.set(x, y, z, y === 8 ? BAND : WALL);
  g.fill([3, 7, 8], [3, 9, 8], air);
  for (const y of [8, 9]) { g.set(3, y, 7, ...B.block("iron_bars")); g.set(3, y, 9, ...B.block("iron_bars")); g.set(2, y, 8, ...B.block("iron_bars")); g.set(4, y, 8, ...B.block("iron_bars")); }
  for (const z of [7, 9]) { g.set(1, 8, z, ...B.log("dark_oak", "x")); g.set(5, 8, z, ...B.log("dark_oak", "x")); }
  for (const x of [2, 4]) { g.set(x, 8, 6, ...B.log("dark_oak", "z")); g.set(x, 8, 10, ...B.log("dark_oak", "z")); }
  g.fill([2, 10, 7], [4, 10, 9], CUT);
  for (const [x, z] of [[2, 7], [4, 7], [2, 9], [4, 9]]) g.set(x, 10, z, ...B.slab("smooth_sandstone", "top"));

  // dome over the hall centre: orange drum ring, sandstone hemisphere, fence finial
  dome(g, { center: [9, 7, 7], radius: 3, profile: "hemisphere", height: 2, block: "smooth_sandstone", drum: { height: 1, block: BAND }, finial: { block: "dark_oak_fence", height: 1 } });

  // rooftop terrace on the east side: striped canopy on fence posts, goods and pots
  for (const [x, z] of [[12, 5], [14, 5], [12, 9], [14, 9]]) { g.set(x, 7, z, ...B.fence("dark_oak")); g.set(x, 8, z, ...B.fence("dark_oak")); }
  for (let z = 5; z <= 9; z++) for (let x = 12; x <= 14; x++) g.set(x, 9, z, ...B.slab((z - 5) % 2 === 0 ? "red_sandstone" : "smooth_quartz", "bottom"));
  g.set(14, 7, 6, "barrel", { facing: "up", open: "false" }); g.set(14, 7, 7, "hay_block", { axis: "z" }); g.set(13, 7, 8, "composter", { level: "5" });
  g.set(13, 7, 5, "decorated_pot"); g.set(13, 7, 6, "potted_cactus"); g.set(14, 7, 8, "decorated_pot"); g.set(13, 7, 10, "composter", { level: "3" }); g.set(14, 7, 10, "barrel", { facing: "up", open: "false" });
  // low railing along the front, back-right and east parapet
  rail(g, "dark_oak", [2, 3], [14, 3], 8, (x) => x >= 7 && x <= 9);
  rail(g, "dark_oak", [15, 3], [15, 11], 8);
  rail(g, "dark_oak", [1, 3], [1, 6], 8);

  // ---- street life ------------------------------------------------------------------------------------------------
  g.set(6, 1, 0, "decorated_pot"); g.set(10, 1, 0, "decorated_pot"); g.set(7, 1, 0, "potted_cactus"); g.set(9, 1, 0, "potted_dead_bush");
  g.set(3, 1, 1, "potted_cactus"); g.set(5, 1, 1, "decorated_pot"); g.set(11, 1, 1, "decorated_pot"); g.set(13, 1, 1, "potted_dead_bush");
  // stall goods inside the reveal (z4) and a second tier
  const stall = (xs, front, top) => xs.forEach((x, i) => { g.set(x, 1, 4, ...front[i]); if (top[i]) g.set(x, 2, 4, ...top[i]); });
  stall([3, 4, 5], [["barrel", { facing: "up", open: "false" }], ["hay_block", { axis: "x" }], ["barrel", { facing: "up", open: "false" }]], [["decorated_pot"], ["composter", { level: "6" }], ["decorated_pot"]]);
  stall([11, 12, 13], [["composter", { level: "4" }], ["barrel", { facing: "up", open: "false" }], ["hay_block", { axis: "x" }]], [["potted_dead_bush"], ["decorated_pot"], ["composter", { level: "2" }]]);
  // hall: striped carpet runway and lanterns from the ceiling beams
  for (let z = 5; z <= 10; z++) { g.set(7, 1, z, "orange_carpet"); g.set(8, 1, z, "white_carpet"); g.set(9, 1, z, "orange_carpet"); }
  for (const [x, z] of [[4, 7], [12, 7], [8, 6], [8, 9]]) g.set(x, 4, z, ...B.lantern(true));
  // back door: striped banners either side, pots and a basket
  for (const x of [7, 9]) g.set(x, 3, 12, ...B.banner("orange", [["stripe_center", "white"], ["border", "brown"]], { facing: "south" }));
  g.set(6, 1, 12, "decorated_pot"); g.set(10, 1, 12, "composter", { level: "5" }); g.set(11, 1, 12, "barrel", { facing: "up", open: "false" });
  // banners on the corner buttress fronts
  for (const x of [1, 15]) g.set(x, 3, 1, ...B.banner("orange", [["stripe_center", "white"], ["border", "brown"]], { facing: "north" }));
}

// ---- main ------------------------------------------------------------------------------------------------------
const g0 = new Grid([17, 11, 13]);
walls(g0);
g0.save(HERE + "shell.nbt");
execFileSync("node", [MCD, "roof", HERE + "shell.nbt", HERE + "roofed.nbt", ...ROOF_ARGS], { stdio: "inherit" });
const g = load(HERE + "roofed.nbt");
finish(g);
g.save(HERE + "pre.nbt");
// texture pass: restrained weathering and variation on the walls (rules are pure treatments, no hand placement)
const rules = readFileSync(HERE + "rules.txt", "utf8");
const r = rules.trim() ? paint(g, rules, { faces: ["north", "east", "south", "west"] }) : { grid: g, report: [], shift: [0, 0, 0] };
for (const e of r.report) if (e.kind !== "header") console.log(`L${e.line} ${e.rule.slice(0, 60).padEnd(60)} wrote ${e.wrote}${e.skipped ? ` skipped ${e.skipped}` : ""}${e.error ? ` ERROR ${e.error}` : ""}${e.note ? ` (${e.note})` : ""}`);
r.grid.save(HERE + "build.nbt");
console.log(JSON.stringify({ stage: 3, saved: "build.nbt", size: r.grid.size, shift: r.shift }));
