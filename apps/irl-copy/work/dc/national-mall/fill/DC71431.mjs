import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1738 1st St NW, Residential-Conversions-Less than 5: a brick walk-up flat block on a stone base, the lidar roof record
// read as two tiers. The street face is z = 0 (the notch at x 5..6 is the recessed entry). Storeys are 2-block modules
// (the 6-block top reads as three storeys, the 4-block wings as two); a stone storey line at y 2 on the tall tier.
// Lidar 5s snap to the nearest tier (the 5s next to the 6-block tower go to 6, the rest to 4).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71431.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 9, H = 18, D = 3;
const g = new Voxels([W, H, D]);

const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
// tall tier (6) on the street-side tower bays and their back cell; everything else 4
const TALL = new Set(["3,0", "4,0", "7,0", "8,0", "3,1", "4,1", "7,1", "8,1"]);
const tierOf = (x, z) => (TALL.has(`${x},${z}`) ? 6 : 4);

// what each block is, keyed "x,y,z"; panes are joined after
const want = new Map();
const put = (x, y, z, block, state) => want.set(`${x},${y},${z}`, { block, state });

// 1. the solid shell: brick to each cell's tier, a stone base course, a stone cornice on top, a stone storey line on the tall tier
for (const [key, { ground }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const T = tierOf(x, z);
  for (let y = ground; y < T; y++) {
    let b = "bricks";
    if (y === 0) b = "stone_bricks";
    if (T === 6 && y === 2) b = "smooth_stone";
    if (y === T - 1) b = "smooth_stone";
    put(x, y, z, b);
  }
}

// rows of glass by tier: the ground storey, then the upper storeys (the storey line and cornice are never glass)
const rowsOf = (T) => (T === 6 ? [1, 3, 4] : [1, 2]);

// 2. window grid on the faces: glass on odd columns, brick piers on even ones
const frontOpen = (x, z) => !inFp(x, z - 1); // the street-side (north, -z) face is exposed
const rearOpen = (x, z) => !inFp(x, z + 1);
const windowAt = new Map();
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const T = tierOf(x, z);
  if (frontOpen(x, z) && x % 2 === 1) for (const y of rowsOf(T)) windowAt.set(`${x},${y},${z}`, "front");
  if (rearOpen(x, z) && x % 2 === 1 && T === 4) for (const y of rowsOf(T)) windowAt.set(`${x},${y},${z}`, "rear");
}
// east face of the tall back bay: glass over the air gap of the (7,z1) cell
for (const y of [1, 3]) windowAt.set(`8,${y},1`, "east");

// 3. the air gap behind the street glass on the tall tower bays (x 3 and 7, z 1), with a floor slab at y 2 and a cornice over
for (const x of [3, 7]) for (const y of [1, 3]) want.delete(`${x},${y},1`);
// (7,z1) and (3,z1) need the windows' air cells; the east window at (8,z1) looks through (7,z1), so the gap is at both
for (const [k, kind] of windowAt) want.set(k, { block: "glass_pane", pane: kind === "east" ? "x" : "z" });

// 4. the entry: a dark oak door in the recessed bay at x 5 (its back wall, z 1), with a glass transom above
put(5, 0, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(5, 1, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
want.set("5,2,1", { block: "glass_pane", pane: "z" });

// 5. warm lights in the gap behind two of the street windows
want.set("3,1,1", { block: "glowstone" });
want.set("7,3,1", { block: "shroomlight" });

// write: each entry is either a plain block or a pane whose four sides join the walls and panes on its plane
const isSolid = (x, y, z) => { const e = want.get(`${x},${y},${z}`); return !!e && e.block !== "glass_pane" && e.block !== null; };
const isGlass = (x, y, z) => { const e = want.get(`${x},${y},${z}`); return !!e && e.block === "glass_pane"; };
for (const [k, e] of want) {
  const [x, y, z] = k.split(",").map(Number);
  if (e.block === "glass_pane") {
    // a pane joins on its own plane: along x on a z face, along z on an x face
    const join = (n) => (isSolid(...n) || isGlass(...n) ? "true" : "false");
    const onZ = e.pane === "z";
    const state = onZ
      ? { north: "false", south: "false", east: join([x + 1, y, z]), west: join([x - 1, y, z]), waterlogged: "false" }
      : { north: join([x, y, z - 1]), south: join([x, y, z + 1]), east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);
  } else {
    g.set(x, y, z, e.block, e.state);
  }
}

g.save(`${DIR}/DC71431.nbt`);
