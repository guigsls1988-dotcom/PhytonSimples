import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  Activity,
  Bug,
  FileSearch,
  Gauge,
  Globe2,
  ExternalLink,
  Radio,
  RefreshCw,
  ShieldAlert,
  Swords,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

import { api, DashboardData, Entity, RegionalIntel } from "./api";

const COLORS = ["#35d0ba", "#f5b942", "#ff6b6b", "#7c83fd", "#45a3ff"];

const links = [
  ["/", "Dashboard", Gauge],
  ["/latam", "Inteligência LATAM", Globe2],
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
        <div className="brand"><ShieldAlert /><div><strong>Palmer</strong><small>CTI INVESTIGATE</small></div></div>
        <nav>
          {links.map(([path, label, Icon]) => (
            <a key={path} href={path} className={window.location.pathname === path ? "active" : ""}>
              <Icon size={18} />{label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function useData<T>(path: string, initial: T) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const load = () => api<T>(path).then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, [path]);
  return { data, error, load };
}

function Dashboard() {
  const { data, error } = useData<DashboardData>("/dashboard", {
    counts: {},
    severity: {},
    ioc_types: {},
    recent_events: [],
    latam: { total: 0, countries: {}, severity: {}, recent: [] },
  });
  const severity = Object.entries(data.severity).map(([name, value]) => ({ name, value }));
  const types = Object.entries(data.ioc_types).map(([name, value]) => ({ name, value }));
  const countries = Object.entries(data.latam.countries).map(([name, value]) => ({ name, value }));
  return (
    <>
      <Header title="Visão geral" subtitle="Panorama atual da superfície de ameaças" />
      {error && <p className="error">{error}</p>}
      <section className="metrics">
        {([
          ["IOCs", data.counts.iocs || 0, Radio],
          ["CVEs", data.counts.cves || 0, Bug],
          ["Threat Actors", data.counts.actors || 0, Users],
          ["Campanhas", data.counts.campaigns || 0, Swords],
          ["Alertas LATAM", data.latam.total || 0, Globe2],
        ] as Array<[string, number, LucideIcon]>).map(([name, count, Icon]) => (
          <article className="metric" key={String(name)}>
            <Icon size={22} /><span>{name}</span><strong>{count}</strong>
          </article>
        ))}
      </section>
      <section className="charts">
        <article className="panel">
          <h2>Inteligência regional por país</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={countries} layout="vertical"><CartesianGrid stroke="#203248" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" /><Tooltip /><Bar dataKey="value" fill="#45a3ff" radius={5} /></BarChart>
          </ResponsiveContainer>
        </article>
        <article className="panel regional-latest">
          <h2>Últimos alertas LATAM</h2>
          {data.latam.recent.slice(0, 4).map((item) => <a key={item.id} href={item.source_url} target="_blank" rel="noreferrer"><span className={`severity ${item.severity}`}>{item.severity}</span><strong>{item.title}</strong><small>{item.country_code} · {item.source_name}</small></a>)}
          {data.latam.recent.length === 0 && <p className="empty">Sincronize as fontes regionais.</p>}
        </article>
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

function LatamIntel() {
  const { data, error, load } = useData<RegionalIntel[]>("/latam-intel", []);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");
  async function sync() {
    setSyncing(true);
    try {
      const result = await api<{ created: number; updated: number }>("/latam-intel/sync", { method: "POST" });
      setStatus(`${result.created} novos alertas e ${result.updated} atualizados.`);
      load();
    } catch (reason) {
      setStatus((reason as Error).message);
    } finally {
      setSyncing(false);
    }
  }
  return <><Header title="Inteligência LATAM" subtitle="Alertas oficiais de CSIRTs da América Latina" action={<button onClick={sync} disabled={syncing}><RefreshCw size={16} /> {syncing ? "Sincronizando..." : "Sincronizar fontes"}</button>} />
    {(error || status) && <p className={error ? "error" : "notice"}>{error || status}</p>}
    <section className="intel-grid">{data.map((item) => <article className="panel intel-card" key={item.id}>
      <div><span className={`severity ${item.severity}`}>{item.severity}</span><span className="country">{item.country_code} · {item.country_name}</span></div>
      <h2>{item.title}</h2>
      <p>{item.summary || "Sem resumo fornecido pela fonte."}</p>
      <div className="tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}{item.sectors.map((sector) => <span key={sector}>{sector}</span>)}</div>
      <footer><small>{item.source_name} · {new Date(item.published_at).toLocaleDateString("pt-BR")}</small><a href={item.source_url} target="_blank" rel="noreferrer">Fonte oficial <ExternalLink size={14} /></a></footer>
    </article>)}</section>
    {data.length === 0 && <article className="panel empty">Nenhum alerta regional coletado. Clique em “Sincronizar fontes”.</article>}
  </>;
}

function Timeline() {
  const { data } = useData<Array<Record<string, string>>>("/timeline", []);
  return <><Header title="Timeline" subtitle="Histórico cronológico de inteligência" /><article className="panel timeline">{data.map((e) => <div key={e.id}><span className="dot" /><time>{new Date(e.occurred_at).toLocaleString("pt-BR")}</time><strong>{e.title}</strong><small>{e.event_type}</small></div>)}{data.length === 0 && <p className="empty">Nenhum evento registrado.</p>}</article></>;
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">PALMER CTI INVESTIGATE</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>;
}

export default function App() {
  const path = window.location.pathname;
  const kind = path.slice(1);
  let page: ReactNode = <Dashboard />;
  if (entityConfig[kind]) page = <EntityPage kind={kind} />;
  else if (path === "/reports") page = <Reports />;
  else if (path === "/enrichment") page = <Enrichment />;
  else if (path === "/latam") page = <LatamIntel />;
  else if (path === "/timeline") page = <Timeline />;
  return <Layout>{page}</Layout>;
}
