// Part 6: dusk lighting and crown. The M7c crown penthouse (walls, slab roof, pearlescent band, ochre slot), the M7
// light slot under the coping, floodlight courses on the E and S tower faces, the four crown masts, and the lit lobby
// floors and ceilings (M8 entrance hall, the spur spines). Only writes into air: earlier parts' blocks are locked.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { floodCourse } from "../vocab.mjs";

// M7c crown penthouse: walls y68..73 on plan x81..116 z170..206, slab roof at y74 (plan ROOFS, CROWN_TOP 74)
const CROWN = [81, 68, 170, 116, 73, 206];
const CROWN_ROOF_Y = 74;

// M7 central block, the crown's floodlit edge: light slot at y68 one cell in from the wall plane (plan: under coping)
const M7 = [63, 134, 135, 242];
const M7_SLOT_Y = 68;

// tower floodlight courses (plan FACADES, elements.md): E faces at x197 (T4, T5, T7), S faces at z332 (T8, T9), y62
const FLOOD_EAST = [[117, 152], [162, 215], [225, 251]];
const FLOOD_SOUTH = [[27, 44], [106, 125]];
const FLOOD_Y = 62;

// the four crown masts: x, z (plan MASTS); base cell y75 is the first above the crown slab
const MAST_BASE_Y = 75;
const MASTS = [[83, 172], [114, 172], [83, 204], [114, 204]];

// M8 entrance hall interior (behind the glass wall at x19): floor y2, ceiling y12 (lanterns hung every 4)
const HALL = { x: [20, 30], z: [176, 201], floorY: 2, ceilY: 12 };

// spur spines (plan M1 x81..89 z0..26, M15 z351..374): lit floor y1, hanging lanterns at y9 under the skylight
const SPURS = [
  { x: [83, 87], z: [1, 25] },
  { x: [83, 87], z: [352, 373] },
];

export function build(g) {
  let placed = 0;
  const put = (x, y, z, block, state) => {
    if (!g.isAir(x, y, z)) return;
    g.set(x, y, z, block, state);
    placed++;
  };

  // crown walls: a smooth_quartz ring, the interior left hollow under the slab roof
  const [cx0, cy0, cz0, cx1, cy1, cz1] = CROWN;
  for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) {
    if (x === cx0 || x === cx1 || z === cz0 || z === cz1) put(x, y, z, "smooth_quartz");
  }
  // crown roof: a full smooth_quartz lid at y74 (the masts and their lights stand on it, so no half-block gap)
  for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) put(x, CROWN_ROOF_Y, z, "smooth_quartz");
  // crown interior lit from the slab (hanging lanterns every 4 over the hollow), so it never goes dark
  for (let x = cx0 + 2; x <= cx1 - 2; x += 4) for (let z = cz0 + 2; z <= cz1 - 2; z += 4) put(x, cy1, z, ...B.lantern(true));
  // the crown's pearlescent band (y73) and ochre slot (y68) would swap the shell's smooth_quartz ring, which runParts
  // locks (284 refused). They are left out: the crown ring stays plain smooth_quartz from the shell.

  // M7 light slot: ochre froglight one cell in from each wall plane at y68, all round the block
  const [mx0, mx1, mz0, mz1] = M7;
  placed += floodCourse(g, "west", mx0 + 1, [mz0 + 1, mz1 - 1], M7_SLOT_Y, { replace: false }).placed ?? 0;
  placed += floodCourse(g, "east", mx1 - 1, [mz0 + 1, mz1 - 1], M7_SLOT_Y, { replace: false }).placed ?? 0;
  placed += floodCourse(g, "north", mz0 + 1, [mx0 + 1, mx1 - 1], M7_SLOT_Y, { replace: false }).placed ?? 0;
  placed += floodCourse(g, "south", mz1 - 1, [mx0 + 1, mx1 - 1], M7_SLOT_Y, { replace: false }).placed ?? 0;

  // tower floodlight courses: flush at y62 in the wall plane of the camera-facing tower faces
  for (const [z0, z1] of FLOOD_EAST) placed += floodCourse(g, "east", 197, [z0, z1], FLOOD_Y).placed ?? 0;
  for (const [x0, x1] of FLOOD_SOUTH) placed += floodCourse(g, "south", 332, [x0, x1], FLOOD_Y).placed ?? 0;

  // four aircraft masts on the crown: iron_bars, a lightning_rod, a quartz cap (a standing torch needs a full top face),
  // and the red redstone_torch on top at y80 (the top of the build)
  for (const [x, z] of MASTS) {
    const y = MAST_BASE_Y;
    for (let i = 0; i < 2; i++) put(x, y + i, z, "iron_bars", { east: "false", north: "false", south: "false", west: "false" });
    for (let i = 2; i < 4; i++) put(x, y + i, z, "lightning_rod", { facing: "up", powered: "false" });
    put(x, y + 4, z, "smooth_quartz");
    put(x, y + 5, z, "redstone_torch", { lit: "true" });
    placed += 6;
  }

  // M8 entrance hall: a smooth_stone floor (y2) and ceiling (y13) over the hall, with hanging lanterns under it (a lamp hangs from a block)
  const [hx0, hx1] = HALL.x, [hz0, hz1] = HALL.z;
  for (let x = hx0; x <= hx1; x++) for (let z = hz0; z <= hz1; z++) {
    put(x, HALL.floorY, z, "smooth_stone");
    put(x, HALL.ceilY + 1, z, "smooth_stone");
  }
  for (let x = hx0 + 1; x <= hx1; x += 4) for (let z = hz0 + 2; z <= hz1; z += 4) put(x, HALL.ceilY, z, ...B.lantern(true));

  // spur spines: lit floor at y1 and a row of hanging lanterns at y9 down each spine
  for (const { x: [sx0, sx1], z: [sz0, sz1] } of SPURS) {
    for (let x = sx0; x <= sx1; x++) for (let z = sz0; z <= sz1; z++) put(x, 1, z, "smooth_stone");
    for (let x = sx0 + 1; x <= sx1; x += 2) for (let z = sz0 + 2; z <= sz1; z += 4) put(x, 9, z, ...B.lantern(true));
  }

  return placed;
}
