// Procedural generator for Trial 009-vRef-designdoc — "Temple of the Triumphal Dawn".
// Builds a triumphal-arch facade (one cubic mass pierced by one great central arch)
// faithful to the finalized design doc + the Arc de Triomphe reference. Generates to the
// LIVE schema (state omitted when absent; required metadata present), validates with
// compileValidator(), then renders head-on. Run: node _gen.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileValidator, formatErrors } from "../../../../src/artifact.mjs";
import { renderArtifact } from "../../../../render/src/render-tool.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- palette (renderable ids; cream quartz dominant, ochre sandstone, azure, gold) ----
const B = {
  cream:   "minecraft:quartz_block",       // dominant pale cream stone (sunlit limestone)
  creamS:  "minecraft:smooth_quartz",      // smooth cream for relief figures / trim faces
  ochre:   "minecraft:smooth_sandstone",   // honey-ochre piers shadow tone & relief ground
  ochreR:  "minecraft:cut_sandstone",      // ochre dentil / banding variant
  azure:   "minecraft:light_blue_terracotta", // complementary sky-azure roundels
  gold:    "minecraft:gold_block",         // crowning sun-device only (sparing)
  qStair:  "minecraft:smooth_quartz_stairs",
  qSlab:   "minecraft:smooth_quartz_slab",
  sStair:  "minecraft:smooth_sandstone_stairs",
};

const P = []; // placements
const fill = (x0,y0,z0,x1,y1,z1,block,state) => {
  const p = { op:"fill",
    from:[Math.min(x0,x1),Math.min(y0,y1),Math.min(z0,z1)],
    to:[Math.max(x0,x1),Math.max(y0,y1),Math.max(z0,z1)], block };
  if (state) p.state = state;
  P.push(p);
};
const vox = (x,y,z,block,state) => { const p={op:"voxel",pos:[x,y,z],block}; if(state)p.state=state; P.push(p); };

// ---- geometry ----------------------------------------------------------------
// Facade faces +Z. Front (proudest) at z=0; relief recedes into -Z.
const XC = 27;          // center axis
const MX0 = 2, MX1 = 52; // monument outer extent (width 50)
// piers
const PLx0 = 2,  PLx1 = 15;   // left pier
const PRx0 = 39, PRx1 = 52;   // right pier
const OPx0 = 16, OPx1 = 38;   // central opening between piers (width 23)
// vertical bands
const BASE_Y0 = 0, BASE_Y1 = 3;
const BODY_Y0 = 4, BODY_Y1 = 31;
const SPRING_Y = 18;          // arch springline (mid-height)
const ARCH_R = 11;            // arch radius (opening half-width)
const ARCH_TOP = SPRING_Y + ARCH_R; // = 29
const DENTIL_Y = 31;
const CORN_Y0 = 32, CORN_Y1 = 34;
const ATTIC_Y0 = 35, ATTIC_Y1 = 44;
const TOP_Y0 = 45, TOP_Y1 = 46;
// depths (front 0, deeper = more negative)
const Z_PROUD = 0;            // piers, base, cornice, gold device — proudest
const Z_BODY_BACK = -12;
const Z_SPAND = -3;           // central recessed bay (spandrel/wall above arch)
const Z_ARCHBACK = -14;       // deep passage back wall (portal reads dark, ~11 deep)
const Z_ATTIC = -1;

// ---- 1. plinth (two stepped courses, full footprint, proud) ------------------
fill(MX0, BASE_Y0, Z_PROUD, MX1, BASE_Y0+1, Z_ARCHBACK, B.ochre);      // lower step
fill(MX0+1, BASE_Y0+2, -1, MX1-1, BASE_Y1, Z_ARCHBACK, B.ochre);       // upper step (inset)
// stair nosing along the proud front edge of the lower step (reads as a tread)
for (let x = MX0; x <= MX1; x++) vox(x, BASE_Y1, Z_PROUD, B.sStair, {facing:"south",half:"bottom"});

// ---- 2+3. piers, each carved with a deep recessed relief niche -------------
// Built by EXCLUSION (no air op): a solid back slab, then front material only
// OUTSIDE the niche window, so the window interior is a genuine recess.
function buildPier(px0, px1, nx0, nx1) {
  const py0 = BODY_Y0, py1 = BODY_Y1;
  const ny0 = 9, ny1 = 23;          // niche window
  const zCav = -6;                  // niche ground depth (recess ~6 deep)
  // solid cream back slab behind everything
  fill(px0, py0, zCav-1, px1, py1, Z_BODY_BACK, B.cream);
  // front material (z=0..zCav) everywhere EXCEPT the niche window
  fill(px0, py0, zCav, nx0-1, py1, Z_PROUD, B.cream);            // left strip
  fill(nx1+1, py0, zCav, px1, py1, Z_PROUD, B.cream);            // right strip
  fill(nx0, py0, zCav, nx1, ny0-1, Z_PROUD, B.cream);            // below window
  fill(nx0, ny1+1, zCav, nx1, py1, Z_PROUD, B.cream);            // above window
  // ochre niche ground (warm shadowed relief ground) at the back of the recess
  fill(nx0, ny0, zCav, nx1, ny1, zCav, B.ochre);
  // high-relief cream figure standing proud of the ground (robed honoree)
  const fx = (nx0+nx1) >> 1, zFig = zCav + 2;
  fill(fx-1, ny0+1, zFig, fx+1, ny0+9, zFig, B.creamS);          // body
  fill(fx-2, ny0+3, zFig, fx+2, ny0+6, zFig, B.creamS);          // outstretched arms
  vox(fx, ny0+10, zFig, B.creamS); vox(fx, ny0+11, zFig, B.creamS); // head/crest
  // ochre quoin chain up the OUTER edge of the pier (definition against the sky)
  const ox = (px0 < XC) ? px0 : px1;
  for (let y = py0; y <= py1; y += 2) { vox(ox, y, Z_PROUD, B.ochreR); vox(ox, y+1, Z_PROUD, B.cream); }
}
buildPier(PLx0, PLx1, 6, 12);
buildPier(PRx0, PRx1, 42, 48);   // mirror of 6..12 about x=27

// ---- 4. central bay: recessed spandrel wall with the arch void carved out ----
// Above the springline, fill the parts of the opening OUTSIDE the arch circle.
for (let y = SPRING_Y; y <= BODY_Y1; y++) {
  const dy = y - SPRING_Y;
  if (dy <= ARCH_R) {
    const hw = Math.floor(Math.sqrt(ARCH_R*ARCH_R - dy*dy));
    const lInner = XC - hw, rInner = XC + hw;
    if (lInner - 1 >= OPx0) fill(OPx0, y, Z_SPAND, lInner-1, y, Z_BODY_BACK, B.cream);
    if (rInner + 1 <= OPx1) fill(rInner+1, y, Z_SPAND, OPx1, y, Z_BODY_BACK, B.cream);
  } else {
    fill(OPx0, y, Z_SPAND, OPx1, y, Z_BODY_BACK, B.cream); // solid band above arch crown
  }
}
// is (x,y) inside the arch opening silhouette? (rect below spring ∪ semicircle above)
const inOpening = (x,y) => x>=OPx0 && x<=OPx1 && y>=BODY_Y0 &&
  (y < SPRING_Y ? true : (x-XC)**2 + (y-SPRING_Y)**2 <= ARCH_R*ARCH_R);
// deep passage back wall (ochre, in shadow) behind the whole opening
fill(OPx0, BODY_Y0, Z_ARCHBACK, OPx1, ARCH_TOP, Z_ARCHBACK, B.ochre);
// coffered grid one block proud of the back wall — checker of cut/smooth sandstone
for (let y = BODY_Y0; y <= ARCH_TOP; y++)
  for (let x = OPx0; x <= OPx1; x++)
    if (inOpening(x,y)) vox(x, y, Z_ARCHBACK+1, ((x>>1)+(y>>1))%2 ? B.ochreR : B.ochre);
// stepped inner reveal rings — three concentric arch frames receding into shadow
for (let s = 0; s < 3; s++) {
  const z = Z_SPAND - 1 - s*4, rr = ARCH_R - s;
  for (let deg = 0; deg <= 180; deg += 2) {
    const x = Math.round(XC + rr*Math.cos(deg*Math.PI/180));
    const y = Math.round(SPRING_Y + rr*Math.sin(deg*Math.PI/180));
    if (y >= SPRING_Y) vox(x, y, z, B.cream);
  }
  // jambs (vertical reveals) down to the springline at the same depth
  fill(XC-rr, BODY_Y0, z, XC-rr, SPRING_Y, z, B.cream);
  fill(XC+rr, BODY_Y0, z, XC+rr, SPRING_Y, z, B.cream);
}
// passage side reveals (inner pier faces deepened so the portal reads as a tunnel)
fill(OPx0, BODY_Y0, Z_SPAND, OPx0, ARCH_TOP, Z_ARCHBACK, B.cream);
fill(OPx1, BODY_Y0, Z_SPAND, OPx1, ARCH_TOP, Z_ARCHBACK, B.cream);

// ---- 5. archivolt: raised ochre moulding ring following the arch curve -------
for (let deg = 0; deg <= 180; deg += 2) {
  const rad = deg * Math.PI / 180;
  for (const rr of [ARCH_R+1, ARCH_R+2]) {
    const x = Math.round(XC + rr * Math.cos(rad));
    const y = Math.round(SPRING_Y + rr * Math.sin(rad));
    if (y >= SPRING_Y && x >= OPx0-2 && x <= OPx1+2) vox(x, y, Z_SPAND+1, B.ochreR);
  }
}
// impost cornice (springers) — ochre band at the springline on each pier inner edge
fill(OPx0-3, SPRING_Y-1, Z_PROUD, OPx0, SPRING_Y, Z_PROUD, B.ochreR);
fill(OPx1, SPRING_Y-1, Z_PROUD, OPx1+3, SPRING_Y, Z_PROUD, B.ochreR);

// ---- 6. spandrel relief discs (above the arch haunches) ----------------------
function disc(cx, cy, r, z, block) {
  for (let y=cy-r; y<=cy+r; y++) for (let x=cx-r; x<=cx+r; x++)
    if ((x-cx)**2 + (y-cy)**2 <= r*r) vox(x,y,z,block);
}
disc(OPx0+3, ARCH_TOP-1, 2, Z_SPAND+1, B.creamS);
disc(OPx1-3, ARCH_TOP-1, 2, Z_SPAND+1, B.creamS);

// ---- 7. dentil course under the cornice (alternating cream / ochre teeth) ----
for (let x = MX0; x <= MX1; x++) vox(x, DENTIL_Y, Z_PROUD, (x % 2 === XC % 2) ? B.cream : B.ochreR);

// ---- 8. projecting dentil cornice (overhangs, proudest band) -----------------
fill(MX0-1, CORN_Y0, Z_PROUD, MX1+1, CORN_Y1, Z_BODY_BACK, B.cream);
// cornice underside stair moulding (inverted stairs, overhang shadow line)
for (let x = MX0-1; x <= MX1+1; x++) vox(x, CORN_Y0-0, Z_PROUD, B.qStair, {facing:"south",half:"top"});
// ochre fascia band along the cornice face
fill(MX0-1, CORN_Y1, Z_PROUD, MX1+1, CORN_Y1, Z_PROUD, B.ochreR);

// ---- 9. attic band (flat crown, full width, real height) ---------------------
fill(MX0, ATTIC_Y0, Z_ATTIC, MX1, ATTIC_Y1, Z_BODY_BACK, B.cream);
// ochre base + cap mouldings framing the attic band
fill(MX0, ATTIC_Y0, Z_PROUD, MX1, ATTIC_Y0, Z_PROUD, B.ochreR);
// four azure roundels along the crown — azure disc flush in the attic face,
// inside a cream frame ring that stands proud (so each roundel reads as sunken).
const ATTIC_MID = (ATTIC_Y0+ATTIC_Y1)>>1;
const roundelXs = [XC-18, XC-7, XC+7, XC+18]; // 9, 20, 34, 45 — symmetric about 27
for (const cx of roundelXs) {
  disc(cx, ATTIC_MID, 3, Z_ATTIC, B.azure);                    // azure field, flush
  for (let deg=0; deg<360; deg+=8){                            // proud cream frame ring
    const x=Math.round(cx+3.7*Math.cos(deg*Math.PI/180));
    const y=Math.round(ATTIC_MID+3.7*Math.sin(deg*Math.PI/180));
    vox(x,y,Z_PROUD,B.creamS);
  }
}

// ---- 10. top parapet course (proud cap — culmination) ------------------------
fill(MX0-1, TOP_Y0, Z_PROUD, MX1+1, TOP_Y1, Z_BODY_BACK, B.creamS);
fill(MX0-1, TOP_Y0, Z_PROUD, MX1+1, TOP_Y0, Z_PROUD, B.ochreR); // shadow line under cap

// ---- 11. centered gold sun-device (the Solari seal, sparing, proud) ----------
const SUNY = (ATTIC_Y0+ATTIC_Y1)>>1;
disc(XC, SUNY, 2, Z_PROUD, B.gold);                 // gilded sun disc, catches first light
for (let deg=0; deg<360; deg+=45){                  // eight short rays
  const x=Math.round(XC+3*Math.cos(deg*Math.PI/180));
  const y=Math.round(SUNY+3*Math.sin(deg*Math.PI/180));
  vox(x,y,Z_PROUD,B.gold);
}

// ---- assemble artifact -------------------------------------------------------
const manifest = [...new Set(P.map(p=>p.block))];
const artifact = {
  schema_version: "1.0.0",
  metadata: {
    trial_id: "009-vRef-designdoc",
    prompting_method_id: "temple-facade-reference-designdoc.v0",
    model_id: "claude-opus-4-8",
    seed: 11,
    server_state_id: "flat-creative-superflat.v1",
  },
  style: {
    name: "Neoclassical triumphal arch",
    rationale: "One cubic mass pierced by one great central arch — broad cream-quartz piers, framed relief niches, dentil cornice, and a full-width azure-roundel attic crowned by a gilded Solari sun, per the design doc.",
  },
  palette: { palette_id: "neoclassical", manifest },
  placements: P,
};

// ---- validate against the LIVE gate -----------------------------------------
const validate = compileValidator();
if (!validate(artifact)) {
  console.error("SCHEMA INVALID:\n" + formatErrors(validate.errors));
  process.exit(1);
}
console.log(`schema OK — ${P.length} placements, ${manifest.length} block types`);

writeFileSync(join(HERE, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

// ---- render head-on ----------------------------------------------------------
const report = await renderArtifact(artifact, {
  outPath: join(HERE, "render.png"),
  view: { azimuthDeg: 0, elevationDeg: 0, fov: 40 },
});
console.log("rendered:", report.path);
console.log("placed:", report.placed, "unmapped:", JSON.stringify(report.unmapped));
console.log("bounds:", JSON.stringify(report.bounds));
