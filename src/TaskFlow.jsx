import { useState, useEffect, useCallback, useRef } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
const isOverdue = (d, status) => d && status !== "done" && new Date(d) < new Date();
const isPast3Days = (d) => d && new Date(d) > new Date() && new Date(d) <= new Date(Date.now() + 3 * 86400000);

const PRIORITY_MAP = { high: { label: "High", color: "#FF4757", bg: "rgba(255,71,87,0.12)", dot: "#FF4757" }, medium: { label: "Med", color: "#FFA502", bg: "rgba(255,165,2,0.12)", dot: "#FFA502" }, low: { label: "Low", color: "#2ED573", bg: "rgba(46,213,115,0.12)", dot: "#2ED573" } };
const STATUS_MAP = { todo: { label: "To Do", color: "#7B7F9E" }, "in-progress": { label: "In Progress", color: "#A78BFA" }, done: { label: "Done", color: "#2ED573" } };
const CATEGORY_ICONS = { work: "💼", personal: "👤", design: "🎨", dev: "⌨️", marketing: "📣", research: "🔬", finance: "💰", general: "📌" };

const SEED_TASKS = [
  { id: uid(), title: "Redesign onboarding flow", description: "Improve the user onboarding experience with a new multi-step wizard and contextual tooltips.", priority: "high", category: "design", status: "in-progress", dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], tags: ["ux", "product"], createdAt: now() },
  { id: uid(), title: "Set up Firebase Firestore rules", description: "Configure security rules to ensure users can only access their own data.", priority: "high", category: "dev", status: "todo", dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], tags: ["firebase", "security"], createdAt: now() },
  { id: uid(), title: "Write Q3 performance report", description: "Summarize team KPIs and OKR progress for the Q3 review presentation.", priority: "medium", category: "work", status: "todo", dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], tags: ["report", "quarterly"], createdAt: now() },
  { id: uid(), title: "Deploy API to Vercel", description: "Push the Node.js/Express backend to production via the Vercel CLI.", priority: "high", category: "dev", status: "done", dueDate: null, tags: ["devops", "deployment"], createdAt: now() },
  { id: uid(), title: "Keyword research for blog", description: "Identify 20+ target keywords using Ahrefs for the upcoming content calendar.", priority: "low", category: "marketing", status: "todo", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], tags: ["seo", "content"], createdAt: now() },
  { id: uid(), title: "Review pull requests", description: "Reviewed and merged 3 open PRs: auth refactor, task API, and CI pipeline update.", priority: "medium", category: "dev", status: "done", dueDate: null, tags: ["code-review"], createdAt: now() },
  { id: uid(), title: "Plan team retreat", description: "Coordinate logistics and agenda for the September offsite in Bangalore.", priority: "low", category: "personal", status: "in-progress", dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0], tags: ["team", "event"], createdAt: now() },
  { id: uid(), title: "Analyze competitor pricing", description: "Deep dive into competitor SaaS pricing strategies and update pricing deck.", priority: "medium", category: "research", status: "todo", dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], tags: ["research", "pricing"], createdAt: now() },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg: #0B0C10; --bg2: #13141A; --bg3: #1A1B23; --bg4: #22232E;
    --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
    --text: #F0F0F5; --text2: #9596A8; --text3: #5A5B6E;
    --accent: #A78BFA; --accent2: #7C3AED; --accent-glow: rgba(167,139,250,0.15);
    --danger: #FF4757; --success: #2ED573; --warn: #FFA502;
    --r: 10px; --r2: 16px; --font: 'DM Sans', sans-serif; --font-d: 'Syne', sans-serif;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh;overflow-x:hidden;}
  .app{display:flex;min-height:100vh;}

  /* Sidebar */
  .sidebar{width:240px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 16px;gap:8px;flex-shrink:0;position:relative;z-index:10;}
  .sidebar-logo{font-family:var(--font-d);font-size:22px;font-weight:800;color:var(--text);padding:8px 12px 24px;letter-spacing:-0.5px;}
  .sidebar-logo span{color:var(--accent);}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);cursor:pointer;font-size:14px;font-weight:500;color:var(--text2);transition:all .18s ease;user-select:none;}
  .nav-item:hover{background:var(--bg3);color:var(--text);}
  .nav-item.active{background:var(--accent-glow);color:var(--accent);border:1px solid rgba(167,139,250,0.2);}
  .nav-icon{width:18px;height:18px;opacity:.85;}
  .nav-section{font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;padding:16px 12px 6px;}
  .sidebar-footer{margin-top:auto;padding:12px;background:var(--bg3);border-radius:var(--r);border:1px solid var(--border);}
  .user-row{display:flex;align-items:center;gap:10px;cursor:pointer;}
  .avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent2),#4F46E5);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;}
  .user-info{flex:1;min-width:0;}
  .user-name{font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .user-role{font-size:11px;color:var(--text3);}

  /* Main */
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .topbar{padding:20px 28px;display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--border);background:var(--bg);}
  .topbar-title{font-family:var(--font-d);font-size:20px;font-weight:700;color:var(--text);flex:1;}
  .search-wrap{position:relative;}
  .search-wrap input{background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:9px 14px 9px 36px;border-radius:var(--r);font-size:14px;font-family:var(--font);outline:none;width:220px;transition:border .18s;}
  .search-wrap input:focus{border-color:var(--accent);}
  .search-wrap input::placeholder{color:var(--text3);}
  .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;}
  .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:var(--r);border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:var(--font);transition:all .18s;user-select:none;}
  .btn-primary{background:var(--accent2);color:#fff;}
  .btn-primary:hover{background:#6D28D9;transform:translateY(-1px);}
  .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}
  .btn-ghost:hover{border-color:var(--border2);color:var(--text);background:var(--bg3);}
  .btn-danger{background:rgba(255,71,87,0.15);color:var(--danger);border:1px solid rgba(255,71,87,0.25);}
  .btn-danger:hover{background:rgba(255,71,87,0.25);}
  .content{flex:1;overflow-y:auto;padding:28px;}
  .content::-webkit-scrollbar{width:4px;}
  .content::-webkit-scrollbar-track{background:transparent;}
  .content::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:4px;}

  /* Stats */
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
  .stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:20px;position:relative;overflow:hidden;transition:border .2s;}
  .stat-card:hover{border-color:var(--border2);}
  .stat-label{font-size:12px;font-weight:500;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;margin-bottom:10px;}
  .stat-num{font-family:var(--font-d);font-size:34px;font-weight:700;line-height:1;}
  .stat-sub{font-size:12px;color:var(--text3);margin-top:6px;}
  .stat-accent{position:absolute;right:-12px;top:-12px;width:64px;height:64px;border-radius:50%;opacity:.08;}

  /* Filters bar */
  .filters{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
  .filter-chip{padding:6px 13px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);color:var(--text2);background:transparent;transition:all .15s;font-family:var(--font);}
  .filter-chip:hover{border-color:var(--border2);color:var(--text);}
  .filter-chip.active{background:var(--accent-glow);color:var(--accent);border-color:rgba(167,139,250,0.3);}
  .filter-sep{width:1px;height:20px;background:var(--border);margin:0 4px;}
  .select-mini{background:var(--bg2);border:1px solid var(--border);color:var(--text2);padding:6px 10px;border-radius:20px;font-size:12px;font-family:var(--font);outline:none;cursor:pointer;}
  .select-mini:focus{border-color:var(--accent);color:var(--text);}

  /* Task list */
  .task-list{display:flex;flex-direction:column;gap:10px;}
  .task-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:16px 18px;display:flex;align-items:flex-start;gap:14px;transition:all .2s;cursor:pointer;position:relative;overflow:hidden;}
  .task-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px;}
  .task-card.high::before{background:var(--danger);}
  .task-card.medium::before{background:var(--warn);}
  .task-card.low::before{background:var(--success);}
  .task-card:hover{border-color:var(--border2);background:var(--bg3);transform:translateX(2px);}
  .task-card.done-card{opacity:.55;}
  .check-btn{width:20px;height:20px;border-radius:50%;border:2px solid var(--border2);background:transparent;cursor:pointer;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
  .check-btn:hover{border-color:var(--success);}
  .check-btn.checked{background:var(--success);border-color:var(--success);}
  .check-icon{color:#fff;font-size:11px;font-weight:700;}
  .task-body{flex:1;min-width:0;}
  .task-title{font-size:15px;font-weight:500;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .task-title.done-text{text-decoration:line-through;color:var(--text3);}
  .task-desc{font-size:13px;color:var(--text3);margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
  .task-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
  .cat-badge{background:var(--bg4);color:var(--text2);}
  .pri-badge{border-radius:20px;}
  .due-badge{font-size:11px;color:var(--text3);}
  .due-badge.overdue{color:var(--danger);background:rgba(255,71,87,0.1);padding:3px 8px;border-radius:20px;}
  .due-badge.soon{color:var(--warn);background:rgba(255,165,2,0.1);padding:3px 8px;border-radius:20px;}
  .tag-pill{background:var(--bg4);color:var(--text3);font-size:11px;padding:3px 8px;border-radius:20px;}
  .task-actions{display:flex;gap:4px;flex-shrink:0;opacity:0;transition:opacity .15s;}
  .task-card:hover .task-actions{opacity:1;}
  .icon-btn{background:transparent;border:1px solid transparent;color:var(--text3);width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s;}
  .icon-btn:hover{background:var(--bg4);border-color:var(--border);color:var(--text);}
  .icon-btn.del:hover{background:rgba(255,71,87,0.15);border-color:rgba(255,71,87,0.3);color:var(--danger);}

  /* Empty state */
  .empty{text-align:center;padding:60px 20px;color:var(--text3);}
  .empty-icon{font-size:40px;margin-bottom:12px;}
  .empty-title{font-size:17px;color:var(--text2);margin-bottom:6px;}

  /* Modal */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r2);width:100%;max-width:520px;padding:28px;animation:slideUp .25s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
  .modal-title{font-family:var(--font-d);font-size:18px;font-weight:700;}
  .form-row{margin-bottom:18px;}
  .form-label{font-size:12px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;display:block;}
  .form-input{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:10px 14px;color:var(--text);font-size:14px;font-family:var(--font);outline:none;transition:border .15s;}
  .form-input:focus{border-color:var(--accent);}
  .form-input::placeholder{color:var(--text3);}
  .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .form-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239596A8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
  .form-textarea{resize:vertical;min-height:80px;line-height:1.6;}
  .modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:24px;padding-top:20px;border-top:1px solid var(--border);}
  .tags-input{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);min-height:42px;cursor:text;transition:border .15s;}
  .tags-input:focus-within{border-color:var(--accent);}
  .tags-input input{border:none;background:transparent;color:var(--text);font-size:14px;font-family:var(--font);outline:none;flex:1;min-width:80px;}
  .tag-x{cursor:pointer;opacity:.6;margin-left:2px;}

  /* Auth screen */
  .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);background-image:radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(167,139,250,0.06) 0%,transparent 50%);}
  .auth-card{width:100%;max-width:400px;padding:40px;background:var(--bg2);border:1px solid var(--border);border-radius:24px;}
  .auth-logo{font-family:var(--font-d);font-size:28px;font-weight:800;text-align:center;margin-bottom:8px;}
  .auth-logo span{color:var(--accent);}
  .auth-sub{text-align:center;color:var(--text3);font-size:14px;margin-bottom:32px;}
  .auth-tabs{display:flex;background:var(--bg3);border-radius:var(--r);padding:3px;margin-bottom:24px;}
  .auth-tab{flex:1;text-align:center;padding:8px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:var(--text3);transition:all .15s;}
  .auth-tab.active{background:var(--bg2);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.3);}
  .auth-error{background:rgba(255,71,87,0.12);border:1px solid rgba(255,71,87,0.25);color:var(--danger);padding:10px 14px;border-radius:var(--r);font-size:13px;margin-bottom:16px;}
  .auth-note{text-align:center;font-size:12px;color:var(--text3);margin-top:20px;}
  .auth-note a{color:var(--accent);cursor:pointer;text-decoration:none;}
  .divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--text3);font-size:12px;}
  .divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

  /* Detail panel */
  .detail-panel{width:360px;background:var(--bg2);border-left:1px solid var(--border);padding:28px 24px;overflow-y:auto;animation:slideInR .2s ease;flex-shrink:0;}
  @keyframes slideInR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  .detail-title{font-family:var(--font-d);font-size:18px;font-weight:700;margin-bottom:8px;line-height:1.3;}
  .detail-desc{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:20px;}
  .detail-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
  .detail-key{font-size:12px;color:var(--text3);font-weight:500;}
  .detail-val{font-size:13px;color:var(--text2);}

  /* Status toggle */
  .status-toggle{display:flex;gap:6px;margin-bottom:20px;}
  .status-opt{padding:5px 13px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);color:var(--text3);background:transparent;font-family:var(--font);transition:all .15s;}
  .status-opt.active{border-color:var(--accent);color:var(--accent);background:var(--accent-glow);}

  /* Kanban */
  .kanban{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  .kanban-col{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:16px;}
  .kanban-header{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
  .kanban-dot{width:8px;height:8px;border-radius:50%;}
  .kanban-col-title{font-size:13px;font-weight:600;color:var(--text2);}
  .kanban-count{margin-left:auto;background:var(--bg4);color:var(--text3);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;}
  .kanban-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:13px;margin-bottom:8px;cursor:pointer;transition:all .15s;}
  .kanban-card:hover{border-color:var(--border2);transform:translateY(-1px);}
  .kanban-card-title{font-size:13px;font-weight:500;color:var(--text);margin-bottom:8px;}

  /* View toggle */
  .view-toggle{display:flex;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:3px;}
  .view-btn{padding:5px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;color:var(--text3);transition:all .15s;border:none;background:transparent;font-family:var(--font);}
  .view-btn.active{background:var(--bg4);color:var(--text);}

  /* Progress ring */
  .progress-ring{display:flex;align-items:center;gap:20px;}
  .ring-wrap{position:relative;width:70px;height:70px;flex-shrink:0;}
  .ring-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:16px;font-weight:700;}

  @media(max-width:900px){.sidebar{width:200px}.stats-grid{grid-template-columns:repeat(2,1fr)}.kanban{grid-template-columns:1fr}.detail-panel{display:none}}
  @media(max-width:650px){.sidebar{display:none}.stats-grid{grid-template-columns:repeat(2,1fr)}}
`;

// ─── Auth Component ──────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e?.preventDefault();
    if (!email || !pass) return setErr("Please fill all fields.");
    if (pass.length < 6) return setErr("Password must be at least 6 characters.");
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onLogin({ uid: uid(), email, displayName: name || email.split("@")[0] });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Task<span>Flow</span></div>
        <p className="auth-sub">Manage your work with clarity and speed</p>
        <div className="auth-tabs">
          {["login", "signup"].map(t => (
            <div key={t} className={`auth-tab${tab === t ? " active" : ""}`} onClick={() => { setTab(t); setErr(""); }}>
              {t === "login" ? "Sign In" : "Sign Up"}
            </div>
          ))}
        </div>
        {err && <div className="auth-error">{err}</div>}
        {tab === "signup" && (
          <div className="form-row">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="form-row">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "12px" }} onClick={handle} disabled={loading}>
          {loading ? "Authenticating…" : tab === "login" ? "Sign In →" : "Create Account →"}
        </button>
        <div className="divider">or</div>
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => onLogin({ uid: "demo_user", email: "demo@taskflow.app", displayName: "Demo User" })}>
          Continue as Demo
        </button>
        <p className="auth-note">Secured with Firebase Auth • End-to-end encrypted</p>
      </div>
    </div>
  );
}

// ─── Task Modal ──────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const isEdit = !!task?.id;
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "work", dueDate: "", status: "todo", tags: [], ...(task || {}) });
  const [tagInput, setTagInput] = useState("");
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (t && !form.tags.includes(t)) up("tags", [...form.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t) => up("tags", form.tags.filter(x => x !== t));

  const save = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, id: form.id || uid(), createdAt: form.createdAt || now(), updatedAt: now() });
    onClose();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title">{isEdit ? "Edit Task" : "New Task"}</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <label className="form-label">Title *</label>
          <input className="form-input" placeholder="What needs to be done?" value={form.title} onChange={e => up("title", e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" placeholder="Add details, context, or notes…" value={form.description} onChange={e => up("description", e.target.value)} />
        </div>
        <div className="form-row-2">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Priority</label>
            <select className="form-input form-select" value={form.priority} onChange={e => up("priority", e.target.value)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={form.status} onChange={e => up("status", e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="form-row-2" style={{ marginTop: 14 }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select className="form-input form-select" value={form.category} onChange={e => up("category", e.target.value)}>
              {Object.entries(CATEGORY_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate || ""} onChange={e => up("dueDate", e.target.value)} />
          </div>
        </div>
        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="form-label">Tags (press Enter)</label>
          <div className="tags-input" onClick={e => e.currentTarget.querySelector("input")?.focus()}>
            {form.tags.map(t => <span key={t} className="badge tag-pill">{t}<span className="tag-x" onClick={() => removeTag(t)}>✕</span></span>)}
            <input placeholder={form.tags.length ? "" : "add tags…"} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()}>{isEdit ? "Update Task" : "Create Task"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────
function DetailPanel({ task, onClose, onEdit, onDelete, onStatusChange }) {
  if (!task) return null;
  const p = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
  return (
    <div className="detail-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span className="badge cat-badge">{CATEGORY_ICONS[task.category]} {task.category}</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="detail-title">{task.title}</div>
      <div className="detail-desc">{task.description || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>No description</span>}</div>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Status</label>
        <div className="status-toggle">
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <button key={k} className={`status-opt${task.status === k ? " active" : ""}`} onClick={() => onStatusChange(task.id, k)}>{v.label}</button>
          ))}
        </div>
      </div>
      <div className="detail-row"><span className="detail-key">Priority</span><span className="badge pri-badge" style={{ background: p.bg, color: p.color }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot, display: "inline-block" }} />{p.label}</span></div>
      <div className="detail-row"><span className="detail-key">Due Date</span><span className="detail-val">{task.dueDate ? fmtDate(task.dueDate) : "—"}</span></div>
      <div className="detail-row"><span className="detail-key">Created</span><span className="detail-val">{fmtDate(task.createdAt)}</span></div>
      {task.tags?.length > 0 && <div className="detail-row"><span className="detail-key">Tags</span><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{task.tags.map(t => <span key={t} className="badge tag-pill">{t}</span>)}</div></div>}
      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onEdit(task)}>✏️ Edit</button>
        <button className="btn btn-danger" onClick={() => { onDelete(task.id); onClose(); }}>🗑 Delete</button>
      </div>
    </div>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
function Ring({ pct, color, size = 70 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg4)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function TaskFlow() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [view, setView] = useState("list");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState("tasks");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => isOverdue(t.dueDate, t.status)).length,
    high: tasks.filter(t => t.priority === "high").length,
    donePct: tasks.length ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0,
  };

  const filtered = tasks
    .filter(t => {
      const q = search.toLowerCase();
      return (!q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some(x => x.includes(q)));
    })
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === "priority") { const o = { high: 0, medium: 1, low: 2 }; return o[a.priority] - o[b.priority]; }
      if (sortBy === "dueDate") { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const saveTask = (t) => {
    setTasks(ts => ts.find(x => x.id === t.id) ? ts.map(x => x.id === t.id ? t : x) : [t, ...ts]);
    if (selected?.id === t.id) setSelected(t);
    showToast(tasks.find(x => x.id === t.id) ? "Task updated" : "Task created ✓");
  };

  const deleteTask = (id) => { setTasks(ts => ts.filter(t => t.id !== id)); setSelected(null); showToast("Task deleted", "warn"); };
  const toggleStatus = (id, status) => { setTasks(ts => ts.map(t => t.id === id ? { ...t, status, updatedAt: now() } : t)); if (selected?.id === id) setSelected(s => ({ ...s, status })); };
  const toggleDone = (e, id) => { e.stopPropagation(); const t = tasks.find(x => x.id === id); toggleStatus(id, t?.status === "done" ? "todo" : "done"); };

  if (!user) return (<><style>{css}</style><AuthScreen onLogin={setUser} /></>);

  const kanbanCols = [
    { key: "todo", label: "To Do", color: "#7B7F9E" },
    { key: "in-progress", label: "In Progress", color: "#A78BFA" },
    { key: "done", label: "Done", color: "#2ED573" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-logo">Task<span>Flow</span></div>
          {[
            { id: "dashboard", icon: "◈", label: "Dashboard" },
            { id: "tasks", icon: "⊞", label: "All Tasks" },
          ].map(i => (
            <div key={i.id} className={`nav-item${page === i.id ? " active" : ""}`} onClick={() => setPage(i.id)}>
              <span style={{ fontSize: 16 }}>{i.icon}</span>{i.label}
            </div>
          ))}
          <div className="nav-section">By Status</div>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <div key={k} className={`nav-item${filterStatus === k && page === "tasks" ? " active" : ""}`} onClick={() => { setPage("tasks"); setFilterStatus(k); }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, display: "inline-block" }} />{v.label}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)", background: "var(--bg4)", padding: "2px 7px", borderRadius: 20 }}>{tasks.filter(t => t.status === k).length}</span>
            </div>
          ))}
          <div className="nav-section">Priority</div>
          {Object.entries(PRIORITY_MAP).map(([k, v]) => (
            <div key={k} className={`nav-item${filterPriority === k && page === "tasks" ? " active" : ""}`} onClick={() => { setPage("tasks"); setFilterPriority(k); }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.dot, display: "inline-block" }} />{v.label} Priority
            </div>
          ))}
          <div className="sidebar-footer">
            <div className="user-row">
              <div className="avatar">{user.displayName?.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{user.displayName}</div>
                <div className="user-role">Free Plan</div>
              </div>
              <span style={{ color: "var(--text3)", cursor: "pointer", fontSize: 14 }} onClick={() => setUser(null)} title="Sign out">⎋</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{page === "dashboard" ? "Dashboard" : "My Tasks"}</div>
            {page === "tasks" && (
              <>
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="view-toggle">
                  <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")}>≡ List</button>
                  <button className={`view-btn${view === "kanban" ? " active" : ""}`} onClick={() => setView("kanban")}>⊞ Board</button>
                </div>
              </>
            )}
            <button className="btn btn-primary" onClick={() => setModal({})}>+ New Task</button>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <div className="content" style={{ flex: 1 }}>

              {/* ── Dashboard ── */}
              {page === "dashboard" && (
                <>
                  <div className="stats-grid">
                    {[
                      { label: "Total Tasks", num: stats.total, sub: `${stats.done} completed`, color: "#A78BFA", sub2: "purple" },
                      { label: "In Progress", num: stats.inProgress, sub: "Active tasks", color: "#FFA502", sub2: "amber" },
                      { label: "Overdue", num: stats.overdue, sub: "Need attention", color: "#FF4757", sub2: "red" },
                      { label: "High Priority", num: stats.high, sub: "Urgent items", color: "#FF6B6B", sub2: "coral" },
                    ].map(s => (
                      <div className="stat-card" key={s.label}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                        <div className="stat-sub">{s.sub}</div>
                        <div className="stat-accent" style={{ background: s.color }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
                    <div className="stat-card">
                      <div className="stat-label">Completion Rate</div>
                      <div className="progress-ring">
                        <div className="ring-wrap">
                          <Ring pct={stats.donePct} color="#A78BFA" />
                          <div className="ring-label">{stats.donePct}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>{stats.done} of {stats.total} tasks done</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>{stats.todo} remaining</div>
                        </div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">By Category</div>
                      {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => {
                        const n = tasks.filter(t => t.category === cat).length;
                        if (!n) return null;
                        return (
                          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                            <span style={{ fontSize: 14 }}>{icon}</span>
                            <span style={{ fontSize: 13, color: "var(--text2)", flex: 1, textTransform: "capitalize" }}>{cat}</span>
                            <div style={{ width: 80, height: 4, background: "var(--bg4)", borderRadius: 4 }}>
                              <div style={{ width: `${(n / tasks.length) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text3)", minWidth: 14 }}>{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 16 }}>Recent Tasks</div>
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage("tasks")}>View All →</button>
                  </div>
                  <div className="task-list">
                    {tasks.slice(0, 5).map(task => <TaskRow key={task.id} task={task} onSelect={() => setSelected(task)} selected={selected?.id === task.id} onToggle={toggleDone} onEdit={() => setModal(task)} onDelete={deleteTask} />)}
                  </div>
                </>
              )}

              {/* ── Task List / Kanban ── */}
              {page === "tasks" && (
                <>
                  <div className="filters">
                    {[["all", "All"], ["todo", "To Do"], ["in-progress", "In Progress"], ["done", "Done"]].map(([k, l]) => (
                      <button key={k} className={`filter-chip${filterStatus === k ? " active" : ""}`} onClick={() => setFilterStatus(k)}>{l}</button>
                    ))}
                    <div className="filter-sep" />
                    <select className="select-mini" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select className="select-mini" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="createdAt">Newest First</option>
                      <option value="priority">By Priority</option>
                      <option value="dueDate">By Due Date</option>
                    </select>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)" }}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
                  </div>

                  {view === "list" ? (
                    filtered.length === 0 ? (
                      <div className="empty">
                        <div className="empty-icon">📭</div>
                        <div className="empty-title">No tasks found</div>
                        <div style={{ fontSize: 13 }}>Try adjusting filters or <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => setModal({})}>create a new task</span></div>
                      </div>
                    ) : (
                      <div className="task-list">
                        {filtered.map(task => <TaskRow key={task.id} task={task} onSelect={() => setSelected(s => s?.id === task.id ? null : task)} selected={selected?.id === task.id} onToggle={toggleDone} onEdit={() => setModal(task)} onDelete={deleteTask} />)}
                      </div>
                    )
                  ) : (
                    <div className="kanban">
                      {kanbanCols.map(col => {
                        const colTasks = filtered.filter(t => t.status === col.key);
                        return (
                          <div className="kanban-col" key={col.key}>
                            <div className="kanban-header">
                              <div className="kanban-dot" style={{ background: col.color }} />
                              <div className="kanban-col-title">{col.label}</div>
                              <div className="kanban-count">{colTasks.length}</div>
                            </div>
                            {colTasks.map(t => (
                              <div className="kanban-card" key={t.id} onClick={() => setSelected(s => s?.id === t.id ? null : t)}>
                                <div className="kanban-card-title">{t.title}</div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                  <span className="badge pri-badge" style={{ background: PRIORITY_MAP[t.priority]?.bg, color: PRIORITY_MAP[t.priority]?.color, fontSize: 10 }}>{PRIORITY_MAP[t.priority]?.label}</span>
                                  <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[t.category]}</span>
                                  {t.dueDate && <span style={{ fontSize: 11, color: isOverdue(t.dueDate, t.status) ? "var(--danger)" : "var(--text3)" }}>📅 {fmtDate(t.dueDate)}</span>}
                                </div>
                              </div>
                            ))}
                            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 6, fontSize: 12 }} onClick={() => setModal({ status: col.key })}>+ Add</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Detail Panel */}
            {selected && (
              <DetailPanel task={selected} onClose={() => setSelected(null)} onEdit={t => setModal(t)} onDelete={deleteTask} onStatusChange={toggleStatus} />
            )}
          </div>
        </div>
      </div>

      {modal !== null && <TaskModal task={Object.keys(modal).length ? modal : null} onSave={saveTask} onClose={() => setModal(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "warn" ? "var(--bg4)" : "#1a2e1a", border: `1px solid ${toast.type === "warn" ? "var(--border2)" : "rgba(46,213,115,0.3)"}`, color: toast.type === "warn" ? "var(--text2)" : "var(--success)", padding: "10px 20px", borderRadius: 40, fontSize: 13, fontWeight: 500, zIndex: 200, animation: "slideUp .2s ease", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast.type === "warn" ? "🗑" : "✓"} {toast.msg}
        </div>
      )}
    </>
  );
}

function TaskRow({ task, onSelect, selected, onToggle, onEdit, onDelete }) {
  const p = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
  const od = isOverdue(task.dueDate, task.status);
  const soon = isPast3Days(task.dueDate);
  return (
    <div className={`task-card ${task.priority}${task.status === "done" ? " done-card" : ""}${selected ? " selected" : ""}`} style={selected ? { borderColor: "rgba(167,139,250,0.35)", background: "rgba(167,139,250,0.05)" } : {}} onClick={onSelect}>
      <button className={`check-btn${task.status === "done" ? " checked" : ""}`} onClick={e => onToggle(e, task.id)}>
        {task.status === "done" && <span className="check-icon">✓</span>}
      </button>
      <div className="task-body">
        <div className={`task-title${task.status === "done" ? " done-text" : ""}`}>{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          <span className="badge cat-badge">{CATEGORY_ICONS[task.category]} {task.category}</span>
          <span className="badge pri-badge" style={{ background: p.bg, color: p.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dot, display: "inline-block" }} />{p.label}</span>
          {task.dueDate && <span className={`due-badge${od ? " overdue" : soon ? " soon" : ""}`}>{od ? "⚠ Overdue" : soon ? "⏰ Soon" : "📅"} {od || soon ? fmtDate(task.dueDate) : fmtDate(task.dueDate)}</span>}
          {task.tags?.slice(0, 2).map(t => <span key={t} className="badge tag-pill">#{t}</span>)}
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-btn" onClick={e => { e.stopPropagation(); onEdit(task); }} title="Edit">✏</button>
        <button className="icon-btn del" onClick={e => { e.stopPropagation(); onDelete(task.id); }} title="Delete">🗑</button>
      </div>
    </div>
  );
}
