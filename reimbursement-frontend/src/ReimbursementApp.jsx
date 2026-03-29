import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = "http://localhost:8000/api";

// ─── AUTH CONTEXT ──────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rm_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("rm_token") || null);

  const login = (userData, accessToken) => {
    setUser(userData); setToken(accessToken);
    localStorage.setItem("rm_user", JSON.stringify(userData));
    localStorage.setItem("rm_token", accessToken);
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("rm_user"); localStorage.removeItem("rm_token");
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}

// ─── API HELPER ────────────────────────────────────────────────────────────
function useApi() {
  const { token, logout } = useAuth();
  return useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 401) { logout(); throw new Error("Unauthorized"); }
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
  }, [token, logout]);
}

// ─── TOAST ─────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: t.type === "error" ? "#ff4d6d" : t.type === "success" ? "#06d6a0" : "#3a86ff",
          color: "#fff", padding: "12px 20px", borderRadius: 10, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: 320, animation: "slideIn .2s ease"
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, remove, success: m => add(m, "success"), error: m => add(m, "error"), info: m => add(m, "info") };
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f17; --surface: #161923; --surface2: #1e2333;
    --border: #2a2f45; --accent: #6c63ff; --accent2: #ff6584;
    --green: #06d6a0; --amber: #ffd166; --red: #ff4d6d;
    --text: #e8eaf0; --muted: #7c829a; --font: 'DM Sans', sans-serif; --display: 'Syne', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  input, select, textarea {
    background: var(--surface2); border: 1.5px solid var(--border); color: var(--text);
    border-radius: 10px; padding: 10px 14px; font-family: var(--font); font-size: 14px; width: 100%; outline: none;
    transition: border-color .2s;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  input::placeholder, textarea::placeholder { color: var(--muted); }
  select option { background: var(--surface2); }
  button { cursor: pointer; font-family: var(--font); border: none; }
  @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

// ─── SMALL UI ATOMS ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {}, type = "button" }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, fontFamily: "var(--font)", fontWeight: 600, transition: "all .15s", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, border: "none", ...style };
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "13px 28px", fontSize: 15 } };
  const variants = {
    primary: { background: "var(--accent)", color: "#fff" },
    secondary: { background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)" },
    danger: { background: "var(--red)", color: "#fff" },
    success: { background: "var(--green)", color: "#0d0f17" },
    ghost: { background: "transparent", color: "var(--muted)", border: "1.5px solid var(--border)" },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
};

const Badge = ({ label, color }) => {
  const colors = { PENDING: ["#ffd16622", "#ffd166"], APPROVED: ["#06d6a022", "#06d6a0"], REJECTED: ["#ff4d6d22", "#ff4d6d"], ADMIN: ["#6c63ff22", "#6c63ff"], MANAGER: ["#3a86ff22", "#3a86ff"], EMPLOYEE: ["#7c829a22", "#7c829a"] };
  const [bg, fg] = colors[color || label] || ["#2a2f4533", "#7c829a"];
  return <span style={{ background: bg, color: fg, border: `1px solid ${fg}44`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{label}</span>;
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, ...style }}>{children}</div>
);

const FieldGroup = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{label}</label>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", animation: "fadeUp .2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Empty = ({ msg = "Nothing here yet." }) => (
  <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>{msg}
  </div>
);

// ─── AUTH PAGES ────────────────────────────────────────────────────────────
function AuthPage({ toast }) {
  const [mode, setMode] = useState("login");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle, #6c63ff18 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, background: "radial-gradient(circle, #ff658418 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: "var(--accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💼</div>
            <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800 }}>ReimburseFlow</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Expense reimbursement, streamlined.</p>
        </div>
        <Card>
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "var(--surface2)", borderRadius: 10, padding: 4 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "#fff" : "var(--muted)", fontWeight: 600, fontSize: 14, border: "none", fontFamily: "var(--font)", transition: "all .2s" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          {mode === "login" ? <LoginForm toast={toast} /> : <SignupForm toast={toast} setMode={setMode} />}
        </Card>
      </div>
    </div>
  );
}

function LoginForm({ toast }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login(data.user, data.access);
      toast.success("Welcome back!");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FieldGroup label="Email"><input type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} /></FieldGroup>
      <FieldGroup label="Password"><input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()} /></FieldGroup>
      <Btn onClick={submit} disabled={loading} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>{loading ? "Signing in…" : "Sign In"}</Btn>
    </div>
  );
}

function SignupForm({ toast, setMode }) {
  const [form, setForm] = useState({ company_name: "", country: "India", currency_code: "INR", name: "", email: "", password: "" });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then(r => r.json())
      .then(data => {
        const list = data.filter(c => c.currencies).map(c => ({
          name: c.name.common,
          currency: Object.keys(c.currencies)[0],
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
      }).catch(() => {});
  }, []);

  const handleCountryChange = e => {
    const country = e.target.value;
    const found = countries.find(c => c.name === country);
    setForm(p => ({ ...p, country, currency_code: found?.currency || p.currency_code }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      toast.success("Account created! Please log in.");
      setMode("login");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FieldGroup label="Your Name"><input placeholder="Jane Smith" value={form.name} onChange={set("name")} /></FieldGroup>
      <FieldGroup label="Email"><input type="email" placeholder="jane@company.com" value={form.email} onChange={set("email")} /></FieldGroup>
      <FieldGroup label="Password"><input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} /></FieldGroup>
      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
      <FieldGroup label="Company Name"><input placeholder="Acme Corp" value={form.company_name} onChange={set("company_name")} /></FieldGroup>
      <FieldGroup label="Country">
        <select value={form.country} onChange={handleCountryChange}>
          {countries.length ? countries.map(c => <option key={c.name}>{c.name}</option>) : <option>India</option>}
        </select>
      </FieldGroup>
      <FieldGroup label="Currency Code"><input placeholder="INR" value={form.currency_code} onChange={set("currency_code")} style={{ textTransform: "uppercase" }} /></FieldGroup>
      <Btn onClick={submit} disabled={loading} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>{loading ? "Creating…" : "Create Account"}</Btn>
    </div>
  );
}

// ─── LAYOUT ────────────────────────────────────────────────────────────────
const NAV_ITEMS = {
  ADMIN:    [{ id: "dashboard", icon: "⬡", label: "Dashboard" }, { id: "expenses", icon: "📋", label: "All Expenses" }, { id: "users", icon: "👥", label: "Users" }, { id: "chains", icon: "⛓", label: "Approval Chains" }],
  MANAGER:  [{ id: "dashboard", icon: "⬡", label: "Dashboard" }, { id: "pending", icon: "⏳", label: "Pending" }, { id: "team", icon: "📋", label: "Team Expenses" }],
  EMPLOYEE: [{ id: "dashboard", icon: "⬡", label: "Dashboard" }, { id: "myexpenses", icon: "📋", label: "My Expenses" }, { id: "submit", icon: "➕", label: "Submit Expense" }],
};

function AppShell({ toast }) {
  const { user, logout } = useAuth();
  const allowedPages = NAV_ITEMS[user.role]?.map(i => i.id) || [];
  const [page, setPage] = useState("dashboard");
  const nav = NAV_ITEMS[user.role] || [];

  // Guard - redirect to dashboard if page not allowed for this role
  const safePage = (p) => {
    if (allowedPages.includes(p)) setPage(p);
    else setPage("dashboard");
  };

  // If someone forces a page change via devtools
  useEffect(() => {
    if (!allowedPages.includes(page)) setPage("dashboard");
  }, [page]);

  const pageComponents = {
    dashboard: <DashboardPage setPage={safePage} toast={toast} />,
    expenses: <AllExpensesPage toast={toast} />,
    users: <UsersPage toast={toast} />,
    chains: <ApprovalChainsPage toast={toast} />,
    pending: <PendingApprovalsPage toast={toast} />,
    team: <TeamExpensesPage toast={toast} />,
    myexpenses: <MyExpensesPage toast={toast} />,
    submit: <SubmitExpensePage toast={toast} setPage={safePage} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "24px 12px", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
        <div style={{ padding: "0 8px 24px", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💼</div>
            <span style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 800 }}>ReimburseFlow</span>
          </div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => safePage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              background: page === item.id ? "var(--accent)18" : "transparent",
              color: page === item.id ? "var(--accent)" : "var(--muted)",
              border: page === item.id ? "1px solid var(--accent)44" : "1px solid transparent",
              fontWeight: page === item.id ? 600 : 400, fontSize: 14, textAlign: "left", fontFamily: "var(--font)", cursor: "pointer", transition: "all .15s",
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={{ padding: "8px 12px", marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{user.name}</div>
            <Badge label={user.role} color={user.role} />
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font)", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
            🚪 Sign out
          </button>
        </div>
      </aside>
      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: "36px 36px", minHeight: "100vh" }}>
        {pageComponents[page] || <Empty msg="Page not found" />}
      </main>
    </div>
  );
}

// ─── PAGE HEADER ───────────────────────────────────────────────────────────
const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
    <div>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ color: "var(--muted)", fontSize: 14 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── STAT CARD ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color = "var(--accent)" }) => (
  <Card style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 48, height: 48, background: `${color}22`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  </Card>
);

// ─── EXPENSE TABLE ─────────────────────────────────────────────────────────
function ExpenseTable({ expenses, onApprove, onReject, showApproveReject = false }) {
  if (!expenses.length) return <Empty msg="No expenses to display." />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Employee", "Category", "Amount", "Converted", "Date", "Status", showApproveReject && "Actions"].filter(Boolean).map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {expenses.map(exp => (
            <tr key={exp.id} style={{ borderBottom: "1px solid var(--border)66", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <td style={{ padding: "12px 12px" }}>{exp.employee_name || exp.employee || "—"}</td>
              <td style={{ padding: "12px 12px" }}><span style={{ background: "var(--surface2)", borderRadius: 6, padding: "3px 8px", fontSize: 12 }}>{exp.category}</span></td>
              <td style={{ padding: "12px 12px", fontWeight: 600 }}>{exp.amount} {exp.currency_code}</td>
              <td style={{ padding: "12px 12px", color: "var(--muted)" }}>{exp.converted_amount ? `${exp.converted_amount}` : "—"}</td>
              <td style={{ padding: "12px 12px", color: "var(--muted)" }}>{exp.date}</td>
              <td style={{ padding: "12px 12px" }}><Badge label={exp.status} color={exp.status} /></td>
              {showApproveReject && (
                <td style={{ padding: "12px 12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="success" onClick={() => onApprove(exp)}>✓ Approve</Btn>
                    <Btn size="sm" variant="danger" onClick={() => onReject(exp)}>✗ Reject</Btn>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function DashboardPage({ setPage, toast }) {
  const { user } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let expenses = [];
        if (user.role === "ADMIN") expenses = await api("/expenses/all/");
        else if (user.role === "MANAGER") expenses = await api("/expenses/team/");
        else expenses = await api("/expenses/");
        setRecent(expenses.slice(0, 5));
        setStats({
          total: expenses.length,
          pending: expenses.filter(e => e.status === "PENDING").length,
          approved: expenses.filter(e => e.status === "APPROVED").length,
          rejected: expenses.filter(e => e.status === "REJECTED").length,
        });
      } catch { toast.error("Failed to load dashboard"); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title={`Hello, ${user.name.split(" ")[0]} 👋`} subtitle={`${user.role} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" })}`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total" value={stats.total} icon="📋" color="var(--accent)" />
        <StatCard label="Pending" value={stats.pending} icon="⏳" color="var(--amber)" />
        <StatCard label="Approved" value={stats.approved} icon="✅" color="var(--green)" />
        <StatCard label="Rejected" value={stats.rejected} icon="❌" color="var(--red)" />
      </div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 16 }}>Recent Activity</h2>
        </div>
        <ExpenseTable expenses={recent} />
      </Card>
    </div>
  );
}

// ─── MY EXPENSES ───────────────────────────────────────────────────────────
function MyExpensesPage({ toast }) {
  const api = useApi();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/expenses/").then(setExpenses).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="My Expenses" subtitle="Track all your submitted claims" />
      <Card><ExpenseTable expenses={expenses} /></Card>
    </div>
  );
}

// ─── SUBMIT EXPENSE ────────────────────────────────────────────────────────
function SubmitExpensePage({ toast, setPage }) {
  const api = useApi();
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({ amount: "", currency_code: "INR", category: "Travel", description: "", date: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies").then(r => r.json()).then(data => {
      const list = [];
      data.forEach(c => { if (c.currencies) Object.keys(c.currencies).forEach(cur => { if (!list.includes(cur)) list.push(cur); }); });
      setCountries(list.sort());
    }).catch(() => {});
  }, []);

  const handleOCR = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    toast.info("OCR scanning receipt…");
    // Simulate OCR by reading file as base64 and calling Claude
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 400,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: ocrFile.type, data: base64 } },
              { type: "text", text: 'Extract receipt data and return ONLY valid JSON: {"amount": number, "currency_code": "USD", "category": "Travel|Meals|Accommodation|Office Supplies|Medical|Other", "description": "short text", "date": "YYYY-MM-DD"}. If any field is unclear, make a reasonable guess.' }
            ]}]
          })
        });
        const data = await res.json();
        const txt = data.content?.[0]?.text || "";
        const cleaned = txt.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setForm(p => ({ ...p, ...parsed, amount: String(parsed.amount) }));
        toast.success("Receipt scanned successfully!");
      } catch { toast.error("OCR failed — fill in manually."); }
      setOcrLoading(false);
    };
    reader.readAsDataURL(ocrFile);
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api("/expenses/", { method: "POST", body: { ...form, amount: parseFloat(form.amount) } });
      toast.success("Expense submitted!");
      setPage("myexpenses");
    } catch (e) { toast.error("Failed: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ animation: "fadeUp .3s ease", maxWidth: 600 }}>
      <PageHeader title="Submit Expense" subtitle="Add a new reimbursement claim" />
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "var(--muted)" }}>📷 SCAN RECEIPT WITH OCR</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input type="file" accept="image/*" onChange={e => setOcrFile(e.target.files?.[0] || null)} style={{ padding: "8px 10px", fontSize: 13 }} />
          </div>
          <Btn onClick={handleOCR} disabled={!ocrFile || ocrLoading} variant="secondary">{ocrLoading ? "Scanning…" : "🔍 Extract"}</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <FieldGroup label="Amount"><input type="number" placeholder="0.00" value={form.amount} onChange={set("amount")} /></FieldGroup>
            <FieldGroup label="Currency">
              <select value={form.currency_code} onChange={set("currency_code")}>
                {countries.length ? countries.map(c => <option key={c}>{c}</option>) : <option>INR</option>}
              </select>
            </FieldGroup>
          </div>
          <FieldGroup label="Category">
            <select value={form.category} onChange={set("category")}>
              {["Travel", "Meals", "Accommodation", "Office Supplies", "Medical", "Training", "Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Date"><input type="date" value={form.date} onChange={set("date")} /></FieldGroup>
          <FieldGroup label="Description"><textarea rows={3} placeholder="What was this expense for?" value={form.description} onChange={set("description")} /></FieldGroup>
          <Btn onClick={submit} disabled={loading || !form.amount} size="lg">{loading ? "Submitting…" : "Submit Expense →"}</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── ALL EXPENSES (ADMIN) ──────────────────────────────────────────────────
function AllExpensesPage({ toast }) {
  const api = useApi();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api("/expenses/all/").then(setExpenses).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? expenses : expenses.filter(e => e.status === filter);
  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="All Expenses" subtitle={`${expenses.length} total across the company`} />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <Btn key={s} variant={filter === s ? "primary" : "ghost"} size="sm" onClick={() => setFilter(s)}>{s}</Btn>
        ))}
      </div>
      <Card><ExpenseTable expenses={filtered} /></Card>
    </div>
  );
}

// ─── TEAM EXPENSES (MANAGER) ───────────────────────────────────────────────
function TeamExpensesPage({ toast }) {
  const api = useApi();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/expenses/team/").then(setExpenses).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="Team Expenses" subtitle="Expenses from your direct reports" />
      <Card><ExpenseTable expenses={expenses} /></Card>
    </div>
  );
}

// ─── PENDING APPROVALS ─────────────────────────────────────────────────────
function PendingApprovalsPage({ toast }) {
  const api = useApi();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => api("/approvals/pending/").then(setRequests).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const process = async (action) => {
    setProcessing(true);
    try {
      await api(`/approvals/${actionModal.id}/process/`, { method: "POST", body: { action, comments: comment } });
      toast.success(`Expense ${action.toLowerCase()} successfully`);
      setActionModal(null); setComment("");
      load();
    } catch (e) { toast.error("Failed: " + e.message); }
    setProcessing(false);
  };

  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="Pending Approvals" subtitle={`${requests.length} expense${requests.length !== 1 ? "s" : ""} awaiting your decision`} />
      {!requests.length ? <Card><Empty msg="No pending approvals. You're all caught up! ✓" /></Card> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {requests.map(req => (
            <Card key={req.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700 }}>{req.expense?.employee_name || req.expense?.employee || "Employee"}</span>
                    <Badge label="PENDING" color="PENDING" />
                  </div>
                  <div style={{ display: "flex", gap: 20, color: "var(--muted)", fontSize: 13 }}>
                    <span>💰 <strong style={{ color: "var(--text)" }}>{req.expense?.amount} {req.expense?.currency_code}</strong></span>
                    <span>🏷 {req.expense?.category}</span>
                    <span>📅 {req.expense?.date}</span>
                    <span>Step {req.step_order}</span>
                  </div>
                  {req.expense?.description && <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>{req.expense.description}</p>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="success" onClick={() => { setActionModal({ ...req, actionType: "APPROVED" }); setComment(""); }}>✓ Approve</Btn>
                  <Btn size="sm" variant="danger" onClick={() => { setActionModal({ ...req, actionType: "REJECTED" }); setComment(""); }}>✗ Reject</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal?.actionType === "APPROVED" ? "✅ Approve Expense" : "❌ Reject Expense"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Add an optional comment before submitting your decision.</p>
          <FieldGroup label="Comment (optional)"><textarea rows={3} placeholder="Write a reason…" value={comment} onChange={e => setComment(e.target.value)} /></FieldGroup>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant={actionModal?.actionType === "APPROVED" ? "success" : "danger"} disabled={processing} onClick={() => process(actionModal.actionType)}>
              {processing ? "Processing…" : actionModal?.actionType === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
            </Btn>
            <Btn variant="ghost" onClick={() => setActionModal(null)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── USERS PAGE (ADMIN) ────────────────────────────────────────────────────
function UsersPage({ toast }) {
  const api = useApi();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", manager: "", is_manager_approver: false });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const load = () => api("/users/").then(setUsers).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditUser(null); setForm({ name: "", email: "", password: "", role: "EMPLOYEE", manager: "", is_manager_approver: false }); setModal(true); };
  const openEdit = u => { setEditUser(u); setForm({ name: u.name, email: u.email, password: "", role: u.role, manager: u.manager || "", is_manager_approver: u.is_manager_approver || false }); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, manager: form.manager || undefined };
      if (editUser) { await api(`/users/${editUser.id}/`, { method: "PATCH", body }); toast.success("User updated"); }
      else { await api("/users/", { method: "POST", body }); toast.success("User created"); }
      setModal(false); load();
    } catch (e) { toast.error("Failed: " + e.message); }
    setSaving(false);
  };

  const del = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try { await api(`/users/${u.id}/`, { method: "DELETE" }); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  if (loading) return <Spinner />;
  const managers = users.filter(u => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="Users" subtitle={`${users.length} people in the company`} action={<Btn onClick={openNew}>＋ Add User</Btn>} />
      <Card>
        {!users.length ? <Empty msg="No users yet. Add your team." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Name", "Email", "Role", "Manager", "Approver", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)66" }}>
                  <td style={{ padding: "12px 12px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 12px", color: "var(--muted)" }}>{u.email}</td>
                  <td style={{ padding: "12px 12px" }}><Badge label={u.role} color={u.role} /></td>
                  <td style={{ padding: "12px 12px", color: "var(--muted)" }}>{users.find(m => m.id === u.manager)?.name || "—"}</td>
                  <td style={{ padding: "12px 12px" }}>{u.is_manager_approver ? "✅" : "—"}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="ghost" onClick={() => openEdit(u)}>✎ Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(u)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? "Edit User" : "Add New User"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldGroup label="Name"><input value={form.name} onChange={set("name")} placeholder="Full name" /></FieldGroup>
          <FieldGroup label="Email"><input type="email" value={form.email} onChange={set("email")} placeholder="email@company.com" /></FieldGroup>
          {!editUser && <FieldGroup label="Password"><input type="password" value={form.password} onChange={set("password")} placeholder="Set a password" /></FieldGroup>}
          <FieldGroup label="Role">
            <select value={form.role} onChange={set("role")}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Manager (optional)">
            <select value={form.manager} onChange={set("manager")}>
              <option value="">— None —</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </FieldGroup>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={form.is_manager_approver} onChange={set("is_manager_approver")} style={{ width: "auto" }} />
            <span>Manager must approve first (IS MANAGER APPROVER)</span>
          </label>
          <Btn onClick={save} disabled={saving} size="lg" style={{ width: "100%", justifyContent: "center" }}>{saving ? "Saving…" : editUser ? "Save Changes" : "Create User"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── APPROVAL CHAINS (ADMIN) ───────────────────────────────────────────────
function ApprovalChainsPage({ toast }) {
  const api = useApi();
  const [chains, setChains] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", steps: [{ approver: "", step_order: 1 }], rule_type: "PERCENTAGE", percentage_threshold: 100, specific_approver: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [c, u] = await Promise.all([api("/chains/"), api("/users/")]);
      setChains(c); setUsers(u);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addStep = () => setForm(p => ({ ...p, steps: [...p.steps, { approver: "", step_order: p.steps.length + 1 }] }));
  const removeStep = i => setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_order: idx + 1 })) }));
  const setStep = (i, k, v) => setForm(p => { const steps = [...p.steps]; steps[i] = { ...steps[i], [k]: v }; return { ...p, steps }; });

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, steps: form.steps, rule: { rule_type: form.rule_type, percentage_threshold: parseFloat(form.percentage_threshold) || null, specific_approver: form.specific_approver || null } };
      await api("/chains/", { method: "POST", body });
      toast.success("Approval chain created!");
      setModal(false); load();
    } catch (e) { toast.error("Failed: " + e.message); }
    setSaving(false);
  };

  if (loading) return <Spinner />;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <PageHeader title="Approval Chains" subtitle="Configure multi-step approval workflows" action={<Btn onClick={() => setModal(true)}>＋ New Chain</Btn>} />
      {!chains.length ? (
        <Card><Empty msg="No chains yet. Create one to define how expenses get approved." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {chains.map(chain => (
            <Card key={chain.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700 }}>{chain.name}</span>
                {chain.rule && <Badge label={chain.rule.rule_type} color="PENDING" />}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {chain.steps?.map((step, i) => (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 14px", fontSize: 13 }}>
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>Step {step.step_order} · </span>
                      {users.find(u => u.id === step.approver)?.name || `Approver #${step.approver}`}
                    </div>
                    {i < chain.steps.length - 1 && <span style={{ color: "var(--muted)" }}>→</span>}
                  </div>
                ))}
              </div>
              {chain.rule?.percentage_threshold && (
                <p style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>Rule: {chain.rule.percentage_threshold}% approvals required</p>
              )}
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Approval Chain" width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FieldGroup label="Chain Name"><input placeholder="e.g. Standard Approval Flow" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FieldGroup>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>APPROVAL STEPS</label>
              <Btn size="sm" variant="ghost" onClick={addStep}>＋ Add Step</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {form.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <select style={{ flex: 1 }} value={step.approver} onChange={e => setStep(i, "approver", e.target.value)}>
                    <option value="">Select approver</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                  {form.steps.length > 1 && <Btn size="sm" variant="danger" onClick={() => removeStep(i)}>✕</Btn>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 12 }}>CONDITIONAL RULE</label>
            <FieldGroup label="Rule Type">
              <select value={form.rule_type} onChange={e => setForm(p => ({ ...p, rule_type: e.target.value }))}>
                <option value="PERCENTAGE">Percentage — e.g. 60% must approve</option>
                <option value="SPECIFIC_APPROVER">Specific Approver — one person auto-approves</option>
                <option value="HYBRID">Hybrid — Percentage OR Specific Approver</option>
              </select>
            </FieldGroup>
            {(form.rule_type === "PERCENTAGE" || form.rule_type === "HYBRID") && (
              <div style={{ marginTop: 12 }}>
                <FieldGroup label="Threshold (%)"><input type="number" min="1" max="100" value={form.percentage_threshold} onChange={e => setForm(p => ({ ...p, percentage_threshold: e.target.value }))} /></FieldGroup>
              </div>
            )}
            {(form.rule_type === "SPECIFIC_APPROVER" || form.rule_type === "HYBRID") && (
              <div style={{ marginTop: 12 }}>
                <FieldGroup label="Key Approver">
                  <select value={form.specific_approver} onChange={e => setForm(p => ({ ...p, specific_approver: e.target.value }))}>
                    <option value="">Select</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </FieldGroup>
              </div>
            )}
          </div>
          <Btn onClick={save} disabled={saving} size="lg" style={{ width: "100%", justifyContent: "center" }}>{saving ? "Creating…" : "Create Chain"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const toast = useToast();
  return (
    <AuthProvider>
      <style>{css}</style>
      <Inner toast={toast} />
      <Toast toasts={toast.toasts} remove={toast.remove} />
    </AuthProvider>
  );
}

function Inner({ toast }) {
  const { user } = useAuth();
  return user ? <AppShell toast={toast} /> : <AuthPage toast={toast} />;
}
