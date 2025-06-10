'use client';

import dynamic from 'next/dynamic';

// 動態引入組件，並在客戶端組件中設置 ssr: false
const ProductReviewPageClient = dynamic(() => import('@/components/admin/ProductReviewPageClient'), { 
  ssr: false 
});

export default function ProductReviewPageWrapper() {
  return <ProductReviewPageClient />;
} 