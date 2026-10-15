"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPrefs } from "@/lib/user-prefs";
import { useAuth } from "@/lib/auth-store";

export default function ReturningWorkspace() {
  const { isSetup } = useUserPrefs();
  const { loading, configured, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (user || (!configured && isSetup))) router.replace("/hub");
  }, [loading, configured, user, isSetup, router]);
  return null;
}
