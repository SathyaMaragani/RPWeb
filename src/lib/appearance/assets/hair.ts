import { clip, lock, shaded, stroke, sym, tone, type Asset } from "../core"

/** Hair strands: thin lines in the shadow colour following the flow. */
const strands = (...paths: string[]) => paths.map((d) => stroke(d, 3, "{{hairShade}}", 'opacity=".9"')).join("")
/** The glossy band of light across the top of the head. */
const shine = (d: string) =>
  `<path d="${d}" fill="none" stroke="{{hairLight}}" stroke-width="10" stroke-linecap="round" stroke-dasharray="64 30 26 600" stroke-dashoffset="-46" opacity=".6"/>`

/** The mass covering the skull, shared by most styles. */
const CAP = "M318 470 C296 262 390 132 512 132 C634 132 728 262 706 470 C694 400 668 338 624 300 C588 276 552 268 512 268 C472 268 436 276 400 300 C356 338 330 400 318 470 Z"
const capShading =
  tone("M300 470 C320 350 400 288 512 288 C624 288 704 350 724 470 L724 520 L300 520 Z", "hairShade") +
  tone("M626 120 C706 200 734 330 722 480 L770 480 L770 120 Z", "hairShade") +
  strands("M470 150 C420 180 382 240 362 330", "M486 148 C466 196 446 246 436 290", "M506 146 C528 190 566 230 612 282", "M526 146 C594 172 652 232 682 330")

const CAP_OUTER = "M318 470 C296 262 390 132 512 132 C634 132 728 262 706 470"

/**
 * The skull mass, outlined only along its outer edge: its lower edge sits under
 * the fringe, and a line there reads as the rim of a helmet.
 */
const cap = (id: string, d = CAP, outer = CAP_OUTER) =>
  `<path d="${d}" fill="{{hair}}"/>` + clip(`hair-${id}-cap`, d, capShading) + stroke(outer, 4.5, "{{hairLine}}")

/** A soft fringe swept to the right. */
const SWEPT_BANGS =
  lock(344, 300, 420, 272, 352, 480, -10) +
  lock(398, 280, 478, 262, 418, 412, 10) +
  lock(450, 266, 530, 262, 474, 424, 16) +
  lock(506, 262, 590, 272, 550, 406, 20) +
  lock(566, 270, 650, 300, 626, 398, 22) +
  lock(626, 290, 702, 332, 692, 488, 12)

/** Forehead shadow cast by the fringe, kept inside the face. */
const FRINGE_SHADOW =
  `<linearGradient id="hair-fringe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{{skinShade}}" stop-opacity=".85"/><stop offset="1" stop-color="{{skinShade}}" stop-opacity="0"/></linearGradient>` +
  `<path d="M360 296 C420 286 604 286 664 296 L664 432 C600 422 424 422 360 432 Z" fill="url(#hair-fringe)"/>`

const hair = (id: string, name: string, layers: Asset["layers"]): Asset => ({ id, name, slot: "hair", layers })

const CASCADE_BACK = "M332 300 C236 380 226 540 258 680 C282 790 222 880 252 990 C276 1080 344 1110 392 1060 C414 1118 476 1134 512 1090 C548 1134 610 1118 632 1060 C680 1110 748 1080 772 990 C802 880 742 790 766 680 C798 540 788 380 692 300 C640 150 384 150 332 300 Z"
const WAVE_L = "M338 420 C296 520 330 600 310 682 C290 762 330 822 314 904 C362 874 388 804 376 732 C364 660 400 600 382 520 C376 480 360 440 338 420 Z"
const WAVE_R = "M686 420 C732 500 700 580 724 662 C748 742 710 802 732 874 C688 852 658 792 668 722 C678 652 646 592 660 520 C664 480 670 440 686 420 Z"

const TOUSLE_OUTER = "M312 470 C282 360 300 250 360 196 L350 146 L404 176 C432 128 482 108 530 116 L556 80 L572 124 C642 130 702 180 716 258 L754 248 L726 300 C738 360 730 420 712 470"
const TOUSLE_CAP = `${TOUSLE_OUTER} C700 400 670 340 624 302 C588 278 552 270 512 270 C472 270 436 278 400 302 C356 340 326 400 312 470 Z`

const HIME_BACK = "M330 300 C300 400 290 600 288 800 L284 1100 L330 1080 L370 1104 L420 1082 L470 1106 L512 1084 L554 1106 L604 1082 L654 1104 L694 1080 L740 1100 L736 800 C734 600 724 400 694 300 C650 150 374 150 330 300 Z"
const HIME_BANGS = "M336 300 C380 272 440 262 512 262 C584 262 644 272 688 300 L694 396 L676 380 L660 404 L640 384 L620 410 L598 388 L580 408 L556 390 L536 414 L512 392 L488 414 L468 390 L444 408 L426 388 L404 410 L384 384 L364 404 L348 380 L330 396 Z"
const HIME_SIDE = "M330 318 C350 318 376 320 394 330 L398 700 L380 728 L360 708 L342 726 L324 700 Z"

const TAIL = "M356 252 C282 236 226 300 222 402 C218 502 262 562 244 662 C226 762 262 842 236 944 C292 912 324 842 320 762 C316 682 292 602 312 522 C328 462 350 402 374 330 Z"

const PONY_TAIL = "M488 142 C470 80 540 50 602 70 C702 102 762 222 752 362 C744 482 782 562 762 662 C742 762 772 822 742 902 C702 862 690 782 700 702 C712 602 680 522 690 422 C700 302 640 182 540 162 Z"
const SLEEK_CAP = "M322 470 C300 262 392 136 512 136 C632 136 724 262 702 470 C690 380 650 300 512 290 C374 300 334 380 322 470 Z"

const WOLF_BACK = "M320 340 C280 440 296 540 290 620 C286 680 300 740 330 760 L350 720 L372 772 L400 730 L420 762 L440 700 L584 700 L604 762 L624 730 L652 772 L674 720 L694 760 C724 740 738 680 734 620 C728 540 744 440 704 340 C650 180 374 180 320 340 Z"

const SWEEP = "M298 470 C268 330 318 180 458 130 C560 94 680 118 730 208 C762 270 742 342 706 382 C690 332 650 300 600 290 C560 300 520 332 480 382 C440 432 400 520 352 580 C328 560 308 520 298 470 Z"

// Tapers in under the ears, so the nape never shows as a box around the jaw.
const BOB_BACK = "M330 330 C296 430 300 520 340 572 C380 610 430 600 470 592 L554 592 C594 600 644 610 684 572 C724 520 728 430 694 330 C650 190 374 190 330 330 Z"

/** A ring of shaded curls, for the curly styles. */
function curls(id: string, cx: number, cy: number, radius: number, r: number, count: number, from: number, to: number) {
  let out = ""
  for (let i = 0; i < count; i++) {
    const a = ((from + ((to - from) * i) / (count - 1)) * Math.PI) / 180
    const x = Math.round(cx + Math.cos(a) * radius)
    const y = Math.round(cy + Math.sin(a) * radius)
    const d = `M${x - r} ${y} A${r} ${r} 0 1 1 ${x + r} ${y} A${r} ${r} 0 1 1 ${x - r} ${y} Z`
    out +=
      shaded(`${id}-${i}`, d, "hair", tone(`M${x} ${y - r - 4} L${x + r + 4} ${y - r - 4} L${x + r + 4} ${y + r + 4} L${x - r * 0.2} ${y + r + 4} Z`, "hairShade"), 3.5) +
      stroke(`M${x - r * 0.45} ${y + r * 0.1} A${r * 0.45} ${r * 0.45} 0 1 1 ${x + r * 0.3} ${y + r * 0.35}`, 3, "{{hairDeep}}")
  }
  return out
}

/** A braid-like bun: a wound circle with its wrap lines. */
const bun = (id: string, x: number, y: number, r: number) =>
  shaded(
    id,
    `M${x - r} ${y} A${r} ${r} 0 1 1 ${x + r} ${y} A${r} ${r} 0 1 1 ${x - r} ${y} Z`,
    "hair",
    tone(`M${x} ${y - r - 4} L${x + r + 4} ${y - r - 4} L${x + r + 4} ${y + r + 4} L${x - r * 0.3} ${y + r + 4} Z`, "hairShade") +
      stroke(`M${x - r * 0.7} ${y - r * 0.3} Q${x} ${y - r * 0.9} ${x + r * 0.7} ${y - r * 0.2}`, 4, "{{hairDeep}}") +
      stroke(`M${x - r * 0.8} ${y + r * 0.2} Q${x} ${y - r * 0.3} ${x + r * 0.8} ${y + r * 0.35}`, 4, "{{hairDeep}}") +
      stroke(`M${x - r * 0.5} ${y + r * 0.6} Q${x} ${y + r * 0.2} ${x + r * 0.6} ${y + r * 0.7}`, 4, "{{hairDeep}}") +
      stroke(`M${x - r * 0.4} ${y - r * 0.6} Q${x - r * 0.1} ${y - r * 0.75} ${x + r * 0.2} ${y - r * 0.7}`, 7, "{{hairLight}}"),
    4
  )

const HAIR: Asset[] = [
  hair("hair_cascade", "Cascading waves", {
    hairBack: shaded(
      "hair-cascade-back",
      CASCADE_BACK,
      "hair",
      tone("M400 480 C372 700 420 920 512 1020 C604 920 652 700 624 480 Z", "hairDeep") +
        tone("M640 200 C760 360 700 700 790 1000 L820 1000 L820 200 Z", "hairShade") +
        strands("M292 560 C322 660 262 760 300 860 C320 920 300 980 322 1036", "M354 620 C384 720 324 820 364 920", "M732 560 C702 660 762 760 724 860 C704 920 724 980 702 1036", "M670 620 C640 720 700 820 660 920"),
      4.5
    ),
    hairFront:
      FRINGE_SHADOW +
      shaded("hair-cascade-wl", WAVE_L, "hair", tone("M350 420 L420 420 L400 920 L340 920 Z", "hairShade") + strands("M334 470 C318 560 348 640 330 720 C318 790 342 840 330 890")) +
      shaded("hair-cascade-wr", WAVE_R, "hair", tone("M690 420 L760 420 L760 900 L712 900 Z", "hairShade") + strands("M690 470 C708 560 678 640 700 720 C712 790 690 830 708 870")) +
      cap("cascade") +
      SWEPT_BANGS +
      shine("M372 262 Q512 170 652 262"),
  }),
  hair("hair_tousled", "Tousled", {
    hairBack: shaded(
      "hair-tousled-back",
      "M330 360 C300 460 316 560 356 624 C396 656 440 664 472 652 L552 652 C584 664 628 656 668 624 C708 560 724 460 694 360 C650 200 374 200 330 360 Z",
      "hair",
      tone("M600 200 C700 300 720 500 680 660 L760 660 L760 200 Z", "hairShade"),
      4
    ),
    hairFront:
      FRINGE_SHADOW +
      cap("tousled", TOUSLE_CAP, TOUSLE_OUTER) +
      lock(360, 380, 400, 340, 326, 606, -26) +
      lock(330, 330, 390, 290, 316, 546, -18) +
      lock(372, 292, 440, 270, 366, 462, -20) +
      lock(420, 276, 492, 264, 440, 432, 6) +
      lock(530, 268, 600, 280, 598, 424, 22) +
      lock(470, 268, 540, 266, 522, 478, 28) +
      lock(580, 282, 650, 310, 664, 444, 16) +
      lock(640, 310, 700, 350, 714, 566, 8) +
      stroke("M540 118 C562 90 592 86 608 98", 4, "{{hairLine}}") +
      shine("M384 250 Q512 176 640 250"),
  }),
  hair("hair_hime", "Hime cut", {
    hairBack: shaded(
      "hair-hime-back",
      HIME_BACK,
      "hair",
      tone("M630 200 C700 360 720 700 740 1110 L780 1110 L780 200 Z", "hairShade") +
        tone("M420 640 L604 640 L604 1110 L420 1110 Z", "hairDeep") +
        strands("M320 520 L312 1080", "M360 560 L356 1090", "M664 560 L668 1090", "M704 520 L712 1080"),
      4.5
    ),
    hairFront:
      FRINGE_SHADOW +
      sym(shaded("hair-hime-side", HIME_SIDE, "hair", tone("M372 318 L400 318 L400 730 L366 730 Z", "hairShade") + strands("M346 360 L344 700", "M370 360 L372 704"))) +
      cap("hime") +
      shaded("hair-hime-bangs", HIME_BANGS, "hair", tone("M330 370 L700 370 L700 410 L330 410 Z", "hairShade") + strands("M400 280 L396 384", "M456 272 L452 392", "M512 268 L514 394", "M568 272 L572 392", "M624 280 L628 384"), 4) +
      shine("M372 262 Q512 170 652 262"),
  }),
  hair("hair_twintails", "Twin tails", {
    hairBack:
      sym(
        shaded("hair-twin-tail", TAIL, "hair", tone("M300 250 L380 250 L330 960 L270 960 C300 800 280 500 300 250 Z", "hairShade") + strands("M262 380 C250 480 286 560 268 660 C252 760 278 830 258 900", "M300 420 C300 520 288 600 296 700")) +
          `<ellipse cx="362" cy="262" rx="26" ry="20" fill="{{hairDeep}}" stroke="{{hairLine}}" stroke-width="3.5"/>`
      ) + shaded("hair-twin-nape", BOB_BACK, "hair", tone("M600 200 L760 200 L760 640 L660 640 Z", "hairShade"), 4),
    hairFront: FRINGE_SHADOW + cap("twin") + SWEPT_BANGS + shine("M372 262 Q512 170 652 262"),
  }),
  hair("hair_ponytail", "High ponytail", {
    hairBack:
      shaded("hair-pony-tail", PONY_TAIL, "hair", tone("M680 200 C760 360 700 600 760 900 L800 900 L800 200 Z", "hairShade") + strands("M560 120 C680 160 730 280 720 400 C712 520 740 600 724 700", "M600 90 C700 140 740 240 736 340")) +
      shaded("hair-pony-nape", BOB_BACK, "hair", tone("M600 200 L760 200 L760 640 L660 640 Z", "hairShade"), 4),
    hairFront:
      cap("pony", SLEEK_CAP, "M322 470 C300 262 392 136 512 136 C632 136 724 262 702 470") +
      stroke("M322 470 C334 380 374 300 512 290 C650 300 690 380 702 470", 3, "{{hairShade}}") +
      stroke("M380 300 C420 200 470 160 512 150", 3, "{{hairShade}}") +
      stroke("M644 300 C604 200 554 160 512 150", 3, "{{hairShade}}") +
      lock(338, 330, 420, 282, 348, 494, -8) +
      lock(598, 282, 690, 330, 694, 460, 10) +
      `<ellipse cx="512" cy="146" rx="30" ry="16" fill="{{hairDeep}}" stroke="{{hairLine}}" stroke-width="3.5"/>` +
      shine("M384 250 Q512 180 640 250"),
  }),
  hair("hair_wolf", "Wolf cut", {
    hairBack: shaded(
      "hair-wolf-back",
      WOLF_BACK,
      "hair",
      tone("M620 200 C700 340 720 560 740 780 L780 780 L780 200 Z", "hairShade") + tone("M430 560 L594 560 L594 720 L430 720 Z", "hairDeep"),
      4.5
    ),
    hairFront:
      FRINGE_SHADOW +
      cap("wolf", TOUSLE_CAP, TOUSLE_OUTER) +
      lock(326, 340, 380, 300, 298, 626, -14) +
      lock(360, 310, 430, 280, 378, 474, -12) +
      lock(420, 280, 500, 266, 448, 444, 4) +
      lock(490, 266, 560, 268, 540, 436, 10) +
      lock(550, 270, 620, 290, 604, 454, 18) +
      lock(610, 292, 680, 330, 674, 526, 12) +
      lock(650, 330, 702, 362, 742, 646, 14) +
      lock(318, 560, 346, 520, 276, 690, -10) +
      lock(678, 520, 706, 560, 750, 690, 10) +
      shine("M384 250 Q512 176 640 250"),
  }),
  hair("hair_sweep", "Side sweep", {
    // The shaved sides read darker than the swept top.
    hairBack: `<path d="M340 360 C320 450 340 540 380 592 L644 592 C684 540 704 450 684 360 C640 210 384 210 340 360 Z" fill="{{hairDeep}}" stroke="{{hairLine}}" stroke-width="4"/>`,
    hairFront:
      shaded(
        "hair-sweep-top",
        SWEEP,
        "hair",
        tone("M320 480 C380 420 440 360 520 320 C600 300 680 330 720 390 L720 600 L320 600 Z", "hairShade") +
          strands("M360 520 C400 400 470 300 600 250", "M340 420 C360 300 440 190 560 150", "M430 470 C470 380 540 300 660 280", "M500 140 C600 130 680 160 720 230"),
        4.5
      ) +
      `<path d="M662 332 C702 362 714 422 706 470 L692 470 C690 422 678 382 652 352 Z" fill="{{hairDeep}}" stroke="{{hairLine}}" stroke-width="3"/>` +
      shine("M380 300 Q470 170 640 190"),
  }),
  hair("hair_buns", "Space buns", {
    hairBack: shaded("hair-buns-back", BOB_BACK, "hair", tone("M600 200 L760 200 L760 640 L660 640 Z", "hairShade"), 4),
    hairFront:
      bun("hair-buns-l", 376, 176, 72) +
      bun("hair-buns-r", 648, 176, 72) +
      FRINGE_SHADOW +
      cap("buns") +
      lock(348, 306, 424, 276, 360, 440, -6) +
      lock(410, 280, 490, 264, 430, 390, 8) +
      lock(474, 264, 554, 264, 510, 398, 10) +
      lock(534, 266, 614, 280, 588, 388, 14) +
      lock(598, 280, 680, 312, 670, 450, 10) +
      shine("M396 262 Q512 196 628 262"),
  }),
  hair("hair_curly_bob", "Curly bob", {
    hairBack: curls("hair-curly-b", 512, 400, 196, 66, 12, 150, 390),
    hairFront:
      FRINGE_SHADOW +
      cap("curly") +
      curls("hair-curly-f", 512, 470, 190, 44, 9, 200, 340) +
      clip("hair-curly-top", CAP, curls("hair-curly-t", 512, 330, 150, 40, 7, 200, 340)),
  }),
]

const RIBBON_L = "M354 250 C300 176 226 188 232 252 C236 304 300 312 354 250 Z"
const RIBBON_R = "M354 250 C384 168 456 168 458 232 C458 294 392 304 354 250 Z"

/** A five-petal flower centred on (x, y). */
function flower(id: string, x: number, y: number, r: number) {
  let petals = ""
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180)
    petals += `<ellipse cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" rx="${r * 0.46}" ry="${r * 0.36}" transform="rotate(${i * 72} ${(x + Math.cos(a) * r * 0.62).toFixed(1)} ${(y + Math.sin(a) * r * 0.62).toFixed(1)})" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="3"/>`
  }
  return `<g id="${id}">${petals}<circle cx="${x}" cy="${y}" r="${r * 0.26}" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="3"/></g>`
}

const HAIR_ACCESSORIES: Asset[] = [
  {
    id: "hairacc_ribbon",
    name: "Ribbon bow",
    slot: "hairAccessory",
    colors: { primary: "#8f1d2c", trim: "#d4af37" },
    layers: {
      headwear:
        shaded("hairAccessory-tail", "M344 262 L300 400 L326 386 L340 414 L366 270 Z", "primary", tone("M340 262 L380 262 L360 420 L330 420 Z", "primaryShade")) +
        shaded("hairAccessory-l", RIBBON_L, "primary", tone("M230 250 C260 300 320 300 354 250 L354 320 L230 320 Z", "primaryShade") + stroke("M250 230 C280 216 316 224 340 244", 5, "{{trim}}")) +
        shaded("hairAccessory-r", RIBBON_R, "primary", tone("M400 200 L470 200 L470 310 L380 310 Z", "primaryShade") + stroke("M372 232 C392 196 430 190 448 210", 5, "{{trim}}")) +
        `<ellipse cx="354" cy="252" rx="24" ry="28" fill="{{primaryShade}}" stroke="{{primaryLine}}" stroke-width="4"/>`,
    },
  },
  {
    id: "hairacc_flowers",
    name: "Flower pins",
    slot: "hairAccessory",
    colors: { primary: "#f2efe8", trim: "#d4af37" },
    layers: {
      headwear:
        stroke("M636 282 Q660 300 680 330", 4, "#3f6b3a") +
        `<path d="M664 318 C684 300 706 306 712 322 C694 330 676 330 664 318 Z" fill="#4f8a47" stroke="#2d4f2a" stroke-width="3"/>` +
        flower("hairAccessory-f1", 632, 286, 42) +
        flower("hairAccessory-f2", 690, 340, 34) +
        flower("hairAccessory-f3", 604, 340, 28),
    },
  },
]

export const HAIR_ASSETS: Asset[] = [...HAIR, ...HAIR_ACCESSORIES]
