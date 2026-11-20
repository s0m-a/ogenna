import { SwatchBookHero } from './SwatchBookHero'
import { EditorialSplit } from './EditorialSplit'
import { ServiceStrip } from './ServiceStrip'
import { FeaturedProducts } from './FeaturedProducts'
import { PromoSplit } from './PromoSplit'
import { ShopByPrint } from './ShopByPrint'
import { NewFabricsShowcase } from './NewFabricsShowcase'
import { LastMetersInStock } from './LastMetersInStock'
import { MadeForMakers } from './MadeForMakers'
import { CategoryGrid } from './CategoryGrid'
import { Reveal } from '@/components/common/Reveal'

export function StorefrontHome() {
  return (
    <>
      <SwatchBookHero />
      <Reveal><EditorialSplit /></Reveal>
      <Reveal><ServiceStrip /></Reveal>
      <Reveal><FeaturedProducts /></Reveal>
      <Reveal><PromoSplit /></Reveal>
      <Reveal><ShopByPrint /></Reveal>
      <Reveal><NewFabricsShowcase /></Reveal>
      <Reveal><LastMetersInStock /></Reveal>
      <Reveal><MadeForMakers /></Reveal>
      <Reveal><CategoryGrid /></Reveal>
    </>
  )
}
