import { useState, useEffect, useRef, useCallback } from "react";
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
  Eye,
  EyeOff,
  GripHorizontal,
  Info,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Palette,
  Pause,
  Play,
  ScanSearch,
  Settings,
  SkipForward,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";

const OLD_SK = { S:'gm_s_v1', T:'gm_t_v1', A:'gm_a_v1', W:'gm_w_v1', SS:'gm_ss_v1' };
const GAP = 6 * 3600 * 1000;
const NO_TRADE_GAP_DEFAULT = 90; // minutes for no-trade session cooldown
const MAX_NO_TRADE_STREAK = 3;   // consecutive no-trade sessions before full gap applies
const PAYOUT = 0.92;
const MAX_DL = 4;
const ACCOUNT_MODES = ['DEMO','REAL'];
// Session timer — duration is a property of the trade style itself (like its
// win/loss rules), not of the account mode, so it's stored once globally and
// keyed by style id, same as sn/sr in Plan and STYLES in Cfg.
const DEF_DURATIONS = {1:15,2:45,3:30}; // {Precision, Active, Structured} minutes
const DURATION_BOUNDS = {1:[10,20],2:[30,60],3:[20,40]};
const PAUSE_AUTO_RESUME_MS = 5*60*1000;

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

HOW TO DETERMINE ZONE DIRECTION — do this first, before any gate evaluation:
1. Do NOT use the color of any drawn rectangle/box annotation as your signal for zone type. Drawn zone boxes may appear in a consistent color (e.g. green) regardless of whether the zone is Supply or Demand — box color is a user annotation choice, not a signal of direction.
2. Instead, trace the actual candle price action in this exact order:
   a. Identify the base — the tight cluster of 1-2 (or more) consolidation candles.
   b. Look at price action immediately BEFORE the base: did price move UP into the base (this was a rally), or DOWN into the base (this was a drop)?
   c. Look at price action immediately AFTER the base (the departure): did price move UP away from the base (rally/departure upward), or DOWN away from the base (drop/departure downward)?
3. Classify using ONLY the before/after price movement, never the box color:
   - Rally INTO base, then DROP away = Supply (RBD) = SELL
   - DROP INTO base, then DROP away = Supply (DBD) = SELL
   - DROP INTO base, then RALLY away = Demand (DBR) = BUY
   - Rally INTO base, then RALLY away = Demand (RBR) = BUY
4. The single most reliable signal is the DEPARTURE direction — which way did price move AWAY from the base after it formed? If price moved down away from the base, this is a Supply zone (expect further selling pressure on return). If price moved up away from the base, this is a Demand zone (expect further buying pressure on return).
5. Before finalizing zoneType and direction in your response, explicitly state in your reasoning which way the departure candle(s) moved (up or down) as your primary evidence — this must match your final zoneType and direction fields exactly.

THE 10 GATES — binary pass/fail, evaluated independently from this 1-minute chart image only. This is a strict filter, not a grader on a curve. When in doubt on any gate, FAIL it. Each justification must cite what you actually observe in the image. You are NOT evaluating live 10-second confirmation — that candle resolution is not visible in this image and is judged separately by the trader in real time.

Four gates are HARD FILTERS (2, 3, 4, 5). If any hard filter fails, the zone is automatically INVALID regardless of the other six gates.

GATE 1 — Base Structure: PASS only if the base is exactly 1-2 candles. 3+ consolidation candles, or heavy overlap with no directional intent = FAIL.
GATE 2 — Departure Strength [HARD FILTER]: PASS only if the departure candle's body is >=70% of its total range, its total range is >=1.5x the average range of the 5 candles preceding the base, AND it closes near its extreme (upper close for Demand, lower close for Supply). Doji, spinning top, average/below-average departure, or weak overlapping candles = FAIL.
GATE 3 — Break of Structure [HARD FILTER]: PASS only if the departure breaks a significant swing high (Demand) or swing low (Supply). No meaningful structure broken, or only minor internal structure exceeded = FAIL.
GATE 4 — Freshness [HARD FILTER]: PASS only if this is the first return to the zone since formation, with no previous touch of the proximal line. Any previous retest or touch = FAIL.
GATE 5 — Trend Alignment [HARD FILTER]: PASS only if Demand aligns with Higher Highs + Higher Lows, or Supply aligns with Lower Highs + Lower Lows, in a clearly trending market. Counter-trend setups, or a ranging/choppy market = FAIL.
GATE 6 — Zone Location: PASS only if the zone forms near a major swing high/low, or immediately after a liquidity sweep — not mid-range. Mid-range zones or zones inside prolonged consolidation = FAIL.
GATE 7 — Distance Ratio: PASS only if price travels at least 3x the zone width before returning. Returning too quickly, or insufficient expansion away from the zone = FAIL.
GATE 8 — Compact Zone: PASS only if the zone width is <=30% of the departure move and the base remains compact. An excessively wide zone, or a base occupying a large portion of the departure = FAIL.
GATE 9 — Return Quality: PASS only if the return is corrective — momentum gradually weakens into the zone, with small/overlapping candles on the return. Consecutive impulsive candles into the zone, or strong momentum directly attacking the zone = FAIL.
GATE 10 — No Conflicting Structure: PASS only if no opposing Supply/Demand zone sits within the expected price path. A significant opposing zone likely to stop/reverse price before the expected move = FAIL.

When uncertain whether any gate meets its strict threshold, default to FAIL, not PASS. These gates exist specifically to reject borderline setups.

CLASSIFICATION LOGIC — apply in this exact order:
1. Check the four hard filters (Gates 2, 3, 4, 5). If ANY fail, the zone is INVALID immediately — do not proceed to score-based classification, no matter how many of the other six gates passed.
2. If all four hard filters pass, calculate the total score out of 10 (count every PASS, including the hard filters).
3. Classify by score:
   10/10       → "A+"
   9/10        → "A"
   7-8/10      → "B"
   5-6/10      → "C"
   Below 5/10  → "INVALID"

SELF-CHECK — before returning your final answer, review your own gate results. If you marked 8 or more gates as PASS, re-examine Gates 1, 2, and 5 specifically, as these are the most commonly over-graded criteria. Confirm your reasoning for each PASS is based on clear visual evidence, not assumption.

Also read the trading pair from the chart header if visible. If the pair is not clearly legible, set detectedPair to "UNKNOWN" — never guess.

Respond ONLY with JSON (no markdown, no backticks). gateResults must contain exactly 10 entries in gate order, each with gate, label, isHardFilter, pass, justification. hardFilterFailed, hardFilterFailures, score, and grade must all be consistent with the gate results and the classification logic above. departureDirection must be "UP" or "DOWN" based on your own visual reading of which way price moved away from the base (step 4 above), and must agree with zoneType/direction:
{"detectedPair":"USD/JPY OTC","zoneType":"Supply (RBD)","direction":"SELL","departureDirection":"DOWN","gateResults":[{"gate":1,"label":"Base Structure","isHardFilter":false,"pass":true,"justification":"Tight 2-candle base at the origin"},{"gate":2,"label":"Departure Strength","isHardFilter":true,"pass":true,"justification":"Body ~85% of range, ~2x the preceding 5-candle average, closes at its low"},{"gate":3,"label":"Break of Structure","isHardFilter":true,"pass":true,"justification":"Departure breaks the prior swing low"},{"gate":4,"label":"Freshness","isHardFilter":true,"pass":true,"justification":"No retest of the proximal line since formation"},{"gate":5,"label":"Trend Alignment","isHardFilter":true,"pass":true,"justification":"Lower highs and lower lows visible, clearly trending down"},{"gate":6,"label":"Zone Location","isHardFilter":false,"pass":true,"justification":"Formed right after a liquidity sweep of the prior low"},{"gate":7,"label":"Distance Ratio","isHardFilter":false,"pass":true,"justification":"Travel is ~4x the zone width"},{"gate":8,"label":"Compact Zone","isHardFilter":false,"pass":false,"justification":"Zone width is ~40% of the departure move, wider than allowed"},{"gate":9,"label":"Return Quality","isHardFilter":false,"pass":true,"justification":"Small overlapping candles fading into the zone"},{"gate":10,"label":"No Conflicting Structure","isHardFilter":false,"pass":true,"justification":"No opposing zone in the likely price path"}],"hardFilterFailed":false,"hardFilterFailures":[],"score":9,"grade":"A","verdict":"VALID","recommendation":"TRADE","confidence":81,"keyStrengths":["Fresh zone","Explosive departure","Clean break of structure"],"keyWeaknesses":["Zone wider than the compact-zone threshold"],"executionAdvice":"Watch the live 10-second chart at the proximal line for your own Tier 1 confirmation before entering SELL.","summary":"9 of 10 gates passed, all hard filters cleared — Grade A."}`;

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

// ── Supabase row mappers (camelCase app shape <-> snake_case db rows) ──────────
function toSettingsRow(userId,s){
  return{user_id:userId,risk_percent:s.riskPercent,trade_style:s.tradeStyle,
    sessions_per_day:s.sessionsPerDay,broker_min:s.brokerMin,milestones:s.milestones,
    api_keys:{apiKey:s.apiKey,groqApiKey:s.groqApiKey},setup_complete:s.setupComplete,
    created_at:new Date(s.createdAt||Date.now()).toISOString(),
    extra:{startingBalanceDemo:s.startingBalanceDemo,startingBalanceReal:s.startingBalanceReal,tradeStyleDemo:s.tradeStyleDemo,tradeStyleReal:s.tradeStyleReal,aiProvider:s.aiProvider,sessionDurations:s.sessionDurations,riskMode:s.riskMode,riskAmount:s.riskAmount,noTradeGapMin:s.noTradeGapMin}};
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
    extra:{date:t.date,analysisId:t.analysisId,criteria:t.criteria,gateResults:t.gateResults,score:t.score,hardFilterFailed:t.hardFilterFailed,hardFilterFailures:t.hardFilterFailures,failedCriteria:t.failedCriteria,keyStrengths:t.keyStrengths,keyWeaknesses:t.keyWeaknesses,executionAdvice:t.executionAdvice,summary:t.summary,confidence:t.confidence,verdict:t.verdict,recommendation:t.recommendation,accountMode:t.accountMode}};
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
    is_locked:s.isLocked,lock_reason:s.lockReason,
    extra:{lockCode:s.lockCode,durationMin:s.durationMin,pausedAt:s.pausedAt,pausedMsTotal:s.pausedMsTotal,paidOnStart:s.paidOnStart}};
}
function fromSessionRow(r){
  return{id:r.id,num:r.num,accountMode:r.account_mode,startTime:new Date(r.start_time).getTime(),
    endTime:r.end_time?new Date(r.end_time).getTime():null,trades:r.trades,wins:r.wins,losses:r.losses,
    conLoss:r.con_loss,conWin:r.con_win,netLoss:r.net_loss,sPnl:r.session_pnl,isActive:r.is_active,
    isLocked:r.is_locked,lockReason:r.lock_reason,...(r.extra||{})};
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
    extra:{date:a.date,screenshotMime:a.screenshotMime,direction:a.direction,recommendation:a.recommendation,confidence:a.confidence,gateResults:a.gateResults,score:a.score,hardFilterFailed:a.hardFilterFailed,hardFilterFailures:a.hardFilterFailures,failedCriteria:a.failedCriteria,keyStrengths:a.keyStrengths,keyWeaknesses:a.keyWeaknesses,executionAdvice:a.executionAdvice,summary:a.summary}};
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
    // Count consecutive no-trade sessions (most recent first) — a session
    // with trades > 0 resets the streak.
    const sorted=[...modeSessions].sort((a,b)=>b.startTime-a.startTime);
    let consecutiveNoTrade=0;
    for(const s of sorted){
      if(s.trades>0)break;
      if(s.lockCode==='TIME_EXPIRED_NO_TRADE')consecutiveNoTrade++;
      else break;
    }
    perMode[mode]={dailyLosses,isDailyLocked:dailyLosses>=MAX_DL,lastEnd,consecutiveNoTrade};
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

// Risk sizing supports two modes, switchable anytime in Settings:
// PERCENT (default) — stake is riskPercent% of current balance, like before.
// FIXED — stake is always the same dollar amount regardless of balance.
// Either way this returns the same {calc,actual,eff} shape so every call site
// (Dashboard, Journal, Money) stays agnostic to which mode is active.
function calcStake(bal,settings){
  if(settings?.riskMode==='FIXED'){
    const amt=Math.max(1,parseFloat(settings.riskAmount)||1);
    return{calc:amt,actual:amt,eff:bal?(amt/bal)*100:0};
  }
  const rPct=settings?.riskPercent??5;
  const c=bal*(rPct/100);
  const a=Math.max(1,Math.round(c*100)/100);
  return{calc:c,actual:a,eff:bal?(a/bal)*100:0};
}

// Per-trade override at logging time — a trader can type either a dollar
// amount or a percent of their current balance for this one trade, instead
// of accepting the default from Settings. Falls back to the default whenever
// there's no valid override value entered.
function resolveStakeOverride(overrideMode,overrideValue,defaultStake,bal){
  const v=parseFloat(overrideValue);
  if(!Number.isFinite(v)||v<=0)return defaultStake;
  if(overrideMode==='AMOUNT')return Math.max(1,v);
  if(overrideMode==='PERCENT')return Math.max(1,Math.round(bal*(v/100)*100)/100);
  return defaultStake;
}

function calcPnl(stake,outcome){
  if(outcome==='WIN')return+(stake*PAYOUT).toFixed(2);
  if(outcome==='LOSS')return -stake;
  return 0;
}

// Wilson score interval — a binomial confidence interval that stays sane at
// small n (unlike the normal/Wald approximation, which can produce bounds
// outside [0,1] or an implausibly narrow range on <50 trades). z=1.96 is the
// standard z-score for a 95% interval. Returns fractions (0-1), not percent.
function wilsonInterval(wins,total,z=1.96){
  if(!total)return{lower:0,upper:0,center:0,n:0};
  const p=wins/total;
  const z2=z*z;
  const denom=1+z2/total;
  const center=p+z2/(2*total);
  const margin=z*Math.sqrt((p*(1-p))/total+z2/(4*total*total));
  return{lower:Math.max(0,(center-margin)/denom),upper:Math.min(1,(center+margin)/denom),center:p,n:total};
}

// Review digest — rolling windows rather than calendar week/month, so
// "This Week" is always a full 7 days of data (a calendar week reviewed on
// its 2nd day would look almost empty) and the "previous period" comparison
// is a same-length window, making the delta an apples-to-apples comparison.
const DAY_MS=86400000;
function periodRange(period,now=Date.now()){
  const days=period==='MONTH'?30:7;
  const end=now,start=now-days*DAY_MS;
  return{start,end,prevStart:start-days*DAY_MS,prevEnd:start,days};
}

// Pure — no I/O. Takes already-loaded trades/analyses and a [start,end)
// window, and returns one mode's digest for that window. No grading logic
// is touched — this only reads outcomes/fields that already exist.
function computeDigest({trades,analyses,mode,start,end}){
  const inRange=t=>t.timestamp>=start&&t.timestamp<end;
  const periodTrades=trades.filter(t=>getTradeMode(t)===mode&&inRange(t));
  const done=periodTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=done.length?(wins/done.length)*100:0;

  const pairMap={};
  done.forEach(t=>{
    const key=t.pair||'Unknown';
    if(!pairMap[key])pairMap[key]={wins:0,total:0};
    pairMap[key].total++;
    if(t.outcome==='WIN')pairMap[key].wins++;
  });
  // Minimum 3 trades to qualify — otherwise a single lucky trade reads as a "100% pair".
  const pairStats=Object.entries(pairMap).map(([pair,d])=>({pair,...d,wr:(d.wins/d.total)*100})).filter(p=>p.total>=3);
  const bestPair=pairStats.length?pairStats.reduce((a,b)=>b.wr>a.wr?b:a):null;
  const worstPair=pairStats.length?pairStats.reduce((a,b)=>b.wr<a.wr?b:a):null;

  // Gate-failure stat is scoped to analyses actually linked to a trade the
  // user logged this period (via trade.analysisId) — never every zone ever
  // analyzed. The analyzer's grading is still being refined, so an unacted-on
  // analysis shouldn't shape this stat; only zones the user traded on should.
  const linkedAnalysisIds=new Set(periodTrades.map(t=>t.analysisId).filter(Boolean));
  const linkedAnalyses=(analyses||[]).filter(a=>linkedAnalysisIds.has(a.id));
  const gateFailCounts={};
  linkedAnalyses.forEach(a=>{
    (a.gateResults||[]).forEach(g=>{if(!g.pass)gateFailCounts[g.label]=(gateFailCounts[g.label]||0)+1;});
  });
  const topEntry=Object.entries(gateFailCounts).sort((a,b)=>b[1]-a[1])[0]||null;
  const topGateFailure=topEntry?{label:topEntry[0],count:topEntry[1],ofAnalyses:linkedAnalyses.length}:null;

  // Analyzer-usage reliance — how many logged trades skipped zone analysis
  // entirely, using the same isAnalyzed field the Journal/Analytics already
  // use to distinguish ANALYZER-sourced trades from MANUAL entries. This is
  // independent of same-day vs backdated, and of session timing altogether.
  const unanalyzedTrades=periodTrades.filter(t=>!t.isAnalyzed).length;

  return{
    totalTrades:periodTrades.length,
    demoCount:trades.filter(t=>getTradeMode(t)==='DEMO'&&inRange(t)).length,
    realCount:trades.filter(t=>getTradeMode(t)==='REAL'&&inRange(t)).length,
    wins,total:done.length,wr,ci:wilsonInterval(wins,done.length),
    bestPair,worstPair,topGateFailure,
    unanalyzedTrades,
    // Real P&L is tracked regardless of which mode is toggled — Demo P&L
    // isn't real money, consistent with Money page treating Demo as practice-only.
    realPnl:trades.filter(t=>getTradeMode(t)==='REAL'&&inRange(t)&&t.outcome!=='PENDING').reduce((s,t)=>s+t.pnl,0),
  };
}

function emptyModeState(){return{dailyLosses:0,isDailyLocked:false,lastEnd:null,consecutiveNoTrade:0};}

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

function canStart(ss,max,mode,settings){
  const m=ss.perMode?.[mode]||emptyModeState();
  if(m.isDailyLocked)return{ok:false,msg:`Daily ${MAX_DL}-loss limit reached for ${mode==='REAL'?'Real':'Demo'}. Resume tomorrow.`};
  const sessionsForMode=(ss.sessions||[]).filter(s=>s.accountMode===mode);
  const consecutiveNoTrade=m.consecutiveNoTrade||0;
  const isFreeNoTrade=consecutiveNoTrade<MAX_NO_TRADE_STREAK;
  // Sessions that count toward the daily limit: when the streak threshold
  // is hit ALL sessions count; otherwise only sessions that had trades.
  const countedSessions=isFreeNoTrade?sessionsForMode.filter(s=>s.trades>0||s.paidOnStart):sessionsForMode;
  if(countedSessions.length>=max)return{ok:false,msg:`Max ${max} sessions reached today.`};
  if(m.lastEnd){
    const last=lastEndedSession(ss,mode);
    const wasNoTrade=last?.lockCode==='TIME_EXPIRED_NO_TRADE';
    const gapMs=isFreeNoTrade&&wasNoTrade
      ?(settings?.noTradeGapMin??NO_TRADE_GAP_DEFAULT)*60000
      :GAP;
    const rem=gapMs-(Date.now()-m.lastEnd);
    if(rem>0){
      const h=Math.floor(rem/3600000),m2=Math.floor((rem%3600000)/60000);
      let msg=`Next session in ${h}h ${m2}m`;
      if(isFreeNoTrade&&wasNoTrade)msg=`No qualifying setup found. Next session available in ${h}h ${m2}m.`;
      else if(!isFreeNoTrade&&wasNoTrade)msg=`${MAX_NO_TRADE_STREAK} sessions without a trade today — treating this as a full session. Next session in ${h}h ${m2}m.`;
      return{ok:false,msg};
    }
  }
  return{ok:true};
}

function chkLock(sess,style){
  if(!sess)return{locked:false,adv:null};
  if(style===1&&sess.trades>=1)return{locked:true,reason:'Session complete — 1 trade taken',code:'MAX_TRADES',adv:null};
  if(style===2){
    if(sess.wins>=3)return{locked:true,reason:'Take profit — 3 wins',code:'TAKE_PROFIT',adv:null};
    if(sess.conLoss>=2)return{locked:true,reason:'Stop loss — 2 consecutive losses',code:'STOP_LOSS',adv:null};
    if(sess.netLoss>=2)return{locked:true,reason:'Stop loss — net -2 on session',code:'STOP_LOSS',adv:null};
    if(sess.trades>=5)return{locked:true,reason:'Max trades reached — 5',code:'MAX_TRADES',adv:null};
  }
  if(style===3){
    if(sess.wins>=3)return{locked:true,reason:'Take profit — 3 wins',code:'TAKE_PROFIT',adv:null};
    if(sess.losses>=2)return{locked:true,reason:'Stop loss — 2 losses',code:'STOP_LOSS',adv:null};
    if(sess.trades>=3)return{locked:true,reason:'Max trades reached — 3',code:'MAX_TRADES',adv:null};
    if(sess.conWin>=2)return{locked:false,adv:`${sess.conWin} consecutive wins (+${f$(sess.sPnl)}). Consider securing this session — trade ${sess.trades+1} risks giving it back.`};
  }
  return{locked:false,adv:null};
}

// ── Session timer helpers ──────────────────────────────────────────────────────
function getSessionDuration(settings,styleId){
  return settings?.sessionDurations?.[styleId] ?? DEF_DURATIONS[styleId] ?? DEF_DURATIONS[1];
}
function buildSession(ssState,mode,durationMin){
  const pm=perModeFromSessions(ssState.sessions)[mode]||emptyModeState();
  const paidOnStart=(pm.consecutiveNoTrade||0)>=MAX_NO_TRADE_STREAK;
  return{id:uid(),num:ssState.sessions.filter(x=>x.accountMode===mode).length+1,accountMode:mode,
    startTime:Date.now(),endTime:null,trades:0,wins:0,losses:0,conLoss:0,conWin:0,netLoss:0,sPnl:0,
    isActive:true,isLocked:false,lockReason:null,lockCode:null,paidOnStart,
    durationMin,pausedAt:null,pausedMsTotal:0};
}
// Elapsed time excludes any time spent paused, so pausing genuinely freezes the countdown.
function sessionElapsedMs(sess,now){
  if(!sess)return 0;
  const pausedNow=sess.pausedAt?now-sess.pausedAt:0;
  return(now-sess.startTime)-(sess.pausedMsTotal||0)-pausedNow;
}
// Sessions created before this feature shipped have no durationMin — never time-expire those.
function sessionRemainingMs(sess,now){
  if(!sess?.durationMin)return Infinity;
  return Math.max(0,sess.durationMin*60000-sessionElapsedMs(sess,now));
}
function isSessionTimeExpired(sess,now){
  if(!sess?.durationMin)return false;
  return sessionRemainingMs(sess,now)<=0;
}
function lastEndedSession(ss,mode){
  return[...(ss?.sessions||[])].filter(s=>s.accountMode===mode&&s.endTime).sort((a,b)=>b.endTime-a.endTime)[0]||null;
}
// A session that timed out (as opposed to hitting a trade-count/streak rule)
// additionally blocks new Analyzer/Journal activity until the normal 6h gap
// elapses — trade-triggered lock reasons keep their existing behavior.
function isTimeExpiredCooldown(ss,mode,settings){
  const last=lastEndedSession(ss,mode);
  if(!last)return false;
  if(last.lockCode==='TIME_EXPIRED_NO_TRADE'){
    const gap=(settings?.noTradeGapMin??NO_TRADE_GAP_DEFAULT)*60000;
    return(Date.now()-last.endTime)<gap;
  }
  if(last.lockCode==='TIME_EXPIRED')return(Date.now()-last.endTime)<GAP;
  return false;
}
function fmtClock(ms){
  const s=Math.max(0,Math.round(ms/1000));
  const m=Math.floor(s/60),r=s%60;
  return`${m}:${String(r).padStart(2,'0')}`;
}
function useNowTick(intervalMs){
  const[now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    const id=setInterval(()=>setNow(Date.now()),intervalMs);
    return()=>clearInterval(id);
  },[intervalMs]);
  return now;
}

function validateZoneDirection(r){
  const dd=r.departureDirection;
  if(dd!=='UP'&&dd!=='DOWN')return false;
  if(dd==='DOWN')return r.direction==='SELL'&&/^Supply/.test(r.zoneType||'');
  return r.direction==='BUY'&&/^Demand/.test(r.zoneType||'');
}

async function openRouterAnalyze(b64,mime,key){
  const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'nvidia/nemotron-nano-12b-v2-vl:free',messages:[{role:'user',content:[{type:'text',text:PROMPT},{type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}}]}],temperature:0.1,max_tokens:2000,response_format:{type:'json_object'}})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`OpenRouter API error ${res.status}`);}
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content||'{}';
  try{return JSON.parse(txt.replace(/```json|```/g,'').trim());}catch{throw new Error('Could not parse OpenRouter response. Try again.');}
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

// Renders "95% CI: 54%–76% · 47 trades" plus a small-sample caveat under 50.
// Shared by the Dashboard tile, Analytics overview, and the per-grade breakdown.
function WinRateCI({wins,total,style}){
  if(!total)return null;
  const{lower,upper}=wilsonInterval(wins,total);
  const lo=Math.round(lower*100),hi=Math.round(upper*100);
  return(
    <span style={style}>
      95% CI: {lo}%–{hi}% · {total} trade{total===1?'':'s'}
      {total<50&&<div style={{marginTop:2}}>Sample size is still small — this range will narrow as you log more trades.</div>}
    </span>
  );
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

// Styled stand-in for window.confirm — used where a destructive action needs
// a deliberate second step without breaking out to a native browser dialog.
function ConfirmDialog({title,body,confirmLabel='Delete',onConfirm,onCancel}){
  return(
    <div role="dialog" aria-modal="true" aria-label={title} style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1300}} onClick={onCancel}>
      <div style={{...card,width:'100%',maxWidth:380,border:'1px solid var(--border-strong)',boxShadow:'0 18px 50px rgba(0,0,0,0.35)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <div style={{width:32,height:32,borderRadius:'var(--radius-sm)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-danger)',border:'1px solid var(--border-danger)'}}>
            <TriangleAlert size={16} style={{color:'var(--text-danger)'}}/>
          </div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>{title}</div>
        </div>
        <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16}}>{body}</div>
        <div style={{display:'flex',gap:8}}>
          <button style={{...btn(),flex:1}} onClick={onCancel}>Cancel</button>
          <button style={{...btn('dan'),flex:1}} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// Gate breakdown for the strict AI validation filter (new 10-gate schema). Criteria
// below stays for analyses saved under the old loose-criteria schema.
function Gates({gates,score,grade}){
  const n=score??gates.filter(g=>g.pass).length;
  const failedHardFilter=gates.some(g=>g.isHardFilter&&!g.pass);
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{n}/{gates.length}{grade?` — Grade ${grade}`:''}</span>
        <div style={{display:'flex',gap:3}} aria-hidden="true">
          {gates.map(g=><span key={g.gate} style={{width:16,height:5,borderRadius:999,background:g.pass?'var(--text-success)':'var(--surface-2)',border:g.pass?'none':'1px solid var(--border-strong)'}}/>)}
        </div>
      </div>
      {failedHardFilter&&<div style={{fontSize:12,color:'var(--text-danger)',background:'var(--bg-danger)',border:'1px solid var(--border-danger)',borderRadius:'var(--radius)',padding:'6px 10px',marginBottom:8}}>A hard filter failed — automatically INVALID regardless of the other gates.</div>}
      {gates.map(g=>(
        <div key={g.gate} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)',background:g.isHardFilter&&!g.pass?'var(--bg-danger)':undefined}}>
          {g.pass
            ?<CircleCheck size={15} style={{color:'var(--text-success)',flexShrink:0,marginTop:2}}/>
            :<CircleX size={15} style={{color:'var(--text-danger)',flexShrink:0,marginTop:2}}/>}
          <div>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>
              <span style={{color:'var(--text-muted)',fontWeight:700,fontSize:10,letterSpacing:'0.08em',marginRight:6}}>GATE {g.gate}</span>{g.label}
              {g.isHardFilter&&<span style={{marginLeft:6,fontSize:9,fontWeight:700,letterSpacing:'0.06em',color:'var(--text-danger)',background:'var(--bg-danger)',border:'1px solid var(--border-danger)',borderRadius:4,padding:'1px 5px'}}>CRITICAL</span>}
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
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[f,sf]=useState({apiKey:'',groqApiKey:'',aiProvider:'gemini',startingBalanceDemo:'',startingBalanceReal:'',riskPercent:5,tradeStyle:1,tradeStyleDemo:1,tradeStyleReal:1,sessionsPerDay:2,brokerMin:10,milestones:DEF_MS,noTradeGapMin:NO_TRADE_GAP_DEFAULT});
  const set=(k,v)=>sf(p=>({...p,[k]:v}));

  async function finish(){
    console.log('[Setup] finish — Validating inputs');
    const demo=parseFloat(f.startingBalanceDemo);
    const real=parseFloat(f.startingBalanceReal);
    if(!demo||!real){
      console.log('[Setup] finish — Validation failed: missing starting balances');
      setError('Please enter both Demo and Real starting balances.');
      return;
    }
    setLoading(true);
    setError('');
    try{
      console.log('[Setup] finish — Saving to Supabase');
      await onDone({...f,startingBalanceDemo:demo,startingBalanceReal:real,setupComplete:true,createdAt:Date.now()});
      console.log('[Setup] finish — Setup complete');
    }catch(e){
      console.log('[Setup] finish — Error:', e);
      setError('Could not save settings: '+(e.message||e)+'. Please try again.');
      setLoading(false);
    }
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
              <label style={lbl}>OpenRouter API key <span style={{color:'var(--text-muted)'}}>(openrouter.ai — free tier)</span></label>
              <input style={inp} type="password" placeholder="sk-or-v1-..." value={f.apiKey} onChange={e=>set('apiKey',e.target.value)}/>
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
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>6-hour gap enforced between standard sessions; shorter cooldown for no-trade sessions.</p>
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

      {error&&(
        <div style={{marginTop:12,padding:'8px 12px',background:'var(--bg-danger)',border:'1px solid var(--border-danger)',borderRadius:'var(--radius-sm)',fontSize:13,color:'var(--text-danger)'}}>
          {error}
        </div>
      )}
      <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:error?12:0}}>
        {step>1?<button style={btn()} onClick={()=>setStep(s=>s-1)}>← Back</button>:<div/>}
        {step<4
          ?<button style={btn('pri')} onClick={()=>setStep(s=>s+1)}>Next →</button>
          :<button style={btn('pri')} onClick={finish} disabled={loading||!f.startingBalanceDemo||!f.startingBalanceReal}>
            {loading?'Saving…':'Start trading →'}
          </button>
        }
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// ── Session background music (Jamendo) ─────────────────────────────────────────
// Pixabay has no public music-search API (only images/videos are documented) —
// Jamendo's v3 API is the real equivalent: a free client_id, tag search, and a
// direct streamable "audio" URL per track. Fetched once per session id, never
// on every render; a missing key or failed fetch degrades to a quiet inline
// message rather than touching the timer or blocking trading.
function randTrackIndex(len,exclude){
  if(len<=1)return 0;
  let i=Math.floor(Math.random()*len);
  if(exclude!=null)while(i===exclude)i=Math.floor(Math.random()*len);
  return i;
}

// Owns the actual <audio> element's state so it can be rendered once at the
// App level and survive navigating between Dashboard/Journal/Settings/etc —
// a component-local player would unmount (and stop) the moment you left
// whichever page rendered it.
function useMusicPlayer(active){
  const[tracks,setTracks]=useState(null); // null = loading, [] = unavailable
  const[trackIdx,setTrackIdx]=useState(0);
  const[playing,setPlaying]=useState(false);
  const[volume,setVolume]=useState(0.5);
  const[muted,setMuted]=useState(false);
  const audioRef=useRef(null);
  const fetchedForRef=useRef(null);
  const startedRef=useRef(false); // has a track been explicitly picked/started this session yet?
  const pendingPlayRef=useRef(false); // play() once the just-picked track's src lands in the DOM

  useEffect(()=>{
    if(!active){fetchedForRef.current=null;startedRef.current=false;return;}
    if(fetchedForRef.current===active.id)return;
    fetchedForRef.current=active.id;
    startedRef.current=false;
    const clientId=process.env.REACT_APP_JAMENDO_CLIENT_ID;
    if(!clientId){setTracks([]);return;}
    setTracks(null);
    setTrackIdx(0);
    setPlaying(false);
    fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=100&audioformat=mp32&fuzzytags=lofi+ambient`)
      .then(r=>{if(!r.ok)throw new Error('bad response');return r.json();})
      .then(d=>{
        const list=(d.results||[]).filter(t=>t.audio);
        setTracks(list);
      })
      .catch(()=>setTracks([]));
  },[active]);

  // Stops playback the instant the session ends, for any reason.
  useEffect(()=>{
    if(!active&&audioRef.current){audioRef.current.pause();setPlaying(false);}
  },[active]);

  useEffect(()=>{
    if(audioRef.current)audioRef.current.volume=muted?0:volume;
  },[volume,muted]);

  // Plays the freshly-picked (random) track once its src has landed on the <audio> element.
  useEffect(()=>{
    if(pendingPlayRef.current&&audioRef.current){
      pendingPlayRef.current=false;
      audioRef.current.play().catch(()=>{});
      setPlaying(true);
    }
  },[trackIdx]);

  // Shuffles to a new random track and keeps playing — used for both the
  // "Next" control and onEnded, so background music runs unattended.
  function next(){
    if(!tracks?.length)return;
    startedRef.current=true;
    pendingPlayRef.current=true;
    setTrackIdx(i=>randTrackIndex(tracks.length,i));
  }
  function play(){
    if(!audioRef.current||!tracks?.length)return;
    if(!startedRef.current)next();
    else{audioRef.current.play().catch(()=>{});setPlaying(true);}
  }
  function pause(){
    if(!audioRef.current)return;
    audioRef.current.pause();
    setPlaying(false);
  }
  function toggle(){playing?pause():play();}
  function selectTrack(i){
    startedRef.current=true;
    pendingPlayRef.current=false;
    setTrackIdx(i);
    setPlaying(false);
    if(audioRef.current)audioRef.current.pause();
  }

  return{tracks,trackIdx,track:tracks?.[trackIdx],playing,volume,setVolume,muted,setMuted,audioRef,toggle,next,selectTrack};
}

// Full inline player — rendered inside the Dashboard grid while a session is active.
function MusicPlayerPanel({music}){
  const{tracks,trackIdx,track,playing,volume,setVolume,muted,setMuted,toggle,next,selectTrack}=music;
  return(
    <div className="col-span-12" style={{...card,marginBottom:0}}>
      <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:'var(--text-primary)'}}>
        Background music <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:11}}>· via Jamendo</span>
      </div>
      {tracks===null?(
        <div style={{fontSize:12,color:'var(--text-muted)'}}>Loading tracks…</div>
      ):tracks.length===0?(
        <div style={{fontSize:12,color:'var(--text-muted)'}}>Music unavailable this session.</div>
      ):(
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <select
            aria-label="Track"
            value={trackIdx}
            onChange={e=>selectTrack(parseInt(e.target.value,10))}
            style={{...inp,flex:'1 1 220px'}}
          >
            {tracks.map((t,i)=><option key={t.id} value={i}>{t.name} — {t.artist_name}</option>)}
          </select>
          <button style={btn()} onClick={toggle}>{playing?<Pause size={15}/>:<Play size={15}/>}{playing?'Pause':'Play'}</button>
          <button style={btn()} onClick={next} aria-label="Next track"><SkipForward size={15}/></button>
          <button style={btn()} onClick={()=>setMuted(m=>!m)} aria-label={muted?'Unmute':'Mute'}>{muted?<VolumeX size={15}/>:<Volume2 size={15}/>}</button>
          <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} style={{width:100}}/>
          {track&&<div style={{fontSize:11,color:'var(--text-muted)',width:'100%'}}>Now playing: {track.name} — {track.artist_name}</div>}
        </div>
      )}
    </div>
  );
}

// ── Draggable hook ──────────────────────────────────────────────────────────────
const MUSIC_WIDGET_POS_KEY = 'gm_music_widget_pos';

function useDraggable() {
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(MUSIC_WIDGET_POS_KEY);
      return saved ? JSON.parse(saved) : { right: 16, bottom: 16 };
    } catch {
      return { right: 16, bottom: 16 };
    }
  });

  const posRef = useRef(pos);
  posRef.current = pos;
  const dragRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    // Only primary button, and ignore if clicking interactive elements
    if (e.button !== 0) return;
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'A') return;
    e.preventDefault();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: posRef.current.right,
      startBottom: posRef.current.bottom,
    };

    const onMove = (ev) => {
      const dx = dragRef.current.startX - ev.clientX;
      const dy = dragRef.current.startY - ev.clientY;
      setPos({
        right: Math.max(0, dragRef.current.startRight + dx),
        bottom: Math.max(0, dragRef.current.startBottom + dy),
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      try { localStorage.setItem(MUSIC_WIDGET_POS_KEY, JSON.stringify(posRef.current)); } catch {}
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return [pos, handleMouseDown];
}

// Compact floating control shown on every other page while a session is active,
// so leaving the Dashboard never silences the music — only the full player
// (track picker, volume, mute) is Dashboard-only, per the original scope.
function MusicWidget({music}){
  const{tracks,track,playing,toggle,next}=music;
  const [pos, handleMouseDown] = useDraggable();

  if(tracks===null)return(
    <div style={{position:'fixed',right:pos.right,bottom:pos.bottom,zIndex:900,...card,marginBottom:0,padding:'8px 14px',fontSize:12,color:'var(--text-muted)',boxShadow:'0 8px 24px rgba(0,0,0,0.35)'}}>Loading music…</div>
  );
  if(!tracks.length)return null;
  return(
    <div
      onMouseDown={handleMouseDown}
      style={{position:'fixed',right:pos.right,bottom:pos.bottom,zIndex:900,...card,marginBottom:0,padding:'8px 10px',display:'flex',alignItems:'center',gap:6,cursor:'grab',boxShadow:'0 8px 24px rgba(0,0,0,0.35)',userSelect:'none'}}
    >
      <span style={{display:'flex',alignItems:'center',color:'var(--text-muted)',cursor:'grab'}}><GripHorizontal size={14}/></span>
      <button style={btn()} onClick={toggle} aria-label={playing?'Pause music':'Play music'}>{playing?<Pause size={15}/>:<Play size={15}/>}</button>
      <button style={btn()} onClick={next} aria-label="Next track"><SkipForward size={15}/></button>
      {track&&<span style={{fontSize:11,color:'var(--text-muted)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{track.name}</span>}
    </div>
  );
}

export function Dashboard({settings,trades,wds,ss,saveSS,bal,mode,nav,music}){
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const done=modeTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  // Today-only counts — the full modeTrades/done may span multiple days.
  const todayDate=ss?.date||tod();
  const todayDone=modeTrades.filter(t=>t.date===todayDate&&t.outcome!=='PENDING');
  const todayWins=todayDone.filter(t=>t.outcome==='WIN').length;
  const todayPnl=todayDone.reduce((s,t)=>s+t.pnl,0);
  const wr=done.length?((wins/done.length)*100):0;
  const pnl=done.reduce((s,t)=>s+t.pnl,0);
  const startBal=getStartingBalanceForMode(settings,mode);
  const growth=startBal?((bal-startBal)/startBal)*100:0;
  const stake=calcStake(bal,settings);
  const active=getActive(ss,mode);
  const activeTradesArr = active?modeTrades.filter(t=>t.date===ss?.date && t.sessionNum===active.num):[];
  const activeTradesCount = activeTradesArr.length;
  const activeWins = activeTradesArr.filter(t=>t.outcome==='WIN').length;
  const activeLosses = activeTradesArr.filter(t=>t.outcome==='LOSS').length;
  const canS=canStart(ss,settings.sessionsPerDay,mode,settings);
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

  // ── Session timer ──────────────────────────────────────────────────────────
  const now=useNowTick(1000);
  const isPaused=!!active?.pausedAt;
  const remainingMs=active?sessionRemainingMs(active,now):Infinity;
  const pauseRemainingMs=isPaused?Math.max(0,PAUSE_AUTO_RESUME_MS-(now-active.pausedAt)):0;
  const[endToast,setEndToast]=useState(null);
  const prevActiveRef=useRef(active);

  async function startSession(){
    const s=canStart(ss,settings.sessionsPerDay,mode,settings);
    if(!s.ok){alert(s.msg);return;}
    const duration=getSessionDuration(settings,getTradeStyleForMode(settings,mode));
    const ns=buildSession(ss,mode,duration);
    const nextSessions=[...ss.sessions,ns];
    await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
  }
  async function pauseSession(){
    if(!active||active.pausedAt)return;
    const nextSessions=ss.sessions.map(s=>s.id===active.id?{...s,pausedAt:Date.now()}:s);
    await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
  }
  async function resumeSession(){
    if(!active||!active.pausedAt)return;
    const us={...active,pausedMsTotal:(active.pausedMsTotal||0)+(Date.now()-active.pausedAt),pausedAt:null};
    const nextSessions=ss.sessions.map(s=>s.id===active.id?us:s);
    await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
  }
  async function endSession(code,reason){
    if(!active)return;
    const us={...active,isActive:false,isLocked:true,lockReason:reason,lockCode:code,endTime:Date.now()};
    const nextSessions=ss.sessions.map(s=>s.id===active.id?us:s);
    await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
  }

  // Local, immediate handling of pause auto-resume and time expiry while the
  // Dashboard is mounted — the App-level interval is just the backstop for
  // when it isn't (see the effect near saveSS in App).
  useEffect(()=>{
    if(!active)return;
    if(active.pausedAt&&now-active.pausedAt>=PAUSE_AUTO_RESUME_MS)resumeSession();
    else if(!active.pausedAt&&isSessionTimeExpired(active,now))endSession(active.trades===0?'TIME_EXPIRED_NO_TRADE':'TIME_EXPIRED',active.trades===0?'No qualifying setup found':'Time expired');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[now]);

  // Fires the "Session ended — [reason]" toast the moment an active session
  // for this mode disappears (locked by a trade rule or the timer above).
  useEffect(()=>{
    if(prevActiveRef.current&&!active){
      const ended=lastEndedSession(ss,mode);
      if(ended){
        const gapMs=ended.lockCode==='TIME_EXPIRED_NO_TRADE'
          ?(settings?.noTradeGapMin??NO_TRADE_GAP_DEFAULT)*60000
          :GAP;
        const rem=gapMs-(Date.now()-ended.endTime);
        const h=Math.max(0,Math.floor(rem/3600000)),m2=Math.max(0,Math.floor((rem%3600000)/60000));
        const msg=ended.lockCode==='TIME_EXPIRED_NO_TRADE'
          ?`Session ended — no qualifying setup found. Next session available in ${h}h ${m2}m.`
          :`Session ended — ${ended.lockReason||'locked'}. Next session in ${h}h ${m2}m.`;
        setEndToast(msg);
        setTimeout(()=>setEndToast(null),10000);
      }
    }
    prevActiveRef.current=active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active,ss,mode]);

  return(
    <div>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:600,letterSpacing:'-0.01em',color:'var(--text-primary)'}}>Dashboard</div>
        <div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>
      </div>

      {endToast&&<Alert type="warn" title="Session ended" body={endToast}/>}

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
              {Number.isFinite(remainingMs)&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Session timer</span>
                    <span style={{fontSize:20,fontWeight:700,fontFamily:'var(--font-mono)',color:remainingMs<=60000?'var(--text-danger)':'var(--text-primary)'}}>{fmtClock(remainingMs)}</span>
                  </div>
                  {isPaused&&<div style={{fontSize:12,color:'var(--text-warning)',marginBottom:8}}>Paused — resumes automatically in {fmtClock(pauseRemainingMs)}</div>}
                  <div style={{display:'flex',gap:8}}>
                    <button style={{...btn(),flex:1}} onClick={isPaused?resumeSession:pauseSession}>{isPaused?'Resume':'Pause'}</button>
                    <button style={{...btn('dan'),flex:1}} onClick={()=>endSession('MANUAL','Ended manually')}>End session</button>
                  </div>
                </div>
              )}
            </div>
          ):canS.ok?(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-accent)',border:'1px solid var(--border-accent)',marginBottom:10}}>
                <Target size={17} style={{color:'var(--text-accent)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Ready for session {ss.sessions.length+1}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Start a session to begin the timer, or analyze a zone / open the journal directly.</div>
              <button style={{...btn('suc'),width:'100%'}} onClick={startSession}><Timer size={15}/>Start session ({getSessionDuration(settings,getTradeStyleForMode(settings,mode))}m)</button>
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

          {/* Today's total — visible in every state so the user always sees their full activity */}
          {todayDone.length>0&&(
            <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',display:'flex',gap:12,fontSize:11,color:'var(--text-muted)'}}>
              <span>Today: <strong style={{color:'var(--text-primary)'}}>{todayDone.length} trades</strong></span>
              <span><strong style={{color:'var(--text-success)'}}>{todayWins}W</strong> / <strong style={{color:'var(--text-danger)'}}>{todayDone.length-todayWins}L</strong></span>
              <span>· {(todayPnl>=0?'+':'')+f$(todayPnl)}</span>
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:todayDone.length>0?8:16}}>
            <button style={{...btn('pri'),width:'100%'}} onClick={()=>nav('analyzer')}><ScanSearch size={15}/>Analyze zone</button>
            <button style={{...btn(),width:'100%'}} onClick={()=>nav('journal')}><BookOpen size={15}/>Journal{pendingN>0&&<span style={{marginLeft:2,padding:'1px 7px',borderRadius:999,fontSize:11,fontWeight:700,background:'var(--bg-danger)',color:'var(--text-danger)',border:'1px solid var(--border-danger)'}}>{pendingN}</span>}</button>
          </div>
        </div>

        {active&&music&&<MusicPlayerPanel music={music}/>}

        {/* Stat tiles */}
        <div className="col-span-6 lg:col-span-3"><Metric label="Win rate" value={fp(wr)} sub={`${wins}W / ${done.length-wins}L · ${done.length} trades`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':done.length?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Streak" value={done.length?`${streak} ${sType==='WIN'?'wins':'losses'}`:'—'} color={sType==='WIN'?'var(--text-success)':sType==='LOSS'?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Next stake" value={f$(stake.actual)} sub={`${fp(stake.eff)} effective risk`} color={settings.riskMode!=='FIXED'&&stake.eff>settings.riskPercent*1.5?'var(--text-warning)':'var(--text-primary)'}/></div>

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
  const[pairEdit,setPairEdit]=useState('');
  const fRef=useRef();const xRef=useRef();

  const active=getActive(ss,mode);
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const cooldown=isTimeExpiredCooldown(ss,mode,settings);
  const locked=(ss.perMode?.[mode]?.isDailyLocked||false)||lk.locked||cooldown;

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
    setBusy(true);setErr(null);
    try{
      const r=provider==='groq'?await groqAnalyze(b64,mime,activeKey):await openRouterAnalyze(b64,mime,activeKey);
      if(!validateZoneDirection(r))throw new Error('Zone direction could not be reliably determined — please verify manually before trading');
      const a={id:uid(),timestamp:Date.now(),date:tod(),screenshot:b64,screenshotMime:mime,linkedTradeId:null,...r};
      await saveAnalyses([a,...analyses]);
      setRes(a);
      setPairEdit(a.detectedPair&&a.detectedPair!=='UNKNOWN'?a.detectedPair:'');
    }catch(e){setErr(e.message);}
    finally{setBusy(false);}
  }

  function goJournal(){
    setPA({...res,detectedPair:pairEdit.trim()||res.detectedPair,extras});
    nav('journal');
  }

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Zone analyzer</div>

      {locked&&<Alert type="dan" title="🔒 Analyzer locked" body={(lk.reason||(cooldown?'Session time expired':'Daily limit reached'))+'. Zone analysis resumes next session.'}/>}
      {lk.adv&&!locked&&<Alert type="warn" title="Advisory" body={lk.adv}/>}
      {!activeKey&&<Alert type="warn" title="No API key" body={`Add your ${provider==='groq'?'Groq':'OpenRouter'} API key in Settings to enable zone analysis.`}/>}

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
          <button style={btn()} onClick={()=>{setImg(null);setB64(null);setRes(null);setErr(null);setExtras([]);setPairEdit('');}}>Clear</button>
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
                <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>{res.zoneType}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{...badge(res.grade),fontSize:14,padding:'4px 10px'}}>Grade {res.grade}</span>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{res.confidence}% confidence</div>
              </div>
            </div>
            <div style={{fontSize:13,color:'var(--text-secondary)'}}>{res.summary}</div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:10}}>
              <label style={{fontSize:12,color:'var(--text-secondary)',flexShrink:0}}>Pair:</label>
              <input style={{...inp,padding:'6px 8px',fontSize:13}} value={pairEdit} onChange={e=>setPairEdit(e.target.value)} placeholder={res.detectedPair==='UNKNOWN'?'Not detected — enter manually':'Pair'} list="analyzer-pair-options"/>
              <datalist id="analyzer-pair-options">{PAIRS.map(p=><option key={p} value={p}/>)}</datalist>
              {res.detectedPair==='UNKNOWN'&&<span style={{fontSize:11,color:'var(--text-warning)',flexShrink:0}}>⚠ Not detected</span>}
            </div>
          </div>

          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>{res.gateResults?'Gate check':'Criteria check'}</div>
            {res.gateResults?.length
              ?<Gates gates={res.gateResults} score={res.score} grade={res.grade}/>
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
  const[mf,smf]=useState(()=>{
    try{const saved=sessionStorage.getItem('gm_draft_mf');if(saved)return JSON.parse(saved);}catch{}
    return{pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:mode||'DEMO',stakeMode:'DEFAULT',stakeValue:''};
  });
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[selectedTrade,setSelectedTrade]=useState(null);
  const[editDraft,setEditDraft]=useState({notes:'',screenshots:[]});
  const[preview,setPreview]=useState(null); // {items:[url,...], index}
  const[saving,setSaving]=useState(false);
  const[savingEdit,setSavingEdit]=useState(false);
  const[editErr,setEditErr]=useState(null);
  const[savedFlash,setSavedFlash]=useState(false);
  const[confirmingDelete,setConfirmingDelete]=useState(false);
  const[paStakeMode,setPaStakeMode]=useState('DEFAULT');
  const[paStakeValue,setPaStakeValue]=useState('');

  // A new analyzer result to log always starts back at the default stake —
  // an override left over from a previous zone shouldn't silently carry forward.
  useEffect(()=>{if(pa){setPaStakeMode('DEFAULT');setPaStakeValue('');}},[pa]);

  // Journal defaults to the matching tab whenever the global Demo/Real toggle
  // changes, but the trader can still flip tabs independently while it's unchanged.
  useEffect(()=>{if(mode)setJournalTab(mode);},[mode]);

  // survives a background-tab reload (Chrome tab discard / dev-server reconnect) without losing the in-progress entry
  useEffect(()=>{
    try{sessionStorage.setItem('gm_draft_mf',JSON.stringify(mf));}catch{}
  },[mf]);

  const stakeFor=m=>calcStake(balForMode(settings,trades,wds,m),settings);
  // Analyzer results always log to the global toggle's account (Change 4) —
  // no separate confirmation step. Manual entries log to whichever tab is open.
  const stake=stakeFor(mode);

  const active=getActive(ss,mode);
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const locked=(ss.perMode?.[mode]?.isDailyLocked||false)||lk.locked||isTimeExpiredCooldown(ss,mode,settings);

  const tabActive=getActive(ss,journalTab);
  const tabLk=tabActive?chkLock(tabActive,getTradeStyleForMode(settings,journalTab)):{locked:false};
  const tabCooldown=isTimeExpiredCooldown(ss,journalTab,settings);
  const tabLocked=(ss.perMode?.[journalTab]?.isDailyLocked||false)||tabLk.locked||tabCooldown;

  async function mkSession(ssState,mode){
    const s=canStart(ssState,settings.sessionsPerDay,mode,settings);
    if(!s.ok){alert(s.msg);return null;}
    const ns=buildSession(ssState,mode,getSessionDuration(settings,getTradeStyleForMode(settings,mode)));
    const nextSessions=[...ssState.sessions,ns];
    const upd={...ssState,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)};
    await saveSS(upd);
    return{ss:upd,sess:ns};
  }

  const paBal=balForMode(settings,trades,wds,mode);
  const paStake=resolveStakeOverride(paStakeMode,paStakeValue,stake.actual,paBal);

  async function recordPA(){
    if(!pa)return;
    let cur=ss,sess=active;
    if(!sess){const r=await mkSession(cur,mode);if(!r)return;cur=r.ss;sess=r.sess;}
    const t={id:uid(),timestamp:Date.now(),date:tod(),sessionNum:sess.num,pair:pa.detectedPair||'Unknown',direction:pa.direction||'BUY',zoneType:pa.zoneType||'',zoneGrade:pa.grade||'A',stake:paStake,outcome:'PENDING',pnl:0,source:'ANALYZER',analysisId:pa.id||null,screenshots:[pa.screenshot,...(pa.extras?.map(e=>e.b64)||[])],notes:'',isAnalyzed:true,criteria:pa.criteria||null,gateResults:pa.gateResults||null,score:pa.score??null,hardFilterFailed:pa.hardFilterFailed??null,hardFilterFailures:pa.hardFilterFailures||[],failedCriteria:pa.failedCriteria||[],keyStrengths:pa.keyStrengths||[],keyWeaknesses:pa.keyWeaknesses||[],executionAdvice:pa.executionAdvice||'',summary:pa.summary||'',confidence:pa.confidence||0,verdict:pa.verdict||'',recommendation:pa.recommendation||'',accountMode:mode};
    await saveTrades(prev=>[t,...(prev||[])]);
    const us={...sess,trades:sess.trades+1};
    const nextSessions=cur.sessions.map(s=>s.id===sess.id?us:s);
    await saveSS({...cur,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
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
      if(lk2.locked){us.isActive=false;us.isLocked=true;us.lockReason=lk2.reason;us.lockCode=lk2.code;us.endTime=Date.now();}
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
    if(saving)return;
    setSaving(true);
    try{
      const tradeDate = mf.tradeDate || tod();
      const isToday = tradeDate === tod();
      let sessionNum = null;
      const entryAccountMode=mf.accountMode || journalTab;
      const pair=(mf.pair||'').trim()||'Manual';
      addPairOption(pair);
      const outcome=mf.outcome||'PENDING';
      const entryBal=balForMode(settings,trades,wds,entryAccountMode);
      const entryStake=resolveStakeOverride(mf.stakeMode,mf.stakeValue,stakeFor(entryAccountMode).actual,entryBal);
      const pnl=calcPnl(entryStake,outcome);

      if (isToday) {
        let cur=ss;
        let sess=getActive(ss,entryAccountMode);
        if(!sess){
          const r=await mkSession(cur,entryAccountMode);
          if(!r){setSaving(false);return;}
          cur=r.ss;
          sess=r.sess;
        }
        const isW=outcome==='WIN';
        const isL=outcome==='LOSS';
        const us={...sess,
          trades:sess.trades+1,
          wins:sess.wins+(isW?1:0),
          losses:sess.losses+(isL?1:0),
          conLoss:isL?sess.conLoss+1:0,
          conWin:isW?sess.conWin+1:0,
          netLoss:sess.netLoss+(isL?1:isW?-1:0),
          sPnl:sess.sPnl+pnl,
        };
        const lk2=chkLock(us,getTradeStyleForMode(settings,entryAccountMode));
        if(lk2.locked){us.isActive=false;us.isLocked=true;us.lockReason=lk2.reason;us.lockCode=lk2.code;us.endTime=Date.now();}
        const nextSessions=cur.sessions.map(s=>s.id===sess.id?us:s);
        await saveSS({...cur,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
        sessionNum = sess.num;
      }

      const now = new Date();
      const tradeDateTime = new Date(tradeDate);
      tradeDateTime.setHours(now.getHours());
      tradeDateTime.setMinutes(now.getMinutes());
      tradeDateTime.setSeconds(now.getSeconds());
      const timestamp = tradeDateTime.getTime();

      const t={id:uid(),timestamp,date:tradeDate,sessionNum:sessionNum,pair,direction:mf.dir,zoneType:'',zoneGrade:mf.grade,stake:entryStake,outcome,pnl,source:'MANUAL',analysisId:null,screenshots:mf.screenshots.map(x=>x.b64||x.b||x).filter(Boolean),notes:mf.notes,isAnalyzed:false,accountMode:entryAccountMode};

      await saveTrades(prev=>[t,...(prev||[])]);
      setManual(false);smf({pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:journalTab,stakeMode:'DEFAULT',stakeValue:''});
      try{sessionStorage.removeItem('gm_draft_mf');}catch{}
    }finally{
      setSaving(false);
    }
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

  const manualAccountMode=mf.accountMode||journalTab;
  const manualBal=balForMode(settings,trades,wds,manualAccountMode);
  const manualDefaultStake=stakeFor(manualAccountMode).actual;
  const manualStake=resolveStakeOverride(mf.stakeMode,mf.stakeValue,manualDefaultStake,manualBal);

  const tabTrades=trades.filter(t=>getTradeMode(t)===journalTab);
  const sorted=[...(filt==='ALL'?tabTrades:tabTrades.filter(t=>filt==='PENDING'?t.outcome==='PENDING':t.outcome===filt))].sort((a,b)=>b.timestamp-a.timestamp);
  const tradeMeta=[['Pair',selectedTrade?.pair],['Direction',selectedTrade?.direction],['Account mode',selectedTrade?.accountMode||'DEMO'],['Stake',selectedTrade?f$(selectedTrade.stake):null],['Outcome',selectedTrade?.outcome],['Session',selectedTrade?.sessionNum],['Zone type',selectedTrade?.zoneType],['Zone grade',selectedTrade?.zoneGrade],['Source',selectedTrade?.source],['Timestamp',selectedTrade?new Date(selectedTrade.timestamp).toLocaleString():null]];

  async function saveTradeEdits(){
    if(!selectedTrade||savingEdit)return;
    setSavingEdit(true);setEditErr(null);
    try{
      const screenshots=editDraft.screenshots.map(x=>x.b64||x).filter(Boolean);
      const updated={...selectedTrade,notes:editDraft.notes,screenshots};
      await saveTrades(prev=>prev.map(t=>t.id===selectedTrade.id?updated:t));
      setSelectedTrade(updated);
      setSavedFlash(true);
      setTimeout(()=>setSavedFlash(false),1800);
    }catch(e){
      setEditErr(e.message||'Could not save edits. Try again.');
    }finally{
      setSavingEdit(false);
    }
  }

  async function addTradeImage(file){
    if(!file||!selectedTrade)return;
    const b=await toB64(file);
    const url=typeof URL.createObjectURL==='function'?URL.createObjectURL(file):`data:${file.type||'image/png'};base64,${b}`;
    const next=[...(editDraft.screenshots||selectedTrade.screenshots||[]),{url,b64:b,mime:file.type||'image/png'}];
    setEditDraft(d=>({...d,screenshots:next}));
    setSelectedTrade(s=>s?{...s,screenshots:next.map(x=>x.b64)}:s);
  }

  function openTradeImage(i){
    setPreview({items:editDraft.screenshots.map(s=>s.url),index:i});
  }

  function onTradePaste(e){
    if(!selectedTrade)return;
    const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const file=item.getAsFile();
    if(file) addTradeImage(file);
  }

  // Keyed on trade id (not the whole object) — addTradeImage/removeTradeImage
  // update selectedTrade in place to keep other displays in sync, and re-keying
  // on every such mutation would blow away in-progress notes edits mid-typing.
  useEffect(()=>{
    if(selectedTrade){
      setEditDraft({notes:selectedTrade.notes||'',screenshots:(selectedTrade.screenshots||[]).map((src,i)=>{
        const isStr=typeof src==='string';
        const raw=isStr?src:(src?.b64||src?.b);
        return{id:i,url:toDataUrl(raw,src?.mime),b64:raw,mime:src?.mime||'image/png'};
      })});
      setEditErr(null);
      setPreview(null);
      setConfirmingDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedTrade?.id]);

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Trading journal</div>

      {pa&&(
        <div style={{...card,background:'var(--bg-success)',borderColor:'var(--border-success)'}}>
          <div style={{fontSize:14,fontWeight:500,color:'var(--text-success)',marginBottom:6}}>Zone analysis ready to log</div>
          <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:10}}>{pa.zoneType} · Grade {pa.grade} · {pa.detectedPair&&pa.detectedPair!=='UNKNOWN'?pa.detectedPair:'Pair not set'} · {pa.direction}</div>
          <div style={{marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',padding:'3px 9px',borderRadius:999,background:mode==='REAL'?'var(--bg-danger)':'var(--bg-accent)',color:mode==='REAL'?'var(--text-danger)':'var(--text-accent)',border:`1px solid ${mode==='REAL'?'var(--border-danger)':'var(--border-accent)'}`}}>
              Logging to {mode==='REAL'?'REAL':'DEMO'}
            </span>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{...lbl,color:'var(--text-success)'}}>Stake</label>
            <div style={{display:'flex',gap:8,marginBottom:6}}>
              {[{id:'DEFAULT',label:`Default (${f$(stake.actual)})`},{id:'AMOUNT',label:'Amount $'},{id:'PERCENT',label:'Percent %'}].map(o=>(
                <button key={o.id} style={{...btn(paStakeMode===o.id?'pri':'def'),flex:1,fontSize:12}} onClick={()=>setPaStakeMode(o.id)}>{o.label}</button>
              ))}
            </div>
            {paStakeMode!=='DEFAULT'&&(
              <input style={inp} type="number" min="0" step="0.01" placeholder={paStakeMode==='AMOUNT'?'e.g. 10':'e.g. 3'} value={paStakeValue} onChange={e=>setPaStakeValue(e.target.value)}/>
            )}
            <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>Will log {f$(paStake)}{paStakeMode==='PERCENT'?` (${fp(parseFloat(paStakeValue)||0)} of ${f$(paBal)} balance)`:''}.</div>
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

      {tabLocked&&<Alert type="dan" title={`${journalTab==='REAL'?'Real':'Demo'} day locked`} body={tabLk.reason||(tabCooldown?'Session time expired. Manual entries resume after the gap.':`${MAX_DL}-loss daily limit reached for this account. Manual entries resume tomorrow.`)}/>}

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
            <label style={lbl}>Stake</label>
            <div style={{display:'flex',gap:8,marginBottom:6}}>
              {[{id:'DEFAULT',label:`Default (${f$(manualDefaultStake)})`},{id:'AMOUNT',label:'Amount $'},{id:'PERCENT',label:'Percent %'}].map(o=>(
                <button key={o.id} style={{...btn(mf.stakeMode===o.id?'pri':'def'),flex:1,fontSize:12}} onClick={()=>smf(m=>({...m,stakeMode:o.id}))}>{o.label}</button>
              ))}
            </div>
            {mf.stakeMode!=='DEFAULT'&&(
              <input style={inp} type="number" min="0" step="0.01" placeholder={mf.stakeMode==='AMOUNT'?'e.g. 10':'e.g. 3'} value={mf.stakeValue} onChange={e=>smf(m=>({...m,stakeValue:e.target.value}))}/>
            )}
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>This trade will log {f$(manualStake)}{mf.stakeMode==='PERCENT'?` (${fp(parseFloat(mf.stakeValue)||0)} of ${f$(manualBal)} balance)`:''}.</div>
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
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(92px,1fr))',gap:10,marginBottom:8}}>
              {mf.screenshots.map((x,i)=>(
                <div key={i} className="gm-gallery-tile" style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',background:'var(--surface-0)',cursor:'zoom-in'}} onClick={()=>setPreview({items:mf.screenshots.map(s=>s.url),index:i})}>
                  <img src={x.url} alt={`Screenshot ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  <div className="gm-gallery-overlay" style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.55) 100%)',opacity:0,transition:'opacity 0.15s'}}/>
                  <button
                    aria-label={`Remove screenshot ${i+1}`}
                    onClick={e=>{e.stopPropagation();smf(m=>({...m,screenshots:m.screenshots.filter((_,j)=>j!==i)}));}}
                    style={{position:'absolute',top:5,right:5,background:'rgba(2,6,23,0.65)',border:'none',color:'#fff',borderRadius:6,width:22,height:22,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}
                  ><i className="ti ti-trash" aria-hidden="true"/></button>
                </div>
              ))}
              <label style={{aspectRatio:'1',border:'1px dashed var(--border)',borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)',gap:4}}>
                <i className="ti ti-photo-plus" style={{fontSize:20}} aria-hidden="true"/>
                <span style={{fontSize:11}}>Add</span>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)addManualImage(f);}}/>
              </label>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>Paste with Ctrl+V or Cmd+V into the notes box, or browse to add screenshots.</div>
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Stake: {f$(stake.actual)} · Risk: {fp(stake.eff)}</div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={{...btn('pri'),flex:1}} onClick={addManual} disabled={saving}>{saving?'Saving…':'Save entry'}</button>
            <button style={btn()} onClick={()=>setManual(false)} disabled={saving}>Cancel</button>
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
                </div>
              </div>
              <button style={btn()} onClick={()=>setSelectedTrade(null)}>Close</button>
            </div>
            <div style={{display:'grid',gap:12}}>
              <div>
                <label style={lbl}>Screenshots {editDraft.screenshots?.length>0&&<span style={{color:'var(--text-muted)',fontWeight:400}}>({editDraft.screenshots.length})</span>}</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(92px,1fr))',gap:10,marginBottom:8}}>
                  {editDraft.screenshots?.map((src,i)=>(
                    <div key={i} className="gm-gallery-tile" style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',background:'var(--surface-0)',cursor:'zoom-in'}} onClick={()=>openTradeImage(i)}>
                      <img src={src.url} alt={`Screenshot ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      <div className="gm-gallery-overlay" style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.55) 100%)',opacity:0,transition:'opacity 0.15s'}}/>
                      <button
                        aria-label={`Remove screenshot ${i+1}`}
                        onClick={e=>{e.stopPropagation();const next=editDraft.screenshots.filter((_,j)=>j!==i);setEditDraft(d=>({...d,screenshots:next}));setSelectedTrade(s=>s?{...s,screenshots:next.map(x=>x.b64)}:s);}}
                        style={{position:'absolute',top:5,right:5,background:'rgba(2,6,23,0.65)',border:'none',color:'#fff',borderRadius:6,width:22,height:22,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}
                      ><i className="ti ti-trash" aria-hidden="true"/></button>
                    </div>
                  ))}
                  <label style={{aspectRatio:'1',border:'1px dashed var(--border)',borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)',gap:4}}>
                    <i className="ti ti-photo-plus" style={{fontSize:20}} aria-hidden="true"/>
                    <span style={{fontSize:11}}>Add</span>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)addTradeImage(f);}}/>
                  </label>
                </div>
                {(!editDraft.screenshots||editDraft.screenshots.length===0)&&<div style={{padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:13}}>No screenshots attached to this entry.</div>}
              </div>
              <div style={card}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Notes</div>
                <textarea aria-label="Journal notes" value={editDraft.notes} onChange={e=>setEditDraft(d=>({...d,notes:e.target.value}))} onPaste={onTradePaste} style={{...inp,minHeight:96,resize:'vertical'}} placeholder="Add notes and paste screenshots here"/>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Tip: press Ctrl+V or Cmd+V here to add screenshots quickly.</div>
              </div>
              {editErr&&<Alert type="dan" title="Could not save" body={editErr}/>}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <button style={{...btn('pri'),flex:1}} onClick={saveTradeEdits} disabled={savingEdit}>{savingEdit?'Saving…':'Save edits'}</button>
                <button style={btn()} onClick={()=>setSelectedTrade(null)} disabled={savingEdit}>Cancel</button>
                <button style={btn('dan')} onClick={()=>setConfirmingDelete(true)}>Delete</button>
                {savedFlash&&<span style={{fontSize:12,color:'var(--text-success)',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-check" aria-hidden="true"/>Saved</span>}
              </div>
              <div style={card}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>{selectedTrade.gateResults?.length?'Gate check':'Zone analysis criteria'}</div>
                {selectedTrade.gateResults?.length
                  ?<Gates gates={selectedTrade.gateResults} score={selectedTrade.score} grade={selectedTrade.zoneGrade}/>
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

      {confirmingDelete&&(
        <ConfirmDialog
          title="Delete this trade entry?"
          body="This permanently removes the entry, its notes, and its screenshots. This cannot be undone."
          confirmLabel="Delete entry"
          onCancel={()=>setConfirmingDelete(false)}
          onConfirm={()=>{deleteTrade(selectedTrade);setConfirmingDelete(false);setSelectedTrade(null);}}
        />
      )}

      {preview&&(
        <div
          role="dialog" aria-label="Image preview"
          style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.92)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1100}}
          onClick={()=>setPreview(null)}
          tabIndex={-1}
          ref={el=>el?.focus()}
          onKeyDown={e=>{
            const n=preview.items.length;
            if(e.key==='Escape')setPreview(null);
            if(e.key==='ArrowRight')setPreview(p=>({...p,index:(p.index+1)%n}));
            if(e.key==='ArrowLeft')setPreview(p=>({...p,index:(p.index-1+n)%n}));
          }}
        >
          <div style={{position:'relative',maxWidth:'92vw',maxHeight:'92vh',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
            <button type="button" style={{...btn('dan'),position:'absolute',top:8,right:8}} onClick={()=>setPreview(null)}>Close</button>
            {preview.items.length>1&&(
              <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',fontSize:12,color:'#fff',background:'rgba(2,6,23,0.65)',borderRadius:999,padding:'3px 10px'}}>{preview.index+1} / {preview.items.length}</div>
            )}
            {preview.items.length>1&&(<>
              <button type="button" aria-label="Previous screenshot" style={{...btn(),position:'absolute',left:8,top:'50%',transform:'translateY(-50%)'}} onClick={()=>setPreview(p=>({...p,index:(p.index-1+p.items.length)%p.items.length}))}><i className="ti ti-chevron-left" aria-hidden="true"/></button>
              <button type="button" aria-label="Next screenshot" style={{...btn(),position:'absolute',right:8,top:'50%',transform:'translateY(-50%)'}} onClick={()=>setPreview(p=>({...p,index:(p.index+1)%p.items.length}))}><i className="ti ti-chevron-right" aria-hidden="true"/></button>
            </>)}
            <img src={preview.items[preview.index]} alt={`Screenshot ${preview.index+1} of ${preview.items.length}`} style={{maxWidth:'100%',maxHeight:'92vh',objectFit:'contain',borderRadius:16,border:'1px solid var(--border)',boxShadow:'0 20px 60px rgba(0,0,0,0.45)'}}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Money Management ──────────────────────────────────────────────────────────
// Milestones and the growth projector follow the global Demo/Real toggle, so
// growth can be envisioned on Demo too. Withdrawal logging stays Real-only —
// Demo has no concept of a withdrawal.
function Money({settings,trades,wds,saveWds,mode}){
  const startBal=getStartingBalanceForMode(settings,mode);
  const bal=balForMode(settings,trades,wds,mode);
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const[amt,setAmt]=useState('');
  const[note,setNote]=useState('');
  const[wks,setWks]=useState(12);
  const stake=calcStake(bal,settings);
  const done=modeTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const actualWr=done.length?wins/done.length:0.65;
  const[wrOverride,setWrOverride]=useState(null);
  const wr=(wrOverride!=null?wrOverride:Math.round(actualWr*100))/100;
  const totalWd=wds.reduce((s,w)=>s+w.amount,0);
  const firstMs=settings.milestones[0];
  const phase1Thresh=settings.brokerMin/(firstMs.pct/100);
  const isPhase1=bal<phase1Thresh;
  const hitMs=settings.milestones.slice().reverse().find(m=>bal>=startBal*m.mul);
  const nextMs=settings.milestones.find(m=>bal<startBal*m.mul);
  const nextMilestoneMessage=nextMs?`Next ${mode==='REAL'?'withdrawal ':''}milestone: ${nextMs.mul}× → ${f$(startBal*nextMs.mul)}${mode==='REAL'?` (withdraw ${nextMs.pct}%)`:''}.`:null;

  async function logWd(){
    const a=parseFloat(amt);if(!a||a<settings.brokerMin)return;
    await saveWds([{id:uid(),timestamp:Date.now(),date:tod(),amount:a,balanceBefore:bal,balanceAfter:bal-a,notes:note},...wds]);
    setAmt('');setNote('');
  }

  const proj=[];let b=bal;
  for(let i=0;i<=wks;i++){proj.push(b);const tw=settings.sessionsPerDay*6,ws=tw*wr,ls=tw-ws,stk=calcStake(b,settings).actual;b=b+(ws*stk*PAYOUT)-(ls*stk);}
  const maxP=Math.max(...proj);

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Money management</div>

      {mode!=='REAL'&&<Alert type="inf" title="Viewing Demo growth" body="Milestones and the growth projector below reflect your Demo balance — this is for practice only. Demo has no real withdrawals; switch to Real to log an actual withdrawal."/>}

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Position sizer</div>
        <div style={g3}>
          <Metric label="Balance" value={f$(bal)}/>
          <Metric label={settings.riskMode==='FIXED'?'Fixed stake':'Risk %'} value={settings.riskMode==='FIXED'?f$(settings.riskAmount):fp(settings.riskPercent)}/>
          <Metric label="Trade stake" value={f$(stake.actual)} color="var(--text-accent)"/>
        </div>
        {settings.riskMode!=='FIXED'&&stake.eff>settings.riskPercent*1.1&&(
          <div style={{fontSize:12,color:'var(--text-warning)',marginTop:8,padding:'6px 10px',background:'var(--bg-warning)',borderRadius:'var(--radius)'}}>
            ⚠ $1 minimum means effective risk is {fp(stake.eff)} — above your target {fp(settings.riskPercent)}. Balance needs {f$(1/(settings.riskPercent/100))} for correct sizing.
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Withdrawal milestones</div>
        {isPhase1
          ?<div style={{padding:'8px 12px',background:'var(--bg-accent)',borderRadius:'var(--radius)',marginBottom:12,fontSize:13,color:'var(--text-accent)'}}>🔒 Phase 1 — Compounding. {mode==='REAL'?`First withdrawal advised at ${f$(phase1Thresh)}.`:`Keeps growing past ${f$(phase1Thresh)}.`}</div>
          :hitMs&&<div style={{padding:'8px 12px',background:'var(--bg-success)',borderRadius:'var(--radius)',marginBottom:12,fontSize:13,color:'var(--text-success)'}}>Milestone {hitMs.mul}× reached{mode==='REAL'?` — consider withdrawing ${hitMs.pct}% (≈${f$(bal*(hitMs.pct/100))}). Advisory only.`:'.'}</div>
        }
        {settings.milestones.map((m,i)=>{
          const target=startBal*m.mul;
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
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:12,color:'var(--text-muted)'}}>Win rate:</span>
          <input type="range" min="0" max="100" step="1" value={Math.round(wr*100)} onChange={e=>setWrOverride(+e.target.value)} style={{width:100}}/>
          <span style={{fontSize:12,fontFamily:'var(--font-mono)',minWidth:32}}>{Math.round(wr*100)}%</span>
          {wrOverride!=null&&<button onClick={()=>setWrOverride(null)} style={{fontSize:11,color:'var(--text-accent)',background:'none',border:'none',cursor:'pointer',padding:0}}>Reset to actual ({fp(actualWr*100)})</button>}
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:2,height:72}}>
          {proj.map((v,i)=>(
            <div key={i} title={f$(v)} style={{flex:1,background:i===0?'var(--border-strong)':'var(--fill-accent)',borderRadius:'2px 2px 0 0',height:`${Math.max(4,(v/maxP)*100)}%`,opacity:0.6+(i/proj.length)*0.4}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginTop:4}}>
          <span>Now: {f$(bal)}</span><span>{wks}w: {f$(proj[proj.length-1])}</span>
        </div>
        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Based on {fp(wr*100)} win rate{wrOverride!=null?' (custom)':''} · {fp(settings.riskPercent)} risk · {settings.sessionsPerDay*6} trades/week</div>
      </div>

      {mode==='REAL'&&(
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
      )}

      {mode==='REAL'&&wds.length>0&&(
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
const ZONE_CHECKLIST=[
  {k:'base',label:'BASE — 1–3 tight candles?'},
  {k:'departure',label:'DEPARTURE — One explosive candle (big body, small wick)?'},
  {k:'structure',label:'BROKEN STRUCTURE — Broke a recent swing high/low?'},
  {k:'fresh',label:'FRESH — Untouched since formed?'},
  {k:'trend',label:'TREND — With trend (not counter-trend)?'},
  {k:'location',label:'LOCATION — At swing point (not chop)?'},
  {k:'distance',label:'DISTANCE — Clear move away before return?'},
  {k:'width',label:'WIDTH — One precise price level?'},
];

function Plan({settings}){
  const[zoneCheck,setZoneCheck]=useState({});
  const zoneCheckedCount=Object.values(zoneCheck).filter(Boolean).length;
  const sn={1:'Precision (Style 1)',2:'Active (Style 2)',3:'Structured (Style 3)'};
  const sr={
    1:['1 trade per session maximum','Session ends after that trade regardless of outcome',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
    2:['Up to 5 trades per session','Stop: 2 consecutive losses OR net -2 on session','Take profit: 3 wins',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
    3:['Up to 3 trades per session','Stop: 2 losses on session','Advisory: 2 consecutive wins — consider securing','Take profit: 3 wins',`Max ${settings.sessionsPerDay} session${settings.sessionsPerDay>1?'s':''}/day`,'6-hour gap between sessions'],
  };
  const sections=[
    {t:'Zone rules',items:['A+, A, or B graded zones only','Zone must pass the 10-gate AI validation, including all 4 hard filters','Confirm a live Tier 1 trigger on the 10-second chart yourself before entry — the app no longer tracks this','Use zone analyzer before every trade','No C-grade or invalid zones']},
    {t:'Instrument rules',items:['OTC pairs only','Minimum 90%+ ROI payout','Avoid any pair below 90% payout']},
    {t:'Risk rules',items:[settings.riskMode==='FIXED'?`${f$(settings.riskAmount)} fixed stake per trade`:`${settings.riskPercent}% risk per trade`,'$1 minimum trade (broker floor)','No Martingale or loss recovery','No mid-session risk increases']},
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
      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:500}}>Zone selection checklist <span style={{fontWeight:400,color:'var(--text-muted)'}}>({zoneCheckedCount}/{ZONE_CHECKLIST.length})</span></div>
          {zoneCheckedCount>0&&<button style={{...btn(),padding:'4px 10px',fontSize:12}} onClick={()=>setZoneCheck({})}>Reset</button>}
        </div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:10}}>Run through this before trusting a zone — tick as you confirm each one on the chart.</div>
        {ZONE_CHECKLIST.map(item=>(
          <label key={item.k} style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:13,color:zoneCheck[item.k]?'var(--text-primary)':'var(--text-secondary)',marginBottom:6,cursor:'pointer'}}>
            <input type="checkbox" checked={!!zoneCheck[item.k]} onChange={()=>setZoneCheck(z=>({...z,[item.k]:!z[item.k]}))} style={{marginTop:2}}/>
            <span style={{textDecoration:zoneCheck[item.k]?'line-through':'none'}}>{item.label}</span>
          </label>
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
// Auto-compiled "This Week"/"This Month" summary — pure computation over
// trades/analyses already loaded client-side (see computeDigest), no
// generated commentary, just numbers and a delta vs the prior equal-length
// period. Tone is deliberately factual: the trader applies their own judgment.
function ReviewDigest({trades,analyses}){
  const[period,setPeriod]=useState('WEEK');
  const[mode,setMode]=useState('DEMO');
  const{start,end,prevStart,prevEnd}=periodRange(period);
  const cur=computeDigest({trades,analyses,mode,start,end});
  const prev=computeDigest({trades,analyses,mode,start:prevStart,end:prevEnd});
  const wrDelta=(cur.total&&prev.total)?cur.wr-prev.wr:null;
  const pnlDelta=cur.realPnl-prev.realPnl;
  const periodLabel=period==='WEEK'?'This week (last 7 days)':'This month (last 30 days)';
  const prevLabel=period==='WEEK'?'last week':'last month';

  const tog=(items,val,setVal,colorFor)=>(
    <div className="flex rounded-sm p-1" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
      {items.map(it=>{
        const on=val===it.id;
        return(
          <button key={it.id} onClick={()=>setVal(it.id)} aria-pressed={on}
            className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold tracking-wide transition-colors"
            style={on?{background:colorFor?colorFor(it.id):'var(--fill-accent)',color:'#fff'}:{color:'var(--text-muted)'}}>{it.label}</button>
        );
      })}
    </div>
  );

  return(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {tog([{id:'WEEK',label:'This week'},{id:'MONTH',label:'This month'}],period,setPeriod)}
        {tog([{id:'DEMO',label:'Demo'},{id:'REAL',label:'Real'}],mode,setMode,id=>id==='REAL'?'var(--fill-danger)':'var(--fill-accent)')}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500}}>{periodLabel} · {mode==='REAL'?'Real':'Demo'}</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Auto-compiled from your logged trades — nothing to fill in.</div>

        <div style={g2}>
          <Metric label="Total trades" value={cur.totalTrades} sub={`${cur.demoCount} Demo / ${cur.realCount} Real (all accounts)`}/>
          <Metric
            label="Win rate"
            value={cur.total?fp(cur.wr):'—'}
            sub={cur.total?<WinRateCI wins={cur.wins} total={cur.total}/>:'No completed trades yet'}
            color={cur.total?(cur.wr>=65?'var(--text-success)':cur.wr>=52.6?'var(--text-accent)':'var(--text-danger)'):undefined}
          />
        </div>

        {wrDelta!=null&&(
          <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:10}}>
            Win rate {wrDelta>=0?'up':'down'} {Math.abs(Math.round(wrDelta))} point{Math.abs(Math.round(wrDelta))===1?'':'s'} from {prevLabel} ({fp(prev.wr)} → {fp(cur.wr)}).
          </div>
        )}

        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)',display:'grid',gap:8}}>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Best pair: {cur.bestPair?<>{cur.bestPair.pair} ({fp(cur.bestPair.wr)}, {cur.bestPair.total} trades)</>:'Not enough trades on any one pair yet (min. 3)'}
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Worst pair: {cur.worstPair?<>{cur.worstPair.pair} ({fp(cur.worstPair.wr)}, {cur.worstPair.total} trades)</>:'Not enough trades on any one pair yet (min. 3)'}
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Most common gate failure: {cur.topGateFailure?<>{cur.topGateFailure.label} ({cur.topGateFailure.count} of {cur.topGateFailure.ofAnalyses} analyzed zones you traded)</>:'No zone analyses linked to a logged trade this period'}
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Trades logged without zone analysis: {cur.unanalyzedTrades} of {cur.totalTrades} this period
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Real account P&L this period: <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:cur.realPnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(cur.realPnl>=0?'+':'')+f$(cur.realPnl)}</span> ({pnlDelta>=0?'+':''}{f$(pnlDelta)} vs {prevLabel})
          </div>
        </div>
      </div>
    </div>
  );
}

export function Analytics({trades,analyses,settings,bal}){
  const[scope,setScope]=useState('ALL');
  const[tab,setTab]=useState('OVERVIEW');
  const scoped=scope==='ALL'?trades:trades.filter(t=>getTradeMode(t)===scope);
  const done=scoped.filter(t=>t.outcome!=='PENDING');
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
  const doneAll=trades.filter(t=>t.outcome!=='PENDING');
  const modeStats=ACCOUNT_MODES.map(mode=>{
    const modeTrades=doneAll.filter(t=>getTradeMode(t)===mode);
    const modeWins=modeTrades.filter(t=>t.outcome==='WIN').length;
    const modePnl=modeTrades.reduce((s,t)=>s+t.pnl,0);
    const startBalance=getStartingBalanceForMode(settings,mode);
    const growth=startBalance?((startBalance+modePnl-startBalance)/startBalance)*100:0;
    return {mode, trades:modeTrades, wins:modeWins, wr:modeTrades.length?(modeWins/modeTrades.length)*100:0, pnl:modePnl, growth};
  });

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Analytics</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div className="flex rounded-sm p-1" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
            {[{id:'OVERVIEW',label:'Overview'},{id:'REVIEW',label:'Review'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} aria-pressed={tab===t.id}
                className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold tracking-wide transition-colors"
                style={tab===t.id?{background:'var(--fill-accent)',color:'#fff'}:{color:'var(--text-muted)'}}>{t.label}</button>
            ))}
          </div>
          {tab==='OVERVIEW'&&(
            <div className="flex rounded-sm p-1" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
              {['ALL',...ACCOUNT_MODES].map(m=>{
                const on=scope===m;
                const isReal=m==='REAL';
                return(
                  <button key={m} onClick={()=>setScope(m)} aria-pressed={on}
                    className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold tracking-wide transition-colors"
                    style={on?{background:isReal?'var(--fill-danger)':'var(--fill-accent)',color:'#fff'}:{color:'var(--text-muted)'}}>
                    {m==='ALL'?'All':m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {tab==='REVIEW'?<ReviewDigest trades={trades} analyses={analyses}/>:<>

      <div style={g2}>
        <Metric label="Total trades" value={total} sub={`${wins}W / ${total-wins}L`}/>
        <Metric label="Win rate" value={fp(wr)} sub={total?<>Break-even: {fp(be*100)}<br/><WinRateCI wins={wins} total={total}/></>:`Break-even: ${fp(be*100)}`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':'var(--text-danger)'}/>
        <Metric label="Expected value/trade" value={(ev>=0?'+':'')+f$(ev)} color={ev>=0?'var(--text-success)':'var(--text-danger)'}/>
        <Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/>
      </div>

      {scope==='ALL'&&(
      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Performance by account mode</div>
        <div style={g2}>
          {modeStats.map(stat=>(
            <div key={stat.mode} style={{...card,marginBottom:0,borderLeft:`3px solid ${stat.mode==='REAL'?'var(--fill-danger)':'var(--fill-accent)'}`}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6,color:stat.mode==='REAL'?'var(--text-danger)':'var(--text-accent)'}}>{stat.mode==='REAL'?'Real':'Demo'}</div>
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
      )}

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
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}><WinRateCI wins={x.wins} total={x.total}/></div>
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
      </>}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Cfg({settings,saveSettings,ss,resetAccount}){
  const[f,sf]=useState({...settings,tradeStyleDemo:settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1,tradeStyleReal:settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1,startingBalanceDemo:settings?.startingBalanceDemo ?? 0,startingBalanceReal:settings?.startingBalanceReal ?? 0,riskMode:settings?.riskMode ?? 'PERCENT',riskAmount:settings?.riskAmount ?? 5});
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
          {[{id:'gemini',label:'OpenRouter'},{id:'groq',label:'Groq'}].map(p=>(
            <button key={p.id} style={{...btn((f.aiProvider||'gemini')===p.id?'pri':'def'),flex:1}} onClick={()=>set('aiProvider',p.id)}>{p.label}</button>
          ))}
        </div>
        {(f.aiProvider||'gemini')==='gemini'?(
          <div>
            <label style={lbl}>OpenRouter API key</label>
            <input style={inp} type="password" placeholder="sk-or-v1-..." value={f.apiKey||''} onChange={e=>set('apiKey',e.target.value)}/>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Free key at <a href="https://openrouter.ai/keys" style={{color:'var(--text-accent)'}}>openrouter.ai</a> · Model: nemotron-nano-12b-vl (free)</div>
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
        <div style={{marginTop:10}}>
          <label style={lbl}>Risk sizing</label>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            {[{id:'PERCENT',label:'% of balance'},{id:'FIXED',label:'Fixed $ amount'}].map(m=>(
              <button key={m.id} style={{...btn((f.riskMode||'PERCENT')===m.id?'pri':'def'),flex:1}} onClick={()=>set('riskMode',m.id)}>{m.label}</button>
            ))}
          </div>
          {(f.riskMode||'PERCENT')==='PERCENT'?(
            <>
              <label style={lbl}>Risk per trade: {f.riskPercent}%</label>
              <input type="range" min="1" max="20" step="0.5" value={f.riskPercent} onChange={e=>set('riskPercent',parseFloat(e.target.value))} style={{width:'100%'}}/>
            </>
          ):(
            <>
              <label style={lbl}>Fixed stake per trade ($)</label>
              <input style={inp} type="number" min="1" step="0.5" value={f.riskAmount} onChange={e=>set('riskAmount',parseFloat(e.target.value))}/>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Every trade stakes this amount regardless of balance — change it anytime, it applies from your next stake calculation.</p>
            </>
          )}
        </div>
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
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>6-hour gap enforced between standard sessions; shorter cooldown for no-trade sessions.</p>
        </div>
        <div style={{marginTop:14}}>
          <label style={lbl}>Session duration per style</label>
          {STYLES.map(st=>{
            const[dmin,dmax]=DURATION_BOUNDS[st.id];
            const val=f.sessionDurations?.[st.id] ?? DEF_DURATIONS[st.id];
            return(
              <div key={st.id} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>
                  <span>{st.name}</span><span>{val} min</span>
                </div>
                <input type="range" min={dmin} max={dmax} step="1" value={val}
                  onChange={e=>set('sessionDurations',{...(f.sessionDurations||DEF_DURATIONS),[st.id]:parseInt(e.target.value,10)})}
                  style={{width:'100%'}}/>
              </div>
            );
          })}
          <p style={{fontSize:11,color:'var(--text-muted)'}}>Applies to new sessions only — an active session keeps the duration it started with.</p>
        </div>

        {/* ── No-trade session cooldown ────────────────────────────────── */}
        <div style={{marginTop:14}}>
          <label style={lbl}>No-trade cooldown <span style={{fontWeight:400,fontSize:11,color:'var(--text-muted)'}}>({f.noTradeGapMin} min)</span></label>
          <input type="range" min={60} max={120} step="5" value={f.noTradeGapMin}
            onChange={e=>set('noTradeGapMin',parseInt(e.target.value,10))}
            style={{width:'100%'}}/>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
            When a session ends with no trades taken, this shorter cooldown applies instead of the standard 6-hour gap.
            After {MAX_NO_TRADE_STREAK} consecutive no-trade sessions, the next session reverts to the full 6-hour gap.
          </p>
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
      <div style={{textAlign:'center',fontSize:11,color:'var(--text-muted)',marginTop:12}}>Music via Jamendo</div>
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

// ── Landing Page ──────────────────────────────────────────────────────────────
function Landing({onLogin}){
  const features=[
    {icon:ScanSearch,title:'AI Zone Analyzer',desc:'Upload a chart screenshot and let AI validate your supply/demand zone against 10 strict structural gates, 4 of them hard filters, before you enter a trade.'},
    {icon:BookOpen,title:'Trade Journal',desc:'Log every trade with screenshots, notes, zone grades, and outcomes. Track your execution quality over time.'},
    {icon:BarChart3,title:'Performance Analytics',desc:'Deep-dive into your win rate by zone grade, pair, and account mode. See if AI analysis actually improves your results.'},
    {icon:Wallet,title:'Money Management',desc:'Position sizing, milestone-based withdrawal tracking, and growth projection based on your actual win rate.'},
    {icon:ClipboardList,title:'Trading Plan',desc:'Your rules, your style. A zone-selection checklist, pre-trade checklist, and discipline guidelines keep you consistent and away from emotional overtrading.'},
    {icon:Timer,title:'Session Timer',desc:'Each trade style carries its own adjustable session duration, with pause and auto-resume. A session ends the moment time runs out or your trade-limit rules trigger — whichever comes first.'},
    {icon:Sparkles,title:'Focus Music',desc:'Free lofi and ambient tracks play in the background for the length of your session, then stop automatically when it ends.'},
  ];

  const gates=[
    {n:'1',label:'Base Structure',desc:'1-2 candle consolidation'},
    {n:'2',label:'Departure Strength',desc:'Strong impulsive departure',crit:true},
    {n:'3',label:'Break of Structure',desc:'Breaks a significant swing',crit:true},
    {n:'4',label:'Freshness',desc:'First retest only',crit:true},
    {n:'5',label:'Trend Alignment',desc:'Matches higher timeframe',crit:true},
    {n:'6',label:'Zone Location',desc:'Swing extreme or liquidity sweep'},
    {n:'7',label:'Distance Ratio',desc:'3x zone width travel'},
    {n:'8',label:'Compact Zone',desc:'Tight relative to departure'},
    {n:'9',label:'Return Quality',desc:'Corrective, fading momentum'},
    {n:'10',label:'No Conflicts',desc:'Clean path to target'},
  ];

  const steps=[
    {n:'01',icon:ScanSearch,title:'Analyze',desc:'Upload your chart. AI evaluates the zone against 10 strict gates, 4 of them hard filters, and returns a grade.'},
    {n:'02',icon:CircleCheck,title:'Confirm',desc:'Watch the live 10-second chart yourself and confirm a Tier 1 trigger before entering — this step is on you, not tracked in-app.'},
    {n:'03',icon:BookOpen,title:'Journal',desc:'Log the trade with one click. Screenshots, notes, and analysis data carry over automatically.'},
    {n:'04',icon:BarChart3,title:'Improve',desc:'Review your analytics. See which grades, pairs, and styles produce the best results.'},
  ];

  return(
    <div className="ld-wrap">
      {/* ── Nav ── */}
      <nav className="ld-nav">
        <div className="ld-nav-inner">
          <div className="ld-nav-brand">
            <div className="ld-nav-icon"><Sparkles size={14} color="#fff"/></div>
            <span>TheGiftedMan</span>
          </div>
          <button className="ld-btn ld-btn-ghost" onClick={()=>onLogin()}>Log in</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="ld-hero">
        <div className="ld-orb ld-orb-1"/>
        <div className="ld-orb ld-orb-2"/>
        <div className="ld-orb ld-orb-3"/>
        <div className="ld-hero-content">
          <div className="ld-badge">AI-Powered Trading System</div>
          <h1 className="ld-hero-title">Master Your Trading<br/>with <span className="ld-gradient-text">Precision</span></h1>
          <p className="ld-hero-sub">Validate zones with AI, journal every trade, manage risk intelligently, and analyze your performance — all in one workspace built for disciplined traders.</p>
          <div className="ld-hero-ctas">
            <button className="ld-btn ld-btn-primary ld-btn-lg" onClick={()=>onLogin()}>Get Started Free</button>
            <a href="#features" className="ld-btn ld-btn-outline ld-btn-lg">See Features</a>
          </div>
          <div className="ld-hero-proof">
            <div className="ld-proof-dots">
              <div className="ld-proof-dot" style={{background:'var(--text-success)'}}/>
              <div className="ld-proof-dot" style={{background:'var(--accent)'}}/>
              <div className="ld-proof-dot" style={{background:'var(--text-warning)'}}/>
            </div>
            <span>Free AI via OpenRouter &amp; Groq — no paid API needed</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="ld-section">
        <div className="ld-section-inner">
          <div className="ld-section-head">
            <div className="ld-section-tag">Features</div>
            <h2 className="ld-section-title">Everything You Need to Trade with Discipline</h2>
            <p className="ld-section-sub">Seven integrated modules that work together to keep you consistent, data-driven, and in control.</p>
          </div>
          <div className="ld-features-grid">
            {features.map((f,i)=>(
              <div key={i} className="ld-feature-card" style={{animationDelay:`${i*80}ms`}}>
                <div className="ld-feature-icon"><f.icon size={22}/></div>
                <div className="ld-feature-title">{f.title}</div>
                <div className="ld-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Analyzer Showcase ── */}
      <section className="ld-section ld-section-alt">
        <div className="ld-section-inner">
          <div className="ld-analyzer-layout">
            <div className="ld-analyzer-text">
              <div className="ld-section-tag">AI-Powered</div>
              <h2 className="ld-section-title" style={{textAlign:'left'}}>10-Gate Zone Validation</h2>
              <p className="ld-section-sub" style={{textAlign:'left',maxWidth:480}}>Every setup is evaluated against 10 strict binary gates — 4 of them hard filters that instantly invalidate the zone if any one fails. No curves, no partial credit — a zone either meets the standard or it doesn't. This keeps you out of borderline trades.</p>
              <div className="ld-analyzer-grades">
                <div className="ld-grade-item"><span className="ld-grade-pill ld-grade-aplus">A+</span><span>10/10 gates — highest conviction</span></div>
                <div className="ld-grade-item"><span className="ld-grade-pill ld-grade-aplus">A</span><span>9/10 gates — strong setup</span></div>
                <div className="ld-grade-item"><span className="ld-grade-pill ld-grade-b">B</span><span>7-8/10 gates — valid setup</span></div>
                <div className="ld-grade-item"><span className="ld-grade-pill ld-grade-c">C</span><span>5-6/10 gates — marginal, trade with caution</span></div>
                <div className="ld-grade-item"><span className="ld-grade-pill ld-grade-inv">INVALID</span><span>Any hard filter failed, or below 5/10 — do not trade</span></div>
              </div>
            </div>
            <div className="ld-gates-grid">
              {gates.map((g,i)=>(
                <div key={i} className="ld-gate-item" style={{animationDelay:`${i*60}ms`}}>
                  <div className="ld-gate-num">{g.n}</div>
                  <div>
                    <div className="ld-gate-label">{g.label}{g.crit&&<span style={{marginLeft:6,fontSize:9,fontWeight:700,letterSpacing:'0.06em',color:'var(--text-danger)',background:'var(--bg-danger)',border:'1px solid var(--border-danger)',borderRadius:4,padding:'1px 5px'}}>CRITICAL</span>}</div>
                    <div className="ld-gate-desc">{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="ld-section">
        <div className="ld-section-inner">
          <div className="ld-section-head">
            <div className="ld-section-tag">Workflow</div>
            <h2 className="ld-section-title">From Analysis to Improvement in 4 Steps</h2>
          </div>
          <div className="ld-steps-grid">
            {steps.map((s,i)=>(
              <div key={i} className="ld-step-card" style={{animationDelay:`${i*100}ms`}}>
                <div className="ld-step-num">{s.n}</div>
                <div className="ld-step-icon-wrap"><s.icon size={24}/></div>
                <div className="ld-step-title">{s.title}</div>
                <div className="ld-step-desc">{s.desc}</div>
                {i<3&&<div className="ld-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="ld-section ld-section-alt">
        <div className="ld-section-inner">
          <div className="ld-stats-row">
            {[
              {val:'24+',label:'OTC Pairs'},
              {val:'10',label:'Validation Gates'},
              {val:'3',label:'Trade Styles'},
              {val:'6',label:'Withdrawal Milestones'},
              {val:'100%',label:'Free AI'},
            ].map((s,i)=>(
              <div key={i} className="ld-stat-item">
                <div className="ld-stat-val">{s.val}</div>
                <div className="ld-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="ld-section ld-cta-section">
        <div className="ld-section-inner" style={{textAlign:'center'}}>
          <h2 className="ld-cta-title">Start Trading with Precision Today</h2>
          <p className="ld-cta-sub">Join a system built for traders who value discipline over impulse. Free to use, powered by AI.</p>
          <button className="ld-btn ld-btn-primary ld-btn-xl" onClick={()=>onLogin()}>Get Started Free</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div className="ld-footer-brand">
            <div className="ld-nav-icon" style={{width:28,height:28,borderRadius:8}}><Sparkles size={13} color="#fff"/></div>
            <span>TheGiftedMan Trading Tool</span>
          </div>
          <div className="ld-footer-copy">Built for disciplined traders. Not financial advice.</div>
        </div>
      </footer>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({onBack}){
  const[mode,setMode]=useState('signin');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPw,setShowPw]=useState(false);
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
        {/* Back button */}
        {onBack&&<button type="button" onClick={onBack} className="login-back">← Back</button>}

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
              <div style={{position:'relative'}}>
                <input className="login-input" style={{paddingRight:40}} type={showPw?'text':'password'} required minLength={6} placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)}/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?'Hide password':'Show password'} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:6,display:'flex',color:'var(--text-muted)'}}>
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
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
  const[view,setView]=useState(()=>sessionStorage.getItem('gm_view')||'dashboard');
  const[page,setPage]=useState(()=>sessionStorage.getItem('gm_page')||'landing');
  const[pa,setPA]=useState(null);
  const[theme,setTheme]=useState(()=>localStorage.getItem('gm_theme')||'dark');
  const[mobileNavOpen,setMobileNavOpen]=useState(false);
  const userId=authUser?.id??null;
  const prevUserId=useRef(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setAuthUser(session?.user||null);setAuthLoading(false);}).catch(()=>setAuthLoading(false));
    const{data:sub}=supabase.auth.onAuthStateChange((_e,session)=>{
      const next=session?.user||null;
      setAuthUser(prev=>prev?.id===next?.id?prev:next);
    });
    return()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!userId){setSettings(null);setTrades([]);setAnalyses([]);setWds([]);setSS(null);setLoading(false);prevUserId.current=null;return;}
    if(prevUserId.current===userId)return;
    prevUserId.current=userId;
    setLoading(true);
    (async()=>{
      await maybeMigrateLocal(userId);
      const[{data:s},{data:t},{data:sessRows},{data:w},{data:a}]=await Promise.all([
        supabase.from('settings').select('*').eq('user_id',userId).maybeSingle(),
        supabase.from('trades').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
        supabase.from('sessions').select('*').eq('user_id',userId).eq('date',tod()),
        supabase.from('withdrawals').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
        supabase.from('zone_analyses').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
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
  },[userId]);

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gm_theme', theme); // device preference, not account data
  },[theme]);

  // so a background-tab reload (Chrome tab discard, dev-server reconnect) restores
  // the same screen instead of snapping back to the dashboard
  useEffect(()=>{sessionStorage.setItem('gm_view',view);},[view]);
  useEffect(()=>{sessionStorage.setItem('gm_page',page);},[page]);

  const saveSettings=async v=>{
    const normalized={
      ...v,
      tradeStyleDemo:v.tradeStyleDemo ?? v.tradeStyle ?? 1,
      tradeStyleReal:v.tradeStyleReal ?? v.tradeStyle ?? 1,
      startingBalanceDemo:parseFloat(v.startingBalanceDemo||0),
      startingBalanceReal:parseFloat(v.startingBalanceReal||0),
    };
    setSettings(normalized);
    if(authUser){
      const{error:dbErr}=await supabase.from('settings').upsert(toSettingsRow(authUser.id,normalized));
      if(dbErr)throw new Error(dbErr.message);
    }
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

  // Lives here (not inside Dashboard) so the <audio> element is never
  // unmounted by navigation — leaving the Dashboard used to silence the music.
  const active=getActive(todaySS,mode);
  const music=useMusicPlayer(active);

  // Reconciles active sessions against actual trade data whenever trades or
  // sessions change.  This heals sessions created under the old buggy code where
  // manual trades didn't update session counters or trigger chkLock, and also
  // catches any edge case where setOutcome/addManual failed to lock a session.
  useEffect(()=>{
    if(!todaySS||!trades.length||!settings)return;
    let changed=false;
    const nextSessions=todaySS.sessions.map(sess=>{
      if(!sess.isActive||sess.isLocked)return sess;
      const sessionTrades=trades
        .filter(t=>getTradeMode(t)===sess.accountMode&&t.sessionNum===sess.num)
        .sort((a,b)=>a.timestamp-b.timestamp);
      if(!sessionTrades.length)return sess;
      // Rebuild counters from scratch (in order) so streaks are correct.
      let w=0,l=0,tc=0,cl=0,cw=0,sp=0;
      for(const t of sessionTrades){
        if(t.outcome==='PENDING'){tc++;continue;}
        tc++;
        if(t.outcome==='WIN'){w++;cw++;cl=0;}
        if(t.outcome==='LOSS'){l++;cl++;cw=0;}
        sp+=t.pnl||0;
      }
      const nl=Math.max(0,l-w);
      const rebuilt={...sess,trades:tc,wins:w,losses:l,conLoss:cl,conWin:cw,netLoss:nl,sPnl:sp};
      const lk=chkLock(rebuilt,getTradeStyleForMode(settings,sess.accountMode));
      if(lk.locked){
        changed=true;
        // Use the last resolved trade's timestamp as endTime so the 6h
        // session gap is measured from when trading actually stopped,
        // not from when this reconciliation runs.
        const lastTrade=sessionTrades.filter(t=>t.outcome!=='PENDING').pop();
        const endTime=lastTrade?lastTrade.timestamp:Date.now();
        return{...rebuilt,isActive:false,isLocked:true,lockReason:lk.reason,lockCode:lk.code,endTime};
      }
      return sess;
    });
    if(changed)saveSS({...todaySS,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
  },[todaySS,trades,settings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Correctness backstop: commits a TIME_EXPIRED session end even if the user
  // never has the Dashboard mounted to catch it (e.g. sitting in Journal past
  // the timer). The Dashboard's own tick does this immediately when visible;
  // this just guarantees it eventually happens so endTime/isActive never dangle.
  useEffect(()=>{
    if(!todaySS)return;
    const id=setInterval(()=>{
      const now=Date.now();
      let changed=false;
      const nextSessions=todaySS.sessions.map(s=>{
        if(s.isActive&&!s.isLocked&&isSessionTimeExpired(s,now)){
          changed=true;
          const noTrade=s.trades===0;
          return{...s,isActive:false,isLocked:true,lockReason:noTrade?'No qualifying setup found':'Time expired',lockCode:noTrade?'TIME_EXPIRED_NO_TRADE':'TIME_EXPIRED',endTime:now};
        }
        return s;
      });
      if(changed)saveSS({...todaySS,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
    },15000);
    return()=>clearInterval(id);
  },[todaySS]); // eslint-disable-line react-hooks/exhaustive-deps

  if(authLoading)return<Loading/>;
  if(!isSupabaseConfigured)return(
    <div style={{maxWidth:440,margin:'4rem auto',padding:'1rem',textAlign:'center'}}>
      <div style={{fontSize:18,fontWeight:500,color:'var(--text-danger)',marginBottom:8}}>Supabase not configured</div>
      <div style={{fontSize:13,color:'var(--text-secondary)'}}>
        Set <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> environment variables, then rebuild and redeploy.
      </div>
    </div>
  );
  if(!authUser)return page==='login'?<Login onBack={()=>setPage('landing')}/>:<Landing onLogin={()=>setPage('login')}/>;
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
              <button onClick={()=>{supabase.auth.signOut();setPage('landing');}} aria-label="Log out" className="flex flex-1 items-center justify-center rounded-sm py-2 text-ink-3 transition-colors hover:text-loss" style={{border:'1px solid var(--border)',background:'var(--surface-1)'}}>
                <LogOut size={15}/>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between rounded px-4 py-3 lg:hidden" style={{background:'var(--surface-1)',border:'1px solid var(--border)'}}>
            <div className="flex items-center gap-2.5">
              <button onClick={()=>setMobileNavOpen(true)} aria-label="Open menu" className="rounded-sm p-2 text-ink-3" style={{border:'1px solid var(--border)'}}>
                <Menu size={15}/>
              </button>
              <div className="flex h-7 w-7 items-center justify-center rounded-sm text-white" style={{background:'var(--fill-accent)'}}><Sparkles size={13}/></div>
              <div className="text-[13px] font-semibold text-ink">TheGiftedMan</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setTheme(THEMES[(THEMES.findIndex(t=>t.id===theme)+1)%THEMES.length].id)} aria-label="Next theme" className="rounded-sm p-2 text-ink-3" style={{border:'1px solid var(--border)'}}>
                <Palette size={15}/>
              </button>
              <button onClick={()=>{supabase.auth.signOut();setPage('landing');}} aria-label="Log out" className="rounded-sm p-2 text-ink-3" style={{border:'1px solid var(--border)'}}>
                <LogOut size={15}/>
              </button>
            </div>
          </div>

          {mobileNavOpen&&(
            <div role="dialog" aria-modal="true" className="lg:hidden" style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.78)',zIndex:1000,display:'flex'}} onClick={()=>setMobileNavOpen(false)}>
              <div className="flex w-72 max-w-[80vw] flex-col p-3" style={{background:'var(--surface-0)',borderRight:'1px solid var(--border)',height:'100%'}} onClick={e=>e.stopPropagation()}>
                <div className="flex items-center justify-between px-2 py-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm text-white" style={{background:'var(--fill-accent)',boxShadow:'0 4px 12px -4px rgba(98,112,243,0.5)'}}>
                      <Sparkles size={15}/>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-tight text-ink">TheGiftedMan</div>
                      <div className="text-[11px] text-ink-3">Trading system</div>
                    </div>
                  </div>
                  <button onClick={()=>setMobileNavOpen(false)} aria-label="Close menu" className="rounded-sm p-1.5 text-ink-3" style={{border:'1px solid var(--border)'}}>
                    <X size={15}/>
                  </button>
                </div>

                <nav className="space-y-0.5">
                  {nav.map(item=>{
                    const Icon=item.icon;
                    const on=view===item.id;
                    return(
                      <button key={item.id} onClick={()=>{setView(item.id);setMobileNavOpen(false);}} className={`relative flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-[13px] transition-colors ${on?'font-semibold text-ink':'font-normal text-ink-3 hover:text-ink-2'}`} style={on?{background:'var(--bg-accent)'}:undefined}>
                        {on&&<span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{background:'var(--fill-accent)'}}/>}
                        <Icon size={16} style={{color:on?'var(--text-accent)':'currentColor',flexShrink:0}}/>
                        <span className="flex-1">{item.label}</span>
                        {item.badge>0&&<span className="rounded-full px-1.5 py-px text-[10px] font-bold" style={{background:'var(--bg-danger)',color:'var(--text-danger)',border:'1px solid var(--border-danger)'}}>{item.badge}</span>}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-auto space-y-2">
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
                </div>
              </div>
            </div>
          )}

          <div key={view} className="mx-auto max-w-5xl animate-[fadeIn_200ms_ease-out]">
            {view==='dashboard'&&<Dashboard settings={settings} trades={trades} wds={wds} ss={todaySS} saveSS={saveSS} bal={bal} mode={mode} nav={setView} music={music}/>}
            {view==='analyzer'&&<Analyzer settings={settings} ss={todaySS} mode={mode} saveAnalyses={saveAnalyses} analyses={analyses} nav={setView} setPA={setPA}/>}
            {view==='journal'&&<Journal settings={settings} trades={trades} saveTrades={saveTrades} deleteTrade={deleteTrade} ss={todaySS} saveSS={saveSS} pa={pa} setPA={setPA} wds={wds} mode={mode}/>}
            {view==='money'&&<Money settings={settings} trades={trades} wds={wds} saveWds={saveWds} mode={mode}/>}
            {view==='plan'&&<Plan settings={settings}/>}
            {view==='analytics'&&<Analytics trades={trades} analyses={analyses} settings={settings} bal={bal}/>}
            {view==='settings'&&<Cfg settings={settings} saveSettings={saveSettings} ss={todaySS} resetAccount={resetAccount}/>}
          </div>

          {/* Rendered once here (not inside Dashboard) so it's never unmounted by navigation. */}
          <audio ref={music.audioRef} src={music.track?.audio} onEnded={music.next}/>
          {active&&view!=='dashboard'&&<MusicWidget music={music}/>}
        </main>
      </div>
    </div>
  );
}
