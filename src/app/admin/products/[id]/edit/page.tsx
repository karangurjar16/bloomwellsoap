"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorState, ListSkeleton } from "@/components/admin/States";
import { getProduct, type AdminProduct } from "@/services/admin/products";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      const result = await getProduct(params.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setProduct(result.data);
    }
    void load();
  }, [params.id]);

  return (
    <>
      <Link
        href="/admin/products"
        className="-ml-1 mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Products
      </Link>

      <PageTitle eyebrow="Edit" title={product?.name ?? "Product"} />

      {error && <ErrorState message={error} />}

      {!error &&
        (product === null ? (
          <ListSkeleton rows={5} />
        ) : (
          // key remounts the form if the id changes, so state can't leak
          // between two products.
          <ProductForm key={product.id} product={product} />
        ))}
    </>
  );
}
