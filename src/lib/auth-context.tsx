"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// localStorage 中存储 token 的键名
const TOKEN_KEY = "randu_token";

// 用户信息类型（对应 /api/user/profile 返回结构）
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  role: "user" | "admin" | "super_admin";
  credits: number;
  totalUsed: number;
  trialExpiresAt: string;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  createdAt: string;
  isTrialExpired: boolean;
  daysRemaining: number;
}

// AuthContext 提供的值
interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * 使用 token 调用 /api/user/profile 获取用户信息
 * 成功返回 User，失败返回 null
 */
async function fetchUserProfile(token: string): Promise<User | null> {
  try {
    const res = await fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

/**
 * AuthProvider：登录状态管理组件
 * - 初始化时从 localStorage 读取 token，若有则获取用户信息
 * - login(token)：保存 token 并获取用户信息
 * - logout()：清除 token 和用户信息
 * - refreshUser()：重新获取用户信息
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从 localStorage 读取 token
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    // 同步到 cookie，让 middleware/proxy 能检测到登录状态（兼容老用户）
    document.cookie = `token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    // 延迟 setToken 到微任务，避免 effect 内同步 setState
    Promise.resolve().then(() => setToken(storedToken));
    fetchUserProfile(storedToken).then((profile) => {
      if (profile) {
        setUser(profile);
      } else {
        // token 无效，清除
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = "token=; path=/; max-age=0";
        setToken(null);
      }
      setLoading(false);
    });
  }, []);

  // 登录：保存 token 到 localStorage 并获取用户信息（httpOnly cookie 由 API 下发）
  const login = useCallback(async (newToken: string) => {
    // token 已由 API 通过 Set-Cookie httpOnly cookie 自动设置
    // localStorage 仅作为前端状态备份（API 鉴权优先读 cookie）
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const profile = await fetchUserProfile(newToken);
    setUser(profile);
  }, []);

  // 登出：清除 localStorage token、cookie 和用户信息
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    // 清除前端 cookie（兜底）
    document.cookie = "token=; path=/; max-age=0";
    // 调用登出 API 清除 httpOnly cookie
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!token) return;
    const profile = await fetchUserProfile(token);
    if (profile) {
      setUser(profile);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 导出 AuthContext 供 useAuth hook 使用
export { AuthContext };
