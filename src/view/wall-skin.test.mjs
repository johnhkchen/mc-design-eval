// WS1–WS11 — the wall-skin pass (T-160-02, story S-160, epic E-38). Pure-brush unit tests, co-located,
// run under `node --test "src/**/*.test.mjs"`. Plan derivation per role-set (gating), then the brush's
// determinism / idempotence / roof-untouched / not-drowned / no-program invariants. The measurement leg
// (the volume batch + beside-concept renders) is GL+LLM integration, evidenced by the committed artifacts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { wallSkin, wallSkinPlan, packTreatments, isBoardFamily } from "./wall-skin.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
// the dressing seam is dependency-injected (the brush-door rule); a test file is not swept, so it may
// import the technique to exercise the full skin path the runner wires.
import { extractApertures, dressOpenings } from "./opening-dressing.mjs";
const DRESS = { extractApertures, dressOpenings };

// --- synthetic packs (role→block, the resolution targets) ---------------------------------------------
const PACK_RICH = {
  palette: [
    { role: "wall.field.ground", block: "cobblestone" },
    { role: "wall.field.upper", block: "dark_oak_planks" },
    { role: "wall.dressing.quoin", block: "stone_bricks" },
    { role: "wall.finish.limewash", block: "white_terracotta" },
    { role: "door.main", block: "spruce_door" },
    { role: "window.shutter", block: "spruce_trapdoor" },
    { role: "window.glazing", block: "glass_pane" },
    { role: "opening.lintel", block: "spruce_log" },
  ],
  decoration: [{ item: "door-lantern", block: "lantern" }],
};
const PACK_PLAIN = { // rustic-like: plaster upper, NO limewash role
  palette: [
    { role: "wall.dressing", block: "stone_bricks" },
    { role: "wall.infill.upper", block: "white_terracotta" },
    { role: "window.shutter", block: "dark_oak_trapdoor" },
    { role: "window.infill", block: "spruce_fence" },
    { role: "door.main", block: "spruce_door" },
  ],
};

// --- synthetic programs (the role source) -------------------------------------------------------------
const mass = (over) => ({ masses: [{ storeyHeight: 4, walls: {}, openings: [], ...over }] });
const PROG_TWO = mass({ // cottage-like: stone ground / plaster upper, plinth, a door
  storeyHeight: 4,
  walls: { ground: { role: "wall.dressing" }, upper: { role: "wall.infill.upper" }, dressing: { role: "wall.dressing" } },
  plinth: { courses: 1, role: "wall.dressing" }, openings: [{ wall: "-x", kind: "door" }],
});
const PROG_BOARD = mass({ // saltcrag barn-with-board-upper: rubble ground / boarded upper, quoins
  storeyHeight: 3,
  walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.field.upper" }, dressing: { role: "wall.dressing.quoin" } },
  plinth: { courses: 1, role: "wall.dressing.quoin" }, openings: [{ wall: "+z", kind: "door" }],
});
const PROG_STONE = mass({ // uniform stone to the eave (barn--saltcrag as recognized), no plinth
  storeyHeight: 3,
  walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.field.ground" }, dressing: { role: "wall.dressing.quoin" } },
});

const brushes = (plan) => plan.map((p) => p.brush);
const find = (plan, b) => plan.find((p) => p.brush === b);

// --- fixture: a solid ring shell floor 0..eave, with a window + door hole on -z, + a roof cap above ----
function ringShell({ x0 = 0, x1 = 9, z0 = 0, z1 = 7, eave = 9, roof = true } = {}) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    for (let y = 0; y <= eave; y++) cells.push({ pos: [x, y, z], block: "minecraft:cobblestone" });
  }
  if (roof) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (let y = eave + 1; y <= eave + 3; y++) cells.push({ pos: [x, y, z], block: "minecraft:oak_planks" });
  }
  // carve a 1×2 window (x=5, y=5..6) and a 1×3 door (x=2, y=0..2) — THROUGH both -z and +z walls so the
  // solid-projection aperture detector reads them (a single-sided hole is occluded by the opposite wall;
  // the opening-dressing preview pierces its pavilion the same way).
  const isHole = (x, y, z) =>
    (z === z0 || z === z1) && ((x === 5 && y >= 5 && y <= 6) || (x === 2 && y >= 0 && y <= 2));
  return occupancyFromCells(cells.filter((c) => !isHole(...c.pos)));
}

const bandHist = (occ, eave) => {
  const h = new Map();
  for (const [k, b] of occ.cells) { const y = +k.split(",")[1]; if (y <= eave) h.set(b, (h.get(b) || 0) + 1); }
  return h;
};

// ===== WS1 — plan: two distinct materials ⇒ surface.fill with both dominants resolved ================
test("WS1 plan: differing ground/upper roles emit a per-storey surface.fill", () => {
  const plan = wallSkinPlan(PROG_TWO, PACK_PLAIN, { floor: 0, eaveY: 13 });
  const fill = find(plan, "surface.fill");
  assert.ok(fill, "expected a surface.fill entry");
  assert.equal(fill.params.zones.ground.dominant, "stone_bricks");
  assert.equal(fill.params.zones.upper.dominant, "white_terracotta");
});

// ===== WS2 — plan: identical ground/upper ⇒ NO surface.fill (no needless recolor) ====================
test("WS2 plan: uniform-material walls emit no surface.fill", () => {
  const plan = wallSkinPlan(PROG_STONE, PACK_RICH, { floor: 0, eaveY: 9 });
  assert.ok(!find(plan, "surface.fill"), "uniform stone must not emit a per-storey fill");
});

// ===== WS3 — plan: dressing role ⇒ quoin on all four faces ============================================
test("WS3 plan: a dressing role emits a four-face quoin in the dressing block", () => {
  const plan = wallSkinPlan(PROG_TWO, PACK_PLAIN, { floor: 0, eaveY: 13 });
  const q = find(plan, "quoin");
  assert.ok(q, "expected a quoin entry");
  assert.equal(q.params.material, "stone_bricks");
  assert.deepEqual([...q.params.faces].sort(), ["+x", "+z", "-x", "-z"].sort());
});

// ===== WS4 — plan: clinker fires only on a BOARDED upper =============================================
test("WS4 plan: clinker gated on board-family upper", () => {
  assert.ok(find(wallSkinPlan(PROG_BOARD, PACK_RICH, { floor: 0, eaveY: 9 }), "surface.clinker"),
    "boarded upper (dark_oak_planks) must emit clinker");
  assert.ok(!find(wallSkinPlan(PROG_STONE, PACK_RICH, { floor: 0, eaveY: 9 }), "surface.clinker"),
    "stone upper must not emit clinker");
  assert.equal(isBoardFamily("dark_oak_planks"), true);
  assert.equal(isBoardFamily("cobblestone"), false);
});

// ===== WS5 — plan: limewash fires only when the pack declares the finish role ========================
test("WS5 plan: limewash gated on a pack wall.finish.limewash role", () => {
  assert.ok(find(wallSkinPlan(PROG_BOARD, PACK_RICH, { floor: 0, eaveY: 9 }), "surface.limewash"),
    "rich pack (has limewash role) must emit limewash");
  assert.ok(!find(wallSkinPlan(PROG_TWO, PACK_PLAIN, { floor: 0, eaveY: 13 }), "surface.limewash"),
    "plain pack (no limewash role) must not emit limewash");
});

// ===== WS6 — plan: plinth ⇒ a base-row eave-overhang; no plinth ⇒ none ===============================
test("WS6 plan: a declared plinth emits a base-row proud course", () => {
  const eo = find(wallSkinPlan(PROG_TWO, PACK_PLAIN, { floor: 0, eaveY: 13 }), "eave-overhang");
  assert.ok(eo, "a plinth must emit an eave-overhang base course");
  assert.equal(eo.params.eaveRow, 0, "the plinth course sits at the floor row");
  assert.ok(!find(wallSkinPlan(PROG_STONE, PACK_RICH, { floor: 0, eaveY: 9 }), "eave-overhang"),
    "no plinth ⇒ no base course");
});

// ===== WS7 — treatments resolved from the pack's opening roles =======================================
test("WS7 packTreatments fills the slots its roles declare", () => {
  const { slots } = packTreatments(PACK_RICH);
  assert.equal(slots.door.block, "spruce_door");
  assert.equal(slots.shutter.block, "spruce_trapdoor");
  assert.equal(slots.infill.block, "glass_pane"); // window.glazing path
  assert.equal(slots.frame.block, "spruce_log");  // opening.lintel
  assert.equal(slots.light.block, "lantern");     // decoration fallback
  const plain = packTreatments(PACK_PLAIN).slots;
  assert.equal(plain.infill.block, "spruce_fence"); // window.infill path
  assert.ok(!plain.frame, "no opening.lintel role ⇒ frame slot left to the census fallback");
});

// ===== WS8 — no program OR no pack ⇒ the envelope is returned unchanged (gatehouse) ===================
test("WS8 wallSkin is a no-op without a program or a pack", () => {
  const occ = ringShell();
  assert.equal(wallSkin(occ, { program: null, pack: PACK_RICH, floor: 0, eaveY: 9 }), occ);
  assert.equal(wallSkin(occ, { program: PROG_BOARD, pack: null, floor: 0, eaveY: 9 }), occ);
});

// ===== WS9 — determinism (full skin) + idempotence (relief skin, the construction claim) =============
test("WS9 wallSkin is deterministic; the relief skin is idempotent on the band palette", () => {
  const opts = { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9, ...DRESS };
  const a = wallSkin(ringShell(), opts);
  const b = wallSkin(ringShell(), opts);
  assert.deepEqual([...a.cells].sort(), [...b.cells].sort(), "two full-skin runs must be byte-identical");
  // idempotence is asserted on the RELIEF skin (per-storey material / quoins / clinker / limewash / plinth);
  // dressOpenings legitimately differs under re-run (a re-dressed jamb changes a lantern's free cell), so
  // the construction-skin idempotence claim excludes the joinery overlay.
  const relief = { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9 };
  const r1 = wallSkin(ringShell(), relief);
  const r2 = wallSkin(r1, relief);
  assert.deepEqual([...bandHist(r2, 9).keys()].sort(), [...bandHist(r1, 9).keys()].sort(),
    "re-applying the relief skin must not introduce new band materials");
});

// ===== WS10 — the roof (y > eaveY) is never touched ==================================================
test("WS10 wallSkin leaves every cell above the eave untouched", () => {
  const occ = ringShell({ eave: 9 });
  const before = new Map([...occ.cells].filter(([k]) => +k.split(",")[1] > 9));
  const out = wallSkin(occ, { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9, ...DRESS });
  const after = new Map([...out.cells].filter(([k]) => +k.split(",")[1] > 9));
  assert.deepEqual([...after].sort(), [...before].sort(), "roof cells must be identical before/after");
});

// ===== WS11 — the skin is construction, not a flood: ≥2 band materials, none over 80% ================
test("WS11 wallSkin yields a multi-material band with no single-block flood", () => {
  const out = wallSkin(ringShell(), { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9, ...DRESS });
  const h = bandHist(out, 9);
  const total = [...h.values()].reduce((a, b) => a + b, 0);
  const max = Math.max(...h.values());
  assert.ok(h.size >= 2, `expected ≥2 band materials, got ${h.size}`);
  assert.ok(max / total < 0.8, `no single block may exceed 80% of the band (got ${(max / total).toFixed(2)})`);
});

// ===== WS12 — the injected dressing seam adds joinery (door/glazing) to the carved holes =============
test("WS12 wallSkin dresses the carved openings when the seam is injected", () => {
  const occ = ringShell();
  const bare = wallSkin(occ, { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9 });           // relief only
  const dressed = wallSkin(occ, { program: PROG_BOARD, pack: PACK_RICH, floor: 0, eaveY: 9, ...DRESS }); // + dressing
  const blocks = (o) => new Set([...o.cells.values()].map((b) => b.replace(/^minecraft:/, "")));
  assert.ok(dressed.cells.size >= bare.cells.size, "dressing only adds/replaces, never shrinks");
  // a joinery block from the pack's opening roles appears only once the seam is injected
  const joinery = ["spruce_door", "glass_pane", "spruce_trapdoor"];
  assert.ok(joinery.some((b) => blocks(dressed).has(b) && !blocks(bare).has(b)),
    "expected door/glazing/shutter joinery from the injected dressing seam");
});
