import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 19 x 16 footprint, roof about 11 blocks above the lowest ground.
// Reading: a two-storey commercial block of the 1980s to 1990s Xinyi fringe.
// Cream smooth-quartz walls with a white-concrete frame, a stone-brick base,
// a shopfront with a central door under a dark-oak canopy, a cornice and parapet,
// rooftop water tank and condenser units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039813";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 16;
const ROOF = 11;     // roof height above the lowest ground
const CORNICE = 10;  // cornice row (bottom slab)
const FLOOR2 = 5;    // storey line and second-floor slab
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map((c) => c[2]));
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr - minG);

const has = (x, z) => groundOf.has(`${x},${z}`);
const FACES = [
  { n: "N", dx: 0, dz: -1 },
  { n: "S", dx: 0, dz: 1 },
  { n: "W", dx: -1, dz: 0 },
  { n: "E", dx: 1, dz: 0 },
];
const outwardFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isPerim = (x, z) => outwardFaces(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pillar bays: every third cell along a face, plus corners and run ends.
const isPillar = (x, z, faces) => {
  if (faces.length > 1) return true;
  const f = faces[0];
  const along = f.dz !== 0 ? x : z;
  if (along % 3 === 0) return true;
  if (f.dz !== 0) return !has(x - 1, z) || !has(x + 1, z);
  return !has(x, z - 1) || !has(x, z + 1);
};

const wallId = (y, pillar) => {
  if (y === ROOF) return "white_concrete";
  if (pillar) return "white_concrete";
  if (y === 4 || y === FLOOR2) return "light_gray_concrete";
  if (y === 6) return "smooth_quartz";
  return "glass";
};

// Pass 1: foundations, interior floors, walls.
for (const [x, z, gr] of cells) {
  const G = gr - minG;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);
  if (faces.length === 0) {
    // Interior: ground floor, second-floor slab, roof deck.
    for (let y = G; y <= CORNICE; y++) {
      if (y === G) put(x, y, z, "smooth_stone");
      else if (y === FLOOR2) put(x, y, z, "light_gray_concrete");
      else if (y === CORNICE) put(x, y, z, "gray_concrete");
    }
    continue;
  }

  const pillar = isPillar(x, z, faces);
  for (let y = G; y <= ROOF; y++) {
    if (y === G) put(x, y, z, "stone_bricks");
    else if (y === CORNICE) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    else put(x, y, z, wallId(y, pillar));
  }
}

// Pass 2: entrance on the south (+z) street face, centred on its cells.
const southCells = cells
  .filter(([x, z]) => isPerim(x, z) && !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [dx, dz, dgr] = southCells[Math.floor(southCells.length / 2)];
  const G = dgr - minG;
  const dy = G + 1;
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, dy, dz, "dark_oak_door", doorProps("lower"));
  put(dx, dy + 1, dz, "dark_oak_door", doorProps("upper"));
  // Dark-oak canopy over the entrance bay.
  for (const cx of [dx - 1, dx, dx + 1]) {
    if (has(cx, dz)) put(cx, 4, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  // Interior lantern behind the door.
  if (has(dx, dz - 1) && !isPerim(dx, dz - 1)) {
    const gi = groundOf.get(`${dx},${dz - 1}`);
    put(dx, gi + 1, dz - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: warm lights standing on interior floors behind windows.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const faces = outwardFaces(x, z);
  const G = gr - minG;
  const pillar = isPillar(x, z, faces);
  if (pillar) continue;
  const f = faces[0];
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const idx = f.dz !== 0 ? x : z;
  const gi = groundOf.get(`${ix},${iz}`);
  if (idx % 6 === 1 && G + 1 <= 3 && gi <= 1) {
    // Ground floor: glowstone on the interior floor behind the glass.
    put(ix, G + 1, iz, "glowstone");
  }
  if (idx % 6 === 4) {
    // Upper floor: shroomlight on the second-floor slab behind the glass.
    put(ix, FLOOR2 + 1, iz, "shroomlight");
  }
}

// Pass 4: roof equipment on interior roof deck.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const tankOK = [];
for (let tx = cx - 1; tx <= cx + 1; tx++)
  for (let tz = cz - 1; tz <= cz + 1; tz++)
    if (has(tx, tz) && !isPerim(tx, tz)) tankOK.push([tx, tz]);
for (const [tx, tz] of tankOK) {
  put(tx, ROOF, tz, "smooth_quartz");
  put(tx, ROOF + 1, tz, "smooth_quartz");
  put(tx, ROOF + 2, tz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
if (tankOK.length) put(cx, ROOF + 3, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

for (const [ax, az] of [[3, 3], [15, 12]]) {
  if (has(ax, az) && !isPerim(ax, az)) put(ax, ROOF, az, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
