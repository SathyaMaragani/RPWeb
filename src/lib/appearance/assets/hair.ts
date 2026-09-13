import { OUTLINE, stroke, sym, type Asset } from "../core"

/** Hair drawn in front of the face and clothes. */
const front = (d: string) => `<path d="${d}" fill="{{hair}}" ${OUTLINE}/>`
/** Hair behind the head and body, a step darker for depth. */
const back = (d: string) => `<path d="${d}" fill="{{hairShade}}" ${OUTLINE}/>`
const shine = (d: string) => stroke(d, 9, "{{hairLight}}")

const SIDE_PART =
  front("M370 330 C356 190 440 126 524 130 C606 134 666 196 654 330 C646 286 626 256 598 240 C548 276 470 282 412 252 C392 276 378 300 370 330 Z") +
  shine("M470 172 Q540 150 600 192")

const SLICK_CAP = "M376 316 C368 180 440 134 512 134 C584 134 656 180 648 316 C630 250 590 214 512 212 C434 214 394 250 376 316 Z"

const FRINGE =
  front("M374 318 C364 190 436 136 512 134 C588 136 660 190 650 318 C636 268 604 238 574 236 L556 252 L536 236 L512 254 L488 236 L468 252 L450 236 C420 238 388 268 374 318 Z") +
  shine("M456 170 Q512 152 566 170")

/** A braid, as overlapping plaits running down from `x, y`. */
function braid(x: number, y: number, count: number, drift: number) {
  let out = ""
  for (let i = 0; i < count; i++) {
    out += `<ellipse cx="${x + i * drift}" cy="${y + i * 56}" rx="${30 - i}" ry="38" fill="{{hair}}" ${OUTLINE}/>`
  }
  return out
}

/** A ring of curls around the head, for the big curly style. */
function curls(radius: number, r: number, count: number, from: number, to: number, cy: number) {
  let out = ""
  for (let i = 0; i < count; i++) {
    const a = ((from + ((to - from) * i) / (count - 1)) * Math.PI) / 180
    const x = Math.round(512 + Math.cos(a) * radius)
    const y = Math.round(cy + Math.sin(a) * radius)
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="{{hair}}" ${OUTLINE}/>`
  }
  return out
}

const hair = (id: string, name: string, layers: Asset["layers"]): Asset => ({
  id,
  name,
  slot: "hair",
  layers,
})

export const HAIR_ASSETS: Asset[] = [
  hair("hair_crop", "Short crop", { hairFront: FRINGE }),
  hair("hair_side_part", "Side part", { hairFront: SIDE_PART }),
  hair("hair_long", "Long straight", {
    hairBack: back("M366 300 C352 160 440 116 512 116 C584 116 672 160 658 300 L700 780 C624 810 400 810 324 780 Z"),
    hairFront:
      sym(front("M378 290 C364 420 366 560 344 700 L404 690 C414 560 408 420 420 300 Z")) + SIDE_PART,
  }),
  hair("hair_waves", "Long waves", {
    hairBack: back(
      "M360 300 C346 160 440 112 512 112 C584 112 678 160 664 300 C690 420 660 520 700 620 C730 700 690 760 712 820 Q672 850 640 818 Q600 856 560 822 Q512 860 464 822 Q424 856 384 818 Q352 850 312 820 C334 760 294 700 324 620 C364 520 334 420 360 300 Z"
    ),
    hairFront:
      sym(front("M380 300 C350 380 390 440 360 520 C340 580 380 620 356 680 L404 668 C420 610 392 570 412 520 C436 450 400 380 424 300 Z")) +
      SIDE_PART,
  }),
  hair("hair_ponytail", "Ponytail", {
    hairBack:
      back("M590 190 C700 170 740 300 716 440 C700 560 736 640 690 740 C672 640 640 560 646 440 C652 330 626 250 580 220 Z") +
      `<ellipse cx="606" cy="206" rx="24" ry="17" fill="{{hairShade}}" ${OUTLINE}/>`,
    hairFront: front(SLICK_CAP) + shine("M452 170 Q512 150 572 170"),
  }),
  hair("hair_twintails", "Twin tails", {
    hairBack: sym(
      back("M420 200 C330 190 290 300 300 420 C310 540 270 620 310 720 C340 620 350 520 350 420 C350 320 380 250 430 230 Z") +
        `<ellipse cx="408" cy="214" rx="22" ry="18" fill="{{hairShade}}" ${OUTLINE}/>`
    ),
    hairFront: FRINGE,
  }),
  hair("hair_bob", "Bob", {
    hairBack: back("M364 320 C348 170 440 126 512 126 C584 126 676 170 660 320 L672 476 C624 506 400 506 352 476 Z"),
    hairFront:
      sym(front("M372 300 L362 470 L404 478 L398 300 Z")) +
      front("M380 300 C372 186 440 140 512 140 C584 140 652 186 644 300 L640 266 C572 278 452 278 384 266 Z") +
      shine("M456 170 Q512 154 568 170"),
  }),
  hair("hair_pixie", "Pixie", {
    hairFront:
      front("M372 320 C360 180 440 128 520 130 C600 134 664 190 652 320 C640 280 624 258 604 250 L590 272 L566 244 L540 270 L520 240 L494 262 L476 236 L452 262 C420 260 388 280 372 320 Z") +
      shine("M470 166 Q530 150 590 176"),
  }),
  hair("hair_spiky", "Spiky", {
    hairFront: front(
      "M376 320 L350 230 L400 240 L392 150 L450 196 L470 100 L512 170 L556 96 L574 196 L634 150 L624 240 L676 230 L648 320 C634 270 600 244 512 240 C424 244 390 270 376 320 Z"
    ),
  }),
  hair("hair_bun", "Top bun", {
    hairBack: `<circle cx="512" cy="120" r="60" fill="{{hair}}" ${OUTLINE}/>` + stroke("M480 110 Q512 80 546 112", 7, "{{hairShade}}"),
    hairFront: front(SLICK_CAP) + shine("M452 170 Q512 150 572 170"),
  }),
  hair("hair_braid", "Side braid", {
    hairFront: SIDE_PART + braid(604, 420, 8, 5) + `<ellipse cx="646" cy="866" rx="16" ry="12" fill="{{hairShade}}" ${OUTLINE}/>`,
  }),
  hair("hair_curly", "Curly", {
    hairBack: curls(170, 70, 11, 150, 390, 320),
    hairFront: curls(150, 40, 9, 190, 350, 330),
  }),
  hair("hair_slick", "Slicked back", {
    hairFront:
      front("M380 300 C376 170 440 128 512 128 C584 128 648 170 644 300 C626 226 584 196 512 194 C440 196 398 226 380 300 Z") +
      stroke("M450 150 Q480 176 470 206", 5, "{{hairShade}}") +
      stroke("M512 140 L512 196", 5, "{{hairShade}}") +
      stroke("M574 150 Q544 176 554 206", 5, "{{hairShade}}"),
  }),
  hair("hair_mohawk", "Mohawk", {
    hairFront:
      `<path d="${SLICK_CAP}" fill="{{hairShade}}" opacity=".45"/>` +
      front("M478 250 C466 170 476 86 512 58 C548 86 558 170 546 250 Z") +
      shine("M512 90 Q500 150 506 220"),
  }),
  hair("hair_shoulder", "Shoulder waves", {
    hairBack: back(
      "M362 310 C348 166 440 118 512 118 C584 118 676 166 662 310 C678 400 660 470 690 560 Q660 600 628 572 Q590 606 556 576 Q512 610 468 576 Q434 606 396 572 Q364 600 334 560 C364 470 346 400 362 310 Z"
    ),
    hairFront: SIDE_PART,
  }),
]
