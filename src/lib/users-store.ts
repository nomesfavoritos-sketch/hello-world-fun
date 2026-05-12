export type Role = "admin" | "manager" | "pos" | "kitchen" | "rider";

export type AppUser = {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-digit pin
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: number;
};

const USERS_KEY = "bj_users";
const SESSION_KEY = "bj_session";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  pos: "POS / Cashier",
  kitchen: "Kitchen",
  rider: "Rider",
};

export const ROLE_NAV: Record<Role, string[]> = {
  admin: ["/dashboard", "/", "/tables", "/menu", "/kitchen", "/delivery", "/online-orders", "/reports", "/users", "/settings"],
  manager: ["/dashboard", "/", "/tables", "/menu", "/kitchen", "/delivery", "/online-orders", "/reports", "/settings"],
  pos: ["/dashboard", "/", "/tables", "/menu", "/online-orders"],
  kitchen: ["/dashboard", "/kitchen", "/online-orders"],
  rider: ["/dashboard", "/delivery"],
};

export const ROLE_HOME: Record<Role, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  pos: "/",
  kitchen: "/kitchen",
  rider: "/delivery",
};

const DEFAULT_USERS: AppUser[] = [
  { id: "u_admin", name: "Owner Admin", username: "admin", pin: "1234", role: "admin", active: true, createdAt: Date.now() },
];

export function getUsers(): AppUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw) as AppUser[];
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(u: Omit<AppUser, "id" | "createdAt">): AppUser {
  const users = getUsers();
  if (users.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  const nu: AppUser = { ...u, id: "u_" + Math.random().toString(36).slice(2, 9), createdAt: Date.now() };
  saveUsers([nu, ...users]);
  return nu;
}

export function updateUser(id: string, patch: Partial<AppUser>) {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(users);
}

export function deleteUser(id: string) {
  saveUsers(getUsers().filter((u) => u.id !== id));
}

export function login(username: string, pin: string): AppUser | null {
  const u = getUsers().find(
    (x) => x.username.toLowerCase() === username.toLowerCase() && x.pin === pin && x.active,
  );
  if (!u) return null;
  localStorage.setItem(SESSION_KEY, u.id);
  return u;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

export function canAccess(user: AppUser | null, path: string): boolean {
  if (!user) return false;
  return ROLE_NAV[user.role].includes(path);
}
