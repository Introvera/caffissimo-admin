"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EditOfferRedirectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOfferRedirectPage({ params }: EditOfferRedirectPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/admin/offers/${resolvedParams.id}?edit=true`);
    }
  }, [resolvedParams.id, router]);

  return null;
}
