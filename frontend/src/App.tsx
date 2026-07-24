import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  Activity,
  Bug,
  FileSearch,
  Gauge,
  LogOut,
  Radio,
  ShieldAlert,
  Swords,
  Upload,
  Users,
} from "lucide-react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, DashboardData, Entity, login, token } from "./api";

const COLORS = ["#35d0ba", "#f5b942", "#ff6b6b", "#7c83fd", "#45a3ff"];

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      navigate("/");
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  return (
    <main className="login">
      <section className="login-card">
        <ShieldAlert size={40} />
        <p className="eyebrow">CYBER THREAT INTELLIGENCE</p>
        <h1>Sentinel CTI</h1>
        <p className="muted">Inteligência acionável, em um único lugar.</p>
        <form onSubmit={submit}>
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Senha<input name="password" type="password" required /></label>
          {error && <p className="error">{error}</p>}
          <button>Entrar na plataforma</button>
        </form>
        <p className="hint">Crie o primeiro usuário pela API em <code>/docs</code>.</p>
      </section>
    </main>
  );
}

const links = [
  ["/", "Dashboard", Gauge],
  ["/iocs", "IOCs", Radio],
  ["/cves", "CVEs", Bug],
  ["/threat-actors", "Threat Actors", Users],
  ["/campaigns", "Campanhas", Swords],
  ["/mitre-techniques", "MITRE ATT&CK", ShieldAlert],
  ["/reports", "Relatórios", Upload],
  ["/enrichment", "Enriquecimento", FileSearch],
  ["/timeline", "Timeline", Activity],
] as const;

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <aside>
        <div className="brand"><ShieldAlert /><div><strong>Sentinel</strong><small>CTI PLATFORM</small></div></div>
        <nav>
          {links.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={() => { sessionStorage.clear(); location.assign("/login"); }}>
          <LogOut size={17} /> Sair
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function useData<T>(path: string, initial: T) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const load = () => api<T>(path).then(setData).catch((e) => setError(e.message));
  useEffect(load, [path]);
  return { data, error, load };
}

function Dashboard() {
  const { data, error } = useData<DashboardData>("/dashboard", {
    counts: {}, severity: {}, ioc_types: {}, recent_events: [],
  });
  const severity = Object.entries(data.severity).map(([name, value]) => ({ name, value }));
  const types = Object.entries(data.ioc_types).map(([name, value]) => ({ name, value }));
  return (
    <>
      <Header title="Visão geral" subtitle="Panorama atual da superfície de ameaças" />
      {error && <p className="error">{error}</p>}
      <section className="metrics">
        {[
          ["IOCs", data.counts.iocs || 0, Radio],
          ["CVEs", data.counts.cves || 0, Bug],
          ["Threat Actors", data.counts.actors || 0, Users],
          ["Campanhas", data.counts.campaigns || 0, Swords],
        ].map(([name, count, Icon]) => (
          <article className="metric" key={String(name)}>
            <Icon size={22} /><span>{name as string}</span><strong>{count as number}</strong>
          </article>
        ))}
      </section>
      <section className="charts">
        <article className="panel">
          <h2>IOCs por tipo</h2>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={types}><CartesianGrid stroke="#203248" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#35d0ba" radius={5} /></BarChart>
          </ResponsiveContainer>
        </article>
        <article className="panel">
          <h2>Severidade</h2>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart><Pie data={severity} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95} paddingAngle={4}>{severity.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </article>
      </section>
      <article className="panel events">
        <h2>Atividade recente</h2>
        {data.recent_events.length === 0 && <p className="empty">Nenhum evento registrado.</p>}
        {data.recent_events.map((event) => <div key={event.id}><span className="dot" /><strong>{event.title}</strong><time>{new Date(event.occurred_at).toLocaleString("pt-BR")}</time></div>)}
      </article>
    </>
  );
}

const entityConfig: Record<string, { title: string; endpoint: string; fields: Array<[string, string, string]> }> = {
  iocs: { title: "Indicadores de Comprometimento", endpoint: "/iocs", fields: [["type", "Tipo", "select:ioc"], ["value", "Valor", "text"], ["severity", "Severidade", "select:severity"], ["confidence", "Confiança", "number"], ["source", "Fonte", "text"], ["description", "Descrição", "textarea"]] },
  cves: { title: "Vulnerabilidades", endpoint: "/cves", fields: [["cve_id", "CVE ID", "text"], ["description", "Descrição", "textarea"], ["cvss_score", "CVSS", "number"], ["epss_score", "EPSS", "number"]] },
  "threat-actors": { title: "Threat Actors", endpoint: "/threat-actors", fields: [["name", "Nome", "text"], ["country", "País", "text"], ["motivation", "Motivação", "text"], ["sophistication", "Sofisticação", "text"], ["description", "Descrição", "textarea"]] },
  "mitre-techniques": { title: "MITRE ATT&CK", endpoint: "/mitre-techniques", fields: [["external_id", "ID (Txxxx)", "text"], ["name", "Nome", "text"], ["tactic", "Tática", "text"], ["description", "Descrição", "textarea"]] },
  campaigns: { title: "Campanhas", endpoint: "/campaigns", fields: [["name", "Nome", "text"], ["status", "Status", "text"], ["first_seen", "Início", "date"], ["last_seen", "Fim", "date"], ["description", "Descrição", "textarea"]] },
};

function EntityPage({ kind }: { kind: string }) {
  const config = entityConfig[kind];
  const { data, error, load } = useData<Entity[]>(config.endpoint, []);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    config.fields.forEach(([name, , type]) => {
      const value = form.get(name);
      if (value === "") return;
      payload[name] = type === "number" ? Number(value) : value;
    });
    try {
      await api(config.endpoint, { method: "POST", body: JSON.stringify(payload) });
      event.currentTarget.reset(); setOpen(false); load();
    } catch (reason) { setFormError((reason as Error).message); }
  }
  return (
    <>
      <Header title={config.title} subtitle={`${data.length} registros`} action={<button onClick={() => setOpen(!open)}>+ Novo registro</button>} />
      {(error || formError) && <p className="error">{error || formError}</p>}
      {open && <form className="panel entity-form" onSubmit={submit}>
        {config.fields.map(([name, label, type]) => <label key={name}>{label}{field(name, type)}</label>)}
        <div><button type="submit">Salvar</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button></div>
      </form>}
      <article className="panel table-wrap">
        <table><thead><tr>{config.fields.slice(0, 4).map(([, label]) => <th key={label}>{label}</th>)}<th>Risco</th></tr></thead>
        <tbody>{data.map((row) => <tr key={row.id}>{config.fields.slice(0, 4).map(([key]) => <td key={key}>{String(row[key] ?? "—")}</td>)}<td>{row.risk_score !== undefined ? <span className="score">{String(row.risk_score)}</span> : "—"}</td></tr>)}</tbody></table>
        {data.length === 0 && <p className="empty">Nenhum registro. Comece adicionando um item.</p>}
      </article>
    </>
  );
}

function field(name: string, type: string) {
  if (type === "textarea") return <textarea name={name} rows={3} />;
  if (type === "select:ioc") return <select name={name}><option value="ipv4">IPv4</option><option value="domain">Domínio</option><option value="url">URL</option><option value="sha256">SHA-256</option><option value="email">E-mail</option></select>;
  if (type === "select:severity") return <select name={name}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select>;
  return <input name={name} type={type} step={type === "number" ? "any" : undefined} required={["value", "name", "cve_id", "external_id"].includes(name)} />;
}

function Reports() {
  const { data, load } = useData<Entity[]>("/reports", []);
  const [message, setMessage] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const body = new FormData(event.currentTarget);
    try { const report = await api<Entity>("/reports", { method: "POST", body }, true); setMessage(`${(report.extracted_iocs as unknown[])?.length || 0} IOCs extraídos.`); load(); }
    catch (reason) { setMessage((reason as Error).message); }
  }
  return <><Header title="Relatórios" subtitle="Extração automática de indicadores em PDF" />
    <form className="panel upload" onSubmit={upload}><Upload size={35} /><label>Título<input name="title" required /></label><label>Arquivo PDF<input name="file" type="file" accept=".pdf,application/pdf" required /></label><button>Processar relatório</button>{message && <p>{message}</p>}</form>
    <article className="panel table-wrap"><table><thead><tr><th>Título</th><th>Arquivo</th><th>Status</th><th>IOCs</th></tr></thead><tbody>{data.map((r) => <tr key={r.id}><td>{String(r.title)}</td><td>{String(r.filename)}</td><td><span className="status">{String(r.status)}</span></td><td>{(r.extracted_iocs as unknown[])?.length || 0}</td></tr>)}</tbody></table></article></>;
}

function Enrichment() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const providers = data.getAll("providers");
    try { setResult(await api("/lookups", { method: "POST", body: JSON.stringify({ observable: data.get("observable"), providers }) })); }
    catch (reason) { setError((reason as Error).message); }
  }
  return <><Header title="Enriquecimento" subtitle="Consulte múltiplas fontes de inteligência" />
    <form className="panel enrichment" onSubmit={submit}><label>IP, domínio, URL ou hash<input name="observable" required placeholder="8.8.8.8" /></label><fieldset><legend>Provedores</legend>{["shodan", "censys", "virustotal", "abuseipdb", "greynoise", "misp"].map((p) => <label key={p}><input type="checkbox" name="providers" value={p} defaultChecked />{p}</label>)}</fieldset><button>Consultar inteligência</button></form>
    {error && <p className="error">{error}</p>}{result && <pre className="panel results">{JSON.stringify(result, null, 2)}</pre>}</>;
}

function Timeline() {
  const { data } = useData<Array<Record<string, string>>>("/timeline", []);
  return <><Header title="Timeline" subtitle="Histórico cronológico de inteligência" /><article className="panel timeline">{data.map((e) => <div key={e.id}><span className="dot" /><time>{new Date(e.occurred_at).toLocaleString("pt-BR")}</time><strong>{e.title}</strong><small>{e.event_type}</small></div>)}{data.length === 0 && <p className="empty">Nenhum evento registrado.</p>}</article></>;
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">SENTINEL CTI</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>;
}

function Protected({ children }: { children: ReactNode }) {
  return token() ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return <BrowserRouter><Routes><Route path="/login" element={<Login />} />
    <Route path="/" element={<Protected><Dashboard /></Protected>} />
    {Object.keys(entityConfig).map((kind) => <Route key={kind} path={`/${kind}`} element={<Protected><EntityPage kind={kind} /></Protected>} />)}
    <Route path="/reports" element={<Protected><Reports /></Protected>} />
    <Route path="/enrichment" element={<Protected><Enrichment /></Protected>} />
    <Route path="/timeline" element={<Protected><Timeline /></Protected>} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></BrowserRouter>;
}
