import { useEffect, useState, useRef, ReactNode } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { AccessScreen, usePortalAccess } from "@/components/PortalAccess";
import { api, upload, Auth } from "@/lib/portal-api";
import {
  Client,
  newClient,
  stages,
  totals,
  money,
  downloadFile,
  STORAGE_KEY,
  StudioSettings,
} from "@/lib/studio";
import { buildDocument } from "@/lib/studio-documents";
import {
  AgencyData,
  ClientData,
  Project,
  ProjectDocument,
  TimeEntry,
  Expense,
  PortalUser,
} from "../../../shared/portal";
import "./workspace.css";

const today = () => new Date().toISOString().slice(0, 10);
const date = (v: string) =>
  new Date(v).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const id = () => crypto.randomUUID();
const formValues = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form));
function Empty({ children }: { children: ReactNode }) {
  return <p className="hs-empty">{children}</p>;
}
function ResetClientAccess({
  user,
  onClose,
  onSave,
}: {
  user: PortalUser;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog.Root
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <div className="hs-app hs-modal-root">
          <Dialog.Overlay className="hs-overlay" />
          <Dialog.Content
            className="hs-entry-modal"
            aria-describedby={undefined}
          >
            <div className="hs-section-head">
              <Dialog.Title asChild>
                <h2>Reset client password</h2>
              </Dialog.Title>
              <button className="hs-btn" onClick={onClose}>
                Close
              </button>
            </div>
            <form
              className="hs-form"
              onSubmit={async e => {
                e.preventDefault();
                const password = String(
                  new FormData(e.currentTarget).get("password")
                );
                setBusy(true);
                try {
                  await onSave(password);
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <p>
                {user.name} · {user.email}
              </p>
              <label>
                New temporary password
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={200}
                  autoComplete="new-password"
                  required
                />
              </label>
              {error && (
                <p role="alert" className="hs-error">
                  {error}
                </p>
              )}
              <button className="hs-btn primary" disabled={busy}>
                Reset password
              </button>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function WorkEntryEditor({
  entry,
  kind,
  projects,
  onSave,
  onClose,
}: {
  entry: TimeEntry | Expense;
  kind: "time" | "expenses";
  projects: Project[];
  onSave: (v: TimeEntry | Expense) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(entry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog.Root
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <div className="hs-app hs-modal-root">
          <Dialog.Overlay className="hs-overlay" />
          <Dialog.Content
            className="hs-entry-modal"
            aria-describedby={undefined}
          >
            <div className="hs-section-head">
              <Dialog.Title asChild>
                <h2>Edit {kind === "time" ? "time entry" : "expense"}</h2>
              </Dialog.Title>
              <button className="hs-btn" onClick={onClose}>
                Close
              </button>
            </div>
            <form
              className="hs-form"
              onSubmit={async e => {
                e.preventDefault();
                setBusy(true);
                try {
                  await onSave(value);
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Project
                <select
                  value={value.clientId}
                  onChange={e =>
                    setValue({ ...value, clientId: e.target.value })
                  }
                >
                  {projects.map(p => (
                    <option key={p.client.id} value={p.client.id}>
                      {p.client.brand} · {p.client.project}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Description"
                value={value.description}
                onChange={description => setValue({ ...value, description })}
              />
              <Field
                label="Date"
                type="date"
                value={value.date}
                onChange={date => setValue({ ...value, date })}
              />
              {"minutes" in value ? (
                <>
                  <Field
                    label="Minutes"
                    type="number"
                    value={value.minutes}
                    onChange={v => setValue({ ...value, minutes: Number(v) })}
                  />
                  <Field
                    label="Hourly rate (AED)"
                    type="number"
                    value={value.rate}
                    onChange={v => setValue({ ...value, rate: Number(v) })}
                  />
                  <label className="hs-check">
                    <input
                      type="checkbox"
                      checked={value.billable}
                      onChange={e =>
                        setValue({ ...value, billable: e.target.checked })
                      }
                    />
                    Billable
                  </label>
                </>
              ) : (
                <Field
                  label="Amount (AED)"
                  type="number"
                  value={value.amount}
                  onChange={v => setValue({ ...value, amount: Number(v) })}
                />
              )}{" "}
              {error && (
                <p role="alert" className="hs-error">
                  {error}
                </p>
              )}
              <button disabled={busy} className="hs-btn primary">
                Save changes
              </button>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function Field({
  label,
  value,
  onChange,
  area = false,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  area?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Shell({
  auth,
  nav,
  active,
  setActive,
  logout,
  children,
}: {
  auth: Auth;
  nav: string[];
  active: string;
  setActive: (n: string) => void;
  logout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="hs-app">
      <aside className="hs-sidebar">
        <Link href="/" className="hs-logo">
          <img src="/brand/hyperscale-h.png" alt="" />
          HYPERSCALE
        </Link>
        <span className="hs-label">
          {auth.user.role === "admin" ? "STUDIO" : "CLIENT PORTAL"}
        </span>
        <nav aria-label="Workspace">
          {nav.map(n => (
            <button
              key={n}
              aria-current={n === active ? "page" : undefined}
              onClick={() => setActive(n)}
            >
              {n}
            </button>
          ))}
        </nav>
        <div className="hs-sidebar-foot">
          <strong>{auth.user.name}</strong>
          <small>{auth.user.email}</small>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="hs-main">
        <header className="hs-top">
          <span>{active}</span>
          <span className="hs-status">Private workspace</span>
        </header>
        <main className="hs-content">{children}</main>
      </div>
    </div>
  );
}
function Password({ complete }: { complete: (a: Auth) => void }) {
  return (
    <form
      className="hs-panel hs-form"
      onSubmit={async e => {
        e.preventDefault();
        const f = e.currentTarget;
        try {
          complete(await api<Auth>("/password", "POST", formValues(f)));
          f.reset();
          toast.success("Password changed");
        } catch (err) {
          toast.error((err as Error).message);
        }
      }}
    >
      <h2>Change password</h2>
      <label>
        Current password
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        New password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={200}
          autoComplete="new-password"
          required
        />
      </label>
      <button className="hs-btn primary">Save password</button>
    </form>
  );
}
function SharedItems({
  project,
  client = false,
  refresh,
  run,
  tab,
}: {
  project: Project | ClientData;
  client?: boolean;
  refresh: () => Promise<void>;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  tab: string;
}) {
  const projectId =
    "client" in project ? project.client.id : project.project.id;
  const prefix = `/clients/${projectId}`;
  const [preview, setPreview] = useState<ProjectDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  if (tab === "Files")
    return (
      <section className="hs-panel">
        <div className="hs-section-head">
          <h2>Files</h2>
          <label className="hs-btn primary">
            {uploading ? "Uploading…" : "Upload files"}
            <input
              aria-label="Upload files"
              type="file"
              multiple
              hidden
              disabled={uploading}
              onChange={async e => {
                const files = Array.from(e.target.files || []);
                setUploading(true);
                try {
                  for (const file of files)
                    await upload(projectId, file, client);
                  await refresh();
                  toast.success("Files uploaded");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {!project.files.length ? (
          <Empty>No files yet.</Empty>
        ) : (
          project.files.map(f => (
            <div className="hs-row" key={f.id}>
              <a href={`/api/portal${prefix}/files/${f.id}`}>
                {f.name}
                <small>
                  {(f.size / 1024).toFixed(0)} KB · {f.uploadedBy} ·{" "}
                  {date(f.created)}
                </small>
              </a>
              {!client && (
                <label className="hs-check">
                  <input
                    type="checkbox"
                    checked={f.shared}
                    onChange={e =>
                      void run(() =>
                        api(`${prefix}/files/${f.id}`, "PUT", {
                          shared: e.target.checked,
                        })
                      )
                    }
                  />
                  Shared with client
                </label>
              )}
            </div>
          ))
        )}
      </section>
    );
  if (tab === "Messages")
    return (
      <section className="hs-panel">
        <h2>Messages</h2>
        <div className="hs-messages">
          {!project.messages.length ? (
            <Empty>No messages yet.</Empty>
          ) : (
            project.messages.map(m => (
              <article
                key={m.id}
                className={`hs-message ${m.role === (client ? "client" : "admin") ? "mine" : ""}`}
              >
                <div>
                  <strong>{m.author}</strong>
                  <small>{date(m.created)}</small>
                </div>
                <p>{m.text}</p>
              </article>
            ))
          )}
        </div>
        <form
          className="hs-compose"
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            void run(async () => {
              await api(`${prefix}/messages`, "POST", formValues(f));
              f.reset();
            });
          }}
        >
          <label>
            Message
            <textarea name="text" required maxLength={12000} rows={3} />
          </label>
          <button className="hs-btn primary">Send message</button>
        </form>
      </section>
    );
  if (tab === "Requests")
    return (
      <section className="hs-panel">
        <h2>Requests</h2>
        {project.requests.map(r => (
          <article className="hs-row" key={r.id}>
            <div>
              <strong>{r.title}</strong>
              <p>{r.description}</p>
              <small>
                {r.author} · {date(r.created)}
              </small>
            </div>
            {client ? (
              <span className="hs-tag">{r.status}</span>
            ) : (
              <select
                aria-label={`Status for ${r.title}`}
                value={r.status}
                onChange={e =>
                  void run(() =>
                    api(`${prefix}/requests/${r.id}`, "PUT", {
                      status: e.target.value,
                    })
                  )
                }
              >
                {["New", "In progress", "Done"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </article>
        ))}
        {!project.requests.length && <Empty>No requests yet.</Empty>}
        <form
          className="hs-form"
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            void run(async () => {
              await api(`${prefix}/requests`, "POST", formValues(f));
              f.reset();
            });
          }}
        >
          <h3>Add a request</h3>
          <label>
            Title
            <input name="title" required maxLength={300} />
          </label>
          <label>
            Details
            <textarea name="description" maxLength={12000} rows={3} />
          </label>
          <button className="hs-btn primary">Add request</button>
        </form>
      </section>
    );
  return (
    <section className="hs-panel">
      <h2>Shared documents</h2>
      {!project.documents.length && <Empty>No documents yet.</Empty>}
      {project.documents.map(d => (
        <div className="hs-row" key={d.id}>
          <button className="hs-document-link" onClick={() => setPreview(d)}>
            <strong>{d.title}</strong>
            <small>
              {d.kind} · {date(d.created)}
              {d.approval ? ` · Approved by ${d.approval.name}` : ""}
            </small>
          </button>
          {!client && (
            <label className="hs-check">
              <input
                type="checkbox"
                checked={d.published}
                onChange={e =>
                  void run(() =>
                    api(`${prefix}/documents/${d.id}`, "PUT", {
                      published: e.target.checked,
                    })
                  )
                }
              />
              Published
            </label>
          )}
        </div>
      ))}
      {client && "paymentLink" in project && project.paymentLink && (
        <a
          className="hs-btn primary"
          href={project.paymentLink}
          target="_blank"
          rel="noreferrer"
        >
          Open payment page
        </a>
      )}
      {preview && (
        <Dialog.Root
          open
          onOpenChange={open => {
            if (!open) setPreview(null);
          }}
        >
          <Dialog.Portal>
            <div className="hs-app hs-modal-root">
              <Dialog.Overlay className="hs-overlay" />
              <Dialog.Content
                className="hs-doc-modal"
                aria-describedby={undefined}
              >
                <div className="hs-section-head">
                  <Dialog.Title asChild>
                    <h2>{preview.title}</h2>
                  </Dialog.Title>
                  <button className="hs-btn" onClick={() => setPreview(null)}>
                    Close
                  </button>
                </div>
                <iframe
                  title={preview.title}
                  srcDoc={preview.html.replace(
                    /<header>[\s\S]*?<\/header>/,
                    ""
                  )}
                  sandbox="allow-modals"
                />
                <div className="hs-actions">
                  <button
                    className="hs-btn"
                    onClick={() =>
                      downloadFile(`${preview.title}.html`, preview.html)
                    }
                  >
                    Download document
                  </button>
                  {client &&
                    preview.kind !== "Invoice" &&
                    !preview.approval && (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          const fields = formValues(e.currentTarget);
                          void run(async () => {
                            await api(
                              `${prefix}/documents/${preview.id}/approve`,
                              "POST",
                              { name: fields.name }
                            );
                            setPreview(null);
                          });
                        }}
                      >
                        <label className="hs-check">
                          <input type="checkbox" required />I have reviewed and
                          approve this version.
                        </label>
                        <label>
                          Your name
                          <input name="name" required maxLength={300} />
                        </label>
                        <button className="hs-btn primary">
                          Record approval
                        </button>
                      </form>
                    )}
                  {preview.approval && (
                    <small>
                      Approved {date(preview.approval.at)} by{" "}
                      {preview.approval.name}
                    </small>
                  )}
                </div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </section>
  );
}

export function ClientPortal() {
  const access = usePortalAccess();
  const [data, setData] = useState<ClientData | null>(null);
  const [active, setActive] = useState("Overview");
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setData(await api<ClientData>("/client"));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  useEffect(() => {
    if (access.auth?.user.role !== "client") return;
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [access.auth]);
  async function run(fn: () => Promise<unknown>) {
    try {
      await fn();
      await refresh();
      toast.success("Saved");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }
  if (!access.auth)
    return (
      <AccessScreen state={access.state} complete={access.complete} client />
    );
  if (access.auth.user.role !== "client")
    return (
      <div className="hs-access">
        <h1>Agency account</h1>
        <Link className="hs-btn primary" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    );
  return (
    <Shell
      auth={access.auth}
      nav={[
        "Overview",
        "Files",
        "Messages",
        "Requests",
        "Documents",
        "Account",
      ]}
      active={active}
      setActive={setActive}
      logout={() => void access.logout()}
    >
      {error && (
        <p className="hs-error" role="alert">
          {error}
        </p>
      )}
      {active === "Account" ? (
        <Password complete={access.complete} />
      ) : !data ? (
        <Empty>Loading project…</Empty>
      ) : active === "Overview" ? (
        <>
          <div className="hs-page-head">
            <div>
              <span className="hs-label">{data.project.brand}</span>
              <h1>{data.project.project || "Your project"}</h1>
            </div>
            <button
              className="hs-btn primary"
              onClick={() => setActive("Requests")}
            >
              Add a request
            </button>
          </div>
          <div className="hs-progress">
            <span>{data.project.stage}</span>
            <strong>
              {data.project.tasks.filter(t => t.done).length} /{" "}
              {data.project.tasks.length} milestones complete
            </strong>
            <progress
              max={data.project.tasks.length || 1}
              value={data.project.tasks.filter(t => t.done).length}
            />
          </div>
          {data.project.portalMessage && (
            <p className="hs-update">{data.project.portalMessage}</p>
          )}
          <section className="hs-panel">
            <h2>Milestones</h2>
            {data.project.tasks.map(t => (
              <div className="hs-row" key={t.id}>
                <span className={`hs-task-dot ${t.done ? "done" : ""}`} />
                <strong>{t.title}</strong>
                <span>{t.done ? "Complete" : t.due || "Upcoming"}</span>
              </div>
            ))}
            {!data.project.tasks.length && (
              <Empty>Your milestones will appear here.</Empty>
            )}
          </section>
          <div className="hs-grid two">
            <section className="hs-panel">
              <h2>Scope</h2>
              <p className="hs-text">
                {data.project.scope || "Your project scope will appear here."}
              </p>
            </section>
            <section className="hs-panel">
              <h2>Schedule</h2>
              <p className="hs-text">
                {data.project.timeline || "Your schedule will appear here."}
              </p>
              {data.project.sharedLinks.map(l => (
                <a
                  className="hs-row"
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.title}
                </a>
              ))}
            </section>
          </div>
        </>
      ) : (
        <SharedItems
          project={data}
          client
          refresh={refresh}
          run={run}
          tab={active}
        />
      )}
    </Shell>
  );
}

export default function AgencyDashboard() {
  const access = usePortalAccess();
  const [data, setData] = useState<AgencyData | null>(null);
  const [active, setActive] = useState("Overview");
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<Client | null>(null);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("Details");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [payment, setPayment] = useState("");
  const [docKind, setDocKind] = useState<
    "Proposal" | "Agreement" | "Invoice" | "Welcome"
  >("Proposal");
  const [html, setHtml] = useState("");
  const [resetUser, setResetUser] = useState<PortalUser | null>(null);
  const [entryEdit, setEntryEdit] = useState<{
    kind: "time" | "expenses";
    entry: TimeEntry | Expense;
  } | null>(null);
  const timer = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  async function refresh() {
    const next = await api<AgencyData>("/agency");
    setData(next);
    return next;
  }
  useEffect(() => {
    if (access.auth?.user.role !== "admin") return;
    refresh()
      .then(d => {
        setSettings(d.settings);
        setPayment(d.paymentLink);
      })
      .catch(err => setError((err as Error).message));
    const poll = setInterval(() => void refresh().catch(() => {}), 15000);
    return () => clearInterval(poll);
  }, [access.auth]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (timer.current)
        setElapsed(Math.floor((Date.now() - timer.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  async function run(fn: () => Promise<unknown>, success = "Saved") {
    setBusy(true);
    try {
      await fn();
      await refresh();
      setError("");
      if (success) toast.success(success);
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function choose(p: Project) {
    if (dirty && !window.confirm("Discard unsaved project edits?")) return;
    setSelected(p.client.id);
    setDraft(structuredClone(p.client));
    setRevision(p.revision);
    setDirty(false);
    setHtml("");
  }
  function change<K extends keyof Client>(key: K, value: Client[K]) {
    setDraft(d => (d ? { ...d, [key]: value } : d));
    setDirty(true);
    setHtml("");
  }
  async function save() {
    if (!draft) return;
    await api(`/clients/${draft.id}`, "PUT", { client: draft, revision });
    const next = await refresh();
    const p = next.projects.find(p => p.client.id === draft.id)!;
    setRevision(p.revision);
    setDirty(false);
  }
  async function previewDocument() {
    if (!draft || !data) return;
    if (dirty) await save();
    const logo = await fetch("/brand/hyperscale-logo.png")
      .then(r => r.blob())
      .then(
        b =>
          new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(b);
          })
      );
    setHtml(buildDocument(docKind, draft, data.settings, logo, false));
  }
  if (!access.auth)
    return <AccessScreen state={access.state} complete={access.complete} />;
  if (access.auth.user.role !== "admin")
    return (
      <div className="hs-access">
        <h1>Client account</h1>
        <Link className="hs-btn primary" href="/portal">
          Open your portal
        </Link>
      </div>
    );
  const project = data?.projects.find(p => p.client.id === selected);
  const c = draft;
  const clientOptions = (
    <>
      <option value="">Choose project</option>
      {data?.projects.map(p => (
        <option key={p.client.id} value={p.client.id}>
          {p.client.brand} · {p.client.project}
        </option>
      ))}
    </>
  );
  function editor(keys: (keyof Client)[], area = false) {
    return keys.map(key => (
      <Field
        key={key}
        label={
          (
            {
              brand: "Client business",
              contact: "Contact name",
              project: "Project name",
              portalMessage: "Client update",
              clientTrn: "Client TRN",
              issueDate: "Issue date",
              dueDate: "Due date",
              supplyDate: "Supply date",
              paymentTerms: "Payment terms",
              agreementTerms: "Agreement terms",
              invoiceNumber: "Invoice number",
              notes: "Private notes",
              welcome: "Welcome note",
            } as Record<string, string>
          )[key] || key.charAt(0).toUpperCase() + key.slice(1)
        }
        value={String(c?.[key] ?? "")}
        area={area}
        onChange={v => change(key, v as never)}
      />
    ));
  }
  return (
    <Shell
      auth={access.auth}
      nav={[
        "Overview",
        "Projects",
        "Time",
        "Expenses",
        "Templates",
        "Settings",
      ]}
      active={active}
      setActive={setActive}
      logout={() => void access.logout()}
    >
      {error && (
        <p className="hs-error" role="alert">
          {error}
        </p>
      )}
      {!data ? (
        <Empty>Loading workspace…</Empty>
      ) : (
        <>
          {active === "Overview" && (
            <>
              <div className="hs-page-head">
                <div>
                  <span className="hs-label">YOUR WORKSPACE</span>
                  <h1>Studio overview</h1>
                </div>
                <button
                  className="hs-btn primary"
                  onClick={() => setActive("Projects")}
                >
                  Open projects
                </button>
              </div>
              <div className="hs-stats">
                <article>
                  <small>Active projects</small>
                  <strong>
                    {
                      data.projects.filter(p => p.client.stage !== "Complete")
                        .length
                    }
                  </strong>
                </article>
                <article>
                  <small>New requests</small>
                  <strong>
                    {data.projects.reduce(
                      (n, p) =>
                        n + p.requests.filter(r => r.status === "New").length,
                      0
                    )}
                  </strong>
                </article>
                <article>
                  <small>Invoice balance</small>
                  <strong>
                    {money(
                      data.projects.reduce(
                        (n, p) =>
                          n +
                          Math.max(0, totals(p.client, data.settings).balance),
                        0
                      )
                    )}
                  </strong>
                </article>
                <article>
                  <small>Logged this month</small>
                  <strong>
                    {(
                      data.time
                        .filter(t => t.date.startsWith(today().slice(0, 7)))
                        .reduce((n, t) => n + t.minutes, 0) / 60
                    ).toFixed(1)}{" "}
                    h
                  </strong>
                </article>
              </div>
              <section className="hs-panel">
                <h2>Projects</h2>
                {data.projects.map(p => (
                  <button
                    className="hs-row hs-open-project"
                    key={p.client.id}
                    onClick={() => {
                      choose(p);
                      setActive("Projects");
                    }}
                  >
                    <div>
                      <strong>{p.client.brand}</strong>
                      <small>{p.client.project || "Untitled project"}</small>
                    </div>
                    <span className="hs-tag">{p.client.stage}</span>
                  </button>
                ))}
                {!data.projects.length && (
                  <Empty>Create your first project to get started.</Empty>
                )}
              </section>
              <section className="hs-panel">
                <h2>Coming up</h2>
                {data.projects.flatMap(p =>
                  p.client.tasks
                    .filter(t => !t.done && t.due)
                    .map(t => (
                      <div className="hs-row" key={t.id}>
                        <strong>{t.title}</strong>
                        <span>
                          {p.client.brand} · {t.due}
                        </span>
                      </div>
                    ))
                )}
                {!data.projects.some(p =>
                  p.client.tasks.some(t => !t.done && t.due)
                ) && <Empty>No scheduled tasks.</Empty>}
              </section>
            </>
          )}
          {active === "Projects" && (
            <>
              <div className="hs-page-head">
                <h1>Projects</h1>
                <button
                  className="hs-btn primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      if (dirty && !window.confirm("Discard unsaved edits?"))
                        return;
                      const client = newClient();
                      await api("/clients", "POST", client);
                      const next = await refresh();
                      choose(
                        next.projects.find(p => p.client.id === client.id)!
                      );
                    })
                  }
                >
                  New project
                </button>
              </div>
              <div className="hs-project-layout">
                <section className="hs-project-list">
                  <input
                    aria-label="Search projects"
                    placeholder="Search projects"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {data.projects
                    .filter(p =>
                      `${p.client.brand} ${p.client.project}`
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map(p => (
                      <button
                        className={selected === p.client.id ? "selected" : ""}
                        key={p.client.id}
                        onClick={() => choose(p)}
                      >
                        <strong>{p.client.brand}</strong>
                        <small>{p.client.project || "Untitled project"}</small>
                      </button>
                    ))}
                </section>
                <div className="hs-project-body">
                  {!c || !project ? (
                    <Empty>Select a project.</Empty>
                  ) : (
                    <>
                      <div className="hs-project-heading">
                        <div>
                          <h2>{c.brand}</h2>
                          <span>{c.project || "Untitled project"}</span>
                        </div>
                        <div className="hs-actions">
                          <select
                            aria-label="Project stage"
                            value={c.stage}
                            onChange={e =>
                              change("stage", e.target.value as Client["stage"])
                            }
                          >
                            {stages.map(s => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            className="hs-btn primary"
                            disabled={busy || !dirty}
                            onClick={() => void run(save)}
                          >
                            {dirty ? "Save changes" : "Saved"}
                          </button>
                        </div>
                      </div>
                      <nav className="hs-tabs" aria-label="Project sections">
                        {[
                          "Details",
                          "Tasks",
                          "Files",
                          "Messages",
                          "Requests",
                          "Billing",
                          "Documents",
                        ].map(t => (
                          <button
                            key={t}
                            aria-current={t === tab ? "page" : undefined}
                            onClick={() => setTab(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </nav>
                      {tab === "Details" && (
                        <section className="hs-panel">
                          <div className="hs-grid two">
                            {editor([
                              "brand",
                              "project",
                              "contact",
                              "email",
                              "phone",
                              "website",
                            ])}
                          </div>
                          <div className="hs-form">
                            {editor(
                              ["scope", "timeline", "portalMessage"],
                              true
                            )}
                            <details>
                              <summary>Brief and document details</summary>
                              <div className="hs-form">
                                {editor(
                                  [
                                    "brief",
                                    "goals",
                                    "exclusions",
                                    "revisions",
                                    "agreementTerms",
                                    "welcome",
                                    "notes",
                                  ],
                                  true
                                )}
                              </div>
                            </details>
                            <details>
                              <summary>Contact and billing details</summary>
                              <div className="hs-grid two">
                                {editor([
                                  "address",
                                  "instagram",
                                  "budget",
                                  "clientTrn",
                                ])}
                              </div>
                            </details>
                            <details>
                              <summary>Shared links</summary>
                              {c.sharedLinks.map((l, i) => (
                                <div className="hs-grid two" key={i}>
                                  <Field
                                    label="Title"
                                    value={l.title}
                                    onChange={v =>
                                      change(
                                        "sharedLinks",
                                        c.sharedLinks.map((x, j) =>
                                          j === i ? { ...x, title: v } : x
                                        )
                                      )
                                    }
                                  />
                                  <Field
                                    label="URL"
                                    value={l.url}
                                    onChange={v =>
                                      change(
                                        "sharedLinks",
                                        c.sharedLinks.map((x, j) =>
                                          j === i ? { ...x, url: v } : x
                                        )
                                      )
                                    }
                                  />
                                </div>
                              ))}
                              <button
                                className="hs-btn"
                                onClick={() =>
                                  change("sharedLinks", [
                                    ...c.sharedLinks,
                                    { title: "", url: "" },
                                  ])
                                }
                              >
                                Add link
                              </button>
                            </details>
                          </div>
                        </section>
                      )}
                      {tab === "Tasks" && (
                        <section className="hs-panel">
                          <div className="hs-section-head">
                            <h2>Tasks</h2>
                            <button
                              className="hs-btn"
                              onClick={() =>
                                change("tasks", [
                                  ...c.tasks,
                                  {
                                    id: id(),
                                    title: "",
                                    due: "",
                                    done: false,
                                    shared: true,
                                  },
                                ])
                              }
                            >
                              Add task
                            </button>
                          </div>
                          {c.tasks.map((t, i) => (
                            <div className="hs-task-edit" key={t.id}>
                              <input
                                aria-label="Completed"
                                type="checkbox"
                                checked={t.done}
                                onChange={e =>
                                  change(
                                    "tasks",
                                    c.tasks.map((x, j) =>
                                      j === i
                                        ? { ...x, done: e.target.checked }
                                        : x
                                    )
                                  )
                                }
                              />
                              <input
                                aria-label="Task title"
                                value={t.title}
                                placeholder="Task title"
                                onChange={e =>
                                  change(
                                    "tasks",
                                    c.tasks.map((x, j) =>
                                      j === i
                                        ? { ...x, title: e.target.value }
                                        : x
                                    )
                                  )
                                }
                              />
                              <input
                                aria-label="Due date"
                                type="date"
                                value={t.due}
                                onChange={e =>
                                  change(
                                    "tasks",
                                    c.tasks.map((x, j) =>
                                      j === i
                                        ? { ...x, due: e.target.value }
                                        : x
                                    )
                                  )
                                }
                              />
                              <label className="hs-check">
                                <input
                                  type="checkbox"
                                  checked={t.shared}
                                  onChange={e =>
                                    change(
                                      "tasks",
                                      c.tasks.map((x, j) =>
                                        j === i
                                          ? { ...x, shared: e.target.checked }
                                          : x
                                      )
                                    )
                                  }
                                />
                                Client visible
                              </label>
                              <button
                                aria-label="Remove task"
                                className="hs-btn"
                                onClick={() =>
                                  change(
                                    "tasks",
                                    c.tasks.filter((_, j) => j !== i)
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {!c.tasks.length && <Empty>No tasks yet.</Empty>}
                        </section>
                      )}
                      {["Files", "Messages", "Requests"].includes(tab) && (
                        <SharedItems
                          project={project}
                          refresh={async () => {
                            await refresh();
                          }}
                          run={run}
                          tab={tab}
                        />
                      )}
                      {tab === "Billing" && (
                        <section className="hs-panel">
                          <h2>Invoice</h2>
                          <div className="hs-grid two">
                            {editor([
                              "invoiceNumber",
                              "issueDate",
                              "supplyDate",
                              "dueDate",
                            ])}
                          </div>
                          <div className="hs-invoice-lines">
                            {c.lines.map((l, i) => (
                              <div className="hs-line-edit" key={i}>
                                <Field
                                  label="Item"
                                  value={l.description}
                                  onChange={v =>
                                    change(
                                      "lines",
                                      c.lines.map((x, j) =>
                                        j === i ? { ...x, description: v } : x
                                      )
                                    )
                                  }
                                />
                                <Field
                                  label="Quantity"
                                  type="number"
                                  value={l.quantity}
                                  onChange={v =>
                                    change(
                                      "lines",
                                      c.lines.map((x, j) =>
                                        j === i
                                          ? { ...x, quantity: Number(v) }
                                          : x
                                      )
                                    )
                                  }
                                />
                                <Field
                                  label="Rate (AED)"
                                  type="number"
                                  value={l.rate}
                                  onChange={v =>
                                    change(
                                      "lines",
                                      c.lines.map((x, j) =>
                                        j === i ? { ...x, rate: Number(v) } : x
                                      )
                                    )
                                  }
                                />
                                <button
                                  className="hs-btn"
                                  onClick={() =>
                                    change(
                                      "lines",
                                      c.lines.filter((_, j) => j !== i)
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            className="hs-btn"
                            onClick={() =>
                              change("lines", [
                                ...c.lines,
                                { description: "", quantity: 1, rate: 0 },
                              ])
                            }
                          >
                            Add item
                          </button>
                          <div className="hs-grid three">
                            {(["discount", "paid", "vatRate"] as const).map(
                              k => (
                                <Field
                                  key={k}
                                  label={
                                    k === "vatRate"
                                      ? "VAT (%)"
                                      : k === "paid"
                                        ? "Paid (AED)"
                                        : "Discount (AED)"
                                  }
                                  type="number"
                                  value={c[k]}
                                  onChange={v => change(k, Number(v))}
                                />
                              )
                            )}
                          </div>
                          {editor(["paymentTerms"], true)}
                          <div className="hs-row">
                            <strong>
                              Total {money(totals(c, data.settings).total)}
                            </strong>
                            <strong>
                              Balance {money(totals(c, data.settings).balance)}
                            </strong>
                          </div>
                        </section>
                      )}
                      {tab === "Documents" && (
                        <>
                          <section className="hs-panel">
                            <div className="hs-section-head">
                              <h2>Create document</h2>
                              <select
                                aria-label="Document type"
                                value={docKind}
                                onChange={e => {
                                  setDocKind(e.target.value as typeof docKind);
                                  setHtml("");
                                }}
                              >
                                {[
                                  "Proposal",
                                  "Agreement",
                                  "Invoice",
                                  "Welcome",
                                ].map(k => (
                                  <option key={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                            <div className="hs-actions">
                              <button
                                className="hs-btn"
                                onClick={() => void run(previewDocument, "")}
                              >
                                Preview
                              </button>
                              {html && (
                                <>
                                  <button
                                    className="hs-btn"
                                    onClick={() =>
                                      downloadFile(
                                        `${c.brand}-${docKind}.html`,
                                        html
                                      )
                                    }
                                  >
                                    Download printable copy
                                  </button>
                                  <button
                                    className="hs-btn primary"
                                    onClick={() =>
                                      void run(() =>
                                        api(
                                          `/clients/${c.id}/documents`,
                                          "POST",
                                          {
                                            title: `${c.project || c.brand} — ${docKind}`,
                                            kind: docKind,
                                            html,
                                            published: true,
                                          }
                                        )
                                      )
                                    }
                                  >
                                    Publish to portal
                                  </button>
                                </>
                              )}
                            </div>
                            {html && (
                              <iframe
                                className="hs-preview"
                                title="Document preview"
                                srcDoc={html.replace(
                                  /<header>[\s\S]*?<\/header>/,
                                  ""
                                )}
                                sandbox="allow-modals"
                              />
                            )}
                          </section>
                          <SharedItems
                            project={project}
                            refresh={async () => {
                              await refresh();
                            }}
                            run={run}
                            tab="Documents"
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          {active === "Time" && (
            <>
              <div className="hs-page-head">
                <h1>Time</h1>
                <span>
                  {elapsed
                    ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
                    : ""}
                </span>
              </div>
              <form
                className="hs-panel hs-form"
                onSubmit={e => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const v = formValues(f);
                  void run(async () => {
                    await api("/time", "POST", {
                      id: id(),
                      clientId: v.clientId,
                      description: v.description,
                      date: v.date,
                      minutes: timer.current
                        ? Math.max(
                            1,
                            Math.ceil((Date.now() - timer.current) / 60000)
                          )
                        : Number(v.minutes),
                      rate: Number(v.rate),
                      billable: v.billable === "on",
                    });
                    timer.current = null;
                    setElapsed(0);
                    f.reset();
                  });
                }}
              >
                <div className="hs-grid two">
                  <label>
                    Project
                    <select name="clientId" required>
                      {clientOptions}
                    </select>
                  </label>
                  <label>
                    Work
                    <input name="description" required maxLength={300} />
                  </label>
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      defaultValue={today()}
                      required
                    />
                  </label>
                  <label>
                    Minutes
                    <input
                      name="minutes"
                      type="number"
                      min={1}
                      max={1440}
                      defaultValue={60}
                    />
                  </label>
                  <label>
                    Hourly rate (AED)
                    <input
                      name="rate"
                      type="number"
                      min={0}
                      max={100000}
                      defaultValue={0}
                    />
                  </label>
                  <label className="hs-check">
                    <input name="billable" type="checkbox" defaultChecked />
                    Billable
                  </label>
                </div>
                <div className="hs-actions">
                  <button
                    className="hs-btn"
                    type="button"
                    onClick={() => {
                      if (timer.current) {
                        timer.current = null;
                        setElapsed(0);
                      } else {
                        timer.current = Date.now();
                        setElapsed(1);
                      }
                    }}
                  >
                    {timer.current ? "Cancel timer" : "Start timer"}
                  </button>
                  <button className="hs-btn primary">
                    {timer.current ? "Stop and save" : "Save time"}
                  </button>
                </div>
              </form>
              <section className="hs-panel">
                <h2>Time entries</h2>
                {data.time
                  .slice()
                  .reverse()
                  .map(t => (
                    <div className="hs-row" key={t.id}>
                      <div>
                        <strong>{t.description}</strong>
                        <small>
                          {
                            data.projects.find(p => p.client.id === t.clientId)
                              ?.client.brand
                          }{" "}
                          · {t.date}
                        </small>
                      </div>
                      <span>
                        {t.minutes} min ·{" "}
                        {t.billable
                          ? money((t.minutes / 60) * t.rate * 100)
                          : "Non-billable"}
                      </span>
                      <button
                        className="hs-btn"
                        onClick={() => setEntryEdit({ kind: "time", entry: t })}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                {!data.time.length && <Empty>No time logged yet.</Empty>}
                <button
                  className="hs-btn"
                  onClick={() =>
                    downloadFile(
                      "HyperScale-time.csv",
                      "Date,Project,Work,Minutes,Rate,Billable\n" +
                        data.time
                          .map(t =>
                            [
                              t.date,
                              data.projects.find(
                                p => p.client.id === t.clientId
                              )?.client.brand || "",
                              t.description,
                              t.minutes,
                              t.rate,
                              t.billable,
                            ]
                              .map(
                                v =>
                                  `"${String(v)
                                    .replace(/"/g, '""')
                                    .replace(/^[=+@-]/, "'")}"`
                              )
                              .join(",")
                          )
                          .join("\n"),
                      "text/csv"
                    )
                  }
                >
                  Export CSV
                </button>
              </section>
            </>
          )}
          {active === "Expenses" && (
            <>
              <div className="hs-page-head">
                <h1>Expenses</h1>
                <strong>
                  {money(data.expenses.reduce((n, e) => n + e.amount * 100, 0))}
                </strong>
              </div>
              <form
                className="hs-panel hs-form"
                onSubmit={e => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const v = formValues(f);
                  void run(async () => {
                    await api("/expenses", "POST", {
                      ...v,
                      id: id(),
                      amount: Number(v.amount),
                    });
                    f.reset();
                  });
                }}
              >
                <div className="hs-grid two">
                  <label>
                    Project
                    <select name="clientId" required>
                      {clientOptions}
                    </select>
                  </label>
                  <label>
                    Description
                    <input name="description" required maxLength={300} />
                  </label>
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      defaultValue={today()}
                      required
                    />
                  </label>
                  <label>
                    Amount (AED)
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min={0}
                      required
                    />
                  </label>
                </div>
                <button className="hs-btn primary">Save expense</button>
              </form>
              <section className="hs-panel">
                {data.expenses
                  .slice()
                  .reverse()
                  .map(e => (
                    <div className="hs-row" key={e.id}>
                      <div>
                        <strong>{e.description}</strong>
                        <small>
                          {
                            data.projects.find(p => p.client.id === e.clientId)
                              ?.client.brand
                          }{" "}
                          · {e.date}
                        </small>
                      </div>
                      <span>{money(e.amount * 100)}</span>
                      <button
                        className="hs-btn"
                        onClick={() =>
                          setEntryEdit({ kind: "expenses", entry: e })
                        }
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                {!data.expenses.length && <Empty>No expenses yet.</Empty>}
              </section>
            </>
          )}
          {active === "Templates" && (
            <>
              <div className="hs-page-head">
                <h1>Project templates</h1>
              </div>
              <form
                className="hs-panel hs-form"
                onSubmit={e => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const v = formValues(f);
                  void run(async () => {
                    await api("/templates", "POST", {
                      ...v,
                      id: id(),
                      tasks: String(v.tasks)
                        .split("\n")
                        .map(s => s.trim())
                        .filter(Boolean),
                    });
                    f.reset();
                  });
                }}
              >
                <label>
                  Name
                  <input name="name" required maxLength={300} />
                </label>
                <div className="hs-grid two">
                  <label>
                    Scope
                    <textarea name="scope" rows={4} />
                  </label>
                  <label>
                    Tasks (one per line)
                    <textarea name="tasks" rows={4} />
                  </label>
                  <label>
                    Schedule
                    <textarea name="timeline" />
                  </label>
                  <label>
                    Exclusions
                    <textarea name="exclusions" />
                  </label>
                </div>
                <label>
                  Revisions
                  <input name="revisions" />
                </label>
                <button className="hs-btn primary">Save template</button>
              </form>
              <section className="hs-panel">
                {data.templates.map(t => (
                  <div className="hs-row" key={t.id}>
                    <div>
                      <strong>{t.name}</strong>
                      <small>{t.tasks.length} tasks</small>
                    </div>
                    <button
                      className="hs-btn"
                      onClick={() =>
                        void run(async () => {
                          const client = {
                            ...newClient(),
                            project: t.name,
                            scope: t.scope,
                            exclusions: t.exclusions,
                            timeline: t.timeline,
                            revisions: t.revisions,
                            tasks: t.tasks.map(title => ({
                              id: id(),
                              title,
                              due: "",
                              done: false,
                              shared: true,
                            })),
                          };
                          await api("/clients", "POST", client);
                          const next = await refresh();
                          choose(
                            next.projects.find(p => p.client.id === client.id)!
                          );
                          setActive("Projects");
                        })
                      }
                    >
                      Use template
                    </button>
                  </div>
                ))}
                {!data.templates.length && (
                  <Empty>
                    Save a repeatable workflow for your next project.
                  </Empty>
                )}
              </section>
            </>
          )}
          {active === "Settings" && settings && (
            <>
              <div className="hs-page-head">
                <h1>Settings</h1>
              </div>
              <form
                className="hs-panel hs-form"
                onSubmit={e => {
                  e.preventDefault();
                  void run(() =>
                    api("/settings", "PUT", { settings, paymentLink: payment })
                  );
                }}
              >
                <h2>Business profile</h2>
                <div className="hs-grid two">
                  {(
                    [
                      "legalName",
                      "email",
                      "phone",
                      "website",
                      "address",
                      "trn",
                      "bank",
                    ] as const
                  ).map(k => (
                    <Field
                      key={k}
                      label={
                        {
                          legalName: "Legal business name",
                          email: "Business email",
                          phone: "Phone",
                          website: "Website",
                          address: "Postal address",
                          trn: "TRN",
                          bank: "Bank details",
                        }[k]
                      }
                      value={settings[k]}
                      area={k === "bank" || k === "address"}
                      onChange={v => setSettings({ ...settings, [k]: v })}
                    />
                  ))}
                </div>
                <label className="hs-check">
                  <input
                    type="checkbox"
                    checked={settings.vatRegistered}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        vatRegistered: e.target.checked,
                      })
                    }
                  />
                  VAT registered
                </label>
                <Field
                  label="Payment page URL"
                  type="url"
                  value={payment}
                  onChange={setPayment}
                />
                <button className="hs-btn primary">Save profile</button>
              </form>
              <form
                className="hs-panel hs-form"
                onSubmit={e => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  void run(async () => {
                    await api("/users", "POST", formValues(f));
                    f.reset();
                  });
                }}
              >
                <h2>Client access</h2>
                <div className="hs-grid two">
                  <label>
                    Project
                    <select name="clientId" required>
                      {clientOptions}
                    </select>
                  </label>
                  <label>
                    Client name
                    <input name="name" required maxLength={300} />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Temporary password
                    <input
                      name="password"
                      type="password"
                      minLength={12}
                      maxLength={200}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                </div>
                <button className="hs-btn primary">
                  Create client account
                </button>
              </form>
              <section className="hs-panel">
                {data.users
                  .filter(u => u.role === "client")
                  .map(u => (
                    <div className="hs-row" key={u.id}>
                      <div>
                        <strong>{u.name}</strong>
                        <small>
                          {u.email} · {u.disabled ? "Disabled" : "Active"}
                        </small>
                      </div>
                      <div className="hs-actions">
                        <button
                          className="hs-btn"
                          onClick={() =>
                            void run(() =>
                              api(`/users/${u.id}`, "PUT", {
                                disabled: !u.disabled,
                              })
                            )
                          }
                        >
                          {u.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          className="hs-btn"
                          onClick={() => setResetUser(u)}
                        >
                          Reset password
                        </button>
                      </div>
                    </div>
                  ))}
                <a
                  className="hs-row"
                  href="/portal"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open client sign-in
                </a>
              </section>
              <Password complete={access.complete} />
              <section className="hs-panel">
                <h2>Records</h2>
                <div className="hs-actions">
                  <a className="hs-btn" href="/api/portal/backup">
                    Export records
                  </a>
                  <button
                    className="hs-btn"
                    onClick={() =>
                      void run(async () => {
                        const raw = localStorage.getItem(STORAGE_KEY);
                        if (!raw)
                          throw new Error(
                            "No previous workspace records in this browser."
                          );
                        await api("/import-legacy", "POST", JSON.parse(raw));
                      })
                    }
                  >
                    Import previous browser workspace
                  </button>
                </div>
                <small>
                  Record exports exclude accounts and file contents. Back up the
                  private server data folder and encryption key to recover the
                  complete workspace.
                </small>
              </section>
            </>
          )}
        </>
      )}
      {resetUser && (
        <ResetClientAccess
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSave={async password => {
            await api(`/users/${resetUser.id}`, "PUT", {
              disabled: resetUser.disabled,
              password,
            });
            await refresh();
            toast.success("Password reset");
          }}
        />
      )}
      {data && entryEdit && (
        <WorkEntryEditor
          kind={entryEdit.kind}
          entry={entryEdit.entry}
          projects={data.projects}
          onClose={() => setEntryEdit(null)}
          onSave={async value => {
            await api(`/${entryEdit.kind}/${value.id}`, "PUT", value);
            await refresh();
            toast.success("Saved");
          }}
        />
      )}
    </Shell>
  );
}
