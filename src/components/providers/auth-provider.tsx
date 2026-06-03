"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import Cookies from "js-cookie";
import { auth } from "@/lib/firebase";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import { fetchCurrentUser, logout } from "@/stores/slices/authSlice";
import { usePathname, useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const pathname = usePathname();
  const router = useRouter();

  // Background Firebase ID Token auto-refresher to prevent 1-hour logouts
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken(true); // Force refresh if expired/needed
          Cookies.set("auth_token", freshToken, { expires: 7 });
        } catch (error) {
          console.error("Error auto-refreshing Firebase ID token:", error);
        }
      } else {
        // If Firebase says we are signed out but Redux/Cookie thinks we are authenticated, clear it
        if (isAuthenticated || Cookies.get("auth_token")) {
          dispatch(logout());
        }
      }
    });
    return () => unsubscribe();
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // If we have a token (isAuthenticated) but no user profile rehydrated yet
    if (isAuthenticated && !user && !isLoading) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, user, isLoading]);

  // Handle client-side redirect when logged out
  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    const token = Cookies.get("auth_token");

    if (isAdminRoute && (!isAuthenticated || !token)) {
      // Ensure we clear client state if cookie/Redux state is out of sync
      if (isAuthenticated && !token) {
        dispatch(logout());
      }
      router.push("/auth/login");
    }
  }, [isAuthenticated, pathname, router, dispatch]);

  return <>{children}</>;
}

