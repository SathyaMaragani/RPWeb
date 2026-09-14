import { clip, fillLine, shaded, stroke, sym, tone, type Asset } from "../core"

/*
 * The standard pose, about three heads tall, which every other asset fits:
 *   head      crown y≈176, chin y≈630, cheeks x≈334–690, centre line x = 512
 *   eyes      centres (448, 446) and (576, 446); brows y≈355; nose (512, 505); mouth (512, 552)
 *   ears      lobes (324, 490) and (700, 490)
 *   neck      x 484–540, y 596–672
 *   shoulders tips (380, 730) and (644, 730); waist y≈920; hips y≈1010
 *   hands     centres (366, 1024) and (658, 1024)
 *   knees     y≈1230; ankles y≈1420; soles y≈1480
 * Light comes from the upper left, so shade sits right and under overlaps.
 */

const ARM = "M404 700 C376 704 360 730 358 770 L350 880 C348 930 346 960 346 986 L386 990 C388 950 392 910 396 870 L410 776 C414 750 420 730 430 716 Z"
const HAND = "M346 976 C332 996 330 1032 342 1054 C352 1072 378 1070 388 1050 C396 1032 396 1002 390 978 Z"
const TORSO = "M484 590 L540 590 L540 668 C566 684 604 690 626 700 C646 710 650 730 644 760 L618 860 C610 880 604 900 602 920 C616 950 624 980 620 1012 L404 1012 C400 980 408 950 422 920 C420 900 414 880 406 860 L380 760 C374 730 378 710 398 700 C420 690 458 684 484 668 Z"
const LEG = "M404 990 L512 990 L509 1060 C505 1120 499 1180 495 1232 C492 1300 491 1370 491 1424 L459 1424 C455 1370 449 1300 445 1240 C437 1180 423 1110 413 1060 Z"
const FOOT = "M459 1412 L491 1412 C495 1432 496 1452 492 1468 C472 1482 440 1484 426 1474 C416 1464 428 1450 446 1442 C455 1434 458 1424 459 1412 Z"

const figure =
  sym(
    shaded("body-arm", ARM, "skin", tone("M394 700 L446 700 L406 1000 L380 1000 Z", "skinShade")) +
      shaded("body-hand", HAND, "skin", tone("M372 970 L400 970 L400 1070 L366 1070 Z", "skinShade")) +
      stroke("M388 1004 C398 1014 398 1032 390 1040", 3, "{{skinLine}}") +
      shaded("body-leg", LEG, "skin", tone("M478 990 L520 990 L500 1430 L478 1430 Z", "skinShade") + stroke("M458 1236 Q472 1246 488 1238", 3, "{{skinShade}}")) +
      shaded("body-foot", FOOT, "skin", tone("M430 1462 C450 1470 480 1470 496 1462 L496 1490 L420 1490 Z", "skinShade"))
  ) +
  shaded(
    "body-torso",
    TORSO,
    "skin",
    tone("M590 650 C640 760 600 900 640 1020 L700 1020 L700 650 Z", "skinShade") +
      tone("M470 588 L556 588 L556 640 Q512 676 468 640 Z", "skinDeep", 'opacity=".5"')
  ) +
  sym(stroke("M474 704 Q452 710 430 708", 3, "{{skinShade}}")) +
  // Plain underthings, so a figure with nothing chosen is still decent.
  fillLine("M422 784 Q512 766 602 784 L598 856 Q512 872 426 856 Z", "trim", 3) +
  fillLine("M402 976 L622 976 L628 1066 Q584 1080 544 1070 L512 1044 L480 1070 Q440 1080 396 1066 Z", "trim", 3)

const body = (id: string, name: string, widthScale: number): Asset => ({
  id,
  name,
  slot: "body",
  widthScale,
  // The underthings use a fixed muted tone, not a user colour.
  layers: { body: figure.replace(/\{\{trim\}\}/g, "#2c2433").replace(/\{\{trimLine\}\}/g, "#17121c") },
})

const BODIES: Asset[] = [
  body("body_slim", "Slim", 0.9),
  body("body_average", "Average", 1),
  body("body_broad", "Broad", 1.16),
]

const ear = (id: string, name: string, d: string, inner: string): Asset => ({
  id,
  name,
  slot: "ears",
  layers: {
    head: sym(
      shaded(`ears-${id}`, d, "skin", tone("M352 380 L352 520 L318 520 C330 480 338 440 352 380 Z", "skinShade")) +
        stroke(inner, 3, "{{skinDeep}}")
    ),
  },
})

const EARS: Asset[] = [
  ear("ears_human", "Human", "M350 406 C322 390 300 410 302 444 C304 478 324 500 354 496 Z", "M338 424 C322 430 318 452 332 468"),
  ear("ears_elf", "Elf", "M352 402 C318 390 272 352 230 312 C248 372 282 446 316 486 C328 500 344 502 358 494 Z", "M340 424 C304 400 276 368 258 348"),
  ear("ears_long_elf", "Long elf", "M354 398 C310 382 238 326 172 256 C196 350 254 442 312 490 C326 502 344 504 358 494 Z", "M342 420 C290 392 236 344 204 306"),
]

const BLUSH =
  `<radialGradient id="face-blush"><stop offset="0" stop-color="#ff7d8e" stop-opacity=".42"/><stop offset="1" stop-color="#ff7d8e" stop-opacity="0"/></radialGradient>` +
  `<ellipse cx="418" cy="514" rx="50" ry="26" fill="url(#face-blush)"/><ellipse cx="606" cy="514" rx="50" ry="26" fill="url(#face-blush)"/>`
const NOSE = stroke("M514 494 Q503 508 517 515", 4, "{{skinLine}}", 'opacity=".75"')

const face = (id: string, name: string, d: string): Asset => ({
  id,
  name,
  slot: "face",
  layers: {
    head:
      shaded(
        `face-${id}`,
        d,
        "skin",
        tone("M636 290 C706 420 676 570 552 660 L740 660 L740 290 Z", "skinShade"),
        5
      ) +
      BLUSH +
      NOSE,
  },
})

const FACES: Asset[] = [
  face("face_soft", "Soft", "M512 176 C618 176 690 250 690 392 C690 478 654 540 604 586 C572 614 544 630 512 632 C480 630 452 614 420 586 C370 540 334 478 334 392 C334 250 406 176 512 176 Z"),
  face("face_sharp", "Sharp", "M512 176 C618 176 690 250 688 388 C686 452 660 506 616 560 C574 612 544 648 512 666 C480 648 450 612 408 560 C364 506 338 452 336 388 C334 250 406 176 512 176 Z"),
  face("face_round", "Round", "M512 180 C630 180 710 250 710 404 C710 500 660 566 596 600 C568 616 540 624 512 624 C484 624 456 616 428 600 C364 566 314 500 314 404 C314 250 394 180 512 180 Z"),
]

const SOFT_BLUR = `<filter id="markings-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>`
const GLOW = `<filter id="markings-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>`

const ARCANE_LINES =
  sym(
    stroke("M394 494 Q400 530 436 540", 4, "{{primary}}") +
      `<circle cx="450" cy="542" r="4.5" fill="{{primary}}"/><circle cx="464" cy="538" r="3" fill="{{primary}}"/>`
  ) + `<path d="M512 366 L521 384 L512 402 L503 384 Z" fill="{{primary}}"/>`

const MARKINGS: Asset[] = [
  {
    id: "markings_freckles",
    name: "Freckles",
    slot: "markings",
    layers: {
      head: sym(
        [[402, 500], [420, 522], [440, 506], [390, 526], [458, 526], [430, 540], [470, 504]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="{{skinDeep}}" opacity=".7"/>`)
          .join("")
      ),
    },
  },
  {
    id: "markings_beauty_mark",
    name: "Beauty mark",
    slot: "markings",
    layers: { head: `<circle cx="606" cy="528" r="6" fill="#3a2230"/>` },
  },
  {
    id: "markings_arcane",
    name: "Arcane marks",
    slot: "markings",
    colors: { primary: "#7dd3fc" },
    layers: {
      head: GLOW + `<g filter="url(#markings-glow)" opacity=".9">${ARCANE_LINES}</g>` + ARCANE_LINES,
    },
  },
  {
    id: "markings_shadowed",
    name: "Shadowed eyes",
    slot: "markings",
    layers: {
      head:
        SOFT_BLUR +
        `<g filter="url(#markings-soft)">${sym(`<ellipse cx="446" cy="456" rx="66" ry="46" fill="#3b1830" opacity=".42"/>`)}</g>` +
        sym(stroke("M398 490 Q446 512 498 484", 4, "#4a2238", 'opacity=".55"')),
    },
  },
]

type EyeSpec = {
  /** The visible opening of the left eye. */
  white: string
  iris: [cx: number, cy: number, rx: number, ry: number]
  pupil: "round" | "slit" | "none"
  /** The filled upper lash line. */
  lid: string
  lower?: string
  crease?: string
  lashes?: string
  glints: [cx: number, cy: number, rx: number, ry: number][]
  glow?: boolean
}

function eyes(id: string, name: string, e: EyeSpec): Asset {
  const [cx, cy, rx, ry] = e.iris
  const irisFill = e.glow
    ? `<radialGradient id="eyes-i"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="{{eyesLight}}"/><stop offset="1" stop-color="{{eyes}}"/></radialGradient>`
    : `<linearGradient id="eyes-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{{eyesDeep}}"/><stop offset=".55" stop-color="{{eyes}}"/><stop offset="1" stop-color="{{eyesLight}}"/></linearGradient>`
  const pupil =
    e.pupil === "round"
      ? `<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx * 0.42}" ry="${ry * 0.46}" fill="#140f1d"/>`
      : e.pupil === "slit"
        ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.17}" ry="${ry * 0.7}" fill="#140f1d"/>`
        : ""

  const left =
    irisFill +
    (e.glow
      ? `<path d="${e.white}" fill="{{eyes}}" opacity=".45" filter="url(#eyes-glow)"/>`
      : "") +
    `<path d="${e.white}" fill="${e.glow ? "{{eyesLight}}" : "#fbf8ff"}"/>` +
    clip(
      "eyes-w",
      e.white,
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#eyes-i)" stroke="{{eyesDeep}}" stroke-width="4"/>` +
        pupil +
        `<path d="${e.white}" fill="none" stroke="{{eyesDeep}}" stroke-width="26" opacity=".2"/>` +
        e.glints.map(([gx, gy, grx, gry]) => `<ellipse cx="${gx}" cy="${gy}" rx="${grx}" ry="${gry}" fill="#fff"/>`).join("")
    ) +
    `<path d="${e.lid}" fill="#21182a"/>` +
    (e.lashes ? `<path d="${e.lashes}" fill="#21182a"/>` : "") +
    (e.lower ? stroke(e.lower, 3.5, "#21182a", 'opacity=".75"') : "") +
    (e.crease ? stroke(e.crease, 3, "{{skinLine}}", 'opacity=".45"') : "")

  const glow = e.glow
    ? `<filter id="eyes-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>`
    : ""
  // Specs are written with the lash flick on the right; flipping each eye about
  // its own centre puts the flicks at the outer corners, away from the nose.
  return { id, name, slot: "eyes", layers: { face: glow + sym(`<g transform="matrix(-1 0 0 1 896 0)">${left}</g>`) } }
}

const SOFT_WHITE = "M398 450 C398 418 420 398 446 398 C474 398 492 420 492 448 C490 474 470 488 446 488 C420 488 400 474 398 450 Z"

const EYES: Asset[] = [
  eyes("eyes_soft", "Soft", {
    white: SOFT_WHITE,
    iris: [448, 446, 31, 38],
    pupil: "round",
    lid: "M388 446 C390 406 418 386 448 386 C478 386 498 404 504 428 L518 420 L508 442 C498 414 476 398 448 398 C420 398 400 418 396 446 Z",
    lower: "M414 484 Q446 494 478 482",
    crease: "M406 392 Q444 364 490 382",
    glints: [[432, 428, 10, 12], [462, 466, 4, 4]],
  }),
  eyes("eyes_sharp", "Sharp", {
    white: "M392 462 C404 428 430 410 458 408 C478 408 494 414 504 426 C498 458 476 476 448 478 C426 480 406 474 392 462 Z",
    iris: [452, 446, 27, 33],
    pupil: "round",
    lid: "M380 468 C392 420 428 394 460 394 C486 394 502 402 518 412 L534 400 L518 428 C502 414 482 408 458 410 C428 412 404 432 394 464 Z",
    lower: "M400 472 Q446 488 500 460",
    crease: "M410 398 Q452 370 508 392",
    glints: [[440, 432, 8, 9], [466, 460, 3, 3]],
  }),
  eyes("eyes_sleepy", "Sleepy", {
    white: "M398 454 C412 442 430 438 450 438 C472 438 490 444 500 454 C494 476 472 488 448 488 C424 488 404 476 398 454 Z",
    iris: [450, 466, 28, 32],
    pupil: "round",
    lid: "M386 458 C404 432 428 424 450 424 C476 424 498 432 512 448 L524 444 L514 460 C498 444 474 438 450 438 C428 438 408 444 396 460 Z",
    lower: "M412 484 Q448 496 486 482",
    crease: "M398 426 Q450 400 506 424",
    glints: [[438, 452, 7, 6]],
  }),
  eyes("eyes_innocent", "Innocent", {
    white: "M394 446 C394 406 418 384 448 384 C480 384 502 408 502 446 C502 482 480 500 448 500 C418 500 394 482 394 446 Z",
    iris: [448, 450, 36, 46],
    pupil: "round",
    lid: "M384 440 C386 394 414 370 448 370 C484 370 508 394 512 430 C502 402 480 386 448 386 C420 386 398 404 394 442 Z",
    lashes: "M506 420 L528 410 L510 434 Z M500 402 L518 386 L508 414 Z",
    lower: "M414 494 Q448 506 484 494",
    glints: [[430, 424, 13, 15], [466, 472, 6, 6], [440, 480, 3, 3]],
  }),
  eyes("eyes_feline", "Feline", {
    white: "M394 456 C408 424 432 410 460 410 C480 410 496 416 508 420 C504 452 482 474 452 476 C428 478 408 470 394 456 Z",
    iris: [454, 444, 28, 32],
    pupil: "slit",
    lid: "M382 462 C396 418 430 396 462 398 C490 398 510 404 536 394 L522 418 C506 414 486 410 462 412 C434 412 410 428 396 462 Z",
    lower: "M404 466 Q450 484 506 454",
    crease: "M414 396 Q458 370 516 388",
    glints: [[442, 430, 7, 9]],
  }),
  eyes("eyes_piercing", "Piercing", {
    white: "M396 452 C412 434 432 428 454 428 C476 428 494 436 506 446 C496 464 476 472 452 472 C428 472 408 466 396 452 Z",
    iris: [454, 448, 22, 26],
    pupil: "round",
    lid: "M384 454 C404 426 430 414 456 414 C482 414 504 426 522 440 L516 454 C498 440 478 430 454 430 C430 430 410 438 396 456 Z",
    lower: "M398 460 Q450 486 508 452",
    crease: "M402 410 Q452 390 514 414",
    glints: [[444, 438, 5, 6]],
  }),
  eyes("eyes_arcane", "Arcane glow", {
    white: SOFT_WHITE,
    iris: [448, 446, 34, 40],
    pupil: "none",
    lid: "M388 446 C390 406 418 386 448 386 C478 386 498 404 504 428 L518 420 L508 442 C498 414 476 398 448 398 C420 398 400 418 396 446 Z",
    lower: "M414 484 Q446 494 478 482",
    glints: [[436, 430, 8, 10]],
    glow: true,
  }),
]

const brow = (id: string, name: string, d: string): Asset => ({
  id,
  name,
  slot: "eyebrows",
  layers: { face: sym(`<path d="${d}" fill="{{hairDeep}}" stroke="{{hairLine}}" stroke-width="2" stroke-linejoin="round"/>`) },
})

const BROWS: Asset[] = [
  brow("brows_soft", "Soft", "M396 362 C420 342 456 338 488 350 C458 350 426 356 400 370 Z"),
  brow("brows_straight", "Straight", "M394 356 L490 348 L490 360 L396 370 Z"),
  brow("brows_elegant", "Elegant", "M392 374 C410 340 452 326 494 344 C454 342 424 352 398 380 Z"),
  brow("brows_furrowed", "Furrowed", "M398 342 C430 348 464 360 496 380 L490 390 C458 374 428 366 396 356 Z"),
]

const LIP = "#6b2a3c"
const mouth = (id: string, name: string, markup: string): Asset => ({
  id,
  name,
  slot: "mouth",
  layers: { face: markup },
})

const MOUTHS: Asset[] = [
  mouth("mouth_smile", "Soft smile", stroke("M492 548 Q512 564 532 548", 5, LIP)),
  mouth("mouth_neutral", "Calm", stroke("M498 556 Q512 552 526 556", 5, LIP)),
  mouth("mouth_smirk", "Smirk", stroke("M490 558 Q514 564 536 544", 5, LIP)),
  mouth("mouth_pout", "Displeased", stroke("M496 560 Q512 548 528 560", 5, LIP)),
  mouth(
    "mouth_laugh",
    "Open smile",
    `<path d="M486 544 Q512 586 538 544 Q512 552 486 544 Z" fill="#7a2336" stroke="${LIP}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path d="M498 566 Q512 556 526 566 Q512 576 498 566 Z" fill="#e0707f"/>`
  ),
  mouth(
    "mouth_fang",
    "Fanged smirk",
    stroke("M488 556 Q514 564 538 544", 5, LIP) + `<path d="M520 558 L528 556 L524 572 Z" fill="#fff" stroke="${LIP}" stroke-width="2"/>`
  ),
]

export const BODY_ASSETS: Asset[] = [...BODIES, ...EARS, ...FACES, ...MARKINGS, ...EYES, ...BROWS, ...MOUTHS]
