import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [platformAdminLoading, setPlatformAdminLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  async function loadPlatformAdminFlag(userId) {
    if (!userId) {
      setIsPlatformAdmin(false);
      setPlatformAdminLoading(false);
      return;
    }
    setPlatformAdminLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', userId)
      .single();
    setIsPlatformAdmin(!!data?.is_platform_admin);
    setPlatformAdminLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadPlatformAdminFlag(session?.user?.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      loadPlatformAdminFlag(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login  = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = () => supabase.auth.signOut();

  async function register(email, password, fullName, phone) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    // Profil telefon ve ad güncelle (trigger profil satırını oluşturur, biz güncelliyoruz)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:        data.user.id,
        full_name: fullName,
        phone,
      });
    }
    return { data, error: null };
  }

  return (
    <AuthContext.Provider value={{ user, loading, isPlatformAdmin, platformAdminLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
