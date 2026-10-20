// Glasshouse and Chihuly flower (P4): the vault (10 bays z4..43, axis 231+k), its surface ribs, the glass gables at
// z4 and z43 with their lightning-rod finials, the blackstone floor with sea-lantern inlays, the two glass vestibules
// H1 (north, z0..3) and H2 (south, z44..47), and the hanging flower in bays 1..8.
//
// Local helpers (vocab lacks them): gable() because vocab's vaultEndGable has no openings, glassBox() because
// vestibuleGlassBox writes air-only and can't leave the doorway and inner openings the plan asks for, and ribs()
// because vaultRib fills the whole cross-section (a solid wall across the hall); the plan's rib is the arch outline.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { vaultBay, chihulyFlower, doorPair } from "../vocab.mjs";

// vault surface half-width by y (1..20), plan.md's cross-section table
const VDX = [null, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2, 1, 0];
const AXIS = (k) => 231 + k;

/** A key for an opening cell: "x,z" with y 1..3 kept air. */
const openKey = (x, z) => `${x},${z}`;

/** Glass gable at plane z (the vault's end): glass with smooth_quartz mullions every 3 x from the axis, the openings
 *  left air (y 1..3). The vault's surface cells are the same profile, so bays refuse the gable's cells, not the reverse. */
function gable(g, { z, cx, openings = new Set() }) {
  for (let y = 1; y <= 20; y++) {
    const d = VDX[y];
    for (let x = cx - d; x <= cx + d; x++) {
      if (y <= 3 && openings.has(openKey(x, z))) continue;
      const block = (x - cx) % 3 === 0 ? "smooth_quartz" : "glass";
      g.set(x, y, z, block);
    }
  }
}

/** Surface rib at plane z: smooth_quartz on the vault's surface cells only (the arch outline), so the hall stays open. */
function rib(g, { z, cx }) {
  for (let y = 1; y <= 20; y++) {
    const d = VDX[y];
    for (const s of d === 0 ? [0] : [-1, 1]) g.set(cx + s * d, y, z, "smooth_quartz");
  }
}

/** Glass box with a smooth_quartz frame (posts at the corners and every 7 along each edge), glass_pane walls, a
 *  smooth_quartz_slab rim and a glass roof at y h with quartz beams every 7 x. openings: "x,z" columns cut to air at
 *  y 1..3 (doorways). Walls are one cell thick here; the plan's 2-thick frame reads the same at this size. */
function glassBox(g, { x0, z0, x1, z1, h, openings = new Set() }) {
  const post = (x, z) => (x === x0 || x === x1 || z === z0 || z === z1) && (
    (x === x0 || x === x1) && ((z - z0) % 7 === 0 || z === z1) ||
    (z === z0 || z === z1) && ((x - x0) % 7 === 0 || x === x1));
  const onWall = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  for (let y = 1; y < h; y++) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!onWall(x, z)) continue;
      if (y <= 3 && openings.has(openKey(x, z))) continue;
      if (post(x, z)) { g.set(x, y, z, "smooth_quartz"); continue; }
      // a pane connects along its wall to neighbouring panes or quartz posts (not to air), so state it
      const along = z === z0 || z === z1 ? [x - 1, x + 1] : [z - 1, z + 1];
      const solidAt = (a) => {
        const [cx, cz] = z === z0 || z === z1 ? [a, z] : [x, a];
        if (cx < x0 || cx > x1 || cz < z0 || cz > z1) return false;
        if (y <= 3 && openings.has(openKey(cx, cz))) return false;
        return onWall(cx, cz);
      };
      const e = solidAt(along[1]) ? "true" : "false";
      const w = solidAt(along[0]) ? "true" : "false";
      const state = z === z0 || z === z1 ? { north: "false", south: "false", east: e, west: w } : { north: w, south: e, east: "false", west: "false" };
      g.set(x, y, z, "glass_pane", state);
    }
  }
  // roof at y h: quartz slab rim, glass inside, a quartz beam every 7 x
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rim = onWall(x, z);
    if (rim) g.set(x, h, z, "smooth_quartz_slab", { type: "bottom" });
    else g.set(x, h, z, (x - x0) % 7 === 0 ? "smooth_quartz" : "glass");
  }
  // one hanging lantern under the roof, centred
  g.set(Math.floor((x0 + x1) / 2), h - 1, Math.floor((z0 + z1) / 2), ...B.lantern(true));
}

export function build(g) {
  // 1. the two glass end gables, with the doorway openings the plan asks for (H1 through z4, H2 through z43)
  const northOpen = new Set([openKey(236, 4), openKey(237, 4)]);
  const southOpen = new Set([openKey(234, 43), openKey(235, 43)]);
  gable(g, { z: 4, cx: AXIS(0), openings: northOpen });
  gable(g, { z: 43, cx: AXIS(9), openings: southOpen });
  g.set(AXIS(0), 21, 4, "lightning_rod", { facing: "up", powered: "false" });
  g.set(AXIS(9), 21, 43, "lightning_rod", { facing: "up", powered: "false" });

  // 2. the arch ribs on the bay starts z 8..40 (before the bays, so the bays refuse the rib planes)
  for (let k = 1; k <= 9; k++) rib(g, { z: 4 + 4 * k, cx: AXIS(k) });

  // 3. the ten bays: surface glass, curb, purlins, and the blackstone floor with sea-lantern inlays
  for (let k = 0; k < 10; k++) vaultBay(g, { k, x0: 231, z0: 4, floor: true });

  // 4. the hanging CHIHULY cloud in bays 1..8
  chihulyFlower(g, { bays: [1, 2, 3, 4, 5, 6, 7, 8], seed: 1, x0: 231, z0: 4 });

  // 5. vestibules: H1 north (z0..3, h 6), H2 south (z44..47, h 5); doorways cut through their inner walls
  const h1Open = new Set([openKey(236, 0), openKey(237, 0), openKey(236, 3), openKey(237, 3)]);
  glassBox(g, { x0: 233, z0: 0, x1: 240, z1: 3, h: 6, openings: h1Open });
  doorPair(g, { x: 236, z: 0, face: "north", width: 2 });

  const h2Open = new Set([openKey(234, 44), openKey(235, 44), openKey(234, 47), openKey(235, 47)]);
  glassBox(g, { x0: 233, z0: 44, x1: 236, z1: 47, h: 5, openings: h2Open });
  doorPair(g, { x: 234, z: 47, face: "south", width: 2 });
}
