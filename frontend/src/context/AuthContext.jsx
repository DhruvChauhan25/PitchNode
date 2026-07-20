import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
    loginApi,
    registerApi,
    logoutApi,
    meApi,
    getToken,
    clearTokens,
    ROLES,
} from "../api/authApi"

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if(!getToken()){
                setLoading(false);
                return;
            }
            try{
                const me = await meApi();
                if(!cancelled) setUser(me);
            } catch {
                clearTokens();
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled=true;
        };
    }, []);

    const login = useCallback(async (credentials) => {
        const me = await loginApi(credentials);
        setUser(me);
        return me;
    }, [])

    const register = useCallback(async (payload) => {
        const me = await registerApi(payload);
        setUser(me);
        return me;
    }, []);

    const logout = useCallback(async () => {
        await logoutApi();
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === ROLES.ADMIN,
        isExpert: user?.role === ROLES.EXPERT,
        isApplicant: user?.role === ROLES.EXPERT_APPLICANT,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
