import SellerNav from '@/components/seller/SellerNav';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SellerNav />
      <main>{children}</main>
    </div>
  );
} 