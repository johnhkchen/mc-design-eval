# Recognition prompt — barn--saltcrag (T-132-01)

sha256 `c354a3f407807e111099a9ae584c4c8b06ba00770aaf122db9c2c6527e441bd2`; schema: `schema/building-program.schema.json`.

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

Style pack: **saltcrag** — A storm-grey fishing village wedged between granite headland and a cold northern sea, built of beach stone and tarred boat-timber.

Palette ROLES (your program names roles, NEVER block ids; the realizer resolves them):
- `wall.field.ground` → cobblestone: The ground storey is what the headland gives for free — granite boulders and fieldstone cleared from the thin soil and hauled off the strand, laid up rough and bedded in shell-burned lime. Undressed grey rubble is the structural truth of every working cottage; at L53 it holds the storm-grey of the place without pretending to be worked.
- `wall.finish.limewash` → white_terracotta: The cottage's one indulgence: a coat of lime burned from shell-sand in the coastal kilns, brushed over the rubble to seal the wind out and whiten the seaward face. It is an accent of thrift, not a clad finish — a sealing skin spared for where weather drives hardest, so it preserves over the grey field rather than replacing it.
- `wall.infill.cobble` → mossy_cobblestone: Rounded beach cobble and shingle off the tideline pack the footings and the rough infill — sea-worn, weed-stained in its joints from the cold wet coast. It reads damper and more organic than the cleared fieldstone (L49), the strand's stone as opposed to the headland's.
- `wall.field.upper` → dark_oak_planks: The loft and gable are boarded, not built — softwood deals and boatyard offcuts lapped clinker-fashion and soaked in barrelled tar, the same craft that seals a hull. Timber here comes as thin boards, so it is spent on the light upper storey; the tar drives it black (L20), the truest dark of the village.
- `wall.dressing.quoin` → stone_bricks: Squared dressed stone is dear — it appears only where the community pools its money, worked by a mason. On an ordinary frontage it surfaces sparingly as quoins and worked jambs at corners and doorways, the one place rough rubble can't turn a clean edge. Scarce by economy, so preserve, never field.
- `roof.field` → dark_oak_planks: The signature saltcrag cover: riven pine and spruce shingle, split thin and blackened with pitch — the roof of the better cottages and skippers' houses. It answers the gale and shares the boatyard's tar identity with the cladding, reading dead black at L20 across the whole pitch.
- `roof.course.stairs` → dark_oak_stairs: The pitched run of tarred shingle, coursed up the slope — split softwood lapped against the wind, blackened with the same pitch as the field so the courses read as one tarred skin.
- `roof.course.slab` → dark_oak_slab: The flat shingle course at eave and shallow break — the same riven, tarred softwood laid level where the pitch eases, member of the roof family with the field and stairs.
- `roof.ridge` → deepslate_tiles: Slate is the prestige cover, landed costly by boat and saved for the church and merchant frontages — but a single bought course can cap the ridge, the most beaten seam of a tarred roof. Spent where it earns its keep and nowhere else; dark grey at L23, it sits honestly against the black shingle.
- `roof.field.thatch` → hay_block: The modest cottage that can't run shingle pins down steep reed and marram cut from the dune and salt-marsh — cheap, local, raked against the gale. It belongs in the roofscape as the poorer neighbour's pitch, a preserve alternate to the tarred dominant.
- `roof.field.turf` → moss_block: The poorest and most exposed outbuildings are turfed — sod cut from the thin coastal soil over a bark underlayer, cheap and stormproof. Green-grey living roof (L43), the bottom rung of the roofing economy held on the byre and net-store.
- `door.main` → spruce_door: Doors are joined from sawn softwood deal landed across the sea — the only milled timber a fishing family buys — and tarred where they face the weather. Plain pine board, no proud oak in this country.
- `window.glazing` → glass_pane: Window glass is bought-in and small, set in a sawn-deal frame — a few panes where a curer or skipper can pay, kept tight against salt wind. The joinery is the imported deal; the glass is the rare indulgence it holds.
- `window.shutter` → spruce_trapdoor: Most openings get a tarred deal shutter rather than glass — sawn softwood board, pitch-soaked, barred shut against the gale. Cheaper than glazing and the working norm on lesser windows.
- `opening.lintel` → spruce_log: Heads over door and window are spanned with what the sea returns — driftwood baulks and salvaged ship-timber, tarry and dark (L17), too crooked for boards but sound enough to carry rubble above an opening. Salvage doing the structural work milled deal is too thin for.
- `chimney.stack` → cobblestone: The hearth that warms the cottage and dries the catch is stacked from the same gathered fieldstone as the walls, bedded in lime — rough rubble carried up around the flue. Fire here is met with what the headland gives, not with dear fired brick.
- `chimney.cap` → stone_bricks: The one place a humble stack earns worked stone: a dressed capstone at the chimney head, where weather attacks hardest and rubble won't hold a clean weathering. A scarce mason's touch, spent because fire and gale together demand it.

Roof idioms available: roof.gable (ridge-bearing roofs need ridgeAxis).
Wall-surface treatments (recorded for the workshop's dressing passes): opening-dressing, surface.fill, surface.paint, surface.roof-courses, surface.strip-salt.
Proportions: storey height 3–4 blocks; pitch classes [2,1,0.5] (rise per run — your pitchClass MUST be one of these); opening spacing 3–6 cells edge-to-edge.

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
