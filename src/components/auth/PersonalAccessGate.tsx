"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { isAllowedPersonalUser, isPersonalHost } from "@/lib/personal-access";

const subscribe = () => () => {};
const personalBrowser = () => isPersonalHost(window.location.host);

/** Hide previously loaded workspace content after sign-out/account changes. */
export default function PersonalAccessGate({
  children,
  allowLogin = true,
  initialIsPersonal = false,
}: {
  children: ReactNode;
  allowLogin?: boolean;
  initialIsPersonal?: boolean;
}) {
  const personal = useSyncExternalStore(
    subscribe,
    personalBrowser,
    () => initialIsPersonal,
  );
  const path = usePathname();
  const { user, loading, configured } = useAuth();
  if (!personal || (allowLogin && path === "/login")) return <>{children}</>;
  if (loading)
    return allowLogin ? (
      <p className="p-8 text-sm text-muted-foreground">Checking access…</p>
    ) : null;
  if (configured && isAllowedPersonalUser(user)) return <>{children}</>;
  if (!allowLogin) return null;
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="font-display text-2xl font-bold">
        {user ? "Access denied" : "Sign in required"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This workspace is restricted to approved Google accounts.
      </p>
      <Link
        className="mt-5 inline-block text-primary hover:underline"
        href="/login"
      >
        Go to sign in
      </Link>
    </div>
  );
}
