import { OUTLINE, LINE, stroke, sym, type Asset } from "../core"

/*
 * The standard pose, which every other asset is drawn to fit:
 *   head      centre (512, 330), crown y≈165, chin y≈490, ears x≈384 / 640
 *   eyes      (458, 338) and (566, 338); brows y≈292; mouth (512, 432)
 *   shoulders y≈560, x≈338–686; waist y≈900; hips y≈1000
 *   hands     (294, 1042) and (730, 1042)
 *   ankles    y≈1420; soles y≈1470
 */

const skin = (d: string) => `<path d="${d}" fill="{{skin}}" ${OUTLINE}/>`

const figure =
  sym(
    skin("M346 572 C300 584 284 636 280 700 L262 1004 L326 1010 L350 724 C356 684 366 646 380 612 Z") +
      skin("M338 990 L506 990 L496 1190 L482 1428 L412 1428 L384 1190 Z") +
      skin("M412 1420 L482 1420 L486 1466 C470 1480 400 1482 380 1466 C376 1446 394 1428 412 1420 Z")
  ) +
  skin("M338 590 C338 560 390 548 452 546 L572 546 C634 548 686 560 686 590 L664 900 C684 946 696 990 690 1030 L334 1030 C328 990 340 946 360 900 Z") +
  // Plain undergarment, so a figure with nothing chosen is still dressed.
  `<path d="M334 990 L690 990 L694 1070 C640 1090 560 1092 512 1060 C464 1092 384 1090 330 1070 Z" fill="#3b3346" ${OUTLINE}/>` +
  sym(`<ellipse cx="294" cy="1042" rx="34" ry="42" fill="{{skin}}" ${OUTLINE}/>`) +
  `<path d="M470 440 L554 440 L560 560 C540 582 484 582 464 560 Z" fill="{{skinShade}}" ${OUTLINE}/>`

const bodies: Asset[] = [
  { id: "body_slender", name: "Slender", slot: "body", widthScale: 0.88, layers: { body: figure } },
  { id: "body_average", name: "Average", slot: "body", widthScale: 1, layers: { body: figure } },
  { id: "body_broad", name: "Broad", slot: "body", widthScale: 1.14, layers: { body: figure } },
]

const ears = sym(
  `<ellipse cx="386" cy="338" rx="22" ry="38" fill="{{skin}}" ${OUTLINE}/><path d="M384 322 Q374 338 386 356" fill="none" stroke="{{skinShade}}" stroke-width="5" stroke-linecap="round"/>`
)
const nose = stroke("M512 360 Q500 394 518 400", 5, "{{skinShade}}")
const blush = sym(`<ellipse cx="438" cy="398" rx="26" ry="14" fill="#e36a6a" opacity=".16"/>`)
const head = (d: string) =>
  ears + `<path d="${d}" fill="{{skin}}" ${OUTLINE}/>` + nose + blush

const faces: Asset[] = [
  {
    id: "face_oval",
    name: "Oval",
    slot: "face",
    layers: { head: head("M512 165 C610 165 640 240 640 320 C640 410 590 480 512 490 C434 480 384 410 384 320 C384 240 414 165 512 165 Z") },
  },
  {
    id: "face_round",
    name: "Round",
    slot: "face",
    layers: { head: head("M512 170 C622 170 650 250 650 332 C650 422 602 478 512 484 C422 478 374 422 374 332 C374 250 402 170 512 170 Z") },
  },
  {
    id: "face_heart",
    name: "Heart",
    slot: "face",
    layers: { head: head("M512 165 C615 165 645 235 642 310 C640 392 590 452 512 500 C434 452 384 392 382 310 C379 235 409 165 512 165 Z") },
  },
  {
    id: "face_square",
    name: "Square",
    slot: "face",
    layers: { head: head("M512 168 C612 168 640 235 640 310 L636 410 C630 456 580 488 512 490 C444 488 394 456 388 410 L384 310 C384 235 412 168 512 168 Z") },
  },
]

const pupil = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#15111c"/>`
const glint = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>`

const eye = (id: string, name: string, left: string): Asset => ({
  id,
  name,
  slot: "eyes",
  layers: { face: sym(left) },
})

const eyes: Asset[] = [
  eye(
    "eyes_round",
    "Round",
    `<ellipse cx="458" cy="338" rx="28" ry="24" fill="#fff" ${OUTLINE}/><circle cx="460" cy="340" r="16" fill="{{eyes}}"/>${pupil(460, 340, 7)}${glint(453, 332, 5)}`
  ),
  eye(
    "eyes_almond",
    "Almond",
    `<path d="M424 340 Q458 310 494 336 Q460 360 424 340 Z" fill="#fff" ${OUTLINE}/><circle cx="460" cy="337" r="14" fill="{{eyes}}"/>${pupil(460, 337, 6)}${glint(455, 331, 4)}${stroke("M420 336 Q456 300 498 332", 8)}`
  ),
  eye(
    "eyes_bright",
    "Bright",
    `<ellipse cx="458" cy="340" rx="30" ry="36" fill="#fff" ${OUTLINE}/><ellipse cx="460" cy="346" rx="21" ry="28" fill="{{eyes}}"/><ellipse cx="460" cy="358" rx="20" ry="14" fill="{{eyesShade}}" opacity=".6"/><ellipse cx="460" cy="346" rx="9" ry="13" fill="#15111c"/>${glint(451, 332, 7)}${glint(468, 360, 3)}${stroke("M424 318 Q458 290 494 318", 9)}`
  ),
  eye(
    "eyes_sleepy",
    "Sleepy",
    `<path d="M426 338 Q458 368 492 338 Z" fill="#fff" ${OUTLINE}/><path d="M444 339 A16 16 0 0 0 476 339 Z" fill="{{eyes}}"/>${stroke("M422 338 L496 338", 8)}`
  ),
  eye(
    "eyes_sharp",
    "Sharp",
    `<path d="M422 346 L494 324 Q488 352 452 354 Z" fill="#fff" ${OUTLINE}/><circle cx="464" cy="341" r="11" fill="{{eyes}}"/>${pupil(464, 341, 5)}${stroke("M418 348 L498 320", 8)}`
  ),
  eye("eyes_happy", "Happy", stroke("M430 346 Q458 316 486 346", 8)),
  eye(
    "eyes_narrow",
    "Narrow",
    `<ellipse cx="458" cy="340" rx="28" ry="11" fill="#fff" ${OUTLINE}/><circle cx="460" cy="340" r="9" fill="{{eyes}}"/>${pupil(460, 340, 4)}`
  ),
  eye(
    "eyes_starry",
    "Starry",
    `<ellipse cx="458" cy="340" rx="30" ry="34" fill="#fff" ${OUTLINE}/><ellipse cx="460" cy="344" rx="22" ry="27" fill="{{eyes}}"/><ellipse cx="460" cy="344" rx="8" ry="11" fill="#15111c"/><path d="M452 322 l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 Z" fill="#fff"/>${glint(470, 358, 3)}${stroke("M424 318 Q458 292 494 318", 8)}`
  ),
]

const brow = (id: string, name: string, left: string): Asset => ({
  id,
  name,
  slot: "eyebrows",
  layers: { face: sym(left) },
})

const eyebrows: Asset[] = [
  brow("brows_straight", "Straight", `<path d="M426 290 L492 286 L492 299 L428 303 Z" fill="{{hairShade}}"/>`),
  brow("brows_arched", "Arched", stroke("M424 300 Q456 268 494 290", 11, "{{hairShade}}")),
  brow("brows_fierce", "Fierce", stroke("M426 280 L494 302", 12, "{{hairShade}}")),
  brow("brows_worried", "Worried", stroke("M426 302 L494 282", 11, "{{hairShade}}")),
  brow("brows_thick", "Thick", `<path d="M420 300 Q454 264 498 284 L496 302 Q458 288 424 314 Z" fill="{{hairShade}}"/>`),
  brow("brows_thin", "Thin", stroke("M426 296 Q458 278 492 292", 5, "{{hairShade}}")),
]

const mouth = (id: string, name: string, markup: string): Asset => ({
  id,
  name,
  slot: "mouth",
  layers: { face: markup },
})

const mouths: Asset[] = [
  mouth("mouth_smile", "Smile", stroke("M484 428 Q512 456 540 428", 6)),
  mouth("mouth_neutral", "Neutral", stroke("M490 436 L534 436", 6)),
  mouth("mouth_smirk", "Smirk", stroke("M488 438 Q520 446 542 422", 6)),
  mouth(
    "mouth_grin",
    "Grin",
    `<path d="M482 424 Q512 476 542 424 Z" fill="#5b1f2e" ${OUTLINE}/><path d="M488 427 L536 427 L531 437 L493 437 Z" fill="#fff"/><path d="M498 453 Q512 441 526 453 Q512 462 498 453 Z" fill="#e0707f"/>`
  ),
  mouth("mouth_frown", "Frown", stroke("M488 444 Q512 422 536 444", 6)),
  mouth("mouth_gasp", "Gasp", `<ellipse cx="512" cy="438" rx="10" ry="13" fill="#5b1f2e" stroke="${LINE}" stroke-width="5"/>`),
]

export const BODY_ASSETS: Asset[] = [...bodies, ...faces, ...eyes, ...eyebrows, ...mouths]
