import { supabase } from "@/lib/supabase";
export const login = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const register = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const logout = async () => {
  return await supabase.auth.signOut();
};