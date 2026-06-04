// The single, consolidated benchmark: a TEMPLE FACADE, photographed head-on.
//
// Bounded scope (one face) → the model pours detail in, it generates in one short call
// (no multi-phase iteration), and a fixed frontal camera makes runs directly comparable.
// Style and palette are deliberately OPEN: prior runs collapsed into bare white quartz
// when a classical style was insisted on, so the task now invites an invented style and
// bold color. Held constant across runs (the approach varies and labels each run).

export const TEMPLE_FACADE_TASK = Object.freeze({
  id: "temple-facade",
  version: 1,
  seed: 11,
  serverStateId: "flat-creative-superflat.v1",
  goal:
    "The full-quality FACADE (front elevation) of a TEMPLE — the one grand face you would " +
    "photograph head-on. Interpret 'temple' with imagination and personality (any culture, " +
    "era, or invented tradition) and commit to a distinctive, COLORFUL look — not a monochrome " +
    "wall. Pack it with architectural detail and strong proportion. Not a full building: model " +
    "only the front and its relief depth.",
  // Frontal render view (forwarded to renderArtifact): head-on from +Z, narrow fov to
  // keep perspective flat.
  view: { azimuthDeg: 0, elevationDeg: 0, fov: 40 },
});
