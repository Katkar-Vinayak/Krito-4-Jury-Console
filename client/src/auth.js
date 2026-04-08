import { supabase } from "./supabaseClient";

const allowedEmails = (import.meta.env.VITE_ALLOWED_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }

  return data;
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
  return data.session || null;
};

export const validateUserAccess = async (email) => {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  if (allowedEmails.includes(normalized)) {
    return true;
  }

  const { data, error } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
};

export const getAccessToken = async () => {
  const session = await getSession();
  return session?.access_token || null;
};
