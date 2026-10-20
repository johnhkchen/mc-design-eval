import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey concrete shophouse-style commercial block (1960s-80s Taipei):
// stone plinth, white-tile pier and spandrel grid, glass window bands, a red
// fascia sign band over a shopfront with a central entrance, a quartz parapet
// cap, and a small roof plant room. Storeys are 5 blocks; roof cap at +11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617857";
const W = 10, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minGround = Math.min(...raw.map((c) => c[2]));

// Per-cell ground, relative to the lowest ground under the footprint, clamped so the
// roof plant (base + 12) stays inside the 23-block height.
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.min(10, Math.max(0, Math.round(gr - minGround))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

const minZ = Math.min(...cells.map((c) => c[1])); // street-facing (front) side
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const isEdge = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const base = G(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Floor slabs per storey and roof deck (all cells).
  for (const fy of [base, base + 5, base + 10]) put(x, fy, z, "light_gray_concrete");

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const faceCount = [exN, exS, exW, exE].filter(Boolean).length;
  const edge = faceCount > 0;
  const corner = faceCount >= 2;

  if (edge) {
    // Stone plinth at ground level, quartz parapet cap at roof level.
    put(x, base, z, "stone_bricks");
    put(x, base + 11, z, "smooth_quartz");

    const front = exN && z === minZ && !corner;
    const u = exN || exS ? x : z; // position along the face for the bay rhythm

    for (const rel of [1, 2, 3, 4, 6, 7, 8, 9]) {
      const y = base + rel;
      let id;
      if (corner) {
        id = "white_concrete";
      } else if (rel === 1) {
        id = "stone_bricks";
      } else if (rel === 4 || rel === 6) {
        id = front && rel === 4 ? "red_concrete" : "white_concrete";
      } else {
        // Window rows (2-3 and 7-9): glass bays between white-tile piers.
        if (u % 2 === 0) {
          id = "white_concrete";
        } else {
          id = "glass_pane";
        }
      }

      // Shopfront entrance: open door bay with a hanging lantern above.
      if (front && x === doorX && (rel === 2 || rel === 3)) {
        if (rel === 2) {
          put(x, y, z, "air");
        } else {
          put(x, y, z, "lantern", { hanging: "true" });
        }
        continue;
      }

      put(x, y, z, id);
    }
  } else {
    // Interior cell: air behind the glass; a warm shroomlight behind some windows.
    const nearEdge = isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);
    if (nearEdge && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1) && (x * 3 + z) % 4 === 0) {
      put(x, base + 3, z, "shroomlight");
      put(x, base + 8, z, "shroomlight");
    }

    // Roof plant room on the rear-middle of the roof.
    if (x >= 3 && x <= 6 && z >= 5 && z <= 12) {
      put(x, base + 11, z, "gray_concrete");
      put(x, base + 12, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
