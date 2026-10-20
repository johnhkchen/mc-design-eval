import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458015";
const W = 22, H = 33, D = 18;

// Storey rhythm: 5-block storeys, 4 storeys, cornice at 20, parapet at 21.
const FLOOR_LEVELS = [5, 10, 15];
const WALL_TOP = 19;
const CORNICE = 20;
const PARAPET = 21;

// Palette: 1980s Taipei commercial block, pale tiled facade, tinted glazing, dark shop signage band.
const FOUND = "stone_bricks";
const PLINTH = "polished_granite";
const PIER = "smooth_quartz";
const SPANDREL = "white_concrete";
const SIGN = "black_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SLAB = "stone";
const ROOF = "gray_concrete";
const PLANT = "light_gray_concrete";
const PLANT_TOP = "smooth_stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = cells.map(([x, z, gr]) => ({ x, z, gr: Math.round(gr) }));
const footprint = new Map(fp.map((c) => [`${c.x},${c.z}`, c.gr]));
const has = (x, z) => footprint.has(`${x},${z}`);

const edgeOf = (x, z) => ({
  w: !has(x - 1, z),
  e: !has(x + 1, z),
  n: !has(x, z - 1),
  s: !has(x, z + 1),
});
const perimOf = (x, z) => {
  const e = edgeOf(x, z);
  return e.w || e.e || e.n || e.s;
};

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main pass: foundation, walls, floors, roof deck.
for (const { x, z, gr } of fp) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const e = edgeOf(x, z);
  const perim = e.w || e.e || e.n || e.s;
  const xFace = (e.w || e.e) && !(e.n || e.s);
  const zFace = (e.n || e.s) && !(e.w || e.e);
  // A window only sits on a straight run of facade with neighbours on both sides.
  const alongOK = xFace
    ? has(x, z - 1) && has(x, z + 1)
    : zFace
    ? has(x - 1, z) && has(x + 1, z)
    : false;
  const along = xFace ? z : x;
  const windowable = (xFace || zFace) && alongOK && along % 3 !== 0;

  for (let y = gr; y <= CORNICE; y++) {
    if (!perim) {
      if (y === CORNICE) put(x, y, z, ROOF);
      else if (FLOOR_LEVELS.includes(y)) put(x, y, z, SLAB);
      continue;
    }
    if (y === CORNICE) {
      put(x, y, z, PIER);
      continue;
    }
    const r = y % 5;
    const s = Math.floor(y / 5);
    if (r === 0) {
      put(x, y, z, s === 0 ? PLINTH : SPANDREL);
      continue;
    }
    if (r === 4) {
      put(x, y, z, s === 0 ? SIGN : SPANDREL);
      continue;
    }
    if (windowable) {
      const props = xFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, GLASS, props);
      // Warm light behind some panes, in the interior air gap.
      if ((x * 7 + z * 5 + y * 3) % 11 === 0) {
        const ix = e.w ? x + 1 : e.e ? x - 1 : x;
        const iz = e.n ? z + 1 : e.s ? z - 1 : z;
        if (has(ix, iz) && !perimOf(ix, iz)) put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, PIER);
    }
  }

  // Parapet ring above the cornice.
  if (perim && gr <= PARAPET) put(x, PARAPET, z, PIER);
}

// Entrance on the north (min z) front, nearest x = 10, on the ground storey.
const frontCells = fp.filter((c) => edgeOf(c.x, c.z).n);
frontCells.sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10));
if (frontCells.length) {
  const { x: dx, z: dz, gr: dg } = frontCells[0];
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, dg, dz, "oak_door", doorProps("lower"));
  put(dx, dg + 1, dz, "oak_door", doorProps("upper"));

  // Hanging lanterns either side of the door, under the shop signage band.
  if (dg <= 2) {
    for (const ox of [-2, 2]) {
      const lx = dx + ox;
      if (has(lx, dz) && edgeOf(lx, dz).n) {
        put(lx, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Rooftop plant room: solid box on the roof deck, interior cells only.
for (let x = 4; x <= 9; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!has(x, z) || perimOf(x, z)) continue;
    for (let y = CORNICE + 1; y <= CORNICE + 3; y++) put(x, y, z, PLANT);
    put(x, CORNICE + 4, z, PLANT_TOP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
