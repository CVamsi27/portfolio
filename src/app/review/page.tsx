"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
function ReviewRedirect() {
  const router = useRouter(),
    params = useSearchParams();
  useEffect(() => {
    const q = new URLSearchParams(params.toString());
    q.set("view", "reflection");
    router.replace(`/dashboard?${q}`);
  }, [router, params]);
  return <p className="p-8">Opening reflection…</p>;
}
export default function ReviewPage() {
  return (
    <Suspense fallback={<p>Opening reflection…</p>}>
      <ReviewRedirect />
    </Suspense>
  );
}
