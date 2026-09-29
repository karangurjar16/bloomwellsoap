import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <Link
        href="/admin/products"
        className="-ml-1 mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Products
      </Link>

      <PageTitle eyebrow="New" title="Add product" />
      <ProductForm />
    </>
  );
}
