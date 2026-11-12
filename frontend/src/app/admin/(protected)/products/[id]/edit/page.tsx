import { ProductForm } from '@/components/features/products/ProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit product' }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  return <ProductForm productId={id} />
}
