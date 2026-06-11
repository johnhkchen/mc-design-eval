// Idiom recognition (T-129-01, story S-129, epic E-32) — the T-125-01 seam as a typed BAML
// function. The template is a BYTE-IDENTICAL transplant of the retired buildRecognitionPrompt
// (src/recognition/prompt.mjs): the digests and the JSON Schema arrive pre-serialized (the
// .mjs serializers packDigest/sketchDigest/loadProgramSchema remain the data authority), the
// prose skeleton lives HERE. The fixture test pins the rendered sha256 against the committed
// recognition records' promptSha256 (cottage, barn) — drift fails the suite.
//
// E-32 Rule 2 transport: ClaudeStub is render-only; the bridge (src/baml/bridge.mts) extracts
// the rendered request and the runner transports via the claude -p subscription shim. The live
// reply gate stays parseProgramReply (AJV + pack vocabulary) — these classes are the typed
// mirror for b.parse fixture tests, not the live gate.

class ProgramReading {
  summary string
  symmetryClaim ProgramSymmetryClaim?
}

class ProgramSymmetryClaim {
  axis "x" | "z"
}

class ProgramRect {
  x0 int
  z0 int
  w int
  d int
}

class ProgramRoleRef {
  role string
}

class ProgramWalls {
  treatment string?
  ground ProgramRoleRef
  upper ProgramRoleRef
  dressing ProgramRoleRef?
}

class ProgramPlinth {
  courses int
  role string
}

class ProgramJetty {
  walls string[] @description("subset of +x|-x|+z|-z, unique")
  beamRole string
  joistRole string?
}

class ProgramDormers {
  count int
  wall string? @description("+x|-x|+z|-z, perpendicular to ridgeAxis")
}

class ProgramRoof {
  idiom string
  ridgeAxis ("x" | "z")?
  pitchClass float
  fieldRole string
  trimRole string?
  gableRole string?
  dormers ProgramDormers?
}

class ProgramChimney {
  role string
  capRole string
  atEnd "lo" | "hi" | "center"
}

class ProgramOpening {
  wall "+x" | "-x" | "+z" | "-z"
  kind "door" | "window" | "wagon-door"
  count int
  w int
  h int
  sill int
  head ("arch" | "flat")?
  headRole string?
}

class ProgramMass {
  id string
  rect ProgramRect
  storeys int
  storeyHeight int
  walls ProgramWalls
  plinth ProgramPlinth?
  jetty ProgramJetty?
  roof ProgramRoof
  chimney ProgramChimney?
  openings ProgramOpening[]
}

class BuildingProgram {
  schema "building-program/v1"
  subject string
  pack string
  reading ProgramReading
  masses ProgramMass[]
}

function RecognizeBuildingProgram(
  pack_digest: string,
  sketch_digest: string,
  schema_json: string,
  concept: image,
  sketch_sheet: image
) -> BuildingProgram {
  client ClaudeStub
  prompt #"
    # Read the building, write the program

    You are the recognition stage of a Minecraft pattern-book builder. Two images follow:
    1. the CONCEPT ART — authoritative for what the building IS: its idioms, materials, rhythm;
    2. the CONDITIONED FORM SKETCH — orthographic plan + elevations of a rough 3-D read (gray =
       occupancy, black = raw mesh outline, red = footprint, blue = mirror axis, green/purple =
       eave/ridge). It informs sizes and massing; it is EVIDENCE, never a target to copy —
       recognize the canonical form ("that lumpy thing is a gable roof") and substitute it cleanly.

    Author the BUILDING PROGRAM: decompose the building into 1–4 rectangular masses (plan
    coordinates of your choice — anchor near the origin; masses must touch), and for each give
    storeys, wall bands, plinth/jetty where seen, the roof idiom with pitch class and dormers,
    chimney, and the openings per wall (count/size/sill/head). Use the sketch's measured digest
    for sizes; round to clean, regular numbers — regularity beats mesh fidelity, always.

    Layout rules the realizer enforces (a violation rejects the whole reply):
    - you give counts and sizes; the realizer SPACES openings evenly — never coordinates. All
      openings of one wall must fit its width minus corners at the minimum spacing;
    - an opening's sill + height (+ head clearance: arch ≈ half its width, flat lintel 1 row)
      must stay under the wall top (storeys × storeyHeight);
    - dormers sit on the EAVE-side slopes — their `wall` must be perpendicular to ridgeAxis;
    - jetty needs storeys ≥ 2; every role you name must be a pack role verbatim.

    {{ pack_digest }}

    ## The sketch's measured digest

    {{ sketch_digest }}

    ## Output format — STRICT

    Output a SINGLE JSON object conforming to the JSON Schema below, and NOTHING ELSE — your
    first character must be `{` and your last `}`. No prose, no code fences, no commentary.
    Put your recognition reasoning in `reading.summary`.

    JSON Schema:
    {{ schema_json }}

    Now output ONLY the JSON object, beginning with `{`.
    {{ concept }}
    {{ sketch_sheet }}
  "#
}
