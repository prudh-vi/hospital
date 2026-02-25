import { useState, type ChangeEvent, type ReactNode } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = "http://127.0.0.1:8000/api";

interface Token { value: string | null }
const token: Token = { value: localStorage.getItem("token") };

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "doctor" | "patient" | string;
}

interface Doctor {
  id: number;
  username: string;
  email: string;
  specialization: string;
  experience_years: number | string;
  consultation_fee: number | string;
  is_available: boolean;
}

interface Appointment {
  id: number;
  doctor: number;
  patient: number;
  doctor_name?: string;
  patient_name?: string;
  appointment_date: string;
  status: "scheduled" | "completed" | "cancelled" | string;
  notes: string;
}

interface Prescription {
  id: number;
  appointment: number;
  diagnosis: string;
  medicines: string;
  instructions: string;
  created_at: string;
  doctor_name?: string;
  patient_name?: string;
}

interface Invoice {
  id: number;
  appointment: number;
  amount: number | string;
  status: "paid" | "pending" | string;
  doctor_name?: string;
  patient_name?: string;
  appointment_date?: string;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token.value) headers["Authorization"] = `Bearer ${token.value}`;
  const res = await fetch(API + path, { headers, ...options });
  if (res.status === 401) {
    localStorage.removeItem("token");
    token.value = null;
    window.location.reload();
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return res.json();
  }
  return { status: res.status, statusText: res.statusText };
}

// ── Icons ──────────────────────────────────────────────────────────────────
interface IconProps { d: string; size?: number }
const Icon = ({ d, size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons: Record<string, string> = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  doctors: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  appts: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  rx: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  billing: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
};

// ── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0a;
    color: #f0f0f0;
    font-family: 'DM Mono', monospace;
    min-height: 100vh;
  }

  .serif { font-family: 'DM Serif Display', serif; }

  .app { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 240px;
    min-height: 100vh;
    background: #000;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
    padding: 32px 0;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 10;
  }
  .sidebar-logo {
    padding: 0 24px 32px;
    border-bottom: 1px solid #222;
  }
  .sidebar-logo h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    line-height: 1.2;
    color: #fff;
  }
  .sidebar-logo span {
    font-size: 11px;
    color: #555;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .nav { flex: 1; padding: 24px 0; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 24px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
    letter-spacing: 0.05em;
    transition: all 0.15s;
    border-left: 2px solid transparent;
  }
  .nav-item:hover { color: #ccc; background: #111; }
  .nav-item.active { color: #fff; border-left-color: #fff; background: #111; }
  .logout {
    padding: 24px;
    border-top: 1px solid #222;
  }
  .logout-btn {
    display: flex; align-items: center; gap: 10px;
    background: none; border: 1px solid #333;
    color: #555; padding: 10px 16px;
    cursor: pointer; font-family: 'DM Mono', monospace;
    font-size: 12px; letter-spacing: 0.05em;
    width: 100%; transition: all 0.15s;
  }
  .logout-btn:hover { border-color: #fff; color: #fff; }

  /* ── Main ── */
  .main { margin-left: 240px; flex: 1; padding: 48px; min-height: 100vh; }

  /* ── Auth ── */
  .auth-wrap {
    min-height: 100vh; display: flex;
    align-items: center; justify-content: center;
    background: #0a0a0a;
  }
  .auth-box {
    width: 420px;
    border: 1px solid #222;
    padding: 48px;
  }
  .auth-title {
    font-family: 'DM Serif Display', serif;
    font-size: 36px;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .auth-sub { color: #555; font-size: 13px; margin-bottom: 36px; }
  .tab-row { display: flex; gap: 0; margin-bottom: 32px; }
  .tab {
    flex: 1; padding: 10px;
    background: none; border: 1px solid #333;
    color: #555; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 12px;
    letter-spacing: 0.1em; text-transform: uppercase;
    transition: all 0.15s;
  }
  .tab:first-child { border-right: none; }
  .tab.active { background: #fff; color: #000; border-color: #fff; }

  /* ── Form ── */
  .field { margin-bottom: 16px; }
  .field label {
    display: block; font-size: 11px;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: #555; margin-bottom: 8px;
  }
  .field input, .field select {
    width: 100%; background: #000;
    border: 1px solid #333; color: #f0f0f0;
    padding: 12px 14px; font-family: 'DM Mono', monospace;
    font-size: 13px; outline: none;
    transition: border-color 0.15s;
    appearance: none;
  }
  .field input:focus, .field select:focus { border-color: #fff; }
  .field select option { background: #111; }

  .btn {
    width: 100%; padding: 14px;
    background: #fff; color: #000;
    border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 13px;
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: opacity 0.15s; margin-top: 8px;
  }
  .btn:hover { opacity: 0.85; }
  .btn.outline {
    background: none; color: #fff;
    border: 1px solid #333;
  }
  .btn.outline:hover { border-color: #fff; }
  .btn.sm { width: auto; padding: 8px 16px; font-size: 11px; }
  .btn.danger { background: #fff; color: #c00; }

  .err { color: #ff4444; font-size: 12px; margin-top: 12px; }
  .ok  { color: #44ff88; font-size: 12px; margin-top: 12px; }

  /* ── Page Header ── */
  .page-header { margin-bottom: 40px; }
  .page-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 40px; color: #fff;
  }
  .page-header p { color: #555; font-size: 13px; margin-top: 6px; }

  /* ── Stats ── */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
    background: #222; margin-bottom: 48px; }
  .stat { background: #0a0a0a; padding: 32px; }
  .stat-num {
    font-family: 'DM Serif Display', serif;
    font-size: 48px; line-height: 1; color: #fff;
  }
  .stat-label { font-size: 11px; letter-spacing: 0.15em;
    text-transform: uppercase; color: #555; margin-top: 8px; }

  /* ── Table ── */
  .table-wrap { border: 1px solid #222; overflow: hidden; }
  .table-head {
    display: grid; padding: 14px 20px;
    background: #111; border-bottom: 1px solid #222;
    font-size: 11px; letter-spacing: 0.12em;
    text-transform: uppercase; color: #555;
  }
  .table-row {
    display: grid; padding: 16px 20px;
    border-bottom: 1px solid #111;
    font-size: 13px; align-items: center;
    transition: background 0.1s;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: #111; }

  /* grid templates */
  .col-3 { grid-template-columns: 1fr 1fr 1fr; }
  .col-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .col-5 { grid-template-columns: 1fr 1fr 1fr 1fr 1fr; }
  .col-6 { grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; }

  .badge {
    display: inline-block; padding: 3px 10px;
    font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; border: 1px solid;
  }
  .badge.scheduled { border-color: #555; color: #aaa; }
  .badge.completed { border-color: #44ff88; color: #44ff88; }
  .badge.cancelled { border-color: #ff4444; color: #ff4444; }
  .badge.paid { border-color: #44ff88; color: #44ff88; }
  .badge.pending { border-color: #ffaa00; color: #ffaa00; }
  .badge.admin { border-color: #fff; color: #fff; }
  .badge.doctor { border-color: #aaa; color: #aaa; }
  .badge.patient { border-color: #666; color: #666; }

  /* ── Modal ── */
  .modal-bg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
  }
  .modal {
    background: #0a0a0a; border: 1px solid #333;
    padding: 40px; width: 460px;
    max-height: 90vh; overflow-y: auto;
  }
  .modal h3 {
    font-family: 'DM Serif Display', serif;
    font-size: 24px; margin-bottom: 24px;
  }
  .modal-btns { display: flex; gap: 12px; margin-top: 24px; }

  .section-header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 24px;
  }

  .empty { padding: 48px; text-align: center; color: #333;
    font-size: 13px; letter-spacing: 0.1em; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade { animation: fadeIn 0.25s ease; }
`;

// ── Components ─────────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal fade" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── Auth ───────────────────────────────────────────────────────────────────

function Auth({ onAuth }: { onAuth: (user: User) => void }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "patient" });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setErr(null); setMsg(null);
    try {
      if (tab === "login") {
        const data = await apiFetch("/users/login/", {
          method: "POST",
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        if (data.access) {
          token.value = data.access;
          localStorage.setItem("token", data.access);
          // fetch user info
          const me = await apiFetch("/users/me/");
          onAuth(me || { id: 0, username: form.username, email: "", role: "patient" });
        } else setErr(data.detail || "Login failed");
      } else {
        const data = await apiFetch("/users/register/", {
          method: "POST",
          body: JSON.stringify(form),
        });
        if (data.id) { setMsg("Registered! Please login."); setTab("login"); }
        else setErr(JSON.stringify(data));
      }
    } catch { setErr("Cannot reach server. Make sure Django is running."); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box fade">
        <div className="auth-title">Hospital<br /><i>Management</i></div>
        <div className="auth-sub">Clinical operations platform</div>
        <div className="tab-row">
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Login</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        </div>
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={set("username")} placeholder="username" />
        </div>
        {tab === "register" && <>
          <div className="field">
            <label>Email</label>
            <input value={form.email} onChange={set("email")} placeholder="email@hospital.com" />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={set("role")}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </>}
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <button className="btn" onClick={submit}>{tab === "login" ? "Sign In" : "Create Account"}</button>
        {err && <div className="err">⚠ {err}</div>}
        {msg && <div className="ok">✓ {msg}</div>}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  const stats = [
    { num: "—", label: "Doctors" },
    { num: "—", label: "Patients" },
    { num: "—", label: "Appointments" },
    { num: "—", label: "Revenue" },
  ];
  return (
    <div className="fade">
      <div className="page-header">
        <h2>Good morning, <i>{user.username}</i></h2>
        <p>Here's what's happening at the hospital today.</p>
      </div>
      <div className="stats">
        {stats.map(s => (
          <div className="stat" key={s.label}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <div className="empty">CONNECT YOUR DJANGO BACKEND TO SEE LIVE DATA</div>
      </div>
    </div>
  );
}

// ── Doctors ────────────────────────────────────────────────────────────────

function Doctors({ user }: { user: User }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ username: "", email: "", password: "", specialization: "general", experience_years: "", consultation_fee: "" });
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    try { const d = await apiFetch("/users/doctors/"); setDoctors(Array.isArray(d) ? d : []); }
    catch { setDoctors([]); }
    setLoading(false);
  }

  useState(() => { load(); });

  async function create() {
    setMsg(null);
    try {
      // register user first
      await apiFetch("/users/register/", { method: "POST", body: JSON.stringify({ username: form.username, email: form.email, password: form.password, role: "doctor" }) });
      setMsg("Doctor registered! They need to create their profile via admin.");
      setShow(false); load();
    } catch { setMsg("Error"); }
  }

  return (
    <div className="fade">
      <div className="page-header">
        <div className="section-header">
          <div>
            <h2>Doctors</h2>
            <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Medical staff directory</p>
          </div>
          {user.role === "admin" && <button className="btn sm" onClick={() => setShow(true)}>+ Add Doctor</button>}
        </div>
      </div>
      <div className="table-wrap">
        <div className="table-head col-4"><span>Name</span><span>Specialization</span><span>Experience</span><span>Fee</span></div>
        {loading ? <div className="empty">Loading...</div>
          : doctors.length === 0 ? <div className="empty">NO DOCTORS FOUND</div>
            : doctors.map(d => (
              <div className="table-row col-4" key={d.id}>
                <span>{d.username}</span>
                <span>{d.specialization}</span>
                <span>{d.experience_years} yrs</span>
                <span>₹{d.consultation_fee}</span>
              </div>
            ))}
      </div>
      {msg && <div className="ok" style={{ marginTop: 16 }}>✓ {msg}</div>}
      {show && (
        <Modal title="Add Doctor" onClose={() => setShow(false)}>
          {["username", "email", "password"].map(k => (
            <div className="field" key={k}>
              <label>{k}</label>
              <input type={k === "password" ? "password" : "text"} value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div className="field"><label>Specialization</label>
            <select value={form.specialization} onChange={set("specialization")}>
              {["general", "cardiologist", "neurologist", "orthopedic"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="modal-btns">
            <button className="btn" onClick={create}>Register</button>
            <button className="btn outline" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Appointments ───────────────────────────────────────────────────────────

function Appointments({ user }: { user: User }) {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ doctor: "", patient: user.role === "patient" ? user.id.toString() : "", appointment_date: "", notes: "" });

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([apiFetch("/appointments/"), apiFetch("/users/doctors/")]);
      setAppts(Array.isArray(a) ? a : []);
      setDoctors(Array.isArray(d) ? d : []);
    } catch {
      setAppts([]);
      setDoctors([]);
    }
    setLoading(false);
  }

  useState(() => {
    load();
  });

  async function create() {
    setErr(null);
    const payload = { ...form };
    if (user.role === "patient") delete payload.patient;
    const res = await apiFetch("/appointments/", { method: "POST", body: JSON.stringify(payload) });
    if (res.id) {
      setShow(false); load();
    } else {
      setErr(JSON.stringify(res));
    }
  }

  async function updateStatus(id: number, status: string) {
    await apiFetch(`/appointments/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="fade">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h2>Appointments</h2>
          <p>Schedule & track patient visits</p>
        </div>
        {user.role !== "doctor" && <button className="btn sm" onClick={() => setShow(true)}>+ Book</button>}
      </div>
      <div className="table-wrap">
        <div className="table-head col-6"><span>ID</span><span>Doctor</span><span>Patient</span><span>Date</span><span>Status</span><span></span></div>
        {loading ? <div className="empty">Loading...</div>
          : appts.length === 0 ? <div className="empty">NO APPOINTMENTS</div>
            : appts.map(a => (
              <div className="table-row col-6" key={a.id}>
                <span style={{ color: "#555" }}>#{a.id}</span>
                <span>{a.doctor_name || `Dr. ${a.doctor}`}</span>
                <span>{a.patient_name || a.patient}</span>
                <span>{new Date(a.appointment_date).toLocaleDateString()}</span>
                <span><Badge status={a.status} /></span>
                <span style={{ textAlign: "right" }}>
                  {user.role === "doctor" && a.status === "scheduled" && (
                    <button className="btn sm" onClick={() => updateStatus(a.id, "completed")}>Complete</button>
                  )}
                  {user.role === "doctor" && a.status === "scheduled" && (
                    <button className="btn sm outline" style={{ marginLeft: 8 }} onClick={() => updateStatus(a.id, "cancelled")}>Cancel</button>
                  )}
                </span>
              </div>
            ))}
      </div>
      {show && (
        <Modal title="Book Appointment" onClose={() => setShow(false)}>
          <div className="field">
            <label>Select Doctor</label>
            <select value={form.doctor} onChange={set("doctor")}>
              <option value="">-- Choose a Doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.username} ({d.specialization})</option>
              ))}
            </select>
          </div>
          {user.role === "admin" && (
            <div className="field">
              <label>Patient ID</label>
              <input value={form.patient} onChange={set("patient")} placeholder="Enter patient ID" />
            </div>
          )}
          <div className="field"><label>Date & Time</label><input type="datetime-local" value={form.appointment_date} onChange={set("appointment_date")} /></div>
          <div className="field"><label>Notes</label><input value={form.notes} onChange={set("notes")} placeholder="Reason for visit..." /></div>
          {err && <div className="err" style={{ marginTop: 12 }}>⚠ {err}</div>}
          <div className="modal-btns">
            <button className="btn" onClick={create} disabled={!form.doctor || !form.appointment_date}>Book</button>
            <button className="btn outline" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Prescriptions ──────────────────────────────────────────────────────────

function Prescriptions({ user }: { user: User }) {
  const [list, setList] = useState<Prescription[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ appointment: "", diagnosis: "", medicines: "", instructions: "" });

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([apiFetch("/prescriptions/"), apiFetch("/appointments/")]);
      setList(Array.isArray(p) ? p : []);
      setAppts(Array.isArray(a) ? a : []);
    } catch {
      setList([]);
      setAppts([]);
    }
    setLoading(false);
  }

  useState(() => {
    load();
  });

  async function create() {
    setErr(null);
    const res = await apiFetch("/prescriptions/", { method: "POST", body: JSON.stringify(form) });
    if (res.id) {
      setShow(false); load();
    } else {
      setErr(JSON.stringify(res));
    }
  }

  return (
    <div className="fade">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h2>Prescriptions</h2>
          <p>Diagnosis & medication records</p>
        </div>
        {user.role === "doctor" && <button className="btn sm" onClick={() => setShow(true)}>+ New Rx</button>}
      </div>
      <div className="table-wrap">
        <div className="table-head col-5"><span>ID</span><span>Patient</span><span>Doctor</span><span>Diagnosis</span><span>Date</span></div>
        {loading ? <div className="empty">Loading...</div>
          : list.length === 0 ? <div className="empty">NO PRESCRIPTIONS</div>
            : list.map(p => (
              <div className="table-row col-5" key={p.id}>
                <span style={{ color: "#555" }}>#{p.id}</span>
                <span>{p.patient_name || `Appt #${p.appointment}`}</span>
                <span>{p.doctor_name || '—'}</span>
                <span>{p.diagnosis}</span>
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
      </div>
      {show && (
        <Modal title="New Prescription" onClose={() => setShow(false)}>
          <div className="field">
            <label>Select Appointment</label>
            <select value={form.appointment} onChange={set("appointment")}>
              <option value="">-- Choose Appointment --</option>
              {appts.filter(a => a.status !== "cancelled").map(a => (
                <option key={a.id} value={a.id}>{a.patient_name || `Patient #${a.patient}`} - {new Date(a.appointment_date).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Diagnosis</label><input value={form.diagnosis} onChange={set("diagnosis")} placeholder="e.g. Common Cold" /></div>
          <div className="field"><label>Medicines</label><input value={form.medicines} onChange={set("medicines")} placeholder="Paracetamol 500mg - twice daily" /></div>
          <div className="field"><label>Instructions</label><input value={form.instructions} onChange={set("instructions")} placeholder="Take after meals" /></div>
          {err && <div className="err" style={{ marginTop: 12 }}>⚠ {err}</div>}
          <div className="modal-btns">
            <button className="btn" onClick={create} disabled={!form.appointment || !form.diagnosis}>Save</button>
            <button className="btn outline" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Billing ────────────────────────────────────────────────────────────────

function Billing({ user }: { user: User }) {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ appointment: "", amount: "" });
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    try { const d = await apiFetch("/billing/"); setList(Array.isArray(d) ? d : []); }
    catch { setList([]); }
    setLoading(false);
  }

  useState(() => { load(); });

  async function create() {
    await apiFetch("/billing/", { method: "POST", body: JSON.stringify(form) });
    setShow(false); load();
  }


  const downloadInvoice = async (i: Invoice) => {
    // We create a temporary hidden div for the PDF content
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = "-9999px";
    div.style.top = "0";
    div.style.width = "800px";
    div.style.background = "#fff";
    div.style.color = "#000";
    div.style.padding = "40px";
    div.style.fontFamily = "sans-serif";

    div.innerHTML = `
      <div style="background: #0088ff; padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">Zetran Hospital</h1>
          <p style="margin: 0; font-size: 12px;">GSTIN: 123456789321456</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px;">EST-000${i.id}</h2>
          <p style="margin: 0; font-size: 12px;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
        <div style="width: 45%;">
          <h4 style="border-bottom: 2px solid #0088ff; padding-bottom: 5px;">Bill to</h4>
          <p style="font-size: 14px; margin: 5px 0;">Patient: ${i.patient_name || 'N/A'}</p>
          <p style="font-size: 14px; margin: 5px 0;">Appointment ID: #${i.appointment}</p>
        </div>
        <div style="width: 45%;">
          <h4 style="border-bottom: 2px solid #0088ff; padding-bottom: 5px;">Clinician Details</h4>
          <p style="font-size: 14px; margin: 5px 0;">Doctor: ${i.doctor_name || 'N/A'}</p>
          <p style="font-size: 14px; margin: 5px 0;">Status: ${i.status.toUpperCase()}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
        <thead>
          <tr style="background: #0088ff; color: white;">
            <th style="padding: 10px; text-align: left;">Item Description</th>
            <th style="padding: 10px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Medical Consultation & Services for Appt #${i.appointment}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${i.amount}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #0088ff; color: white; font-weight: bold;">
            <td style="padding: 10px; text-align: left;">Total</td>
            <td style="padding: 10px; text-align: right;">₹${i.amount}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="width: 60%; font-size: 12px; color: #555;">
          <p><strong>Terms & Notes</strong></p>
          <p>Valid for 7 days from the date of issue.</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 18px; font-weight: bold; margin: 0;">Total Amount: ₹${i.amount}</p>
          <div style="margin-top: 40px;">
            <div style="width: 150px; border-bottom: 1px solid #000; margin-left: auto;"></div>
            <p style="font-size: 12px; margin-top: 5px;">Authorised Signature</p>
          </div>
        </div>
      </div>
      <div style="background: #0088ff; padding: 10px; color: white; margin-top: 50px; font-size: 11px; display: flex; justify-content: space-between;">
        <span>Adambakkam, Chennai, Tamil Nadu 600088</span>
        <span>Mobile: 9876543210</span>
        <span>www.zetran.com</span>
      </div>
    `;

    document.body.appendChild(div);

    try {
      const canvas = await html2canvas(div, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_${i.id}.pdf`);
    } catch (err) {
      console.error("PDF gen failed", err);
    } finally {
      document.body.removeChild(div);
    }
  };

  return (
    <div className="fade">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h2>Billing</h2>
          <p>Invoice & payment tracking</p>
        </div>
        {user.role === "admin" && <button className="btn sm" onClick={() => setShow(true)}>+ Invoice</button>}
      </div>
      <div className="table-wrap">
        <div className="table-head col-5"><span>Invoice</span><span>Appointment</span><span>Amount</span><span>Status</span><span></span></div>
        {loading ? <div className="empty">Loading...</div>
          : list.length === 0 ? <div className="empty">NO INVOICES</div>
            : list.map(i => (
              <div className="table-row col-5" key={i.id}>
                <span style={{ color: "#555" }}>#{i.id}</span>
                <span>Appt #{i.appointment}</span>
                <span>₹{i.amount}</span>
                <span><Badge status={i.status} /></span>
                <span style={{ textAlign: "right" }}>
                  <button onClick={() => downloadInvoice(i)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}>
                    <Icon d={icons.download} size={16} />
                  </button>
                </span>
              </div>
            ))}
      </div>
      {show && (
        <Modal title="New Invoice" onClose={() => setShow(false)}>
          <div className="field"><label>Appointment ID</label><input value={form.appointment} onChange={set("appointment")} /></div>
          <div className="field"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={set("amount")} /></div>
          <div className="modal-btns">
            <button className="btn" onClick={create}>Create</button>
            <button className="btn outline" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "doctors", label: "Doctors", icon: "doctors" },
  { id: "appointments", label: "Appointments", icon: "appts" },
  { id: "prescriptions", label: "Prescriptions", icon: "rx" },
  { id: "billing", label: "Billing", icon: "billing" },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState("dashboard");

  useState(() => {
    if (token.value) {
      apiFetch("/users/me/").then(me => {
        if (me && me.id) setUser(me);
        else {
          token.value = null;
          localStorage.removeItem("token");
        }
      });
    }
  });

  const renderPage = (): ReactNode => {
    if (!user) return null;
    if (page === "dashboard") return <Dashboard user={user} />;
    if (page === "doctors") return <Doctors user={user} />;
    if (page === "appointments") return <Appointments user={user} />;
    if (page === "prescriptions") return <Prescriptions user={user} />;
    if (page === "billing") return <Billing user={user} />;
    return null;
  };

  if (!user) return (
    <>
      <style>{css}</style>
      <Auth onAuth={setUser} />
    </>
  );

  const rolePages = pages.filter(p => {
    if (user.role === "admin") return true;
    if (user.role === "doctor") return ["dashboard", "doctors", "appointments", "prescriptions"].includes(p.id);
    if (user.role === "patient") return ["dashboard", "doctors", "appointments", "prescriptions", "billing"].includes(p.id);
    return false;
  });

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Hospital<br /><i>System</i></h1>
            <div style={{ marginTop: 12 }}>
              <span>{user.username}</span><br />
              <Badge status={(user.role as string) || "admin"} />
            </div>
          </div>
          <nav className="nav">
            {rolePages.map(p => (
              <div key={p.id} className={`nav-item ${page === p.id ? "active" : ""}`} onClick={() => setPage(p.id)}>
                <Icon d={icons[p.icon]} size={16} />
                {p.label}
              </div>
            ))}
          </nav>
          <div className="logout">
            <button className="logout-btn" onClick={() => { token.value = null; localStorage.removeItem("token"); setUser(null); }}>
              <Icon d={icons.logout} size={14} /> Sign Out
            </button>
          </div>
        </aside>
        <main className="main">{renderPage()}</main>
      </div>
    </>
  );
}