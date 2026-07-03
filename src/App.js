import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CircleCheck,
  CircleX,
  ClipboardList,
  Info,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Palette,
  ScanSearch,
  Settings,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  Wallet,
} from "lucide-react";

const OLD_SK = { S:'gm_s_v1', T:'gm_t_v1', A:'gm_a_v1', W:'gm_w_v1', SS:'gm_ss_v1' };
const GAP = 6 * 3600 * 1000;
const PAYOUT = 0.92;
const MAX_DL = 4;
const ACCOUNT_MODES = ['DEMO','REAL'];

// Theme swatches — each id maps to a [data-theme] block in index.css ('dark' = :root defaults)
const THEMES = [
  {id:'dark',label:'Indigo dark',bg:'#0f1218',accent:'#6270f3'},
  {id:'ocean',label:'Ocean',bg:'#0c1f2b',accent:'#38d4f0'},
  {id:'graphite',label:'Graphite',bg:'#141416',accent:'#b8becd'},
  {id:'light',label:'Light',bg:'#ffffff',accent:'#4f5ae8'},
];

const PAIRS = [
  'EUR/TRY OTC','AED/CNY OTC','USD/THB OTC','USD/IDR OTC','USD/JPY OTC',
  'USD/BRL OTC','AUD/CHF OTC','SAR/CNY OTC','GBP/USD OTC','USD/BDT OTC',
  'GBP/JPY OTC','CAD/JPY OTC','MAD/USD OTC','CHF/JPY OTC','USD/CNH OTC',
  'EUR/USD OTC','EUR/GBP OTC','EUR/JPY OTC','AUD/USD OTC','USD/CAD OTC',
  'GBP/CHF OTC','AUD/JPY OTC','NZD/USD OTC','USD/SGD OTC',
];

const DEF_MS = [
  {mul:2,pct:20},{mul:3,pct:25},{mul:5,pct:30},
  {mul:10,pct:35},{mul:20,pct:40},{mul:50,pct:50},
];

const PROMPT = `You are an expert supply and demand zone validator for binary options trading (TheGiftedMan S&D Precision Entry System). Analyze the chart image and evaluate the zone drawn or the most prominent zone visible.

ZONE TYPES:
- Supply (RBD): Rally-Base-Drop → SELL
- Supply (DBD): Drop-Base-Drop → SELL
- Demand (DBR): Drop-Base-Rally → BUY
- Demand (RBR): Rally-Base-Rally → BUY

THE 7 GATES — binary pass/fail, evaluated independently from this 1-minute chart image only. This is a strict filter, not a grader on a curve. When in doubt on any gate, FAIL it. Each justification must cite what you actually observe in the image. You are NOT evaluating live 10-second confirmation — that candle resolution is not visible in this image and is judged separately by the trader in real time.

When uncertain whether a candle count, departure strength, or trend alignment meets the strict threshold, default to FAIL, not PASS. These gates exist specifically to reject borderline setups — err on the side of rejection.

GATE 1 — Base structure: PASS only if the base is exactly 1-2 candles. 3 or more candles = FAIL. Count every candle between the clear trend move and the departure candle. If you count 3 or more consolidation candles, this gate FAILS regardless of how tight they visually appear.
GATE 2 — Departure candle: PASS only if the departure candle's body is >=70% of its total range AND its total range is >=1.5x the average range of the 5 candles preceding the base.
GATE 3 — Freshness: PASS only if price is returning to the zone for the FIRST time since formation — zero prior retests. Any prior touch of the proximal line = FAIL.
GATE 4 — Trend alignment: PASS only if the zone's direction matches the visible higher-timeframe trend. Counter-trend zones or a ranging market = FAIL. If the visible price history shows multiple swings up and down without a clear directional bias — price making both higher highs/higher lows AND lower highs/lower lows within the visible window — classify this as ranging market and FAIL this gate, even if the immediate few candles before the zone suggest a local trend.
GATE 5 — Distance ratio: PASS only if the distance price traveled away from the zone before returning is >=3x the zone's width.
GATE 6 — Zone width: PASS only if the zone is 2-3 pips wide. Wider or narrower = FAIL.
GATE 7 — No conflicting structure: PASS only if no opposing zone is visible within the likely 2-minute price path to target.

GRADING — computed strictly from the pass count. This is a PRE-VALIDATION grade only; it is upgraded or flagged unconfirmed by the trader after watching the live 10-second reaction, not a final trade signal:
7/7 passed  → grade "A+", verdict "VALID",   recommendation "PENDING LIVE CONFIRMATION"
5-6/7 passed → grade "B",  verdict "VALID",   recommendation "PENDING LIVE CONFIRMATION"
3-4/7 passed → grade "C",  verdict "VALID",   recommendation "PENDING LIVE CONFIRMATION"
0-2/7 passed → grade "INVALID", verdict "INVALID", recommendation "DO NOT TRADE"

SELF-CHECK — before returning your final grade, review your own gate results. If you marked 6 or more gates as PASS, re-examine Gates 1, 2, and 4 specifically, as these are the most commonly over-graded criteria. Confirm your reasoning for each PASS is based on clear visual evidence, not assumption.

Also read the trading pair from the chart header if visible.

Respond ONLY with JSON (no markdown, no backticks). gateResults must contain exactly 7 entries in gate order, and passCount and grade must match the gate results:
{"detectedPair":"USD/JPY OTC","zoneType":"Supply (RBD)","direction":"SELL","gateResults":[{"gate":1,"label":"Base structure","pass":true,"justification":"Tight 2-candle base at the origin"},{"gate":2,"label":"Departure candle","pass":true,"justification":"Body ~85% of range, roughly 2x the preceding 5-candle average"},{"gate":3,"label":"Freshness","pass":true,"justification":"No retest of the proximal line since formation"},{"gate":4,"label":"Trend alignment","pass":true,"justification":"Sell zone within a visible downtrend"},{"gate":5,"label":"Distance ratio","pass":true,"justification":"Travel is ~4x the zone width"},{"gate":6,"label":"Zone width","pass":true,"justification":"Zone is ~2.5 pips wide"},{"gate":7,"label":"No conflicting structure","pass":true,"justification":"No opposing zone in the likely price path"}],"passCount":6,"grade":"B","verdict":"VALID","recommendation":"PENDING LIVE CONFIRMATION","confidence":78,"keyStrengths":["Fresh zone","Explosive departure"],"keyWeaknesses":["Distance ratio only slightly above minimum"],"executionAdvice":"Watch the live 10-second chart at the proximal line for a Tier 1 confirmation before entering SELL.","summary":"6 of 7 gates passed — pre-validated, awaiting live confirmation."}`;

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

// ── Supabase row mappers (camelCase app shape <-> snake_case db rows) ──────────
function toSettingsRow(userId,s){
  return{user_id:userId,risk_percent:s.riskPercent,trade_style:s.tradeStyle,
    sessions_per_day:s.sessionsPerDay,broker_min:s.brokerMin,milestones:s.milestones,
    api_keys:{apiKey:s.apiKey,groqApiKey:s.groqApiKey},setup_complete:s.setupComplete,
    created_at:new Date(s.createdAt||Date.now()).toISOString(),
    extra:{startingBalanceDemo:s.startingBalanceDemo,startingBalanceReal:s.startingBalanceReal,tradeStyleDemo:s.tradeStyleDemo,tradeStyleReal:s.tradeStyleReal,aiProvider:s.aiProvider}};
}
function fromSettingsRow(r){
  return{riskPercent:r.risk_percent,tradeStyle:r.trade_style,
    sessionsPerDay:r.sessions_per_day,brokerMin:r.broker_min,milestones:r.milestones,
    apiKey:r.api_keys?.apiKey||'',groqApiKey:r.api_keys?.groqApiKey||'',setupComplete:r.setup_complete,
    createdAt:new Date(r.created_at).getTime(),...(r.extra||{})};
}
function toTradeRow(userId,t){
  return{id:t.id,user_id:userId,timestamp:new Date(t.timestamp).toISOString(),pair:t.pair,direction:t.direction,
    zone_type:t.zoneType,zone_grade:t.zoneGrade,stake:t.stake,outcome:t.outcome,pnl:t.pnl,source:t.source,
    screenshots:(t.screenshots||[]).map(shotPath),notes:t.notes,session_num:t.sessionNum,is_analyzed:t.isAnalyzed,
    extra:{date:t.date,analysisId:t.analysisId,criteria:t.criteria,gateResults:t.gateResults,passCount:t.passCount,liveConfirmed:t.liveConfirmed,failedCriteria:t.failedCriteria,keyStrengths:t.keyStrengths,keyWeaknesses:t.keyWeaknesses,executionAdvice:t.executionAdvice,summary:t.summary,confidence:t.confidence,verdict:t.verdict,recommendation:t.recommendation,accountMode:t.accountMode}};
}
function fromTradeRow(r){
  return{id:r.id,timestamp:new Date(r.timestamp).getTime(),pair:r.pair,direction:r.direction,zoneType:r.zone_type,
    zoneGrade:r.zone_grade,stake:r.stake,outcome:r.outcome,pnl:r.pnl,source:r.source,screenshots:r.screenshots||[],
    notes:r.notes,sessionNum:r.session_num,isAnalyzed:r.is_analyzed,...(r.extra||{})};
}
function toSessionRow(userId,date,s){
  return{id:s.id,user_id:userId,date,num:s.num,account_mode:s.accountMode,start_time:new Date(s.startTime).toISOString(),
    end_time:s.endTime?new Date(s.endTime).toISOString():null,trades:s.trades,wins:s.wins,losses:s.losses,
    con_loss:s.conLoss,con_win:s.conWin,net_loss:s.netLoss,session_pnl:s.sPnl,is_active:s.isActive,
    is_locked:s.isLocked,lock_reason:s.lockReason};
}
function fromSessionRow(r){
  return{id:r.id,num:r.num,accountMode:r.account_mode,startTime:new Date(r.start_time).getTime(),
    endTime:r.end_time?new Date(r.end_time).getTime():null,trades:r.trades,wins:r.wins,losses:r.losses,
    conLoss:r.con_loss,conWin:r.con_win,netLoss:r.net_loss,sPnl:r.session_pnl,isActive:r.is_active,
    isLocked:r.is_locked,lockReason:r.lock_reason};
}
function toWdRow(userId,w){
  return{id:w.id,user_id:userId,timestamp:new Date(w.timestamp).toISOString(),date:w.date,amount:w.amount,
    balance_before:w.balanceBefore,balance_after:w.balanceAfter,notes:w.notes};
}
function fromWdRow(r){
  return{id:r.id,timestamp:new Date(r.timestamp).getTime(),date:r.date,amount:r.amount,
    balanceBefore:r.balance_before,balanceAfter:r.balance_after,notes:r.notes};
}
function toAnalysisRow(userId,a){
  return{id:a.id,user_id:userId,timestamp:new Date(a.timestamp).toISOString(),screenshot:shotPath(a.screenshot),
    detected_pair:a.detectedPair,zone_type:a.zoneType,grade:a.grade,verdict:a.verdict,criteria:a.criteria||{},
    linked_trade_id:a.linkedTradeId,
    extra:{date:a.date,screenshotMime:a.screenshotMime,direction:a.direction,recommendation:a.recommendation,confidence:a.confidence,gateResults:a.gateResults,passCount:a.passCount,failedCriteria:a.failedCriteria,keyStrengths:a.keyStrengths,keyWeaknesses:a.keyWeaknesses,executionAdvice:a.executionAdvice,summary:a.summary}};
}
function fromAnalysisRow(r){
  return{id:r.id,timestamp:new Date(r.timestamp).getTime(),screenshot:r.screenshot,detectedPair:r.detected_pair,
    zoneType:r.zone_type,grade:r.grade,verdict:r.verdict,criteria:r.criteria,linkedTradeId:r.linked_trade_id,
    ...(r.extra||{})};
}
// Demo and Real lock state is derived independently — a Real lockout (loss
// breaker, session gap) never touches Demo's counters, and vice versa.
function perModeFromSessions(sessions){
  const perMode={};
  for(const mode of ACCOUNT_MODES){
    const modeSessions=sessions.filter(s=>s.accountMode===mode);
    const dailyLosses=modeSessions.reduce((s,x)=>s+x.losses,0);
    const lastEnd=modeSessions.reduce((m,x)=>x.endTime&&x.endTime>m?x.endTime:m,0)||null;
    perMode[mode]={dailyLosses,isDailyLocked:dailyLosses>=MAX_DL,lastEnd};
  }
  return perMode;
}

function dayFromSessionRows(rows){
  const date=tod();
  const sessions=rows.map(fromSessionRow).sort((a,b)=>a.startTime-b.startTime);
  return{date,sessions,perMode:perModeFromSessions(sessions)};
}

// The screenshots bucket is private; only a signed URL (short-lived) is ever
// shown in the UI. `shotPath` recovers the durable storage path from a signed
// URL so we always persist the path, never an expiring token, to the DB.
const SHOT_URL_RE=/\/screenshots\/([^?]+)/;
function shotPath(src){
  if(!src||typeof src!=='string')return src;
  const m=src.match(SHOT_URL_RE);
  return m?m[1]:src;
}
async function signShot(path){
  if(!path||typeof path!=='string'||path.startsWith('data:'))return path;
  const{data,error}=await supabase.storage.from('screenshots').createSignedUrl(shotPath(path),3600);
  if(error){console.error('screenshot sign failed',error);return path;}
  return data.signedUrl;
}
async function uploadShot(userId,b64,mime='image/png'){
  if(!b64||typeof b64!=='string'||b64.startsWith('http'))return b64;
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const ext=(mime.split('/')[1]||'png').replace('+xml','');
  const path=`${userId}/${uid()}.${ext}`;
  const{error}=await supabase.storage.from('screenshots').upload(path,bytes,{contentType:mime});
  if(error){console.error('screenshot upload failed',error);return b64;}
  return signShot(path);
}

async function maybeMigrateLocal(userId){
  const raw=localStorage.getItem(OLD_SK.S);
  if(!raw)return;
  if(!window.confirm('Local trading data was found on this device. Import it into your account now?'))return;
  try{
    const s=JSON.parse(raw);
    const t=JSON.parse(localStorage.getItem(OLD_SK.T)||'[]');
    const a=JSON.parse(localStorage.getItem(OLD_SK.A)||'[]');
    const w=JSON.parse(localStorage.getItem(OLD_SK.W)||'[]');
    const ssDay=JSON.parse(localStorage.getItem(OLD_SK.SS)||'null');
    if(s)await supabase.from('settings').upsert(toSettingsRow(userId,s));
    if(t.length)await supabase.from('trades').upsert(t.map(x=>toTradeRow(userId,x)));
    if(a.length)await supabase.from('zone_analyses').upsert(a.map(x=>toAnalysisRow(userId,x)));
    if(w.length)await supabase.from('withdrawals').upsert(w.map(x=>toWdRow(userId,x)));
    if(ssDay?.sessions?.length)await supabase.from('sessions').upsert(ssDay.sessions.map(x=>toSessionRow(userId,ssDay.date,x)));
    Object.values(OLD_SK).forEach(k=>localStorage.removeItem(k));
    alert('Import complete — your local data is now saved to your account.');
  }catch(e){console.error(e);alert('Import failed: '+e.message+'. Your local data was left untouched.');}
}
const tod=()=>new Date().toLocaleDateString('en-CA');
const f$=(n)=>`$${Math.abs(+n).toFixed(2)}`;
const fp=(n)=>`${(+n).toFixed(1)}%`;

function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});}

function toDataUrl(src,mime='image/png'){if(!src)return null;if(src.startsWith('data:')||src.startsWith('http'))return src;return `data:${mime};base64,${src}`;}

function calcBal(start,trades,wds){
  const pnl=trades.filter(t=>t.outcome!=='PENDING').reduce((s,t)=>s+t.pnl,0);
  const wd=wds.reduce((s,w)=>s+w.amount,0);
  return start+pnl-wd;
}

function calcStake(bal,rPct){
  const c=bal*(rPct/100);
  const a=Math.max(1,Math.round(c*100)/100);
  return{calc:c,actual:a,eff:(a/bal)*100};
}

function calcPnl(stake,outcome){
  if(outcome==='WIN')return+(stake*PAYOUT).toFixed(2);
  if(outcome==='LOSS')return -stake;
  return 0;
}

function emptyModeState(){return{dailyLosses:0,isDailyLocked:false,lastEnd:null};}

function getToday(ss){
  const t=tod();
  if(!ss||ss.date!==t)return{date:t,sessions:[],perMode:{DEMO:emptyModeState(),REAL:emptyModeState()}};
  return ss;
}

function getTradeMode(trade){return trade?.accountMode==='REAL'?'REAL':'DEMO';}

function getTradeStyleForMode(settings,mode){
  if(mode==='REAL')return settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1;
  return settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1;
}

function getStartingBalanceForMode(settings,mode){
  const value=parseFloat(mode==='REAL'?settings?.startingBalanceReal:settings?.startingBalanceDemo);
  return Number.isFinite(value)?value:0;
}

// Demo and Real are fully independent trading tracks — a bal computed for one
// mode never mixes the other mode's trades, starting balance, or withdrawals
// (withdrawals only ever apply to Real; Demo has no concept of a withdrawal).
function balForMode(settings,trades,wds,mode){
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const start=getStartingBalanceForMode(settings,mode);
  return calcBal(start,modeTrades,mode==='REAL'?wds:[]);
}

function getActive(ss,mode){return ss?.sessions?.find(s=>s.isActive && s.accountMode===mode)||null;}

function canStart(ss,max,mode){
  const m=ss.perMode?.[mode]||emptyModeState();
  if(m.isDailyLocked)return{ok:false,msg:`Daily ${MAX_DL}-loss limit reached for ${mode==='REAL'?'Real':'Demo'}. Resume tomorrow.`};
  const sessionsForMode=(ss.sessions||[]).filter(s=>s.accountMode===mode);
  if(sessionsForMode.length>=max)return{ok:false,msg:`Max ${max} sessions reached today.`};
  if(m.lastEnd){const rem=GAP-(Date.now()-m.lastEnd);if(rem>0){const h=Math.floor(rem/3600000),m2=Math.floor((rem%3600000)/60000);return{ok:false,msg:`Next session in ${h}h ${m2}m`};}}
  return{ok:true};
}

function chkLock(sess,style){
  if(!sess)return{locked:false,adv:null};
  if(style===1&&sess.trades>=1)return{locked:true,reason:'Session complete — 1 trade taken',adv:null};
  if(style===2){
    if(sess.wins>=3)return{locked:true,reason:'Take profit — 3 wins',adv:null};
    if(sess.conLoss>=2)return{locked:true,reason:'Stop loss — 2 consecutive losses',adv:null};
    if(sess.netLoss>=2)return{locked:true,reason:'Stop loss — net -2 on session',adv:null};
    if(sess.trades>=5)return{locked:true,reason:'Max trades reached — 5',adv:null};
  }
  if(style===3){
    if(sess.wins>=3)return{locked:true,reason:'Take profit — 3 wins',adv:null};
    if(sess.losses>=2)return{locked:true,reason:'Stop loss — 2 losses',adv:null};
    if(sess.trades>=3)return{locked:true,reason:'Max trades reached — 3',adv:null};
    if(sess.conWin>=2)return{locked:false,adv:`${sess.conWin} consecutive wins (+${f$(sess.sPnl)}). Consider securing this session — trade ${sess.trades+1} risks giving it back.`};
  }
  return{locked:false,adv:null};
}

async function gemini(b64,mime,key){
  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:mime,data:b64}}]}],generationConfig:{temperature:0.1,maxOutputTokens:2000,responseMimeType:'application/json'}})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`Gemini API error ${res.status}`);}
  const d=await res.json();
  const txt=d.candidates?.[0]?.content?.parts?.[0]?.text||'{}';
  try{return JSON.parse(txt.replace(/```json|```/g,'').trim());}catch{throw new Error('Could not parse Gemini response. Try again.');}
}

async function groqAnalyze(b64,mime,key){
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'meta-llama/llama-4-scout-17b-16e-instruct',messages:[{role:'user',content:[{type:'text',text:PROMPT},{type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}}]}],temperature:0.1,max_tokens:2000,response_format:{type:'json_object'}})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`Groq API error ${res.status}`);}
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content||'{}';
  try{return JSON.parse(txt.replace(/```json|```/g,'').trim());}catch{throw new Error('Could not parse Groq response. Try again.');}
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const card={background:'var(--surface-1)',borderRadius:'var(--radius)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:12,boxShadow:'var(--shadow-card), var(--highlight-top)'};
const inp={width:'100%',boxSizing:'border-box',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text-primary)',fontSize:14,outline:'none',transition:'border-color 0.15s ease, box-shadow 0.15s ease'};
const lbl={fontSize:12,fontWeight:500,color:'var(--text-muted)',marginBottom:4,display:'block'};
const g2={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12,marginBottom:16};
const g3={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginBottom:16};

function btn(variant='def'){
  const base={borderRadius:'var(--radius-sm)',padding:'8px 14px',cursor:'pointer',fontSize:13,fontWeight:600,border:'none',transition:'box-shadow 0.15s ease, opacity 0.15s ease, background 0.15s ease',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6};
  if(variant==='pri')return{...base,background:'var(--fill-accent)',color:'#fff',boxShadow:'0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -8px rgba(98,112,243,0.5)'};
  if(variant==='suc')return{...base,background:'var(--fill-success)',color:'#fff',boxShadow:'0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -8px rgba(62,207,142,0.45)'};
  if(variant==='dan')return{...base,background:'var(--fill-danger)',color:'#fff',boxShadow:'0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -8px rgba(241,113,121,0.45)'};
  if(variant==='warn')return{...base,background:'var(--fill-warning)',color:'#fff',boxShadow:'0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -8px rgba(236,180,78,0.45)'};
  return{...base,background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)'};
}

function badge(g){
  const m={
    'A+':['var(--bg-success)','var(--text-success)','var(--border-success)','0 0 0 1px rgba(62,207,142,0.25), 0 0 20px rgba(62,207,142,0.3)'],
    A:['var(--bg-success)','var(--text-success)','var(--border-success)','0 0 0 1px rgba(62,207,142,0.15), 0 0 16px rgba(62,207,142,0.2)'],
    B:['var(--bg-accent)','var(--text-accent)','var(--border-accent)','none'],
    C:['var(--bg-warning)','var(--text-warning)','var(--border-warning)','none'],
    INVALID:['var(--surface-2)','var(--text-muted)','var(--border-strong)','none'],
    UNGRADED:['var(--surface-2)','var(--text-muted)','var(--border)','none'],
  };
  const[bg,color,border,glow]=m[g]||m.UNGRADED;
  return{background:bg,color,borderRadius:999,padding:'3px 9px',fontSize:11,fontWeight:700,letterSpacing:'0.02em',display:'inline-flex',alignItems:'center',gap:4,border:`1px solid ${border}`,boxShadow:glow};
}

// Confirmation-status pill for analyzer-sourced trades: "Live confirmed" vs "Unconfirmed entry".
// liveConfirmed is null for manual entries / pre-gate trades, so nothing renders.
function ConfirmBadge({liveConfirmed}){
  if(liveConfirmed==null)return null;
  return liveConfirmed
    ?<span style={{fontSize:11,fontWeight:600,color:'var(--text-success)',background:'var(--bg-success)',border:'1px solid var(--border-success)',borderRadius:999,padding:'1px 7px',display:'inline-flex',alignItems:'center',gap:3}}><CircleCheck size={11}/>Live confirmed</span>
    :<span title='Entered without confirmed Tier 1 trigger' style={{fontSize:11,fontWeight:600,color:'var(--text-warning)',background:'var(--bg-warning)',border:'1px solid var(--border-warning)',borderRadius:999,padding:'1px 7px',display:'inline-flex',alignItems:'center',gap:3}}><TriangleAlert size={11}/>Unconfirmed entry</span>;
}

// Grade pill with icon treatment — A+/A get a spark, INVALID reads calmly final
function Grade({g,size=11}){
  return(
    <span style={{...badge(g),fontSize:size}}>
      {(g==='A+'||g==='A')&&<Sparkles size={size+1} strokeWidth={2.5}/>}
      {g==='INVALID'?'Invalid':g}
    </span>
  );
}

// Eases displayed number toward value on change (balance, win rate, …)
function AnimatedNumber({value,format=v=>v}){
  const[disp,setDisp]=useState(value);
  const fromRef=useRef(value);
  useEffect(()=>{
    const from=fromRef.current,to=value;
    fromRef.current=value;
    if(from===to)return;
    const t0=performance.now(),dur=450;let raf;
    const step=t=>{
      const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
      setDisp(from+(to-from)*e);
      if(p<1)raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[value]);
  return format(disp);
}

function Metric({label,value,sub,color,animate,format}){
  return(
    <div className="card-lift" style={{background:'var(--surface-1)',borderRadius:'var(--radius)',padding:'14px 16px',border:'1px solid var(--border)',overflow:'hidden',boxShadow:'var(--shadow-card), var(--highlight-top)'}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700,color:color||'var(--text-primary)',lineHeight:1.15,letterSpacing:'-0.02em'}}>
        {animate!=null?<AnimatedNumber value={animate} format={format}/>:value}
      </div>
      {sub&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:5}}>{sub}</div>}
    </div>
  );
}

// Circle-treated icon + copy for empty lists
function EmptyState({icon:Icon=Inbox,title,body}){
  return(
    <div style={{textAlign:'center',padding:'32px 16px'}}>
      <div style={{width:56,height:56,borderRadius:'50%',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-accent)',border:'1px solid var(--border-accent)'}}>
        <Icon size={24} style={{color:'var(--text-accent)'}}/>
      </div>
      <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{title}</div>
      {body&&<div style={{fontSize:13,color:'var(--text-muted)',maxWidth:320,margin:'0 auto'}}>{body}</div>}
    </div>
  );
}

function SparklineChart({values,color}){
  if(!values.length)return null;
  const width=280,height=120,padding=12;
  const max=Math.max(...values.map(v=>Math.abs(v)),1);
  const min=Math.min(...values.map(v=>v),0);
  const range=max-min || 1;
  const points=values.map((v,i)=>{
    const x=padding+(i/(Math.max(values.length-1,1)))*(width-padding*2);
    const y=height-padding-((v-min)/range)*(height-padding*2);
    return `${x},${y}`;
  });
  const area=`M ${points[0]} L ${points.slice(1).join(' L ')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`;
  return(
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%',height:140,display:'block'}}>
      <path d={area} fill={color} opacity="0.16"/>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BarChart({items,color}){
  const max=Math.max(...items.map(i=>i.value),1);
  return(
    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120,marginTop:8}}>
      {items.map(item=>(
        <div key={item.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
          <div style={{width:'100%',height:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
            <div style={{width:'100%',maxWidth:28,height:`${Math.max(8,(item.value/max)*100)}%`,minHeight:8,background:item.color||color,borderRadius:'6px 6px 0 0',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.2)'}}/>
          </div>
          <div style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',lineHeight:1.2}}>{item.label}</div>
          <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-primary)'}}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function Alert({type,title,body,icon,pulse}){
  const m={
    suc:['var(--bg-success)','var(--border-success)','var(--text-success)',Activity],
    dan:['var(--bg-danger)','var(--border-danger)','var(--text-danger)',Lock],
    warn:['var(--bg-warning)','var(--border-warning)','var(--text-warning)',TriangleAlert],
    inf:['var(--bg-accent)','var(--border-accent)','var(--text-accent)',Info],
  };
  const[bg,border,color,DefIcon]=m[type]||m.inf;
  const Icon=icon||DefIcon;
  return(
    <div style={{...card,background:bg,borderColor:border,marginBottom:12,display:'flex',gap:12,alignItems:'flex-start',padding:'13px 16px'}}>
      <div style={{width:32,height:32,borderRadius:'var(--radius-sm)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.18)',border:`1px solid ${border}`}}>
        <Icon size={16} style={{color}}/>
      </div>
      <div style={{minWidth:0,flex:1}}>
        {title&&(
          <div style={{fontSize:13,fontWeight:600,color,marginBottom:body?3:0,display:'flex',alignItems:'center',gap:8}}>
            {pulse&&<span className="pulse-dot"/>}
            {title}
          </div>
        )}
        {body&&<div style={{fontSize:13,color:'var(--text-secondary)'}}>{body}</div>}
      </div>
    </div>
  );
}

// Gate breakdown for the strict AI pre-validation filter (new schema). Criteria
// below stays for analyses saved under the old loose-criteria schema.
function Gates({gates,passCount}){
  const n=passCount??gates.filter(g=>g.pass).length;
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{n}/{gates.length} gates passed</span>
        <div style={{display:'flex',gap:3}} aria-hidden="true">
          {gates.map(g=><span key={g.gate} style={{width:16,height:5,borderRadius:999,background:g.pass?'var(--text-success)':'var(--surface-2)',border:g.pass?'none':'1px solid var(--border-strong)'}}/>)}
        </div>
      </div>
      {gates.map(g=>(
        <div key={g.gate} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
          {g.pass
            ?<CircleCheck size={15} style={{color:'var(--text-success)',flexShrink:0,marginTop:2}}/>
            :<CircleX size={15} style={{color:'var(--text-danger)',flexShrink:0,marginTop:2}}/>}
          <div>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>
              <span style={{color:'var(--text-muted)',fontWeight:700,fontSize:10,letterSpacing:'0.08em',marginRight:6}}>GATE {g.gate}</span>{g.label}
            </div>
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>{g.justification}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Criteria({criteria}){
  const labels={originStructure:'Origin structure',explosiveDeparture:'Explosive departure',cleanDeparture:'Clean departure',unmitigatedStatus:'Unmitigated status',zoneFreshness:'Zone freshness',distanceRatio:'Distance ratio',marketContext:'Market context',zoneSize:'Zone size'};
  return(
    <div>
      {Object.entries(criteria).map(([k,v])=>(
        <div key={k} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'0.5px solid var(--border)'}}>
          <i className={`ti ${v.pass?'ti-circle-check':'ti-circle-x'}`} style={{fontSize:15,color:v.pass?'var(--text-success)':'var(--text-danger)',flexShrink:0,marginTop:2}} aria-hidden="true"/>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{labels[k]||k}</div>
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>{v.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Setup Wizard ──────────────────────────────────────────────────────────────
function Setup({onDone}){
  const[step,setStep]=useState(1);
  const[f,sf]=useState({apiKey:'',groqApiKey:'',aiProvider:'gemini',startingBalanceDemo:'',startingBalanceReal:'',riskPercent:5,tradeStyle:1,tradeStyleDemo:1,tradeStyleReal:1,sessionsPerDay:2,brokerMin:10,milestones:DEF_MS});
  const set=(k,v)=>sf(p=>({...p,[k]:v}));

  function finish(){
    onDone({...f,startingBalanceDemo:parseFloat(f.startingBalanceDemo||0),startingBalanceReal:parseFloat(f.startingBalanceReal||0),setupComplete:true,createdAt:Date.now()});
  }

  return(
    <div style={{maxWidth:540,margin:'0 auto',padding:'2rem 1rem'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <div style={{fontSize:22,fontWeight:500,color:'var(--text-primary)',marginBottom:6}}>TheGiftedMan Trading Tool</div>
        <div style={{fontSize:14,color:'var(--text-secondary)'}}>Set up your personal trading system</div>
      </div>

      <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:24}}>
        {[1,2,3,4].map(n=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,background:step>n?'var(--fill-success)':step===n?'var(--fill-accent)':'var(--surface-1)',color:step>=n?'var(--on-accent)':'var(--text-muted)',border:'0.5px solid var(--border)',fontWeight:500}}>
              {step>n?<i className="ti ti-check"/>:n}
            </div>
            {n<4&&<div style={{width:20,height:1,background:step>n?'var(--fill-success)':'var(--border)'}}/>}
          </div>
        ))}
      </div>

      <div style={card}>
        {step===1&&(
          <div>
            <h2 style={{fontSize:16,fontWeight:500,marginBottom:12,margin:'0 0 12px'}}>AI provider for zone analysis</h2>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:14}}>Choose your AI provider. You can switch or add keys at any time in Settings.</p>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Gemini API key <span style={{color:'var(--text-muted)'}}>(Google AI Studio — free tier)</span></label>
              <input style={inp} type="password" placeholder="AIzaSy..." value={f.apiKey} onChange={e=>set('apiKey',e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Groq API key <span style={{color:'var(--text-muted)'}}>(console.groq.com — free tier)</span></label>
              <input style={inp} type="password" placeholder="gsk_..." value={f.groqApiKey||''} onChange={e=>set('groqApiKey',e.target.value)}/>
            </div>
            <p style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>Keys are stored locally on your device only. At least one key is needed to use zone analysis.</p>
          </div>
        )}
        {step===2&&(
          <div>
            <h2 style={{fontSize:16,fontWeight:500,margin:'0 0 12px'}}>Account setup</h2>
            <div style={g2}>
              <div>
                <label style={lbl}>Demo starting balance ($)</label>
                <input style={inp} type="number" min="1" placeholder="e.g. 20" value={f.startingBalanceDemo} onChange={e=>set('startingBalanceDemo',e.target.value)}/>
              </div>
              <div>
                <label style={lbl}>Real starting balance ($)</label>
                <input style={inp} type="number" min="1" placeholder="e.g. 20" value={f.startingBalanceReal} onChange={e=>set('startingBalanceReal',e.target.value)}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Risk per trade: <strong>{f.riskPercent}%</strong>{(f.startingBalanceReal||f.startingBalanceDemo)&&` = ${f$(parseFloat(f.startingBalanceReal||f.startingBalanceDemo)*(f.riskPercent/100))} stake`}</label>
              <input type="range" min="1" max="20" step="0.5" value={f.riskPercent} onChange={e=>set('riskPercent',parseFloat(e.target.value))} style={{width:'100%'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                <span>1% conservative</span><span>5% standard</span><span>20% aggressive</span>
              </div>
              {f.riskPercent>10&&<div style={{marginTop:6,fontSize:12,color:'var(--text-warning)',padding:'6px 8px',background:'var(--bg-warning)',borderRadius:'var(--radius)'}}>⚠ Risk above 10% is high. 5% is the professional standard for binary options.</div>}
            </div>
          </div>
        )}
        {step===3&&(
          <div>
            <h2 style={{fontSize:16,fontWeight:500,margin:'0 0 12px'}}>Trade management style</h2>
            <div style={g2}>
              <div>
                <label style={lbl}>Demo account</label>
                {[{id:1,name:'Precision',desc:'1 trade per session. Session ends after that trade regardless of outcome.'},{id:2,name:'Active',desc:'Up to 5 trades per session. Stop at 2 consecutive losses or net -2.'},{id:3,name:'Structured',desc:'Up to 3 trades per session. Stop at 2 losses. Advisory at 2 consecutive wins.'}].map(st=>(
                  <div key={st.id} onClick={()=>set('tradeStyleDemo',st.id)} style={{...card,cursor:'pointer',marginBottom:8,border:f.tradeStyleDemo===st.id?'1.5px solid var(--border-accent)':'0.5px solid var(--border)'}}>
                    <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)',marginBottom:3}}>{st.name}</div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>{st.desc}</div>
                  </div>
                ))}
              </div>
              <div>
                <label style={lbl}>Real account</label>
                {[{id:1,name:'Precision',desc:'1 trade per session. Session ends after that trade regardless of outcome.'},{id:2,name:'Active',desc:'Up to 5 trades per session. Stop at 2 consecutive losses or net -2.'},{id:3,name:'Structured',desc:'Up to 3 trades per session. Stop at 2 losses. Advisory at 2 consecutive wins.'}].map(st=>(
                  <div key={st.id} onClick={()=>set('tradeStyleReal',st.id)} style={{...card,cursor:'pointer',marginBottom:8,border:f.tradeStyleReal===st.id?'1.5px solid var(--border-accent)':'0.5px solid var(--border)'}}>
                    <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)',marginBottom:3}}>{st.name}</div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>{st.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop:12}}>
              <label style={lbl}>Sessions per day</label>
              <div style={{display:'flex',gap:8}}>
                {[1,2,3].map(n=>(
                  <button key={n} style={{...btn(f.sessionsPerDay===n?'pri':'def'),flex:1}} onClick={()=>set('sessionsPerDay',n)}>{n} session{n>1?'s':''}</button>
                ))}
              </div>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>6-hour gap enforced between all sessions.</p>
            </div>
          </div>
        )}
        {step===4&&(
          <div>
            <h2 style={{fontSize:16,fontWeight:500,margin:'0 0 12px'}}>Withdrawal settings</h2>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Broker minimum withdrawal ($)</label>
              <input style={inp} type="number" min="1" value={f.brokerMin} onChange={e=>set('brokerMin',parseFloat(e.target.value))}/>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Pocket Option default is $10. No withdrawal will be advised below this amount.</p>
            </div>
            <div style={{...card,background:'var(--bg-accent)',borderColor:'var(--border-accent)'}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text-accent)',marginBottom:6}}>Milestone system</div>
              <p style={{fontSize:12,color:'var(--text-secondary)',margin:0}}>The app recommends withdrawals when your balance hits multiples of your starting balance — but only once the broker minimum threshold is met. You always decide whether to follow the advice.</p>
            </div>
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
        {step>1?<button style={btn()} onClick={()=>setStep(s=>s-1)}>← Back</button>:<div/>}
        {step<4
          ?<button style={btn('pri')} onClick={()=>setStep(s=>s+1)}>Next →</button>
          :<button style={btn('pri')} onClick={finish} disabled={!f.startingBalanceDemo||!f.startingBalanceReal}>Start trading →</button>
        }
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard({settings,trades,wds,ss,bal,mode,nav}){
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const done=modeTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=done.length?((wins/done.length)*100):0;
  const pnl=done.reduce((s,t)=>s+t.pnl,0);
  const startBal=getStartingBalanceForMode(settings,mode);
  const growth=startBal?((bal-startBal)/startBal)*100:0;
  const stake=calcStake(bal,settings.riskPercent);
  const active=getActive(ss,mode);
  const activeTradesArr = active?modeTrades.filter(t=>t.date===ss?.date && t.sessionNum===active.num):[];
  const activeTradesCount = activeTradesArr.length;
  const activeWins = activeTradesArr.filter(t=>t.outcome==='WIN').length;
  const activeLosses = activeTradesArr.filter(t=>t.outcome==='LOSS').length;
  const canS=canStart(ss,settings.sessionsPerDay,mode);
  const isDailyLocked=ss.perMode?.[mode]?.isDailyLocked||false;
  // Milestones are a Real-only concept (Change 2) — Demo still gets growth/P&L, no milestone tracker.
  const nextMs=mode==='REAL'?settings.milestones.find(m=>bal<startBal*m.mul):null;
  const recent=[...modeTrades].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5);
  let streak=0,sType=null;
  for(const t of[...done].reverse()){if(!sType){sType=t.outcome;streak=1;}else if(t.outcome===sType)streak++;else break;}
  const pendingN=modeTrades.filter(t=>t.outcome==='PENDING').length;
  const msTarget=nextMs?startBal*nextMs.mul:null;
  const gUp=growth>=0;
  const isReal=mode==='REAL';

  return(
    <div>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:600,letterSpacing:'-0.01em',color:'var(--text-primary)'}}>Dashboard</div>
        <div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* Hero — balance is the anchor of the page */}
        <div className="col-span-12 lg:col-span-8" style={{...card,marginBottom:0,padding:'24px 24px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:`radial-gradient(420px 200px at 12% -10%, ${isReal?'rgba(241,113,121,0.14)':'rgba(98,112,243,0.14)'}, transparent 70%)`,pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.12em'}}>Total balance</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:700,letterSpacing:'0.06em',background:isReal?'var(--bg-danger)':'var(--bg-accent)',color:isReal?'var(--text-danger)':'var(--text-accent)',border:`1px solid ${isReal?'var(--border-danger)':'var(--border-accent)'}`}}>
              {isReal&&<span className="pulse-dot" style={{background:'var(--text-danger)'}}/>}
              {isReal?'REAL ACCOUNT':'DEMO ACCOUNT'}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{fontSize:44,fontWeight:700,letterSpacing:'-0.03em',lineHeight:1,color:'var(--text-primary)'}}>
              <AnimatedNumber value={bal} format={v=>f$(v)}/>
            </div>
            <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'4px 9px',borderRadius:999,fontSize:12,fontWeight:600,background:gUp?'var(--bg-success)':'var(--bg-danger)',color:gUp?'var(--text-success)':'var(--text-danger)',border:`1px solid ${gUp?'var(--border-success)':'var(--border-danger)'}`}}>
              {gUp?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}{gUp?'+':''}{fp(growth)}
            </span>
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>from {f$(startBal)} starting balance</div>

          {nextMs&&(
            <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'inline-flex',alignItems:'center',gap:6}}>
                  <Target size={13} style={{color:'var(--text-accent)'}}/>Next milestone · {nextMs.mul}×
                </span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{f$(bal)} / {f$(msTarget)} · withdraw {nextMs.pct}% when reached</span>
              </div>
              <div style={{background:'var(--surface-0)',borderRadius:999,height:6,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:999,background:'var(--fill-accent)',width:`${Math.min(100,(bal/msTarget)*100)}%`,transition:'width 0.4s ease'}}/>
              </div>
            </div>
          )}
        </div>

        {/* Session status + quick actions */}
        <div className="col-span-12 lg:col-span-4 flex flex-col" style={{...card,marginBottom:0,padding:'20px'}}>
          {isDailyLocked?(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-danger)',border:'1px solid var(--border-danger)',marginBottom:10}}>
                <Lock size={17} style={{color:'var(--text-danger)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Day locked</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{MAX_DL} losses recorded today. Trading resumes tomorrow.</div>
            </div>
          ):active?(
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span className="pulse-dot"/>
                <span style={{fontSize:11,fontWeight:600,color:'var(--text-success)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Session {active.num} live</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[['Trades',activeTradesCount,'var(--text-primary)'],['Wins',activeWins,'var(--text-success)'],['Losses',activeLosses,'var(--text-danger)']].map(([l,v,c])=>(
                  <div key={l} style={{background:'var(--surface-0)',borderRadius:'var(--radius-sm)',padding:'8px 10px',border:'1px solid var(--border)'}}>
                    <div style={{fontSize:18,fontWeight:700,color:c,lineHeight:1.2}}>{v}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ):canS.ok?(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-accent)',border:'1px solid var(--border-accent)',marginBottom:10}}>
                <Target size={17} style={{color:'var(--text-accent)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Ready for session {ss.sessions.length+1}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Analyze a zone or open the journal to begin.</div>
            </div>
          ):(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-warning)',border:'1px solid var(--border-warning)',marginBottom:10}}>
                <Timer size={17} style={{color:'var(--text-warning)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Session gap</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{canS.msg}</div>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:16}}>
            <button style={{...btn('pri'),width:'100%'}} onClick={()=>nav('analyzer')}><ScanSearch size={15}/>Analyze zone</button>
            <button style={{...btn(),width:'100%'}} onClick={()=>nav('journal')}><BookOpen size={15}/>Journal{pendingN>0&&<span style={{marginLeft:2,padding:'1px 7px',borderRadius:999,fontSize:11,fontWeight:700,background:'var(--bg-danger)',color:'var(--text-danger)',border:'1px solid var(--border-danger)'}}>{pendingN}</span>}</button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="col-span-6 lg:col-span-3"><Metric label="Win rate" value={fp(wr)} sub={`${wins}W / ${done.length-wins}L · ${done.length} trades`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':done.length?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Streak" value={done.length?`${streak} ${sType==='WIN'?'wins':'losses'}`:'—'} color={sType==='WIN'?'var(--text-success)':sType==='LOSS'?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Next stake" value={f$(stake.actual)} sub={`${fp(stake.eff)} effective risk`} color={stake.eff>settings.riskPercent*1.5?'var(--text-warning)':'var(--text-primary)'}/></div>

        {/* Recent trades */}
        <div className="col-span-12" style={{...card,marginBottom:0}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8,color:'var(--text-primary)'}}>Recent trades</div>
          {recent.length===0?(
            <EmptyState icon={ScanSearch} title="No trades yet" body="Analyze your first zone or add a manual entry — trades will show up here."/>
          ):recent.map(t=>(
            <div key={t.id} className="flex items-center justify-between rounded-sm px-2 py-2 -mx-2 transition-colors hover:bg-surface-2">
              <div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}>
                <Grade g={t.zoneGrade}/>
                <span style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{t.pair||'—'}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:12,fontWeight:600,color:t.direction==='BUY'?'var(--text-success)':'var(--text-danger)'}}>
                  {t.direction==='BUY'?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}{t.direction}
                </span>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:600,color:t.outcome==='WIN'?'var(--text-success)':t.outcome==='LOSS'?'var(--text-danger)':'var(--text-muted)'}}>{t.outcome==='PENDING'?'Pending':(t.pnl>=0?'+':'')+f$(t.pnl)}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(t.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Zone Analyzer ─────────────────────────────────────────────────────────────
export function Analyzer({settings,ss,mode,saveAnalyses,analyses,nav,setPA}){
  const[img,setImg]=useState(null);
  const[b64,setB64]=useState(null);
  const[mime,setMime]=useState('image/png');
  const[busy,setBusy]=useState(false);
  const[res,setRes]=useState(null);
  const[err,setErr]=useState(null);
  const[extras,setExtras]=useState([]);
  const[liveConfirmed,setLiveConfirmed]=useState(false);
  const fRef=useRef();const xRef=useRef();

  const active=getActive(ss,mode);
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const locked=(ss.perMode?.[mode]?.isDailyLocked||false)||lk.locked;

  async function addImage(file,target='extra'){
    if(!file)return;
    const objectUrl=(typeof URL.createObjectURL==='function')?URL.createObjectURL(file):null;
    if(target==='main'){
      setRes(null);setErr(null);
      setImg(objectUrl||`data:${file.type||'image/png'};base64,${await toB64(file)}`);
      setB64(await toB64(file));
      setMime(file.type||'image/png');
      return;
    }
    if(extras.length>=4)return;
    const b=await toB64(file);
    setExtras(p=>[...p,{url:objectUrl||`data:${file.type||'image/png'};base64,${b}`,b64:b,mime:file.type||'image/png'}]);
  }

  async function handlePaste(e){
    if(locked)return;
    const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const file=item.getAsFile();
    if(!file)return;
    if(img||res){
      if(extras.length<4)await addImage(file,'extra');
    }else{
      await addImage(file,'main');
    }
  }

  useEffect(()=>{
    function onPaste(e){
      if(locked)return;
      const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
      if(!item)return;
      e.preventDefault();
      const file=item.getAsFile();
      if(!file)return;
      if(img||res){
        if(extras.length<4){toB64(file).then(b=>setExtras(p=>[...p,{url:URL.createObjectURL(file),b64:b,mime:file.type||'image/png'}]));}
      }else{
        handle(file).catch(()=>{});
      }
    }
    document.addEventListener('paste',onPaste);
    return()=>document.removeEventListener('paste',onPaste);
  },[locked,res,extras,img]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handle(file){
    if(!file)return;
    setRes(null);setErr(null);
    setImg(URL.createObjectURL(file));
    setB64(await toB64(file));
    setMime(file.type||'image/png');
  }

  const provider=settings.aiProvider||'gemini';
  const activeKey=provider==='groq'?settings.groqApiKey:settings.apiKey;

  async function analyze(){
    if(!b64||!activeKey)return;
    setBusy(true);setErr(null);setLiveConfirmed(false);
    try{
      const r=provider==='groq'?await groqAnalyze(b64,mime,activeKey):await gemini(b64,mime,activeKey);
      const a={id:uid(),timestamp:Date.now(),date:tod(),screenshot:b64,screenshotMime:mime,linkedTradeId:null,...r};
      await saveAnalyses([a,...analyses]);
      setRes(a);
    }catch(e){setErr(e.message);}
    finally{setBusy(false);}
  }

  function goJournal(){
    setPA({...res,extras,liveConfirmed:res.gateResults?liveConfirmed:null});
    nav('journal');
  }

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Zone analyzer</div>

      {locked&&<Alert type="dan" title="🔒 Analyzer locked" body={(lk.reason||'Daily limit reached')+'. Zone analysis resumes next session.'}/>}
      {lk.adv&&!locked&&<Alert type="warn" title="Advisory" body={lk.adv}/>}
      {!activeKey&&<Alert type="warn" title="No API key" body={`Add your ${provider==='groq'?'Groq':'Gemini'} API key in Settings to enable zone analysis.`}/>}

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop chart screenshot or click to browse"
        style={{...card,border:'1.5px dashed var(--border-strong)',textAlign:'center',cursor:locked?'not-allowed':'pointer',opacity:locked?0.5:1,minHeight:img?'auto':140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:img?'0.75rem':'2rem'}}
        onClick={()=>!locked&&fRef.current?.click()}
        onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!locked){e.preventDefault();fRef.current?.click();}}}
        onPaste={handlePaste}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();if(!locked)handle(e.dataTransfer.files[0]);}}
      >
        {img
          ?<img src={img} alt="Chart screenshot" style={{maxWidth:'100%',borderRadius:8,maxHeight:280,objectFit:'contain'}}/>
          :<><i className="ti ti-upload" style={{fontSize:28,color:'var(--text-muted)',marginBottom:8}} aria-hidden="true"/><div style={{fontSize:14,color:'var(--text-secondary)'}}>Drop chart screenshot or click to browse</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>PNG · JPG · or paste with Ctrl+V</div></>
        }
        <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handle(e.target.files[0])}/>
      </div>

      {img&&!busy&&(
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <button style={{...btn('pri'),flex:1}} onClick={analyze} disabled={locked||!activeKey}>Analyze zone</button>
          <button style={btn()} onClick={()=>{setImg(null);setB64(null);setRes(null);setErr(null);setExtras([]);setLiveConfirmed(false);}}>Clear</button>
        </div>
      )}

      {busy&&(
        <div style={{...card,textAlign:'center',padding:'2rem'}}>
          <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--fill-accent)',borderRadius:'50%',margin:'0 auto 10px',animation:'spin 1s linear infinite'}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>Analyzing zone against your playbook criteria...</div>
        </div>
      )}

      {err&&<Alert type="dan" title="Analysis failed" body={err}/>}

      {res&&(
        <>
          <div style={{...card,background:res.verdict==='VALID'?'var(--bg-success)':'var(--bg-danger)',borderColor:res.verdict==='VALID'?'var(--border-success)':'var(--border-danger)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:18,fontWeight:500,color:res.verdict==='VALID'?'var(--text-success)':'var(--text-danger)'}}>{res.verdict==='VALID'?'✓ Valid zone':'✗ Invalid zone'}</div>
                <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>{res.zoneType} · {res.detectedPair||'Pair not detected'}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{...badge(res.grade),fontSize:14,padding:'4px 10px'}}>Grade {res.grade}</span>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{res.confidence}% confidence</div>
              </div>
            </div>
            <div style={{fontSize:13,color:'var(--text-secondary)'}}>{res.summary}</div>
          </div>

          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>{res.gateResults?'Gate check':'Criteria check'}</div>
            {res.gateResults?.length
              ?<Gates gates={res.gateResults} passCount={res.passCount}/>
              :res.criteria&&<Criteria criteria={res.criteria}/>}
          </div>

          {res.executionAdvice&&(
            <div style={{...card,background:'var(--bg-accent)',borderColor:'var(--border-accent)'}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text-accent)',marginBottom:4}}>Execution advice</div>
              <div style={{fontSize:13,color:'var(--text-secondary)'}}>{res.executionAdvice}</div>
            </div>
          )}

          <div style={card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:500}}>Additional screenshots <span style={{fontWeight:400,color:'var(--text-muted)'}}>(optional — up to 4)</span></div>
              {extras.length<4&&<span style={{fontSize:11,color:'var(--text-muted)'}}>Ctrl+V to paste</span>}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              {extras.map((x,i)=>(
                <div key={i} style={{position:'relative'}}>
                  <img src={x.url} alt="" style={{width:72,height:54,objectFit:'cover',borderRadius:6,border:'0.5px solid var(--border)'}}/>
                  <button onClick={()=>setExtras(e=>e.filter((_,j)=>j!==i))} style={{position:'absolute',top:-5,right:-5,background:'var(--fill-danger)',border:'none',color:'#fff',borderRadius:'50%',width:16,height:16,cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>×</button>
                </div>
              ))}
              {extras.length<4&&<div onClick={()=>xRef.current?.click()} onPaste={handlePaste} style={{width:72,height:54,border:'1px dashed var(--border)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)',gap:2}}>
                <span style={{fontSize:20,lineHeight:1}}>+</span>
                <span style={{fontSize:9}}>browse</span>
              </div>}
            </div>
            <input ref={xRef} type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{const f=e.target.files[0];if(f)await addImage(f,'extra');}}/>
          </div>

          {res.gateResults&&res.grade!=='INVALID'&&(
            <div style={{...card,background:liveConfirmed?'var(--bg-success)':'var(--bg-warning)',borderColor:liveConfirmed?'var(--border-success)':'var(--border-warning)'}}>
              <div style={{fontSize:13,fontWeight:600,color:liveConfirmed?'var(--text-success)':'var(--text-warning)',marginBottom:8}}>Live 10-second confirmation required</div>
              <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer'}}>
                <input type="checkbox" checked={liveConfirmed} onChange={e=>setLiveConfirmed(e.target.checked)} style={{marginTop:3,flexShrink:0,width:16,height:16,accentColor:'var(--accent)'}}/>
                <span style={{fontSize:13,color:'var(--text-secondary)'}}>I observed a Tier 1 confirmation on the live 10-second chart (full-body engulfing, pin bar with wick ≥2x body closing outside the zone, or confirmed FTR/BOS) with no hesitation inside the zone beforehand.</span>
              </label>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>
                {liveConfirmed?'This entry will log as live confirmed.':'Unchecked entries can still be logged, tagged "Entered without confirmed Tier 1 trigger" for later comparison in Analytics.'}
              </div>
            </div>
          )}

          {res.verdict==='VALID'&&(res.grade==='A+'||res.grade==='A'||res.grade==='B'||res.grade==='C')
            ?<button style={{...btn('suc'),width:'100%'}} onClick={goJournal}>Record journal entry →</button>
            :<button style={{...btn(),width:'100%',opacity:0.75}} onClick={goJournal}>⚠ Log anyway (invalid zone)</button>
          }
        </>
      )}
    </div>
  );
}

// ── Journal ───────────────────────────────────────────────────────────────────
export function Journal({settings,trades,saveTrades,deleteTrade,ss,saveSS,pa,setPA,wds,mode}){
  const[filt,setFilt]=useState('ALL');
  const[manual,setManual]=useState(false);
  const[journalTab,setJournalTab]=useState(mode||'DEMO');
  const[mf,smf]=useState({pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:mode||'DEMO'});
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[selectedTrade,setSelectedTrade]=useState(null);
  const[editDraft,setEditDraft]=useState({notes:'',screenshots:[]});
  const[previewImage,setPreviewImage]=useState(null);

  // Journal defaults to the matching tab whenever the global Demo/Real toggle
  // changes, but the trader can still flip tabs independently while it's unchanged.
  useEffect(()=>{if(mode)setJournalTab(mode);},[mode]);

  const stakeFor=m=>calcStake(balForMode(settings,trades,wds,m),settings.riskPercent);
  // Analyzer results always log to the global toggle's account (Change 4) —
  // no separate confirmation step. Manual entries log to whichever tab is open.
  const stake=stakeFor(mode);

  const active=getActive(ss,mode);
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const locked=(ss.perMode?.[mode]?.isDailyLocked||false)||lk.locked;

  const tabActive=getActive(ss,journalTab);
  const tabLk=tabActive?chkLock(tabActive,getTradeStyleForMode(settings,journalTab)):{locked:false};
  const tabLocked=(ss.perMode?.[journalTab]?.isDailyLocked||false)||tabLk.locked;

  async function mkSession(ssState,mode){
    const s=canStart(ssState,settings.sessionsPerDay,mode);
    if(!s.ok){alert(s.msg);return null;}
    const ns={id:uid(),num:ssState.sessions.filter(x=>x.accountMode===mode).length+1,accountMode:mode,startTime:Date.now(),endTime:null,trades:0,wins:0,losses:0,conLoss:0,conWin:0,netLoss:0,sPnl:0,isActive:true,isLocked:false,lockReason:null};
    const upd={...ssState,sessions:[...ssState.sessions,ns]};
    await saveSS(upd);
    return{ss:upd,sess:ns};
  }

  async function recordPA(){
    if(!pa)return;
    let cur=ss,sess=active;
    if(!sess){const r=await mkSession(cur,mode);if(!r)return;cur=r.ss;sess=r.sess;}
    const t={id:uid(),timestamp:Date.now(),date:tod(),sessionNum:sess.num,pair:pa.detectedPair||'Unknown',direction:pa.direction||'BUY',zoneType:pa.zoneType||'',zoneGrade:pa.grade||'A',stake:stake.actual,outcome:'PENDING',pnl:0,source:'ANALYZER',analysisId:pa.id||null,screenshots:[pa.screenshot,...(pa.extras?.map(e=>e.b64)||[])],notes:'',isAnalyzed:true,criteria:pa.criteria||null,gateResults:pa.gateResults||null,passCount:pa.passCount??null,liveConfirmed:pa.liveConfirmed??null,failedCriteria:pa.failedCriteria||[],keyStrengths:pa.keyStrengths||[],keyWeaknesses:pa.keyWeaknesses||[],executionAdvice:pa.executionAdvice||'',summary:pa.summary||'',confidence:pa.confidence||0,verdict:pa.verdict||'',recommendation:pa.recommendation||'',accountMode:mode};
    await saveTrades(prev=>[t,...(prev||[])]);
    const us={...sess,trades:sess.trades+1};
    await saveSS({...cur,sessions:cur.sessions.map(s=>s.id===sess.id?us:s)});
    setPA(null);
  }

  async function setOutcome(tid,outcome){
    const t=trades.find(x=>x.id===tid);if(!t)return;
    const pnl=calcPnl(t.stake,outcome);
    await saveTrades(prev=>prev.map(x=>x.id===tid?{...x,outcome,pnl}:x));
    const sess=ss.sessions.find(s=>s.num===t.sessionNum && s.accountMode===getTradeMode(t));
    if(sess){
      const isW=outcome==='WIN';
      const us={...sess,wins:sess.wins+(isW?1:0),losses:sess.losses+(isW?0:1),conLoss:isW?0:sess.conLoss+1,conWin:isW?sess.conWin+1:0,netLoss:sess.netLoss+(isW?-1:1),sPnl:sess.sPnl+pnl};
      const lk2=chkLock(us,getTradeStyleForMode(settings,getTradeMode(t)));
      if(lk2.locked){us.isActive=false;us.isLocked=true;us.lockReason=lk2.reason;us.endTime=Date.now();}
      const nextSessions=ss.sessions.map(s=>s.id===sess.id?us:s);
      await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
    }
  }

  function addPairOption(value){
    const trimmed=(value||'').trim();
    if(!trimmed)return;
    setPairOptions(prev=>prev.includes(trimmed)?prev:[...prev,trimmed]);
  }

  async function addManual(){
    const tradeDate = mf.tradeDate || tod();
    const isToday = tradeDate === tod();
    let sessionNum = null;

    const entryAccountMode=mf.accountMode || journalTab;

    if (isToday) {
      let cur=ss;
      let sess=getActive(ss,entryAccountMode);
      if(!sess){
        const r=await mkSession(cur,entryAccountMode);
        if(!r)return;
        cur=r.ss;
        sess=r.sess;
      }
      const us={...sess,trades:sess.trades+1};
      await saveSS({...cur,sessions:cur.sessions.map(s=>s.id===sess.id?us:s)});
      sessionNum = sess.num;
    }

    const pair=(mf.pair||'').trim()||'Manual';
    addPairOption(pair);
    const outcome=mf.outcome||'PENDING';
    const entryStake=stakeFor(entryAccountMode).actual;
    const pnl=calcPnl(entryStake,outcome);

    const now = new Date();
    const tradeDateTime = new Date(tradeDate);
    tradeDateTime.setHours(now.getHours());
    tradeDateTime.setMinutes(now.getMinutes());
    tradeDateTime.setSeconds(now.getSeconds());
    const timestamp = tradeDateTime.getTime();

    const t={id:uid(),timestamp,date:tradeDate,sessionNum:sessionNum,pair,direction:mf.dir,zoneType:'',zoneGrade:mf.grade,stake:entryStake,outcome,pnl,source:'MANUAL',analysisId:null,screenshots:mf.screenshots.map(x=>x.b64||x).filter(Boolean),notes:mf.notes,isAnalyzed:false,accountMode:entryAccountMode};

    await saveTrades(prev=>[t,...(prev||[])]);
    setManual(false);smf({pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:journalTab});
  }

  async function addManualImage(file){
    if(!file)return;
    const b=await toB64(file);
    const url=typeof URL.createObjectURL==='function'?URL.createObjectURL(file):`data:${file.type||'image/png'};base64,${b}`;
    smf(m=>({...m,screenshots:[...(m.screenshots||[]),{url,b,mime:file.type||'image/png'}]}));
  }

  function onManualPaste(e){
    const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const file=item.getAsFile();
    if(file) addManualImage(file);
  }

  const tabTrades=trades.filter(t=>getTradeMode(t)===journalTab);
  const sorted=[...(filt==='ALL'?tabTrades:tabTrades.filter(t=>filt==='PENDING'?t.outcome==='PENDING':t.outcome===filt))].sort((a,b)=>b.timestamp-a.timestamp);
  const tradeMeta=[['Pair',selectedTrade?.pair],['Direction',selectedTrade?.direction],['Account mode',selectedTrade?.accountMode||'DEMO'],['Stake',selectedTrade?f$(selectedTrade.stake):null],['Outcome',selectedTrade?.outcome],['Session',selectedTrade?.sessionNum],['Zone type',selectedTrade?.zoneType],['Zone grade',selectedTrade?.zoneGrade],['Source',selectedTrade?.source],['Timestamp',selectedTrade?new Date(selectedTrade.timestamp).toLocaleString():null]];

  async function saveTradeEdits(){
    if(!selectedTrade)return;
    const screenshots=editDraft.screenshots.map(x=>x.b64||x).filter(Boolean);
    const updated={...selectedTrade,notes:editDraft.notes,screenshots};
    await saveTrades(prev=>prev.map(t=>t.id===selectedTrade.id?updated:t));
    setSelectedTrade(updated);
  }

  async function addTradeImage(file){
    if(!file||!selectedTrade)return;
    const b=await toB64(file);
    const url=typeof URL.createObjectURL==='function'?URL.createObjectURL(file):`data:${file.type||'image/png'};base64,${b}`;
    const next=[...(editDraft.screenshots||selectedTrade.screenshots||[]),{url,b,mime:file.type||'image/png'}];
    setEditDraft(d=>({...d,screenshots:next}));
    setSelectedTrade(s=>s?{...s,screenshots:next.map(x=>x.b64)}:s);
  }

  function openTradeImage(src){
    setPreviewImage(src);
  }

  function onTradePaste(e){
    if(!selectedTrade)return;
    const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const file=item.getAsFile();
    if(file) addTradeImage(file);
  }

  useEffect(()=>{
    if(selectedTrade){
      setEditDraft({notes:selectedTrade.notes||'',screenshots:(selectedTrade.screenshots||[]).map((src,i)=>({id:i,url:typeof src==='string'&&src.startsWith('data:')?src:toDataUrl(src),b64:src,mime:'image/png'}))});
    }
  },[selectedTrade]);

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Trading journal</div>

      {pa&&(
        <div style={{...card,background:'var(--bg-success)',borderColor:'var(--border-success)'}}>
          <div style={{fontSize:14,fontWeight:500,color:'var(--text-success)',marginBottom:6}}>Zone analysis ready to log</div>
          <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:10}}>{pa.zoneType} · Grade {pa.grade} · {pa.detectedPair||'Pair auto-detected'} · {pa.direction} · Stake {f$(stake.actual)}</div>
          <div style={{marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',padding:'3px 9px',borderRadius:999,background:mode==='REAL'?'var(--bg-danger)':'var(--bg-accent)',color:mode==='REAL'?'var(--text-danger)':'var(--text-accent)',border:`1px solid ${mode==='REAL'?'var(--border-danger)':'var(--border-accent)'}`}}>
              Logging to {mode==='REAL'?'REAL':'DEMO'}
            </span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...btn('suc'),flex:1}} onClick={recordPA} disabled={locked}>Create journal entry</button>
            <button style={btn()} onClick={()=>setPA(null)}>Discard</button>
          </div>
          {locked&&<div style={{fontSize:12,color:'var(--text-danger)',marginTop:6}}>Session locked — {lk.reason||(ss.perMode?.[mode]?.isDailyLocked?'daily limit reached':'check session status')}.</div>}
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {ACCOUNT_MODES.map(m=>(
          <button key={m} style={{...btn(journalTab===m?'pri':'def'),flex:1}} onClick={()=>setJournalTab(m)}>{m==='REAL'?'Real':'Demo'}</button>
        ))}
      </div>

      {tabLocked&&<Alert type="dan" title={`${journalTab==='REAL'?'Real':'Demo'} day locked`} body={tabLk.reason||`${MAX_DL}-loss daily limit reached for this account. Manual entries resume tomorrow.`}/>}

      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <button style={btn()} onClick={()=>{setManual(v=>!v);smf(m=>({...m,accountMode:journalTab}));}} disabled={tabLocked}>{manual?'Cancel':'+ Manual entry'}</button>
        {['ALL','PENDING','WIN','LOSS'].map(f=>(
          <button key={f} style={{...btn(filt===f?'pri':'def'),padding:'6px 10px'}} onClick={()=>setFilt(f)}>{f}</button>
        ))}
      </div>

      {manual&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Manual entry</div>
          <div style={g2}>
            <div>
              <label style={lbl}>Pair</label>
              <input style={inp} value={mf.pair} onChange={e=>smf(m=>({...m,pair:e.target.value}))} onBlur={()=>addPairOption(mf.pair)} placeholder="Type any pair, e.g. EUR/USD OTC" list="manual-pair-options"/>
              <datalist id="manual-pair-options">
                {pairOptions.map(p=><option key={p} value={p}/>)}
              </datalist>
            </div>
            <div>
              <label style={lbl}>Direction</label>
              <div style={{display:'flex',gap:8}}>
                {['BUY','SELL'].map(d=><button key={d} style={{...btn(mf.dir===d?(d==='BUY'?'suc':'dan'):'def'),flex:1}} onClick={()=>smf(m=>({...m,dir:d}))}>{d}</button>)}
              </div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Date of trade</label>
            <input style={inp} type="date" value={mf.tradeDate} onChange={e=>smf(m=>({...m,tradeDate: e.target.value}))}/>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Account mode</label>
            <div style={{display:'flex',gap:8}}>
              {ACCOUNT_MODES.map(mode=><button key={mode} style={{...btn(mf.accountMode===mode?'pri':'def'),flex:1}} onClick={()=>smf(m=>({...m,accountMode:mode}))}>{mode==='REAL'?'Real':'Demo'}</button>)}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Zone grade</label>
            <div style={{display:'flex',gap:8}}>
              {['A+','A','B','C','UNGRADED'].map(g=><button key={g} style={{...btn(mf.grade===g?'pri':'def'),flex:1}} onClick={()=>smf(m=>({...m,grade:g}))}>{g}</button>)}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{...inp,minHeight:50,resize:'vertical'}} value={mf.notes} onChange={e=>smf(m=>({...m,notes:e.target.value}))} onPaste={onManualPaste}/>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Outcome</label>
            <div style={{display:'flex',gap:8}}>
              {['PENDING','WIN','LOSS'].map(o=><button key={o} style={{...btn(mf.outcome===o?(o==='WIN'?'suc':o==='LOSS'?'dan':'pri'):'def'),flex:1}} onClick={()=>smf(m=>({...m,outcome:o}))}>{o}</button>)}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Screenshots (optional)</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              {mf.screenshots.map((x,i)=>(
                <div key={i} style={{position:'relative'}}>
                  <img src={x.url} alt="" style={{width:72,height:54,objectFit:'cover',borderRadius:6,border:'0.5px solid var(--border)',cursor:'zoom-in'}} onClick={()=>setPreviewImage(x.url)}/>
                  <button onClick={()=>smf(m=>({...m,screenshots:m.screenshots.filter((_,j)=>j!==i)}))} style={{position:'absolute',top:-5,right:-5,background:'var(--fill-danger)',border:'none',color:'#fff',borderRadius:'50%',width:16,height:16,cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>×</button>
                </div>
              ))}
              <label style={{width:72,height:54,border:'1px dashed var(--border)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)',gap:2}}>
                <span style={{fontSize:20,lineHeight:1}}>+</span>
                <span style={{fontSize:9}}>browse</span>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)addManualImage(f);}}/>
              </label>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>Paste with Ctrl+V or Cmd+V into the notes box, or browse to add screenshots.</div>
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Stake: {f$(stake.actual)} · Risk: {fp(stake.eff)}</div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={{...btn('pri'),flex:1}} onClick={addManual}>Save entry</button>
            <button style={btn()} onClick={()=>setManual(false)}>Cancel</button>
          </div>
        </div>
      )}

      {sorted.length===0&&(
        <div style={{...card,textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>
          <i className="ti ti-book" style={{fontSize:28,marginBottom:8,display:'block'}} aria-hidden="true"/>
          No {filt==='ALL'?'':''+filt.toLowerCase()+' '}trades yet.
        </div>
      )}

      {sorted.map(t=>(
        <div key={t.id} style={{...card,cursor:'pointer'}} role="button" tabIndex={0} onClick={()=>setSelectedTrade(t)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedTrade(t);}}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:t.outcome==='PENDING'?8:0}}>
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              <span style={badge(t.zoneGrade)}>{t.zoneGrade}</span>
              <span style={{fontSize:13,fontWeight:500}}>{t.pair}</span>
              <span style={{fontSize:12,background:t.direction==='BUY'?'var(--bg-success)':'var(--bg-danger)',color:t.direction==='BUY'?'var(--text-success)':'var(--text-danger)',borderRadius:4,padding:'1px 6px'}}>{t.direction}</span>
              <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface-0)',borderRadius:4,padding:'1px 5px'}}>{(t.accountMode||'DEMO')==='REAL'?'Real':'Demo'}</span>
              {!t.isAnalyzed&&<span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface-0)',borderRadius:4,padding:'1px 5px'}}>Manual</span>}
              <ConfirmBadge liveConfirmed={t.liveConfirmed}/>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:13,fontFamily:'var(--font-mono)',color:t.outcome==='WIN'?'var(--text-success)':t.outcome==='LOSS'?'var(--text-danger)':'var(--text-muted)'}}>{t.outcome==='PENDING'?`${f$(t.stake)} pending`:(t.pnl>=0?'+':'')+f$(t.pnl)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(t.timestamp).toLocaleString()}</div>
            </div>
          </div>
          {t.outcome==='PENDING'&&(
            <div style={{display:'flex',gap:8}}>
              <button style={{...btn('suc'),flex:1}} onClick={e=>{e.stopPropagation();setOutcome(t.id,'WIN');}}>Win ✓</button>
              <button style={{...btn('dan'),flex:1}} onClick={e=>{e.stopPropagation();setOutcome(t.id,'LOSS');}}>Loss ✗</button>
            </div>
          )}
          {t.notes&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6,fontStyle:'italic'}}>{t.notes}</div>}
        </div>
      ))}

      {selectedTrade&&(
        <div role="dialog" aria-modal="true" style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1000}} onClick={()=>setSelectedTrade(null)}>
          <div style={{...card,width:'100%',maxWidth:760,maxHeight:'90vh',overflowY:'auto',border:'1px solid var(--border-strong)',boxShadow:'0 18px 50px rgba(0,0,0,0.35)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Trade details</div>
                <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span>{selectedTrade.pair} · {selectedTrade.direction}</span>
                  <ConfirmBadge liveConfirmed={selectedTrade.liveConfirmed}/>
                </div>
              </div>
              <button style={btn()} onClick={()=>setSelectedTrade(null)}>Close</button>
            </div>
            <div style={{display:'grid',gap:12}}>
              <div style={{display:'grid',gap:8}}>
                {editDraft.screenshots?.length>0
                  ?<div style={{display:'grid',gap:8,maxHeight:320,overflowY:'auto',paddingRight:4}}>
                      {editDraft.screenshots.map((src,i)=><div key={i} style={{cursor:'zoom-in'}} onClick={()=>openTradeImage(src.url)}><img src={src.url} alt={`Trade screenshot ${i+1}`} style={{width:'100%',borderRadius:10,border:'1px solid var(--border)',objectFit:'contain',maxHeight:280}}/></div>) }
                    </div>
                  :<div style={{padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:13}}>No screenshots attached to this entry.</div>
                }
              </div>
              <div style={card}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Notes</div>
                <textarea aria-label="Journal notes" value={editDraft.notes} onChange={e=>setEditDraft(d=>({...d,notes:e.target.value}))} onPaste={onTradePaste} style={{...inp,minHeight:96,resize:'vertical'}} placeholder="Add notes and paste screenshots here"/>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Tip: press Ctrl+V or Cmd+V here to add screenshots quickly.</div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button style={{...btn('pri'),flex:1}} onClick={saveTradeEdits}>Save edits</button>
                <button style={btn()} onClick={()=>setSelectedTrade(null)}>Cancel</button>
                <button style={btn('dan')} onClick={()=>{if(window.confirm('Delete this trade entry? This cannot be undone.')){deleteTrade(selectedTrade);setSelectedTrade(null);}}}>Delete</button>
              </div>
              <div style={card}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>{selectedTrade.gateResults?.length?'Gate check':'Zone analysis criteria'}</div>
                {selectedTrade.gateResults?.length
                  ?<Gates gates={selectedTrade.gateResults} passCount={selectedTrade.passCount}/>
                  :selectedTrade.criteria && Object.keys(selectedTrade.criteria).length>0
                    ?<Criteria criteria={selectedTrade.criteria}/>
                    :<div style={{fontSize:13,color:'var(--text-muted)'}}>No detailed criteria attached to this entry.</div>
                }
              </div>
              <div style={card}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Trade metadata</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
                  {tradeMeta.filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([label,value])=><div key={label} style={{fontSize:13,color:'var(--text-secondary)'}}><span style={{fontWeight:600,color:'var(--text-primary)',display:'block',marginBottom:2}}>{label}</span>{value}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage&&(
        <div role="dialog" aria-label="Image preview" style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.92)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1100}} onClick={()=>setPreviewImage(null)}>
          <div style={{position:'relative',maxWidth:'92vw',maxHeight:'92vh',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
            <button type="button" style={{...btn('dan'),position:'absolute',top:8,right:8}} onClick={()=>setPreviewImage(null)}>Close</button>
            <img src={previewImage} alt="Previewed trade screenshot" style={{maxWidth:'100%',maxHeight:'92vh',objectFit:'contain',borderRadius:16,border:'1px solid var(--border)',boxShadow:'0 20px 60px rgba(0,0,0,0.45)'}}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Money Management ──────────────────────────────────────────────────────────
// Always Real-account data (Change 2) — independent of the global Demo/Real toggle.
function Money({settings,trades,wds,saveWds,mode}){
  const bal=balForMode(settings,trades,wds,'REAL');
  const realTrades=trades.filter(t=>getTradeMode(t)==='REAL');
  const[amt,setAmt]=useState('');
  const[note,setNote]=useState('');
  const[wks,setWks]=useState(12);
  const stake=calcStake(bal,settings.riskPercent);
  const done=realTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=done.length?wins/done.length:0.65;
  const totalWd=wds.reduce((s,w)=>s+w.amount,0);
  const firstMs=settings.milestones[0];
  const phase1Thresh=settings.brokerMin/(firstMs.pct/100);
  const isPhase1=bal<phase1Thresh;
  const hitMs=settings.milestones.slice().reverse().find(m=>bal>=settings.startingBalanceReal*m.mul);
  const nextMs=settings.milestones.find(m=>bal<settings.startingBalanceReal*m.mul);
  const nextMilestoneMessage=nextMs?`Next withdrawal milestone: ${nextMs.mul}× → ${f$(settings.startingBalanceReal*nextMs.mul)} (withdraw ${nextMs.pct}%).`:null;

  async function logWd(){
    const a=parseFloat(amt);if(!a||a<settings.brokerMin)return;
    await saveWds([{id:uid(),timestamp:Date.now(),date:tod(),amount:a,balanceBefore:bal,balanceAfter:bal-a,notes:note},...wds]);
    setAmt('');setNote('');
  }

  const proj=[];let b=bal;
  for(let i=0;i<=wks;i++){proj.push(b);const tw=settings.sessionsPerDay*6,ws=tw*wr,ls=tw-ws,stk=calcStake(b,settings.riskPercent).actual;b=b+(ws*stk*PAYOUT)-(ls*stk);}
  const maxP=Math.max(...proj);

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Money management</div>

      {mode!=='REAL'&&<Alert type="inf" title="Milestones apply to your Real account only" body="You're viewing the Demo account elsewhere in the app, but Money Management always reflects Real — Demo has no withdrawals or milestone targets."/>}

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Position sizer</div>
        <div style={g3}>
          <Metric label="Balance" value={f$(bal)}/>
          <Metric label="Risk %" value={fp(settings.riskPercent)}/>
          <Metric label="Trade stake" value={f$(stake.actual)} color="var(--text-accent)"/>
        </div>
        {stake.eff>settings.riskPercent*1.1&&(
          <div style={{fontSize:12,color:'var(--text-warning)',marginTop:8,padding:'6px 10px',background:'var(--bg-warning)',borderRadius:'var(--radius)'}}>
            ⚠ $1 minimum means effective risk is {fp(stake.eff)} — above your target {fp(settings.riskPercent)}. Balance needs {f$(1/(settings.riskPercent/100))} for correct sizing.
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Withdrawal milestones</div>
        {isPhase1
          ?<div style={{padding:'8px 12px',background:'var(--bg-accent)',borderRadius:'var(--radius)',marginBottom:12,fontSize:13,color:'var(--text-accent)'}}>🔒 Phase 1 — Compounding. First withdrawal advised at {f$(phase1Thresh)}.</div>
          :hitMs&&<div style={{padding:'8px 12px',background:'var(--bg-success)',borderRadius:'var(--radius)',marginBottom:12,fontSize:13,color:'var(--text-success)'}}>Milestone {hitMs.mul}× reached — consider withdrawing {hitMs.pct}% (≈{f$(bal*(hitMs.pct/100))}). Advisory only.</div>
        }
        {settings.milestones.map((m,i)=>{
          const target=settings.startingBalanceReal*m.mul;
          const reached=bal>=target;
          return(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,color:reached?'var(--text-success)':'var(--text-primary)'}}>{reached?'✓ ':''}{m.mul}× — {f$(target)}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>Withdraw {m.pct}%</span>
              </div>
              <div style={{background:'var(--surface-0)',borderRadius:4,height:6,overflow:'hidden'}}>
                <div style={{height:'100%',background:reached?'var(--fill-success)':'var(--fill-accent)',width:`${Math.min(100,(bal/target)*100)}%`}}/>
              </div>
            </div>
          );
        })}
        {nextMilestoneMessage && !hitMs && (
          <div style={{padding:'8px 12px',background:'var(--bg-accent)',borderRadius:'var(--radius)',marginTop:10,fontSize:13,color:'var(--text-accent)'}}>{nextMilestoneMessage}</div>
        )}
      </div>

      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:500}}>Growth projector</div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>Weeks:</span>
            <input type="range" min="4" max="52" step="1" value={wks} onChange={e=>setWks(+e.target.value)} style={{width:80}}/>
            <span style={{fontSize:12,fontFamily:'var(--font-mono)',minWidth:20}}>{wks}</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:2,height:72}}>
          {proj.map((v,i)=>(
            <div key={i} title={f$(v)} style={{flex:1,background:i===0?'var(--border-strong)':'var(--fill-accent)',borderRadius:'2px 2px 0 0',height:`${Math.max(4,(v/maxP)*100)}%`,opacity:0.6+(i/proj.length)*0.4}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginTop:4}}>
          <span>Now: {f$(bal)}</span><span>{wks}w: {f$(proj[proj.length-1])}</span>
        </div>
        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Based on {fp(wr*100)} win rate · {fp(settings.riskPercent)} risk · {settings.sessionsPerDay*6} trades/week</div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Log withdrawal</div>
        <div style={g2}>
          <div><label style={lbl}>Amount ($)</label><input style={inp} type="number" min={settings.brokerMin} placeholder={f$(settings.brokerMin)} value={amt} onChange={e=>setAmt(e.target.value)}/></div>
          <div><label style={lbl}>Notes</label><input style={inp} placeholder="Milestone..." value={note} onChange={e=>setNote(e.target.value)}/></div>
        </div>
        {parseFloat(amt)>0&&parseFloat(amt)<settings.brokerMin&&<div style={{fontSize:12,color:'var(--text-danger)',marginTop:6}}>Minimum broker withdrawal: {f$(settings.brokerMin)}</div>}
        {parseFloat(amt)>0&&(bal-parseFloat(amt))<(stake.actual*20)&&parseFloat(amt)>=settings.brokerMin&&<div style={{fontSize:12,color:'var(--text-warning)',marginTop:6}}>⚠ Post-withdrawal balance covers fewer than 20 sessions. Consider waiting.</div>}
        <button style={{...btn('pri'),marginTop:10}} onClick={logWd} disabled={!amt||parseFloat(amt)<settings.brokerMin}>Log withdrawal</button>
      </div>

      {wds.length>0&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Withdrawal history</div>
          {wds.map(w=>(
            <div key={w.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid var(--border)'}}>
              <span style={{fontSize:13,color:'var(--text-secondary)'}}>{new Date(w.timestamp).toLocaleDateString()}{w.notes?` — ${w.notes}`:''}</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--text-danger)'}}>-{f$(w.amount)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,fontSize:13}}>
            <span style={{color:'var(--text-muted)'}}>Total withdrawn</span>
            <span style={{fontFamily:'var(--font-mono)',fontWeight:500}}>{f$(totalWd)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trading Plan ──────────────────────────────────────────────────────────────
function Plan({settings}){
  const sn={1:'Precision (Style 1)',2:'Active (Style 2)',3:'Structured (Style 3)'};
  const sr={
    1:['1 trade per session maximum','Session ends after that trade regardless of outcome',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
    2:['Up to 5 trades per session','Stop: 2 consecutive losses OR net -2 on session','Take profit: 3 wins',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
    3:['Up to 3 trades per session','Stop: 2 losses on session','Advisory: 2 consecutive wins — consider securing','Take profit: 3 wins',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
  };
  const sections=[
    {t:'Zone rules',items:['Pre-validated A+ or B zones only','Zone must pass the 7-gate AI pre-validation','Confirm a live Tier 1 trigger on the 10-second chart before entry','Use zone analyzer before every trade','No C-grade or invalid zones']},
    {t:'Instrument rules',items:['OTC pairs only','Minimum 90%+ ROI payout','Avoid any pair below 90% payout']},
    {t:'Risk rules',items:[`${settings.riskPercent}% risk per trade`,'$1 minimum trade (broker floor)','No Martingale or loss recovery','No mid-session risk increases']},
    {t:'Daily circuit breaker',items:[`${MAX_DL} total losses locks the day until midnight`,'No exceptions — step away and reset']},
    {t:'Behavioral rules',items:['Win the war, not every battle','No chasing losses — accept session stops','No revenge trading','Weekly trade log review']},
  ];
  const ck=['Did I analyze the zone before deciding?','Is the grade A or B?','Is the zone unmitigated (no prior retests)?','Is there a tight 1-4 candle base?','Was the departure impulsive and strong?','Is my stake correctly sized?','Am I within my session trade limit?','Does the direction match the zone type?'];

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Trading plan</div>
      <div style={{...card,background:'var(--bg-accent)',borderColor:'var(--border-accent)'}}>
        <div style={{fontSize:14,fontWeight:500,color:'var(--text-accent)',marginBottom:8}}>Active style — {sn[settings.tradeStyle]}</div>
        {sr[settings.tradeStyle].map((r,i)=>(
          <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'var(--text-secondary)',marginBottom:4}}>
            <i className="ti ti-circle-check" style={{color:'var(--text-accent)',fontSize:14,flexShrink:0,marginTop:2}} aria-hidden="true"/>{r}
          </div>
        ))}
      </div>
      <div style={{...card,background:'var(--bg-warning)'}}>
        <div style={{fontSize:14,fontWeight:500,color:'var(--text-warning)',marginBottom:8}}>Pre-trade checklist</div>
        {ck.map((item,i)=>(
          <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'var(--text-secondary)',marginBottom:5}}>
            <i className="ti ti-square" style={{color:'var(--text-warning)',fontSize:14,flexShrink:0,marginTop:2}} aria-hidden="true"/>{item}
          </div>
        ))}
      </div>
      {sections.map(s=>(
        <div key={s.t} style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>{s.t}</div>
          {s.items.map((item,i)=>(
            <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'var(--text-secondary)',marginBottom:4}}>
              <i className="ti ti-point-filled" style={{color:'var(--text-accent)',fontSize:8,flexShrink:0,marginTop:6}} aria-hidden="true"/>{item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export function Analytics({trades,settings,bal}){
  const done=trades.filter(t=>t.outcome!=='PENDING');
  const total=done.length,wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=total?(wins/total)*100:0;
  const pnl=done.reduce((s,t)=>s+t.pnl,0);
  const ev=total?pnl/total:0;
  const analyzed=done.filter(t=>t.isAnalyzed),manual=done.filter(t=>!t.isAnalyzed);
  const aWr=analyzed.length?(analyzed.filter(t=>t.outcome==='WIN').length/analyzed.length)*100:0;
  const mWr=manual.length?(manual.filter(t=>t.outcome==='WIN').length/manual.length)*100:0;
  const grades=['A+','A','B','C','INVALID','UNGRADED'].map(g=>{const gt=done.filter(t=>t.zoneGrade===g),gw=gt.filter(t=>t.outcome==='WIN').length;return{g,total:gt.length,wins:gw,wr:gt.length?(gw/gt.length)*100:0};}).filter(x=>x.total>0);
  const pairsMap={};done.forEach(t=>{if(!pairsMap[t.pair])pairsMap[t.pair]={wins:0,total:0};pairsMap[t.pair].total++;if(t.outcome==='WIN')pairsMap[t.pair].wins++;});
  const pairs=Object.entries(pairsMap).map(([p,d])=>({p,wr:(d.wins/d.total)*100,...d})).sort((a,b)=>b.total-a.total).slice(0,6);
  const be=(100/(100+PAYOUT*100));
  const pnlTrend=done.slice().sort((a,b)=>a.timestamp-b.timestamp).reduce((acc,t)=>{const prev=acc.at(-1)||0;acc.push(prev+t.pnl);return acc;},[]);
  const gradeBars=grades.map(x=>({label:x.g,value:Math.round(x.wr),color:x.wr>=65?'var(--fill-success)':x.wr>=52.6?'var(--fill-accent)':'var(--fill-danger)'}));
  const pairBars=pairs.map(x=>({label:x.p.length>8?x.p.slice(0,8)+'…':x.p,value:Math.round(x.wr),color:x.wr>=65?'var(--fill-success)':x.wr>=52.6?'var(--fill-accent)':'var(--fill-danger)'})).slice(0,5);
  const modeStats=ACCOUNT_MODES.map(mode=>{
    const modeTrades=done.filter(t=>getTradeMode(t)===mode);
    const modeWins=modeTrades.filter(t=>t.outcome==='WIN').length;
    const modePnl=modeTrades.reduce((s,t)=>s+t.pnl,0);
    const startBalance=getStartingBalanceForMode(settings,mode);
    const growth=startBalance?((startBalance+modePnl-startBalance)/startBalance)*100:0;
    return {mode, trades:modeTrades, wins:modeWins, wr:modeTrades.length?(modeWins/modeTrades.length)*100:0, pnl:modePnl, growth};
  });

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Analytics</div>
      <div style={g2}>
        <Metric label="Total trades" value={total} sub={`${wins}W / ${total-wins}L`}/>
        <Metric label="Win rate" value={fp(wr)} sub={`Break-even: ${fp(be*100)}`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':'var(--text-danger)'}/>
        <Metric label="Expected value/trade" value={(ev>=0?'+':'')+f$(ev)} color={ev>=0?'var(--text-success)':'var(--text-danger)'}/>
        <Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Performance by account mode</div>
        <div style={g2}>
          {modeStats.map(stat=>(
            <div key={stat.mode} style={{...card,marginBottom:0}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6,color:'var(--text-primary)'}}>{stat.mode==='REAL'?'Real':'Demo'}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:10}}>{stat.trades.length} completed trades</div>
              <div style={{display:'grid',gap:6}}>
                <div style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-mono)',color:stat.wr>=65?'var(--text-success)':stat.wr>=52.6?'var(--text-accent)':'var(--text-danger)'}}>{fp(stat.wr)}</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>{stat.wins}W / {stat.trades.length-stat.wins}L</div>
                <div style={{fontSize:12,color:stat.pnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(stat.pnl>=0?'+':'')+f$(stat.pnl)} P&L</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>{stat.growth>=0?'+':''}{fp(stat.growth)} growth</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Performance trend</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>Cumulative P&L across completed trades</div>
        <SparklineChart values={pnlTrend} color={pnl>=0?'var(--fill-success)':'var(--fill-danger)'} />
        <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6}}>Latest balance impact: <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:pnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(pnl>=0?'+':'')+f$(pnl)}</span></div>
      </div>

      {(analyzed.length>0||manual.length>0)&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Zone analysis impact</div>
          <div style={g2}>
            <div><div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>With analysis ({analyzed.length})</div><div style={{fontSize:20,fontWeight:500,fontFamily:'var(--font-mono)',color:'var(--text-success)'}}>{fp(aWr)}</div></div>
            <div><div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Manual ({manual.length})</div><div style={{fontSize:20,fontWeight:500,fontFamily:'var(--font-mono)',color:mWr>=aWr?'var(--text-success)':'var(--text-danger)'}}>{fp(mWr)}</div></div>
          </div>
          {analyzed.length>0&&manual.length>0&&(
            <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:8,padding:'6px 10px',background:'var(--bg-accent)',borderRadius:'var(--radius)'}}>
              Zone analysis {aWr>mWr?`improves your win rate by ${fp(aWr-mWr)}`:'shows similar performance to unanalyzed trades'}.
            </div>
          )}
        </div>
      )}

      {grades.length>0&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Win rate by zone grade</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:6}}>Visual performance snapshot</div>
          <BarChart items={gradeBars} color="var(--fill-accent)"/>
          {grades.map(x=>(
            <div key={x.g} style={{marginTop:10,paddingTop:8,borderTop:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={badge(x.g)}>Grade {x.g}</span><span style={{fontSize:12,color:'var(--text-muted)'}}>{x.total} trades</span></div>
                <span style={{fontSize:13,fontFamily:'var(--font-mono)',color:x.wr>=65?'var(--text-success)':'var(--text-accent)'}}>{fp(x.wr)}</span>
              </div>
              <div style={{background:'var(--surface-0)',borderRadius:4,height:6,overflow:'hidden'}}>
                <div style={{height:'100%',background:x.wr>=65?'var(--fill-success)':'var(--fill-accent)',width:`${Math.min(100,x.wr)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {pairs.length>0&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Performance by pair</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:6}}>Top pairs by win-rate</div>
          <BarChart items={pairBars} color="var(--fill-accent)"/>
          {pairs.map(p=>(
            <div key={p.p} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid var(--border)'}}>
              <span style={{fontSize:13}}>{p.p}</span>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{p.total} trades</span>
                <span style={{fontSize:13,fontFamily:'var(--font-mono)',color:p.wr>=65?'var(--text-success)':p.wr>=52.6?'var(--text-accent)':'var(--text-danger)'}}>{fp(p.wr)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {total===0&&<div style={{...card,textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}><i className="ti ti-chart-bar" style={{fontSize:28,display:'block',marginBottom:8}} aria-hidden="true"/>No completed trades yet.</div>}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Cfg({settings,saveSettings,ss,resetAccount}){
  const[f,sf]=useState({...settings,tradeStyleDemo:settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1,tradeStyleReal:settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1,startingBalanceDemo:settings?.startingBalanceDemo ?? 0,startingBalanceReal:settings?.startingBalanceReal ?? 0});
  const[saved,setSaved]=useState(false);
  const[sessionWarn,setSessionWarn]=useState(false);
  const[includeBalances,setIncludeBalances]=useState(false);
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const activeSession=ss?getActive(ss):null;

  async function save(){await saveSettings({...f,startingBalanceDemo:parseFloat(f.startingBalanceDemo||0),startingBalanceReal:parseFloat(f.startingBalanceReal||0)});setSaved(true);setTimeout(()=>setSaved(false),2000);}

  async function applyStyle(id,mode){
    if(activeSession)setSessionWarn(true);
    const updated=mode==='REAL'?{...f,tradeStyleReal:id}:{...f,tradeStyleDemo:id};
    sf(updated);
    await saveSettings({...updated,startingBalanceDemo:parseFloat(updated.startingBalanceDemo||0),startingBalanceReal:parseFloat(updated.startingBalanceReal||0)});
  }

  async function applySessions(n){
    if(activeSession)setSessionWarn(true);
    const updated={...f,sessionsPerDay:n};
    sf(updated);
    await saveSettings({...updated,startingBalanceDemo:parseFloat(updated.startingBalanceDemo||0),startingBalanceReal:parseFloat(updated.startingBalanceReal||0)});
  }

  const STYLES=[
    {id:1,name:'Precision',desc:'1 trade per session. Session ends after that trade regardless of outcome. Maximum discipline.'},
    {id:2,name:'Active',desc:'Up to 5 trades per session. Stop at 2 consecutive losses or net −2. Take profit at 3 wins.'},
    {id:3,name:'Structured',desc:'Up to 3 trades per session. Stop at 2 losses. Advisory at 2 consecutive wins. Take profit at 3 wins.'},
  ];

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Settings</div>

      {sessionWarn&&(
        <Alert type="warn" title="Active session in progress" body="This change will apply starting from your next session. Your current session continues under its original rules."/>
      )}

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>AI provider</div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {[{id:'gemini',label:'Gemini'},{id:'groq',label:'Groq'}].map(p=>(
            <button key={p.id} style={{...btn((f.aiProvider||'gemini')===p.id?'pri':'def'),flex:1}} onClick={()=>set('aiProvider',p.id)}>{p.label}</button>
          ))}
        </div>
        {(f.aiProvider||'gemini')==='gemini'?(
          <div>
            <label style={lbl}>Gemini API key</label>
            <input style={inp} type="password" placeholder="AIzaSy..." value={f.apiKey||''} onChange={e=>set('apiKey',e.target.value)}/>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Free key at <a href="https://aistudio.google.com/app/apikey" style={{color:'var(--text-accent)'}}>aistudio.google.com</a></div>
          </div>
        ):(
          <div>
            <label style={lbl}>Groq API key</label>
            <input style={inp} type="password" placeholder="gsk_..." value={f.groqApiKey||''} onChange={e=>set('groqApiKey',e.target.value)}/>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Free key at <a href="https://console.groq.com/keys" style={{color:'var(--text-accent)'}}>console.groq.com</a> · Model: llama-4-scout-17b</div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Account</div>
        <div style={g2}>
          <div><label style={lbl}>Demo starting balance ($)</label><input style={inp} type="number" min="1" value={f.startingBalanceDemo} onChange={e=>set('startingBalanceDemo',e.target.value)}/></div>
          <div><label style={lbl}>Real starting balance ($)</label><input style={inp} type="number" min="1" value={f.startingBalanceReal} onChange={e=>set('startingBalanceReal',e.target.value)}/></div>
        </div>
        <div><label style={lbl}>Broker min withdrawal ($)</label><input style={inp} type="number" min="1" value={f.brokerMin} onChange={e=>set('brokerMin',parseFloat(e.target.value))}/></div>
        <div style={{marginTop:10}}><label style={lbl}>Risk per trade: {f.riskPercent}%</label><input type="range" min="1" max="20" step="0.5" value={f.riskPercent} onChange={e=>set('riskPercent',parseFloat(e.target.value))} style={{width:'100%'}}/></div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Trade management style</div>
        <div style={g2}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Demo account</div>
            {STYLES.map(st=>(
              <div key={`demo-${st.id}`} onClick={()=>applyStyle(st.id,'DEMO')} style={{...card,cursor:'pointer',marginBottom:8,border:f.tradeStyleDemo===st.id?'1.5px solid var(--border-accent)':'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)'}}>{st.name}</div>
                  {f.tradeStyleDemo===st.id&&<i className="ti ti-circle-check" style={{color:'var(--text-accent)',fontSize:16}} aria-hidden="true"/>}
                </div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>{st.desc}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Real account</div>
            {STYLES.map(st=>(
              <div key={`real-${st.id}`} onClick={()=>applyStyle(st.id,'REAL')} style={{...card,cursor:'pointer',marginBottom:8,border:f.tradeStyleReal===st.id?'1.5px solid var(--border-accent)':'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)'}}>{st.name}</div>
                  {f.tradeStyleReal===st.id&&<i className="ti ti-circle-check" style={{color:'var(--text-accent)',fontSize:16}} aria-hidden="true"/>}
                </div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:14}}>
          <label style={lbl}>Sessions per day</label>
          <div style={{display:'flex',gap:8}}>
            {[1,2,3].map(n=>(
              <button key={n} style={{...btn(f.sessionsPerDay===n?'pri':'def'),flex:1}} onClick={()=>applySessions(n)}>{n} session{n>1?'s':''}</button>
            ))}
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>6-hour gap enforced between all sessions.</p>
        </div>
      </div>

      <div style={{...card,background:'var(--bg-danger)',borderColor:'var(--border-danger)',marginTop:16}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10,color:'var(--text-danger)'}}>Reset account data</div>
        <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
          Choose a scope below, then decide whether you also want to reset starting balances. Real reset with balances also clears withdrawal history.
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
          <button style={{...btn('dan'),flex:1}} onClick={()=>resetAccount('DEMO',includeBalances)}>Reset Demo{includeBalances?' + balances':''}</button>
          <button style={{...btn('dan'),flex:1}} onClick={()=>resetAccount('REAL',includeBalances)}>Reset Real{includeBalances?' + balances':''}</button>
          <button style={{...btn('dan'),flex:1}} onClick={()=>resetAccount('BOTH',includeBalances)}>Reset All{includeBalances?' + balances':''}</button>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
          <input type="checkbox" checked={includeBalances} onChange={e=>setIncludeBalances(e.target.checked)} />
          Also reset starting balances and clear Real withdrawal history
        </label>
      </div>

      <button style={{...btn('pri'),width:'100%'}} onClick={save}>{saved?'✓ Saved':'Save settings'}</button>
    </div>
  );
}

// ── Loading — skeleton mirrors the dashboard layout it resolves into ─────────
function Loading(){
  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 24px'}}>
      <div className="skeleton" style={{width:140,height:22,marginBottom:20}}/>
      <div className="grid grid-cols-12 gap-3">
        <div className="skeleton col-span-12 lg:col-span-8" style={{height:180,borderRadius:'var(--radius)'}}/>
        <div className="skeleton col-span-12 lg:col-span-4" style={{height:180,borderRadius:'var(--radius)'}}/>
        {[0,1,2,3].map(i=><div key={i} className="skeleton col-span-6 lg:col-span-3" style={{height:88,borderRadius:'var(--radius)'}}/>)}
        <div className="skeleton col-span-12" style={{height:200,borderRadius:'var(--radius)'}}/>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login(){
  const[mode,setMode]=useState('signin');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[err,setErr]=useState(null);
  const[msg,setMsg]=useState(null);
  const[busy,setBusy]=useState(false);

  async function submit(e){
    e.preventDefault();
    setBusy(true);setErr(null);setMsg(null);
    if(mode==='reset'){
      const{error}=await supabase.auth.resetPasswordForEmail(email);
      setBusy(false);
      if(error)setErr(error.message);else setMsg('Password reset email sent — check your inbox.');
      return;
    }
    const{data,error}=mode==='signin'
      ?await supabase.auth.signInWithPassword({email,password})
      :await supabase.auth.signUp({email,password});
    setBusy(false);
    if(error){setErr(error.message);return;}
    if(mode==='signup'&&!data.session)setMsg('Account created — check your email to confirm before logging in.');
  }

  function switchMode(m){setMode(m);setErr(null);setMsg(null);}

  const subhead=mode==='signin'?'Log in to your account':mode==='signup'?'Create an account':'Reset your password';
  const ctaLabel=busy?'Please wait...':mode==='signin'?'Log in':mode==='signup'?'Sign up':'Send reset email';

  return(
    <div className="login-wrap">
      <div className="login-orb login-orb-1"/>
      <div className="login-orb login-orb-2"/>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-wrap">
            <Target size={28} strokeWidth={2} color="#fff"/>
          </div>
          <div className="login-title">TheGiftedMan Trading Tool</div>
          <div className="login-subtitle">{subhead}</div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="login-form" key={mode}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input className="login-input" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          {mode!=='reset'&&(
            <div className="login-field">
              <label className="login-label">Password</label>
              <input className="login-input" type="password" required minLength={6} placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)}/>
            </div>
          )}

          {err&&<div className="login-error">{err}</div>}
          {msg&&<div className="login-success">{msg}</div>}

          <button className="login-btn" type="submit" disabled={busy}>{ctaLabel}</button>
        </form>

        {/* Links */}
        <div className="login-links">
          {mode!=='signup'&&<button type="button" className="login-link login-link-accent" onClick={()=>switchMode('signup')}>Don't have an account? Sign up</button>}
          {mode!=='signin'&&<button type="button" className="login-link login-link-accent" onClick={()=>switchMode('signin')}>Already have an account? Log in</button>}
          {mode!=='reset'&&<button type="button" className="login-link login-link-muted" onClick={()=>switchMode('reset')}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App(){
  const[authUser,setAuthUser]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[loading,setLoading]=useState(true);
  const[settings,setSettings]=useState(null);
  const[trades,setTrades]=useState([]);
  const[analyses,setAnalyses]=useState([]);
  const[wds,setWds]=useState([]);
  const[ss,setSS]=useState(null);
  const[view,setView]=useState('dashboard');
  const[pa,setPA]=useState(null);
  const[theme,setTheme]=useState(()=>localStorage.getItem('gm_theme')||'dark');

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setAuthUser(session?.user||null);setAuthLoading(false);}).catch(()=>setAuthLoading(false));
    const{data:sub}=supabase.auth.onAuthStateChange((_e,session)=>setAuthUser(session?.user||null));
    return()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!authUser){setSettings(null);setTrades([]);setAnalyses([]);setWds([]);setSS(null);setLoading(false);return;}
    setLoading(true);
    (async()=>{
      await maybeMigrateLocal(authUser.id);
      const[{data:s},{data:t},{data:sessRows},{data:w},{data:a}]=await Promise.all([
        supabase.from('settings').select('*').eq('user_id',authUser.id).maybeSingle(),
        supabase.from('trades').select('*').eq('user_id',authUser.id).order('timestamp',{ascending:false}),
        supabase.from('sessions').select('*').eq('user_id',authUser.id).eq('date',tod()),
        supabase.from('withdrawals').select('*').eq('user_id',authUser.id).order('timestamp',{ascending:false}),
        supabase.from('zone_analyses').select('*').eq('user_id',authUser.id).order('timestamp',{ascending:false}),
      ]);
      const sObj=s?fromSettingsRow(s):null;
      const normalized=sObj&&{
        ...sObj,
        tradeStyleDemo:sObj.tradeStyleDemo ?? sObj.tradeStyle ?? 1,
        tradeStyleReal:sObj.tradeStyleReal ?? sObj.tradeStyle ?? 1,
        startingBalanceDemo:parseFloat(sObj.startingBalanceDemo||0),
        startingBalanceReal:parseFloat(sObj.startingBalanceReal||0),
      };
      setSettings(normalized||null);
      const tradesObj=(t||[]).map(fromTradeRow);
      const analysesObj=(a||[]).map(fromAnalysisRow);
      setTrades(await Promise.all(tradesObj.map(async tr=>({...tr,screenshots:await Promise.all((tr.screenshots||[]).map(signShot))}))));
      setAnalyses(await Promise.all(analysesObj.map(async an=>({...an,screenshot:await signShot(an.screenshot)}))));
      setWds((w||[]).map(fromWdRow));
      setSS(normalized?dayFromSessionRows(sessRows||[]):null);
      setLoading(false);
    })();
  },[authUser]);

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gm_theme', theme); // device preference, not account data
  },[theme]);

  const saveSettings=async v=>{
    const normalized={
      ...v,
      tradeStyleDemo:v.tradeStyleDemo ?? v.tradeStyle ?? 1,
      tradeStyleReal:v.tradeStyleReal ?? v.tradeStyle ?? 1,
      startingBalanceDemo:parseFloat(v.startingBalanceDemo||0),
      startingBalanceReal:parseFloat(v.startingBalanceReal||0),
    };
    setSettings(normalized);
    if(authUser)await supabase.from('settings').upsert(toSettingsRow(authUser.id,normalized));
  };
  const saveTrades=async v=>{
    const next=typeof v==='function'?v(trades):v;
    if(!authUser){setTrades(next);return;}
    const uploaded=await Promise.all(next.map(async t=>{
      if(!t.screenshots?.some(s=>typeof s==='string'&&!s.startsWith('http')))return t;
      return{...t,screenshots:await Promise.all(t.screenshots.map(s=>uploadShot(authUser.id,s)))};
    }));
    setTrades(uploaded);
    await supabase.from('trades').upsert(uploaded.map(t=>toTradeRow(authUser.id,t)));
  };
  const saveAnalyses=async v=>{
    if(!authUser){setAnalyses(v);return;}
    const uploaded=await Promise.all(v.map(async a=>{
      if(!a.screenshot||a.screenshot.startsWith('http'))return a;
      return{...a,screenshot:await uploadShot(authUser.id,a.screenshot,a.screenshotMime)};
    }));
    setAnalyses(uploaded);
    await supabase.from('zone_analyses').upsert(uploaded.map(a=>toAnalysisRow(authUser.id,a)));
  };
  const saveWds=async v=>{setWds(v);if(authUser)await supabase.from('withdrawals').upsert(v.map(w=>toWdRow(authUser.id,w)));};
  const saveSS=async v=>{setSS(v);if(authUser)await supabase.from('sessions').upsert(v.sessions.map(s=>toSessionRow(authUser.id,v.date,s)));};

  // Deletes a trade for real (saveTrades only ever upserts — nothing before this
  // ever removed a row) and reverses its simple counters on the owning session.
  // conLoss/conWin/netLoss/isLocked are streak-derived and can't be safely
  // un-wound without replaying the session's trades in order — left as-is.
  const deleteTrade=async t=>{
    setTrades(prev=>prev.filter(x=>x.id!==t.id));
    if(authUser)await supabase.from('trades').delete().eq('id',t.id);
    const sess=ss?.sessions.find(s=>s.num===t.sessionNum && s.accountMode===getTradeMode(t));
    if(sess){
      const us={...sess,trades:Math.max(0,sess.trades-1),
        wins:Math.max(0,sess.wins-(t.outcome==='WIN'?1:0)),
        losses:Math.max(0,sess.losses-(t.outcome==='LOSS'?1:0)),
        sPnl:sess.sPnl-t.pnl};
      const nextSessions=ss.sessions.map(s=>s.id===sess.id?us:s);
      await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
    }
  };

  // Bulk reset for a Demo/Real/both scope. "Trades only" clears trades + this
  // account's session history; "everything" also zeroes the starting balance
  // and (Real only) withdrawals, since old withdrawals would otherwise be
  // subtracted from a balance that no longer has the trades that earned it.
  const resetAccount=async(scope,includeBalances)=>{
    if(!authUser)return;
    const modes=scope==='BOTH'?['DEMO','REAL']:[scope];
    const label=scope==='BOTH'?'Demo and Real':(scope==='REAL'?'Real':'Demo');
    const extra=includeBalances?', and reset the starting balance to $0'+(modes.includes('REAL')?' (withdrawal history for Real will also be cleared)':''):'';
    if(!window.confirm(`This permanently deletes all ${label} trades and session history${extra}. This cannot be undone. Continue?`))return;

    const idsToDelete=trades.filter(t=>modes.includes(getTradeMode(t))).map(t=>t.id);
    setTrades(prev=>prev.filter(t=>!modes.includes(getTradeMode(t))));
    if(idsToDelete.length)await supabase.from('trades').delete().in('id',idsToDelete);

    await supabase.from('sessions').delete().eq('user_id',authUser.id).in('account_mode',modes);
    const keptSessions=(ss?.sessions||[]).filter(s=>!modes.includes(s.accountMode));
    setSS(prev=>prev?{...prev,sessions:keptSessions,perMode:perModeFromSessions(keptSessions)}:prev);

    if(includeBalances){
      const patch={};
      if(modes.includes('DEMO'))patch.startingBalanceDemo=0;
      if(modes.includes('REAL'))patch.startingBalanceReal=0;
      await saveSettings({...settings,...patch});
      if(modes.includes('REAL')){
        setWds([]);
        await supabase.from('withdrawals').delete().eq('user_id',authUser.id);
      }
    }
    alert(`${label} account reset.`);
  };

  // Global Demo/Real toggle — persisted in Supabase settings so it syncs across devices.
  const mode=settings?.activeMode==='REAL'?'REAL':'DEMO';
  const setMode=m=>saveSettings({...settings,activeMode:m});

  const bal=settings?balForMode(settings,trades,wds,mode):0;
  const todaySS=settings?getToday(ss):null;
  const pending=trades.filter(t=>t.outcome==='PENDING'&&getTradeMode(t)===mode).length;

  if(authLoading)return<Loading/>;
  if(!isSupabaseConfigured)return(
    <div style={{maxWidth:440,margin:'4rem auto',padding:'1rem',textAlign:'center'}}>
      <div style={{fontSize:18,fontWeight:500,color:'var(--text-danger)',marginBottom:8}}>Supabase not configured</div>
      <div style={{fontSize:13,color:'var(--text-secondary)'}}>
        Set <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> environment variables, then rebuild and redeploy.
      </div>
    </div>
  );
  if(!authUser)return<Login/>;
  if(loading)return<Loading/>;
  if(!settings?.setupComplete)return<Setup onDone={saveSettings}/>;

  const nav=[
    {id:'dashboard',icon:LayoutDashboard,label:'Dashboard'},
    {id:'analyzer',icon:ScanSearch,label:'Zone analyzer'},
    {id:'journal',icon:BookOpen,label:'Journal',badge:pending},
    {id:'money',icon:Wallet,label:'Money mgmt'},
    {id:'plan',icon:ClipboardList,label:'Trading plan'},
    {id:'analytics',icon:BarChart3,label:'Analytics'},
    {id:'settings',icon:Settings,label:'Settings'},
  ];

  return(
    <div className="flex h-screen flex-col overflow-hidden bg-base text-ink" data-theme={theme} style={{background:'radial-gradient(600px 300px at 20% -5%, rgba(98,112,243,0.07), transparent 70%), var(--bg)'}}>
      <div className="mx-auto flex w-full flex-1 overflow-hidden">

        <aside className="hidden w-60 flex-shrink-0 flex-col border-r p-3 lg:flex" style={{borderColor:'var(--border)',background:'var(--surface-0)'}}>
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm text-white" style={{background:'var(--fill-accent)',boxShadow:'0 4px 12px -4px rgba(98,112,243,0.5)'}}>
              <Sparkles size={15}/>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight text-ink">TheGiftedMan</div>
              <div className="text-[11px] text-ink-3">Trading system</div>
            </div>
          </div>

          {/* Nav — active: left accent bar + tinted bg + accent icon; inactive recedes */}
          <nav className="space-y-0.5">
            {nav.map(item=>{
              const Icon=item.icon;
              const on=view===item.id;
              return(
                <button key={item.id} onClick={()=>setView(item.id)} className={`relative flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-[13px] transition-colors ${on?'font-semibold text-ink':'font-normal text-ink-3 hover:text-ink-2'}`} style={on?{background:'var(--bg-accent)'}:undefined}>
                  {on&&<span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{background:'var(--fill-accent)'}}/>}
                  <Icon size={16} style={{color:on?'var(--text-accent)':'currentColor',flexShrink:0}}/>
                  <span className="flex-1">{item.label}</span>
                  {item.badge>0&&<span className="rounded-full px-1.5 py-px text-[10px] font-bold" style={{background:'var(--bg-danger)',color:'var(--text-danger)',border:'1px solid var(--border-danger)'}}>{item.badge}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer — mode toggle, balance + session, controls */}
          <div className="mt-auto space-y-2">
            {/* Demo/Real toggle — Real is made visually loud on purpose: this switches real money. */}
            <div className="flex rounded-sm p-1" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
              {ACCOUNT_MODES.map(m=>{
                const on=mode===m;
                const isReal=m==='REAL';
                return(
                  <button key={m} onClick={()=>setMode(m)} aria-pressed={on}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5 text-xs font-bold tracking-wide transition-colors"
                    style={on?{background:isReal?'var(--fill-danger)':'var(--fill-accent)',color:'#fff'}:{color:'var(--text-muted)'}}>
                    {isReal&&on&&<span className="pulse-dot" style={{background:'#fff'}}/>}
                    {isReal?'REAL':'DEMO'}
                    {isReal&&on&&<span style={{fontSize:9,opacity:0.85}}>LIVE</span>}
                  </button>
                );
              })}
            </div>
            <div className="rounded p-3" style={{background:'var(--surface-1)',border:'1px solid var(--border)',boxShadow:'var(--highlight-top)'}}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">{mode==='REAL'?'Real balance':'Demo balance'}</div>
              <div className="mt-1 text-lg font-bold tracking-tight text-ink"><AnimatedNumber value={bal} format={v=>f$(v)}/></div>
              {todaySS&&(
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
                  {todaySS.perMode?.[mode]?.isDailyLocked
                    ?<><Lock size={12} style={{color:'var(--text-danger)'}}/><span style={{color:'var(--text-danger)'}}>Day locked</span></>
                    :<>Session {todaySS.sessions.filter(s=>s.accountMode===mode).length}/{settings.sessionsPerDay}</>}
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <div className="flex flex-1 items-center justify-center gap-2 rounded-sm py-2" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
                {THEMES.map(t=>(
                  <button key={t.id} onClick={()=>setTheme(t.id)} title={t.label} aria-label={`${t.label} theme`} aria-pressed={theme===t.id}
                    className="rounded-full p-0 transition-transform hover:scale-110"
                    style={{width:16,height:16,background:t.bg,border:theme===t.id?`2px solid ${t.accent}`:'1px solid var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:t.accent}}/>
                  </button>
                ))}
              </div>
              <button onClick={()=>supabase.auth.signOut()} aria-label="Log out" className="flex flex-1 items-center justify-center rounded-sm py-2 text-ink-3 transition-colors hover:text-loss" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
                <LogOut size={15}/>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between rounded px-4 py-3 lg:hidden" style={{background:'var(--surface-1)',border:'1px solid var(--border)'}}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm text-white" style={{background:'var(--fill-accent)'}}><Sparkles size={13}/></div>
              <div className="text-[13px] font-semibold text-ink">TheGiftedMan</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setTheme(THEMES[(THEMES.findIndex(t=>t.id===theme)+1)%THEMES.length].id)} aria-label="Next theme" className="rounded-sm p-2 text-ink-3" style={{border:'1px solid var(--border)'}}>
                <Palette size={15}/>
              </button>
              <button onClick={()=>supabase.auth.signOut()} aria-label="Log out" className="rounded-sm p-2 text-ink-3" style={{border:'1px solid var(--border)'}}>
                <LogOut size={15}/>
              </button>
            </div>
          </div>

          <div key={view} className="mx-auto max-w-5xl animate-[fadeIn_200ms_ease-out]">
            {view==='dashboard'&&<Dashboard settings={settings} trades={trades} wds={wds} ss={todaySS} bal={bal} mode={mode} nav={setView}/>}
            {view==='analyzer'&&<Analyzer settings={settings} ss={todaySS} mode={mode} saveAnalyses={saveAnalyses} analyses={analyses} nav={setView} setPA={setPA}/>}
            {view==='journal'&&<Journal settings={settings} trades={trades} saveTrades={saveTrades} deleteTrade={deleteTrade} ss={todaySS} saveSS={saveSS} pa={pa} setPA={setPA} wds={wds} mode={mode}/>}
            {view==='money'&&<Money settings={settings} trades={trades} wds={wds} saveWds={saveWds} mode={mode}/>}
            {view==='plan'&&<Plan settings={settings}/>}
            {view==='analytics'&&<Analytics trades={trades} settings={settings} bal={bal}/>}
            {view==='settings'&&<Cfg settings={settings} saveSettings={saveSettings} ss={todaySS} resetAccount={resetAccount}/>}
          </div>
        </main>
      </div>
    </div>
  );
}
