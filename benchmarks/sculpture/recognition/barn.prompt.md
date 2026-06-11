# Recognition prompt — barn (T-125-01)

sha256 `b641cfafc72cefd29db155db44158394da677c25de2085e5baa27ab53ebb80ae`; schema: `schema/building-program.schema.json`.

----

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

Style pack: **rustic** — An English yeoman farmstead family (Tudor/farmstead vernacular) on pastured lowland with a small stone quarry, managed oak coppice, and a sawpit — the cottage and the tithe barn are both buildings of this one place, so they draw on the same materials.

Palette ROLES (your program names roles, NEVER block ids; the realizer resolves them):
- `wall.field.ground` → cobblestone: Ground-storey wall fields are the cheap material: uncoursed rubble fieldstone (the barn's recessed panels; the vernacular default a concept may override with dressed stone, as the cottage's ashlar ground storey does).
- `wall.dressing` → stone_bricks: Quoins, buttress piers, plinth courses, jambs and heads are dressed quarry stone — crisp coursed blocks spent only where structure or weather demands them (the cottage/barn near-tone grey pair, kept distinct from the rubble field).
- `frame.timber` → dark_oak_log: The half-timber frame — corner posts, studs, eaves beams — is heavy coppice oak with visible round grain; near-black against the cream panels it carries.
- `wall.infill.upper` → white_terracotta: Upper-storey panels between the frame timbers are lime plaster over wattle — warm matte cream, never pure white, never used at ground level (rain-splash).
- `roof.field` → spruce_planks: Roof slopes are sawpit plank courses — warm medium brown, flatter grain and clearly lighter than the frame oak (the cottage roof field; a concept may darken the whole roof toward the oak, as the barn does).
- `roof.trim` → dark_oak_planks: Eaves, verge and rake fascia are boarded in the darker oak — the deep edge banding both concepts show over the lighter roof field (and the barn's whole-roof dominant).
- `roof.course` → spruce_stairs: The stepped roof course realization of the sawn-plank field — the stair member of the roof family the generators emit.
- `roof.step` → spruce_slab: The half-step member of the roof family — shallow-pitch landings and ridge half-caps.
- `chimney.cap` → bricks: Chimney caps are the one brick element — fire-safe kiln brick crowning the cool fieldstone shaft, warm-on-cool (the cottage's red cap).
- `door.main` → spruce_door: Door leaves are sawn boards — warm panelled timber set in stone reveals.
- `door.wagon` → oak_planks: Barn wagon-door leaves are bright golden sawn boarding — the lighter, warmer timber kept distinct from the dark roof above (the barn's opening fill).
- `window.shutter` → dark_oak_trapdoor: Shutters and slatted window fills are coppice-oak lattice — the gridded reveal both storeys of the cottage show.
- `window.infill` → spruce_fence: Open lattice fills for unglazed lights — thin sawn members reading as leaded/lattice grid.

Roof idioms available: roof.gable, roof.hip, roof.pyramid (ridge-bearing roofs need ridgeAxis).
Wall-surface treatments (recorded for the workshop's dressing passes): timber-frame, opening-dressing, hollow, floorplan.
Proportions: storey height 3–4 blocks; pitch classes [1] (rise per run — your pitchClass MUST be one of these); opening spacing 2–5 cells edge-to-edge.

Material precedence: concept-evidence > pack-assignment > vernacular-default — what you SEE in the concept picks the role (e.g. a dressed-stone ground storey where the style's default is rubble), but every choice stays a pack role.

## The sketch's measured digest

subject: barn
plan: 48×26 cells (sample scale 48; working block scale 48 — sizes below are already in BLOCKS where named so)
footprint polygon (plan cells): [[0,0],[48,0],[48,24],[0,24]] (clean rectangle)
roof pitch read: pitched45 (dominant tilt 45°), ridge axis x
eave ≈ 10 blocks, total height ≈ 21 blocks (eave fraction 0.4762)
plausible storey counts: 2 storeys (~5 blocks each), 3 storeys (~3.3 blocks each)
mirror symmetry: axis z, score 0.5518 (threshold 0.8) — below threshold
bodies: 1 (primary, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion)

## Output format — STRICT

Output a SINGLE JSON object conforming to the JSON Schema below, and NOTHING ELSE — your
first character must be `{` and your last `}`. No prose, no code fences, no commentary.
Put your recognition reasoning in `reading.summary`.

JSON Schema:
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mc-design-eval.local/schema/building-program.schema.json",
  "title": "building-program/v1 — the model-AUTHORED recognition program: idiom instances with parameters, in pack vocabulary (T-125-01, E-31). Material slots name pack palette ROLES (never raw blocks); the compiler resolves roles and geometry deterministically.",
  "type": "object",
  "required": [
    "schema",
    "subject",
    "pack",
    "reading",
    "masses"
  ],
  "additionalProperties": false,
  "$defs": {
    "role": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9.-]*$"
    },
    "wall": {
      "enum": [
        "+x",
        "-x",
        "+z",
        "-z"
      ]
    },
    "posInt": {
      "type": "integer",
      "minimum": 1
    }
  },
  "properties": {
    "schema": {
      "const": "building-program/v1"
    },
    "subject": {
      "type": "string",
      "minLength": 1
    },
    "pack": {
      "description": "Style-pack slug the program speaks the vocabulary of",
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$"
    },
    "reading": {
      "description": "The model's recognition evidence — recorded, never realized",
      "type": "object",
      "required": [
        "summary"
      ],
      "additionalProperties": false,
      "properties": {
        "summary": {
          "type": "string",
          "minLength": 1
        },
        "symmetryClaim": {
          "description": "A claimed mirror axis (recorded; v1 never declares it to the conformance gate)",
          "type": [
            "object",
            "null"
          ],
          "required": [
            "axis"
          ],
          "additionalProperties": false,
          "properties": {
            "axis": {
              "enum": [
                "x",
                "z"
              ]
            }
          }
        }
      }
    },
    "masses": {
      "description": "Rectangular masses in plan coordinates — the model's decomposition of the building",
      "type": "array",
      "minItems": 1,
      "maxItems": 4,
      "items": {
        "type": "object",
        "required": [
          "id",
          "rect",
          "storeys",
          "storeyHeight",
          "walls",
          "roof",
          "openings"
        ],
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-z][a-z0-9-]*$"
          },
          "rect": {
            "description": "Plan rectangle: origin cell + size in cells (w along x, d along z)",
            "type": "object",
            "required": [
              "x0",
              "z0",
              "w",
              "d"
            ],
            "additionalProperties": false,
            "properties": {
              "x0": {
                "type": "integer",
                "minimum": -64,
                "maximum": 64
              },
              "z0": {
                "type": "integer",
                "minimum": -64,
                "maximum": 64
              },
              "w": {
                "type": "integer",
                "minimum": 3,
                "maximum": 64
              },
              "d": {
                "type": "integer",
                "minimum": 3,
                "maximum": 64
              }
            }
          },
          "storeys": {
            "type": "integer",
            "minimum": 1,
            "maximum": 4
          },
          "storeyHeight": {
            "description": "Blocks per storey — pack-validated against proportions.storeyHeight",
            "type": "integer",
            "minimum": 2,
            "maximum": 6
          },
          "walls": {
            "type": "object",
            "required": [
              "ground",
              "upper"
            ],
            "additionalProperties": false,
            "properties": {
              "treatment": {
                "description": "A pack PASS idiom (e.g. surface framing) — RECORDED on this schema; realization is the workshop's (S-126)",
                "type": [
                  "string",
                  "null"
                ],
                "pattern": "^[a-z][a-z0-9.-]*$"
              },
              "ground": {
                "type": "object",
                "required": [
                  "role"
                ],
                "additionalProperties": false,
                "properties": {
                  "role": {
                    "$ref": "#/$defs/role"
                  }
                }
              },
              "upper": {
                "type": "object",
                "required": [
                  "role"
                ],
                "additionalProperties": false,
                "properties": {
                  "role": {
                    "$ref": "#/$defs/role"
                  }
                }
              },
              "dressing": {
                "description": "Quoins/jambs/heads role — feeds opening heads",
                "type": [
                  "object",
                  "null"
                ],
                "required": [
                  "role"
                ],
                "additionalProperties": false,
                "properties": {
                  "role": {
                    "$ref": "#/$defs/role"
                  }
                }
              }
            }
          },
          "plinth": {
            "type": [
              "object",
              "null"
            ],
            "required": [
              "courses",
              "role"
            ],
            "additionalProperties": false,
            "properties": {
              "courses": {
                "type": "integer",
                "minimum": 1,
                "maximum": 3
              },
              "role": {
                "$ref": "#/$defs/role"
              }
            }
          },
          "jetty": {
            "description": "Jettied upper-storey lip on the named walls (needs storeys ≥ 2 — pack-validated)",
            "type": [
              "object",
              "null"
            ],
            "required": [
              "walls",
              "beamRole"
            ],
            "additionalProperties": false,
            "properties": {
              "walls": {
                "type": "array",
                "minItems": 1,
                "maxItems": 4,
                "items": {
                  "$ref": "#/$defs/wall"
                },
                "uniqueItems": true
              },
              "beamRole": {
                "$ref": "#/$defs/role"
              },
              "joistRole": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/role"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            }
          },
          "roof": {
            "type": "object",
            "required": [
              "idiom",
              "pitchClass",
              "fieldRole"
            ],
            "additionalProperties": false,
            "properties": {
              "idiom": {
                "type": "string",
                "pattern": "^[a-z][a-z0-9.-]*$"
              },
              "ridgeAxis": {
                "description": "Required for ridge-bearing idioms; ignored by point-apex idioms",
                "enum": [
                  "x",
                  "z"
                ]
              },
              "pitchClass": {
                "type": "number",
                "exclusiveMinimum": 0
              },
              "fieldRole": {
                "$ref": "#/$defs/role"
              },
              "trimRole": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/role"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "gableRole": {
                "description": "Gable-end infill material (defaults to the upper wall role)",
                "anyOf": [
                  {
                    "$ref": "#/$defs/role"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "dormers": {
                "type": [
                  "object",
                  "null"
                ],
                "required": [
                  "count"
                ],
                "additionalProperties": false,
                "properties": {
                  "count": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 4
                  },
                  "wall": {
                    "$ref": "#/$defs/wall"
                  }
                }
              }
            }
          },
          "chimney": {
            "type": [
              "object",
              "null"
            ],
            "required": [
              "role",
              "capRole",
              "atEnd"
            ],
            "additionalProperties": false,
            "properties": {
              "role": {
                "$ref": "#/$defs/role"
              },
              "capRole": {
                "$ref": "#/$defs/role"
              },
              "atEnd": {
                "enum": [
                  "lo",
                  "hi",
                  "center"
                ]
              }
            }
          },
          "openings": {
            "type": "array",
            "maxItems": 12,
            "items": {
              "type": "object",
              "required": [
                "wall",
                "kind",
                "count",
                "w",
                "h",
                "sill"
              ],
              "additionalProperties": false,
              "properties": {
                "wall": {
                  "$ref": "#/$defs/wall"
                },
                "kind": {
                  "enum": [
                    "door",
                    "window",
                    "wagon-door"
                  ]
                },
                "count": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 6
                },
                "w": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 8
                },
                "h": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 8
                },
                "sill": {
                  "description": "Y of the opening's bottom row, relative to the mass base (doors: 0)",
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 16
                },
                "head": {
                  "enum": [
                    "arch",
                    "flat",
                    null
                  ]
                },
                "headRole": {
                  "anyOf": [
                    {
                      "$ref": "#/$defs/role"
                    },
                    {
                      "type": "null"
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  }
}

Now output ONLY the JSON object, beginning with `{`.
