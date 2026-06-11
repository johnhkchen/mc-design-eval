# roof-diff — gatehouse (generated)

Band floor 19; regions {"slopes":238,"eaves":36,"ridge":14,"ends":13}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.786 | 2276 (extra 1198 / missing 1078) | wall 1972 |
| +x-z (135°) | 0.738 | 2817 (extra 1327 / missing 1490) | wall 2380 |
| -x-z (225°) | 0.746 | 2781 (extra 1536 / missing 1245) | wall 2127 |
| -x+z (315°) | 0.804 | 2047 (extra 1021 / missing 1026) | wall 1526 |

Cross-azimuth: 9921 px, roof share 19.313%, worst view +x-z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 5.189 max -7.5; rakes: lo@-12 (unfitted) rmse 0.069, hi@13 (unfitted) rmse null

Reproducible: byte-identical ×2 (sha256 27b0d2c0f064…).
