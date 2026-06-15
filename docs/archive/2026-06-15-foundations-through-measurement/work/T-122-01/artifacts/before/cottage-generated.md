# roof-diff — cottage (generated)

Band floor 14; regions {"ridge":103,"slopes":265,"ends":76,"eaves":31}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.864 | 1430 (extra 861 / missing 569) | wall 1076 |
| +x-z (135°) | 0.867 | 1474 (extra 784 / missing 690) | wall 1126 |
| -x-z (225°) | 0.846 | 1555 (extra 247 / missing 1308) | wall 810 |
| -x+z (315°) | 0.864 | 1463 (extra 428 / missing 1035) | wall 962 |

Cross-azimuth: 5922 px, roof share 32.894%, worst view -x-z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 0.705 max -2.933; rakes: lo@-14 rmse 1.941, hi@13 rmse 1.547
- **gable-roof-2-roof-3** ridge Δ(eave-rel) rmse 4.332 max -4.401; rakes: lo@-1 (unfitted) rmse 2.294, hi@10 rmse 2.475

Reproducible: byte-identical ×2 (sha256 ce24e9ea7166…).
