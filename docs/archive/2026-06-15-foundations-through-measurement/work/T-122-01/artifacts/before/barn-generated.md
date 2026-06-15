# roof-diff — barn (generated)

Band floor 13; regions {"ridge":45,"slopes":259,"eaves":4,"ends":12}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.834 | 1293 (extra 252 / missing 1041) | wall 941 |
| +x-z (135°) | 0.852 | 1158 (extra 313 / missing 845) | wall 743 |
| -x-z (225°) | 0.863 | 1068 (extra 255 / missing 813) | wall 678 |
| -x+z (315°) | 0.885 | 897 (extra 247 / missing 650) | wall 506 |

Cross-azimuth: 4416 px, roof share 35.054%, worst view +x+z.

- **gable-roof-1-roof-8** ridge Δ(eave-rel) rmse 4.814 max -8.8; rakes: lo@-24 (unfitted) rmse 6.813, hi@23 (unfitted) rmse null

Reproducible: byte-identical ×2 (sha256 87734bd480d2…).
