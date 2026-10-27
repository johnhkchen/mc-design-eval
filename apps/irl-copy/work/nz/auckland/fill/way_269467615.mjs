// Mt Eden / Newton edge: an interwar (c.1930s) two-and-a-half storey brick shop-and-office block, flat roof behind a
// stone parapet. The lidar roof is one level (10 over the footprint, with noise at the edges), so it is one flat tier;
// the ground falls 6 blocks across the site, so the low side shows the extra storeys and the high side sits on grade
// with a single shopfront storey. Storey bands are 4 blocks from each cell's own ground: riser, two glass rows,
// spandrel. Windows are glass panes in piers of stone, with an air pocket behind each (warm lights in some), and the
// ground floor is a shopfront with one recessed entrance under a dark hood.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467615.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 55, D = 29, Y = 23;
const T = 10;                     // the flat roof tier (the lidar roof, median over the footprint)
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const ground = new Map(cells.map(([x, z, g]) => [x + "," + z, g]));
const inF = (x, z) => ground.has(x + "," + z);
const exposed = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));
const faceOf = (x, z) => { const e = exposed(x, z); return e.length ? (e.find((d) => d === "N" || d === "S") ?? e[0]) : null; };
const gAt = (x, z) => ground.get(x + "," + z);

// the entrance: a south-or-north facade cell on the lowest street, nearest the middle of the front
const candidates = cells.filter(([x, z]) => {
  const f = faceOf(x, z);
  return (f === "N" || f === "S") && inF(x - 1, z) && inF(x + 1, z) && faceOf(x - 1, z) === f && faceOf(x + 1, z) === f;
});
candidates.sort((a, b) => (a[2] - b[2]) || (Math.abs(a[0] - 27) - Math.abs(b[0] - 27)));
const [dx0, dz0, dg0] = candidates[0];
const DOOR = { x: dx0, z: dz0, face: faceOf(dx0, dz0), g: dg0 };
const HOOD = new Set([`${dx0 - 1},${dz0}`, `${dx0},${dz0}`, `${dx0 + 1},${dz0}`]);

const paneState = (f) => (f === "N" || f === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// one facade cell's block, by its height above its own ground (k) and its bay (the column along its face)
function facadeBlock(x, z, f, k, g0) {
  const col = f === "N" || f === "S" ? x : z;
  const r = k % 4, s = Math.floor(k / 4), top = T - g0 - 1;
  if (x === DOOR.x && z === DOOR.z && s === 0 && (r === 1 || r === 2)) {
    return { block: "dark_oak_door", state: { facing: DOOR.face === "N" ? "north" : DOOR.face === "S" ? "south" : DOOR.face === "W" ? "west" : "east", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (HOOD.has(`${x},${z}`) && s === 0 && r === 3 && f) {
    return { block: "dark_oak_stairs", state: { facing: DOOR.face === "N" ? "north" : DOOR.face === "S" ? "south" : DOOR.face === "W" ? "west" : "east", half: "top", shape: "straight", waterlogged: "false" } };
  }
  if (k === top) return { block: "white_concrete" };                     // cornice course, the top body row
  if (r === 0) return { block: s === 0 ? "stone_bricks" : "smooth_stone" };     // base course / sill course
  if (r === 3) return { block: s === 0 ? "white_concrete" : "bricks" };          // shopfront fascia / spandrel
  if (col % 4 === 0) return { block: "stone_bricks" };                             // pier between the bays
  return { block: "glass_pane", state: paneState(f) };
}

const v = new Voxels([W, Y, D]);

// the solid mass: foundation to each cell's ground, then the flat tier, with the facade and roof treatment
for (const [x, z, g0] of cells) {
  const f = faceOf(x, z);
  for (let y = 0; y < g0; y++) v.set(x, y, z, "stone_bricks");
  for (let y = g0; y < T; y++) {
    const k = y - g0;
    if (!f) { v.set(x, y, z, y === T - 1 ? "gray_concrete" : "bricks"); continue; }   // roof membrane on the interior
    const b = facadeBlock(x, z, f, k, g0);
    v.set(x, y, z, b.block, b.state);
  }
  if (f) v.set(x, T, z, "stone_bricks");                                             // parapet
}

// the air behind each window and the door: a one-block pocket with a solid wall behind it, lit in some windows
for (const [x, z, g0] of cells) {
  const f = faceOf(x, z);
  if (!f) continue;
  const [ox, oz] = DIR[f];
  const ix = x - ox, iz = z - oz;
  if (!inF(ix, iz) || exposed(ix, iz).length || !inF(ix - ox, iz - oz)) continue;
  const gi = gAt(ix, iz);
  for (let k = 0; k < T - g0; k++) {
    const y = g0 + k;
    const b = facadeBlock(x, z, f, k, g0);
    if (b.block !== "glass_pane" && b.block !== "dark_oak_door") continue;   // only the glazed rows get a pocket
    if (y < gi || y >= T) continue;
    if (b.block === "dark_oak_door") {
      if (b.state.half === "lower") v.set(ix, y, iz, "air");
      else v.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });   // hangs under the solid storey above
      continue;
    }
    const h = (x * 31 + z * 17 + k * 7) % 5;
    if (h === 0 && k % 4 === 1) v.set(ix, y, iz, "glowstone");
    else if (h === 2 && k % 4 === 2) v.set(ix, y, iz, "shroomlight");
    else v.set(ix, y, iz, "air");
  }
}

// roof plant: a bulkhead and two plant boxes on the interior roof, one block above the parapet line
for (const [x0, z0, w, d, block] of [[30, 8, 2, 2, "stone_bricks"], [17, 10, 3, 2, "light_gray_concrete"], [21, 16, 2, 2, "light_gray_concrete"]]) {
  let ok = true;
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!inF(x, z) || faceOf(x, z)) ok = false;
  if (!ok) continue;
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) v.set(x, T, z, block);
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467615.nbt");
console.log(JSON.stringify({ blocks: v.count(), door: DOOR, palette: v.palette.length - 1 }));
