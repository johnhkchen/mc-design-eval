// Westmount Apartments: a six-storey 1960s-70s flat block (white plaster walls, light-grey concrete piers, sills and
// storey lines, grey flat roof behind a parapet), with a two-storey penthouse core on the two lidar bumps at 29.
// Massing from the lidar: every cell stands on its own ground (foundation to G), the storey lines are absolute
// (y = 0, 4, 8, ..., 20 with the roof deck at 24), so the floors run level across the slope and the downhill cells
// simply carry more storeys. Roof values below 28 are one flat parapet top (27); 28-29 is the penthouse (top 29).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_131469535.cells.json`, "utf8"));   // [x, z, ground, roof]

const DECK = 24;                              // roof deck (top of the sixth storey), penthouse floor
const PITCH = [4, 8, 12, 16, 20];             // absolute storey lines, 4 blocks apart (3.3 m)
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];   // N, S, E, W

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, ph: r >= 28 });
const inFp = (x, z) => cell.has(`${x},${z}`);
const isPh = (x, z) => cell.get(`${x},${z}`)?.ph === true;

// the faces of this cell at height y that are outside the wall: the shell below the deck is the footprint's edge; the
// penthouse walls face the roof around it as well
function exposed(x, z, y, ph) {
  return DIRS.filter(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return y >= DECK + 1 && ph ? !(inFp(nx, nz) && isPh(nx, nz)) : !inFp(nx, nz);
  });
}

// the facade of one storey: the storey's air rows L+1 .. Ln-1 on an exposed face. Piers every third block (white),
// windows between them: a light-grey sill, then two rows of glass. The ground storey has a stone base course.
function facade(x, z, y, L, Ln, G, ex) {
  const r = y - L - 1;
  if (L === G && r === 0) return "stone_bricks";
  const along = ex[0][0] !== 0 ? z : x;          // N/S faces run along x, E/W along z
  const pier = ex.length > 1 || along % 3 === 0; // corners and every third block
  if (pier) return "white_concrete";
  if (r === 0) return "light_gray_concrete";
  return "light_blue_stained_glass";
}

const V = new Voxels([42, 42, 56]);

// the entrance: a north-facing edge cell of the ground storey nearest x = 21 with exposed neighbours either side
let door = null;
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (c.ph || inFp(x, z - 1) || !inFp(x - 1, z) || !inFp(x + 1, z) || inFp(x - 1, z - 1) || inFp(x + 1, z - 1)) continue;
  if (door === null || Math.abs(x - 21) < Math.abs(door[0] - 21) || (Math.abs(x - 21) === Math.abs(door[0] - 21) && z < door[1])) door = [x, z];
}

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const G = c.g, ph = c.ph;

  // foundation to the ground, and the storey lines above it (the ground slab at G, then each absolute line 3+ above it)
  for (let y = 0; y <= G; y++) V.set(x, y, z, "stone_bricks");
  const lines = [G, ...PITCH.filter((s) => s - G >= 3)];
  lines.push(DECK);
  if (ph) lines.push(28);
  for (let i = 0; i < lines.length - 1; i++) {
    const L = lines[i], Ln = lines[i + 1];
    if (L > G) V.set(x, L, z, "light_gray_concrete");          // storey line (floor slab) across the footprint
    for (let y = L + 1; y < Ln; y++) {
      const ex = exposed(x, z, y, ph);
      if (ex.length) V.set(x, y, z, facade(x, z, y, L, Ln, G, ex), undefined);
    }
  }
  // the deck and the penthouse top; the main parapet (white wall, light-grey coping) on the outside edge
  V.set(x, DECK, z, "gray_concrete");
  if (ph) V.set(x, 28, z, "gray_concrete");
  else if (exposed(x, z, DECK + 1, false).length) {
    V.set(x, DECK + 1, z, "white_concrete");
    V.set(x, DECK + 2, z, "light_gray_concrete");
  }
}

// the entrance: two door blocks on the ground storey, a light-grey lintel over it, a lamp just inside
if (door) {
  const [ex, ez] = door;
  const G = cell.get(`${ex},${ez}`).g;
  const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
  V.set(ex, G + 1, ez, "oak_door", { ...doorState, half: "lower" });
  V.set(ex, G + 2, ez, "oak_door", { ...doorState, half: "upper" });
  for (const dx of [-1, 0, 1]) if (G + 3 < 24 && inFp(ex + dx, ez)) V.set(ex + dx, G + 3, ez, "light_gray_concrete");
  V.set(ex, G + 2, ez + 1, "glowstone");
}

// warm lights: some window bays get a glowstone or shroomlight just inside the glass (air behind the glass stays)
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const G = c.g;
  const lines = [G, ...PITCH.filter((s) => s - G >= 3), DECK, ...(c.ph ? [28] : [])];
  for (let i = 0; i < lines.length - 1; i++) {
    const L = lines[i], Ln = lines[i + 1];
    const y = L + 2;                         // the first glass row of the storey (air rows L+1 .. Ln-1)
    if (y >= Ln) continue;
    const ex = exposed(x, z, y, c.ph);
    if (!ex.length || ex.length > 1) continue;
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    if (along % 3 === 0) continue;               // piers do not light
    if ((x * 5 + z * 3 + y * 7) % 4 !== 0) continue;
    const ix = x - dx, iz = z - dz;              // the cell just inside the glass
    if (!inFp(ix, iz) || V.val(ix, y, iz) !== 0) continue;
    V.set(ix, y, iz, (x + z + y) % 2 ? "glowstone" : "shroomlight");
  }
}

// roof equipment: a few 2x2 plant boxes on the deck of the main roof, clear of the parapet and the penthouse
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (c.ph || exposed(x, z, DECK + 1, false).length) continue;
  if (x % 12 !== 4 || z % 12 !== 4) continue;
  const clear = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inFp(x + dx, z + dz) && !isPh(x + dx, z + dz) && !exposed(x + dx, z + dz, DECK + 1, false).length);
  if (!clear) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) V.set(x + dx, DECK + 1, z + dz, "smooth_stone");
}

const out = `${FILL}/way_131469535.nbt`;
const stats = V.save(out);
console.log(JSON.stringify({ file: out, ...stats, door }));
