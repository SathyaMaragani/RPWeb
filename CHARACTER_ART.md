# Character art

How RPWeb characters are drawn, and how to add or replace artwork.

A character's look is saved as a **configuration**: which asset fills each slot, in
which colours. Pictures are drawn from that on demand (studio preview, thumbnails,
and `/api/characters/[id]/portrait`). Redrawing an asset changes every character
that uses it, and nobody's saved look is lost.

## Art direction

Stylised 2D fantasy illustration, original to RPWeb.

- **Proportions:** about three heads tall. A large, expressive head on an elegant,
  narrow body, so faces stay readable at avatar size.
- **Line:** each shape is outlined in a darker version of its own colour
  (`{{primaryLine}}`, `{{hairLine}}`...), 3.5–5 px on the canvas. Small details
  use thinner lines; nothing gets a heavy black outline.
- **Shading:** flat cel shading. A base colour, one shadow tone (`Shade`), a deeper
  tone for creases and overlaps (`Deep`) and a restrained highlight (`Light`).
  Light comes from the **upper left**: shadows fall to the right and under
  overlapping parts. No photoreal gradients, no 3D look.
- **Colour:** characters have their own palettes, independent of the purple UI.
  Every garment is recolourable, so design shapes and construction, not colours.
- **Silhouette first:** a hairstyle, coat or pair of horns should be recognisable
  as a solid shape before any detail is added.

## Canvas and pose

Every asset is drawn on a **1024 × 1536** canvas (`viewBox="0 0 1024 1536"`) against
one standing pose:

| Landmark | Position |
| --- | --- |
| Centre line | x = 512 |
| Head | crown y ≈ 176, chin y ≈ 630, cheeks x ≈ 334–690 |
| Eyes | centres (448, 446) and (576, 446) |
| Brows / nose / mouth | y ≈ 355 / (512, 505) / (512, 552) |
| Ear lobes | (324, 490) and (700, 490) |
| Neck | x 484–540, y 596–672 |
| Shoulder tips | (380, 730) and (644, 730) |
| Waist / hips | y ≈ 920 / y ≈ 1010 |
| Hands | centres (366, 1024) and (658, 1024); held items use the right hand |
| Knees / ankles / soles | y ≈ 1230 / 1420 / 1480 |

Body types stretch the body layers horizontally about x = 512 (slim 0.9, broad
1.16). Draw clothing for the average body and it fits the others. The head and
everything on it are never stretched.

The avatar is the square `197 90 630 630` (head and shoulders). Anything that
defines a character, such as horns, hats, ears and hair, should read inside it.

## Layers

Assets draw into named layers, painted back to front:

`back` → `hairBack` → `body` → `legs` → `feet` → `torso` → `vest` → `waist` →
`outer` → `gloves` → `neck` → `head` → `face` → `ears` → `eyewear` → `hairFront` →
`horns` → `headwear` → `hand`

| Layer | Used for |
| --- | --- |
| `back` | wings, tails, halo, the back of a cloak |
| `hairBack` / `hairFront` | every hairstyle has both: the mass behind the head, and the fringe and locks in front |
| `body` | the figure (skin) |
| `legs` / `feet` | bottoms / shoes (boots go over trousers) |
| `torso` | tops and dresses |
| `vest` / `waist` / `outer` | vests and armour / belts / coats and cloaks, so they layer freely |
| `gloves` | gloves, then bracelets |
| `neck` | necklaces |
| `head` / `face` | ears, face shape and face details / eyes, brows, mouth |
| `ears` | earrings, animal ears |
| `eyewear` | glasses, masks |
| `horns` / `headwear` | horns / hats and hair accessories |
| `hand` | weapons and anything held |

Only real conflicts remove each other: a dress clears a top and bottom. Shirt,
vest, belt, coat and gloves all combine.

## Colours

Write colours as tokens. Each base has five variants:

| Base | Variants | Set by |
| --- | --- | --- |
| `skin`, `hair`, `eyes` | `X`, `XShade`, `XDeep`, `XLight`, `XLine` | the character |
| `primary`, `secondary`, `trim` | same | the asset, per character |

`primary` is the main fabric, `secondary` the second fabric or lining, and `trim`
the decoration (embroidery, buttons, piping). An asset that paints `primary`,
`secondary` or `trim` must declare starting colours for them. Mark metal items
`metal` so they are offered metal swatches.

## Adding artwork from a drawing program

Draw in any vector editor, export plain SVG, and import:

```
art/characters/<slot>/<asset-id>/
  asset.json       { "name": "Royal long coat", "colors": { "primary": "#1f2f6b", "trim": "#d4af37" }, "metal": false }
  outer.svg        one file per layer the asset uses, named after the layer
```

```bash
node scripts/import-character-art.mjs
```

This writes `src/lib/appearance/assets/imported.ts`. **An imported asset with the
same id as a built-in one replaces it.** That is how a drawn version stands in for
a coded one without touching anyone's saved characters. New ids appear as new
items.

Paint recolourable regions in these **key colours**. The importer turns them into
tokens; every other colour stays as drawn.

| Token base | Base | Shade | Deep | Light | Line |
| --- | --- | --- | --- | --- | --- |
| primary | `#ff0000` | `#cc0000` | `#990000` | `#ff8080` | `#4d0000` |
| secondary | `#00ff00` | `#00cc00` | `#009900` | `#80ff80` | `#004d00` |
| trim | `#0000ff` | `#0000cc` | `#000099` | `#8080ff` | `#00004d` |
| skin | `#ffcc99` | `#e6a870` | `#b37d4d` | `#ffe6cc` | `#663d1f` |
| hair | `#ff00ff` | `#cc00cc` | `#990099` | `#ff80ff` | `#4d004d` |
| eyes | `#00ffff` | `#00cccc` | `#009999` | `#80ffff` | `#004d4d` |

The importer refuses files that:

- are not on the standard canvas;
- contain scripts, event handlers, `foreignObject` or external links (embedded PNG/WebP data is allowed);
- paint a colour slot without giving it a starting colour.

It prefixes every id so assets never collide. Slots are the ids in `SLOTS`
(`src/lib/appearance/core.ts`); folder names use `a-z`, `0-9` and `_`.

Assets can also be written directly in code in `src/lib/appearance/assets/*.ts`,
using the helpers in `core.ts` (`shaded`, `lock`, `sym`...). Ids of elements in
coded assets must start with the slot name.

## Checklist for a new asset

- [ ] Lines up with the pose above on all three body types
- [ ] Hair has both `hairBack` and `hairFront`, and the fringe covers the hairline
- [ ] Reads in the avatar crop, if it is worn on the head or neck
- [ ] Looks right in dark, light and saturated colour choices
- [ ] Layers correctly with neighbours (shirt under vest under coat; boots over trousers)
- [ ] Shading follows the upper-left light

## Current library

90 assets and 8 starting looks (elegant noble, dark fantasy, cute fantasy,
adventurer, mage, warrior, modern, mysterious).

**Finished, consistent vector assets (72):** face shapes, eyes, brows, mouths,
face details, ears, all clothing (tops, vests and armour, belts, coats and cloaks,
bottoms, dresses, gloves, shoes), jewellery, glasses, masks, headwear, hair
accessories, weapons, horns, halo.

**Working, but should get a professional art pass first (18):**

- **Hairstyles (9):** the locks are geometric. Hair carries most of a character's identity, so this matters most.
- **Body types (3):** the pose is stiff and the hands are simple.
- **Wings, tails, animal ears (6).**

Replace them by importing drawn versions under the same ids.
