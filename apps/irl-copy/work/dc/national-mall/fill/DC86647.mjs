import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86647";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 5, H = 19, D = 10;
const g = new Voxels([W, H, D]);

// ---- footprint map: key "x,z" -> { gr (ground), rf (lidar roof height) }
const cm = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  cm.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => cm.has(`${x},${z}`);
const minZ = Math.min(...[...cm.keys()].map((k) => +k.split(",")[1]));

// One clean roof tier for the whole building: median of lidar roof heights,
// so the silhouette is flat instead of stepping cell by cell.
const rfs = [...cm.values()].map((v) => v.rf).sort((a, b) => a - b);
const roofTier = rfs[Math.floor(rfs.length / 2)];

// ---- safe setter (props optional)
function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- build each footprint cell
for (const [k, { gr }] of cm) {
  const [x, z] = k.split(",").map(Number);
  const top = Math.min(H - 4, Math.max(roofTier, gr + 5)); // roof deck level (y)
  const ext = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const sides = Object.keys(ext).filter((s) => ext[s]);
  const perim = sides.length > 0;
  const winFace = sides.length === 1 ? sides[0] : null;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const storeys = top - gr;
  for (let t = 0; t < storeys; t++) {
    const y = gr + t;

    if (!perim) {
      // interior: air gap, floor slab at each storey start
      if (t % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    let id = "bricks";
    let p;

    // ground-floor entrance and shopfront on the street (north) face
    if (t <= 1 && winFace === "N" && z === minZ) {
      if (x === 2) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: t === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      } else if (x === 1 || x === 3) {
        put(x, y, z, "glass_pane", GLASS_EW);
        continue;
      }
    }

    if (t === 0) {
      id = "stone_bricks"; // plinth / base course
    } else if (t === 2) {
      id = "calcite"; // string course over the shopfront (articulates the wall)
    } else if (t === storeys - 1) {
      id = "calcite"; // cornice course
    } else if (t % 2 === 0) {
      id = "bricks"; // spandrel
    } else {
      // window row
      let isWin = false;
      let along = 0;
      if (winFace === "N" || winFace === "S") {
        along = x;
        isWin = x >= 1 && x <= 3;
      } else if (winFace === "E" || winFace === "W") {
        along = z;
        isWin = z >= 1 && z <= D - 2;
      }
      if (winFace && isWin) {
        id = "glass_pane";
        p = winFace === "N" || winFace === "S" ? GLASS_EW : GLASS_NS;
        // warm light behind some upper windows (interior cell inward of the pane)
        const storeyIdx = (t - 1) / 2;
        if (t > 1 && storeyIdx % 2 === 1 && along === (winFace === "N" || winFace === "S" ? 2 : 4)) {
          const off = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[winFace];
          const ix = x + off[0], iz = z + off[1];
          if (has(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
    put(x, y, z, id, p);
  }

  // roof: deck on interior, parapet slab on the perimeter
  if (!perim) put(x, top, z, "smooth_stone");
  else put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // compact roof plant on the central cells, set back from the parapet
  if (x >= 1 && x <= 2 && z >= 4 && z <= 5) {
    put(x, top + 1, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
