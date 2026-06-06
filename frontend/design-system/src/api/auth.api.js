import { getSupabase } from '../lib/supabase';

// All authentication flows go through Supabase Auth. The legacy Node
// endpoints (/api/v1/auth/*) are no longer called from the frontend.
export const authApi = {
  async signup(payload) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: { full_name: payload.full_name } },
    });
    if (error) throw error;
    return data;
  },
  async login(payload) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error) throw error;
    return data;
  },
  async logout() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { ok: true };
  },
  async refreshToken() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  },
  async getMe() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  },
  async forgotPassword(payload) {
    const supabase = getSupabase();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, { redirectTo });
    if (error) throw error;
    return { ok: true };
  },
  async resetPassword(payload) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password: payload.new_password || payload.password });
    if (error) throw error;
    return { ok: true };
  },
};

authApi.refresh = authApi.refreshToken;
authApi.me = authApi.getMe;

export default authApi;
