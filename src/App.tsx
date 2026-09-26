import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Hexagon,
  LoaderCircle,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { accounts, statusOf } from "./services/draw";
import type { Account, Action, Status } from "./services/draw";
import { eventGateway } from "./services/events";
import type { EventRecord } from "./services/events";
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;
const statusLabel = (s: Status) => (s === "NotOpen" ? "Awaiting funding" : s);
function timing(e: EventRecord, now: number) {
  const s = statusOf(e.state, now);
  if (s === "Closed") return "awaiting selection";
  if (s === "Drawn") return "winner selected";
  if (s === "Settled") return "prize claimed";
  if (s === "Cancelled") return "no participants";
  if (s === "NotOpen") return "awaiting funding";
  const m = Math.max(0, Math.ceil((e.state.closeAt - now) / 60000));
  return `closes in ${m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h` : `${Math.floor(m / 60)}h ${m % 60}m`}`;
}
function Badge({ status }: { status: Status }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      {statusLabel(status)}
    </span>
  );
}
function Logo() {
  return (
    <>
      <span className="logo-icon">
        <Hexagon size={27} />
        <i />
      </span>
      <span>MonadDraw</span>
    </>
  );
}
function Link({to,children,className}:{to:string;children:ReactNode;className?:string}) {
 function follow(e:MouseEvent<HTMLAnchorElement>) {
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
  e.preventDefault();window.history.pushState({},'',to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({top:0,behavior:'instant'});
 }
 return <a className={className} href={to} onClick={follow}>{children}</a>
}
export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [filter, setFilter] = useState("All");
  const [now, setNow] = useState(Date.now());
  const [walletOpen, setWalletOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("Log in");
  const [signedIn, setSignedIn] = useState(false);
  const [amount, setAmount] = useState("100");
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const back = () => {
      setPath(window.location.pathname);
      setError("");
    };
    window.addEventListener("popstate", back);
    let active = true;
    const refresh = () =>
      eventGateway
        .list()
        .then((e) => {
          if (active) setEvents(e);
        })
        .catch(() => {
          if (active)
            setError("Unable to load draws. Please reload to try again.");
        });
    void refresh();
    const id = setInterval(() => {
      setNow(Date.now());
      void refresh();
    }, 4000);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("popstate", back);
    };
  }, []);
  useEffect(() => {
    walletOpen ? dialog.current?.showModal() : dialog.current?.close();
  }, [walletOpen]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const selected = events.find((e) => path === `/events/${e.id}`);
  const home = path === "/";
  const auth = path === "/login";
  const listing = path === "/events";
  const currentStatus = selected ? statusOf(selected.state, now) : "NotOpen";
  const sponsor = account?.address === accounts[0].address;
  async function act(action: Action) {
    if (!account) {
      setWalletOpen(true);
      return;
    }
    if (!selected || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const list = await eventGateway.execute(
        selected.id,
        action,
        account.address,
        Number(amount),
      );
      setEvents(list);
      setToast(list.find((e) => e.id === selected.id)!.state.activity[0].title);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The operation failed. Please try again.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Address copied");
    } catch {
      setError("Unable to copy. Please select the address manually.");
    }
  }
  async function submitAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const form = e.currentTarget;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      // INTEGRATION: replace with authGateway.login/register. Do not store credentials
      // in browser storage. Production needs server validation and secure sessions.
      // This frontend fixture discards all inputs and changes only in-memory UI state.
      await new Promise((r) => setTimeout(r, 600));
      form.reset();
      setSignedIn(true);
      navigate("/events");
      setToast(
        authMode === "Log in" ? "Welcome back" : "Your account is ready",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const walletButton = (
    <button
      className="button wallet"
      disabled={busy}
      onClick={() => setWalletOpen(true)}
    >
      <Wallet size={16} />
      {account ? short(account.address) : "Connect Wallet"}
    </button>
  );
  const actionButton = (action: Action, label: string, disabled = false) => (
    <button
      className="button primary"
      disabled={disabled || busy}
      onClick={() => void act(action)}
    >
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {label}
    </button>
  );
  const card = (e: EventRecord) => (
    <Link to={`/events/${e.id}`} className="draw-card panel" key={e.id}>
      <div className="card-head">
        <span className="initial">{e.name[0]}</span>
        <Badge status={statusOf(e.state, now)} />
      </div>
      <h2>{e.name}</h2>
      <p>{e.state.prize} DPRZ prize pool</p>
      <div className="card-meta">
        <span>
          {e.state.participants.length} / {e.state.cap} tickets
        </span>
        <span>{timing(e, now)}</span>
      </div>
    </Link>
  );
  return (
    <>
      {!auth && (
        <header className="header">
          <div className="header-inner">
            {home ? (
              <Link to="/" className="brand">
                <Logo />
              </Link>
            ) : (
              <div className="page-title">
                <Link className="back" to={listing ? "/" : "/events"}>
                  <ArrowLeft size={20} />
                  <span className="sr-only">
                    {listing ? "Home" : "All draws"}
                  </span>
                </Link>
                <h1>
                  {listing ? "All draws" : selected?.name || "Page not found"}
                </h1>
                {selected && <Badge status={currentStatus} />}
              </div>
            )}
            <div className="header-actions">
              {home && (
                <Link
                  to={signedIn ? "/events" : "/login"}
                  className="text-link"
                >
                  {signedIn ? "My draws" : "Log in"}
                </Link>
              )}
              {walletButton}
            </div>
          </div>
        </header>
      )}
      {home && (
        <main className="container home">
          <section className="hero">
            <p className="eyebrow">TESTNET · TRANSPARENT PRIZE DRAWS</p>
            <h1>Prize draws you can verify, not just trust.</h1>
            <p className="hero-copy">
              Sponsors fund a prize, participants mint a free ticket, and one
              entrant is chosen by a selection anyone can verify on-chain. The
              whole process is open to inspection.
            </p>
          </section>
          {events.length > 0 ? (
            <>
              <div className="featured-grid">
                <Link to={`/events/${events[0].id}`} className="panel featured">
                  <div className="featured-head">
                    <span className="badge open">
                      {statusLabel(statusOf(events[0].state, now))} ·{" "}
                      {timing(events[0], now)}
                    </span>
                    <span>Builder Grant Draw</span>
                  </div>
                  <h2>500 DPRZ prize pool</h2>
                  <p>Sponsor-funded · fully escrowed on-chain</p>
                  <div className="featured-bottom">
                    <span>
                      {events[0].state.participants.length} / 500 tickets minted
                    </span>
                    <span>
                      View draw <ArrowRight size={15} />
                    </span>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${events[0].state.participants.length / 5}%`,
                      }}
                    />
                  </div>
                </Link>
                <div className="featured-side">
                  <Link
                    to="/events/community-playtest"
                    className="panel compact"
                  >
                    <div>
                      <Badge status={statusOf(events[1].state, now)} />
                      <strong>120 DPRZ</strong>
                    </div>
                    <h2>Community Playtest Draw</h2>
                    <p>64 / 64 tickets · {timing(events[1], now)}</p>
                  </Link>
                  <div className="panel stats">
                    <div>
                      <strong>
                        {events
                          .reduce((n, e) => n + e.state.participants.length, 0)
                          .toLocaleString()}
                      </strong>
                      <span>tickets minted overall</span>
                    </div>
                    <div>
                      <strong>
                        {events.filter((e) => e.state.settled).length}
                      </strong>
                      <span>draws settled to date</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="home-bottom">
                <section className="panel how">
                  <h2>How it works</h2>
                  <ol>
                    {[
                      "A sponsor funds the prize and opens the window",
                      "Participants mint one free ticket each",
                      "A verifiable selection picks one entrant",
                      "The winner claims the prize directly",
                    ].map((v, i) => (
                      <li key={v}>
                        <span>{i + 1}</span>
                        {v}
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="panel why">
                  <h2>Why verify, not trust</h2>
                  <p>
                    Every selection seed and index is written on-chain. Anyone
                    can check which ticket was chosen and confirm the recorded
                    winner matches it.
                  </p>
                </section>
                <section className="panel browse">
                  <p>Testnet · no real funds change hands</p>
                  <Link to="/events">
                    Browse all draws <ArrowRight size={16} />
                  </Link>
                </section>
              </div>
            </>
          ) : (
            <p className="loading">Loading draws…</p>
          )}
        </main>
      )}
      {listing && (
        <main className="container listing">
          <div className="filters" aria-label="Filter draws by status">
            {["All", "Open", "Closed", "Drawn", "Settled", "Cancelled"].map(
              (f) => (
                <button
                  aria-pressed={filter === f}
                  className={filter === f ? "filter active" : "filter"}
                  onClick={() => setFilter(f)}
                  key={f}
                >
                  {f}
                </button>
              ),
            )}
          </div>
          <div className="draw-grid">
            {events
              .filter(
                (e) => filter === "All" || statusOf(e.state, now) === filter,
              )
              .map(card)}
          </div>
          {!events.length ? (
            <p className="loading">Loading draws…</p>
          ) : (
            !events.some(
              (e) => filter === "All" || statusOf(e.state, now) === filter,
            ) && (
              <div className="panel empty">
                <h2>No {filter.toLowerCase()} draws</h2>
                <p>Choose another status to explore events.</p>
                <button className="button" onClick={() => setFilter("All")}>
                  View all draws
                </button>
              </div>
            )
          )}
        </main>
      )}
      {selected && (
        <main className="container detail">
          <div className="detail-main">
            <section className="panel event-detail">
              <div className="event-heading">
                <span className="initial large">{selected.name[0]}</span>
                <div>
                  <h2>{selected.name}</h2>
                  <p>Sponsor-funded prize event on the MonadDraw testnet</p>
                </div>
              </div>
              <p className="description">
                A sponsor has escrowed the prize on-chain. Mint a free
                participation ticket before the window closes — one ticket per
                wallet, no entry payment required. When the window ends, anyone
                can trigger the selection, and the result is recorded where it
                can be checked against the participant list.
              </p>
              <div className="prize-line">
                <h3>{selected.state.prize} DPRZ</h3>
                <span>
                  funded {selected.state.funded} / {selected.state.prize}
                </span>
              </div>
              <div className="progress funding">
                <span
                  style={{
                    width: `${(selected.state.funded / selected.state.prize) * 100}%`,
                  }}
                />
              </div>
              <div className="tickets-line">
                <strong>
                  {selected.state.participants.length} / {selected.state.cap}{" "}
                  tickets minted
                </strong>
                <span>{timing(selected, now)}</span>
              </div>
              <div className="progress">
                <span
                  style={{
                    width: `${(selected.state.participants.length / selected.state.cap) * 100}%`,
                  }}
                />
              </div>
              <div className="event-action">
                {currentStatus === "Open" ? (
                  actionButton(
                    "mint",
                    account &&
                      selected.state.participants.includes(account.address)
                      ? "Participation confirmed"
                      : "Mint participation ticket",
                    (!!account &&
                      selected.state.participants.includes(account.address)) ||
                      selected.state.participants.length >= selected.state.cap,
                  )
                ) : currentStatus === "Closed" &&
                  selected.state.participants.length ? (
                  actionButton("draw", "Execute selection")
                ) : currentStatus === "Drawn" ? (
                  selected.state.winner === account?.address ? (
                    actionButton("claim", `Claim ${selected.state.prize} DPRZ`)
                  ) : (
                    <button
                      className="button primary"
                      onClick={() => setWalletOpen(true)}
                    >
                      Connect selected wallet to claim
                    </button>
                  )
                ) : (
                  <div className="result">
                    <ShieldCheck size={19} />
                    {currentStatus === "Settled"
                      ? "Prize successfully claimed"
                      : currentStatus === "Cancelled"
                        ? "Event cancelled"
                        : currentStatus === "Closed"
                          ? "Closed without participants"
                          : "Awaiting sponsor funding"}
                  </div>
                )}
              </div>
              {account &&
                selected.state.participants.includes(account.address) && (
                  <p className="ticket-confirmation">
                    <CheckCircle2 size={16} />
                    Your ticket: #
                    {String(
                      selected.state.participants.indexOf(account.address),
                    ).padStart(3, "0")}
                  </p>
                )}
              {currentStatus === "Drawn" && (
                <p className="ticket-confirmation">
                  Selected participant: {short(selected.state.winner!)}
                </p>
              )}
            </section>
            {sponsor &&
              (currentStatus === "NotOpen" ||
                (!selected.state.participants.length &&
                  !["Cancelled", "Settled", "Drawn"].includes(
                    currentStatus,
                  ))) && (
                <section className="panel sponsor-panel">
                  <h2>Sponsor controls</h2>
                  {currentStatus === "NotOpen" && (
                    <>
                      <label>
                        Amount (DPRZ)
                        <input
                          type="number"
                          min="1"
                          max={selected.state.prize - selected.state.funded}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </label>
                      {actionButton(
                        selected.state.approved ? "fund" : "approve",
                        selected.state.approved ? "Fund prize" : "Approve DPRZ",
                      )}
                    </>
                  )}
                  {!selected.state.participants.length &&
                    actionButton(
                      currentStatus === "Closed" ? "refund" : "cancel",
                      currentStatus === "Closed"
                        ? "Recover prize"
                        : "Cancel event",
                    )}
                </section>
              )}
            {!!selected.state.activity.length && (
              <section className="panel activity">
                <h2>Event activity</h2>
                {selected.state.activity.map((a) => (
                  <div key={a.id}>
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>{a.title}</strong>
                      <small>{a.detail}</small>
                    </span>
                    <time>
                      {new Date(a.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
              </section>
            )}
          </div>
          <aside className="detail-side">
            <section className="panel transparency">
              <h2>Transparency data</h2>
              <dl>
                {[
                  ["Event address", selected.address],
                  ["Prize token", "DPRZ"],
                  ["Participants", String(selected.state.participants.length)],
                  [
                    "Selection seed",
                    selected.state.seed || "— pending selection",
                  ],
                  [
                    "Selected index",
                    selected.state.selectedIndex === null
                      ? "—"
                      : String(selected.state.selectedIndex),
                  ],
                  ["Winner", selected.state.winner || "— pending selection"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {value.startsWith("0x") ? (
                        <button
                          className="copy-value"
                          title={value}
                          onClick={() => void copy(value)}
                          aria-label={`Copy ${label}: ${value}`}
                        >
                          <code>{short(value)}</code>
                          <Copy size={12} />
                        </button>
                      ) : (
                        <code>{value}</code>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p>
                Once drawn, the selected index maps directly to the participant
                list. Anyone can check it and confirm the recorded winner
                matches.
              </p>
            </section>
            <section className="panel recent">
              <h2>Recent participants</h2>
              {selected.state.participants.length ? (
                selected.state.participants
                  .slice(-5)
                  .reverse()
                  .map((address, i) => (
                    <div key={address}>
                      <code>{short(address)}</code>
                      <span>
                        Ticket #{selected.state.participants.length - 1 - i}
                      </span>
                    </div>
                  ))
              ) : (
                <p>No participants yet.</p>
              )}
              <details>
                <summary>
                  View participant list <ChevronRight size={14} />
                </summary>
                <div className="all-participants">
                  {selected.state.participants.map((address, i) => (
                    <div
                      className={
                        address === selected.state.winner ? "chosen" : ""
                      }
                      key={address}
                    >
                      <code>
                        {i}: {short(address)}
                      </code>
                      <span>
                        {address === selected.state.winner
                          ? "Selected"
                          : account?.address === address
                            ? "You"
                            : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          </aside>
        </main>
      )}
      {auth && (
        <main className="auth-page">
          <section className="auth-story">
            <Link to="/" className="brand">
              <Logo />
            </Link>
            <div>
              <h1>
                One account. One wallet.
                <br />
                Full transparency.
              </h1>
              <ul>
                {[
                  "Your account keeps track of every draw you've joined",
                  "Linking a wallet lets you mint tickets and claim prizes",
                  "Every selection stays verifiable on-chain, independent of your account",
                ].map((t) => (
                  <li key={t}>
                    <Check size={18} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <p>Testnet · no real funds involved</p>
          </section>
          <section className="auth-form-side">
            <form onSubmit={submitAuth}>
              <div className="auth-tabs">
                {["Log in", "Create account"].map((t) => (
                  <button
                    type="button"
                    aria-pressed={authMode === t}
                    className={authMode === t ? "selected" : ""}
                    key={t}
                    onClick={() => {
                      setAuthMode(t);
                      setError("");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <h2>
                {authMode === "Log in" ? "Welcome back" : "Create your account"}
              </h2>
              <p>
                {authMode === "Log in"
                  ? "Log in to track your draws and tickets."
                  : "Keep your draws and participation in one place."}
              </p>
              <label>
                Email
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete={
                    authMode === "Log in" ? "current-password" : "new-password"
                  }
                />
              </label>
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? <LoaderCircle size={16} className="spin" /> : null}
                {authMode}
              </button>
              <div className="divider">
                <span>or</span>
              </div>
              <button
                type="button"
                className="button"
                onClick={() => setWalletOpen(true)}
              >
                <Wallet size={17} />
                {account ? short(account.address) : "Connect Wallet"}
              </button>
              {account && (
                <Link to="/events" className="continue-link">
                  Continue to all draws <ArrowRight size={15} />
                </Link>
              )}
              <p className="auth-note">
                Connecting a wallet lets you mint tickets and claim prizes
                directly from this account.
              </p>
            </form>
          </section>
        </main>
      )}
      {!home && !auth && !listing && !selected && events.length > 0 && (
        <main className="container empty">
          <h1>Draw not found</h1>
          <p>This event could not be found.</p>
          <Link to="/events" className="button primary">
            Browse all draws
          </Link>
        </main>
      )}
      {error && (
        <div className="notification error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {toast && (
        <div className="notification" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="wallet-title"
        onCancel={() => setWalletOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setWalletOpen(false);
        }}
      >
        <div className="dialog-heading">
          <h2 id="wallet-title">Connect Wallet</h2>
          <button
            className="icon-button"
            aria-label="Close wallet dialog"
            onClick={() => setWalletOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p>Choose your account to participate.</p>
        <div className="accounts">
          {accounts.map((a) => (
            <button
              key={a.address}
              disabled={busy}
              onClick={() => {
                setAccount(a);
                setWalletOpen(false);
                setToast("Wallet connected");
              }}
            >
              <span className="initial">{a.name[0]}</span>
              <span>
                <strong>{a.name}</strong>
                <small>
                  {a.role} · {short(a.address)}
                </small>
              </span>
              {account?.address === a.address ? (
                <Check size={17} />
              ) : (
                <ArrowRight size={17} />
              )}
            </button>
          ))}
        </div>
        {account && (
          <button
            className="button disconnect"
            disabled={busy}
            onClick={() => {
              setAccount(null);
              setWalletOpen(false);
            }}
          >
            Disconnect wallet
          </button>
        )}
      </dialog>
    </>
  );
}
