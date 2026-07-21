import { useCallback, useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { adminListUsersApi, adminSetRoleApi, ROLES } from "../api/authApi";
import { useNavigate } from "react-router-dom";

const ROLE_LABEL = {
  [ROLES.USER]: "User",
  [ROLES.EXPERT_APPLICANT]: "Expert applicant",
  [ROLES.EXPERT]: "Expert",
  [ROLES.ADMIN]: "Admin",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: ROLES.EXPERT_APPLICANT, label: "Pending experts" },
  { id: ROLES.EXPERT, label: "Experts" },
  { id: ROLES.USER, label: "Users" },
];

function AdminPanel() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try{
            const data = await adminListUsersApi();
            setUsers(data.users || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = "Admin - Pitchnode";
        let cancelled = false;        
        (async () => {
            if(!cancelled) 
                await load();
        })();
        return () => {
            cancelled = true;
        };
    }, [load]);

    const changeRole = async (id, role) => {
        setBusyId(id);
        try{
            const updated = await adminSetRoleApi(id, role);
            setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated} : u)));
        } finally {
            setBusyId(null)
        }
    }

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            const roleOk = filter === "all" || u.role === filter;
            const searchOk = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
            return roleOk && searchOk;
        });
    }, [users, filter, search]);

    const stats = useMemo(
        () => ({
            total: users.length,
            experts: users.filter((u) => u.role === ROLES.EXPERT).length,
            pending: users.filter((u) => u.role === ROLES.EXPERT_APPLICANT).length,
            admins: users.filter((u) => u.role === ROLES.ADMIN).length,
        }), 
        [users]
    );

    return(
        <>
            <nav className="pn-nav">
                <Logo />
                <div className="admin-nav__right">
                    <span className="pn-pill">Signed in as {user?.full_name}</span>
                    <button
                        className="pn-btn pn-btn--ghost"
                        onClick={async () => {
                        await logout();
                        navigate("/login", { replace: true });
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </nav>
        
            <main className="admin-main">
                <header className="admin-head">
                    <h1>Admin Panel</h1>
                    <p>Manage accounts, approve experts, and oversee platform records.</p>
                </header>

                <section className="admin-stats">
                    {[
                        ["Total accounts", stats.total],
                        ["Experts", stats.experts],
                        ["Pending approval", stats.pending],
                        ["Admins", stats.admins],
                    ].map(([label, value]) => {
                        <div className="pn-card admin-stat" key={label}>
                            <p className="admin-stat__label">{label}</p>
                            <p className="admin-stat__value">{value}</p>
                        </div>
                    })}
                </section>

                <section className="admin-toolbar">
                    <div className="admin-filters">
                        {FILTERS.map((f) => {
                            <button
                                key={f.id}
                                className={`admin-filters${filter === f.id ? "admin-filter--active": ""}`}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.label}
                                {f.id === ROLES.EXPERT_APPLICANT && stats.pending > 0 && (
                                    <span className="admin-filter--count">{stats.pending}</span>
                                )}
                            </button>

                        })}
                    </div>

                    <input
                        className="pn-input admin-search"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={() => setSearch(e.target.value)}
                    />
                </section>

                <section className="pn-card admin-table">
                    { loading ? (
                        <p className="admin-empty">Loading accounts ...</p>
                    ) : visible.length === 0 ? (
                        <p className="admin-empty">No accounts match this view</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th className="admin-empty">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((u) => (
                                    <tr key={u.id}>
                                        <td className="admin-name">{u.full_name || "—"}</td>
                                        <td className="admin-email">{u.email}</td>
                                        <td>
                                            <span className={`admin-role admin-role--${u.role}`}>
                                                {ROLE_LABEL[u.role] ?? u.role}
                                            </span>
                                        </td>
                                        <td>
                                            {u.verified? (
                                                <span className="admin-status admin-status--ok">Verified</span>
                                            ) : (
                                                <span className="admin-status admin-status--wait">Pending</span>
                                            )}
                                        </td>
                                        <td className="admin-col-actions">
                                            {u.role === ROLES.EXPERT_APPLICANT && (
                                                <>
                                                    <button
                                                        className="pn-btn pn-btn--primary admin-action"
                                                        disabled={busyId === u.id}
                                                        onClick={() => changeRole(u.id, ROLES.EXPERT)}
                                                    >
                                                        Approve
                                                    </button>

                                                    <button
                                                        className="pn-btn pn-btn--ghost admin-action"
                                                        disabled={busyId === u.id}
                                                        onClick={() => changeRole(u.id, ROLES.USER)}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {u.role === ROLES.EXPERT && (
                                                <button
                                                    className="pn-btn pn-btn--ghost admin-action"
                                                    disabled={busyId === u.id}
                                                    onClick={() => changeRole(u.id, ROLES.USER)}
                                                >
                                                    Revoke expert
                                                </button>
                                            )}
                                            {u.role === ROLES.USER && (
                                                <button
                                                    className="pn-btn pn-btn--ghost admin-action"
                                                    disabled={busyId === u.id}
                                                    onClick={() => changeRole(u.id, ROLES.EXPERT)}
                                                >
                                                    Make expert
                                                </button>
                                            )}
                                            {u.role === ROLES.ADMIN && (
                                                <span className="admin-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
                
            </main>
        </>
    );
}

export default AdminPanel;