import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 15 x 26 footprint, roof ~11 blocks above lowest ground.
// Read as a 1990s Xinyi-district commercial mid-rise: two storeys of 5 blocks,
// cream "smooth quartz" facade with a granite plinth, a red fascia band over a
// glazed shopfront on the street face, tinted-glass window bands, a cornice and
// parapet, and a roof of plant and a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034026";
const W = 15, H = 23, D = 26;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);
const cells = list.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 }
);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const c of cells) {
  // keep the building inside the 23-tall volume: parapet sits at ground + 11
  const gr = Math.max(0, Math.min(10, Math.round(c.g)));
  fp.set(key(c.x, c.z), gr);
}
const inFp = (x, z) => fp.has(key(x, z));

// faces: 'N' = z-1 side (street frontage), 'S' = z+1, 'W' = x-1, 'E' = x+1
function facesOf(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const isInterior = (x, z) => inFp(x, z) && facesOf(x, z).length === 0;

// Entrance: non-corner front (N) cell nearest to x = 7
let doorX = null;
for (const c of cells) {
  const f = facesOf(c.x, c.z);
  if (c.z === 0 && f.length === 1 && f[0] === "N") {
    if (doorX === null || Math.abs(c.x - 7) < Math.abs(doorX - 7)) doorX = c.x;
  }
}
if (doorX === null) {
  for (const c of cells) {
    const f = facesOf(c.x, c.z);
    if (f.includes("N") && (doorX === null || Math.abs(c.x - 7) < Math.abs(doorX - 7))) doorX = c.x;
  }
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
};

// Roof centre for the lightning rod
let cxSum = 0, czSum = 0, nC = 0;
for (const c of cells) { cxSum += c.x; czSum += c.z; nC++; }
const cX = Math.round(cxSum / nC), cZ = Math.round(czSum / nC);

let rodCell = null;
let best = Infinity;
for (const c of cells) {
  if (!isInterior(c.x, c.z)) continue;
  const d = Math.abs(c.x - cX) + Math.abs(c.z - cZ);
  if (d < best) { best = d; rodCell = c; }
}

for (const c of cells) {
  const { x, z } = c;
  const gr = fp.get(key(x, z));
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const front = faces.length === 1 && faces[0] === "N";
  const isDoor = front && x === doorX;
  const t = faces.includes("N") || faces.includes("S") ? x : z;
  const pier = t % 3 === 0;
  const windowCell = perim && !corner && !pier && !front;

  // Foundation fill and ground-floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks");

  if (perim) {
    // Rel 1: plinth course, or the entrance doors
    if (isDoor) {
      const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
      put(x, gr + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
      put(x, gr + 3, z, "light_blue_stained_glass");
    } else {
      put(x, gr + 1, z, "polished_granite");

      // Rel 2-3: shopfront glass on the street face, windows elsewhere on the ground floor
      if (front) {
        put(x, gr + 2, z, corner ? "smooth_quartz" : "light_blue_stained_glass");
        put(x, gr + 3, z, corner ? "smooth_quartz" : "light_blue_stained_glass");
        // Rel 4: red fascia over the shopfront
        put(x, gr + 4, z, corner ? "smooth_quartz" : "red_concrete");
      } else {
        const gl = windowCell ? "cyan_stained_glass" : "smooth_quartz";
        put(x, gr + 2, z, gl);
        put(x, gr + 3, z, gl);
        put(x, gr + 4, z, "smooth_quartz");
      }
    }
    if (isDoor) {
      put(x, gr + 4, z, "red_concrete");
    }
  }

  // Rel 5: floor slab across the whole footprint
  put(x, gr + 5, z, "smooth_quartz");

  if (perim) {
    // Rel 6: sill course
    put(x, gr + 6, z, "smooth_quartz");
    // Rel 7-8: upper-floor window band
    if (windowCell) {
      put(x, gr + 7, z, "light_blue_stained_glass");
      put(x, gr + 8, z, "light_blue_stained_glass");
    } else {
      put(x, gr + 7, z, "smooth_quartz");
      put(x, gr + 8, z, "smooth_quartz");
    }
    // Rel 9: lintel
    put(x, gr + 9, z, "smooth_quartz");
    // Rel 10: cornice
    put(x, gr + 10, z, "smooth_quartz");
    // Rel 11: parapet
    put(x, gr + 11, z, "smooth_quartz");
  } else {
    // Interior roof deck
    put(x, gr + 10, z, "light_gray_concrete");
  }

  // Warm lanterns standing on the floor slabs, behind some windows
  if (windowCell && isInterior(x + inward[faces[0]][0], z + inward[faces[0]][1])) {
    const ix = x + inward[faces[0]][0];
    const iz = z + inward[faces[0]][1];
    if (((x + 2 * z) % 5) === 0) put(ix, gr + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
    if (((x + z) % 4) === 0) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Ground-floor shopfront lamps behind the glass
  if (front && !isDoor && !corner && isInterior(x, z + 1) && ((x % 3) === 1)) {
    put(x, gr + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Roof plant: small air-conditioning blocks on the interior roof
  if (!perim && ((x % 5) === 2) && ((z % 7) === 3)) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

// Lightning rod at the roof centre
if (rodCell) {
  const gr = fp.get(key(rodCell.x, rodCell.z));
  put(rodCell.x, gr + 11, rodCell.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
