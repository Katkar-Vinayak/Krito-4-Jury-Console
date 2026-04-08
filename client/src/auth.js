import { supabase } from "./supabaseClient";

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data?.session || null;
};

export const getAccessToken = async () => {
  const session = await getSession();
  return session?.access_token || "";
};

export const validateUserAccess = async (email) => {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();
  const { data, error } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.email);
};
