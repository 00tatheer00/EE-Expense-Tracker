/** Minimal browser-side stand-in for Supabase in demo mode. */
export function createDemoBrowserClient() {
  const demoErr = { message: "Demo mode: pick one of the demo users above to sign in." };
  return {
    auth: {
      async signInWithPassword() {
        return { data: null, error: demoErr };
      },
      async resetPasswordForEmail() {
        return { data: null, error: { message: "Password reset is disabled in demo mode." } };
      },
      async updateUser() {
        return { data: {}, error: null };
      },
    },
    storage: {
      from: () => ({
        // Files are not stored in demo mode; a sample receipt is shown instead.
        async upload() {
          await new Promise((r) => setTimeout(r, 400));
          return { data: {}, error: null };
        },
      }),
    },
  };
}
