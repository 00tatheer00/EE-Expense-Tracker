"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO } from "@/lib/demo/config";

/**
 * Keeps every open screen up to date:
 *  - live: when anyone adds / edits / deletes an expense or category, all open
 *    screens refresh within ~1 second (Supabase Realtime, respects RLS);
 *  - when you come back to the tab / app after being away.
 */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const refresh = (delay = 400) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastRefresh.current = Date.now();
        router.refresh();
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh.current > 5000) refresh(0);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    let cleanupRealtime = () => {};
    if (!DEMO) {
      const supabase = createClient();
      let channel: ReturnType<typeof supabase.channel> | null = null;
      let cancelled = false;

      // Realtime must use the signed-in user's token (not the anonymous key),
      // otherwise row-level security filters out every event.
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled || !data.session) return;
        supabase.realtime.setAuth(data.session.access_token);
        channel = supabase
          .channel("live-expenses")
          .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => refresh())
          .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => refresh())
          .subscribe();
      });
      const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) supabase.realtime.setAuth(session.access_token);
      });

      cleanupRealtime = () => {
        cancelled = true;
        authSub.subscription.unsubscribe();
        if (channel) supabase.removeChannel(channel);
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (timer.current) clearTimeout(timer.current);
      cleanupRealtime();
    };
  }, [router]);

  return null;
}
