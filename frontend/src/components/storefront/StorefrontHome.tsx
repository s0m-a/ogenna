import { HeroGrid } from './HeroGrid'
import { EditorialSplit } from './EditorialSplit'
import { ServiceStrip } from './ServiceStrip'
import { FeaturedProducts } from './FeaturedProducts'
import { PromoSplit } from './PromoSplit'
import { ShopByPrint } from './ShopByPrint'
import { NewFabricsShowcase } from './NewFabricsShowcase'
import { LastMetersInStock } from './LastMetersInStock'
import { MadeForMakers } from './MadeForMakers'
import { CategoryGrid } from './CategoryGrid'

export function StorefrontHome() {
  return (
    <>
      <HeroGrid />
      <EditorialSplit />
      <ServiceStrip />
      <FeaturedProducts />
      <PromoSplit />
      <ShopByPrint />
      <NewFabricsShowcase />
      <LastMetersInStock />
      <MadeForMakers />
      <CategoryGrid />
    </>
  )
}
