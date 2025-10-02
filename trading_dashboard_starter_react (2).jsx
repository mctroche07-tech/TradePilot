import React, { Fragment, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// -----------------------------------------------------------
// Trading Dashboard — Starter (single-file, previewable)
// - No external UI/chart libs; inline SVG charts (MiniBar, MiniDonut)
// - Dark theme, all-white text, light-grey highlights
// - Tabs: Statistics, News, Journal, Extras
// -----------------------------------------------------------

// ---------- Tiny UI shims (Tailwind classes only) ----------
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...p }) => (
  <div {...p} className={("rounded-2xl border p-0 shadow-sm "+className).trim()} />
);
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div {...p} className={("px-4 py-3 border-b "+className).trim()} />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div {...p} className={("font-semibold tracking-tight "+className).trim()} />
);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div {...p} className={("px-4 py-4 "+className).trim()} />
);
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className="", ...p }) => (
  <button {...p} className={("inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors "+className).trim()} />
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className="", ...p }) => (
  <input {...p} className={("px-3 py-2 rounded-lg border outline-none "+className).trim()} />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className="", ...p }) => (
  <textarea {...p} className={("px-3 py-2 rounded-lg border outline-none "+className).trim()} />
);
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className="", ...p }) => (
  <label {...p} className={("block text-xs uppercase tracking-wide mb-1 "+className).trim()} />
);

// ---------- Lightweight Tabs (context) ----------
const TabsCtx = createContext<{value:string; set:(v:string)=>void} | null>(null);
const Tabs: React.FC<{value:string; onValueChange:(v:string)=>void; className?:string}> = ({ value, onValueChange, className, children }) => (
  <TabsCtx.Provider value={{ value, set: onValueChange }}>
    <div className={className}>{children}</div>
  </TabsCtx.Provider>
);
const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div {...p} className={("inline-flex rounded-lg overflow-hidden "+className).trim()} />
);
const TabsTrigger: React.FC<{value:string} & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ value, className="", children, ...p }) => {
  const ctx = useContext(TabsCtx)!; const active = ctx.value === value;
  return (
    <button {...p} onClick={()=>ctx.set(value)} data-state={active?"active":undefined}
      className={("px-3 py-2 text-sm border " + (active?"bg-gray-300/20 border-gray-300/45":"border-blue-800 bg-transparent") + " "+className).trim()}>
      {children}
    </button>
  );
};
const TabsContent: React.FC<{value:string} & React.HTMLAttributes<HTMLDivElement>> = ({ value, children }) => {
  const ctx = useContext(TabsCtx)!; if (ctx.value !== value) return null; return <div>{children}</div>;
};

// ---------- Inline SVG charts (no external deps) ----------
const MiniBar: React.FC<{ data: number[]; height?: number; className?: string }> = ({ data, height=120, className="" }) => {
  const max = Math.max(1, ...data.map(v => (isFinite(v) ? v : 0)));
  const barW = 6, gap = 2; const w = Math.max(1, data.length*(barW+gap)); const h = height;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={("w-full h-full "+className).trim()}>
      <rect x={0} y={0} width={w} height={h} fill="none" />
      {data.map((v,i)=>{
        const bh = max ? Math.max(0, (v/max)*h) : 0;
        return <rect key={i} x={i*(barW+gap)} y={h-bh} width={barW} height={bh} rx={1.5} fill="#60a5fa" />
      })}
    </svg>
  );
};

const MiniDonut: React.FC<{ series: {name:string; value:number; color:string}[]; size?: number; thickness?: number; center?: { value: number; caption?: string } }> = ({ series, size=160, thickness=24, center }) => {
  const total = Math.max(0, series.reduce((a,b)=>a+Math.max(0,b.value||0),0));
  const r = (size - thickness)/2; const c = Math.PI * 2 * r;
  let acc = 0; // cumulative ratio
  const pctCenter = center?.value ?? (total ? (((series[0]?.value || 0) / total) * 100) : 0);
  const cap = center?.caption ?? (series[0]?.name ? `${series[0].name} %` : undefined);
  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2},${size/2}) rotate(-90)`}>
          {total === 0 ? (
            <circle r={r} cx={0} cy={0} fill="none" stroke="#334155" strokeWidth={thickness} />
          ) : (
            series.map((s, i) => {
              const val = Math.max(0, s.value||0);
              const frac = total ? val/total : 0;
              const len = frac * c;
              const offset = (acc * c);
              acc += frac;
              return (
                <circle key={i} r={r} cx={0} cy={0} fill="none" stroke={s.color} strokeWidth={thickness}
                        strokeDasharray={`${len} ${c-len}`} strokeDashoffset={-offset} />
              );
            })
          )}
        </g>
      </svg>
      {/* Center percentage overlay (used conditionally) */}
      {center && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold">{pctCenter.toFixed(0)}%</div>
            {cap && <div className="text-[11px] opacity-80">{cap}</div>}
          </div>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        {series.map((s,i)=> (
          <div key={i} className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:s.color}}/> {s.name}: {s.value}</div>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------
export default function App() {
  const [active, setActive] = useState<string>("stats");

  return (
    <Fragment>
      <style>{`
        /* Force ALL text to white across the app */
        .force-white, .force-white * { color: #ffffff !important; }
        .force-white ::placeholder { color: rgba(255,255,255,0.72) !important; }
        /* Uniform light-grey highlight */
        [data-state="active"], [data-state="checked"], [data-highlighted] {
          background-color: rgba(229,231,235,0.20) !important; /* gray-200 @ 20% */
          border-color: rgba(229,231,235,0.45) !important;
        }
        .btn-uniform, .btn-uniform:focus, .btn-uniform:active { border-color: rgba(229,231,235,0.45) !important; }
        .btn-uniform:hover { background-color: rgba(229,231,235,0.20) !important; border-color: rgba(229,231,235,0.45) !important; }
        select, option { color: #ffffff !important; background-color: #0b1220; }
      `}</style>

      <div className="min-h-screen force-white bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900 text-white">
        <header className="sticky top-0 z-40 backdrop-blur border-b border-slate-700/60 bg-slate-800/70">
          <div className="mx-auto max-w-6xl px-4">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold tracking-tight">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400 shadow" />
                <span>TradePilot</span>
              </div>
              <Tabs value={active} onValueChange={setActive} className="hidden md:block">
                <TabsList className="bg-blue-950/60 border border-blue-800 text-white">
                  <TabsTrigger value="stats" className="gap-2">📈 Statistics</TabsTrigger>
                  <TabsTrigger value="news" className="gap-2">📰 News</TabsTrigger>
                  <TabsTrigger value="journal" className="gap-2">📓 Journal</TabsTrigger>
                  <TabsTrigger value="extras" className="gap-2">🧩 Extras</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="md:hidden" />
            </div>
          </div>
          {/* Mobile Tabs */}
          <div className="md:hidden border-t border-blue-800/60">
            <Tabs value={active} onValueChange={setActive} className="mx-auto max-w-6xl px-4">
              <TabsList className="w-full grid grid-cols-4 bg-blue-950/60 border border-blue-800 mt-2 text-white">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="journal">Journal</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <Tabs value={active} onValueChange={setActive}>
            <TabsContent value="stats"><Statistics /></TabsContent>
            <TabsContent value="news"><News /></TabsContent>
            <TabsContent value="journal"><Journal /></TabsContent>
            <TabsContent value="extras"><Extras /></TabsContent>
          </Tabs>
        </main>
      </div>
    </Fragment>
  );
}

// ============================ Statistics =============================
function Statistics() {
  type Strategy = { id: string; name: string; params: Record<string, string | number>; };
  const defaultStrategies: Strategy[] = [
    { id: "fvg-retest", name: "FVG + Retest", params: { rr: 2, timeframe: "M15" } },
    { id: "break-retest", name: "Break & Retest", params: { rr: 1.5, timeframe: "H1" } },
    { id: "ny-open", name: "NY Open Range", params: { rr: 1.2, timeframe: "M5" } },
    { id: "ict-silver-bullet", name: "Silver Bullet (ICT)", params: { rr: 2, timeframe: "M5" } },
    { id: "ict-venom", name: "Venom (ICT)", params: { rr: 1.8, timeframe: "M15" } },
  ];

  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [selected, setSelected] = useState<string>(strategies[0].id);
  const [from, setFrom] = useState<string>("2024-01-01");
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0,10));
  const [range, setRange] = useState<string>("3m"); // 1m,3m,6m,1y,all

  const curTf = (strategies.find(s=>s.id===selected)?.params.timeframe as string) || "M15";
  const result = useMemo(() => mockBacktest(selected, curTf, from, to, 200), [selected, from, to, strategies]);

  useEffect(()=>{
    const end = new Date();
    let start = new Date(end);
    if(range === '1m') start.setMonth(start.getMonth()-1);
    else if(range === '3m') start.setMonth(start.getMonth()-3);
    else if(range === '6m') start.setMonth(start.getMonth()-6);
    else if(range === '1y') start.setFullYear(start.getFullYear()-1);
    else if(range === 'all') start = new Date('2015-01-01');
    setFrom(start.toISOString().slice(0,10));
    setTo(end.toISOString().slice(0,10));
  }, [range]);

  const addStrategy = () => {
    const name = prompt("New strategy name?");
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2,6);
    setStrategies(prev => [...prev, { id, name, params: { rr: 2, timeframe: "M15" } }]);
    setSelected(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Strategy</Label>
          <select className="w-56 bg-blue-950 border border-blue-800 rounded-lg px-2 py-2" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={addStrategy} className="gap-2 btn-uniform">＋ Add Strategy</Button>
        
        <div>
          <Label>Data Range</Label>
          <select className="w-40 bg-blue-950 border border-blue-800 rounded-lg px-2 py-2" value={range} onChange={(e)=>setRange(e.target.value)}>
            <option value="1m">1m</option>
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="1y">1y</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="bg-blue-950 border-blue-800" />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="bg-blue-950 border-blue-800" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle>Win Rate</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{result.winRate}%</CardContent>
        </Card>
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle>Expectancy</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{result.expectancy.toFixed(2)} R</CardContent>
        </Card>
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle>Equity Curve (mock)</CardTitle></CardHeader>
          <CardContent className="h-40">
            <MiniBar data={result.equity.map(d=>d.eq)} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>Notes / Scenario Builder</CardTitle></CardHeader>
        <CardContent>
          <p className="text-white text-sm">This is a starter. We’ll plug real backtesting data and your strategy rules here. You’ll be able to define entry, exit, filters (sessions, news, ADR, FVG, etc.), and save presets.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function mockBacktest(strategyId: string, timeframe: string, from: string, to: string, trades: number) {
  const seed = (strategyId + timeframe + from + to + trades).split("").reduce((a,c)=>a + c.charCodeAt(0), 0);
  const rng = mulberry32(seed);
  const winRate = Math.round(45 + rng()*30);
  const expectancy = (rng()*1.4 - 0.2);
  let eq = 0; const equity = Array.from({length: Math.min(trades, 300)}, (_,i)=>{ eq += expectancy + (rng()-0.5); return { n: i, eq: Math.max(0, eq)} });
  return { winRate, expectancy, equity };
}
function mulberry32(a:number){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}

// ============================== News ================================
function News() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [impact, setImpact] = useState<string>("all");
  const [items, setItems] = useState<any[]>(() => mockNews(date));
  const [aiOn, setAiOn] = useState<boolean>(true);
  const [selected, setSelected] = useState<any|null>(null);
  const allCcy = ["USD","EUR","GBP","JPY","CAD","AUD","NZD","CHF"];
  const [ccySel, setCcySel] = useState<string[]>(["USD","EUR","GBP"]);

  useEffect(()=>{ setItems(mockNews(date, impact)); }, [date, impact]);

  const impactBar = (lvl:string)=>{
    if(lvl==='high') return <div className="h-2 rounded bg-red-500"/>;
    if(lvl==='medium') return <div className="h-2 rounded bg-orange-400"/>;
    return <div className="h-2 rounded bg-yellow-300"/>; // low
  };
  const impactDot = (lvl:string)=>{
    const cls = lvl==='high' ? 'bg-red-500' : lvl==='medium' ? 'bg-orange-400' : 'bg-yellow-300';
    return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-2 align-middle`} />
  };

  const toggleCcy = (code:string)=>{ setCcySel(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]); };
  const visible = items.filter(it => ccySel.length===0 || ccySel.includes(it.ccy));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" className="bg-blue-950 border-blue-800 text-white placeholder-white/70" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <Label>Impact</Label>
          <select className="w-40 bg-blue-950 border border-blue-800 rounded-lg px-2 py-2" value={impact} onChange={(e)=>setImpact(e.target.value)}>
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="min-w-[280px]">
          <Label>Currencies</Label>
          <div className="flex flex-wrap gap-2">
            {allCcy.map(ccy => {
              const on = ccySel.includes(ccy);
              return (
                <button key={ccy} onClick={()=>toggleCcy(ccy)}
                        className={`px-2 py-1 rounded border ${on? 'bg-gray-300/20 border-gray-300/45' : 'bg-slate-900/40 border-blue-800'} btn-uniform text-xs`}>{ccy}</button>
              );
            })}
          </div>
        </div>
        <Button className="btn-uniform" onClick={()=>setItems(mockNews(date, impact))}>Refresh (mock)</Button>
      </div>

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>Economic Calendar (sample data)</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-white">
              <tr className="border-b border-blue-800">
                <th className="text-left py-2">Time</th>
                <th className="text-left">Currency</th>
                <th className="text-left">Event</th>
                <th className="text-left">Impact</th>
                <th className="text-right">Forecast</th>
                <th className="text-right">Previous</th>
                <th className="text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it, i)=> (
                <tr key={i} onClick={()=>setSelected(it)} className="cursor-pointer border-b border-slate-900/60 hover:bg-gray-300/20">
                  <td className="py-2">{it.time}</td>
                  <td>{it.ccy}</td>
                  <td>{impactDot(it.impact)}{it.title}</td>
                  <td className="capitalize">{it.impact}</td>
                  <td className="text-right">{it.forecast ?? "—"}</td>
                  <td className="text-right">{it.previous ?? "—"}</td>
                  <td className="text-right">{it.actual ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-blue-800 bg-blue-950 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-blue-800 flex items-center justify-between">
              <div className="font-semibold">{selected.title}</div>
              <button className="px-2 py-1 rounded border border-blue-800 hover:bg-gray-300/20" onClick={()=>setSelected(null)}>Close</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm">Time: {selected.time} • Currency: {selected.ccy}</div>
              <div className="text-sm capitalize">Impact: {selected.impact}</div>
              <div>{impactBar(selected.impact)}</div>
              <div className="text-sm opacity-90">
                Quick rundown: This is sample copy explaining what the event measures and typical market reactions. In production, fetch description & prior surprises to drive AI commentary.
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="opacity-70">Forecast</div><div>{selected.forecast ?? '—'}</div></div>
                <div><div className="opacity-70">Previous</div><div>{selected.previous ?? '—'}</div></div>
                <div><div className="opacity-70">Actual</div><div>{selected.actual ?? '—'}</div></div>
              </div>
              <div className="text-xs opacity-70">Legend: <span className="align-middle inline-flex items-center gap-1"><span className="w-3 h-3 inline-block bg-yellow-300 rounded"/>Minor</span> • <span className="align-middle inline-flex items-center gap-1"><span className="w-3 h-3 inline-block bg-orange-400 rounded"/>Medium</span> • <span className="align-middle inline-flex items-center gap-1"><span className="w-3 h-3 inline-block bg-red-500 rounded"/>Major</span></div>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>AI Insight (prototype)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={aiOn} onChange={(e)=>setAiOn(e.target.checked)} />
            <span className="text-sm text-white">Enable AI commentary</span>
          </div>
          <p className="text-white text-sm">{aiOn ? aiInsight(visible) : "(AI off)"}</p>
          <p className="text-white text-xs mt-2">TODO: wire to a news API + AI endpoint to analyze event surprises by currency & session.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function mockNews(date: string, impact: string = "all") {
  const base = [
    { time: "08:30", ccy: "USD", title: "Non-Farm Payrolls", impact: "high", forecast: "+170k", previous: "+187k", actual: "—" },
    { time: "07:00", ccy: "GBP", title: "BoE Gov Speech", impact: "medium", forecast: null, previous: null, actual: null },
    { time: "10:00", ccy: "EUR", title: "CPI (YoY)", impact: "high", forecast: "2.8%", previous: "3.1%", actual: "—" },
    { time: "13:30", ccy: "CAD", title: "Unemployment Rate", impact: "medium", forecast: "5.7%", previous: "5.6%", actual: "—" },
    { time: "23:50", ccy: "JPY", title: "GDP (QoQ)", impact: "low", forecast: "0.2%", previous: "0.1%", actual: "—" },
  ];
  const f = impact === "all" ? base : base.filter(b => b.impact === impact);
  return f;
}
function aiInsight(items: any[]) {
  const high = items.filter(i=>i.impact === "high");
  if (high.length) {
    const ccySet = Array.from(new Set(high.map(h=>h.ccy))).join(", ");
    return `High-impact (${ccySet}) today. Expect wider ranges around release times; consider smaller size pre-event and fade/continuation setups on the first pullback after actuals.`;
  }
  return "Calendar is light-to-medium impact. Mean-reversion setups in Asia/London, watch overlap for liquidity spikes.";
}

// ============================== Journal =============================
function Journal() {
  type Entry = { id: string; date: string; pnl: number; trades: number; direction: 'long'|'short'; bias: 'bullish'|'bearish'; reason: string; image?: string; longCount?: number; shortCount?: number };
  const [entries, setEntries] = useState<Entry[]>(()=>{
    const raw = localStorage.getItem("journal.entries");
    return raw ? JSON.parse(raw) as Entry[] : [];
  });
  useEffect(()=>{ localStorage.setItem("journal.entries", JSON.stringify(entries)); }, [entries]);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [pnlStr, setPnlStr] = useState<string>("0"); // allow '-' and '$'
  const [tradesStr, setTradesStr] = useState<string>("1");
  const [longStr, setLongStr] = useState<string>("1");
  const [shortStr, setShortStr] = useState<string>("0");
  const [direction, setDirection] = useState<'long'|'short'>('long');
  const [bias, setBias] = useState<'bullish'|'bearish'>('bullish');
  const [reason, setReason] = useState<string>("");
  const [image, setImage] = useState<string|undefined>(undefined);

  const [pcMonth, setPcMonth] = useState<string>(()=> new Date().toISOString().slice(0,7));
  const [filterDate, setFilterDate] = useState<string|undefined>(undefined);

  const fileRef = useRef<HTMLInputElement>(null);
  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImage(url);
  };

  const parseMoney = (s:string): number => {
    const cleaned = s.replace(/[^0-9+\-\.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };
  const parseTrades = (s:string): number => {
    const n = parseInt((s||"0").replace(/[^0-9]/g,''),10);
    return Number.isFinite(n) && n>0 ? n : 1;
  };
  const parseNonNegInt = (s:string): number => {
    const n = parseInt((s||"0").replace(/[^0-9]/g,''),10);
    return Number.isFinite(n) && n>=0 ? n : 0;
  };

  // --- Handlers to keep JSX clean and avoid inline parsing errors ---
  const handleTradesChange = (v: string) => {
    setTradesStr(v);
    const t = parseTrades(v);
    if (t > 1) {
      const l = Math.min(t, parseNonNegInt(longStr));
      setLongStr(String(l));
      setShortStr(String(Math.max(0, t - l)));
    } else {
      setLongStr(direction==='long' ? '1' : '0');
      setShortStr(direction==='short' ? '1' : '0');
    }
  };
  const handleLongChange = (v: string) => {
    const t = parseTrades(tradesStr);
    const l = Math.min(t, parseNonNegInt(v));
    setLongStr(String(l));
    setShortStr(String(Math.max(0, t - l)));
  };
  const handleShortChange = (v: string) => {
    const t = parseTrades(tradesStr);
    const s = Math.min(t, parseNonNegInt(v));
    setShortStr(String(s));
    setLongStr(String(Math.max(0, t - s)));
  };

  const addEntry = () => {
    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const tradesNum = parseTrades(tradesStr);
    let l = parseNonNegInt(longStr);
    let s = parseNonNegInt(shortStr);
    if (tradesNum > 1) {
      const sum = l + s;
      if (sum !== tradesNum) {
        l = Math.min(tradesNum, l);
        s = Math.max(0, tradesNum - l);
      }
    } else {
      l = direction==='long' ? 1 : 0;
      s = direction==='short' ? 1 : 0;
    }
    const entry: Entry = { id, date, pnl: parseMoney(pnlStr), trades: tradesNum, direction, bias, reason, image, longCount: l, shortCount: s };
    setEntries([entry, ...entries]);
    setReason("");
    setPnlStr("0");
    setTradesStr("1");
    setLongStr("1");
    setShortStr("0");
    setDirection('long');
    setBias('bullish');
    setImage(undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const stats = useMemo(()=> summarize(entries.map(e=>({date:e.date, pnl:e.pnl}))), [entries]);
  const jAgg = useMemo(()=> summarizeJournal(entries), [entries]);

  // Profit Calendar helpers (aggregate by day)
  const monthAgg = useMemo(()=>{
    const map = new Map<string,{count:number,pnl:number,trades:number}>();
    entries.forEach(e=>{
      if(!e.date) return; const ymd=e.date; if(ymd.slice(0,7)!==pcMonth) return;
      const cur = map.get(ymd) || {count:0,pnl:0,trades:0};
      map.set(ymd,{count:cur.count+1,pnl:cur.pnl + Number(e.pnl||0), trades: cur.trades + Number(e.trades||0)});
    });
    return map;
  }, [entries, pcMonth]);

  const calendar = useMemo(()=>{
    const [yy,mm] = pcMonth.split('-').map(Number);
    const start = new Date(yy, mm-1, 1);
    const firstDow = (start.getDay()+6)%7; // Mon=0
    const days = new Date(yy, mm, 0).getDate();
    return { yy, mm, firstDow, days };
  }, [pcMonth]);

  return (
    <div className="space-y-4">
      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>New Journal Entry</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-blue-950 border-blue-800" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>P/L</Label>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-2 rounded-lg border border-blue-800 bg-blue-950 select-none">$</span>
                  <Input type="text" value={pnlStr} onChange={e=>setPnlStr(e.target.value)} className="bg-blue-950 border-blue-800 flex-1" placeholder="e.g., -150" />
                </div>
              </div>
              <div>
                <Label># of Trades</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" value={tradesStr} onChange={e=>handleTradesChange(e.target.value)} className="bg-blue-950 border-blue-800" placeholder="e.g., 3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Trade Direction</Label>
                <div className="inline-flex rounded-lg overflow-hidden border border-blue-800">
                  <button type="button" onClick={()=>{setDirection('long'); if(parseTrades(tradesStr)<=1){setLongStr('1'); setShortStr('0');}}} className={`px-3 py-2 text-sm ${direction==='long' ? 'bg-gray-300/20 border-r border-gray-300/45' : 'bg-slate-900/40 border-r border-blue-800'}`}>Long</button>
                  <button type="button" onClick={()=>{setDirection('short'); if(parseTrades(tradesStr)<=1){setLongStr('0'); setShortStr('1');}}} className={`px-3 py-2 text-sm ${direction==='short' ? 'bg-gray-300/20' : 'bg-slate-900/40'}`}>Short</button>
                </div>
              </div>
              <div>
                <Label>Bias</Label>
                <select className="w-full bg-blue-950 border border-blue-800 rounded-lg px-2 py-2" value={bias} onChange={(e)=>setBias(e.target.value as 'bullish'|'bearish')}>
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                </select>
              </div>
            </div>
            {parseTrades(tradesStr) > 1 && (
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label># Long</Label>
                  <Input type="text" inputMode="numeric" pattern="[0-9]*" value={longStr} onChange={e=>handleLongChange(e.target.value)} className="bg-blue-950 border-blue-800" />
                </div>
                <div>
                  <Label># Short</Label>
                  <Input type="text" inputMode="numeric" pattern="[0-9]*" value={shortStr} onChange={e=>handleShortChange(e.target.value)} className="bg-blue-950 border-blue-800" />
                </div>
              </div>
            )}
            <div>
              <Label>Reason / Notes</Label>
              <Textarea value={reason} onChange={e=>setReason(e.target.value)} className="bg-blue-950 border-blue-800" rows={5} />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Screenshot</Label>
            <Input type="file" accept="image/*" onChange={onImage} ref={fileRef} className="bg-blue-950 border-blue-800 text-white placeholder-white/70" />
            {image && <img src={image} alt="Trade screenshot" className="rounded-lg border border-blue-800" />}
            <Button onClick={addEntry} className="mt-2 btn-uniform">Save Entry</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>Profit Calendar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div>
              <Label>Month</Label>
              <Input type="month" value={pcMonth} onChange={e=>setPcMonth(e.target.value)} className="bg-blue-950 border-blue-800" />
            </div>
            <div className="flex gap-2">
              <Button className="btn-uniform" onClick={()=>{ const [y,m]=pcMonth.split('-').map(Number); const d=new Date(y, m-2, 1); setPcMonth(d.toISOString().slice(0,7)); }}>◀ Prev</Button>
              <Button className="btn-uniform" onClick={()=>{ const [y,m]=pcMonth.split('-').map(Number); const d=new Date(y, m, 1); setPcMonth(d.toISOString().slice(0,7)); }}>Next ▶</Button>
            </div>
            <div className="text-sm text-white">
              {(()=>{ const vals=Array.from(monthAgg.values()); const trades=vals.reduce((a,b)=>a+b.trades,0); const pnl=vals.reduce((a,b)=>a+b.pnl,0); return `Trades: ${trades} • Net P/L: ${pnl.toFixed(2)}`; })()}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs text-white">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <div key={d} className="px-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 mt-1">
            {Array.from({length: calendar.firstDow}).map((_,i)=>(<div key={'e'+i} className="h-20"/>))}
            {Array.from({length: calendar.days}).map((_,i)=>{
              const day=i+1; const ymd=`${calendar.yy}-${String(calendar.mm).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const agg = monthAgg.get(ymd) || {count:0,pnl:0,trades:0};
              const win = agg.trades>0 && agg.pnl>=0; const loss = agg.trades>0 && agg.pnl<0;
              return (
                <button key={ymd} onClick={()=>setFilterDate(ymd)} className={`h-20 rounded-lg border px-2 py-1 ${win?'border-emerald-300/80 bg-emerald-300/20': loss?'border-rose-400/60 bg-rose-400/15':'border-blue-800 bg-slate-900/40'} ${filterDate===ymd ? 'border-gray-300/60 bg-gray-300/20' : ''} flex flex-col items-center justify-center`}>
                  <div className="text-[10px] opacity-80">{day}</div>
                  <div className={`text-lg font-semibold ${win?'text-emerald-200': loss?'text-rose-400':'text-white/70'}`}>{agg.trades? `$${agg.pnl.toFixed(2)}`:'—'}</div>
                  <div className="text-[10px] opacity-80">{agg.trades? `${agg.trades} trade${agg.trades>1?'s':''}`:''}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries */}
      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>Journal Entries</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filterDate && (
            <div className="text-sm text-white">Showing entries for <b>{filterDate}</b>. <button className="underline" onClick={()=>setFilterDate(undefined)}>Clear</button></div>
          )}
          {(filterDate? entries.filter(e=>e.date===filterDate) : entries).length === 0 && <p className="text-white text-sm">No entries yet.</p>}
          {(filterDate? entries.filter(e=>e.date===filterDate) : entries).map(e => (
            <div key={e.id} className="border border-blue-800 rounded-xl p-3 grid md:grid-cols-6 gap-3 bg-blue-950/60">
              <div className="md:col-span-2">
                {e.image ? <img src={e.image} className="rounded-lg border border-blue-800" /> : <div className="h-24 rounded-lg bg-slate-800/40 flex items-center justify-center text-white">No image</div>}
              </div>
              <div className="md:col-span-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white">Date</div>
                  <div>{e.date}</div>
                </div>
                <div>
                  <div className="text-xs text-white">P/L</div>
                  <div className={e.pnl>=0 ? 'text-emerald-300' : 'text-rose-400'}>{`$${e.pnl.toFixed(2)}`}</div>
                </div>
                <div>
                  <div className="text-xs text-white">Trades</div>
                  <div>{e.trades}</div>
                </div>
                <div>
                  <div className="text-xs text-white">Direction</div>
                  <div className="capitalize">{e.direction}{(e.longCount??0)+(e.shortCount??0)>1 ? ` (L:${e.longCount||0}/S:${e.shortCount||0})` : ''}</div>
                </div>
                <div>
                  <div className="text-xs text-white">Bias</div>
                  <div className="capitalize">{e.bias}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-white">Reason</div>
                  <div className="line-clamp-3">{e.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Overview with side percentages */}
      <Card className="bg-blue-950 border-blue-800">
        <CardHeader><CardTitle>Performance Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {(() => { const t=jAgg.winLoss.reduce((a,b)=>a+b.value,0)||0; const a1=jAgg.winLoss[0]?.value||0; const lp=Math.round(t? a1/t*100:0); const rp=100-lp; return (
              <div className="relative h-64 flex items-center justify-center">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${lp}% Win`}</div>
                <MiniDonut series={jAgg.winLoss.map((x,i)=> ({...x, color: i===0? '#34d399' : '#f43f5e'}))} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${rp}% Loss`}</div>
              </div>
            ); })()}
            {(() => { const t=jAgg.byDirection.reduce((a,b)=>a+b.value,0)||0; const a1=jAgg.byDirection[0]?.value||0; const lp=Math.round(t? a1/t*100:0); const rp=100-lp; return (
              <div className="relative h-64 flex items-center justify-center">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${lp}% Long`}</div>
                <MiniDonut series={jAgg.byDirection.map((x,i)=> ({...x, color: i===0? '#22d3ee' : '#a855f7'}))} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${rp}% Short`}</div>
              </div>
            ); })()}
            {(() => { const t=jAgg.byBias.reduce((a,b)=>a+b.value,0)||0; const a1=jAgg.byBias[0]?.value||0; const lp=Math.round(t? a1/t*100:0); const rp=100-lp; return (
              <div className="relative h-64 flex items-center justify-center">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${lp}% Bullish`}</div>
                <MiniDonut series={jAgg.byBias.map((x,i)=> ({...x, color: i===0? '#eab308' : '#60a5fa'}))} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-90">{`${rp}% Bearish`}</div>
              </div>
            ); })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function summarize(entries: {date:string,pnl:number}[]) {
  const count = entries.length;
  const wins = entries.filter(e=>e.pnl>0).length;
  const winRate = count ? Math.round(100*wins/count) : 0;
  const avgPnl = count ? entries.reduce((a,b)=>a+b.pnl,0)/count : 0;
  const map = new Map<string, number>();
  entries.forEach(e=>{ map.set(e.date, (map.get(e.date)||0)+e.pnl); });
  const byDay = Array.from(map.entries()).map(([date,pnl])=>({ date, pnl }));
  const bestDay = byDay.sort((a,b)=>b.pnl-a.pnl)[0];
  return { count, winRate, avgPnl, byDay, bestDay };
}

function summarizeJournal(entries: {pnl:number; direction:'long'|'short'; bias:'bullish'|'bearish'; longCount?:number; shortCount?:number; trades?:number}[]) {
  const wins = entries.filter(e=>e.pnl>0).length;
  const losses = entries.filter(e=>e.pnl<=0).length; // ties count as loss/flat
  let long = 0, short = 0, bull = 0, bear = 0;
  for (const e of entries) {
    const l = typeof e.longCount === 'number' ? Math.max(0, e.longCount) : (e.direction==='long' ? 1 : 0);
    const s = typeof e.shortCount === 'number' ? Math.max(0, e.shortCount) : (e.direction==='short' ? 1 : 0);
    long += l; short += s;
    bull += (e.bias==='bullish') ? 1 : 0;
    bear += (e.bias==='bearish') ? 1 : 0;
  }
  return {
    winLoss: [{name:'Win', value:wins}, {name:'Loss', value:losses}],
    byDirection: [{name:'Long', value:long}, {name:'Short', value:short}],
    byBias: [{name:'Bullish', value:bull}, {name:'Bearish', value:bear}],
  };
}

// ============================== Extras ===============================
function Extras() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle className="flex items-center gap-2">🧩 Indicators</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white">List your TradingView indicators here. Paste links or IDs.</p>
            <Input type="text" className="bg-blue-950 border-blue-800 text-white placeholder-white/70" />
            <Button className="btn-uniform">Add</Button>
            <div className="text-xs text-white">TODO: embed previews or screenshots.</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle className="flex items-center gap-2">⚙️ Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label>Default Timezone</Label>
            <Input type="text" className="bg-blue-950 border-blue-800 text-white placeholder-white/70" />
            <Label>Theme</Label>
            <select defaultValue="system" className="w-40 bg-blue-950 border border-blue-800 rounded-lg px-2 py-2">
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </CardContent>
        </Card>
        <Card className="bg-blue-950 border-blue-800">
          <CardHeader><CardTitle className="flex items-center gap-2">💳 Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white">Manage your billing plan.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button className="btn-uniform">Change Plan</Button>
              <Button className="btn-uniform">Manage Billing</Button>
            </div>
            <p className="text-xs text-white">TODO: connect to Stripe customer portal.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================== Dev Tests ===========================
(function runDevTests(){
  try {
    const s1 = summarize([]); console.assert(s1.count === 0 && s1.winRate === 0, "summarize([]) base case failed");
    const s2 = summarize([
      { date: "2025-01-01", pnl: 10 },
      { date: "2025-01-01", pnl: -5 },
      { date: "2025-01-02", pnl: 0 },
    ]);
    console.assert(s2.count === 3, "summarize count");
    console.assert(s2.byDay.find(d=>d.date==="2025-01-01")?.pnl === 5, "byDay aggregation");

    const mb = mockBacktest("fvg-retest", "M15", "2024-01-01", "2024-02-01", 123);
    console.assert(mb.winRate >= 0 && mb.winRate <= 100, "winRate bounds");
    console.assert(Array.isArray(mb.equity) && mb.equity.length <= 300, "equity length");
    console.assert(mb.equity.every(p=>typeof p.eq === 'number' && p.eq >= 0), "equity non-negative numbers");

    const all = mockNews("2025-01-01", "all");
    const hi = mockNews("2025-01-01", "high");
    const med = mockNews("2025-01-01", "medium");
    console.assert(all.length >= hi.length && all.length >= med.length, "news filter reduces items");

    const j = summarizeJournal([
      { pnl: 10, direction: 'long', bias: 'bullish', longCount: 2, shortCount: 1 },
      { pnl: -5, direction: 'short', bias: 'bearish', longCount: 0, shortCount: 1 },
    ]);
    console.assert(j.byDirection.find(x=>x.name==='Long')?.value === 2, "direction long count");
    console.assert(j.byDirection.find(x=>x.name==='Short')?.value === 2, "direction short count");
    console.assert(j.winLoss.find(x=>x.name==='Win')?.value === 1, "win count");

    console.info("[DevTests] All checks passed.");
  } catch (err) {
    console.warn("[DevTests] A check failed:", err);
  }
})();