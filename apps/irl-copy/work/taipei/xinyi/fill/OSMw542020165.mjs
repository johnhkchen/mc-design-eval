import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse-era commercial block, c. 1985-1995:
// 2 storeys over a ground-floor shopfront, white tiled concrete walls,
// light-grey concrete piers, glazed bays, red awnings, stone-brick cornice,
// a parapet and roof-top AC plant. Roof top at y 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020165";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 18;
const ROOF = 10;   // top of walls / roof slab
const PARA = 11;   // parapet course on perimeter

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const NORM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Exposed faces
const faces = { N: [], S: [], W: [], E: [] };
const perim = new Set();
for (const [x, z, gr] of cells) {
  for (const d of Object.keys(NORM)) {
    const [dx, dz] = NORM[d];
    if (!has(x + dx, z + dz)) {
      faces[d].push({ x, z, gr });
      perim.add(key(x, z));
    }
  }
}

// Group exposed cells into continuous face runs
const groups = [];
for (const d of Object.keys(NORM)) {
  const ns = d === "N" || d === "S";
  const byLine = new Map();
  for (const c of faces[d]) {
    const k = ns ? c.z : c.x;
    if (!byLine.has(k)) byLine.set(k, []);
    byLine.get(k).push(c);
  }
  for (const arr of byLine.values()) {
    arr.sort((a, b) => (ns ? a.x - b.x : a.z - b.z));
    groups.push({ d, arr });
  }
}

// Entrance: middle of the longest face run
let doorGroup = null;
for (const grp of groups) {
  if (!doorGroup || grp.arr.length > doorGroup.arr.length) doorGroup = grp;
}
const doorIdx = doorGroup ? Math.floor(doorGroup.arr.length / 2) : -1;

// 1. Foundation under every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Interior: air between floor slabs, roof slab at ROOF
for (const [x, z, gr] of cells) {
  if (perim.has(key(x, z))) continue;
  const f = Math.min(gr + 5, ROOF - 3);
  put(x, gr, z, "smooth_stone");
  put(x, f, z, "smooth_stone");
  put(x, ROOF, z, "gray_concrete");
}

// 3. Facades on exposed perimeter cells
for (const grp of groups) {
  const { d, arr } = grp;
  const ns = d === "N" || d === "S";
  const L = arr.length;
  const isDoorGroup = grp === doorGroup;
  arr.forEach((c, idx) => {
    const gr = c.gr;
    const f = Math.min(gr + 5, ROOF - 3);
    const col = idx === 0 || idx === L - 1 || idx % 3 === 0;

    // pane connection props along the face
    const left = idx > 0 ? "true" : "false";
    const right = idx < L - 1 ? "true" : "false";
    const paneProps = ns
      ? { north: "false", south: "false", east: right, west: left }
      : { north: left, south: right, east: "false", west: "false" };

    for (let y = gr; y <= ROOF; y++) {
      let b = "white_concrete", p = null;

      if (y === gr) {
        b = "polished_granite";                                  // base course
      } else if (y < f) {                                        // ground storey: shopfront
        if (y === gr + 4) b = "orange_concrete";                 // fascia / sign band
        else if (col) b = "light_gray_concrete";
        else { b = "glass_pane"; p = paneProps; }
      } else if (y === f) {
        b = "smooth_stone";                                      // storey line
      } else if (y < ROOF) {                                     // upper storey
        if (col) b = "light_gray_concrete";
        else if (y <= f + 3) { b = "glass_pane"; p = paneProps; }
        else b = "white_concrete";                               // spandrel
      } else {                                                   // y === ROOF
        b = "stone_bricks";                                      // cornice
      }

      // Awning over the entrance
      if (isDoorGroup && Math.abs(idx - doorIdx) <= 1 && y === gr + 3) {
        b = "red_concrete";
        p = null;
      }

      put(c.x, y, c.z, b, p);
    }

    // parapet
    put(c.x, PARA, c.z, "white_concrete");

    // glowstone just inside some upper-storey windows
    if (!col && idx % 6 === 1) {
      const [nx, nz] = NORM[d];
      const ix = c.x - nx, iz = c.z - nz;
      if (has(ix, iz) && !perim.has(key(ix, iz))) {
        put(ix, f + 2, iz, "glowstone");
      }
    }
  });

  // Entrance door (two blocks tall) on the chosen face
  if (isDoorGroup && doorIdx >= 0) {
    const c = arr[doorIdx];
    const gr = c.gr;
    put(c.x, gr + 1, c.z, "dark_oak_door", {
      facing: FACING[d], half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(c.x, gr + 2, c.z, "dark_oak_door", {
      facing: FACING[d], half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// 4. Roof plant: AC condenser boxes standing on the roof slab
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (perim.has(key(x, z))) continue;
  if ((x + 2 * z) % 13 === 0) put(x, PARA, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
