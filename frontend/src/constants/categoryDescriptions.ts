
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  default:
    'Explore our hand-picked selection of fabrics, chosen for how they drape, feel, and age with use.',

  cotton:
    'Discover our collection of high-quality cotton fabrics, each offering unique textures and versatility for your sewing projects. From soft and breathable to rich and structured, our cotton options are perfect for a range of creations.',

  linen:
    'Breezy, textured and quietly elegant — our linen fabrics soften with every wash and bring a relaxed, lived-in feel to anything you make.',

  muslin:
    'Lightweight muslin in soft weaves and gentle prints. Perfect for baby essentials, summer layers, and delicate home projects.',

  jersey:
    'Soft, stretchy knits that move with the body. Ideal for tees, loungewear, and comfortable everyday pieces.',

  knits:
    'A curated selection of knit fabrics with just the right stretch and recovery — reliable choices for your wardrobe staples.',

  'french-terry':
    'A cosy, absorbent knit with a smooth outside and looped inside. The go-to for sweatshirts, hoodies and weekend wear.',

  viscose:
    'Fluid, drapey viscose fabrics with a soft hand feel. Our viscose range brings quiet movement to blouses, dresses and skirts.',

  'linen-viscose':
    'The breathability of linen blended with the drape of viscose. A soft, flattering fabric that works year-round.',

  poplin:
    'Crisp, finely woven poplin with a smooth finish. A dependable base for shirts, dresses, and structured pieces.',

  seersucker:
    'Light and puckered, seersucker brings a touch of texture and keeps its shape wash after wash.',

  'kids-prints':
    'Playful prints and gentle colours chosen with little ones in mind. Soft on skin, sweet on makes.',

  'mystery-box':
    'A curated bundle of our favourite fabric cuts, delivered as a surprise. A lovely way to discover something new.',

  new:
    'Fresh arrivals from the studio  the newest fabrics we’ve added, hot off the loom.',

  sale:
    'A rotating edit of fabrics at a kinder price. Grab them while they last.',

  vintage:
    'Pieces inspired by heritage textiles — timeless patterns and finishes that feel considered and rare.',
}

export function getCategoryDescription(slug?: string): string {
  if (!slug) return CATEGORY_DESCRIPTIONS.default
  return CATEGORY_DESCRIPTIONS[slug] ?? CATEGORY_DESCRIPTIONS.default
}
