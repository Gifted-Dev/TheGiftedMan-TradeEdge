import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BellOff,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  MessageCircle,
  Palette,
  Pause,
  Play,
  ScanSearch,
  Send,
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
  Zap,
} from "lucide-react";

const OLD_SK = { S:'gm_s_v1', T:'gm_t_v1', A:'gm_a_v1', W:'gm_w_v1', SS:'gm_ss_v1' };
const ALERT_VOLUME_DEFAULT = 0.85;
// Two-tone chime (synthesized, not a music track) played the instant a session locks —
// self-contained data URI so it works offline with no external asset/hosting dependency.
const ALERT_CHIME_SRC = "data:audio/wav;base64,UklGRgQbAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YeAaAAAAAGEAxgAMAIX+Cf7R/4gCMwNqAHn8iftE/3cEwwUmAan66vha/iUGbgg9Ah75NvYW/YwHKQusA973dvN8+6UI6w1xBe72tPCO+WkJqhCHB1X2++1S99UJXBPoCRf2VOvN9OUJ9hWODDj2yOgH8pQJcBhzD7r2Y+YG7+AIvxqOEp/3LeTS68gH2hzZFen4L+Jz6EwGuB5KGZj6c+Dy5GsEUCDYHKv8AN9Z4ScCmyF5IB//4N2y3YL/kCIkJPMBGN0G2oD8KSPOJyMFr9xh1iT5XyNsK6oIrNzM0nP1LiP1LoMME91Sz3PxkCJdMqgQ6d3/yyztgSGZNREVMt/cyKPo/x+gOLcZ7+D1xeLjBx5mO5EeIuNSw/HemBviPZYjzOX/wNrZsxgKQLwo7OgEv6jUVxXVQfktguxrvWPPiBE6Q0Izo/ASvRfL9AwgQoA2ePXCvvrHGAhHQHo5W/rDwCPFMQMePi08RP8Tw5bCR/6oO5Q+LgSwxVbAXvnnOK1AEwmVyGW+fvTeNXVC7Q2/y8W8rO+TMutDtRIrz3q77+oILwtFZhfT0oW6TOZDK9ZF+hu01ua5yeFIJ0lGayDJ2p65bN0bI2RGsyQM36+5OtnDHihGzih44xe6ONVFGpRFtSwH6Ne6bNGlFalEZTC17O272s3rEGhD2DN78Vi9hsobDNNBCzdT9ha/dsc8B+w/+Tk3+yXBq8RVArU9njwhAIPDK8Jq/TE7+D4KBSzG+b+D+GQ4A0HuCR7JFr6l8081vULFDlTMhbzW7vkxJESKE8vPSbsd6mMuNUU2GH3TYrp/5ZQq8EXEHGjX07kC4ZAmVEYuIYXbm7ms3FsiYEZvJc/fu7mC2PwdFEaBKULkM7qK1HcZcUVfLdfoAbvH0NMUd0QEMYrtJrxAzRQQJ0NsNFPyoL34yUILhEGTNy33bb/zxmEGjj91OhP8isE2xHgBSj0NPf0A9cPDwY78uTpZP+YFq8aev6f33jdWQcgKqcnKvczyvjQCQ5wP68xIvADuXDFaRF0UbNAau0zpvC1cRQUZKdRDurPk5CkIRo0dHdjDuT3g1yVcRvAhQtyaue7bmiFZRikmlODKuczXNB3+RTIqDeVRut3TqRhLRQcuqOkvuyTQABRCRKIxX+5jvKjMPQ/kQv80LPPrvWvJaAoyQRo4CPjGv3PGhQUuP+467/zxwcLDnADcPHo92gFqxF3Bsfs+Org/wgYtx0a/zfZXN6dBogs3yoC98/ErNERDcxCEzQ28K+2+MI1EMBUQ0e66e+gULYFF0hnX1Ca66OMyKR1GVB7T2LW5eN8cJWJGsSIB3Zy5MdvYIE9G4SZa4du5GNdrHOVF4ira5XG6MtPaFyNFrS566l67hM8sEwtEPTI176G8EsxlDp5CjzUF9Di+4ciNCd1Anjjk+CHA9cWpBMw+ZjvM/VrCUcO//2w85D22AuDE+sDV+sE5FUCeB7DH8b7y9c429kF7DMbKOb0b8ZYzhENJER7O1LtX7B4wvkQCFrXRxbqs52ksokWfGobVDLoe434oMEYbH4vZq7m13mAkZUZwI8Hdobl22hQgQ0aZJyHi77ll1qAbyUWQK6fmlbqI0goX+ERRL0zrkbvlzlcS0UPXMgvw47x+y40NVUIdNt/0iL5ZyLIIhkAgOcD5gMB5xc0DZz7bO6j+xsLjwuL++jtMPpMDWcWZwPn5QjlvQHkINcievhj1QjZBQlQNV8v0vETw/zLBQx8Su86fu4TrfC/sRNMWXNKeut3mvSvBRWsbN9b1uVbiySc/RuAfRdqiufTdoiNmRi4kgt6oubzZTx80Rk4o6uIGurTV1RqrRTwsdee7uuHRORbKRPMvIOzGu0fOghGUQ24z4/AnvezKtAwKQqk2ufXbvtPH1wctQKA5m/rgwADF8AIAPk48hf80w3bCBv6FO7I+bwTUxTrAHfnAOMdAVAm9yE2+PvS0NYtCLQ7ry7K8be9mMvxD9BJaz2u7serYLhhFpBcF03q6D+YQK95FNhzp1uC5juESJ0xGpCAA2525M93jImNG6yRF37K5A9mJHiJGAymz4x+6BNUIGopF5yxF6OO6O9FnFZpElDD07P67rM2sEFVDBDS78W29XMrbC7xBMzeT9i+/T8f8BtE/HTp4+0PBicQUApY9vzxiAKXDDMIp/Q47FT9LBVLG3r9C+Dw4HEEuCkfJ/71l8yU10UIFD4DMc7yX7ssxNETIE/rPO7vf6TIuQUVzGLDTWbpD5WAq+EX/HJ3XzrnI4FkmV0ZnIbzbmrl03CMiXkamJQngv7lM2MEdDka1KX7kO7pW1DsZZkWQLRXpD7uX0JUUZ0QzMcjtOLwTzdUPE0OYNJPytr3OyQELbEG7N273h7/NxiAGcj+ZOlT8qMEUxDcBKj0tPT4BF8SlwU38lTp2PycG0caEv2f3tzduQQgL08m0vYzykzQWQ9wPGM02vMHtLjFpRJsUnNANuw7piy1nRUEZXNQ6unfkrykPRsgdUti/uQPgoCVeRikietybubbbYSFXRl8mzuDOuZfX+Rz3RWYqSeVauqrTbBhARTgu5uk8u/XPwRMyRNAxnu51vHvM/Q7PQik1bPMCvkLJJwoZQUE4Sfjhv07GRAUSPxI7MP0QwqHDWgC7PJk9GwKMxEDBcPsZOtQ/AwdTxy2/jPYvN79B4gthymu9s/H/M1dDsxCxzfy77eyPMJxEbhVA0eK6PujiLItFDxoK1R66reP9KCNGjx4J2bK5P9/kJGNG6SI53Z25+tqeIExGGCfF4cG6qNd7G65DeCk45/W9iNUjFldAWSty7G3B5dMIEcE8vyxr8R7FvdI0DPg4qi0a9vzIDdKsBwc1IC55+v7M0dF4A/gwJC6A/hfRA9Ke/9csvC0rAjzVn9Ij/K8o7ix1BWTZndML+YskwitbCIPd9tRZ9nQgPirZCo/hotYP9HUcayjvDH7lmdgu8pgYUiaaDkfp09q38OYU+yPdD+HsRN2p72YRcCG3EETw5d8D7yIOvB4rEWfzrOLB7iEL5xs7EUX2jeXh7mgI/BjsENf4f+hd7/4FBRZDEBf7eOsy8OgDDBNEDwL9bu5a8SoCGxD2DZP+V/HN8scAPA1fDMj/KfSE9MD/eQqICp8A3PZ59hn/2gd4CBcBZfmi+ND+aQU4BjABvPv3+uf+LQPRA+sA2v1v/Vr/LwFLAUoAt/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAA8ADH/IP/xAL0Bcf9y/aT/CwOyAQv9y/woApEEXP+S+pH+gAXDA2b7Dvq2AosHAADU99L8kQdaBlz6BveMAooKXQFZ9XP6HwlfCf351POlAWoNbAND84n3FAqzDFn6mfAAAAgQIAau8Sz0WAo3EHf7eu2i/UISZwm38Hjw3gnIE1r9muqX+voTKg1z8IzsmQhDFwAAHeju9hMVThH08IzohwaCGl4DIua+8nMVshVI8pzkpgNiHWcHyeQi7gcVNRp19OLgAAC/HwQMLOQ46cATsR5894Ldoft6IR0RY+Qk5JMR/yJZ+6PanPZ0IpIWf+UK330O+iYAAGXYCvGVIkIcjecS2oEKeipgBerWCevHIQYikupl1agFWS1hC0/WuuT7H7cnke4q0QAAdi/oEarWRN4nHSstgvOLzaD5sTDSGA/Y0NdIGTcyWPmryqHy7jD5H4vaiNFhFLE2AACuyCbrFzA2JyXemMt8DnE6YQezx1TjGy5aLt3iLcapB1E9XA/Ux1Pb7yo6Na3oc8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2hjG6g/fPwUIIsMr4VAxUDEr4SLDBQjfP+oPGMZi2s8rCTZx6CPBAADdPo8X98kx1J4l6DkW8CHA+/fePNUesM6wztUe3jz79yHAFvDoOZ4lMdT3yY8X3T4AACPBcegJNs8rYtoYxuoP3z8FCCLDK+FQMVAxK+EiwwUI3z/qDxjGYtrPKwk2cegjwQAA3T6PF/fJMdSeJeg5FvAhwPv33jzVHrDOsM7VHt48+/chwBbw6DmeJTHU98mPF90+AAAjwXHoCTbPK2LaGMbqD98/BQgiwyvhUDFQMSvhIsMFCN8/6g8YxmLazysJNnHoI8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2hjG6g/fPwUIIsMr4VAxUDEr4SLDBQjfP+oPGMZi2s8rCTZx6CPBAADdPo8X98kx1J4l6DkW8CHA+/fePNUesM6wztUe3jz79yHAFvDoOZ4lMdT3yY8X3T4AACPBcegJNs8rYtoYxuoP3z8FCCLDK+FQMVAxK+EiwwUI3z/qDxjGYtrPKwk2cegjwQAA3T6PF/fJMdSeJeg5FvAhwPv33jzVHrDOsM7VHt48+/chwBbw6DmeJTHU98mPF90+AAAjwXHoCTbPK2LaGMbqD98/BQgiwyvhUDFQMSvhIsMFCN8/6g8YxmLazysJNnHoI8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2hjG6g/fPwUIIsMr4VAxUDEr4SLDBQjfP+oPGMZi2s8rCTZx6CPBAADdPo8X98kx1J4l6DkW8CHA+/fePNUesM6wztUe3jz79yHAFvDoOZ4lMdT3yY8X3T4AACPBcegJNs8rYtoYxuoP3z8FCCLDK+FQMVAxK+EiwwUI3z/qDxjGYtrPKwk2cegjwQAA3T6PF/fJMdSeJeg5FvAhwPv33jzVHrDOsM7VHt48+/chwBbw6DmeJTHU98mPF90+AAAjwXHoCTbPK2LaGMbqD98/BQgiwyvhUDFQMSvhIsMFCN8/6g8YxmLazysJNnHoI8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2hjG6g/fPwUIIsMr4VAxUDEr4SLDBQjfP+oPGMZi2s8rCTZx6CPBAADdPo8X98kx1J4l6DkW8CHA+/fePNUesM6wztUe3jz79yHAFvDoOZ4lMdT3yY8X3T4AACPBcegJNs8rYtoYxuoP3z8FCCLDK+FQMVAxK+EiwwUI3z/qDxjGYtrPKwk2cegjwQAA3T6PF/fJMdSeJeg5FvAhwPv33jzVHrDOsM7VHt48+/chwBbw6DmeJTHU98mPF90+AAAjwXHoCTbPK2LaGMbqD98/BQgiwyvhUDFQMSvhIsMFCN8/6g8YxmLazysJNnHoI8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2hjG6g/fPwUIIsMr4VAxUDEr4SLDBQjfP+oPGMZi2s8rCTZx6CPBAADdPo8X98kx1J4l6DkW8CHA+/fePNUesM6wztUe3jz79yHAFvDoOZ4lMdT3yY8X3T4AACPBcegJNs8rYtoYxuoP3z8FCCLDK+FQMVAxK+EiwwUI3z/qDxjGYtrPKwk2cegjwQAA3T6PF/fJMdSeJeg5FvAhwPv33jzVHrDOsM7VHt48+/chwBbw6DmeJTHU98mPF90+AAAjwXHoCTbPK2LaGMbqD98/BQgiwyvhUDFQMSvhIsMFCN8/6g8YxmLazysJNnHoI8EAAN0+jxf3yTHUniXoORbwIcD799481R6wzrDO1R7ePPv3IcAW8Og5niUx1PfJjxfdPgAAI8Fx6Ak2zyti2mLGwg/qPtwHqMQY4pYvVy+O4i3GlAcKPOIOJco03U4ocTGQ6hzHAABEOPgULtBz2eogYTI88hLJJPm8Mw0alNbT1pcZNzJs+fLLHPOeLhgeLN1Q1X4SCTEAAJjP+u0RKRQhyuPc1McL8i7bBd/TzelCIwMjROpl1ZMFEiznCqDYnOZaHe8jc/DT1gAAjCgUD7DdZuSDF+cjNvYK2Sb7hSRYEujiJ+PiEf8ibvvq2xb3IyCwFCDo0uKbDFEhAABP397zjxsgFjHtVuPMB/oe2gMX44Lx7havFvnxnOSSAxsc7AYa5wPwZhJtFlf2iuYAANUYMAky61rvGw5tFTH6Aukn/U4Vowo873vvLQrIE2/94esR+6kRSQsT81TwtwaaEQAAB+/C+Q0OLAuZ9tDx0gMDD9gBTvI4+ZoKWwqu+dTzkAEjDPIClPVr+XMH6gg7/EL2AAAeCUwDtfhO+rQE8wYr/vn4KP8WBu4CkPvP+3cCkQRw/9n7DP8vA+EBB/7X/dMA4wEAAL7+pv+KADgA";
const PAYOUT = 0.92;
const MAX_DL = 4;
const ACCOUNT_MODES = ['DEMO','REAL'];
const MM_STYLES = [{id:'FIXED',label:'Fixed Risk %'},{id:'ANTI_MARTINGALE',label:'Anti-Martingale'},{id:'PROFIT_LOCK',label:'Profit Lock'}];
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
  {id:'aurora',label:'Aurora',bg:'#131024',accent:'#b45cf7'},
  {id:'nebula',label:'Nebula',bg:'#0c0f1e',accent:'#5b7cfa'},
  {id:'waves',label:'Waves',bg:'#0b2227',accent:'#1fb8a8'},
  {id:'ember',label:'Ember',bg:'#1f110c',accent:'#f2762e'},
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

const PROMPT = `You are an expert chart analyst for binary options trading, covering TWO distinct systems: TheGiftedMan S&D Precision Entry System (supply/demand zones) and TheGiftedMan Price Action Playbook (7 support/resistance and candle-structure setups). Analyze the chart image and determine which system actually applies BEFORE evaluating anything else.

STEP 0 — ZONE CATEGORY CLASSIFICATION (do this first, before any gate or checklist evaluation):
Determine whether the chart shows:
(a) SUPPLY_DEMAND — a base-and-departure structure: a tight multi-candle consolidation ("base") that price rallied or dropped INTO, then departed AWAY from with a strong impulsive candle, and has now returned to. This is what the 10-gate system below evaluates.
(b) SUPPORT_RESISTANCE — a single tested/broken horizontal level, OR a candlestick pattern (engulfing candle, double top/bottom, inside bar, 3-candle pause-and-continue, or a failed breakout) with no multi-candle consolidation "base" launching a move. This is what the 6-strategy playbook below evaluates.
If genuinely ambiguous, prefer SUPPLY_DEMAND only when a clear base-and-departure structure is visible; otherwise use SUPPORT_RESISTANCE and identify the specific matching strategy. Set zoneCategory to whichever you determine, and follow ONLY that path's instructions below.

═══════════════════════════════════════════════════════════════════
PATH A — SUPPLY_DEMAND (follow this section only if zoneCategory=SUPPLY_DEMAND)
═══════════════════════════════════════════════════════════════════

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

═══════════════════════════════════════════════════════════════════
PATH B — SUPPORT_RESISTANCE (follow this section only if zoneCategory=SUPPORT_RESISTANCE)
═══════════════════════════════════════════════════════════════════

First identify which ONE of these 6 setups the chart matches (they are mutually exclusive — pick the single best match). Each one lists its own 5-item checklist, built directly from its entry rules and its own disqualifying conditions. Exactly as with the S&D gates above: this is a strict filter, not a grader on a curve — when in doubt on any item, FAIL it, and every justification must cite what you actually observe in the image.

1. BREAK & RETEST (level flip — old resistance becomes support, or vice versa; entry on the retest):
   1. [HARD] The level has been touched/bounced off at least twice before this break (a proven level, not touched only once).
   2. [HARD] A strong, decisive candle breaks and closes beyond the level (not small or indecisive).
   3. Price pulls back and genuinely touches the level from the breakout side (a real retest, not skipping past it).
   4. A clear rejection candle forms at the retest — long wick or small body closing back in the breakout direction (not choppy, overlapping candles with no clear rejection).
   5. Price does not slice straight through the retest with no pause or wick rejection.

2. ENGULFING CANDLE REVERSAL (a candle whose body fully covers the prior candle's body, signaling a forceful shift in control):
   1. [HARD] A short directional move to a new high/low exists immediately before this candle (not forming mid-range with no move to reverse).
   2. [HARD] The reversal candle's body completely engulfs the prior candle's body (a partial cover does not count).
   3. The engulfed candle is a real directional candle, not a tiny doji/nothing-candle.
   4. The engulfing candle closes convincingly in the new direction, a strong close.
   5. Entry would be taken at the engulfing candle's own close, not earlier.

3. DOUBLE TOP / DOUBLE BOTTOM (price fails at the same level twice; the second failed attempt signals the level is defended):
   1. [HARD] The second test fails to close beyond the first high/low (a close beyond it is continuation, not a reversal signal — this disqualifies the setup).
   2. [HARD] A clear rejection candle forms at the second touch confirming the level held.
   3. The two touches are meaningfully separated in time, not just 1-2 candles apart (a genuine retest, not noise).
   4. The first touch was itself a real reaction — a bounce or pullback, not a random candle.
   5. Entry would be taken at the rejection candle's close on the second touch.

4. 3-CANDLE MOMENTUM CONTINUATION (a brief pause inside a strong directional run, entered as the trend resumes — with-trend only):
   1. [HARD] 3 or more consecutive same-direction candles exist immediately before — a genuine directional run, not choppy or overlapping.
   2. [HARD] The breakout candle actually closes beyond the pause candle's high/low in the trend direction.
   3. At most one or two small pause candles form — not a large opposite-direction candle (that would signal a reversal, not a pause).
   4. The pause candle has a small body and minimal progress against the trend.
   5. Entry would be taken at the breakout candle's own close.

5. INSIDE BAR BREAKOUT (a candle fully contained within the prior candle's range, signaling contraction before expansion):
   1. [HARD] The inside bar candle forms entirely within the range of the prior "mother" candle.
   2. [HARD] The breakout candle actually closes beyond the inside bar's high/low (closing back inside the range is a failed break, not a signal).
   3. The mother candle itself has real size/range — not tiny (a squeeze inside noise carries no information).
   4. There is not a long stack of multiple inside bars with no breakout yet (still consolidating, not yet a signal).
   5. Entry would be taken at the breakout candle's own close.

6. FAKEOUT REVERSAL (price pokes through a level to trap breakout traders, then reverses hard the other way):
   1. [HARD] A genuine prior level existed that price actually broke through (not a random poke with nothing established before).
   2. [HARD] The breakout candle through the level was weak — small body, long wicks, or choppy (a large, strong break is likely real, not a fakeout).
   3. The break showed no real follow-through or continuation before reversing.
   4. The reversal candle is strong and convincingly crosses back through the level.
   5. The reversal happens within roughly 3-4 candles of the break (much longer than that reads as a new trend, not a trap).

GRADING (Path B) — score = count of PASS out of that strategy's 5 items:
   5/5 → "A+"   4/5 → "A"   3/5 → "B"   2/5 → "C"   1/5 or 0/5, OR any [HARD] item failed → "INVALID" (a failed hard-filter item is automatically INVALID regardless of the other four, same rule as Path A's hard filters).

When uncertain whether any checklist item meets its strict threshold, default to FAIL, not PASS — these exist specifically to reject borderline setups, same discipline as the S&D gates.

═══════════════════════════════════════════════════════════════════
BOTH PATHS
═══════════════════════════════════════════════════════════════════

Also read the trading pair from the chart header if visible. If the pair is not clearly legible, set detectedPair to "UNKNOWN" — never guess.

Respond ONLY with JSON (no markdown, no backticks), matching ONE of the two shapes below depending on zoneCategory. Both shapes share the same field names (zoneType, direction, gateResults, hardFilterFailed, hardFilterFailures, score, grade, verdict, recommendation, confidence, keyStrengths, keyWeaknesses, executionAdvice, summary) so the app can render either one identically — gateResults holds exactly 10 entries for SUPPLY_DEMAND (as specified in Path A) or exactly 5 entries for SUPPORT_RESISTANCE (as specified in Path B, numbered 1-5, for whichever single strategy matched). zoneType and matchedStrategy both carry the matched strategy's name for SUPPORT_RESISTANCE (e.g. "Break & Retest") so existing S&D-oriented display fields still read correctly; matchedStrategy is null for SUPPLY_DEMAND. departureDirection is only meaningful for SUPPLY_DEMAND (must be "UP" or "DOWN", agreeing with zoneType/direction per step 4/5 of Path A) — set it to null for SUPPORT_RESISTANCE, which has no base/departure concept.

Example — SUPPLY_DEMAND:
{"zoneCategory":"SUPPLY_DEMAND","matchedStrategy":null,"detectedPair":"USD/JPY OTC","zoneType":"Supply (RBD)","direction":"SELL","departureDirection":"DOWN","gateResults":[{"gate":1,"label":"Base Structure","isHardFilter":false,"pass":true,"justification":"Tight 2-candle base at the origin"},{"gate":2,"label":"Departure Strength","isHardFilter":true,"pass":true,"justification":"Body ~85% of range, ~2x the preceding 5-candle average, closes at its low"},{"gate":3,"label":"Break of Structure","isHardFilter":true,"pass":true,"justification":"Departure breaks the prior swing low"},{"gate":4,"label":"Freshness","isHardFilter":true,"pass":true,"justification":"No retest of the proximal line since formation"},{"gate":5,"label":"Trend Alignment","isHardFilter":true,"pass":true,"justification":"Lower highs and lower lows visible, clearly trending down"},{"gate":6,"label":"Zone Location","isHardFilter":false,"pass":true,"justification":"Formed right after a liquidity sweep of the prior low"},{"gate":7,"label":"Distance Ratio","isHardFilter":false,"pass":true,"justification":"Travel is ~4x the zone width"},{"gate":8,"label":"Compact Zone","isHardFilter":false,"pass":false,"justification":"Zone width is ~40% of the departure move, wider than allowed"},{"gate":9,"label":"Return Quality","isHardFilter":false,"pass":true,"justification":"Small overlapping candles fading into the zone"},{"gate":10,"label":"No Conflicting Structure","isHardFilter":false,"pass":true,"justification":"No opposing zone in the likely price path"}],"hardFilterFailed":false,"hardFilterFailures":[],"score":9,"grade":"A","verdict":"VALID","recommendation":"TRADE","confidence":81,"keyStrengths":["Fresh zone","Explosive departure","Clean break of structure"],"keyWeaknesses":["Zone wider than the compact-zone threshold"],"executionAdvice":"Watch the live 10-second chart at the proximal line for your own Tier 1 confirmation before entering SELL.","summary":"9 of 10 gates passed, all hard filters cleared — Grade A."}

Example — SUPPORT_RESISTANCE:
{"zoneCategory":"SUPPORT_RESISTANCE","matchedStrategy":"Break & Retest","detectedPair":"EUR/USD OTC","zoneType":"Break & Retest","direction":"BUY","departureDirection":null,"gateResults":[{"gate":1,"label":"Proven level (2+ prior touches)","isHardFilter":true,"pass":true,"justification":"Level was tested twice before this break, both bounces visible"},{"gate":2,"label":"Strong decisive breakout candle","isHardFilter":true,"pass":true,"justification":"Large-bodied bullish candle closes well above the level"},{"gate":3,"label":"Genuine retest of the level","isHardFilter":false,"pass":true,"justification":"Price pulls back and touches the level from above"},{"gate":4,"label":"Clear rejection candle at retest","isHardFilter":false,"pass":true,"justification":"Long lower wick closing back upward at the level"},{"gate":5,"label":"No slice-through at retest","isHardFilter":false,"pass":true,"justification":"Price paused and rejected rather than cutting straight through"}],"hardFilterFailed":false,"hardFilterFailures":[],"score":5,"grade":"A+","verdict":"VALID","recommendation":"TRADE","confidence":78,"keyStrengths":["Proven level with 2 prior touches","Decisive breakout","Clean rejection at retest"],"keyWeaknesses":[],"executionAdvice":"Enter CALL at the rejection candle's close; this playbook was validated at a 1-minute chart with 2-minute expiry — if trading a different expiry, treat the same level-flip logic as a reasoned extrapolation, not a separately validated setup.","summary":"5 of 5 Break & Retest checklist items passed — Grade A+."}`;

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

// ── Supabase row mappers (camelCase app shape <-> snake_case db rows) ──────────
function toSettingsRow(userId,s){
  return{user_id:userId,risk_percent:s.riskPercent,trade_style:s.tradeStyle,
    sessions_per_day:s.sessionsPerDay,broker_min:s.brokerMin,milestones:s.milestones,
    api_keys:{apiKey:s.apiKey,groqApiKey:s.groqApiKey},setup_complete:s.setupComplete,
    created_at:new Date(s.createdAt||Date.now()).toISOString(),
    extra:{startingBalanceDemo:s.startingBalanceDemo,startingBalanceReal:s.startingBalanceReal,tradeStyleDemo:s.tradeStyleDemo,tradeStyleReal:s.tradeStyleReal,aiProvider:s.aiProvider,sessionDurations:s.sessionDurations,riskMode:s.riskMode,riskAmount:s.riskAmount,alertVolume:s.alertVolume,soundAlertOn:s.soundAlertOn,desktopAlertOn:s.desktopAlertOn,strictLockingDemo:s.strictLockingDemo,strictLockingReal:s.strictLockingReal,
      moneyMgmtStyleDemo:s.moneyMgmtStyleDemo,moneyMgmtStyleReal:s.moneyMgmtStyleReal,
      amMultiplierDemo:s.amMultiplierDemo,amMultiplierReal:s.amMultiplierReal,
      amCeilingPctDemo:s.amCeilingPctDemo,amCeilingPctReal:s.amCeilingPctReal,
      amProfitTargetPctDemo:s.amProfitTargetPctDemo,amProfitTargetPctReal:s.amProfitTargetPctReal,
      amLossTargetPctDemo:s.amLossTargetPctDemo,amLossTargetPctReal:s.amLossTargetPctReal,
      amMaxEscalationsDemo:s.amMaxEscalationsDemo,amMaxEscalationsReal:s.amMaxEscalationsReal,
      amMaxTradesDemo:s.amMaxTradesDemo,amMaxTradesReal:s.amMaxTradesReal,
      plMaxEscalationsDemo:s.plMaxEscalationsDemo,plMaxEscalationsReal:s.plMaxEscalationsReal,
      plCeilingPctDemo:s.plCeilingPctDemo,plCeilingPctReal:s.plCeilingPctReal,
      plProfitTargetPctDemo:s.plProfitTargetPctDemo,plProfitTargetPctReal:s.plProfitTargetPctReal,
      plLossTargetPctDemo:s.plLossTargetPctDemo,plLossTargetPctReal:s.plLossTargetPctReal,
      plMaxTradesDemo:s.plMaxTradesDemo,plMaxTradesReal:s.plMaxTradesReal,
      riskCalcBalance:s.riskCalcBalance,riskCalcTargetPct:s.riskCalcTargetPct,riskCalcTradesPerSession:s.riskCalcTradesPerSession}};
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
    extra:{date:t.date,analysisId:t.analysisId,criteria:t.criteria,gateResults:t.gateResults,score:t.score,hardFilterFailed:t.hardFilterFailed,hardFilterFailures:t.hardFilterFailures,failedCriteria:t.failedCriteria,keyStrengths:t.keyStrengths,keyWeaknesses:t.keyWeaknesses,executionAdvice:t.executionAdvice,summary:t.summary,confidence:t.confidence,verdict:t.verdict,recommendation:t.recommendation,accountMode:t.accountMode,offPlan:t.offPlan||false,lockingModeAtTime:t.lockingModeAtTime||'SOFT',payoutPct:t.payoutPct||null,strategyId:t.strategyId||'zone-sd'}};
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
    extra:{lockCode:s.lockCode,durationMin:s.durationMin,pausedAt:s.pausedAt,pausedMsTotal:s.pausedMsTotal,strictAtStart:s.strictAtStart||false,
      startBalance:s.startBalance,amStreak:s.amStreak||0,amNextStake:s.amNextStake??null,
      plStreak:s.plStreak||0,plNextStake:s.plNextStake??null,endReason:s.endReason||null,lateTradeLogged:s.lateTradeLogged||false}};
}
function fromSessionRow(r){
  return{id:r.id,num:r.num,accountMode:r.account_mode,startTime:new Date(r.start_time).getTime(),
    endTime:r.end_time?new Date(r.end_time).getTime():null,trades:r.trades,wins:r.wins,losses:r.losses,
    conLoss:r.con_loss,conWin:r.con_win,netLoss:r.net_loss,sPnl:r.session_pnl,isActive:r.is_active,
    isLocked:r.is_locked,lockReason:r.lock_reason,...(r.extra||{})};
}
function toStrategyRow(userId,s){
  return{id:s.id,user_id:userId,name:s.name,description:s.description||null,
    is_builtin:!!s.isBuiltin,archived:!!s.archived,created_at:new Date(s.createdAt||Date.now()).toISOString()};
}
function fromStrategyRow(r){
  return{id:r.id,name:r.name,description:r.description,isBuiltin:r.is_builtin,archived:r.archived,createdAt:new Date(r.created_at).getTime()};
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
function toQueryRow(userId,q){
  return{id:q.id,user_id:userId,timestamp:new Date(q.timestamp).toISOString(),question:q.question,answer:q.answer,mode:q.mode||null,extra:{chatId:q.chatId||null}};
}
function fromQueryRow(r){
  return{id:r.id,timestamp:new Date(r.timestamp).getTime(),question:r.question,answer:r.answer,mode:r.mode,...(r.extra||{})};
}
// Sessions no longer gate anything — the ONE hard stop (the daily circuit
// breaker) is computed straight from trades (dailyLossCount, below), not
// from session records. perMode is kept only as a harmless, unused-for-
// gating shape so the many saveSS({...,perMode:...}) call sites don't all
// need touching; it carries no gap/streak state anymore since there's no
// gap or streak left to track.
function perModeFromSessions(){
  return{DEMO:{},REAL:{}};
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
// The reserved strategies every user gets on first load — fixed ids so the
// Zone Analyzer's auto-log path can tag 'zone-sd' directly, no name lookup.
// The 6 price-action entries are the app's core curriculum (TheGiftedMan
// Price Action Playbook) — every user gets them from day one, same as
// Zone (S&D)/Trend-Pattern, not an opt-in import. Strategy #6 from the
// playbook itself, "S&D Zone Retest," isn't a 7th entry here — it maps
// directly onto the existing Zone (S&D) analyzer path (see PROMPT's Path A/B
// split), so adding a separate entry for it would just duplicate 'zone-sd'.
const BUILTIN_STRATEGIES=[
  {id:'zone-sd',name:'Zone (S&D)'},
  {id:'trend-pattern',name:'Trend/Pattern'},
  {id:'break-retest',name:'Break & Retest',description:'Level flip entry: an old resistance/support level breaks, price retests it, a rejection candle confirms the flip. Best in trending markets; avoid ranging conditions or a weak/indecisive breakout candle.'},
  {id:'engulfing-reversal',name:'Engulfing Reversal',description:"A candle whose body fully engulfs the prior candle's body after a short directional move, signaling a forceful shift in control. Best in ranging markets or at trend exhaustion; avoid strong mid-trend."},
  {id:'double-top-bottom',name:'Double Top / Bottom',description:'Price fails at the same level twice; the second failed attempt confirms the level is defended. Best in ranging markets or at trend exhaustion; avoid strong mid-trend.'},
  {id:'three-candle-continuation',name:'3-Candle Continuation',description:'A brief pause inside a strong directional run, entered as the trend resumes on a break of the pause candle. With-trend only — best in strong trending markets; avoid ranging.'},
  {id:'inside-bar-breakout',name:'Inside Bar Breakout',description:"A candle fully contained within the prior candle's range, entered on the break of that range. Works either direction with the trend; avoid counter-trend breaks."},
  {id:'fakeout-reversal',name:'Fakeout Reversal',description:'A weak breakout through a level with no follow-through, then a strong reversal back through it — a failed-breakout trap. Best in ranging markets/at level boundaries; avoid strong trending moves where breaks are usually real.'},
];
async function ensureBuiltinStrategies(userId){
  const{data,error}=await supabase.from('strategies').select('id').eq('user_id',userId).in('id',BUILTIN_STRATEGIES.map(s=>s.id));
  if(error)return;
  const existing=new Set((data||[]).map(r=>r.id));
  const missing=BUILTIN_STRATEGIES.filter(s=>!existing.has(s.id))
    .map(s=>({id:s.id,user_id:userId,name:s.name,description:s.description||null,is_builtin:true,archived:false}));
  if(missing.length)await supabase.from('strategies').insert(missing);
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

// payoutPct is the broker's actual payout percentage for THIS trade (e.g.
// 85 for 85%) — brokers sometimes shift payout right before entry, so the
// default 92% isn't always accurate. Falls back to the standard PAYOUT
// whenever it's missing/invalid, so every existing call site (and every
// already-saved trade) keeps behaving exactly as before.
function calcPnl(stake,outcome,payoutPct){
  const rate=Number.isFinite(payoutPct)&&payoutPct>0?payoutPct/100:PAYOUT;
  if(outcome==='WIN')return+(stake*rate).toFixed(2);
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
// Prior equal-length window for the WEEK/MONTH presets' "vs last period"
// delta — the other presets (TODAY/ALL/CUSTOM/...) have no single natural
// comparator, so they just don't show one (existing UI already treats a
// null prev as "no delta" gracefully).
function prevRangeFor(range,now=Date.now()){
  if(range.preset==='WEEK')return{start:now-14*DAY_MS,end:now-7*DAY_MS};
  if(range.preset==='MONTH')return{start:now-60*DAY_MS,end:now-30*DAY_MS};
  return null;
}

// ── Shared date-range filter (Analytics + Review) ──────────────────────────
// One function turns a range selection into [start,end) epoch ms, the same
// half-open convention periodRange/computeDigest already use. TODAY/CUSTOM
// resolve against local calendar days (matches tod()'s en-CA date keys);
// WEEK/MONTH stay rolling windows for consistency with the existing digest.
function dateKeyToMs(dateKey){const[y,m,d]=dateKey.split('-').map(Number);return new Date(y,m-1,d).getTime();}
function mkDateKey(y,m,d){return`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;} // m is 0-indexed
function monthStartMs(y,m){return new Date(y,m,1).getTime();}
const PRESET_LABELS={TODAY:'Today',YESTERDAY:'Yesterday',WEEK:'Last 7 days',MONTH:'Last 30 days',CURRENT_MONTH:'Current month',PREV_MONTH:'Previous month',ALL:'All time',CUSTOM:'Custom range'};
function rangeBounds(range,now=Date.now()){
  const{preset,start,end}=range;
  const d=new Date(now),y=d.getFullYear(),m=d.getMonth();
  if(preset==='TODAY'){const t=tod();return{start:dateKeyToMs(t),end:dateKeyToMs(t)+DAY_MS};}
  if(preset==='YESTERDAY'){const t=dateKeyToMs(tod());return{start:t-DAY_MS,end:t};}
  if(preset==='WEEK')return{start:now-7*DAY_MS,end:now};
  if(preset==='MONTH')return{start:now-30*DAY_MS,end:now};
  if(preset==='CURRENT_MONTH')return{start:monthStartMs(y,m),end:now};
  if(preset==='PREV_MONTH')return{start:monthStartMs(y,m-1),end:monthStartMs(y,m)};
  if(preset==='CUSTOM'){
    const s=start||tod(),e=end||start||tod();
    return{start:dateKeyToMs(s),end:dateKeyToMs(e)+DAY_MS};
  }
  return{start:0,end:now}; // ALL
}
// Single source of truth for "which trades fall in this range" — Analytics
// overview and Review both filter through this instead of each re-deriving
// their own window math.
function tradesInRange(trades,mode,range,now=Date.now()){
  const{start,end}=rangeBounds(range,now);
  return trades.filter(t=>(mode==='ALL'||getTradeMode(t)===mode)&&t.timestamp>=start&&t.timestamp<end);
}
function fmtTriggerDate(dateKey){
  const[y,m,d]=dateKey.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
// Collapsed-trigger text: an explicit start/end (CUSTOM, once both picked)
// reads as dates; every other preset just echoes its own button label.
function rangeLabel(range){
  const{preset,start,end}=range;
  if(preset==='CUSTOM'&&start&&end)return start===end?fmtTriggerDate(start):`${fmtTriggerDate(start)} – ${fmtTriggerDate(end)}`;
  return PRESET_LABELS[preset]||'All time';
}
// 6×7 grid including the leading/trailing days of adjacent months needed to
// fill whole weeks — the standard calendar-grid trick (walk back to the
// nearest Sunday, then just lay out 42 consecutive days).
function monthGrid(year,month){
  const startDow=new Date(year,month,1).getDay();
  const gridStart=new Date(year,month,1-startDow);
  const cells=[];
  for(let i=0;i<42;i++){
    const dt=new Date(gridStart.getFullYear(),gridStart.getMonth(),gridStart.getDate()+i);
    cells.push({dateKey:mkDateKey(dt.getFullYear(),dt.getMonth(),dt.getDate()),day:dt.getDate(),inMonth:dt.getMonth()===month});
  }
  return cells;
}

function isValidDateKey(s){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const[y,m,d]=s.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d;
}
// Trading history can't include tomorrow — a range boundary past today is
// never meaningful, so it's rejected the same way an invalid format is.
function isSelectableDateKey(s){return isValidDateKey(s)&&s<=tod();}

// One month's grid. Every cell is clickable (including the dimmed
// lead/trail days from adjacent months — they're still real dates) except
// future dates, which render disabled — no click, no highlight eligibility.
function CalendarMonth({year,month,start,end,onDayClick}){
  const cells=monthGrid(year,month);
  const monthLabel=new Date(year,month,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const today=tod();
  const inSpan=k=>start&&end&&k>=start&&k<=end;
  const isEdge=k=>k===start||k===end;
  return(
    <div style={{flex:1,minWidth:0}}>
      <div style={{textAlign:'center',fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>{monthLabel}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',fontSize:10,color:'var(--text-muted)',marginBottom:4,textAlign:'center'}}>
        {['S','M','T','W','T','F','S'].map((d,i)=><div key={i}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
        {cells.map(c=>{
          const future=c.dateKey>today;
          return(
          <div key={c.dateKey} title={future?'Future date — unavailable':c.dateKey} onClick={()=>!future&&onDayClick(c.dateKey)} style={{
            textAlign:'center',fontSize:11,padding:'6px 0',borderRadius:'var(--radius-sm)',cursor:future?'not-allowed':'pointer',
            color:future?'var(--text-muted)':isEdge(c.dateKey)?'#fff':!c.inMonth?'var(--text-muted)':'var(--text-primary)',
            background:isEdge(c.dateKey)?'var(--fill-accent)':inSpan(c.dateKey)?'var(--bg-accent)':'transparent',
            opacity:future?0.35:c.inMonth?1:0.35,
          }}>{c.day}</div>
          );
        })}
      </div>
    </div>
  );
}

// Collapsed trigger + expanded dropdown panel (presets left, custom-range
// calendars right) — matches the reference layout. Day clicks and the two
// text fields both write through to range.start/range.end, so either input
// method drives the same calendar highlight and the same downstream filter.
function DateRangePicker({range,setRange}){
  const[open,setOpen]=useState(false);
  const[cursor,setCursor]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()-1};});
  const ref=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const onDown=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',onDown);
    return()=>document.removeEventListener('mousedown',onDown);
  },[open]);

  // Draft text for the two fields — kept separate from range.start/end so
  // an in-progress keystroke (e.g. "2026-06-1") doesn't get clobbered by a
  // re-render, but resynced from range whenever it changes elsewhere (a day
  // click, a preset, or the other field's own commit).
  const[startText,setStartText]=useState(range.start||'');
  const[endText,setEndText]=useState(range.end||'');
  const[startErr,setStartErr]=useState(false);
  const[endErr,setEndErr]=useState(false);
  useEffect(()=>{setStartText(range.start||'');setStartErr(false);},[range.start]);
  useEffect(()=>{setEndText(range.end||'');setEndErr(false);},[range.end]);

  const presets=['TODAY','YESTERDAY','WEEK','MONTH','CURRENT_MONTH','PREV_MONTH','ALL','CUSTOM'];
  function applyPreset(id){
    if(id==='CUSTOM'){setRange({...range,preset:'CUSTOM'});return;} // stays open, reveals calendars
    setRange({preset:id,start:null,end:null});
    setOpen(false);
  }
  // Both day-clicks and field commits route through here — closing the
  // panel the instant a complete [start,end] pair exists is what makes
  // "clicking a day completes the range" and "typing both fields" behave
  // the same way per the dismiss rules already established.
  function applyCustom(patch){
    const merged={...range,preset:'CUSTOM',...patch};
    setRange(merged);
    if(merged.start&&merged.end)setOpen(false);
  }
  // First click starts a fresh range; second click finishes it (swapping if
  // the second date lands before the first); a click after a range is
  // already complete starts over. Clicking the same day twice yields
  // start===end — the single-day case.
  function handleDayClick(dateKey){
    const{start,end}=range;
    if(!start||(start&&end))applyCustom({start:dateKey,end:null});
    else applyCustom(dateKey<start?{start:dateKey,end:start}:{start,end:dateKey});
  }
  function commitStart(){
    if(!isSelectableDateKey(startText)){setStartErr(true);setStartText(range.start||'');return;}
    const s=startText;
    applyCustom(range.end&&s>range.end?{start:range.end,end:s}:{start:s});
  }
  function commitEnd(){
    if(!isSelectableDateKey(endText)){setEndErr(true);setEndText(range.end||'');return;}
    const e=endText;
    applyCustom(range.start&&e<range.start?{start:e,end:range.start}:{start:range.start||e,end:e});
  }
  const onEnterBlur=e=>{if(e.key==='Enter')e.target.blur();};
  const rightMonth=(cursor.m+1)%12,rightYear=cursor.m===11?cursor.y+1:cursor.y;

  return(
    <div ref={ref} style={{position:'relative',marginBottom:16}}>
      <button onClick={()=>setOpen(o=>!o)} style={{...inp,display:'inline-flex',alignItems:'center',gap:8,width:'auto',cursor:'pointer'}}>
        <Calendar size={14} style={{color:'var(--text-muted)'}}/>
        <span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{rangeLabel(range)}</span>
      </button>

      {open&&(
        <div className="daterange-popover" style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:30,display:'flex',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)',boxShadow:'var(--shadow-card), var(--highlight-top)'}}>
          <div style={{display:'flex',flexDirection:'column',minWidth:150,borderRight:'1px solid var(--border)',padding:6,gap:1}}>
            {presets.map(id=>(
              <button key={id} onClick={()=>applyPreset(id)}
                style={{textAlign:'left',padding:'8px 10px',borderRadius:'var(--radius-sm)',fontSize:12,
                  fontWeight:range.preset===id?700:500,background:range.preset===id?'var(--bg-accent)':'transparent',
                  color:range.preset===id?'var(--text-accent)':'var(--text-secondary)',border:'none',cursor:'pointer'}}>
                {PRESET_LABELS[id]}
              </button>
            ))}
          </div>

          {range.preset==='CUSTOM'&&(
            <div style={{padding:14,width:440}}>
              <div style={{display:'flex',gap:8,marginBottom:startErr||endErr?4:12}}>
                <input type="text" placeholder="YYYY-MM-DD" value={startText}
                  onChange={e=>{setStartText(e.target.value);setStartErr(false);}}
                  onBlur={commitStart} onKeyDown={onEnterBlur}
                  style={{...inp,fontSize:12,padding:'6px 8px',borderColor:startErr?'var(--border-danger)':undefined}} aria-label="Range start"/>
                <input type="text" placeholder="YYYY-MM-DD" value={endText}
                  onChange={e=>{setEndText(e.target.value);setEndErr(false);}}
                  onBlur={commitEnd} onKeyDown={onEnterBlur}
                  style={{...inp,fontSize:12,padding:'6px 8px',borderColor:endErr?'var(--border-danger)':undefined}} aria-label="Range end"/>
              </div>
              {(startErr||endErr)&&<div style={{fontSize:11,color:'var(--text-danger)',marginBottom:8}}>Use YYYY-MM-DD, no later than today — reverted to the last valid date.</div>}
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={()=>setCursor(c=>({y:c.m===0?c.y-1:c.y,m:(c.m+11)%12}))} style={{...btn(),padding:'4px 6px'}} aria-label="Previous month"><ChevronLeft size={14}/></button>
                <div style={{display:'flex',gap:18,flex:1}}>
                  <CalendarMonth year={cursor.y} month={cursor.m} start={range.start} end={range.end} onDayClick={handleDayClick}/>
                  <CalendarMonth year={rightYear} month={rightMonth} start={range.start} end={range.end} onDayClick={handleDayClick}/>
                </div>
                <button onClick={()=>setCursor(c=>({y:c.m===11?c.y+1:c.y,m:(c.m+1)%12}))} style={{...btn(),padding:'4px 6px'}} aria-label="Next month"><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  // Discipline Impact: off-plan vs on-plan, scoped to this same mode+period.
  // A trade is real activity either way — off-plan trades already count
  // fully in `done`/`wins`/`wr` above; this just breaks that same total down.
  const offPlanDone=done.filter(t=>t.offPlan);
  const onPlanDone=done.filter(t=>!t.offPlan);
  const offPlanWins=offPlanDone.filter(t=>t.outcome==='WIN').length;
  const onPlanWins=onPlanDone.filter(t=>t.outcome==='WIN').length;
  const offPlanPnl=offPlanDone.reduce((s,t)=>s+t.pnl,0);

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
    offPlanCount:periodTrades.filter(t=>t.offPlan).length,
    offPlanDoneCount:offPlanDone.length,onPlanDoneCount:onPlanDone.length,
    offPlanWins,onPlanWins,
    offPlanWr:offPlanDone.length?(offPlanWins/offPlanDone.length)*100:0,
    onPlanWr:onPlanDone.length?(onPlanWins/onPlanDone.length)*100:0,
    offPlanPnl,
  };
}
// Off-plan trades as a % of that week's total, mode-scoped, oldest to
// newest — a rolling-window trend (like periodRange), not calendar weeks.
function offPlanTrend(trades,mode,weeks=8,now=Date.now()){
  const out=[];
  for(let i=weeks-1;i>=0;i--){
    const end=now-i*7*DAY_MS,start=end-7*DAY_MS;
    const wk=trades.filter(t=>getTradeMode(t)===mode&&t.timestamp>=start&&t.timestamp<end&&t.outcome!=='PENDING');
    const offPlan=wk.filter(t=>t.offPlan).length;
    out.push({start,end,total:wk.length,offPlan,pct:wk.length?(offPlan/wk.length)*100:0});
  }
  return out;
}


// Formats tod()'s date-key for display without taking a second, independent
// clock reading — the header and every "today" filter must derive from the
// exact same instant, not two separate `new Date()` calls that merely agree
// most of the time.
function fmtHeaderDate(dateKey){
  const[y,m,d]=dateKey.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
}
export function getToday(ss){
  const t=tod();
  if(!ss||ss.date!==t)return{date:t,sessions:[],perMode:{DEMO:{},REAL:{}}};
  return ss;
}

// The ONE hard stop left in the system. Computed directly from trades — not
// from session records — since session-based aggregation (client-numbered,
// no DB uniqueness) was the source of every corruption bug found in this
// app: duplicate session rows, cross-date trade matching, etc. A trade
// count/loss count derived straight from trades has none of that surface.
function dailyLossCount(trades,mode){
  const t=tod();
  return(trades||[]).filter(x=>getTradeMode(x)===mode&&x.date===t&&x.outcome==='LOSS').length;
}
function isDailyCircuitBroken(trades,mode){
  return dailyLossCount(trades,mode)>=MAX_DL;
}
// AM/PL's own daily lock — 2 sessions in one day for a mode that end via
// their own Loss Target (not max-trades, not the 60-minute cap) is a more
// meaningful "bad day" signal for these styles than the generic total-loss
// count above: a Profit Lock loss mid-streak is often just giving back
// banked profit, not real capital, so counting it the same as a Fixed Risk %
// loss was a mismatch. ss.sessions is already today-only, same assumption
// every other today-scoped read in this file makes — no extra date filter.
const MAX_AM_PL_LOSS_TARGET_SESSIONS = 2;
function amPlLossTargetSessionCount(ss,mode){
  return(ss?.sessions||[]).filter(s=>s.accountMode===mode&&(s.endReason==='AM_LOSS_TARGET'||s.endReason==='PL_LOSS_TARGET')).length;
}
function isAmPlDailyLocked(ss,mode){
  return amPlLossTargetSessionCount(ss,mode)>=MAX_AM_PL_LOSS_TARGET_SESSIONS;
}
// Single source of truth for whether a mode is locked for the rest of today.
// Deliberately asymmetric: once the AM/PL rule above trips, the lock is
// mode-wide and sticky — switching back to Fixed Risk % mid-day can't be
// used to trade around a bad AM/PL day. The generic 4-total-loss rule stays
// fully exempt for AM/PL otherwise (their own session-level protections —
// loss target %, max trades, 60-minute cap — make individual trade-loss
// counting a poor fit for these styles) and fully unchanged for Fixed Risk %.
function isModeDayLocked(trades,ss,settings,mode){
  if(isAmPlDailyLocked(ss,mode))return true;
  const style=getMoneyMgmtStyleForMode(settings,mode);
  return!isEscalatingStyle(style)&&isDailyCircuitBroken(trades,mode);
}

function getTradeMode(trade){return trade?.accountMode==='REAL'?'REAL':'DEMO';}

function getTradeStyleForMode(settings,mode){
  if(mode==='REAL')return settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1;
  return settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1;
}
function styleName(id){return id===1?'Precision':id===2?'Active':id===3?'Structured':'plan';}
function lastStrategyId(){try{return localStorage.getItem('gm_last_strategy_id')||'';}catch{return'';}}
// Same "remember the last thing you picked" convenience as lastStrategyId,
// for Quick Log's direction toggle.
function lastDirection(){try{return localStorage.getItem('gm_last_direction')||'BUY';}catch{return'BUY';}}
function setLastDirection(d){try{localStorage.setItem('gm_last_direction',d);}catch{}}
// Same convenience, for payout % — captured per-trade at logging time (the
// broker's payout can shift trade to trade), never a silent stored default.
function lastPayoutPct(){try{return localStorage.getItem('gm_last_payout_pct')||'';}catch{return'';}}
function setLastPayoutPct(v){try{localStorage.setItem('gm_last_payout_pct',v);}catch{}}
// Compact two-button BUY/SELL toggle. Pass `onChange` for an editable picker
// — the draft row's big touch-target style by default, or `compact` for a
// small always-interactive pill (committed rows, fixing a mis-tapped
// direction in place); omit `onChange` entirely for a read-only pill.
// stopPropagation everywhere `onChange` is set, since compact usage renders
// inside clickable row/card elements that otherwise navigate away.
function DirToggle({value,onChange,compact,disabled}){
  const opt=(d,label)=>{
    const on=value===d;
    const interactive=!!onChange&&!disabled;
    const base=(onChange&&!compact)
      ?{padding:'10px 16px',fontSize:13,fontWeight:600,borderRadius:6,border:'1px solid var(--border)',minHeight:44,minWidth:44}
      :{padding:'2px 8px',fontSize:11,fontWeight:600,borderRadius:4,border:'1px solid var(--border)'};
    const style=on
      ?{...base,background:d==='BUY'?'var(--bg-success)':'var(--bg-danger)',color:d==='BUY'?'var(--text-success)':'var(--text-danger)',borderColor:d==='BUY'?'var(--border-success)':'var(--border-danger)'}
      :{...base,background:'transparent',color:'var(--text-muted)',cursor:interactive?'pointer':'default'};
    return onChange
      ?<button key={d} type="button" disabled={disabled} style={{...style,opacity:disabled?0.6:1}} onClick={e=>{e.stopPropagation();if(interactive)onChange(d);}}>{label}</button>
      :<span key={d} style={{...style,opacity:on?1:0.35}}>{label}</span>;
  };
  return<div style={{display:'flex',gap:4}} onClick={onChange?e=>e.stopPropagation():undefined}>{opt('BUY','BUY')}{opt('SELL','SELL')}</div>;
}
// Compact WIN/LOSS toggle for a COMMITTED row — same segmented-pill pattern
// as DirToggle, but always interactive (correcting a mistaken outcome is the
// whole point) rather than switching between an editable and read-only mode.
// stopPropagation on each button since these render inside clickable
// row/card elements that otherwise navigate to the trade's detail view.
function OutcomeToggle({value,onChange,disabled}){
  const opt=(o,label)=>{
    const on=value===o;
    return(
      <button key={o} type="button" disabled={disabled}
        onClick={e=>{e.stopPropagation();if(!disabled&&o!==value)onChange(o);}}
        style={{padding:'3px 9px',fontSize:11,fontWeight:700,borderRadius:6,border:'1px solid var(--border)',
          cursor:disabled?'default':'pointer',opacity:disabled?0.6:1,
          background:on?(o==='WIN'?'var(--bg-success)':'var(--bg-danger)'):'transparent',
          color:on?(o==='WIN'?'var(--text-success)':'var(--text-danger)'):'var(--text-muted)',
          borderColor:on?(o==='WIN'?'var(--border-success)':'var(--border-danger)'):'var(--border)'}}>
        {label}
      </button>
    );
  };
  return<div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>{opt('WIN','W')}{opt('LOSS','L')}</div>;
}
// `strategies` is the user's full loaded list (Journal/Analytics/Settings/Ask
// all thread it through). Falls back to the two reserved builtins, then the
// raw id, only if a caller genuinely has no list to check (shouldn't happen).
function strategyLabel(id,strategies){
  if(!id)return'';
  return(strategies||[]).find(s=>s.id===id)?.name || BUILTIN_STRATEGIES.find(s=>s.id===id)?.name || id;
}
// Per-mode, default OFF (matches the current live soft-guidance behavior).
function isStrictForMode(settings,mode){
  return!!(mode==='REAL'?settings?.strictLockingReal:settings?.strictLockingDemo);
}

// ── Money Management (Part B) ───────────────────────────────────────────────
function getMoneyMgmtStyleForMode(settings,mode){
  return(mode==='REAL'?settings?.moneyMgmtStyleReal:settings?.moneyMgmtStyleDemo)||'FIXED';
}
function getAmMultiplierForMode(settings,mode){
  const v=parseFloat(mode==='REAL'?settings?.amMultiplierReal:settings?.amMultiplierDemo);
  // Range is 1.2x-1.5x (peak exposure 2.25x-3.375x base at the 1-or-2 max
  // escalations cap, down from up to 9x at the old 3x max) — clamp any
  // stored value into range rather than trust it, since a value saved
  // before this bound tightened could still be sitting above 1.5.
  return Number.isFinite(v)?Math.min(1.5,Math.max(1.2,v)):1.3;
}
function getAmCeilingPctForMode(settings,mode){
  const v=parseFloat(mode==='REAL'?settings?.amCeilingPctReal:settings?.amCeilingPctDemo);
  return Number.isFinite(v)?v:20;
}
function getAmProfitTargetPctForMode(settings,mode){
  const v=parseFloat(mode==='REAL'?settings?.amProfitTargetPctReal:settings?.amProfitTargetPctDemo);
  return Number.isFinite(v)?v:10;
}
function getAmLossTargetPctForMode(settings,mode){
  const v=parseFloat(mode==='REAL'?settings?.amLossTargetPctReal:settings?.amLossTargetPctDemo);
  return Number.isFinite(v)?v:10;
}
// Two-option choice, not a slider — same protective philosophy as the dollar
// ceiling. Defaults to 1 (locks in profit after a single escalated win)
// rather than 2, the more conservative default.
function getAmMaxEscalationsForMode(settings,mode){
  const v=parseInt(mode==='REAL'?settings?.amMaxEscalationsReal:settings?.amMaxEscalationsDemo,10);
  return v===2?2:1;
}
// Session-quality safety net, independent of escalation logic and of Trade
// Management's own trade-count rules (which stay disabled under AM).
function getAmMaxTradesForMode(settings,mode){
  const v=parseInt(mode==='REAL'?settings?.amMaxTradesReal:settings?.amMaxTradesDemo,10);
  return Number.isFinite(v)&&v>=3&&v<=20?v:8;
}

// Anti-Martingale engine — verbatim per spec, do not redesign. A win escalates
// the stake (up to the configured max escalations, capped at amCeilingPct% of
// balance); any loss, or completing the escalation ladder, resets to base.
function amBaseStake(balance, settings) {
  const riskPct = settings?.riskPercent ?? 5;
  return Math.max(1, Math.round(balance * (riskPct / 100) * 100) / 100);
}
function advanceAntiMartingale(state, outcome, balance, settings, mode) {
  const base = amBaseStake(balance, settings);
  if (outcome !== 'WIN') {
    return { streak: 0, nextStake: base }; // any loss resets immediately
  }
  const maxEscalations = getAmMaxEscalationsForMode(settings, mode);
  // Cap check on the PRE-increment streak: a WIN only forces the reset once
  // it happens AT the max-escalated stake (the actual final escalated win) —
  // every escalation level up to the configured max gets placed before the
  // ladder caps out.
  if (state.streak >= maxEscalations) {
    return { streak: 0, nextStake: base };
  }
  const multiplier = getAmMultiplierForMode(settings, mode); // clamped to 1.2x-1.5x
  const ceilingPct = settings?.[`amCeilingPct${mode}`] ?? 20;
  const ceiling = balance * (ceilingPct / 100);
  const escalated = Math.max(1, Math.round(Math.min(state.nextStake * multiplier, ceiling) * 100) / 100);
  return { streak: state.streak + 1, nextStake: escalated };
}
// Live display helpers — never trust a stored dollar figure at face value;
// always reclamp/rebase against the CURRENT balance so a mid-session
// withdrawal (or any other balance change) is reflected without a new trade.
function liveAmNextStake(session, balance, settings, mode) {
  const streak = session?.amStreak || 0;
  if (streak === 0) return amBaseStake(balance, settings);
  const ceiling = balance * (getAmCeilingPctForMode(settings, mode) / 100);
  return Math.max(1, Math.min(session?.amNextStake ?? amBaseStake(balance, settings), ceiling));
}
// One line of "what to bet and why" — computed from the same live inputs as
// liveAmNextStake, so the number and the reasoning can never drift apart.
function amStakeReasoning(session, balance, settings, mode) {
  const streak = session?.amStreak || 0;
  const base = amBaseStake(balance, settings);
  const stake = liveAmNextStake(session, balance, settings, mode);
  const maxEscalations = getAmMaxEscalationsForMode(settings, mode);
  if (streak === 0) {
    return 'Base stake — a win escalates the next stake up.';
  }
  const multiplier = getAmMultiplierForMode(settings, mode);
  const ceiling = balance * (getAmCeilingPctForMode(settings, mode) / 100);
  const onWin = Math.max(1, Math.min(Math.round(stake * multiplier * 100) / 100, ceiling));
  if (streak >= maxEscalations) {
    return maxEscalations === 1
      ? `1st escalation — win again locks in at base, any loss resets to $${base.toFixed(2)} base.`
      : `Final escalation (${streak} of ${maxEscalations}) — any outcome resets to $${base.toFixed(2)} base next.`;
  }
  return `Escalation ${streak} of ${maxEscalations} — win again for $${onWin.toFixed(2)}, any loss resets to $${base.toFixed(2)} base.`;
}
// 60-minute cap is fixed, not user-configurable — unlike Trade Management's
// per-style duration, which only ever informs the (non-ending) countdown UI.
const ESCALATING_TIME_LIMIT_MS = 60 * 60000;
function checkAntiMartingaleSessionEnd(session, mode, settings, now = Date.now()) {
  if (!session?.isActive) return null;
  if (getMoneyMgmtStyleForMode(settings, mode) !== 'ANTI_MARTINGALE') return null;
  const startBal = session.startBalance;
  const pnlPct = startBal ? (session.sPnl / startBal) * 100 : 0;
  const profitTarget = settings?.[`amProfitTargetPct${mode}`] ?? 10;
  const lossTarget = settings?.[`amLossTargetPct${mode}`] ?? 10;
  if (pnlPct >= profitTarget) return 'AM_PROFIT_TARGET';
  if (pnlPct <= -Math.abs(lossTarget)) return 'AM_LOSS_TARGET';
  if (session.trades >= getAmMaxTradesForMode(settings, mode)) return 'AM_MAX_TRADES';
  if (sessionElapsedMs(session, now) >= ESCALATING_TIME_LIMIT_MS) return 'AM_TIME_LIMIT';
  return null;
}

// ── Profit Lock engine ───────────────────────────────────────────────────
// Same protective caps as Anti-Martingale (max escalations, dollar ceiling,
// three-condition session end), but a genuinely different mechanic: a win
// stakes ONLY the profit just banked (never base + profit), so original
// capital is never re-risked once a streak starts. A loss at any point
// resets to base, losing at most the streak's accumulated profit — never
// more. Deliberately a separate function from advanceAntiMartingale rather
// than a shared one with a branch: AM escalates a configured multiplier
// against the stake itself; Profit Lock stakes the trade's REAL pnl, so it
// needs that value as an input the AM engine has no use for.
function getPlMaxEscalationsForMode(settings, mode) {
  const v = parseInt(mode === 'REAL' ? settings?.plMaxEscalationsReal : settings?.plMaxEscalationsDemo, 10);
  return v === 2 ? 2 : 1;
}
function getPlCeilingPctForMode(settings, mode) {
  const v = parseFloat(mode === 'REAL' ? settings?.plCeilingPctReal : settings?.plCeilingPctDemo);
  return Number.isFinite(v) ? v : 20;
}
function getPlProfitTargetPctForMode(settings, mode) {
  const v = parseFloat(mode === 'REAL' ? settings?.plProfitTargetPctReal : settings?.plProfitTargetPctDemo);
  return Number.isFinite(v) ? v : 10;
}
function getPlLossTargetPctForMode(settings, mode) {
  const v = parseFloat(mode === 'REAL' ? settings?.plLossTargetPctReal : settings?.plLossTargetPctDemo);
  return Number.isFinite(v) ? v : 10;
}
function getPlMaxTradesForMode(settings, mode) {
  const v = parseInt(mode === 'REAL' ? settings?.plMaxTradesReal : settings?.plMaxTradesDemo, 10);
  return Number.isFinite(v) && v >= 3 && v <= 20 ? v : 8;
}
function advanceProfitLock(state, outcome, pnl, balance, settings, mode) {
  const base = amBaseStake(balance, settings);
  if (outcome !== 'WIN') {
    return { streak: 0, nextStake: base }; // any loss resets to base — never below it
  }
  const maxEscalations = getPlMaxEscalationsForMode(settings, mode);
  // Same pre-increment cap-check pattern as advanceAntiMartingale: the
  // forced reset only fires once a WIN has actually happened AT the max-
  // escalated stake, so every banked-profit level up to the cap gets used.
  if (state.streak >= maxEscalations) {
    return { streak: 0, nextStake: base };
  }
  const ceiling = balance * (getPlCeilingPctForMode(settings, mode) / 100);
  const bankedProfit = Math.max(1, Math.round(Math.min(pnl, ceiling) * 100) / 100);
  return { streak: state.streak + 1, nextStake: bankedProfit };
}
function liveProfitLockNextStake(session, balance, settings, mode) {
  const streak = session?.plStreak || 0;
  if (streak === 0) return amBaseStake(balance, settings);
  const ceiling = balance * (getPlCeilingPctForMode(settings, mode) / 100);
  return Math.max(1, Math.min(session?.plNextStake ?? amBaseStake(balance, settings), ceiling));
}
function plStakeReasoning(session, balance, settings, mode) {
  const streak = session?.plStreak || 0;
  const base = amBaseStake(balance, settings);
  const stake = liveProfitLockNextStake(session, balance, settings, mode);
  const maxEscalations = getPlMaxEscalationsForMode(settings, mode);
  if (streak === 0) {
    return `Base stake — a win banks its profit as the next stake; your $${base.toFixed(2)} base is never re-risked once a streak starts.`;
  }
  if (streak >= maxEscalations) {
    return `Final banked stake (${streak} of ${maxEscalations}) — this is banked profit, not capital; any outcome resets to $${base.toFixed(2)} base next.`;
  }
  return `Next stake: $${stake.toFixed(2)} — this is your banked profit from the last win. A loss here returns you to your $${base.toFixed(2)} base, never below it.`;
}
function checkProfitLockSessionEnd(session, mode, settings, now = Date.now()) {
  if (!session?.isActive) return null;
  if (getMoneyMgmtStyleForMode(settings, mode) !== 'PROFIT_LOCK') return null;
  const startBal = session.startBalance;
  const pnlPct = startBal ? (session.sPnl / startBal) * 100 : 0;
  const profitTarget = getPlProfitTargetPctForMode(settings, mode);
  const lossTarget = getPlLossTargetPctForMode(settings, mode);
  if (pnlPct >= profitTarget) return 'PL_PROFIT_TARGET';
  if (pnlPct <= -Math.abs(lossTarget)) return 'PL_LOSS_TARGET';
  if (session.trades >= getPlMaxTradesForMode(settings, mode)) return 'PL_MAX_TRADES';
  if (sessionElapsedMs(session, now) >= ESCALATING_TIME_LIMIT_MS) return 'PL_TIME_LIMIT';
  return null;
}

// ── Escalating-style dispatchers ─────────────────────────────────────────
// 'ANTI_MARTINGALE' and 'PROFIT_LOCK' both replace Trade Management's
// session-ending rules with their own three-condition check and both need a
// live stake/reasoning pair — these let call sites stay style-agnostic
// instead of re-branching the same if/else at every commit site.
function isEscalatingStyle(style) {
  return style === 'ANTI_MARTINGALE' || style === 'PROFIT_LOCK';
}
function liveEscalatingNextStake(session, balance, settings, mode, style) {
  return style === 'PROFIT_LOCK'
    ? liveProfitLockNextStake(session, balance, settings, mode)
    : liveAmNextStake(session, balance, settings, mode);
}
function escalatingStakeReasoning(session, balance, settings, mode, style) {
  return style === 'PROFIT_LOCK'
    ? plStakeReasoning(session, balance, settings, mode)
    : amStakeReasoning(session, balance, settings, mode);
}
// Each check function already gates on its own style match internally, so
// calling both unconditionally and taking whichever fires is safe — at
// most one of the two can ever return non-null for a given session.
function checkEscalatingSessionEnd(session, mode, settings, now = Date.now()) {
  return checkAntiMartingaleSessionEnd(session, mode, settings, now) ?? checkProfitLockSessionEnd(session, mode, settings, now);
}
// Advances whichever engine is active, and returns the update pre-keyed to
// the right session fields (amStreak/amNextStake vs plStreak/plNextStake)
// so call sites can just spread the result onto `us` without a branch.
function advanceEscalatingStake(style, session, outcome, pnl, balance, settings, mode) {
  if (style === 'PROFIT_LOCK') {
    const state = { streak: session.plStreak || 0, nextStake: session.plNextStake ?? amBaseStake(balance, settings) };
    const r = advanceProfitLock(state, outcome, pnl, balance, settings, mode);
    return { plStreak: r.streak, plNextStake: r.nextStake };
  }
  const state = { streak: session.amStreak || 0, nextStake: session.amNextStake ?? amBaseStake(balance, settings) };
  const r = advanceAntiMartingale(state, outcome, balance, settings, mode);
  return { amStreak: r.streak, amNextStake: r.nextStake };
}
// endSessionNatural's effect (isActive:false, endTime, endReason — no
// isLocked/lockReason/lockCode, so Strict Locking never applies to an AM
// ending) is folded directly into the single saveSS call at each call site
// (setOutcome, addManual, and the reconciliation effect) instead of being a
// separate awaited write, per the no-double-write wiring note in the spec.

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

// Starting a session (the informational timer) is never blocked — there's
// no per-day session limit and no inter-session gap anymore. The daily
// circuit breaker only blocks LOGGING A TRADE (checked at the point of
// logging, straight from trades — see isDailyCircuitBroken), not the timer.
function canStart(){
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
// The duration actually used for a new session — Trade Management's
// per-style value under Fixed Risk %, but the fixed 60-minute Anti-
// Martingale/Profit Lock cap (in minutes) whenever either is active, since
// Trade Management's duration setting has no bearing on those styles at all.
function getEffectiveSessionDuration(settings,mode){
  if(isEscalatingStyle(getMoneyMgmtStyleForMode(settings,mode)))return ESCALATING_TIME_LIMIT_MS/60000;
  return getSessionDuration(settings,getTradeStyleForMode(settings,mode));
}
// strictAtStart is stamped from the CURRENT setting at creation time and
// then belongs to this session for its whole lifetime — toggling the
// setting later never retroactively changes an already-running session's
// enforcement, only a session started after the toggle picks up the change.
// `settings`/`startBalance` are only needed for the Anti-Martingale fields —
// startBalance is "balance now" for this mode at session creation (the
// caller already has it as balForMode's output, e.g. Dashboard's `bal`), kept
// stable for the life of the session so checkAntiMartingaleSessionEnd has a
// fixed reference point. amNextStake is seeded to the base stake immediately
// (not left null) so the Dashboard has something to show before any trade.
function buildSession(ssState,mode,durationMin,strictAtStart,settings,startBalance){
  const amStyle=getMoneyMgmtStyleForMode(settings,mode);
  return{id:uid(),num:ssState.sessions.filter(x=>x.accountMode===mode).length+1,accountMode:mode,
    startTime:Date.now(),endTime:null,trades:0,wins:0,losses:0,conLoss:0,conWin:0,netLoss:0,sPnl:0,
    isActive:true,isLocked:false,lockReason:null,lockCode:null,strictAtStart:!!strictAtStart,
    durationMin,pausedAt:null,pausedMsTotal:0,
    startBalance:startBalance??0,endReason:null,
    amStreak:0,amNextStake:amStyle==='ANTI_MARTINGALE'?amBaseStake(startBalance??0,settings):null,
    plStreak:0,plNextStake:amStyle==='PROFIT_LOCK'?amBaseStake(startBalance??0,settings):null};
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

// SUPPORT_RESISTANCE results have no base/departure concept (most of the 6
// playbook strategies aren't about a launch move at all — a double top, an
// inside bar, a fakeout), so departureDirection is deliberately null for
// them per the prompt's own instructions. Only require a real direction was
// given; the SUPPLY_DEMAND path keeps its original strict departure-based check.
function validateZoneDirection(r){
  if(r.zoneCategory==='SUPPORT_RESISTANCE')return r.direction==='BUY'||r.direction==='SELL';
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
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'qwen/qwen3.6-27b',messages:[{role:'user',content:[{type:'text',text:PROMPT},{type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}}]}],temperature:0.1,max_tokens:2000,response_format:{type:'json_object'},reasoning_effort:'none'})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`Groq API error ${res.status}`);}
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content||'{}';
  try{return JSON.parse(txt.replace(/```json|```/g,'').trim());}catch{throw new Error('Could not parse Groq response. Try again.');}
}

const NOTE_POLISH_PROMPT=`You are a trading journal editor. Rewrite the trader's note below to fix grammar and spelling, and use precise, standard trading terminology (e.g. "stop loss", "take profit", "breakout", "support/resistance", "consolidation") where it fits naturally. Preserve the original meaning, facts, numbers, pairs, and outcome exactly — do not add commentary, advice, or details that aren't in the original. Keep it concise and in the same voice. Respond with ONLY the rewritten note text — no preamble, no quotes, no markdown.`;

// Reuses the same provider/key already configured for zone analysis — this
// is a plain text completion (no image), so it works against either
// provider's chat-completions endpoint with a text-only message.
async function polishJournalNote(text,settings){
  const trimmed=(text||'').trim();
  if(!trimmed)return trimmed;
  const provider=settings?.aiProvider||'gemini';
  const key=provider==='groq'?settings?.groqApiKey:settings?.apiKey;
  if(!key)throw new Error(`Add your ${provider==='groq'?'Groq':'OpenRouter'} API key in Settings first.`);
  const url=provider==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
  const model=provider==='groq'?'qwen/qwen3.6-27b':'nvidia/nemotron-nano-12b-v2-vl:free';
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'user',content:`${NOTE_POLISH_PROMPT}\n\n---\n${trimmed}`}],temperature:0.3,max_tokens:600,reasoning_effort:'none'})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`${provider==='groq'?'Groq':'OpenRouter'} API error ${res.status}`);}
  const d=await res.json();
  const out=d.choices?.[0]?.message?.content?.trim();
  if(!out)throw new Error('No response from AI. Try again.');
  return out.replace(/^["']|["']$/g,'');
}

// ── Ask (natural-language data query) ───────────────────────────────────────
// Marks an Error as safe to show verbatim in the chat — everything thrown
// deliberately by this pipeline (a clear, actionable sentence) gets tagged;
// anything else (a raw TypeError, a network failure, a future bug) is not,
// so the top-level catch in Ask can tell the two apart instead of trusting
// every err.message to be fit for display.
function userError(msg){const e=new Error(msg);e.userFacing=true;return e;}

// Shared text-completion call — same provider/key/url/model switch as
// polishJournalNote, factored out since Ask needs it twice (classify, then
// compose) instead of once.
async function aiChat(prompt,settings,{json=false,maxTokens=500,temperature=0.1,reasoningEffort='none'}={}){
  const provider=settings?.aiProvider||'gemini';
  const key=provider==='groq'?settings?.groqApiKey:settings?.apiKey;
  if(!key)throw userError(`Add your ${provider==='groq'?'Groq':'OpenRouter'} API key in Settings first.`);
  const url=provider==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
  const model=provider==='groq'?'qwen/qwen3.6-27b':'nvidia/nemotron-nano-12b-v2-vl:free';
  // 'none' everywhere by default (classifier/compose calls are cheap
  // structuring tasks, not worth the latency) — the advisory/coach call
  // below is the one call site that opts into real reasoning effort, since
  // it's the one place actually synthesizing a judgment from the data
  // rather than just reporting or reformatting it.
  const body={model,messages:[{role:'user',content:prompt}],temperature,max_tokens:maxTokens,reasoning_effort:reasoningEffort};
  if(json)body.response_format={type:'json_object'};
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw userError(e.error?.message||`${provider==='groq'?'Groq':'OpenRouter'} API error ${res.status}`);}
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content;
  if(!txt)throw userError('No response from AI. Try again.');
  // finish_reason:'length' means the API stopped mid-generation because
  // max_tokens was hit, not because the model was actually done — callers
  // that show this to the user need to know, or a cut-off reply looks
  // finished and a "continue" follow-up has nothing to anchor to (see
  // CONVERSATION_HISTORY handling in the Ask classify/compose prompts).
  return{text:txt.trim(),truncated:d.choices?.[0]?.finish_reason==='length'};
}
// 'none' is the only reasoning_effort value every call site has actually
// exercised successfully — 'low'/'high' are unverified against whatever
// model is really configured (see the model-string caveat elsewhere in this
// file). If a call requesting one of those fails, retry once at 'none'
// before giving up, so a rejected param costs latency, not the whole
// answer — and log loudly either way, since silently swallowing this into a
// deterministic fallback (the previous behavior) makes a broken AI call
// indistinguishable from the AI just being terse.
async function aiChatResilient(prompt,settings,opts){
  try{return await aiChat(prompt,settings,opts);}
  catch(err){
    if(opts.reasoningEffort&&opts.reasoningEffort!=='none'){
      console.error(`aiChat failed at reasoningEffort='${opts.reasoningEffort}', retrying at 'none':`,err);
      return aiChat(prompt,settings,{...opts,reasoningEffort:'none'});
    }
    throw err;
  }
}

// Stage 1: turn the question into a structured, checkable spec. This model
// is given ZERO trade data — it cannot hallucinate a stat because it has
// nothing to hallucinate from. The advice/opinion refusal, the impliesAdvice
// closing line, and the Demo/Real ambiguity check all happen on this JSON in
// plain app code (see Ask component), never by trusting a generated sentence
// to self-censor.
const ASK_CLASSIFY_PROMPT=`You are a query classifier for a trading journal app. You have NOT been given any trade data and must never state a number, percentage, date, or fact about the user's trades. Your only job: read the question and output JSON describing what's being asked. Output ONLY valid JSON, no prose, matching exactly this shape:

{
  "intent": "DATA_QUERY" | "TRADING_ADVISORY" | "ADVICE_OR_OPINION" | "GENERAL_KNOWLEDGE" | "OUT_OF_SCOPE",
  "mode": "DEMO" | "REAL" | "AMBIGUOUS",
  "metric": "WIN_RATE" | "PNL" | "TRADE_COUNT" | "STREAK" | "GRADE_BREAKDOWN" | "PAIR_BREAKDOWN" | "STRATEGY_BREAKDOWN" | "OFF_PLAN_IMPACT" | "DAY_OF_WEEK" | "SESSION_NUMBER" | "TIME_OF_DAY" | "MONEY_MGMT" | "RISK_ASSESSMENT" | "DISCIPLINE" | "ZONE_QUALITY" | "SESSION_PATTERNS" | "PERFORMANCE_REVIEW" | "SESSION_PREP" | null,
  "range": "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CURRENT_MONTH" | "PREV_MONTH" | "ALL" | null,
  "impliesAdvice": true | false,
  "advisoryType": "RISK_REVIEW" | "MONEY_MGMT_GUIDANCE" | "DISCIPLINE_CHECK" | "PERFORMANCE_REVIEW" | "SESSION_PREP" | "STRATEGY_GUIDANCE" | null
}

Rules:
- intent=TRADING_ADVISORY when the question asks for actionable guidance, coaching, or a review based on the trader's own data and patterns ("should I adjust my risk?", "how should I manage my AM style?", "am I disciplined enough?", "what should I focus on?", "review my performance", "give me a performance review", "how are my sessions going?", "should I prepare for my next session?", "what's my biggest weakness?", "how is my money management working?", "grade my trading", "what strategy should I stay consistent with?", "which strategy would you say is working best for me?", "which strategy should I focus on?", "what's my most reliable setup?"). This includes ANY question phrased as asking for the assistant's own read/opinion/recommendation grounded in the trader's data — "what would you say...", "which X would you recommend...", "what's your take on..." — not just literal "should I" phrasing.
- intent=GENERAL_KNOWLEDGE for trading education/concept questions that do NOT ask about the trader's own data and do NOT ask for a market prediction or a live trade opinion — pure "what is/explain/how does X work" questions ("what is a supply zone?", "explain RSI", "what does OTC mean?", "what's the difference between Demand and Supply zones?", "how does binary options payout work?", "what is Anti-Martingale money management?", "what's a good risk percent for beginners in general?"). This ALSO covers recommending a strategy/setup from the app's own known playbook when the question has NO personal-data angle — "what strategies would you teach a complete beginner?", "which setup works best in a ranging market?", "what's the most reliable price-action strategy?", "what would you start with as a beginner?". Recommending a named, rule-based, documented strategy is knowledge, not opinion — it's fundamentally different from predicting where a market is headed. These all get a real, helpful, conversational answer — never refused just because they're not about the user's own trades, and never misrouted to ADVICE_OR_OPINION just because the word "best" or "recommend" appears.
- intent=ADVICE_OR_OPINION ONLY when the question asks for a live market direction call, a prediction, or a go/no-go opinion on a SPECIFIC trade happening right now — "will EUR/USD go up?", "is this pair about to reverse?", "should I trade gold today?", "is now a good time to enter?". Do NOT use this for "which strategy/setup should I use" questions — those are GENERAL_KNOWLEDGE (no personal data) or TRADING_ADVISORY/STRATEGY_GUIDANCE (grounded in the trader's own data) instead, never ADVICE_OR_OPINION.
- impliesAdvice=true whenever the question attaches a should/stop/change hook to an otherwise answerable data question ("should I stop trading Wednesdays?" -> intent=DATA_QUERY, metric=DAY_OF_WEEK, impliesAdvice=true). The data half still gets answered; only the "should" half is declined.
- intent=DATA_QUERY for anything answerable by counting/aggregating/cross-referencing the user's own logged trades, including broad questions ("how am I doing this month") — leave metric as the closest single primary metric (e.g. WIN_RATE); the app checks other dimensions automatically.
- intent=OUT_OF_SCOPE only for questions that have nothing to do with trading or this journal at all (general life questions, unrelated topics, requests to do something outside a trading journal's scope).
- mode=AMBIGUOUS whenever Demo/Real isn't specified or clearly implied — do not guess or default.
- If intent=TRADING_ADVISORY, fill advisoryType with the most relevant domain: RISK_REVIEW for risk%/edge questions, MONEY_MGMT_GUIDANCE for AM/PL/Fixed style questions, DISCIPLINE_CHECK for off-plan/following-rules questions, PERFORMANCE_REVIEW for broad review requests, SESSION_PREP for pre-session questions, STRATEGY_GUIDANCE for questions about which strategy/setup to use, favor, or stay consistent with.
- If intent=ADVICE_OR_OPINION, still fill "metric" with whatever data dimension the question is closest to, if any (e.g. PAIR_BREAKDOWN for "should I trade gold today?"), so the app can offer that data alongside declining the prediction — leave it null if nothing fits.
- "range" defaults to "ALL" if the question doesn't specify a time period.
- CONTINUATION REQUESTS: if the question is a short, bare continuation phrase ("continue", "keep going", "go on", "finish that", "more", and similar) with no real content of its own, do NOT classify it as OUT_OF_SCOPE just because it's contentless in isolation. Look at CONVERSATION_HISTORY (if provided) — find the real question that produced the assistant's most recent answer, and classify THIS message exactly the way you would have classified THAT original question (same intent/metric/mode/range/advisoryType). If there's no CONVERSATION_HISTORY, or nothing in it looks like a cut-off answer to continue, treat it as OUT_OF_SCOPE as usual — this rule only fires for genuine continuations of a real prior exchange.

CONVERSATION_HISTORY may follow below the question if this is a continuing chat.

Question: `;

// Stage 3 (stage 2 is the app's own FACTS computation, no LLM involved):
// compose 1-4 factual sentences from FACTS. FACTS is the ONLY source of
// truth this call is allowed to cite from. Note: the impliesAdvice closing
// line ("What to do with that is your call.") is appended by app code after
// this call returns, not by this prompt — same reasoning as the classifier's
// refusal gate: a boundary enforced in code can't be skipped by a model that
// forgets an instruction.
const ASK_COMPOSE_PROMPT=`You are a factual data-reporting assistant for a trading journal app. You will receive a JSON object FACTS containing pre-computed statistics from the user's own logged trades, and possibly a FACTS.secondaryPattern object describing a statistically notable cross-dimensional correlation. Answer using ONLY the numbers in FACTS.

1. Never state a number, percentage, date, or count not present in FACTS. If FACTS can't answer the question, say so plainly — never estimate or infer.
2. Every win rate you mention must be immediately followed by its 95% confidence interval and sample size exactly as given in FACTS (e.g. "62% (95% CI: 54%-70%, n=41)"). Never a bare percentage.
3. If a FACTS entry's n is below 20, add one short small-sample caveat (e.g. "based on only 16 trades — worth watching, not yet conclusive").
4. If FACTS.secondaryPattern is present AND genuinely relevant to the question, mention it — but ALWAYS open that mention with a framing sentence naming how many dimensions were checked (FACTS.secondaryPattern.dimensionsChecked), e.g. "Checked 8 dimensions of your data; this was the one pattern that showed a real statistical separation from your baseline." Never present it as if it were the only thing examined. If secondaryPattern is absent, or mentioning it would be a non-sequitur, say nothing about it — do not force a cross-reference into every answer.
5. Never give advice, a recommendation, a prediction, or an opinion on whether a number is good, bad, enough, or ready. State it and stop.
6. Never offer encouragement, reassurance, praise, or sympathy. Factual tone only — a query result, not a coach.
7. Never suggest changing strategy, trade style, risk, or behavior.
8. 1-4 sentences (up to 4 only when a secondary pattern is included). No bullet essays, no follow-up questions.
9. Always state which mode (Demo or Real) and date range the numbers cover — both are given in FACTS.
10. If FACTS.rows is present (a breakdown across grades/strategies/pairs/etc.), you MUST state each row's win rate (with its CI, per rule 2) — never reduce a breakdown to trade counts alone. Counts by themselves don't answer which one performed better.
11. If FACTS.impliesAdvice is true, the question attached a should/stop/change hook to itself — after stating the data (rule 5 still applies, no recommendation), close with a brief, natural note that the decision is theirs. Don't skip this when impliesAdvice is true, but don't use a canned line either.

FACTS:
`;

// TheGiftedMan Price Action Playbook — the app's core teaching curriculum.
// Baked in as fixed knowledge (same treatment as the Zone Analyzer's own S&D
// rules, see PROMPT above), not left to the model's general trading
// "knowledge" — these are specific, curated setups, not folklore. Shared by
// GENERAL_KNOWLEDGE_PROMPT (explaining a setup) and the advisory pipeline
// (recommending one, combined with the user's own real per-strategy data).
// Kept deliberately terse — this gets sent in full on every relevant call,
// across three different prompts, and Groq's free-tier TPM rate limit is a
// real, hit-in-practice constraint (not just a cost nicety). Same facts as
// the original document, no prose padding.
const PRICE_ACTION_PLAYBOOK=`TheGiftedMan Price Action Playbook — 7 setups, 1-min chart, 2-min expiry, no indicators:
1. Break & Retest — level (2+ prior touches) breaks, retest, rejection candle confirms flip. Best: trending. Avoid: ranging.
2. Engulfing Reversal — candle fully engulfs prior body after a short directional move. Best: ranging/exhaustion. Avoid: strong mid-trend.
3. Double Top/Bottom — price fails same level twice, 2nd failure confirms defense. Best: ranging/exhaustion. Avoid: strong mid-trend.
4. 3-Candle Continuation — brief pause in a strong run, enter on trend resuming. With-trend only. Best: strong trending. Avoid: ranging.
5. Inside Bar Breakout — candle fully inside prior candle's range, enter on break of that range. Best: with-trend either direction. Avoid: counter-trend breaks.
6. S&D Zone Retest — price returns to a fresh zone that launched a strong move, enters on rejection. Best: trending, zone matches trend. Avoid: ranging/zone against trend. (Same setup the Zone Analyzer's 10-gate system grades authoritatively — defer to that grading over this summary.)
7. Fakeout Reversal — weak breakout, no follow-through, strong reversal back through the level. Best: ranging/level boundaries. Avoid: strong trending (breaks usually real).

Core rules: 1-min candles, 2-min expiry at confirmation candle's close, mirrored buy/sell, no trade within 15min of high-impact news, max 3-5 trades/session, stop after 2 consecutive losses. Identify market condition (trend/range/exhaustion) before picking a strategy — the top cause of failure is using the wrong strategy for the condition. Testing: one strategy at a time, 20-30 trades minimum, track off-plan separately from losses, compare against breakeven (~52.6% at 90% payout) not 50%. No setup is a guaranteed win.`;

// General trading education — deliberately separate from ASK_COMPOSE_PROMPT
// (which is only ever allowed to cite FACTS) since this path has no user
// data at all and must never pretend otherwise. Conversational and helpful
// like a normal chatbot, but still fenced away from the two things that
// actually matter for a real-money app: it can't touch the user's own
// numbers (it has none), and it can't turn into a market call.
const GENERAL_KNOWLEDGE_PROMPT=`You are a knowledgeable, conversational trading educator inside a binary options trading journal app. Answer the question naturally and helpfully, like a real chat assistant — not a rigid data report.

1. You have NOT been given any of this user's personal trade data — never reference or imply anything about their specific performance, balance, or history. If the question drifts into "how am I doing," redirect: that part needs their own data, which this path doesn't have.
2. Explain concepts, terminology, mechanics, and general trading education clearly — supply/demand zones, money management styles, risk concepts, indicators, session structure, general best practices, etc.
3. Never predict specific market direction, never recommend a specific live trade, entry, or exit, and never state or imply a guaranteed outcome. If asked for one, say plainly that's outside what you'll do here, and offer the general concept instead if there is one.
4. It's fine to be opinionated about well-established trading principles (e.g. "most traders find X excessive") as long as you're not predicting a market or guaranteeing a result.
5. Normal conversational length and tone — this isn't capped to a rigid sentence count like the data-reporting path. Be concise but natural, and feel free to ask a clarifying question if the request is genuinely ambiguous.
6. You have access to PLAYBOOK below — the app's own curated strategy set. When asked to explain a setup, recommend a strategy, or discuss "what's profitable," ground your answer in PLAYBOOK rather than generic textbook trading knowledge.
7. PLAYBOOK is calibrated to a 1-minute chart / 2-minute expiry specifically. If asked about a different expiry or timeframe, you may reason about how the same underlying logic (level tests, candle structure) would likely extend there — but say explicitly, every time this comes up, that this specific expiry/timeframe was never actually validated in the document, so it's your reasoned extrapolation, not a tested claim. Don't drop that caveat after the first mention in a conversation.
8. If CONVERSATION_HISTORY is present and its last entry is your own previous answer that reads as cut off mid-thought (ends abruptly, mid-sentence, or is marked as cut off), and the current question is a short continuation request ("continue", "keep going", "go on", "more"), continue directly from exactly where that answer left off — do not restart, re-summarize, or repeat what was already said.

PLAYBOOK:
${PRICE_ACTION_PLAYBOOK}

Question: `;

// Market-opinion/live-trade questions — previously a fixed refusal string
// with no LLM call at all. Now a real generated response: the "no
// prediction/no guarantee" boundary is a prompt instruction here (soft),
// same trust level as the rest of the model's behavior, rather than a
// hardcoded non-answer. FACTS (if the question has a data angle) stays
// real/computed either way — this prompt doesn't get to invent stats.
const ADVICE_OPINION_PROMPT=`You are a trading assistant inside a binary options journal app. The user is asking something in the direction of a market opinion, a prediction, or a specific live-trade call.

1. Never predict specific market direction, never recommend a specific live trade/entry/exit, and never state or imply a guaranteed outcome — this is real money and you could simply be wrong.
2. Don't just refuse the whole question — engage with what's actually answerable: general considerations, what a trader would typically weigh, why a confident directional call isn't something you'll offer, or the general concept behind what they're asking.
3. If FACTS (their own data, when relevant to the question) is included below, you may reference it — but it answers "what have I done," never "what will the market do." Don't stretch it into a prediction.
4. Be direct and natural declining the prediction/guarantee part specifically, in your own words — not a canned refusal line.
5. Normal conversational length, not a rigid sentence count.
6. If CONVERSATION_HISTORY is present and its last entry is your own previous answer that reads as cut off mid-thought, and the current question is a short continuation request ("continue", "keep going", "go on", "more"), continue directly from where that answer left off — do not restart or repeat what was already said.
7. You have access to PLAYBOOK below — the app's own curated strategy set. If the question drifts toward "which strategy should I use" territory alongside its market-timing angle, ground the strategy part in PLAYBOOK rather than generic trading knowledge — recommending a named, documented strategy is fine even here; it's only the live market-direction/timing call you decline.

PLAYBOOK:
${PRICE_ACTION_PLAYBOOK}

Question: `;

// recentHistory lets the classifier resolve a bare "continue"/"keep going"
// against whatever real question actually produced the assistant's last
// (possibly truncated) answer — without it, a continuation request has
// nothing to anchor to and reads as contentless, which is exactly how it
// used to get misclassified as OUT_OF_SCOPE.
async function classifyAskQuery(question,settings,recentHistory){
  const historyBlock=recentHistory?.length?`\n\nCONVERSATION_HISTORY:${JSON.stringify(recentHistory)}`:'';
  const{text}=await aiChat(`${ASK_CLASSIFY_PROMPT}${question}${historyBlock}`,settings,{json:true,maxTokens:200});
  try{return JSON.parse(text.replace(/```json|```/g,'').trim());}
  catch{throw userError('Could not parse the classifier response. Try again.');}
}
async function composeAskAnswer(question,facts,settings){
  return(await aiChat(`${ASK_COMPOSE_PROMPT}${JSON.stringify(facts)}\n\nQuestion: ${question}`,settings,{maxTokens:300,temperature:0.2})).text;
}
async function composeGeneralKnowledge(question,settings,recentHistory){
  const historyBlock=recentHistory?.length?`\n\nCONVERSATION_HISTORY:${JSON.stringify(recentHistory)}\n`:'';
  return aiChatResilient(`${GENERAL_KNOWLEDGE_PROMPT}${question}${historyBlock}`,settings,{maxTokens:900,temperature:0.5,reasoningEffort:'low'});
}
async function composeAdviceOpinion(question,facts,settings,recentHistory){
  const factsBlock=facts?`\n\nFACTS:${JSON.stringify(facts)}\n`:'';
  const historyBlock=recentHistory?.length?`\n\nCONVERSATION_HISTORY:${JSON.stringify(recentHistory)}\n`:'';
  return aiChatResilient(`${ADVICE_OPINION_PROMPT}${question}${factsBlock}${historyBlock}`,settings,{maxTokens:900,temperature:0.5,reasoningEffort:'low'});
}

// ── Pattern detection (deterministic, no LLM) ───────────────────────────────
// Scanning 8 dimensions at once for the first "interesting-looking" bucket
// inflates the false-positive rate — a full Bonferroni correction would fix
// that rigorously but would suppress nearly every finding at this data
// scale, defeating the point of a personal-reflection feature. The
// proportionate version: keep the core test simple (non-overlapping
// confidence intervals vs baseline) but raise the floor for even
// considering a bucket, so thin buckets never reach the test at all.
const PATTERN_DIMENSIONS=['sessionNum','dayOfWeek','hourBucket','pair','strategy','zoneGrade','offPlan','streakPosition'];
const PATTERN_MIN_N=15;          // floor for even considering a bucket
const PATTERN_SMALL_SAMPLE_N=20; // n in [15,19] still clears the floor but keeps the caveat
function ciOverlaps(a,b){return a.lower<=b.upper&&b.lower<=a.upper;}
function fmtHour(h){const hh=((h%24)+24)%24;const period=hh<12?'am':'pm';const h12=hh%12===0?12:hh%12;return`${h12}${period}`;}
// One row per bucket value for a dimension — {dimension,label,n,wins}. No CI
// here; findNotablePattern and computeAskFacts each decide when to attach one.
function bucketsFor(dimension,done,strategies){
  const groups={};
  const push=(label,t)=>{
    if(label==null)return;
    if(!groups[label])groups[label]={wins:0,n:0};
    groups[label].n++;
    if(t.outcome==='WIN')groups[label].wins++;
  };
  if(dimension==='streakPosition'){
    // Tags each trade by the streak state that PRECEDED it (chronological),
    // not the streak it's part of looking backward — "was the trader on a
    // 3+ streak walking into this trade" is the tilt-relevant question.
    const chrono=[...done].sort((a,b)=>a.timestamp-b.timestamp);
    let streakType=null,streakLen=0;
    for(const t of chrono){
      let label='Neutral';
      if(streakType==='LOSS'&&streakLen>=3)label='After 3+ loss streak';
      else if(streakType==='WIN'&&streakLen>=3)label='After 3+ win streak';
      push(label,t);
      if(t.outcome===streakType)streakLen++;else{streakType=t.outcome;streakLen=1;}
    }
  }else{
    done.forEach(t=>{
      let label;
      switch(dimension){
        case'sessionNum':label=t.sessionNum!=null?`Session ${t.sessionNum}`:null;break;
        case'dayOfWeek':label=new Date(t.timestamp).toLocaleDateString(undefined,{weekday:'long'});break;
        case'hourBucket':{const h=new Date(t.timestamp).getHours();const start=Math.floor(h/4)*4;label=`${fmtHour(start)}-${fmtHour(start+4)}`;break;}
        case'pair':label=t.pair||null;break;
        case'strategy':label=strategyLabel(t.strategyId||'zone-sd',strategies);break;
        case'zoneGrade':label=t.zoneGrade||null;break;
        case'offPlan':label=t.offPlan?'Off-plan':'On-plan';break;
        default:label=null;
      }
      push(label,t);
    });
  }
  return Object.entries(groups).map(([label,g])=>({dimension,label,n:g.n,wins:g.wins}));
}
// The single most notable cross-dimensional finding for this mode/range, or
// null if nothing clears the bar. Used both as computeAskFacts's
// secondaryPattern (scoped to the question's own range) and, unscoped, as
// the "Surface something interesting" button's entire answer.
function findNotablePattern(trades,mode,range={preset:'ALL',start:null,end:null},strategies){
  const scoped=tradesInRange(trades,mode,range);
  const done=scoped.filter(t=>t.outcome!=='PENDING');
  if(!done.length)return null;
  const baseWins=done.filter(t=>t.outcome==='WIN').length;
  const baseWr=baseWins/done.length;
  const baseCI=wilsonInterval(baseWins,done.length);
  const candidates=PATTERN_DIMENSIONS
    .flatMap(dim=>bucketsFor(dim,done,strategies))
    .filter(b=>b.n>=PATTERN_MIN_N)
    .map(b=>({...b,wr:b.wins/b.n,ci:wilsonInterval(b.wins,b.n)}))
    .filter(b=>!ciOverlaps(b.ci,baseCI));
  if(!candidates.length)return null;
  const best=candidates.sort((a,b)=>Math.abs(b.wr-baseWr)-Math.abs(a.wr-baseWr))[0];
  return{
    dimension:best.dimension,label:best.label,n:best.n,wins:best.wins,
    wr:Math.round(best.wr*1000)/10,
    ciLower:Math.round(best.ci.lower*1000)/10,ciUpper:Math.round(best.ci.upper*1000)/10,
    baselineWr:Math.round(baseWr*1000)/10,
    baselineCiLower:Math.round(baseCI.lower*1000)/10,baselineCiUpper:Math.round(baseCI.upper*1000)/10,
    baselineN:done.length,dimensionsChecked:PATTERN_DIMENSIONS.length,
    smallSample:best.n<PATTERN_SMALL_SAMPLE_N,mode,rangeLabel:rangeLabel(range),
  };
}
// Non-generated rendering of a pattern finding — the framing sentence is
// baked in here too, so the fallback path (composer call fails) never skips
// the "checked N dimensions" context the compose prompt otherwise supplies.
function patternToText(p){
  return`Checked ${p.dimensionsChecked} dimensions of your ${p.mode==='REAL'?'Real':'Demo'} data (${p.rangeLabel}); this was the one pattern that showed a real statistical separation from your baseline. ${p.label} trades win at ${p.wr}% (95% CI: ${p.ciLower}%-${p.ciUpper}%, n=${p.n}) versus your overall ${p.baselineWr}% (95% CI: ${p.baselineCiLower}%-${p.baselineCiUpper}%, n=${p.baselineN})${p.smallSample?` — based on only ${p.n} trades, worth watching, not yet conclusive.`:'.'}`;
}
const PATTERN_SCAN_QUESTION='Surface the most notable pattern in my data.';
const NO_PATTERN_TEXT="Nothing crosses the significance bar right now — no dimension's win rate is separated enough from your baseline to call out. Check back as you log more trades.";

// Stage 2: deterministic — reuses the same primitives Analytics/Dashboard
// already use (tradesInRange, wilsonInterval, computeDigest) so the LLM
// never computes a number itself, only phrases numbers computed here.
function computeAskFacts(spec,trades,mode,strategies){
  const range={preset:spec.range||'ALL',start:null,end:null};
  const scoped=tradesInRange(trades,mode,range);
  const done=scoped.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const base={mode,rangeLabel:rangeLabel(range),n:done.length};
  const wrStat=(list)=>{
    const w=list.filter(t=>t.outcome==='WIN').length;
    const ci=wilsonInterval(w,list.length);
    return{n:list.length,wins:w,wr:list.length?Math.round((w/list.length)*1000)/10:null,ciLower:Math.round(ci.lower*1000)/10,ciUpper:Math.round(ci.upper*1000)/10};
  };
  const bucketRowsWithCI=(dimension)=>bucketsFor(dimension,done,strategies).map(b=>{
    const ci=wilsonInterval(b.wins,b.n);
    return{label:b.label,n:b.n,wins:b.wins,wr:b.n?Math.round((b.wins/b.n)*1000)/10:null,ciLower:Math.round(ci.lower*1000)/10,ciUpper:Math.round(ci.upper*1000)/10};
  }).sort((a,b)=>b.n-a.n);
  let result;
  switch(spec.metric){
    case'PNL':result={...base,pnl:Math.round(done.reduce((s,t)=>s+t.pnl,0)*100)/100};break;
    case'TRADE_COUNT':result={...base,wins,losses:done.length-wins};break;
    case'STREAK':{
      const byRecency=[...done].sort((a,b)=>b.timestamp-a.timestamp);
      let streak=0,type=null;
      for(const t of byRecency){if(!type){type=t.outcome;streak=1;}else if(t.outcome===type)streak++;else break;}
      result={...base,streak,streakType:type};break;
    }
    case'GRADE_BREAKDOWN':result={...base,rows:['A+','A','B','C','INVALID','UNGRADED'].map(g=>({grade:g,...wrStat(done.filter(t=>t.zoneGrade===g))})).filter(r=>r.n>0)};break;
    case'STRATEGY_BREAKDOWN':result={...base,rows:[...new Set(done.map(t=>t.strategyId||'zone-sd'))].map(id=>{
      const st=done.filter(t=>(t.strategyId||'zone-sd')===id);
      return{strategy:strategyLabel(id,strategies),...wrStat(st),pnl:Math.round(st.reduce((a,t)=>a+t.pnl,0)*100)/100};
    }).filter(r=>r.n>0)};break;
    case'PAIR_BREAKDOWN':{
      const byPair={};done.forEach(t=>{(byPair[t.pair]=byPair[t.pair]||[]).push(t);});
      result={...base,rows:Object.entries(byPair).map(([pair,list])=>({pair,...wrStat(list)})).sort((a,b)=>b.n-a.n).slice(0,8)};break;
    }
    case'OFF_PLAN_IMPACT':{
      const{start,end}=rangeBounds(range);
      const d=computeDigest({trades,analyses:[],mode,start,end});
      result={...base,offPlanCount:d.offPlanCount,offPlanWr:d.offPlanDoneCount?Math.round(d.offPlanWr*10)/10:null,onPlanWr:d.onPlanDoneCount?Math.round(d.onPlanWr*10)/10:null,offPlanPnl:Math.round(d.offPlanPnl*100)/100,offPlanN:d.offPlanDoneCount,onPlanN:d.onPlanDoneCount};break;
    }
    case'DAY_OF_WEEK':result={...base,rows:bucketRowsWithCI('dayOfWeek')};break;
    case'SESSION_NUMBER':result={...base,rows:bucketRowsWithCI('sessionNum')};break;
    case'TIME_OF_DAY':result={...base,rows:bucketRowsWithCI('hourBucket')};break;
    case'WIN_RATE':
    default:result={...base,...wrStat(done)};
  }
  // Cross-references every DATA_QUERY answer against the other 7 dimensions,
  // scoped to the same range — cheap (plain array math), so it runs always;
  // whether the composer mentions it is a prompt decision (rule 4), not
  // something recomputed per question type.
  const pattern=findNotablePattern(trades,mode,range,strategies);
  if(pattern)result.secondaryPattern=pattern;
  return result;
}
// One-line, non-generated rendering of FACTS — used both as the "here's the
// data instead" tail on an advice refusal, and as a fallback if the compose
// call itself fails, so a broken LLM call still shows real numbers.
function factsToText(facts){
  let base;
  if(facts.rows)base=facts.rows.map(r=>{
    const label=r.grade||r.strategy||r.pair||r.label;
    return r.wr==null?`${label}: no completed trades`:`${label}: ${r.wr}% (95% CI: ${r.ciLower}%-${r.ciUpper}%, n=${r.n})`;
  }).join(' · ')||'No completed trades in this range.';
  else if('pnl'in facts&&!('wr'in facts))base=`P&L: ${facts.pnl>=0?'+':''}${facts.pnl} (n=${facts.n})`;
  else if('streak'in facts)base=facts.streakType?`Current streak: ${facts.streak} ${facts.streakType==='WIN'?'wins':'losses'}`:'No completed trades yet.';
  else if('offPlanCount'in facts)base=`Off-plan: ${facts.offPlanCount} trades, ${facts.offPlanWr!=null?facts.offPlanWr+'%':'—'} win rate (n=${facts.offPlanN||0}) vs on-plan ${facts.onPlanWr!=null?facts.onPlanWr+'%':'—'} (n=${facts.onPlanN||0}).`;
  else if('wins'in facts&&!('wr'in facts))base=`${facts.n} trades — ${facts.wins}W / ${facts.losses}L`;
  else base=facts.wr==null?'No completed trades in this range.':`${facts.wr}% (95% CI: ${facts.ciLower}%-${facts.ciUpper}%, n=${facts.n})`;
  return facts.secondaryPattern?`${base} ${patternToText(facts.secondaryPattern)}`:base;
}

// ── Trader Profile Builder (Ask Advisory) ─────────────────────────────────────
// Aggregates every available data source into one holistic object the LLM can
// reason about for advisory responses — trades, sessions, withdrawals, zone
// analyses, money management settings, strategies, and discipline patterns.
function buildTraderProfile(trades,sessions,analyses,wds,settings,strategies,mode){
  const modeTrades=(trades||[]).filter(t=>getTradeMode(t)===mode);
  const done=modeTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=done.length?Math.round((wins/done.length)*1000)/10:0;
  const ci=wilsonInterval(wins,done.length);
  const edge=Math.max(0,(wr/100)-((100-wr)/100));
  const totalPnl=Math.round(done.reduce((s,t)=>s+t.pnl,0)*100)/100;
  const startBal=getStartingBalanceForMode(settings,mode);
  const curBal=balForMode(settings,trades,wds,mode);
  const style=getMoneyMgmtStyleForMode(settings,mode);
  const tradeStyle=getTradeStyleForMode(settings,mode);
  // Rolling windows
  const now=Date.now();
  const last7=computeDigest({trades,analyses,mode,start:now-7*DAY_MS,end:now});
  const last30=computeDigest({trades,analyses,mode,start:now-30*DAY_MS,end:now});
  // Grade breakdown
  const grades={};
  done.forEach(t=>{const g=t.zoneGrade||'UNGRADED';if(!grades[g])grades[g]={wins:0,n:0,pnl:0};grades[g].n++;if(t.outcome==='WIN')grades[g].wins++;grades[g].pnl+=t.pnl;});
  const gradeBreakdown=Object.entries(grades).map(([g,d])=>({grade:g,n:d.n,wins:d.wins,wr:d.n?Math.round((d.wins/d.n)*1000)/10:0,pnl:Math.round(d.pnl*100)/100})).sort((a,b)=>b.n-a.n);
  // Strategy breakdown with descriptions — plus a per-strategy grade cross-tab
  // and off-plan rate, so refinement coaching can point at WHERE within a
  // strategy the real edge is (e.g. "your Trend/Pattern description says any
  // clear trend, but only A/A+ trades in it clear breakeven") rather than
  // only comparing whole strategies against each other.
  const stratMap={};
  done.forEach(t=>{
    const sid=t.strategyId||'zone-sd';
    if(!stratMap[sid])stratMap[sid]={wins:0,n:0,pnl:0,offPlan:0,grades:{}};
    const s=stratMap[sid];
    s.n++;if(t.outcome==='WIN')s.wins++;s.pnl+=t.pnl;if(t.offPlan)s.offPlan++;
    const g=t.zoneGrade||'UNGRADED';
    if(!s.grades[g])s.grades[g]={wins:0,n:0};
    s.grades[g].n++;if(t.outcome==='WIN')s.grades[g].wins++;
  });
  const strategyBreakdown=Object.entries(stratMap).map(([id,d])=>{
    const strat=(strategies||[]).find(s=>s.id===id);
    const gradeBreakdownWithinStrategy=Object.entries(d.grades)
      .map(([g,gd])=>({grade:g,n:gd.n,wins:gd.wins,wr:gd.n?Math.round((gd.wins/gd.n)*1000)/10:0}))
      .sort((a,b)=>b.n-a.n);
    return{id,name:strat?.name||strategyLabel(id,strategies),description:strat?.description||null,
      n:d.n,wins:d.wins,wr:d.n?Math.round((d.wins/d.n)*1000)/10:0,pnl:Math.round(d.pnl*100)/100,
      offPlanRate:d.n?Math.round((d.offPlan/d.n)*1000)/10:0,gradeBreakdownWithinStrategy};
  }).sort((a,b)=>b.n-a.n);
  // Recent trades (last 15 with notes and grades — gives AI context on recent behavior)
  const recentTrades=[...done].sort((a,b)=>b.timestamp-a.timestamp).slice(0,15).map(t=>({
    timestamp:new Date(t.timestamp).toISOString().split('T')[0],
    pair:t.pair,direction:t.direction,zoneGrade:t.zoneGrade,outcome:t.outcome,
    pnl:Math.round(t.pnl*100)/100,stake:t.stake,offPlan:!!t.offPlan,
    strategy:strategyLabel(t.strategyId||'zone-sd',strategies),
    notes:t.notes||null,source:t.source||null,
    accountMode:getTradeMode(t),
  }));
  // Session history (all completed sessions for this mode)
  const modeSessions=(sessions||[]).filter(s=>s.accountMode===mode).sort((a,b)=>b.startTime-a.startTime);
  const completedSessions=modeSessions.filter(s=>!s.isActive&&s.endTime);
  const sessionEndReasons={};
  completedSessions.forEach(s=>{const r=s.lockReason||s.endReason||'COMPLETED';sessionEndReasons[r]=(sessionEndReasons[r]||0)+1;});
  const avgTradesPerSession=completedSessions.length?Math.round(completedSessions.reduce((s,x)=>s+x.trades,0)/completedSessions.length*10)/10:0;
  // Escalation stats (AM/PL)
  let escalationStats=null;
  if(isEscalatingStyle(style)){
    const amSessions=completedSessions.filter(s=>s.amStreak>0||s.plStreak>0);
    let maxStreak=0,totalEscalations=0;
    modeSessions.forEach(s=>{
      const ms=Math.max(s.amStreak||0,s.plStreak||0);
      if(ms>maxStreak)maxStreak=ms;
      totalEscalations+=ms;
    });
    escalationStats={maxStreak,totalEscalations,sessionsWithEscalation:amSessions.length};
  }
  // Discipline — off-plan vs on-plan
  const offPlan=done.filter(t=>t.offPlan);
  const onPlan=done.filter(t=>!t.offPlan);
  const offPlanWr=offPlan.length?Math.round((offPlan.filter(t=>t.outcome==='WIN').length/offPlan.length)*1000)/10:0;
  const onPlanWr=onPlan.length?Math.round((onPlan.filter(t=>t.outcome==='WIN').length/onPlan.length)*1000)/10:0;
  const offPlanPnl=Math.round(offPlan.reduce((s,t)=>s+t.pnl,0)*100)/100;
  // Zone analysis quality
  const linkedIds=new Set(modeTrades.map(t=>t.analysisId).filter(Boolean));
  const linkedAnalyses=(analyses||[]).filter(a=>linkedIds.has(a.id));
  const gateFails={};
  linkedAnalyses.forEach(a=>{(a.gateResults||[]).forEach(g=>{if(!g.pass)gateFails[g.label]=(gateFails[g.label]||0)+1;});});
  const topGateFailures=Object.entries(gateFails).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const avgConfidence=linkedAnalyses.length?Math.round(linkedAnalyses.reduce((s,a)=>s+(a.confidence||0),0)/linkedAnalyses.length):0;
  // Risk patterns — after streaks
  const chrono=[...done].sort((a,b)=>a.timestamp-b.timestamp);
  let streakType=null,streakLen=0;
  const afterWinStreak=[],afterLossStreak=[];
  chrono.forEach(t=>{
    if(streakType==='WIN'&&streakLen>=3)afterWinStreak.push(t);
    if(streakType==='LOSS'&&streakLen>=3)afterLossStreak.push(t);
    if(t.outcome===streakType)streakLen++;else{streakType=t.outcome;streakLen=1;}
  });
  const afterWinWr=afterWinStreak.length?Math.round((afterWinStreak.filter(t=>t.outcome==='WIN').length/afterWinStreak.length)*1000)/10:null;
  const afterLossWr=afterLossStreak.length?Math.round((afterLossStreak.filter(t=>t.outcome==='WIN').length/afterLossStreak.length)*1000)/10:null;
  // Current streak
  const recency=[...done].sort((a,b)=>b.timestamp-a.timestamp);
  let curStreak=0,curType=null;
  for(const t of recency){if(!curType){curType=t.outcome;curStreak=1;}else if(t.outcome===curType)curStreak++;else break;}
  // Largest drawdown (max consecutive losses)
  let maxConLoss=0,curConLoss=0;
  chrono.forEach(t=>{if(t.outcome==='LOSS'){curConLoss++;if(curConLoss>maxConLoss)maxConLoss=curConLoss;}else{curConLoss=0;}});
  // Withdrawal summary (Real only)
  const modeWds=mode==='REAL'?(wds||[]):[];
  return{
    account:{mode,startingBalance:startBal,currentBalance:curBal,totalPnl,edge:Math.round(edge*1000)/10,tradeCount:done.length,winCount:wins,lossCount:done.length-wins,
      withdrawals:mode==='REAL'?{count:modeWds.length,totalAmount:Math.round(modeWds.reduce((s,w)=>s+w.amount,0)*100)/100}:null},
    performance:{allTime:{wr,ciLower:Math.round(ci.lower*1000)/10,ciUpper:Math.round(ci.upper*1000)/10,n:done.length,pnl:totalPnl,wins,losses:done.length-wins},
      last7Days:{wr:last7.wr,ciLower:last7.ci?Math.round(last7.ci.lower*1000)/10:null,ciUpper:last7.ci?Math.round(last7.ci.upper*1000)/10:null,n:last7.total,pnl:last7.realPnl,wins:last7.wins,losses:last7.total-last7.wins},
      last30Days:{wr:last30.wr,ciLower:last30.ci?Math.round(last30.ci.lower*1000)/10:null,ciUpper:last30.ci?Math.round(last30.ci.upper*1000)/10:null,n:last30.total,pnl:last30.realPnl,wins:last30.wins,losses:last30.total-last30.wins}},
    configuration:{activeStyle:styleName(tradeStyle),moneyMgmtStyle:style,riskPercent:settings?.riskPercent??5,
      sessionsPerDay:settings?.sessionsPerDay??2,brokerMin:settings?.brokerMin??10,
      strictLocking:isStrictForMode(settings,mode),
      ...(isEscalatingStyle(style)?{
        multiplier:getAmMultiplierForMode(settings,mode),ceilingPct:getAmCeilingPctForMode(settings,mode),
        profitTargetPct:getAmProfitTargetPctForMode(settings,mode),lossTargetPct:getAmLossTargetPctForMode(settings,mode),
        maxEscalations:getAmMaxEscalationsForMode(settings,mode),maxTrades:getAmMaxTradesForMode(settings,mode),
      }:null)},
    gradeBreakdown,strategyBreakdown,recentTrades,
    sessions:{completedCount:completedSessions.length,avgTradesPerSession,endReasons:sessionEndReasons,
      lastSession:completedSessions.length?{trades:completedSessions[0].trades,wins:completedSessions[0].wins,losses:completedSessions[0].losses,
        pnl:Math.round(completedSessions[0].sPnl*100)/100,endReason:completedSessions[0].lockReason||completedSessions[0].endReason||null}:null,
      escalationStats},
    discipline:{offPlanCount:offPlan.length,offPlanRate:done.length?Math.round((offPlan.length/done.length)*1000)/10:0,
      offPlanWr,offPlanPnl,onPlanWr,onPlanCount:onPlan.length},
    riskPatterns:{currentStreak:curStreak,currentStreakType:curType,maxConsecutiveLosses:maxConLoss,
      afterWinStreakWr:afterWinWr,afterWinStreakN:afterWinStreak.length,
      afterLossStreakWr:afterLossWr,afterLossStreakN:afterLossStreak.length},
    zoneAnalysis:{totalAnalyzed:linkedAnalyses.length,avgConfidence,
      gradeDistribution:gradeBreakdown,topGateFailures:topGateFailures.map(([l,c])=>({gate:l,count:c}))},
  };
}

// ── Advisory Pipeline (Ask) ───────────────────────────────────────────────────
// Builds the specific data slice the LLM needs for a given advisory domain,
// keeping the prompt context focused and token-efficient.
function buildAdvisoryContext(profile,question,advisoryType){
  switch(advisoryType){
    case'RISK_REVIEW':return{type:advisoryType,currentRisk:profile.configuration.riskPercent,
      edge:profile.account.edge,winRate:profile.performance.allTime.wr,n:profile.performance.allTime.n,
      moneyMgmtStyle:profile.configuration.moneyMgmtStyle,sessionsPerDay:profile.configuration.sessionsPerDay,
      recent7:profile.performance.last7Days,recent30:profile.performance.last30Days};
    case'MONEY_MGMT_GUIDANCE':return{type:advisoryType,style:profile.configuration.moneyMgmtStyle,
      config:{multiplier:profile.configuration.multiplier,ceilingPct:profile.configuration.ceilingPct,
        profitTargetPct:profile.configuration.profitTargetPct,lossTargetPct:profile.configuration.lossTargetPct,
        maxEscalations:profile.configuration.maxEscalations,maxTrades:profile.configuration.maxTrades},
      escalationStats:profile.sessions.escalationStats,currentBalance:profile.account.currentBalance,
      recentSessions:profile.sessions.lastSession};
    case'DISCIPLINE_CHECK':return{type:advisoryType,offPlanRate:profile.discipline.offPlanRate,
      offPlanWr:profile.discipline.offPlanWr,offPlanPnl:profile.discipline.offPlanPnl,
      onPlanWr:profile.discipline.onPlanWr,offPlanCount:profile.discipline.offPlanCount,
      onPlanCount:profile.discipline.onPlanCount,totalTrades:profile.account.tradeCount};
    case'PERFORMANCE_REVIEW':return{type:advisoryType,allTime:profile.performance.allTime,
      last7:profile.performance.last7Days,last30:profile.performance.last30Days,
      gradeBreakdown:profile.gradeBreakdown,strategyBreakdown:profile.strategyBreakdown,
      riskPatterns:profile.riskPatterns,zoneAnalysis:profile.zoneAnalysis};
    case'SESSION_PREP':return{type:advisoryType,config:profile.configuration,
      recentSessions:profile.sessions,endReasons:profile.sessions.endReasons,
      currentBalance:profile.account.currentBalance,riskPatterns:profile.riskPatterns};
    case'STRATEGY_GUIDANCE':return{type:advisoryType,strategyBreakdown:profile.strategyBreakdown,
      gradeBreakdown:profile.gradeBreakdown,allTime:profile.performance.allTime,
      recentTrades:profile.recentTrades,zoneAnalysis:profile.zoneAnalysis};
    default:return{type:advisoryType,profile};
  }
}
const ADVISORY_COMPOSE_PROMPT=`You are a professional trader acting as this trader's personal coach, with full access to their journal data, money management settings, trade grades, notes, strategies, session history, and discipline metrics. You have been given a CORE_SUMMARY of their account and an ADVISORY_CONTEXT containing the specific data relevant to this question (grade breakdowns, strategy performance, session history, discipline stats, etc. — whichever apply), and possibly a CONVERSATION_HISTORY of recent prior exchanges in this same session.

RULES:
1. Base ALL advice on the actual numbers in CORE_SUMMARY and ADVISORY_CONTEXT. Never invent statistics.
2. Always reference specific data points (grades, strategy names, session outcomes) to support your reasoning.
3. Keep advice actionable and specific — "reduce risk from X% to Y%" not "consider adjusting risk".
4. Give a clear, direct recommendation when the data supports one — say what you'd do, not just what's observable. State it as your read of their data, not an order; the trader can still disagree and always makes the final call, but don't retreat into "just something to consider" when the numbers point somewhere specific.
5. Acknowledge trade-offs and uncertainty — there is no single "right" answer in trading.
6. If the data is insufficient for a confident recommendation, say so clearly.
7. Always end with ONE specific, actionable takeaway the trader can act on today.
8. You MAY reference specific trade notes and grade patterns from recentTrades when relevant.
9. You MAY reference strategy descriptions and per-strategy performance from strategyBreakdown.
10. Never predict market direction, recommend specific entries/exits, or guarantee outcomes.
11. Tone: direct and invested, like a coach who's actually looked at the numbers — not a compliance disclaimer. Still no sugar-coating and no empty cheerleading, but when the data genuinely shows real improvement or good discipline, say so plainly instead of staying neutral out of caution.
12. If CONVERSATION_HISTORY is present, treat this as a continuing conversation — build on what you already told them rather than re-explaining from scratch, and note if new data changes a previous read. If its last entry is your own previous answer that reads as cut off mid-thought, and the current question is a short continuation request ("continue", "keep going", "go on", "more"), continue directly from where it left off — do not restart or repeat what was already said.
13. Strategy refinement (not just strategy selection): each strategyBreakdown entry includes gradeBreakdownWithinStrategy (win rate by grade INSIDE that strategy) and offPlanRate. Use these to propose a concrete refinement, not just "strategy A beats strategy B" — e.g. which grade floor to require, whether off-plan entries are what's actually dragging a strategy down, or specific wording to tighten the strategy's own description toward what the data shows actually wins. Quote the strategy's current description when proposing a change to it.

CORE_SUMMARY:
`;
// Appended only for advisoryTypes that actually touch strategy choice — the
// other 4 (risk/money-mgmt/discipline/session-prep) never reference a named
// strategy at all, so paying playbook-sized tokens on every single advisory
// call regardless of topic was pure waste. Real constraint, not a nicety:
// Groq's free-tier TPM rate limit gets hit in practice with this included
// unconditionally (see the "rate limit reached" error this was built to fix).
const PLAYBOOK_ADVISORY_TYPES=new Set(['STRATEGY_GUIDANCE','PERFORMANCE_REVIEW']);
const ADVISORY_PLAYBOOK_ADDENDUM=`
When recommending a strategy, combine PLAYBOOK's fixed rules with the trader's OWN real performance from strategyBreakdown — a recommendation grounded in only one of the two is weaker than one that cites both ("your Break & Retest win rate is X%, and it fits the trending condition you're asking about"). PLAYBOOK is calibrated to a 1-minute chart / 2-minute expiry specifically — if asked about a different expiry, you may reason about how the same underlying logic would likely extend there, but say explicitly, every time this comes up, that this specific expiry was never actually validated, so it's your reasoned extrapolation, not a tested claim. Don't drop that caveat after the first mention in a conversation.

PLAYBOOK:
${PRICE_ACTION_PLAYBOOK}
`;
function buildAdvisoryFallback(profile,advisoryType){
  const p=profile.performance.allTime;
  const base=`All-time: ${p.wr}% win rate (95% CI: ${p.ciLower}%-${p.ciUpper}%, n=${p.n}). P&L: ${p.pnl>=0?'+':''}$${p.pnl}.`;
  switch(advisoryType){
    case'RISK_REVIEW':return`${base} Current risk: ${profile.configuration.riskPercent}%. Edge: ${profile.account.edge}%. Money management: ${profile.configuration.moneyMgmtStyle}.`;
    case'MONEY_MGMT_GUIDANCE':return`${base} Style: ${profile.configuration.moneyMgmtStyle}. Sessions completed: ${profile.sessions.completedCount}. ${profile.sessions.lastSession?`Last session: ${profile.sessions.lastSession.wins}W/${profile.sessions.lastSession.losses}L.`:''}`;
    case'DISCIPLINE_CHECK':return`${base} Off-plan rate: ${profile.discipline.offPlanRate}% (${profile.discipline.offPlanCount} of ${profile.account.tradeCount}). Off-plan WR: ${profile.discipline.offPlanWr}% vs on-plan ${profile.discipline.onPlanWr}%.`;
    case'PERFORMANCE_REVIEW':return`${base} Last 7 days: ${profile.performance.last7Days.n} trades, ${profile.performance.last7Days.wins}W/${profile.performance.last7Days.losses}L. Last 30 days: ${profile.performance.last30Days.n} trades, ${profile.performance.last30Days.wins}W/${profile.performance.last30Days.losses}L.`;
    case'SESSION_PREP':return`${base} Style: ${profile.configuration.activeStyle}. Risk: ${profile.configuration.riskPercent}%. Sessions/day: ${profile.configuration.sessionsPerDay}. ${profile.riskPatterns.currentStreakType?`Current streak: ${profile.riskPatterns.currentStreak} ${profile.riskPatterns.currentStreakType}.`:'No active streak.'}`;
    case'STRATEGY_GUIDANCE':return`${base} By strategy: ${profile.strategyBreakdown.map(s=>`${s.name} ${s.wr}% (n=${s.n})`).join(', ')||'no strategy data yet'}.`;
    default:return base;
  }
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const card={background:'var(--surface-1)',borderRadius:'var(--radius)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:12,boxShadow:'var(--shadow-card), var(--highlight-top)'};
const inp={width:'100%',boxSizing:'border-box',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text-primary)',fontSize:14,outline:'none',transition:'border-color 0.15s ease, box-shadow 0.15s ease'};
const lbl={fontSize:12,fontWeight:500,color:'var(--text-muted)',marginBottom:4,display:'block'};
// g2/g3 (2/3-column grids) now live as .grid-2/.grid-3 in index.css — moved
// out of inline style so the mobile breakpoint there can actually reach them.

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

// Monotone cubic Hermite spline (same math as D3's curveMonotoneX / Recharts'
// "monotone" curve type) through a set of (x,y) points — passes through
// every real point exactly and never overshoots between two of them, unlike
// a full/natural cubic spline. That distinction matters here: P&L only
// actually changes at a completed trade, so a curve that dipped or spiked
// somewhere BETWEEN two real points (even if it still touched both) would
// misrepresent when the change happened. Monotone interpolation only ever
// smooths the joint at each point — it can't invent a move that didn't
// happen — so it's safe where a plain spline wouldn't be.
function monotonePath(xs,ys){
  const n=xs.length;
  if(n<2)return'';
  if(n===2)return`M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)} L ${xs[1].toFixed(2)} ${ys[1].toFixed(2)}`;
  const d=[];
  for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
  const m=[d[0]];
  for(let i=1;i<n-1;i++)m.push((d[i-1]<0)===(d[i]<0)&&d[i-1]!==0&&d[i]!==0?(d[i-1]+d[i])/2:0);
  m.push(d[n-2]);
  // Fritsch–Carlson: rescale each segment's tangent pair so the curve can't
  // overshoot past either endpoint's value.
  for(let i=0;i<n-1;i++){
    if(d[i]===0){m[i]=0;m[i+1]=0;continue;}
    const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;
    if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i];}
  }
  let path=`M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for(let i=0;i<n-1;i++){
    const dx=(xs[i+1]-xs[i])/3;
    const c1x=xs[i]+dx,c1y=ys[i]+m[i]*dx;
    const c2x=xs[i+1]-dx,c2y=ys[i+1]-m[i+1]*dx;
    path+=` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${xs[i+1].toFixed(2)} ${ys[i+1].toFixed(2)}`;
  }
  return path;
}
// points: [{t:timestamp, v:cumulative P&L}], sorted ascending by t.
// Renders as inline SVG (no charting library — every chart in this app is
// hand-rolled) with real axes/gridlines/reference line/hover tooltip.
// Note: color must be a solid paint value (e.g. var(--text-success)), not a
// CSS linear-gradient() — SVG fill/stroke attributes don't accept gradient()
// syntax, they need a color or a url(#id) reference to an SVG <linearGradient>.
function TrendChart({points,color}){
  const gradIdRef=useRef(`trendFill-${Math.random().toString(36).slice(2)}`);
  const[hoverIdx,setHoverIdx]=useState(null);
  if(points.length<3)return<div style={{padding:'2rem 0',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>Not enough completed trades yet to show a trend.</div>;

  const width=560,height=200,padL=54,padR=14,padT=14,padB=26;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const values=points.map(p=>p.v);
  // Always include 0 in the range so the breakeven reference line is never clipped off-chart.
  const rawMax=Math.max(...values,0),rawMin=Math.min(...values,0);
  const span=(rawMax-rawMin)||1,pad=span*0.1;
  const yMax=rawMax+pad,yMin=rawMin-pad,yRange=yMax-yMin||1;

  const x=i=>padL+(i/(points.length-1))*innerW;
  const y=v=>padT+innerH-((v-yMin)/yRange)*innerH;

  const xs=points.map((p,i)=>x(i)),ys=points.map(p=>y(p.v));
  const linePath=monotonePath(xs,ys);
  const areaPath=`${linePath} L ${x(points.length-1).toFixed(2)} ${(padT+innerH).toFixed(2)} L ${x(0).toFixed(2)} ${(padT+innerH).toFixed(2)} Z`;

  const yTickCount=4;
  const yTicks=Array.from({length:yTickCount+1},(_,i)=>yMin+yRange*i/yTickCount);
  const fmtAxisAmount=v=>(v>=0?'':'-')+'$'+Math.abs(Math.round(v));

  // Caps how many date labels render so a large trade history doesn't
  // produce one unreadable label per point.
  const maxXTicks=Math.min(6,points.length);
  const xTickIdxs=[...new Set(Array.from({length:maxXTicks},(_,i)=>Math.round(i*(points.length-1)/(maxXTicks-1||1))))];
  const fmtDate=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  const y0=y(0);

  function handleMove(e){
    const rect=e.currentTarget.getBoundingClientRect();
    const px=(e.clientX-rect.left)/rect.width*width;
    let nearest=0,best=Infinity;
    points.forEach((p,i)=>{const d=Math.abs(x(i)-px);if(d<best){best=d;nearest=i;}});
    setHoverIdx(nearest);
  }

  const hp=hoverIdx!=null?points[hoverIdx]:null;

  return(
    <div style={{position:'relative'}}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%',height:200,display:'block',cursor:'crosshair'}}
        onMouseMove={handleMove} onMouseLeave={()=>setHoverIdx(null)}>
        <defs>
          <linearGradient id={gradIdRef.current} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.04"/>
          </linearGradient>
        </defs>
        {yTicks.map((v,i)=>(
          <g key={i}>
            <line x1={padL} x2={width-padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
            <text x={padL-8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--text-muted)">{fmtAxisAmount(v)}</text>
          </g>
        ))}
        {xTickIdxs.map(i=>(
          <text key={i} x={x(i)} y={height-8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{fmtDate(points[i].t)}</text>
        ))}
        <line x1={padL} x2={width-padR} y1={y0} y2={y0} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
        <path d={areaPath} fill={`url(#${gradIdRef.current})`} stroke="none"/>
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {hp&&(
          <>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={padT} y2={padT+innerH} stroke="var(--border-strong)" strokeWidth="1"/>
            <circle cx={x(hoverIdx)} cy={y(hp.v)} r="4" fill={color} stroke="var(--surface-0)" strokeWidth="1.5"/>
          </>
        )}
      </svg>
      {hp&&(
        <div style={{position:'absolute',top:4,left:`${Math.min(Math.max((x(hoverIdx)/width)*100,12),88)}%`,transform:'translateX(-50%)',background:'var(--surface-1)',border:'1px solid var(--border-strong)',borderRadius:8,padding:'6px 10px',fontSize:11,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(0,0,0,0.25)'}}>
          <div style={{color:'var(--text-muted)'}}>{new Date(hp.t).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>
          <div style={{fontFamily:'var(--font-mono)',fontWeight:600,color:hp.v>=0?'var(--text-success)':'var(--text-danger)'}}>{(hp.v>=0?'+':'-')+f$(hp.v)}</div>
        </div>
      )}
    </div>
  );
}

function BarChart({items,color}){
  const max=Math.max(...items.map(i=>i.value),1);
  return(
    <div style={{display:'flex',gap:8,marginTop:8}}>
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
  const[f,sf]=useState({apiKey:'',groqApiKey:'',aiProvider:'gemini',startingBalanceDemo:'',startingBalanceReal:'',riskPercent:5,tradeStyle:1,tradeStyleDemo:1,tradeStyleReal:1,sessionsPerDay:2,brokerMin:10,milestones:DEF_MS,alertVolume:ALERT_VOLUME_DEFAULT});
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
            <h2 style={{fontSize:16,fontWeight:500,marginBottom:12,margin:'0 0 12px'}}>AI provider for zone analysis <span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}>(optional)</span></h2>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:14}}>Only needed for the Zone Analyzer's AI grading — the Journal, Quick Log, Anti-Martingale, Profit Lock, strategies, and Analytics all work without one. Add a key now or skip and come back to Settings whenever you want to use the Analyzer.</p>
            <div style={{marginBottom:14}}>
              <label style={lbl}>OpenRouter API key <span style={{color:'var(--text-muted)'}}>(openrouter.ai — free tier)</span></label>
              <input style={inp} type="password" placeholder="sk-or-v1-..." value={f.apiKey} onChange={e=>set('apiKey',e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Groq API key <span style={{color:'var(--text-muted)'}}>(console.groq.com — free tier)</span></label>
              <input style={inp} type="password" placeholder="gsk_..." value={f.groqApiKey||''} onChange={e=>set('groqApiKey',e.target.value)}/>
            </div>
            <p style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>Keys are stored in your account and used only for zone analysis requests.</p>
          </div>
        )}
        {step===2&&(
          <div>
            <h2 style={{fontSize:16,fontWeight:500,margin:'0 0 12px'}}>Account setup</h2>
            <div className="grid-2">
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
            <div className="grid-2">
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
          ?<button style={btn('pri')} onClick={()=>setStep(s=>s+1)}>
            {step===1&&!f.apiKey&&!f.groqApiKey?'Skip for now — I\'ll add this later →':'Next →'}
          </button>
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
// A genuinely valid, tiny (45-byte) 1-sample silent WAV, built from the
// format spec directly rather than a hand-typed/guessed base64 string — a
// malformed data URI would throw instead of playing, defeating the whole
// point. Used purely to consume real user-gesture credit synchronously
// inside a click handler, before the actual Jamendo track is available.
let _silentWavUrl=null;
function silentWavUrl(){
  if(_silentWavUrl)return _silentWavUrl;
  const buf=new ArrayBuffer(45);
  const dv=new DataView(buf);
  const writeStr=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
  writeStr(0,'RIFF');dv.setUint32(4,37,true);writeStr(8,'WAVE');
  writeStr(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
  dv.setUint32(24,8000,true);dv.setUint32(28,8000,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);
  writeStr(36,'data');dv.setUint32(40,1,true);dv.setUint8(44,128);
  _silentWavUrl=URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
  return _silentWavUrl;
}
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
  const alertPlayingRef=useRef(false); // true while the shared <audio> element is borrowed for a lock alert
  const autoStartWantedRef=useRef(false); // set by requestAutoStart(); consumed once tracks finish loading

  useEffect(()=>{
    if(!active){fetchedForRef.current=null;startedRef.current=false;autoStartWantedRef.current=false;return;}
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

  // Sets src and calls play() in the same synchronous tick — critical for
  // mobile Safari/Chrome, which only allow audio.play() to succeed when it's
  // called directly inside a user-gesture handler. Going through setState and
  // playing from a useEffect (the previous approach) puts play() a render
  // cycle away from the click/tap, so mobile browsers silently reject it —
  // the UI would show "Pause" but nothing actually played.
  function playTrackAt(i){
    if(!audioRef.current||!tracks?.length)return;
    audioRef.current.src=tracks[i].audio;
    // Reassigning .src while a resource is already loaded doesn't reliably
    // restart the load in every browser without an explicit load() call —
    // without it, play() can silently resolve against the *old*, now-ended
    // track and just stay stopped instead of advancing.
    audioRef.current.load();
    setTrackIdx(i);
    const p=audioRef.current.play();
    if(p&&typeof p.catch==='function')p.catch(()=>setPlaying(false));
    setPlaying(true);
  }
  // Shuffles to a new random track and keeps playing — used for both the
  // "Next" control and onEnded, so background music runs unattended for as
  // long as the session is. The Next button can't fire this while inactive
  // (MusicPlayerPanel unmounts with the session), but onEnded is wired to
  // the always-mounted <audio> element, so a track finishing in the same
  // instant the session ends must not be misread as "keep going".
  function next(){
    // The lock-alert chime borrows this same <audio> element and also ends/errors —
    // without this guard, the chime finishing would be misread as a track ending
    // and skip to a random track right as (or instead of) the alert plays.
    if(alertPlayingRef.current)return;
    if(!active)return;
    if(!tracks?.length)return;
    startedRef.current=true;
    playTrackAt(randTrackIndex(tracks.length,trackIdx));
  }
  // Plays a short alert over the SAME <audio> element background music uses —
  // a tab that's already been granted audio autoplay (because music is/has been
  // playing there) is far more likely to be allowed to play further sounds than
  // a fresh, never-interacted element would be. If music was playing, it's paused,
  // swapped out, and resumed from where it left off once the chime finishes; if
  // music was off, this just attempts direct playback on the idle element (still
  // subject to the browser's autoplay policy — see playAlert's caller for the
  // toast/email fallback that covers the case where this gets silently blocked).
  function playAlert(url,vol){
    const el=audioRef.current;
    if(!el)return Promise.resolve(false);
    const wasPlaying=playing;
    const resumeSrc=el.src;
    const resumeTime=el.currentTime;
    const resumeVolume=el.volume;
    alertPlayingRef.current=true;
    el.pause();
    el.src=url;
    el.load();
    el.volume=vol;
    const cleanup=()=>{
      el.removeEventListener('ended',cleanup);
      el.removeEventListener('error',cleanup);
      alertPlayingRef.current=false;
      if(wasPlaying&&resumeSrc){
        el.src=resumeSrc;
        el.load();
        el.currentTime=resumeTime;
        el.volume=resumeVolume;
        const p=el.play();
        if(p&&typeof p.catch==='function')p.catch(()=>setPlaying(false));
      }
    };
    el.addEventListener('ended',cleanup);
    el.addEventListener('error',cleanup);
    const p=el.play();
    if(p&&typeof p.catch==='function')return p.then(()=>true).catch(()=>{cleanup();return false;});
    return Promise.resolve(true);
  }
  function play(){
    if(!audioRef.current||!tracks?.length)return;
    if(!startedRef.current){
      startedRef.current=true;
      playTrackAt(randTrackIndex(tracks.length,trackIdx));
      return;
    }
    const p=audioRef.current.play();
    if(p&&typeof p.catch==='function')p.catch(()=>setPlaying(false));
    setPlaying(true);
  }
  function pause(){
    if(!audioRef.current)return;
    audioRef.current.pause();
    setPlaying(false);
  }
  function toggle(){playing?pause():play();}
  function selectTrack(i){
    startedRef.current=true;
    setTrackIdx(i);
    setPlaying(false);
    if(audioRef.current)audioRef.current.pause();
  }
  // Called from Start Session's click handler, first thing, before any
  // await. Tracks are essentially never loaded yet at this exact moment —
  // the Jamendo fetch only starts once `active` flips non-null, which
  // itself only happens after the session-creation await resolves — so
  // the real track's play() call was always landing in the effect below,
  // genuinely async and outside the click's call stack. Browsers (mobile
  // Safari especially) can and do silently reject that, and because the
  // element never had a single successful gesture-driven play, onEnded's
  // later calls inherited the same distrust. Fix: play a real (if silent)
  // clip on THIS SAME element synchronously, right here, so the click
  // genuinely unlocks it — then hot-swap to the real track once it's
  // fetched, on an element that's already proven trusted.
  function requestAutoStart(){
    autoStartWantedRef.current=true;
    if(audioRef.current&&!startedRef.current){
      alertPlayingRef.current=true; // borrow the same guard playAlert uses, so this clip's near-instant 'ended' can't be misread by onEnded as a track finishing
      audioRef.current.src=silentWavUrl();
      audioRef.current.load();
      const p=audioRef.current.play();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }
    if(tracks?.length&&!startedRef.current){
      autoStartWantedRef.current=false;
      startedRef.current=true;
      alertPlayingRef.current=false;
      playTrackAt(randTrackIndex(tracks.length,trackIdx));
    }
  }
  useEffect(()=>{
    if(!autoStartWantedRef.current||tracks===null)return; // still loading — wait for it to resolve one way or the other
    if(tracks.length&&!startedRef.current){
      startedRef.current=true;
      alertPlayingRef.current=false;
      playTrackAt(randTrackIndex(tracks.length,trackIdx));
    }else{
      // Music unavailable this session (no key / fetch failed) — nothing to
      // swap to, but the warm-up guard must still release, or next()/
      // playAlert stay silently blocked by alertPlayingRef forever.
      alertPlayingRef.current=false;
    }
    autoStartWantedRef.current=false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tracks]);

  return{tracks,trackIdx,track:tracks?.[trackIdx],playing,volume,setVolume,muted,setMuted,audioRef,toggle,next,selectTrack,playAlert,requestAutoStart};
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

// Session start/pause/resume/end — shared by Dashboard and Quick Log, so
// starting or stopping a session never requires navigating back to
// Dashboard. `active` is the caller's own getActive(ss,mode) result
// (pause/resume/end only apply to a truly active session); the
// insert-with-retry race handling (two tabs pressing Start Session for the
// same mode before either write is visible to the other) lives here once,
// not duplicated per caller.
function useSessionControls({userId,ss,saveSS,mode,settings,bal,music,active}){
  async function startSession(){
    // Fired synchronously, first thing, so it's as close to the click's
    // own gesture as possible — see requestAutoStart's own comment for why
    // the actual play() usually still ends up deferred past that gesture.
    music?.requestAutoStart();
    const duration=getEffectiveSessionDuration(settings,mode);
    const strictAtStart=isStrictForMode(settings,mode);
    let base=ss;
    const tryInsert=async b=>{
      const candidate=buildSession(b,mode,duration,strictAtStart,settings,bal);
      const{error}=await supabase.from('sessions').insert(toSessionRow(userId,b.date,candidate));
      return{candidate,error};
    };
    let{candidate,error}=await tryInsert(base);
    if(error&&error.code==='23505'){
      const{data:rows}=await supabase.from('sessions').select('*')
        .eq('user_id',userId).eq('date',base.date).eq('account_mode',mode);
      base={...base,sessions:[...base.sessions.filter(s=>s.accountMode!==mode),...(rows||[]).map(fromSessionRow)]};
      ({candidate,error}=await tryInsert(base));
    }
    if(error){alert(`Couldn't start a new ${mode==='REAL'?'Real':'Demo'} session — please try again.`);return;}
    const nextSessions=[...base.sessions,candidate];
    await saveSS({...base,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
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
  return{startSession,pauseSession,resumeSession,endSession};
}

export function Dashboard({settings,trades,wds,ss,saveSS,bal,mode,nav,music,userId}){
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const done=modeTrades.filter(t=>t.outcome!=='PENDING');
  const wins=done.filter(t=>t.outcome==='WIN').length;
  // Today-only counts — the full modeTrades/done may span multiple days.
  // Computed straight from the system clock (tod()), never from ss.date —
  // ss is session STATE, not a date source. Falling back to it (as this used
  // to) makes "today" indirectly depend on whatever a session happened to be
  // stamped with rather than the actual calendar date, which is exactly the
  // kind of indirection that let a backdated entry's date leak into "today".
  const todayDate=tod();
  const todayDone=modeTrades.filter(t=>t.date===todayDate&&t.outcome!=='PENDING');
  const todayWins=todayDone.filter(t=>t.outcome==='WIN').length;
  const todayPnl=todayDone.reduce((s,t)=>s+t.pnl,0);
  const todayWr=todayDone.length?((todayWins/todayDone.length)*100):0;
  const todayByTime=[...todayDone].sort((a,b)=>a.timestamp-b.timestamp);
  const wr=done.length?((wins/done.length)*100):0;
  const pnl=done.reduce((s,t)=>s+t.pnl,0);
  const startBal=getStartingBalanceForMode(settings,mode);
  const growth=startBal?((bal-startBal)/startBal)*100:0;
  const stake=calcStake(bal,settings);
  const active=getActive(ss,mode);
  const mmStyle=getMoneyMgmtStyleForMode(settings,mode);
  const amDisplayStake=liveEscalatingNextStake(active,bal,settings,mode,mmStyle);
  const amReasoning=escalatingStakeReasoning(active,bal,settings,mode,mmStyle);
  // Read straight off the session's own counters — the same trades/wins/losses
  // fields chkLock and every save path maintain — instead of re-deriving them
  // by joining trades back to the session via date+sessionNum. That join is a
  // second copy of the same count that can silently drift from the real one
  // (e.g. a trade whose date/sessionNum doesn't line up for any reason), which
  // is exactly how the displayed count could show 0 after a save that actually
  // incremented active.trades correctly.
  const activeTradesCount = active?.trades||0;
  const activeWins = active?.wins||0;
  const activeLosses = active?.losses||0;
  const isDailyLocked=isModeDayLocked(trades,ss,settings,mode);
  const isAmPlLockCause=isAmPlDailyLocked(ss,mode);
  // Milestones are a Real-only concept (Change 2) — Demo still gets growth/P&L, no milestone tracker.
  const nextMs=mode==='REAL'?settings.milestones.find(m=>bal<startBal*m.mul):null;
  const recent=[...modeTrades].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5);
  // Sorted newest-first explicitly (like `recent` above) rather than
  // trusting the incoming order — walking it forward then measures the
  // streak ending at the MOST RECENT trade. The previous version reversed
  // `done` and walked oldest-to-newest instead, which measures whatever
  // streak happened to sit at the OLDEST end of the trade history: a
  // completely different, usually-stale number.
  const doneByRecency=[...done].sort((a,b)=>b.timestamp-a.timestamp);
  let streak=0,sType=null;
  for(const t of doneByRecency){if(!sType){sType=t.outcome;streak=1;}else if(t.outcome===sType)streak++;else break;}
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

  const{startSession,pauseSession,resumeSession,endSession}=useSessionControls({userId,ss,saveSS,mode,settings,bal,music,active});

  // Local, immediate handling of pause auto-resume and time expiry while the
  // Dashboard is mounted — the App-level interval is just the backstop for
  // when it isn't (see the effect near saveSS in App).
  //
  // Timer expiry under Anti-Martingale is deliberately a no-op here: the
  // countdown/timer UI stays purely informational in every Money Management
  // style (start/pause/end, music, sound alert) — it is NEVER a session-
  // ending trigger under Anti-Martingale. Only checkAntiMartingaleSessionEnd
  // (profit target, loss target, max trades) ends an AM session; calling
  // endSession() here would force isLocked:true, which is exactly the
  // blocking behavior AM's own natural, non-blocking ending is designed to
  // avoid. Fixed Risk % sessions are unaffected — they still time-expire
  // via endSession() same as always.
  useEffect(()=>{
    if(!active)return;
    if(active.pausedAt&&now-active.pausedAt>=PAUSE_AUTO_RESUME_MS)resumeSession();
    else if(isEscalatingStyle(getMoneyMgmtStyleForMode(settings,mode))){
      // 60-minute hard cap — same non-blocking end as the profit/loss/max-
      // trades checks (checkEscalatingSessionEnd), just time-triggered
      // instead of trade-triggered so it fires without a new trade.
      const endReason=checkEscalatingSessionEnd(active,mode,settings,now);
      if(endReason){
        const us={...active,isActive:false,endTime:Date.now(),endReason};
        const nextSessions=ss.sessions.map(s=>s.id===active.id?us:s);
        saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
      }
    }
    else if(!active.pausedAt&&isSessionTimeExpired(active,now))endSession(active.trades===0?'TIME_EXPIRED_NO_TRADE':'TIME_EXPIRED',active.trades===0?'No qualifying setup found':'Time expired');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[now]);

  // Fires the "Session ended — [reason]" toast the moment an active session
  // for this mode disappears (its guidance target reached, or the timer
  // above expired) — purely informational now, no gap/cooldown to report.
  useEffect(()=>{
    if(prevActiveRef.current&&!active){
      const ended=lastEndedSession(ss,mode);
      if(ended){
        const msg=ended.lockCode==='TIME_EXPIRED_NO_TRADE'
          ?'Session timer ended — no qualifying setup found.'
          :`Session timer ended — ${ended.lockReason||'guidance target reached'}.`;
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
        <div style={{fontSize:12,color:'var(--text-muted)'}}>{fmtHeaderDate(todayDate)}</div>
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

          <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Today</div>
            {todayDone.length>0?(
              <>
                <div style={{display:'flex',alignItems:'flex-end',gap:24,flexWrap:'wrap',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'var(--text-primary)',lineHeight:1.2}}>{todayDone.length}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>trades</div>
                  </div>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,lineHeight:1.2}}><span style={{color:'var(--text-success)'}}>{todayWins}W</span><span style={{color:'var(--text-muted)'}}> · </span><span style={{color:'var(--text-danger)'}}>{todayDone.length-todayWins}L</span></div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>win / loss</div>
                  </div>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:todayPnl>=0?'var(--text-success)':'var(--text-danger)',lineHeight:1.2}}>{(todayPnl>=0?'+':'')+f$(todayPnl)}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>P&L</div>
                  </div>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'var(--text-primary)',lineHeight:1.2}}>{fp(todayWr)}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>today's win rate</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {todayByTime.map((t,i)=>(
                    <span key={t.id||i} title={`${i+1}. ${t.outcome}`} style={{width:8,height:8,borderRadius:'50%',background:t.outcome==='WIN'?'var(--fill-success)':'var(--fill-danger)',flexShrink:0}}/>
                  ))}
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:6}}>Today's trade sequence</div>
              </>
            ):(
              <div style={{fontSize:12,color:'var(--text-muted)'}}>No trades yet today</div>
            )}
          </div>

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
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{isAmPlLockCause?`2 loss-target sessions today for ${mode==='REAL'?'Real':'Demo'} — Anti-Martingale/Profit Lock locked until tomorrow.`:`${MAX_DL} losses recorded today. Trading resumes tomorrow.`}</div>
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
          ):(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-accent)',border:'1px solid var(--border-accent)',marginBottom:10}}>
                <Target size={17} style={{color:'var(--text-accent)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Ready for session {ss.sessions.filter(s=>s.accountMode===mode).length+1}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Start a session to begin the timer, or analyze a zone / open the journal directly.</div>
              <button style={{...btn('suc'),width:'100%'}} onClick={startSession}><Timer size={15}/>Start session ({getEffectiveSessionDuration(settings,mode)}m)</button>
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:16}}>
            <button style={{...btn('pri'),width:'100%'}} onClick={()=>nav('analyzer')}><ScanSearch size={15}/>Analyze zone</button>
            <button style={{...btn(),width:'100%'}} onClick={()=>nav('journal')}><BookOpen size={15}/>Journal{pendingN>0&&<span style={{marginLeft:2,padding:'1px 7px',borderRadius:999,fontSize:11,fontWeight:700,background:'var(--bg-danger)',color:'var(--text-danger)',border:'1px solid var(--border-danger)'}}>{pendingN}</span>}</button>
          </div>
        </div>

        {active&&music&&<MusicPlayerPanel music={music}/>}

        {/* Stat tiles */}
        <div className="col-span-6 lg:col-span-3"><Metric label="Win rate" value={fp(wr)} sub={`${wins}W / ${done.length-wins}L · ${done.length} trades`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':done.length?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/></div>
        <div className="col-span-6 lg:col-span-3"><Metric label="Streak" value={done.length?`${streak} ${sType==='WIN'?'wins':'losses'}`:'—'} color={sType==='WIN'?'var(--text-success)':sType==='LOSS'?'var(--text-danger)':'var(--text-primary)'}/></div>
        <div className="col-span-6 lg:col-span-3">
          {isEscalatingStyle(mmStyle)
            ?<Metric label="Next stake" value={f$(amDisplayStake)} sub={amReasoning} color="var(--text-primary)"/>
            :<Metric label="Next stake" value={f$(stake.actual)} sub={`${fp(stake.eff)} effective risk`} color={settings.riskMode!=='FIXED'&&stake.eff>settings.riskPercent*1.5?'var(--text-warning)':'var(--text-primary)'}/>}
        </div>

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
export function Analyzer({settings,ss,mode,saveAnalyses,analyses,nav,setPA,trades}){
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
  // Guidance only — chkLock's stop/take-profit conditions are shown as an
  // advisory (lk.reason/lk.adv below) but never block the Analyzer. The
  // daily circuit breaker is the only real gate left.
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const locked=isDailyCircuitBroken(trades,mode);

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

      {locked&&<Alert type="dan" title="🔒 Analyzer locked" body={`Daily ${MAX_DL}-loss limit reached for ${mode==='REAL'?'Real':'Demo'}. Resume tomorrow.`}/>}
      {lk.locked&&!locked&&<Alert type="warn" title="Off-plan" body={`${lk.reason} — logging a trade now will mark it off-plan.`}/>}
      {lk.adv&&!lk.locked&&!locked&&<Alert type="warn" title="Advisory" body={lk.adv}/>}
      {!activeKey&&(
        <div style={{...card,background:'var(--bg-accent)',borderColor:'var(--border-accent)',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text-accent)',marginBottom:4}}>Zone Analyzer needs an API key</div>
          <p style={{fontSize:12,color:'var(--text-secondary)',margin:'0 0 10px'}}>This is the only feature that needs one — the Journal, Quick Log, Anti-Martingale, Profit Lock, and Analytics all work fine without it. Add a free OpenRouter or Groq key to start grading zones.</p>
          <button style={btn('pri')} onClick={()=>nav('settings')}>Add API key in Settings →</button>
        </div>
      )}

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

// A case-file view for reviewing a past trade: screenshot(s) given the most
// visual weight, notes rendered at real reading size (not an afterthought),
// gate breakdown scannable when present. Purely read-only — editing lives
// behind the separate "Edit" action in the modal header, never the default.
function TradeDetailView({trade,onZoom,strategies}){
  const shots=(trade.screenshots||[]).map((src,i)=>{
    const raw=typeof src==='string'?src:(src?.b64||src?.b);
    return{i,url:toDataUrl(raw,src?.mime)};
  }).filter(s=>s.url);
  const[mainIdx,setMainIdx]=useState(0);
  const facts=[
    ['Pair',trade.pair,null],
    ['Direction',trade.direction,trade.direction==='BUY'?'var(--text-success)':'var(--text-danger)'],
    ['Strategy',strategyLabel(trade.strategyId,strategies)||'Zone (S&D)',null],
    ['Trade grade',trade.zoneGrade,null],
    ['Stake',f$(trade.stake),null],
    ['Outcome',trade.outcome,trade.outcome==='WIN'?'var(--text-success)':trade.outcome==='LOSS'?'var(--text-danger)':'var(--text-muted)'],
    ['P&L',trade.outcome==='PENDING'?'—':(trade.pnl>=0?'+':'')+f$(trade.pnl),trade.outcome==='PENDING'?null:trade.pnl>=0?'var(--text-success)':'var(--text-danger)'],
    ['Payout %',trade.outcome==='WIN'?`${trade.payoutPct||Math.round(PAYOUT*100)}%`:null,null],
    ['Account mode',trade.accountMode==='REAL'?'Real':'Demo',null],
    ['Session',trade.sessionNum,null],
    ['Zone type',trade.zoneType,null],
    ['Source',trade.source,null],
    ['Timestamp',new Date(trade.timestamp).toLocaleString(),null],
  ].filter(([,v])=>v!==null&&v!==undefined&&v!=='');

  return(
    <div style={{display:'grid',gap:14}}>
      {shots.length>0?(
        <div>
          <div className="gm-gallery-tile" style={{position:'relative',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)',background:'var(--surface-0)',cursor:'zoom-in'}} onClick={()=>onZoom(shots[mainIdx].i)}>
            <img src={shots[mainIdx].url} alt={`Screenshot ${mainIdx+1}`} style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',margin:'0 auto'}}/>
          </div>
          {shots.length>1&&(
            <div style={{display:'flex',gap:8,marginTop:8,overflowX:'auto'}}>
              {shots.map((s,idx)=>(
                <button key={s.i} onClick={()=>setMainIdx(idx)} style={{padding:0,border:idx===mainIdx?'2px solid var(--border-accent)':'1px solid var(--border)',borderRadius:8,overflow:'hidden',width:64,height:64,flexShrink:0,cursor:'pointer',background:'var(--surface-0)'}}>
                  <img src={s.url} alt={`Thumbnail ${idx+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                </button>
              ))}
            </div>
          )}
        </div>
      ):(
        <div style={{padding:'24px 14px',border:'1px dashed var(--border)',borderRadius:10,color:'var(--text-muted)',fontSize:13,textAlign:'center'}}>No screenshots attached to this entry.</div>
      )}

      <div style={card}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
          {facts.map(([label,value,color])=>(
            <div key={label}>
              <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:2}}>{label}</div>
              <div style={{fontSize:14,fontWeight:600,color:color||'var(--text-primary)'}}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{...card,background:'var(--surface-1)'}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:8,color:'var(--text-primary)'}}>Notes</div>
        {trade.notes?.trim()
          ?<div style={{fontSize:15,lineHeight:1.6,color:'var(--text-primary)',whiteSpace:'pre-wrap'}}>{trade.notes}</div>
          :<div style={{fontSize:13,color:'var(--text-muted)',fontStyle:'italic'}}>No notes for this trade.</div>}
      </div>

      {(trade.gateResults?.length>0||(trade.criteria&&Object.keys(trade.criteria).length>0))&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>{trade.gateResults?.length?'Gate check':'Zone analysis criteria'}</div>
          {trade.gateResults?.length
            ?<Gates gates={trade.gateResults} score={trade.score} grade={trade.zoneGrade}/>
            :<Criteria criteria={trade.criteria}/>}
        </div>
      )}
    </div>
  );
}

// Directly overwriting a controlled textarea's React state clears the
// browser's native undo stack (Ctrl+Z stops working). Using execCommand
// routes the change through the same input pipeline as real typing, so
// undo/redo keeps working after an AI suggestion is accepted. Shared by
// Journal's manual-entry notes and TradeDetailModal's edit notes.
function applyTextWithUndo(ref,text){
  const el=ref.current;
  if(el&&document.execCommand){
    el.focus();
    el.select();
    if(document.execCommand('insertText',false,text))return true;
  }
  return false;
}

// ── Journal ───────────────────────────────────────────────────────────────────
export function Journal({settings,trades,saveTrades,deleteTrade,ss,saveSS,pa,setPA,wds,mode,userId,strategies}){
  const activeStrategies=(strategies||[]).filter(s=>!s.archived);
  const[filt,setFilt]=useState('ALL');
  const[stratFilt,setStratFilt]=useState('ALL');
  const[gradeFilt,setGradeFilt]=useState('ALL');
  const[manual,setManual]=useState(false);
  const[journalTab,setJournalTab]=useState(mode||'DEMO');
  const[mf,smf]=useState(()=>{
    try{
      const saved=sessionStorage.getItem('gm_draft_mf');
      if(saved){
        const d=JSON.parse(saved);
        // sessionStorage survives a reload within the same tab, so a draft
        // left open across midnight silently keeps yesterday's tradeDate.
        // addManual() treats any tradeDate !== today as an intentional
        // backdated entry and skips linking it to today's active session
        // entirely — so a stale draft looks like "my trade count didn't
        // update" with no indication why. Self-correct it back to today.
        if(d.tradeDate!==tod())d.tradeDate=tod();
        return d;
      }
    }catch{}
    // strategy defaults to the last one actually chosen (convenience), never
    // to a hardcoded pick — on a fresh browser with no prior choice this is
    // '', which addManual refuses to save without the user explicitly
    // picking one, so it's never silently assumed either way.
    return{pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:mode||'DEMO',stakeMode:'DEFAULT',stakeValue:'',payoutPct:lastPayoutPct(),strategyId:lastStrategyId()};
  });
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[selectedTrade,setSelectedTrade]=useState(null);
  // Per-trade draft payout % for resolving a PENDING trade's outcome — keyed
  // by trade id since these render inline in a list, not their own component.
  const[pendingPayoutDrafts,setPendingPayoutDrafts]=useState({});
  // Zoom viewer for the manual-entry draft's own screenshots (not yet a
  // saved trade, so TradeDetailModal's own preview state can't cover this —
  // that only exists once `selectedTrade` is set).
  const[preview,setPreview]=useState(null); // {items:[url,...], index}
  const[saving,setSaving]=useState(false);
  const[journalNotice,setJournalNotice]=useState(null);
  function flashNotice(msg){setJournalNotice(msg);setTimeout(()=>setJournalNotice(null),6000);}
  const[paStakeMode,setPaStakeMode]=useState('DEFAULT');
  const[paStakeValue,setPaStakeValue]=useState('');
  const[polishingManual,setPolishingManual]=useState(false);
  const[manualPolishErr,setManualPolishErr]=useState(null);
  const[manualSuggestion,setManualSuggestion]=useState(null);
  const manualNotesRef=useRef(null);

  async function polishManualNotes(){
    if(polishingManual||!mf.notes?.trim())return;
    setPolishingManual(true);setManualPolishErr(null);
    try{
      setManualSuggestion(await polishJournalNote(mf.notes,settings));
    }catch(e){
      setManualPolishErr(e.message||'Could not polish notes. Try again.');
    }finally{
      setPolishingManual(false);
    }
  }
  function acceptManualPolish(){
    if(manualSuggestion==null)return;
    if(!applyTextWithUndo(manualNotesRef,manualSuggestion))smf(m=>({...m,notes:manualSuggestion}));
    setManualSuggestion(null);
  }

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

  // Escalating-style-aware: when Anti-Martingale or Profit Lock is the
  // active style for this mode, the "default" stake is the live
  // escalation-aware suggestion, not Fixed-Risk math — same
  // {calc,actual,eff} shape as calcStake so every call site (paStake,
  // manualDefaultStake, the stake-mode buttons) works unchanged.
  const stakeFor=m=>{
    const modeBal=balForMode(settings,trades,wds,m);
    const style=getMoneyMgmtStyleForMode(settings,m);
    if(isEscalatingStyle(style)){
      const actual=liveEscalatingNextStake(getActive(ss,m),modeBal,settings,m,style);
      return{calc:actual,actual,eff:modeBal?(actual/modeBal)*100:0};
    }
    return calcStake(modeBal,settings);
  };
  // Analyzer results always log to the global toggle's account (Change 4) —
  // no separate confirmation step. Manual entries log to whichever tab is open.
  const stake=stakeFor(mode);

  // Rules as a mirror, not a gate BY DEFAULT: chkLock's stop/take-profit
  // conditions are always computed for display (Precision/Active/Structured
  // guidance). Under Soft mode (strictLocking off — the default) reaching
  // them never blocks anything, only triggers the off-plan confirm. Under
  // Strict mode (opted in per-mode in Settings), reaching them DOES block
  // the normal flow — but active.strictAtStart, not the live setting,
  // decides this for an already-running session, so toggling the setting
  // mid-session can never retroactively unlock (or lock) it.
  const active=getActive(ss,mode);
  const lk=active?chkLock(active,getTradeStyleForMode(settings,mode)):{locked:false};
  const dailyLocked=isModeDayLocked(trades,ss,settings,mode);
  const amPlLockCause=isAmPlDailyLocked(ss,mode);
  const strictLocked=!!active?.strictAtStart&&lk.locked;

  const tabActive=getActive(ss,journalTab);
  const tabLk=tabActive?chkLock(tabActive,getTradeStyleForMode(settings,journalTab)):{locked:false};
  const tabDailyLocked=isModeDayLocked(trades,ss,settings,journalTab);
  const tabAmPlLockCause=isAmPlDailyLocked(ss,journalTab);
  const tabStrictLocked=!!tabActive?.strictAtStart&&tabLk.locked;
  const[offPlanOverride,setOffPlanOverride]=useState(false);

  // Both callers below (recordPA and addManual) only ever call this when the
  // trader hasn't explicitly pressed "Start Session" — the notice belongs
  // here, once, so neither path can silently create a session with no trace.
  // recordPA previously had no notice at all, which is exactly how a session
  // could get created invisibly and make the next explicit "Start Session"
  // press land on Session 2 with nothing in the UI explaining why.
  // buildSession's num is a client-side array-length read with no DB-level
  // atomicity — two near-simultaneous calls (e.g. an Analyzer auto-log and a
  // manual entry both finding no active session) can both compute the same
  // "next" number before either write is visible to the other, producing two
  // rows for the same (date, num, account_mode) slot. The uniq_session_slot
  // DB constraint turns that into a loud unique-violation (code 23505)
  // instead of a silent duplicate; this inserts the new session directly
  // (not via the batch saveSS upsert, so the conflict is attributable to
  // THIS insert specifically) and on conflict re-fetches the mode's actual
  // current rows and retries once with the real next number.
  async function mkSession(ssState,mode){
    const s=canStart(ssState,settings.sessionsPerDay,mode,settings);
    if(!s.ok){alert(s.msg);return null;}
    const tryInsert=async base=>{
      const candidate=buildSession(base,mode,getEffectiveSessionDuration(settings,mode),isStrictForMode(settings,mode),settings,balForMode(settings,trades,wds,mode));
      const{error}=await supabase.from('sessions').insert(toSessionRow(userId,base.date,candidate));
      return{candidate,error};
    };
    let{candidate,error}=await tryInsert(ssState);
    if(error&&error.code==='23505'){
      const{data:rows}=await supabase.from('sessions').select('*')
        .eq('user_id',userId).eq('date',ssState.date).eq('account_mode',mode);
      ssState={...ssState,sessions:[...ssState.sessions.filter(s=>s.accountMode!==mode),...(rows||[]).map(fromSessionRow)]};
      ({candidate,error}=await tryInsert(ssState));
    }
    if(error){alert(`Couldn't start a new ${mode==='REAL'?'Real':'Demo'} session — please try again.`);return null;}
    const nextSessions=[...ssState.sessions,candidate];
    const upd={...ssState,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)};
    await saveSS(upd);
    alert(`Started ${mode==='REAL'?'Real':'Demo'} Session ${candidate.num} automatically to log this trade.`);
    return{ss:upd,sess:candidate};
  }

  const paBal=balForMode(settings,trades,wds,mode);
  const paStake=resolveStakeOverride(paStakeMode,paStakeValue,stake.actual,paBal);

  async function recordPA(useOverride){
    if(!pa)return;
    // The ONE hard stop left in the whole system.
    if(isDailyCircuitBroken(trades,mode)){
      alert(`Daily ${MAX_DL}-loss limit reached for ${mode==='REAL'?'Real':'Demo'}. Resume tomorrow.`);
      return;
    }
    let cur=ss,sess=active;
    // If there's no active session, start one so this trade still has
    // guidance to show against — starting a session is never blocked.
    if(!sess){const r=await mkSession(cur,mode);if(r){cur=r.ss;sess=r.sess;}}
    let offPlan=false;
    let lockingModeAtTime='SOFT';
    if(sess){
      const styleId=getTradeStyleForMode(settings,mode);
      const preLock=chkLock(sess,styleId);
      lockingModeAtTime=sess.strictAtStart?'STRICT':'SOFT';
      if(preLock.locked){
        if(sess.strictAtStart&&!useOverride){
          alert(`This session is locked (${preLock.reason}). Use "Log an off-plan trade anyway" to record a trade taken outside the lock.`);
          return;
        }
        if(!useOverride){
          const proceed=window.confirm(`This trade exceeds your ${styleName(styleId)}'s stop condition (${preLock.reason}). Logging it will mark it as off-plan.`);
          if(!proceed)return;
        }
        offPlan=true;
      }
    }
    const t={id:uid(),timestamp:Date.now(),date:tod(),sessionNum:sess?sess.num:null,pair:pa.detectedPair||'Unknown',direction:pa.direction||'BUY',zoneType:pa.zoneType||'',zoneGrade:pa.grade||'A',stake:paStake,outcome:'PENDING',pnl:0,source:'ANALYZER',analysisId:pa.id||null,screenshots:[pa.screenshot,...(pa.extras?.map(e=>e.b64)||[])],notes:'',isAnalyzed:true,criteria:pa.criteria||null,gateResults:pa.gateResults||null,score:pa.score??null,hardFilterFailed:pa.hardFilterFailed??null,hardFilterFailures:pa.hardFilterFailures||[],failedCriteria:pa.failedCriteria||[],keyStrengths:pa.keyStrengths||[],keyWeaknesses:pa.keyWeaknesses||[],executionAdvice:pa.executionAdvice||'',summary:pa.summary||'',confidence:pa.confidence||0,verdict:pa.verdict||'',recommendation:pa.recommendation||'',accountMode:mode,offPlan,lockingModeAtTime,strategyId:'zone-sd'};
    await saveTrades(prev=>[t,...(prev||[])]);
    if(sess){
      const us={...sess,trades:sess.trades+1};
      const nextSessions=cur.sessions.map(s=>s.id===sess.id?us:s);
      await saveSS({...cur,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
    }else{
      flashNotice('Trade saved, but not linked to a session — no session is active right now.');
    }
    setPA(null);
  }

  async function setOutcome(tid,outcome,payoutPct){
    const t=trades.find(x=>x.id===tid);if(!t)return;
    const pnl=calcPnl(t.stake,outcome,payoutPct);
    await saveTrades(prev=>prev.map(x=>x.id===tid?{...x,outcome,pnl,payoutPct:outcome==='WIN'?payoutPct:x.payoutPct}:x));
    // t.date must match too — sessionNum recycles every day per mode, so
    // resolving an old PENDING trade from a prior day could otherwise match
    // today's same-numbered session and corrupt its counters (same class of
    // bug as the reconciliation effect above).
    const tMode=getTradeMode(t);
    const sess=t.date===ss.date && ss.sessions.find(s=>s.num===t.sessionNum && s.accountMode===tMode);
    if(sess){
      const isW=outcome==='WIN';
      let us={...sess,wins:sess.wins+(isW?1:0),losses:sess.losses+(isW?0:1),conLoss:isW?0:sess.conLoss+1,conWin:isW?sess.conWin+1:0,netLoss:sess.netLoss+(isW?-1:1),sPnl:sess.sPnl+pnl};
      const tStyle=getMoneyMgmtStyleForMode(settings,tMode);
      if(isEscalatingStyle(tStyle)){
        // t's prior pnl was 0 (it was PENDING), so trades still reflects
        // balance BEFORE this outcome — adding pnl gives balance after it,
        // which is what the next stake should be sized against.
        const balAfter=balForMode(settings,trades,wds,tMode)+pnl;
        us={...us,...advanceEscalatingStake(tStyle,sess,outcome,pnl,balAfter,settings,tMode)};
        const endReason=checkEscalatingSessionEnd(us,tMode,settings);
        // No isLocked/lockReason/lockCode here — Strict Locking never applies
        // to an Anti-Martingale/Profit Lock profit/loss-target ending.
        if(endReason)us={...us,isActive:false,endTime:Date.now(),endReason};
      }else{
        const lk2=chkLock(us,getTradeStyleForMode(settings,tMode));
        if(lk2.locked){us.isActive=false;us.isLocked=true;us.lockReason=lk2.reason;us.lockCode=lk2.code;us.endTime=Date.now();}
      }
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
    // Never silently assumed — the user must actively pick a strategy every
    // time, even though the toggle is pre-filled with their last choice.
    if(!mf.strategyId){alert('Select a strategy before saving.');return;}
    const entryAccountMode=mf.accountMode || journalTab;
    // The ONE hard stop left in the whole system.
    if(isDailyCircuitBroken(trades,entryAccountMode)){
      alert(`Daily ${MAX_DL}-loss limit reached for ${entryAccountMode==='REAL'?'Real':'Demo'}. Resume tomorrow.`);
      return;
    }
    setSaving(true);
    try{
      const tradeDate = mf.tradeDate || tod();
      const isToday = tradeDate === tod();
      let sessionNum = null;
      let offPlan = false;
      let lockingModeAtTime = 'SOFT';
      const pair=(mf.pair||'').trim()||'Manual';
      addPairOption(pair);
      const outcome=mf.outcome||'PENDING';
      const entryBal=balForMode(settings,trades,wds,entryAccountMode);
      const entryStake=resolveStakeOverride(mf.stakeMode,mf.stakeValue,stakeFor(entryAccountMode).actual,entryBal);
      const payoutPct=outcome==='WIN'?parseFloat(mf.payoutPct)||undefined:undefined;
      if(payoutPct)setLastPayoutPct(String(payoutPct));
      const pnl=calcPnl(entryStake,outcome,payoutPct);

      if (isToday) {
        let cur=ss;
        let sess=getActive(ss,entryAccountMode);
        // If there's no active session, start one so this trade still has
        // guidance to show against — starting a session is never blocked.
        if(!sess){
          const r=await mkSession(cur,entryAccountMode);
          if(r){cur=r.ss;sess=r.sess;}
        }
        if(sess){
          // Under Soft mode (the default) this only ever WARNS and asks for
          // confirmation — it never blocks the save. Under Strict mode, a
          // reached stop condition DOES block the normal save; the only way
          // through is the dedicated "Log an off-plan trade anyway" action,
          // which sets offPlanOverride before calling this. Checked against
          // the session's state BEFORE this trade — "has guidance already
          // been reached." sess.strictAtStart (not the live setting) decides
          // enforcement, so a mid-session toggle never changes this session.
          const styleId=getTradeStyleForMode(settings,entryAccountMode);
          const amStyle=getMoneyMgmtStyleForMode(settings,entryAccountMode);
          // Trade Management's chkLock stop/take-profit rules (and the Strict
          // Locking that can block on them) don't apply to Anti-Martingale or
          // Profit Lock sessions — those end on their own profit/loss target
          // instead.
          if(!isEscalatingStyle(amStyle)){
            const preLock=chkLock(sess,styleId);
            lockingModeAtTime=sess.strictAtStart?'STRICT':'SOFT';
            if(preLock.locked){
              if(sess.strictAtStart&&!offPlanOverride){
                alert(`This session is locked (${preLock.reason}). Use "Log an off-plan trade anyway" to record a trade taken outside the lock.`);
                return;
              }
              if(!offPlanOverride){
                const proceed=window.confirm(`This trade exceeds your ${styleName(styleId)}'s stop condition (${preLock.reason}). Logging it will mark it as off-plan.`);
                if(!proceed)return;
              }
              offPlan=true;
            }
          }
          const isW=outcome==='WIN';
          const isL=outcome==='LOSS';
          let us={...sess,
            trades:sess.trades+1,
            wins:sess.wins+(isW?1:0),
            losses:sess.losses+(isL?1:0),
            conLoss:isL?sess.conLoss+1:0,
            conWin:isW?sess.conWin+1:0,
            netLoss:sess.netLoss+(isL?1:isW?-1:0),
            sPnl:sess.sPnl+pnl,
          };
          if(isEscalatingStyle(amStyle)&&outcome!=='PENDING'){
            const balAfter=entryBal+pnl;
            us={...us,...advanceEscalatingStake(amStyle,sess,outcome,pnl,balAfter,settings,entryAccountMode)};
            const endReason=checkEscalatingSessionEnd(us,entryAccountMode,settings);
            if(endReason)us={...us,isActive:false,endTime:Date.now(),endReason};
          }
          const nextSessions=cur.sessions.map(s=>s.id===sess.id?us:s);
          await saveSS({...cur,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
          sessionNum = sess.num;
        }else{
          flashNotice('Trade saved, but not linked to a session — no session is active right now.');
        }
      }

      const now = new Date();
      // new Date("YYYY-MM-DD") parses as UTC midnight, not local midnight — in
      // any negative-UTC-offset timezone that instant falls on the PREVIOUS
      // local day, so stamping today's local time onto it (setHours etc. all
      // operate in local time) silently shifts the timestamp a day early.
      // Build the date from local y/m/d components instead so tradeDate is
      // always interpreted as a local calendar date, matching tod().
      const[ty,tm,td]=tradeDate.split('-').map(Number);
      const tradeDateTime=new Date(ty,tm-1,td,now.getHours(),now.getMinutes(),now.getSeconds());
      const timestamp = tradeDateTime.getTime();

      const t={id:uid(),timestamp,date:tradeDate,sessionNum:sessionNum,pair,direction:mf.dir,zoneType:'',zoneGrade:mf.grade,stake:entryStake,outcome,pnl,source:'MANUAL',analysisId:null,screenshots:mf.screenshots.map(x=>x.b64||x.b||x).filter(Boolean),notes:mf.notes,isAnalyzed:false,accountMode:entryAccountMode,offPlan,lockingModeAtTime,payoutPct:payoutPct||null,strategyId:mf.strategyId};

      await saveTrades(prev=>[t,...(prev||[])]);
      setManual(false);setOffPlanOverride(false);smf({pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:journalTab,stakeMode:'DEFAULT',stakeValue:'',payoutPct:lastPayoutPct(),strategyId:mf.strategyId});setManualSuggestion(null);
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

  // Global (document-level), matching the Analyzer's paste handling — an
  // onPaste prop on just the notes textarea only fires while that exact
  // element has focus, which is easy to miss (open the form, hit Ctrl+V
  // without clicking in first, nothing happens). Active only while the
  // manual-entry form is open, and not if the daily circuit breaker is hit.
  useEffect(()=>{
    if(!manual||tabDailyLocked)return;
    function onPaste(e){
      const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
      if(!item)return;
      e.preventDefault();
      const file=item.getAsFile();
      if(file)addManualImage(file);
    }
    document.addEventListener('paste',onPaste);
    return()=>document.removeEventListener('paste',onPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[manual,tabDailyLocked]);

  const manualAccountMode=mf.accountMode||journalTab;
  const manualBal=balForMode(settings,trades,wds,manualAccountMode);
  const manualDefaultStake=stakeFor(manualAccountMode).actual;
  const manualStake=resolveStakeOverride(mf.stakeMode,mf.stakeValue,manualDefaultStake,manualBal);
  const manualStyle=getMoneyMgmtStyleForMode(settings,manualAccountMode);
  const manualIsAm=isEscalatingStyle(manualStyle);
  const manualAmReasoning=manualIsAm?escalatingStakeReasoning(getActive(ss,manualAccountMode),manualBal,settings,manualAccountMode,manualStyle):null;

  const tabTrades=trades.filter(t=>getTradeMode(t)===journalTab);
  // Outcome and strategy filters combine (AND), not exclusive alternatives —
  // "Zone + Win" narrows both dimensions at once, same as either alone.
  const outcomeFiltered=filt==='ALL'?tabTrades:tabTrades.filter(t=>filt==='PENDING'?t.outcome==='PENDING':t.outcome===filt);
  const stratFiltered=stratFilt==='ALL'?outcomeFiltered:outcomeFiltered.filter(t=>(t.strategyId||'zone-sd')===stratFilt);
  // Ungraded catches everything that isn't a real A+/A/B/C grade — Quick Log
  // trades (zoneGrade:''), never-graded manual entries, and an AI-graded
  // INVALID verdict alike, so the filter's 5 options are exhaustive with no
  // gap a trade could silently fall through.
  const gradeFiltered=gradeFilt==='ALL'?stratFiltered:gradeFilt==='UNGRADED'?stratFiltered.filter(t=>!['A+','A','B','C'].includes(t.zoneGrade)):stratFiltered.filter(t=>t.zoneGrade===gradeFilt);
  const sorted=[...gradeFiltered].sort((a,b)=>b.timestamp-a.timestamp);

  // Live summary for whatever's currently filtered — derived straight from
  // `sorted`, so it always matches the list below with zero extra state and
  // updates for free on any filter change (outcome, strategy, grade, tab).
  const filteredCompleted=sorted.filter(t=>t.outcome!=='PENDING');
  const filteredPendingCount=sorted.length-filteredCompleted.length;
  const filteredWins=filteredCompleted.filter(t=>t.outcome==='WIN').length;
  const filteredLosses=filteredCompleted.length-filteredWins;
  const filteredWr=filteredCompleted.length?filteredWins/filteredCompleted.length:0;
  const filteredCI=wilsonInterval(filteredWins,filteredCompleted.length);
  const filteredPnl=filteredCompleted.reduce((a,t)=>a+t.pnl,0);

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
            {isEscalatingStyle(getMoneyMgmtStyleForMode(settings,mode))&&paStakeMode==='DEFAULT'&&<div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{getMoneyMgmtStyleForMode(settings,mode)==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'}: {escalatingStakeReasoning(active,paBal,settings,mode,getMoneyMgmtStyleForMode(settings,mode))}</div>}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...btn('suc'),flex:1}} onClick={()=>recordPA()} disabled={dailyLocked||strictLocked}>Create journal entry</button>
            <button style={btn()} onClick={()=>setPA(null)}>Discard</button>
          </div>
          {dailyLocked&&<div style={{fontSize:12,color:'var(--text-danger)',marginTop:6}}>{amPlLockCause?`2 loss-target sessions today for ${mode==='REAL'?'Real':'Demo'} — Anti-Martingale/Profit Lock locked until tomorrow.`:'Daily loss limit reached — resume tomorrow.'}</div>}
          {!dailyLocked&&strictLocked&&(
            <div style={{marginTop:8}}>
              <div style={{fontSize:12,color:'var(--text-danger)',marginBottom:6}}>{lk.reason} — Strict Session Locking is on for this session.</div>
              <button
                style={{...btn(),fontSize:11,padding:'4px 10px',opacity:0.55}}
                onClick={()=>{
                  if(!window.confirm('This trade was taken outside your locked session. Confirm to log it as off-plan.'))return;
                  recordPA(true);
                }}
              >
                Log an off-plan trade anyway
              </button>
            </div>
          )}
          {!dailyLocked&&!strictLocked&&lk.locked&&<div style={{fontSize:12,color:'var(--text-warning)',marginTop:6}}>{lk.reason} — logging this will mark it off-plan.</div>}
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {ACCOUNT_MODES.map(m=>(
          <button key={m} style={{...btn(journalTab===m?'pri':'def'),flex:1}} onClick={()=>setJournalTab(m)}>{m==='REAL'?'Real':'Demo'}</button>
        ))}
      </div>

      {tabDailyLocked&&<Alert type="dan" title={`${journalTab==='REAL'?'Real':'Demo'} day locked`} body={tabAmPlLockCause?`2 loss-target sessions today for ${journalTab==='REAL'?'Real':'Demo'} — Anti-Martingale/Profit Lock locked until tomorrow.`:`${MAX_DL}-loss daily limit reached for this account. Manual entries resume tomorrow.`}/>}

      {!tabDailyLocked&&tabStrictLocked&&(
        <div style={{...card,background:'var(--bg-danger)',borderColor:'var(--border-danger)'}}>
          <div style={{fontSize:14,fontWeight:600,color:'var(--text-danger)',marginBottom:4}}>{journalTab==='REAL'?'Real':'Demo'} session locked</div>
          <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:10}}>{tabLk.reason} — Strict Session Locking is on for this session. New trades are blocked until your next session.</div>
          <button
            style={{...btn(),fontSize:11,padding:'4px 10px',opacity:0.55}}
            onClick={()=>{
              if(!window.confirm('This trade was taken outside your locked session. Confirm to log it as off-plan.'))return;
              setOffPlanOverride(true);setManual(true);smf(m=>({...m,accountMode:journalTab}));
            }}
          >
            Log an off-plan trade anyway
          </button>
        </div>
      )}
      {!tabDailyLocked&&!tabStrictLocked&&tabLk.locked&&<Alert type="warn" title="Off-plan" body={`${tabLk.reason} — logging a trade now will mark it off-plan.`}/>}
      {journalNotice&&<Alert type="inf" title="Notice" body={journalNotice}/>}

      <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
        <button style={btn()} onClick={()=>{setManual(v=>!v);setOffPlanOverride(false);smf(m=>({...m,accountMode:journalTab}));}} disabled={(tabDailyLocked||tabStrictLocked)&&!manual}>{manual?'Cancel':'+ Manual entry'}</button>
        {['ALL','PENDING','WIN','LOSS'].map(f=>(
          <button key={f} style={{...btn(filt===f?'pri':'def'),padding:'6px 10px'}} onClick={()=>setFilt(f)}>{f}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,color:'var(--text-muted)'}}>Strategy:</span>
        {[{id:'ALL',label:'All'},...activeStrategies.map(s=>({id:s.id,label:s.name}))].map(f=>(
          <button key={f.id} style={{...btn(stratFilt===f.id?'pri':'def'),padding:'6px 10px'}} onClick={()=>setStratFilt(f.id)}>{f.label}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,color:'var(--text-muted)'}}>Grade:</span>
        {[{id:'ALL',label:'All Grades'},{id:'A+',label:'A+'},{id:'A',label:'A'},{id:'B',label:'B'},{id:'C',label:'C'},{id:'UNGRADED',label:'Ungraded'}].map(f=>(
          <button key={f.id} style={{...btn(gradeFilt===f.id?'pri':'def'),padding:'6px 10px'}} onClick={()=>setGradeFilt(f.id)}>{f.label}</button>
        ))}
      </div>

      <div style={{...card,marginBottom:12}}>
        {filteredCompleted.length===0?(
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            {filteredPendingCount>0?`No completed trades in this filter (${filteredPendingCount} pending).`:'No trades match this filter.'}
          </div>
        ):(<>
          <div style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'baseline'}}>
            <div>
              <span style={{fontSize:16,fontWeight:700,color:filteredWr>=0.5?'var(--text-success)':'var(--text-primary)'}}>{(filteredWr*100).toFixed(1)}%</span>
              <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:6}}>(95% CI: {Math.round(filteredCI.lower*100)}%-{Math.round(filteredCI.upper*100)}%, n={filteredCompleted.length})</span>
            </div>
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>{filteredWins}W / {filteredLosses}L</div>
            <div style={{fontSize:12,fontWeight:600,color:filteredPnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(filteredPnl>=0?'+':'')+f$(filteredPnl)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{filteredCompleted.length} completed{filteredPendingCount>0?`, ${filteredPendingCount} pending`:''}</div>
          </div>
          {filteredCompleted.length<20&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Small sample — this range will narrow as you log more trades.</div>}
        </>)}
      </div>
      {manual&&offPlanOverride&&(
        <div style={{fontSize:12,color:'var(--text-warning)',marginBottom:8}}>Logging as off-plan — this will not reopen or unlock the session.</div>
      )}

      {manual&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Manual entry</div>
          <div className="grid-2">
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
            {manualIsAm&&mf.stakeMode==='DEFAULT'&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{manualStyle==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'}: {manualAmReasoning}</div>}
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Strategy</label>
            <select aria-label="Strategy" style={inp} value={mf.strategyId||''} onChange={e=>{
              const id=e.target.value;
              smf(m=>({...m,strategyId:id}));
              try{localStorage.setItem('gm_last_strategy_id',id);}catch{}
            }}>
              <option value="">Select a strategy…</option>
              {activeStrategies.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {!mf.strategyId&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Required — pick whichever was actually used for this trade.</div>}
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Trade grade{mf.strategyId&&<span style={{fontWeight:400,color:'var(--text-muted)'}}> ({strategyLabel(mf.strategyId,strategies)})</span>}</label>
            <div style={{display:'flex',gap:8}}>
              {['A+','A','B','C','UNGRADED'].map(g=><button key={g} style={{...btn(mf.grade===g?'pri':'def'),flex:1}} onClick={()=>smf(m=>({...m,grade:g}))}>{g}</button>)}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <label style={lbl}>Notes (optional)</label>
              <button type="button" style={{...btn(),padding:'3px 9px',fontSize:11,gap:4}} onClick={polishManualNotes} disabled={polishingManual||!mf.notes?.trim()} title="Fix grammar and use precise trading terms">
                <Sparkles size={12}/>{polishingManual?'Polishing…':'AI polish'}
              </button>
            </div>
            <textarea ref={manualNotesRef} style={{...inp,minHeight:50,resize:'vertical'}} value={mf.notes} onChange={e=>smf(m=>({...m,notes:e.target.value}))}/>
            {manualPolishErr&&<div style={{fontSize:11,color:'var(--text-danger)',marginTop:4}}>{manualPolishErr}</div>}
            {manualSuggestion!=null&&(
              <div style={{marginTop:8,padding:10,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface-1)'}}>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>AI suggestion</div>
                <div style={{fontSize:13,whiteSpace:'pre-wrap'}}>{manualSuggestion}</div>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button type="button" style={btn('pri')} onClick={acceptManualPolish}>Accept</button>
                  <button type="button" style={btn()} onClick={()=>setManualSuggestion(null)}>Discard</button>
                </div>
              </div>
            )}
          </div>
          <div style={{marginTop:10}}>
            <label style={lbl}>Outcome</label>
            <div style={{display:'flex',gap:8}}>
              {['PENDING','WIN','LOSS'].map(o=><button key={o} style={{...btn(mf.outcome===o?(o==='WIN'?'suc':o==='LOSS'?'dan':'pri'):'def'),flex:1}} onClick={()=>smf(m=>({...m,outcome:o}))}>{o}</button>)}
            </div>
          </div>
          {mf.outcome==='WIN'&&(
            <div style={{marginTop:10}}>
              <label style={lbl}>Payout % <span style={{fontWeight:400,color:'var(--text-muted)'}}>(only if the broker's payout wasn't the default {Math.round(PAYOUT*100)}% when you entered)</span></label>
              <input style={inp} type="number" min="1" max="100" step="1" placeholder={String(Math.round(PAYOUT*100))} value={mf.payoutPct} onChange={e=>smf(m=>({...m,payoutPct:e.target.value}))}/>
            </div>
          )}
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
            <div style={{fontSize:12,color:'var(--text-muted)'}}>Paste with Ctrl+V or Cmd+V anywhere on this form, or browse to add screenshots.</div>
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
              {t.offPlan&&<span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface-0)',borderRadius:4,padding:'1px 5px'}}>Off-plan</span>}
              {t.strategyId&&<span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface-0)',borderRadius:4,padding:'1px 5px'}}>{strategyLabel(t.strategyId,strategies)}</span>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:13,fontFamily:'var(--font-mono)',color:t.outcome==='WIN'?'var(--text-success)':t.outcome==='LOSS'?'var(--text-danger)':'var(--text-muted)'}}>{t.outcome==='PENDING'?`${f$(t.stake)} pending`:(t.pnl>=0?'+':'')+f$(t.pnl)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(t.timestamp).toLocaleString()}</div>
            </div>
          </div>
          {t.outcome==='PENDING'&&(
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="number" min="1" max="100" step="1" aria-label="Payout %" style={{...inp,width:64,flex:'0 0 auto'}}
                placeholder={String(Math.round(PAYOUT*100))}
                value={pendingPayoutDrafts[t.id]??lastPayoutPct()}
                onClick={e=>e.stopPropagation()}
                onChange={e=>setPendingPayoutDrafts(d=>({...d,[t.id]:e.target.value}))}/>
              <button style={{...btn('suc'),flex:1}} onClick={e=>{
                e.stopPropagation();
                const pct=parseFloat(pendingPayoutDrafts[t.id]??lastPayoutPct());
                const payoutPct=Number.isFinite(pct)&&pct>0?pct:undefined;
                if(payoutPct)setLastPayoutPct(String(payoutPct));
                setOutcome(t.id,'WIN',payoutPct);
              }}>Win ✓</button>
              <button style={{...btn('dan'),flex:1}} onClick={e=>{e.stopPropagation();setOutcome(t.id,'LOSS');}}>Loss ✗</button>
            </div>
          )}
          {t.notes&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6,fontStyle:'italic'}}>{t.notes}</div>}
        </div>
      ))}

      <TradeDetailModal trade={selectedTrade} onClose={()=>setSelectedTrade(null)} onSaved={setSelectedTrade} saveTrades={saveTrades} deleteTrade={deleteTrade} strategies={strategies} settings={settings}/>

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

// Trade Detail/Edit modal, extracted so both Journal (row clicks) and Quick
// Log (row clicks) can open the exact same in-place modal — Quick Log used
// to deep-link into Journal's own page for this, which meant leaving Quick
// Log entirely just to paste a screenshot. `trade` is the selected trade or
// null; renders nothing when null, same as the old `{selectedTrade&&(...)}`
// guard did inline.
function TradeDetailModal({trade,onClose,onSaved,saveTrades,deleteTrade,strategies,settings}){
  const activeStrategies=(strategies||[]).filter(s=>!s.archived);
  const[pairOptions,setPairOptions]=useState(PAIRS);
  // Opening a trade always lands on the read-only Detail view first —
  // Edit is a deliberate secondary action, never the default.
  const[editingTrade,setEditingTrade]=useState(false);
  const[editDraft,setEditDraft]=useState({notes:'',screenshots:[],pair:'',strategyId:'',dir:'BUY',outcome:'PENDING',grade:'A',stake:'',payoutPct:''});
  const[preview,setPreview]=useState(null); // {items:[url,...], index}
  const[savingEdit,setSavingEdit]=useState(false);
  const[editErr,setEditErr]=useState(null);
  const[savedFlash,setSavedFlash]=useState(false);
  const[confirmingDelete,setConfirmingDelete]=useState(false);
  const[polishingTrade,setPolishingTrade]=useState(false);
  const[tradeSuggestion,setTradeSuggestion]=useState(null);
  const tradeNotesRef=useRef(null);

  function addPairOption(value){
    const trimmed=(value||'').trim();
    if(!trimmed)return;
    setPairOptions(prev=>prev.includes(trimmed)?prev:[...prev,trimmed]);
  }

  async function saveTradeEdits(){
    if(!trade||savingEdit)return;
    setSavingEdit(true);setEditErr(null);
    try{
      const screenshots=editDraft.screenshots.map(x=>x.b64||x).filter(Boolean);
      const pair=(editDraft.pair||'').trim()||trade.pair;
      addPairOption(pair);
      const stake=parseFloat(editDraft.stake);
      const validStake=Number.isFinite(stake)&&stake>0?stake:trade.stake;
      const payoutPct=editDraft.outcome==='WIN'?parseFloat(editDraft.payoutPct)||undefined:undefined;
      const pnl=calcPnl(validStake,editDraft.outcome,payoutPct);
      const updated={...trade,notes:editDraft.notes,screenshots,pair,strategyId:editDraft.strategyId,
        direction:editDraft.dir,zoneGrade:editDraft.grade,stake:validStake,outcome:editDraft.outcome,pnl,
        payoutPct:payoutPct||null};
      await saveTrades(prev=>prev.map(t=>t.id===trade.id?updated:t));
      // `trade` is owned by the caller (Journal/QuickLog's selectedTrade),
      // not this component — without handing the fresh object back up, the
      // read-only Detail view below would keep showing the pre-edit values
      // until the next full re-render happened to pass a new `trade` prop.
      onSaved?.(updated);
      setEditingTrade(false); // back to the read-only Detail view, not the list
      setSavedFlash(true);
      setTimeout(()=>setSavedFlash(false),1800);
    }catch(e){
      setEditErr(e.message||'Could not save edits. Try again.');
    }finally{
      setSavingEdit(false);
    }
  }

  async function addTradeImage(file){
    if(!file||!trade)return;
    const b=await toB64(file);
    const url=typeof URL.createObjectURL==='function'?URL.createObjectURL(file):`data:${file.type||'image/png'};base64,${b}`;
    const next=[...(editDraft.screenshots||trade.screenshots||[]),{url,b64:b,mime:file.type||'image/png'}];
    setEditDraft(d=>({...d,screenshots:next}));
  }

  function openTradeImage(i){
    setPreview({items:editDraft.screenshots.map(s=>s.url),index:i});
  }
  // Detail view reads straight off `trade` (read-only), not editDraft (which
  // only exists for the Edit view) — same zoom modal, different source.
  function openSelectedTradeImage(i){
    const items=(trade.screenshots||[]).map(src=>{
      const raw=typeof src==='string'?src:(src?.b64||src?.b);
      return toDataUrl(raw,src?.mime);
    });
    setPreview({items,index:i});
  }

  // addTradeImage closes over editDraft/trade directly (not via a functional
  // state updater), so it must always be called through a ref that's
  // refreshed every render — otherwise a paste effect that only re-attaches
  // when trade's identity changes could fire a stale closure and drop
  // screenshots added earlier in the same edit session.
  const addTradeImageRef=useRef(addTradeImage);
  addTradeImageRef.current=addTradeImage;

  // Global (document-level), matching the Analyzer's paste handling — an
  // onPaste prop on just the notes textarea only fires while that exact
  // element has focus, which is easy to miss. Keyed on presence (not the
  // object itself) so it attaches once per trade opened, not on every edit.
  const hasTrade=!!trade;
  useEffect(()=>{
    if(!hasTrade)return;
    function onPaste(e){
      const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
      if(!item)return;
      e.preventDefault();
      const file=item.getAsFile();
      if(file)addTradeImageRef.current(file);
    }
    document.addEventListener('paste',onPaste);
    return()=>document.removeEventListener('paste',onPaste);
  },[hasTrade]);

  // Keyed on trade id (not the whole object) — addTradeImage updates
  // editDraft only now (trade itself is owned by the caller), and re-keying
  // on every such mutation would blow away in-progress notes edits mid-typing.
  useEffect(()=>{
    if(trade){
      setEditDraft({notes:trade.notes||'',pair:trade.pair||'',strategyId:trade.strategyId||'zone-sd',
        dir:trade.direction||'BUY',outcome:trade.outcome||'PENDING',grade:trade.zoneGrade||'UNGRADED',
        stake:String(trade.stake??''),payoutPct:trade.payoutPct?String(trade.payoutPct):'',
        screenshots:(trade.screenshots||[]).map((src,i)=>{
        const isStr=typeof src==='string';
        const raw=isStr?src:(src?.b64||src?.b);
        return{id:i,url:toDataUrl(raw,src?.mime),b64:raw,mime:src?.mime||'image/png'};
      })});
      setEditErr(null);
      setPreview(null);
      setConfirmingDelete(false);
      setTradeSuggestion(null);
      setEditingTrade(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[trade?.id]);

  async function polishTradeNotes(){
    if(polishingTrade||!editDraft.notes?.trim())return;
    setPolishingTrade(true);setEditErr(null);
    try{
      setTradeSuggestion(await polishJournalNote(editDraft.notes,settings));
    }catch(e){
      setEditErr(e.message||'Could not polish notes. Try again.');
    }finally{
      setPolishingTrade(false);
    }
  }
  function acceptTradePolish(){
    if(tradeSuggestion==null)return;
    if(!applyTextWithUndo(tradeNotesRef,tradeSuggestion))setEditDraft(d=>({...d,notes:tradeSuggestion}));
    setTradeSuggestion(null);
  }

  if(!trade)return null;
  return(
    <>
      <div role="dialog" aria-modal="true" aria-label={editingTrade?'Edit trade':'Trade detail'} style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1000}} onClick={onClose}>
        <div style={{...card,width:'100%',maxWidth:820,maxHeight:'90vh',overflowY:'auto',border:'1px solid var(--border-strong)',boxShadow:'0 18px 50px rgba(0,0,0,0.35)'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>{editingTrade?'Edit trade':'Trade detail'}</div>
              <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span>{trade.pair} · {trade.direction}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              {!editingTrade&&<button style={btn('pri')} onClick={()=>setEditingTrade(true)}><i className="ti ti-pencil" aria-hidden="true" style={{marginRight:5}}/>Edit</button>}
              <button style={btn()} onClick={()=>editingTrade?setEditingTrade(false):onClose()}>{editingTrade?'Back':'Close'}</button>
            </div>
          </div>

          {!editingTrade?(
            <TradeDetailView trade={trade} onZoom={openSelectedTradeImage} strategies={strategies}/>
          ):(
          <div style={{display:'grid',gap:12}}>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Pair &amp; strategy</div>
              <label style={lbl}>Pair</label>
              <input style={inp} value={editDraft.pair} onChange={e=>setEditDraft(d=>({...d,pair:e.target.value}))} onBlur={()=>addPairOption(editDraft.pair)} placeholder="Type any pair, e.g. EUR/USD OTC" list="edit-pair-options"/>
              <datalist id="edit-pair-options">
                {pairOptions.map(p=><option key={p} value={p}/>)}
              </datalist>
              <div style={{marginTop:10}}>
                <label style={lbl}>Strategy</label>
                <select aria-label="Strategy" style={inp} value={editDraft.strategyId||''} onChange={e=>setEditDraft(d=>({...d,strategyId:e.target.value}))}>
                  <option value="">Select a strategy…</option>
                  {[...activeStrategies,
                    // Keep the trade's current strategy selectable inline even if it's
                    // since been archived — an archived strategy is only hidden from
                    // NEW entries, not erased from a trade that already references it.
                    ...(editDraft.strategyId&&!activeStrategies.some(s=>s.id===editDraft.strategyId)
                      ?(strategies||[]).filter(s=>s.id===editDraft.strategyId):[])
                  ].map(s=><option key={s.id} value={s.id}>{s.name}{s.archived?' (archived)':''}</option>)}
                </select>
              </div>
            </div>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Direction, outcome &amp; grade</div>
              <div className="grid-2">
                <div>
                  <label style={lbl}>Direction</label>
                  <div style={{display:'flex',gap:8}}>
                    {['BUY','SELL'].map(d=><button key={d} type="button" style={{...btn(editDraft.dir===d?(d==='BUY'?'suc':'dan'):'def'),flex:1}} onClick={()=>setEditDraft(x=>({...x,dir:d}))}>{d}</button>)}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Stake ($)</label>
                  <input style={inp} type="number" min="0" step="0.01" value={editDraft.stake} onChange={e=>setEditDraft(d=>({...d,stake:e.target.value}))}/>
                </div>
              </div>
              <div style={{marginTop:10}}>
                <label style={lbl}>Outcome</label>
                <div style={{display:'flex',gap:8}}>
                  {['PENDING','WIN','LOSS'].map(o=><button key={o} type="button" style={{...btn(editDraft.outcome===o?(o==='WIN'?'suc':o==='LOSS'?'dan':'pri'):'def'),flex:1}} onClick={()=>setEditDraft(d=>({...d,outcome:o}))}>{o}</button>)}
                </div>
              </div>
              {editDraft.outcome==='WIN'&&(
                <div style={{marginTop:10}}>
                  <label style={lbl}>Payout % <span style={{fontWeight:400,color:'var(--text-muted)'}}>(default {Math.round(PAYOUT*100)}% if left blank)</span></label>
                  <input style={inp} type="number" min="1" max="100" step="1" placeholder={String(Math.round(PAYOUT*100))} value={editDraft.payoutPct} onChange={e=>setEditDraft(d=>({...d,payoutPct:e.target.value}))}/>
                </div>
              )}
              <div style={{marginTop:10}}>
                <label style={lbl}>Trade grade</label>
                <div style={{display:'flex',gap:8}}>
                  {['A+','A','B','C','UNGRADED'].map(g=><button key={g} type="button" style={{...btn(editDraft.grade===g?'pri':'def'),flex:1}} onClick={()=>setEditDraft(d=>({...d,grade:g}))}>{g}</button>)}
                </div>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>Editing these recalculates P&L, but does not retroactively change your session's win/loss/target counters — those are informational guidance, not re-derived after the fact.</div>
            </div>
            <div>
              <label style={lbl}>Screenshots {editDraft.screenshots?.length>0&&<span style={{color:'var(--text-muted)',fontWeight:400}}>({editDraft.screenshots.length})</span>}</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(92px,1fr))',gap:10,marginBottom:8}}>
                {editDraft.screenshots?.map((src,i)=>(
                  <div key={i} className="gm-gallery-tile" style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',background:'var(--surface-0)',cursor:'zoom-in'}} onClick={()=>openTradeImage(i)}>
                    <img src={src.url} alt={`Screenshot ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    <div className="gm-gallery-overlay" style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.55) 100%)',opacity:0,transition:'opacity 0.15s'}}/>
                    <button
                      aria-label={`Remove screenshot ${i+1}`}
                      onClick={e=>{e.stopPropagation();const next=editDraft.screenshots.filter((_,j)=>j!==i);setEditDraft(d=>({...d,screenshots:next}));}}
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
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:14,fontWeight:500}}>Notes</div>
                <button type="button" style={{...btn(),padding:'3px 9px',fontSize:11,gap:4}} onClick={polishTradeNotes} disabled={polishingTrade||!editDraft.notes?.trim()} title="Fix grammar and use precise trading terms">
                  <Sparkles size={12}/>{polishingTrade?'Polishing…':'AI polish'}
                </button>
              </div>
              <textarea ref={tradeNotesRef} aria-label="Journal notes" value={editDraft.notes} onChange={e=>setEditDraft(d=>({...d,notes:e.target.value}))} style={{...inp,minHeight:96,resize:'vertical'}} placeholder="Add notes and paste screenshots here"/>
              {tradeSuggestion!=null&&(
                <div style={{marginTop:8,padding:10,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface-1)'}}>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>AI suggestion</div>
                  <div style={{fontSize:13,whiteSpace:'pre-wrap'}}>{tradeSuggestion}</div>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button type="button" style={btn('pri')} onClick={acceptTradePolish}>Accept</button>
                    <button type="button" style={btn()} onClick={()=>setTradeSuggestion(null)}>Discard</button>
                  </div>
                </div>
              )}
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Tip: press Ctrl+V or Cmd+V anywhere on this page to add screenshots quickly.</div>
            </div>
            {editErr&&<Alert type="dan" title="Error" body={editErr}/>}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <button style={{...btn('pri'),flex:1}} onClick={saveTradeEdits} disabled={savingEdit}>{savingEdit?'Saving…':'Save edits'}</button>
              <button style={btn()} onClick={()=>setEditingTrade(false)} disabled={savingEdit}>Cancel</button>
              <button style={btn('dan')} onClick={()=>setConfirmingDelete(true)}>Delete</button>
              {savedFlash&&<span style={{fontSize:12,color:'var(--text-success)',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-check" aria-hidden="true"/>Saved</span>}
            </div>
          </div>
          )}
        </div>
      </div>

      {confirmingDelete&&(
        <ConfirmDialog
          title="Delete this trade entry?"
          body="This permanently removes the entry, its notes, and its screenshots. This cannot be undone."
          confirmLabel="Delete entry"
          onCancel={()=>setConfirmingDelete(false)}
          onConfirm={()=>{deleteTrade(trade);setConfirmingDelete(false);onClose();}}
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
    </>
  );
}

// ── Quick Log ────────────────────────────────────────────────────────────────
// Rapid-entry table for an active Anti-Martingale session — same trades-table
// schema as Journal's manual entry (source:'QUICKLOG' instead of 'MANUAL'),
// just a faster per-row commit instead of opening the full form each time.
// Row clicks open the shared TradeDetailModal in place, so pasting a
// screenshot right after logging never requires leaving Quick Log.
function QuickLog({settings,trades,saveTrades,deleteTrade,ss,saveSS,wds,mode,strategies,music,userId}){
  const now=useNowTick(1000);
  const[selectedTrade,setSelectedTrade]=useState(null);
  // The most recent session for this mode today, active or not — NOT
  // getActive()'s strict isActive filter. getActive() would go straight to
  // null the instant this session ends (profit target/loss target/max
  // trades/60min cap), which used to silently blank the whole rows table,
  // balance, and stake — not just block new commits. Falling back to "most
  // recent" keeps the just-ended session's history visible and gives
  // commitRow's one-shot grace trade (below) something real to attribute to.
  const sessionForMode=(ss?.sessions||[]).filter(s=>s.accountMode===mode).sort((a,b)=>b.startTime-a.startTime)[0]||null;
  const style=getMoneyMgmtStyleForMode(settings,mode);
  const isAm=isEscalatingStyle(style); // name kept for minimal diff — now covers both escalating styles
  const bal=balForMode(settings,trades,wds,mode);
  // Same Start/Pause/Resume/End controls Dashboard uses, so a session never
  // requires leaving Quick Log — active here is getActive's strict
  // isActive-only session (not sessionForMode above, which also covers an
  // already-ended one for display purposes).
  const activeSession=getActive(ss,mode);
  const{startSession,pauseSession,resumeSession,endSession}=useSessionControls({userId,ss,saveSS,mode,settings,bal,music,active:activeSession});
  // A session that just ended can still take exactly ONE more commit — the
  // trade the user was plausibly mid-entry on when it closed — then locks
  // for good via lateTradeLogged, so this can never become an open door for
  // logging arbitrarily many trades into a closed session.
  const canLog=isAm&&!!sessionForMode&&(sessionForMode.isActive||!sessionForMode.lateTradeLogged);

  const sessionTrades=trades
    .filter(t=>getTradeMode(t)===mode&&t.sessionNum===sessionForMode?.num&&t.date===tod())
    .sort((a,b)=>a.timestamp-b.timestamp);
  // Running balance per row, folded from the session's own starting point —
  // "balance after" always reads as "what it was right after that trade,"
  // not today's live figure.
  let running=sessionForMode?.startBalance??bal;
  const rows=sessionTrades.map(t=>{running+=t.pnl;return{t,balanceAfter:running};});

  const liveStake=canLog?liveEscalatingNextStake(sessionForMode,bal,settings,mode,style):0;
  // This app's own local pair/direction quick-entry state, same tiny pattern
  // Journal's addPairOption uses — not lifted to shared state since it's a
  // session-local autocomplete convenience, not persisted data.
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[draftPair,setDraftPair]=useState('');
  const[draftDir,setDraftDir]=useState(lastDirection());
  const[draftStakeOverride,setDraftStakeOverride]=useState('');
  const[draftPayoutOverride,setDraftPayoutOverride]=useState(lastPayoutPct());
  const[saving,setSaving]=useState(false);
  const[correcting,setCorrecting]=useState(null); // trade id currently being corrected
  const draftStake=parseFloat(draftStakeOverride)||liveStake;
  const draftPayoutPct=parseFloat(draftPayoutOverride)||undefined;

  function addPairOption(value){
    const trimmed=(value||'').trim();
    if(!trimmed)return;
    setPairOptions(prev=>prev.includes(trimmed)?prev:[...prev,trimmed]);
  }

  // Fixes a mis-tapped outcome without leaving Quick Log. Updates the trade
  // itself, then replays every trade in this session in order to rebuild
  // wins/losses/P&L/escalation stake from scratch — same algorithm the
  // App-level reconciliation effect uses for any trade edit, run directly
  // here because that effect skips sessions that have already ended, which
  // is the common case for Anti-Martingale/Profit Lock (they end themselves).
  // Only a still-ACTIVE session gets its end condition re-checked afterward
  // (exactly what commitRow already does after any new trade) — an already-
  // ended session's isActive/endReason is left alone, so a correction can
  // never resurrect a closed session and create a second "active" session
  // for this mode alongside whatever's running now.
  async function correctOutcome(trade,newOutcome){
    if(!sessionForMode||newOutcome===trade.outcome||correcting)return;
    setCorrecting(trade.id);
    try{
      const payoutPct=newOutcome==='WIN'?(trade.payoutPct||undefined):undefined;
      const correctedTrade={...trade,outcome:newOutcome,pnl:calcPnl(trade.stake,newOutcome,payoutPct)};
      await saveTrades(prev=>prev.map(t=>t.id===trade.id?correctedTrade:t));

      const sess=sessionForMode;
      const sessionTradesCorrected=trades
        .map(t=>t.id===trade.id?correctedTrade:t)
        .filter(t=>getTradeMode(t)===mode&&t.sessionNum===sess.num&&t.date===tod())
        .sort((a,b)=>a.timestamp-b.timestamp);
      const isPL=style==='PROFIT_LOCK';
      const baseStake=amBaseStake(sess.startBalance??0,settings);
      let state={...sess,trades:0,wins:0,losses:0,sPnl:0,...(isPL?{plStreak:0,plNextStake:baseStake}:{amStreak:0,amNextStake:baseStake})};
      for(const t of sessionTradesCorrected){
        const isW=t.outcome==='WIN';
        const sp=state.sPnl+(t.pnl||0);
        const balAfter=(sess.startBalance??0)+sp;
        state={...state,trades:state.trades+1,wins:state.wins+(isW?1:0),losses:state.losses+(isW?0:1),sPnl:sp,
          ...advanceEscalatingStake(style,state,t.outcome,t.pnl||0,balAfter,settings,mode)};
      }
      let rebuilt=state;
      if(sess.isActive){
        const endReason=checkEscalatingSessionEnd(rebuilt,mode,settings);
        if(endReason)rebuilt={...rebuilt,isActive:false,endTime:Date.now(),endReason};
      }
      const nextSessions=ss.sessions.map(s=>s.id===sess.id?rebuilt:s);
      await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});
    }finally{setCorrecting(null);}
  }
  // Direction never feeds session stats (wins/losses/P&L/streak all key off
  // outcome, not BUY/SELL) — just the trade record itself, no replay needed.
  async function correctDirection(trade,newDirection){
    if(newDirection===trade.direction)return;
    await saveTrades(prev=>prev.map(t=>t.id===trade.id?{...t,direction:newDirection}:t));
  }

  async function commitRow(outcome){
    if(!canLog||saving)return;
    setSaving(true);
    try{
      const pair=(draftPair||'Manual').trim();
      addPairOption(pair);
      setLastDirection(draftDir);
      const stake=draftStake;
      // Captured from the draft row at the moment of commit, not a stored
      // default — matters most under Profit Lock, where the next stake is
      // derived directly from this trade's actual banked profit.
      const payoutPct=outcome==='WIN'?draftPayoutPct:undefined;
      if(payoutPct)setLastPayoutPct(String(payoutPct));
      const pnl=calcPnl(stake,outcome,payoutPct);
      const balAfter=bal+pnl;

      // Exact same escalating-style state machine addManual/setOutcome use — no new logic.
      let us={...sessionForMode,trades:sessionForMode.trades+1,
        wins:sessionForMode.wins+(outcome==='WIN'?1:0),losses:sessionForMode.losses+(outcome==='LOSS'?1:0),
        sPnl:sessionForMode.sPnl+pnl,...advanceEscalatingStake(style,sessionForMode,outcome,pnl,balAfter,settings,mode)};
      const endReason=checkEscalatingSessionEnd(us,mode,settings);
      if(endReason)us={...us,isActive:false,endTime:Date.now(),endReason}; // non-blocking, no isLocked
      // Grace trade landing in an already-ended session: stamp it used so a
      // second late commit can't slip in behind this one (see canLog above).
      if(!sessionForMode.isActive)us={...us,lateTradeLogged:true};

      const nextSessions=ss.sessions.map(s=>s.id===sessionForMode.id?us:s);
      await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});

      const t={id:uid(),timestamp:Date.now(),date:tod(),sessionNum:sessionForMode.num,pair,direction:draftDir,
        zoneType:'',zoneGrade:'',stake,outcome,pnl,source:'QUICKLOG',screenshots:[],notes:'',
        isAnalyzed:false,accountMode:mode,offPlan:false,lockingModeAtTime:'SOFT',payoutPct:payoutPct||null,
        strategyId:lastStrategyId()||'zone-sd'};
      await saveTrades(prev=>[t,...(prev||[])]);

      setDraftPair('');setDraftStakeOverride('');
    }finally{setSaving(false);}
  }

  // endReason is only set for the three natural AM/PL endings — a manual
  // "End session" click (below) sets lockCode/lockReason instead, which the
  // old endReason-only ternary chain silently mis-labeled as "max trades
  // reached." Checked first so a manual stop always reads correctly.
  const endedText=sessionForMode?.lockCode==='MANUAL'?'ended manually'
    :sessionForMode?.endReason?.endsWith('PROFIT_TARGET')?'profit target reached'
    :sessionForMode?.endReason?.endsWith('LOSS_TARGET')?'loss target reached'
    :sessionForMode?.endReason?.endsWith('TIME_LIMIT')?'60-minute session limit reached'
    :'max trades reached for this session';

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Quick log — {mode==='REAL'?'Real':'Demo'}</div>
        {isAm&&(
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {activeSession?(<>
              {activeSession.pausedAt
                ?<button style={btn()} onClick={resumeSession}>Resume</button>
                :<button style={btn()} onClick={pauseSession}>Pause</button>}
              <button style={btn('dan')} onClick={()=>endSession('MANUAL','Ended manually')}>End session</button>
            </>):(
              <button style={{...btn('suc'),fontSize:13}} onClick={startSession}><Timer size={14}/>Start session ({getEffectiveSessionDuration(settings,mode)}m)</button>
            )}
          </div>
        )}
      </div>

      {!isAm&&<Alert type="inf" title="Anti-Martingale / Profit Lock only" body="Quick Log is built for the escalating-stake styles' fast pace. Switch this mode's Money Management Style in Settings, or use the Journal for Fixed Risk %."/>}
      {isAm&&!sessionForMode&&<Alert type="inf" title="No active session" body="Start a session above to begin logging here."/>}
      {isAm&&sessionForMode&&!sessionForMode.isActive&&canLog&&<Alert type="warn" title="Session ended" body={`Ended — ${endedText}. If you had a trade mid-entry when it ended, you can still log it below — this locks after that one entry.`}/>}
      {isAm&&sessionForMode&&!sessionForMode.isActive&&!canLog&&<Alert type="suc" title="Session ended" body={`Ended — ${endedText}. Start a new session above to keep logging; this table is read-only until then.`}/>}

      {isAm&&sessionForMode&&(()=>{
        // Targets are % of session START balance (matches
        // checkEscalatingSessionEnd exactly) — not live balance, so these
        // dollar figures don't drift as the session's own P&L moves the
        // number they're measuring against.
        const startBal=sessionForMode.startBalance??bal;
        const isPL=style==='PROFIT_LOCK';
        const profitTargetPct=isPL?getPlProfitTargetPctForMode(settings,mode):getAmProfitTargetPctForMode(settings,mode);
        const lossTargetPct=isPL?getPlLossTargetPctForMode(settings,mode):getAmLossTargetPctForMode(settings,mode);
        const maxTrades=isPL?getPlMaxTradesForMode(settings,mode):getAmMaxTradesForMode(settings,mode);
        const profitTargetDollars=startBal*(profitTargetPct/100);
        const lossTargetDollars=startBal*(lossTargetPct/100);
        const tradesRemaining=Math.max(0,maxTrades-sessionForMode.trades);
        const timeRemainingMs=Math.max(0,ESCALATING_TIME_LIMIT_MS-sessionElapsedMs(sessionForMode,now));
        // Normalized bar, not a raw dollar span: each half is independently
        // scaled to its own target, so zero always sits exactly at center
        // regardless of asymmetric profit/loss target %s.
        const lossFrac=lossTargetDollars>0?Math.min(1,Math.max(0,-sessionForMode.sPnl)/lossTargetDollars):0;
        const profitFrac=profitTargetDollars>0?Math.min(1,Math.max(0,sessionForMode.sPnl)/profitTargetDollars):0;
        const markerPct=sessionForMode.sPnl<0?50-lossFrac*50:50+profitFrac*50;
        return(
          <>
            <div className="grid-3">
              <Metric label="Balance" value={f$(bal)}/>
              <Metric label="Session P&L" value={(sessionForMode.sPnl>=0?'+':'')+f$(sessionForMode.sPnl)} color={sessionForMode.sPnl>=0?'var(--text-success)':'var(--text-danger)'}/>
              <Metric label="Trades this session" value={`${sessionForMode.wins}W / ${sessionForMode.losses}L`}/>
            </div>
            <div className="grid-3">
              <Metric label="Profit target" value={`+${f$(profitTargetDollars)}`} color="var(--text-success)"/>
              <Metric label="Loss stop" value={`-${f$(lossTargetDollars)}`} color="var(--text-danger)"/>
              <Metric label="Max trades" value={`${maxTrades} — ${tradesRemaining} left`}/>
              <Metric label="Time limit" value={`60 min — ${fmtClock(timeRemainingMs)} left`} color={timeRemainingMs<=60000?'var(--text-danger)':undefined}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{position:'relative',height:10,borderRadius:999,overflow:'hidden',display:'flex',border:'1px solid var(--border)'}}>
                <div style={{flex:1,background:'var(--fill-danger)',opacity:0.25}}/>
                <div style={{flex:1,background:'var(--fill-success)',opacity:0.25}}/>
                <div style={{position:'absolute',top:-2,bottom:-2,left:`calc(${Math.max(0,Math.min(100,markerPct))}% - 2px)`,width:4,borderRadius:2,background:sessionForMode.sPnl>=0?'var(--fill-success)':'var(--fill-danger)',boxShadow:'0 0 0 1px var(--surface-0)'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-muted)',marginTop:4}}>
                <span>-{f$(lossTargetDollars)}</span>
                <span>$0</span>
                <span>+{f$(profitTargetDollars)}</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* Desktop: dense table, hidden under 640px via CSS (ql-desktop/ql-mobile
          in index.css) — no JS viewport detection, same approach as grid-2/3. */}
      <div className="ql-desktop">
        <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
          <thead>
            <tr style={{fontSize:11,color:'var(--text-muted)',textAlign:'left'}}>
              <th style={{padding:'4px 6px'}}>Pair</th><th style={{padding:'4px 6px'}}>Dir</th><th style={{padding:'4px 6px'}}>Stake</th><th style={{padding:'4px 6px'}}>Payout %</th><th style={{padding:'4px 6px'}}>Outcome</th><th style={{padding:'4px 6px'}}>Balance after</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({t,balanceAfter})=>(
              <tr key={t.id} style={{cursor:'pointer',borderTop:'1px solid var(--border)'}} onClick={()=>setSelectedTrade(t)}>
                <td style={{padding:'6px'}}>{t.pair}</td>
                <td style={{padding:'6px'}}><DirToggle value={t.direction} onChange={d=>correctDirection(t,d)} compact/></td>
                <td style={{padding:'6px'}}>{f$(t.stake)}</td>
                <td style={{padding:'6px',color:'var(--text-muted)'}}>{t.outcome==='WIN'?`${t.payoutPct||Math.round(PAYOUT*100)}%`:'—'}</td>
                <td style={{padding:'6px'}}><OutcomeToggle value={t.outcome} onChange={o=>correctOutcome(t,o)} disabled={correcting===t.id}/></td>
                <td style={{padding:'6px'}}>{f$(balanceAfter)}</td>
              </tr>
            ))}
            {canLog&&(
              <tr style={{borderTop:'1px solid var(--border)'}}>
                <td style={{padding:'6px'}}>
                  <input list="quicklog-pairs-desktop" style={inp} value={draftPair} onChange={e=>setDraftPair(e.target.value)} placeholder="EUR/USD OTC"/>
                  <datalist id="quicklog-pairs-desktop">{pairOptions.map(p=><option key={p} value={p}/>)}</datalist>
                </td>
                <td style={{padding:'6px'}}><DirToggle value={draftDir} onChange={setDraftDir}/></td>
                <td style={{padding:'6px'}}><input type="number" style={inp} value={draftStakeOverride||liveStake} onChange={e=>setDraftStakeOverride(e.target.value)}/></td>
                <td style={{padding:'6px'}}><input type="number" min="1" max="100" step="1" style={inp} placeholder={String(Math.round(PAYOUT*100))} value={draftPayoutOverride} onChange={e=>setDraftPayoutOverride(e.target.value)}/></td>
                <td style={{padding:'6px'}}>
                  <button style={btn('suc')} onClick={()=>commitRow('WIN')} disabled={saving}>W</button>{' '}
                  <button style={btn('dan')} onClick={()=>commitRow('LOSS')} disabled={saving}>L</button>
                </td>
                <td style={{padding:'6px',fontSize:12}}>
                  <span style={{color:'var(--text-success)'}}>{f$(bal+calcPnl(draftStake,'WIN',draftPayoutPct))}</span>
                  {' / '}
                  <span style={{color:'var(--text-danger)'}}>{f$(bal+calcPnl(draftStake,'LOSS'))}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: card-per-row, matching Journal's trade-list card pattern
          (same `card` style, same badge-row-left/outcome-right shape) —
          shown only under 640px via CSS, same rows/commitRow/state as above. */}
      <div className="ql-mobile" style={{marginTop:12}}>
        {rows.map(({t,balanceAfter})=>(
          <div key={t.id} style={{...card,cursor:'pointer'}} role="button" tabIndex={0}
            onClick={()=>setSelectedTrade(t)}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedTrade(t);}}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:13,fontWeight:500}}>{t.pair}</span>
                <DirToggle value={t.direction} onChange={d=>correctDirection(t,d)} compact/>
              </div>
              <OutcomeToggle value={t.outcome} onChange={o=>correctOutcome(t,o)} disabled={correcting===t.id}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)'}}>
              <span>Stake {f$(t.stake)}</span>
              <span>Payout {t.outcome==='WIN'?`${t.payoutPct||Math.round(PAYOUT*100)}%`:'—'}</span>
              <span>Bal {f$(balanceAfter)}</span>
            </div>
          </div>
        ))}
        {canLog&&(
          <div style={{...card,border:'1px dashed var(--border-strong)'}}>
            <label style={lbl}>Pair</label>
            <input list="quicklog-pairs-mobile" style={inp} value={draftPair} onChange={e=>setDraftPair(e.target.value)} placeholder="EUR/USD OTC"/>
            <datalist id="quicklog-pairs-mobile">{pairOptions.map(p=><option key={p} value={p}/>)}</datalist>
            <div style={{marginTop:10}}>
              <label style={lbl}>Direction</label>
              <DirToggle value={draftDir} onChange={setDraftDir}/>
            </div>
            <div className="grid-2" style={{marginTop:10,marginBottom:0}}>
              <div><label style={lbl}>Stake</label><input type="number" style={inp} value={draftStakeOverride||liveStake} onChange={e=>setDraftStakeOverride(e.target.value)}/></div>
              <div><label style={lbl}>Payout %</label><input type="number" min="1" max="100" step="1" style={inp} placeholder={String(Math.round(PAYOUT*100))} value={draftPayoutOverride} onChange={e=>setDraftPayoutOverride(e.target.value)}/></div>
            </div>
            <div style={{fontSize:12,marginTop:10}}>
              <span style={{color:'var(--text-success)'}}>Win → {f$(bal+calcPnl(draftStake,'WIN',draftPayoutPct))}</span>
              {' / '}
              <span style={{color:'var(--text-danger)'}}>Loss → {f$(bal+calcPnl(draftStake,'LOSS'))}</span>
            </div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button style={{...btn('suc'),flex:1,minHeight:44}} onClick={()=>commitRow('WIN')} disabled={saving}>Win</button>
              <button style={{...btn('dan'),flex:1,minHeight:44}} onClick={()=>commitRow('LOSS')} disabled={saving}>Loss</button>
            </div>
          </div>
        )}
      </div>
      <TradeDetailModal trade={selectedTrade} onClose={()=>setSelectedTrade(null)} onSaved={setSelectedTrade} saveTrades={saveTrades} deleteTrade={deleteTrade} strategies={strategies} settings={settings}/>
    </div>
  );
}

// ── Money Management ──────────────────────────────────────────────────────────
// Milestones and the growth projector follow the global Demo/Real toggle, so
// growth can be envisioned on Demo too. Withdrawal logging stays Real-only —
// Demo has no concept of a withdrawal.
function Money({settings,trades,wds,saveWds,mode,ss}){
  const startBal=getStartingBalanceForMode(settings,mode);
  const bal=balForMode(settings,trades,wds,mode);
  const modeTrades=trades.filter(t=>getTradeMode(t)===mode);
  const[amt,setAmt]=useState('');
  const[note,setNote]=useState('');
  const[wks,setWks]=useState(12);
  const stake=calcStake(bal,settings);
  const mmStyle=getMoneyMgmtStyleForMode(settings,mode);
  const activeAmSession=ss?getActive(ss,mode):null;
  const mmIsEscalating=isEscalatingStyle(mmStyle);
  const amNextStake=mmIsEscalating?liveEscalatingNextStake(activeAmSession,bal,settings,mode,mmStyle):null;
  const amReasoning=mmIsEscalating?escalatingStakeReasoning(activeAmSession,bal,settings,mode,mmStyle):null;
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
        <div className="grid-3">
          <Metric label="Balance" value={f$(bal)}/>
          {mmIsEscalating
            ?<Metric label="Style" value={mmStyle==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'} sub={amReasoning}/>
            :<Metric label={settings.riskMode==='FIXED'?'Fixed stake':'Risk %'} value={settings.riskMode==='FIXED'?f$(settings.riskAmount):fp(settings.riskPercent)}/>}
          <Metric label="Trade stake" value={f$(mmIsEscalating?amNextStake:stake.actual)} color="var(--text-accent)"/>
        </div>
        {mmStyle==='ANTI_MARTINGALE'&&(
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>
            {getAmMultiplierForMode(settings,mode).toFixed(1)}× multiplier per win, capped at {getAmCeilingPctForMode(settings,mode)}% of balance · ends at +{getAmProfitTargetPctForMode(settings,mode)}% or −{getAmLossTargetPctForMode(settings,mode)}% of this session's starting balance.
          </div>
        )}
        {mmStyle==='PROFIT_LOCK'&&(
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>
            Stakes only banked profit, never base capital, capped at {getPlCeilingPctForMode(settings,mode)}% of balance · ends at +{getPlProfitTargetPctForMode(settings,mode)}% or −{getPlLossTargetPctForMode(settings,mode)}% of this session's starting balance.
          </div>
        )}
        {!mmIsEscalating&&settings.riskMode!=='FIXED'&&stake.eff>settings.riskPercent*1.1&&(
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
        <div className="grid-2">
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
// Auto-compiled digest for whatever range the shared DateRangePicker (owned
// by Analytics, passed down) is currently set to — pure computation over
// trades/analyses already loaded client-side (see computeDigest), no
// generated commentary, just numbers and a delta vs the prior equal-length
// period where one exists. Tone is deliberately factual: the trader applies
// their own judgment.
function ReviewDigest({trades,analyses,settings,wds,range}){
  const[mode,setMode]=useState('DEMO');
  const{start,end}=rangeBounds(range);
  const prevR=prevRangeFor(range);
  const cur=computeDigest({trades,analyses,mode,start,end});
  const prev=prevR?computeDigest({trades,analyses,mode,start:prevR.start,end:prevR.end}):null;
  const wrDelta=(prev&&cur.total&&prev.total)?cur.wr-prev.wr:null;
  const pnlDelta=prev?cur.realPnl-prev.realPnl:null;
  const periodLabel=rangeLabel(range);
  const prevLabel=range.preset==='WEEK'?'the previous 7 days':'the previous 30 days';
  const modeBal=balForMode(settings,trades,wds,mode);
  const trend=offPlanTrend(trades,mode);

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
        {tog([{id:'DEMO',label:'Demo'},{id:'REAL',label:'Real'}],mode,setMode,id=>id==='REAL'?'var(--fill-danger)':'var(--fill-accent)')}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500}}>{periodLabel} · {mode==='REAL'?'Real':'Demo'}</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Auto-compiled from your logged trades — nothing to fill in.</div>

        <div className="grid-2">
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
            Real account P&L this period: <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:cur.realPnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(cur.realPnl>=0?'+':'')+f$(cur.realPnl)}</span>
            {pnlDelta!=null&&<> ({pnlDelta>=0?'+':''}{f$(pnlDelta)} vs {prevLabel})</>}
          </div>
        </div>
      </div>

      {/* ── Discipline Impact ──────────────────────────────────────────── */}
      <div style={{...card,marginTop:16}}>
        <div style={{fontSize:14,fontWeight:500}}>Discipline Impact · {mode==='REAL'?'Real':'Demo'}</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Off-plan trades, counted the same way as everything else above.</div>

        <div className="grid-2">
          <Metric label="Off-plan trades" value={cur.offPlanCount} sub={`of ${cur.totalTrades} total this period`}/>
          <Metric
            label="Off-plan P&L"
            value={cur.offPlanDoneCount?(cur.offPlanPnl>=0?'+':'')+f$(cur.offPlanPnl):'—'}
            sub={cur.offPlanDoneCount?`${cur.offPlanDoneCount} resolved off-plan trade${cur.offPlanDoneCount===1?'':'s'}`:'No resolved off-plan trades this period'}
            color={cur.offPlanDoneCount?(cur.offPlanPnl>=0?'var(--text-success)':'var(--text-danger)'):undefined}
          />
        </div>

        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)',display:'grid',gap:10}}>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            On-plan win rate: {cur.onPlanDoneCount?fp(cur.onPlanWr):'—'}
            {cur.onPlanDoneCount>0&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
              <WinRateCI wins={cur.onPlanWins} total={cur.onPlanDoneCount}/>
              {cur.onPlanDoneCount<20&&<div>Small sample — interpret cautiously.</div>}
            </div>}
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            Off-plan win rate: {cur.offPlanDoneCount?fp(cur.offPlanWr):'—'}
            {cur.offPlanDoneCount>0&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
              <WinRateCI wins={cur.offPlanWins} total={cur.offPlanDoneCount}/>
              {cur.offPlanDoneCount<20&&<div>Small sample — interpret cautiously.</div>}
            </div>}
          </div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>
            If off-plan trades had not been taken, your {mode==='REAL'?'Real':'Demo'} balance would be {f$(modeBal-cur.offPlanPnl)} instead of {f$(modeBal)}.
          </div>
        </div>

        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',marginBottom:8}}>Off-plan trades as % of total, last 8 weeks</div>
          <div style={{display:'grid',gap:4}}>
            {trend.map((w,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:14,background:'var(--surface-0)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,w.pct)}%`,height:'100%',background:w.pct>0?'var(--fill-danger)':'transparent'}}/>
                </div>
                <div style={{fontSize:11,color:'var(--text-muted)',width:70,textAlign:'right',flexShrink:0}}>{w.total?`${fp(w.pct)} (${w.offPlan}/${w.total})`:'no trades'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Analytics({trades,analyses,settings,bal,wds,strategies:strategyList}){
  const[scope,setScope]=useState('ALL');
  const[tab,setTab]=useState('OVERVIEW');
  const[range,setRange]=useState({preset:'ALL',start:null,end:null});
  const scoped=tradesInRange(trades,scope,range);
  const done=scoped.filter(t=>t.outcome!=='PENDING');
  const total=done.length,wins=done.filter(t=>t.outcome==='WIN').length;
  const wr=total?(wins/total)*100:0;
  const pnl=done.reduce((s,t)=>s+t.pnl,0);
  const ev=total?pnl/total:0;
  const analyzed=done.filter(t=>t.isAnalyzed),manual=done.filter(t=>!t.isAnalyzed);
  const aWr=analyzed.length?(analyzed.filter(t=>t.outcome==='WIN').length/analyzed.length)*100:0;
  const mWr=manual.length?(manual.filter(t=>t.outcome==='WIN').length/manual.length)*100:0;
  const grades=['A+','A','B','C','INVALID','UNGRADED'].map(g=>{const gt=done.filter(t=>t.zoneGrade===g),gw=gt.filter(t=>t.outcome==='WIN').length;return{g,total:gt.length,wins:gw,wr:gt.length?(gw/gt.length)*100:0};}).filter(x=>x.total>0);
  // Strategy is a full breakdown dimension, equal standing to grade/pair, and
  // works for any number of user-defined strategies, not just the two
  // builtins — grouped by whichever strategyId's actually present in the
  // data (trades pre-dating this field default to 'zone-sd', matching
  // toTradeRow's own fallback), with the display name resolved from the
  // user's full strategies list. A strategyId that no longer resolves (only
  // possible if a row were hard-deleted outside the app, since Settings only
  // ever soft-deletes) defensively falls back to "(unknown)".
  const strategyBreakdown=[...new Set(done.map(t=>t.strategyId||'zone-sd'))].map(id=>{
    const st=done.filter(t=>(t.strategyId||'zone-sd')===id),sw=st.filter(t=>t.outcome==='WIN').length;
    const name=strategyLabel(id,strategyList)||'(unknown)';
    return{id,name,total:st.length,wins:sw,wr:st.length?(sw/st.length)*100:0,pnl:st.reduce((a,t)=>a+t.pnl,0)};
  }).filter(x=>x.total>0);
  const pairsMap={};done.forEach(t=>{if(!pairsMap[t.pair])pairsMap[t.pair]={wins:0,total:0};pairsMap[t.pair].total++;if(t.outcome==='WIN')pairsMap[t.pair].wins++;});
  const pairs=Object.entries(pairsMap).map(([p,d])=>({p,wr:(d.wins/d.total)*100,...d})).sort((a,b)=>b.total-a.total).slice(0,6);
  const be=(100/(100+PAYOUT*100));
  const pnlTrend=done.slice().sort((a,b)=>a.timestamp-b.timestamp).reduce((acc,t)=>{const prev=acc.at(-1)?.v||0;acc.push({t:t.timestamp,v:prev+t.pnl});return acc;},[]);
  const gradeBars=grades.map(x=>({label:x.g,value:Math.round(x.wr),color:x.wr>=65?'var(--fill-success)':x.wr>=52.6?'var(--fill-accent)':'var(--fill-danger)'}));
  const pairBars=pairs.map(x=>({label:x.p.length>8?x.p.slice(0,8)+'…':x.p,value:Math.round(x.wr),color:x.wr>=65?'var(--fill-success)':x.wr>=52.6?'var(--fill-accent)':'var(--fill-danger)'})).slice(0,5);
  const doneAll=tradesInRange(trades,'ALL',range).filter(t=>t.outcome!=='PENDING');
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

      {/* One picker instance, shared by both tabs — Overview and Review filter
          through the same tradesInRange/rangeBounds, never their own copies. */}
      <DateRangePicker range={range} setRange={setRange}/>

      {tab==='REVIEW'?<ReviewDigest trades={trades} analyses={analyses} settings={settings} wds={wds} range={range}/>:<>

      <div className="grid-2">
        <Metric label="Total trades" value={total} sub={`${wins}W / ${total-wins}L`}/>
        <Metric label="Win rate" value={fp(wr)} sub={total?<>Break-even: {fp(be*100)}<br/><WinRateCI wins={wins} total={total}/></>:`Break-even: ${fp(be*100)}`} color={wr>=65?'var(--text-success)':wr>=52.6?'var(--text-accent)':'var(--text-danger)'}/>
        <Metric label="Expected value/trade" value={(ev>=0?'+':'')+f$(ev)} color={ev>=0?'var(--text-success)':'var(--text-danger)'}/>
        <Metric label="Total P&L" value={(pnl>=0?'+':'')+f$(pnl)} color={pnl>=0?'var(--text-success)':'var(--text-danger)'}/>
      </div>

      {scope==='ALL'&&(
      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Performance by account mode</div>
        <div className="grid-2">
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
        <TrendChart points={pnlTrend} color={pnl>=0?'var(--text-success)':'var(--text-danger)'} />
        <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6}}>Latest balance impact: <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:pnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(pnl>=0?'+':'')+f$(pnl)}</span></div>
      </div>

      {(analyzed.length>0||manual.length>0)&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Zone analysis impact</div>
          <div className="grid-2">
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
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Win rate by trade grade</div>
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

      {strategyBreakdown.length>0&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Performance by strategy</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:6}}>Every strategy you've logged trades under — equal standing, no default preference</div>
          {strategyBreakdown.map(x=>(
            <div key={x.id} style={{marginTop:10,paddingTop:8,borderTop:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{x.name}</span><span style={{fontSize:12,color:'var(--text-muted)'}}>{x.total} trades</span></div>
                <span style={{fontSize:13,fontFamily:'var(--font-mono)',color:x.wr>=65?'var(--text-success)':'var(--text-accent)'}}>{fp(x.wr)}</span>
              </div>
              <div style={{background:'var(--surface-0)',borderRadius:4,height:6,overflow:'hidden'}}>
                <div style={{height:'100%',background:x.wr>=65?'var(--fill-success)':'var(--fill-accent)',width:`${Math.min(100,x.wr)}%`}}/>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}><WinRateCI wins={x.wins} total={x.total}/></div>
              <div style={{fontSize:12,marginTop:4,color:x.pnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(x.pnl>=0?'+':'')+f$(x.pnl)} P&L</div>
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

      {total===0&&<div style={{...card,textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}><i className="ti ti-chart-bar" style={{fontSize:28,display:'block',marginBottom:8}} aria-hidden="true"/>{range.preset==='ALL'?'No completed trades yet.':'No trades in this range.'}</div>}
      </>}
    </div>
  );
}

// ── Ask ───────────────────────────────────────────────────────────────────────
// Chat UI over the classify -> compute -> compose pipeline defined above. The
// component's only jobs: render messages, resolve Demo/Real ambiguity via a
// button reply (not a guess), and log each finished Q&A to Supabase. Recent
// messages in the CURRENT chat feed conversation history into advisory/
// knowledge/opinion prompts (see resolveAndAnswer) — "New chat" is what
// actually resets that context, not just a cosmetic clear.
const ASK_CHAT_ID_KEY='gm_ask_chat_id';
// No explicit "New chat" click has ever happened yet — 'legacy' keeps
// continuity with whatever history already exists (all pre-feature rows have
// no chatId, which reads back as 'legacy' too, so nothing looks different
// until the user actually starts a new one).
function getAskChatId(){try{return localStorage.getItem(ASK_CHAT_ID_KEY)||'legacy';}catch{return'legacy';}}

// Minimal, dependency-free markdown for the AI's replies — headings,
// blockquotes, bold/italic/inline-code, bullet/numbered lists, horizontal
// rules, paragraph breaks. No links, tables, or fenced code blocks: coach
// replies don't produce those, and this app hand-rolls its own rendering
// elsewhere too (see TrendChart) rather than reaching for a library for a
// narrow need. Builds React elements directly, never
// dangerouslySetInnerHTML, so there's no HTML-injection surface even though
// this text comes from a network response.
function renderInline(line,keyPrefix){
  const nodes=[];
  const re=/(\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let last=0,m,i=0;
  while((m=re.exec(line))){
    if(m.index>last)nodes.push(line.slice(last,m.index));
    const tok=m[0];
    if(tok.startsWith('***')||tok.startsWith('___'))nodes.push(<strong key={`${keyPrefix}-${i++}`}><em>{tok.slice(3,-3)}</em></strong>);
    else if(tok.startsWith('**')||tok.startsWith('__'))nodes.push(<strong key={`${keyPrefix}-${i++}`}>{tok.slice(2,-2)}</strong>);
    else if(tok.startsWith('`'))nodes.push(<code key={`${keyPrefix}-${i++}`} style={{background:'var(--surface-0)',padding:'1px 4px',borderRadius:3,fontFamily:'var(--font-mono)',fontSize:12}}>{tok.slice(1,-1)}</code>);
    else nodes.push(<em key={`${keyPrefix}-${i++}`}>{tok.slice(1,-1)}</em>);
    last=re.lastIndex;
  }
  if(last<line.length)nodes.push(line.slice(last));
  return nodes;
}
// Classifies one line by its markdown block type. Grouping happens next, by
// walking classified lines and merging consecutive same-type runs into a
// single block — the previous version instead split on blank lines FIRST
// and required the whole resulting chunk to be uniformly all-bullets (or
// all-numbered), so a heading immediately followed by a list with no blank
// line between them — extremely common in real LLM output — fell through
// to being dumped as one plain paragraph with literal "#"/"-" characters.
// Per-line classification + contiguous-run grouping is how real markdown
// parsers work and doesn't have that failure mode.
function classifyMdLine(raw){
  const trimmed=raw.trim();
  if(trimmed==='')return{type:'blank'};
  let m;
  if((m=/^(#{1,6})\s+(.*)$/.exec(trimmed)))return{type:'heading',level:m[1].length,text:m[2]};
  if(/^>\s?/.test(trimmed))return{type:'quote',text:trimmed.replace(/^>\s?/,'')};
  if(/^[-*]\s+/.test(trimmed))return{type:'bullet',text:trimmed.replace(/^[-*]\s+/,'')};
  if(/^\d+\.\s+/.test(trimmed))return{type:'numbered',text:trimmed.replace(/^\d+\.\s+/,'')};
  if(/^(---|\*\*\*|___)$/.test(trimmed))return{type:'hr'};
  return{type:'text',text:trimmed};
}
const MD_HEADING_SIZE={1:17,2:16,3:15,4:14,5:14,6:14};
function MarkdownLite({text}){
  const blocks=[];
  let cur=null;
  for(const raw of(text||'').split('\n')){
    const ln=classifyMdLine(raw);
    if(ln.type==='blank'){cur=null;continue;}
    if(cur&&cur.type===ln.type&&(ln.type!=='heading'||cur.level===ln.level)){
      cur.items.push(ln.text);
    }else{
      cur={type:ln.type,level:ln.level,items:ln.type==='hr'?[]:[ln.text]};
      blocks.push(cur);
    }
  }
  return blocks.map((b,bi)=>{
    const topMargin=bi===0?0:'10px 0 0';
    if(b.type==='heading')return(
      <div key={bi} style={{fontSize:MD_HEADING_SIZE[b.level]||14,fontWeight:700,margin:bi===0?'0 0 2px':'12px 0 2px',color:'var(--text-primary)'}}>
        {renderInline(b.items[0],`${bi}-h`)}
      </div>
    );
    if(b.type==='hr')return<hr key={bi} style={{border:'none',borderTop:'1px solid var(--border)',margin:'10px 0'}}/>;
    if(b.type==='quote')return(
      <blockquote key={bi} style={{margin:topMargin,padding:'2px 12px',borderLeft:'3px solid var(--border-accent)',color:'var(--text-secondary)'}}>
        {b.items.map((t,li)=>(<Fragment key={li}>{li>0&&<br/>}{renderInline(t,`${bi}-${li}`)}</Fragment>))}
      </blockquote>
    );
    if(b.type==='bullet')return(
      <ul key={bi} style={{margin:topMargin,paddingLeft:20}}>
        {b.items.map((t,li)=><li key={li} style={{marginBottom:3}}>{renderInline(t,`${bi}-${li}`)}</li>)}
      </ul>
    );
    if(b.type==='numbered')return(
      <ol key={bi} style={{margin:topMargin,paddingLeft:20}}>
        {b.items.map((t,li)=><li key={li} style={{marginBottom:3}}>{renderInline(t,`${bi}-${li}`)}</li>)}
      </ol>
    );
    return(
      <p key={bi} style={{margin:topMargin}}>
        {b.items.map((t,li)=>(<Fragment key={li}>{li>0&&<br/>}{renderInline(t,`${bi}-${li}`)}</Fragment>))}
      </p>
    );
  });
}
function Ask({trades,settings,mode,userId,strategies,analyses,wds,ss}){
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState('');
  const[busy,setBusy]=useState(false);
  const[chatId,setChatId]=useState(getAskChatId);
  const listRef=useRef(null);

  useEffect(()=>{
    if(!userId)return;
    supabase.from('queries').select('*').eq('user_id',userId).order('timestamp',{ascending:true})
      .then(({data})=>{
        if(!data)return;
        const rows=data.map(fromQueryRow).filter(q=>(q.chatId||'legacy')===chatId);
        setMessages(rows.flatMap(q=>[{id:q.id+'-q',role:'user',text:q.question},{id:q.id+'-a',role:'assistant',text:q.answer}]));
      });
  },[userId,chatId]);

  function startNewChat(){
    const id=uid();
    try{localStorage.setItem(ASK_CHAT_ID_KEY,id);}catch{}
    setChatId(id);
    setMessages([]);
    setInput('');
  }

  useEffect(()=>{listRef.current?.scrollTo({top:listRef.current.scrollHeight});},[messages,busy]);

  function appendUser(text){setMessages(m=>[...m,{id:uid(),role:'user',text}]);}
  function appendPlain(text){setMessages(m=>[...m,{id:uid(),role:'assistant',text}]);}
  function appendClarify(question,spec){setMessages(m=>[...m,{id:uid(),role:'assistant',clarify:{question,spec}}]);}
  // Top-level safety net: only a deliberately-thrown, tagged Error (a clear,
  // actionable message like "Add your API key") is shown verbatim. Anything
  // else — a raw TypeError, a network failure, a future bug in this
  // pipeline — never reaches the chat as text, only the console.
  function appendError(err){
    console.error('Ask pipeline error:',err);
    appendPlain(err?.userFacing?err.message:'Something went wrong — try again.');
  }

  // Last few exchanges (any intent) so a follow-up — including a bare
  // "continue" — has something to anchor to. `messages` here is still the
  // pre-this-question state (React hasn't committed the just-appended user
  // question yet), which is exactly the "history before now" a
  // CONVERSATION_HISTORY block should be.
  function getRecentHistory(){
    return messages.filter(m=>m.text).slice(-6).map(m=>({role:m.role,text:m.text}));
  }

  // Visible AND self-describing: appending this to the stored text means a
  // truncated reply looks cut off to the user without extra UI plumbing,
  // and shows up the same way in CONVERSATION_HISTORY on the next turn, so
  // the compose prompts' own continuation rule has real signal to act on —
  // not just guessing from where a sentence happens to stop.
  const TRUNCATION_MARKER='\n\n*(cut off — reply "continue" to keep reading)*';
  async function persistAndShow(question,text,resolvedMode,truncated){
    const shown=truncated?`${text}${TRUNCATION_MARKER}`:text;
    appendPlain(shown); // show the real answer first — history logging is best-effort and must never block or corrupt it
    if(!userId)return;
    try{
      const row={id:uid(),timestamp:Date.now(),question,answer:shown,mode:resolvedMode,chatId};
      const{error}=await supabase.from('queries').insert(toQueryRow(userId,row));
      if(error)console.error('Failed to log query history:',error);
    }catch(err){
      console.error('Failed to log query history:',err); // never surfaced to the user
    }
  }

  async function resolveAndAnswer(spec,question,resolvedMode,recentHistory){
    if(spec.intent==='OUT_OF_SCOPE'){
      await persistAndShow(question,"That one's outside what I can help with here — I'm scoped to your trading journal and trading knowledge generally, not general topics.",resolvedMode);
      return;
    }
    if(spec.intent==='GENERAL_KNOWLEDGE'){
      // No deterministic fallback exists here (unlike the data paths below) —
      // there's no FACTS to fall back to for pure trading education, so a
      // failed call propagates to handleAsk/handleClarify's own catch, same
      // as a failed classifyAskQuery call already does.
      const{text,truncated}=await composeGeneralKnowledge(question,settings,recentHistory);
      await persistAndShow(question,text,resolvedMode,truncated);
      return;
    }
    if(spec.intent==='ADVICE_OR_OPINION'){
      // A real generated response now, not a fixed refusal string — the
      // no-prediction/no-guarantee boundary lives in ADVICE_OPINION_PROMPT
      // (soft), same trust level as GENERAL_KNOWLEDGE. No deterministic
      // fallback for the same reason as GENERAL_KNOWLEDGE above.
      const facts=spec.metric?computeAskFacts({...spec,mode:resolvedMode},trades,resolvedMode,strategies):null;
      const{text,truncated}=await composeAdviceOpinion(question,facts,settings,recentHistory);
      await persistAndShow(question,text,resolvedMode,truncated);
      return;
    }
    if(spec.intent==='TRADING_ADVISORY'){
      const advisoryType=spec.advisoryType||'PERFORMANCE_REVIEW';
      const profile=buildTraderProfile(trades,ss?.sessions||[],analyses,wds,settings,strategies,resolvedMode);
      const advisoryContext=buildAdvisoryContext(profile,question,advisoryType);
      // buildAdvisoryContext already slices `profile` down to exactly what
      // this advisoryType needs — sending the ENTIRE nested profile too
      // (full recentTrades, every strategy's gradeBreakdownWithinStrategy,
      // full session/zone history) on top of that was pure redundancy, and
      // real money against a real TPM budget: see the "rate limit reached"
      // error this was built to fix. A small always-useful summary plus the
      // already-focused context keeps the model grounded without re-sending
      // data advisoryContext already covers for whichever type is active.
      const coreSummary={mode:profile.account.mode,tradeCount:profile.account.tradeCount,
        currentBalance:profile.account.currentBalance,edge:profile.account.edge,
        allTime:profile.performance.allTime,activeStyle:profile.configuration.activeStyle,
        moneyMgmtStyle:profile.configuration.moneyMgmtStyle};
      const playbookBlock=PLAYBOOK_ADVISORY_TYPES.has(advisoryType)?ADVISORY_PLAYBOOK_ADDENDUM:'';
      const historyBlock=recentHistory?.length?`\n\nCONVERSATION_HISTORY:${JSON.stringify(recentHistory)}`:'';
      let text,truncated=false;
      try{({text,truncated}=await aiChatResilient(`${ADVISORY_COMPOSE_PROMPT}${JSON.stringify(coreSummary)}${playbookBlock}\n\nADVISORY_CONTEXT:${JSON.stringify(advisoryContext)}${historyBlock}\n\nQuestion: ${question}`,settings,{maxTokens:1500,temperature:0.3,reasoningEffort:'high'}));}
      catch(err){
        // Both the requested effort AND the 'none' retry inside
        // aiChatResilient failed — this is the only remaining fallback, and
        // it must never fail silently again like it did before.
        console.error('Advisory compose failed even after reasoningEffort retry, using deterministic fallback:',err);
        text=buildAdvisoryFallback(profile,advisoryType);
      }
      await persistAndShow(question,text,resolvedMode,truncated);
      return;
    }
    const facts=computeAskFacts(spec,trades,resolvedMode,strategies);
    facts.impliesAdvice=spec.impliesAdvice;
    let text;
    try{text=await composeAskAnswer(question,facts,settings);} // rule 11 handles the impliesAdvice close — soft, model-phrased
    catch{
      text=factsToText(facts); // composer call failed — still show the real, computed numbers
      // No LLM call happened on this path, so there's no prompt to trust for
      // the impliesAdvice close — this is the one place it stays hardcoded.
      if(spec.impliesAdvice)text=`${text} What to do with that is your call.`;
    }
    await persistAndShow(question,text,resolvedMode);
  }

  // Bypasses classifyAskQuery entirely — this is a fixed action, not a
  // question needing interpretation, so there's no classifier JSON to route
  // through and no way for an impliesAdvice/ADVICE_OR_OPINION branch to fire.
  async function handleSurface(){
    if(busy)return;
    appendUser(PATTERN_SCAN_QUESTION);
    setBusy(true);
    try{
      const pattern=findNotablePattern(trades,mode,undefined,strategies);
      if(!pattern){
        await persistAndShow(PATTERN_SCAN_QUESTION,NO_PATTERN_TEXT,mode);
        return;
      }
      const facts={mode,rangeLabel:pattern.rangeLabel,n:pattern.baselineN,secondaryPattern:pattern};
      let text;
      try{text=await composeAskAnswer(PATTERN_SCAN_QUESTION,facts,settings);}
      catch{text=patternToText(pattern);}
      await persistAndShow(PATTERN_SCAN_QUESTION,text,mode);
    }catch(err){
      appendError(err);
    }finally{setBusy(false);}
  }

  // Shared by the form submit and the empty-state suggestion chips — chips
  // ask directly (no side effects to gate, just a read-only question) rather
  // than only pre-filling the input, for a snappier one-tap on-ramp.
  async function ask(q){
    if(!q||busy)return;
    // Captured before appendUser() commits the new message, same "history
    // before now" contract resolveAndAnswer already relies on.
    const recentHistory=getRecentHistory();
    appendUser(q);
    setBusy(true);
    try{
      const spec=await classifyAskQuery(q,settings,recentHistory);
      if(spec.intent==='DATA_QUERY'&&spec.mode==='AMBIGUOUS'){
        appendClarify(q,spec);
        return;
      }
      await resolveAndAnswer(spec,q,spec.mode==='AMBIGUOUS'?mode:spec.mode,recentHistory);
    }catch(err){
      appendError(err);
    }finally{setBusy(false);}
  }
  async function handleAsk(e){
    e.preventDefault();
    const q=input.trim();
    if(!q||busy)return;
    setInput('');
    await ask(q);
  }
  async function handleClarify(question,spec,chosenMode){
    setBusy(true);
    try{await resolveAndAnswer(spec,question,chosenMode,getRecentHistory());}
    catch(err){appendError(err);}
    finally{setBusy(false);}
  }

  const suggestions=["What's my win rate on Grade A zones?","Review my performance this month","Am I disciplined enough?","Explain what a supply zone is"];
  // Coach's small circular avatar — reuses the Sparkles motif already tied
  // to this feature ("Surface something interesting"), so the icon reads as
  // the same assistant rather than an unrelated new symbol.
  const CoachAvatar=()=>(
    <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--fill-accent)',boxShadow:'0 2px 8px -2px rgba(98,112,243,0.5)'}}>
      <Sparkles size={13} color="#fff"/>
    </div>
  );

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:4}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Ask</div>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.04em',padding:'2px 8px',borderRadius:999,background:'var(--bg-accent)',color:'var(--text-accent)',border:'1px solid var(--border-accent)'}}>AI COACH</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          {messages.length>0&&<button style={btn()} onClick={startNewChat} disabled={busy}>New chat</button>}
          <button style={btn()} onClick={handleSurface} disabled={busy}><Sparkles size={14}/>Surface something interesting</button>
        </div>
      </div>
      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Ask questions about your trades, grades, notes, strategies, and money management. It can report your data, review your performance, advise on risk and discipline, or explain trading concepts generally — all grounded in your own journal, never a market call.</div>

      <div style={{...card,padding:0,display:'flex',flexDirection:'column',height:'min(72vh,680px)',minHeight:420,overflow:'hidden'}}>
        <div style={{height:3,background:'var(--fill-accent)',flexShrink:0}}/>
        <div ref={listRef} style={{flex:1,overflowY:'auto',padding:'20px 18px',display:'flex',flexDirection:'column',gap:16}}>
          {messages.length===0&&!busy&&(
            <div style={{margin:'auto',textAlign:'center',maxWidth:420,padding:'0 12px'}}>
              <div style={{width:52,height:52,borderRadius:'50%',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--fill-accent)',boxShadow:'0 8px 24px -8px rgba(98,112,243,0.5)'}}>
                <Sparkles size={22} color="#fff"/>
              </div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Your trading coach</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:18,lineHeight:1.5}}>Grounded in your own logged trades — ask for a review, a risk check, or just explain a concept.</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
                {suggestions.map(s=>(
                  <button key={s} type="button" onClick={()=>ask(s)} disabled={busy}
                    style={{fontSize:12,padding:'8px 14px',borderRadius:999,border:'1px solid var(--border)',background:'var(--surface-2)',color:'var(--text-secondary)',cursor:'pointer',transition:'border-color 0.15s ease, color 0.15s ease'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m=>(
            <div key={m.id} className="msg-in" style={{display:'flex',gap:8,alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'min(85%,640px)',flexDirection:m.role==='user'?'row-reverse':'row'}}>
              {m.role==='assistant'&&<CoachAvatar/>}
              {m.clarify?(
                <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',boxShadow:'var(--shadow-card)'}}>
                  <div style={{fontSize:13,color:'var(--text-primary)',marginBottom:10}}>Are you asking about your Demo or Real account?</div>
                  <div style={{display:'flex',gap:8}}>
                    <button style={btn()} onClick={()=>handleClarify(m.clarify.question,m.clarify.spec,'DEMO')} disabled={busy}>Demo</button>
                    <button style={btn('dan')} onClick={()=>handleClarify(m.clarify.question,m.clarify.spec,'REAL')} disabled={busy}>Real</button>
                  </div>
                </div>
              ):(
                <div style={{
                  background:m.role==='user'?'var(--fill-accent)':'var(--surface-2)',
                  color:m.role==='user'?'#fff':'var(--text-primary)',
                  border:m.role==='user'?'none':'1px solid var(--border)',
                  borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                  padding:'11px 15px',fontSize:14,boxShadow:m.role==='user'?'0 4px 14px -4px rgba(98,112,243,0.45)':'var(--shadow-card)',
                  ...(m.role==='user'?{whiteSpace:'pre-wrap'}:{lineHeight:1.6}),
                }}>
                  {m.role==='user'?m.text:<MarkdownLite text={m.text}/>}
                </div>
              )}
            </div>
          ))}
          {busy&&(
            <div className="msg-in" style={{display:'flex',gap:8,alignSelf:'flex-start'}}>
              <CoachAvatar/>
              <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'16px 16px 16px 4px',padding:'14px 16px',display:'flex',gap:4,alignItems:'center',boxShadow:'var(--shadow-card)'}}>
                <span className="typing-dot"/>
                <span className="typing-dot" style={{animationDelay:'0.15s'}}/>
                <span className="typing-dot" style={{animationDelay:'0.3s'}}/>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleAsk} style={{display:'flex',gap:8,padding:14,borderTop:'1px solid var(--border)',flexShrink:0}}>
          <input style={{...inp,flex:1,borderRadius:999,padding:'12px 18px',background:'var(--surface-0)'}} placeholder="Ask about your trades, grades, strategies, or request a review…" value={input} onChange={e=>setInput(e.target.value)} disabled={busy}/>
          <button type="submit" style={{...btn('pri'),borderRadius:'50%',width:42,height:42,padding:0,flexShrink:0}} disabled={busy||!input.trim()} aria-label="Send"><Send size={16}/></button>
        </form>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
// One row of the "Manage strategies" list — inline edit, and a delete that's
// soft (archive) if any trade references this strategy, hard otherwise; the
// two builtins never show a delete button at all.
function StrategyRow({strategy,trades,updateStrategy,deleteStrategy}){
  const[editing,setEditing]=useState(false);
  const[name,setName]=useState(strategy.name);
  const[desc,setDesc]=useState(strategy.description||'');
  const inUse=(trades||[]).some(t=>(t.strategyId||'zone-sd')===strategy.id);
  async function save(){
    if(!name.trim())return;
    await updateStrategy({...strategy,name:name.trim(),description:desc.trim()||null});
    setEditing(false);
  }
  return(
    <div style={{padding:'8px 0',borderBottom:'0.5px solid var(--border)'}}>
      {editing?(
        <div>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>
          <input style={{...inp,marginTop:6}} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (optional)"/>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <button style={{...btn('pri'),flex:1}} onClick={save} disabled={!name.trim()}>Save</button>
            <button style={btn()} onClick={()=>{setEditing(false);setName(strategy.name);setDesc(strategy.description||'');}}>Cancel</button>
          </div>
        </div>
      ):(
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>
              {strategy.name}
              {strategy.isBuiltin&&<span style={{marginLeft:6,fontSize:10,color:'var(--text-muted)'}}>Built-in</span>}
              {strategy.archived&&<span style={{marginLeft:6,fontSize:10,color:'var(--text-warning)'}}>Archived</span>}
            </div>
            {strategy.description&&<div style={{fontSize:12,color:'var(--text-muted)'}}>{strategy.description}</div>}
          </div>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <button style={{...btn(),padding:'4px 10px',fontSize:12}} onClick={()=>setEditing(true)}>Edit</button>
            {!strategy.isBuiltin&&(
              <button style={{...btn('dan'),padding:'4px 10px',fontSize:12}} onClick={()=>{
                const msg=inUse
                  ?`"${strategy.name}" is used by past trades — it'll be archived (hidden from new entries, kept for history) instead of deleted. Continue?`
                  :`Delete "${strategy.name}"? This cannot be undone.`;
                if(!window.confirm(msg))return;
                deleteStrategy(strategy);
              }}>Delete</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Cfg({settings,saveSettings,ss,resetAccount,trades,wds,strategies,mode,addStrategy,updateStrategy,deleteStrategy}){
  // Same global account-mode toggle Dashboard/Journal/QuickLog already read
  // — no separate mode concept for Settings. `f` still holds every Demo/Real
  // field at once (storage stays per-mode); only which slice renders here
  // changes with `modeKey`.
  const modeKey=mode==='REAL'?'Real':'Demo';
  const[f,sf]=useState({...settings,tradeStyleDemo:settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1,tradeStyleReal:settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1,startingBalanceDemo:settings?.startingBalanceDemo ?? 0,startingBalanceReal:settings?.startingBalanceReal ?? 0,riskMode:settings?.riskMode ?? 'PERCENT',riskAmount:settings?.riskAmount ?? 5,alertVolume:settings?.alertVolume ?? ALERT_VOLUME_DEFAULT,soundAlertOn:settings?.soundAlertOn ?? true,desktopAlertOn:settings?.desktopAlertOn ?? true,
    moneyMgmtStyleDemo:settings?.moneyMgmtStyleDemo ?? 'FIXED',moneyMgmtStyleReal:settings?.moneyMgmtStyleReal ?? 'FIXED',
    amMultiplierDemo:Math.min(1.5,Math.max(1.2,settings?.amMultiplierDemo ?? 1.3)),amMultiplierReal:Math.min(1.5,Math.max(1.2,settings?.amMultiplierReal ?? 1.3)),
    amCeilingPctDemo:settings?.amCeilingPctDemo ?? 20,amCeilingPctReal:settings?.amCeilingPctReal ?? 20,
    amProfitTargetPctDemo:settings?.amProfitTargetPctDemo ?? 10,amProfitTargetPctReal:settings?.amProfitTargetPctReal ?? 10,
    amLossTargetPctDemo:settings?.amLossTargetPctDemo ?? 10,amLossTargetPctReal:settings?.amLossTargetPctReal ?? 10,
    amMaxEscalationsDemo:settings?.amMaxEscalationsDemo ?? 1,amMaxEscalationsReal:settings?.amMaxEscalationsReal ?? 1,
    amMaxTradesDemo:settings?.amMaxTradesDemo ?? 8,amMaxTradesReal:settings?.amMaxTradesReal ?? 8,
    plMaxEscalationsDemo:settings?.plMaxEscalationsDemo ?? 1,plMaxEscalationsReal:settings?.plMaxEscalationsReal ?? 1,
    plCeilingPctDemo:settings?.plCeilingPctDemo ?? 20,plCeilingPctReal:settings?.plCeilingPctReal ?? 20,
    plProfitTargetPctDemo:settings?.plProfitTargetPctDemo ?? 10,plProfitTargetPctReal:settings?.plProfitTargetPctReal ?? 10,
    plLossTargetPctDemo:settings?.plLossTargetPctDemo ?? 10,plLossTargetPctReal:settings?.plLossTargetPctReal ?? 10,
    plMaxTradesDemo:settings?.plMaxTradesDemo ?? 8,plMaxTradesReal:settings?.plMaxTradesReal ?? 8,
    riskCalcBalance:'',riskCalcTargetPct:'',riskCalcTradesPerSession:''});
  const[saved,setSaved]=useState(false);
  const[notifPerm,setNotifPerm]=useState(typeof Notification!=='undefined'?Notification.permission:'unsupported');
  const[sessionWarn,setSessionWarn]=useState(false);
  const[includeBalances,setIncludeBalances]=useState(false);
  const[confirmReset,setConfirmReset]=useState(null); // {scope,label,body}
  const[resetDone,setResetDone]=useState(false);
  const[newStratName,setNewStratName]=useState('');
  const[newStratDesc,setNewStratDesc]=useState('');
  // Shared, not per-mode: a content-category switch (which style's fields am
  // I configuring), not a mode switch.
  // Starts synced to whichever style is currently active for this mode —
  // the Active Style toggle and this tab selector move together from then
  // on (each click updates both), so they can never end up disagreeing.
  const[mmTab,setMmTab]=useState(()=>f[`moneyMgmtStyle${modeKey}`]||'FIXED');
  const[calcExpanded,setCalcExpanded]=useState(false);
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const activeSession=ss?getActive(ss):null;

  async function applyMoneyMgmtStyle(styleVal){
    if(activeSession)setSessionWarn(true);
    const key=mode==='REAL'?'moneyMgmtStyleReal':'moneyMgmtStyleDemo';
    const updated={...f,[key]:styleVal};
    sf(updated);
    await saveSettings({...updated,startingBalanceDemo:parseFloat(updated.startingBalanceDemo||0),startingBalanceReal:parseFloat(updated.startingBalanceReal||0)});
  }

  // Suggested risk % — display-only, never writes to riskPercent or any other
  // setting. Reuses the same win-rate math Analytics uses (wins/total*100).
  // Drives off the same global `mode` as the rest of the page now — no
  // independent calculator-only toggle; its existing manual-override fields
  // (balance/target/trades) already cover exploring "what if I were on the
  // other mode" without needing a dedicated switch.
  const calcDone=(trades||[]).filter(t=>getTradeMode(t)===mode&&t.outcome!=='PENDING');
  const calcWinRate=calcDone.length?(calcDone.filter(t=>t.outcome==='WIN').length/calcDone.length)*100:65;
  const calcStyle=f[`moneyMgmtStyle${modeKey}`]||'FIXED';
  const calcIsAM=isEscalatingStyle(calcStyle); // name kept for minimal diff — now covers both escalating styles
  const calcLiveProfitTargetPct=()=>calcStyle==='PROFIT_LOCK'?getPlProfitTargetPctForMode(settings,mode):getAmProfitTargetPctForMode(settings,mode);
  const calcLiveMaxTrades=()=>calcStyle==='PROFIT_LOCK'?getPlMaxTradesForMode(settings,mode):getAmMaxTradesForMode(settings,mode);
  const calcTargetPct=parseFloat(f.riskCalcTargetPct)||(calcIsAM?calcLiveProfitTargetPct():10);
  const calcTradesN=Math.max(1,parseFloat(f.riskCalcTradesPerSession)||(calcIsAM?calcLiveMaxTrades():6));
  // Auto-populates from the real, live values every time the global mode
  // changes (including the initial mount) — Balance always has a live
  // equivalent; Session profit target % and Trades per session only do
  // under Anti-Martingale/Profit Lock (Fixed Risk % has no direct equivalent
  // for either, so those two are left as whatever's already there — the
  // existing manual default/estimate — when Fixed is active). Typing over
  // any field afterward is a hypothetical override that sticks until the
  // global mode changes or you hit Reset.
  useEffect(()=>{
    const liveBalance=balForMode(settings,trades,wds,mode);
    sf(prev=>({...prev,riskCalcBalance:String(Math.round(liveBalance*100)/100),
      ...(calcIsAM?{
        riskCalcTargetPct:String(calcLiveProfitTargetPct()),
        riskCalcTradesPerSession:String(calcLiveMaxTrades()),
      }:{})}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mode]);
  function resetCalcToLive(){
    const liveBalance=balForMode(settings,trades,wds,mode);
    set('riskCalcBalance',String(Math.round(liveBalance*100)/100));
    if(calcIsAM){
      set('riskCalcTargetPct',String(calcLiveProfitTargetPct()));
      set('riskCalcTradesPerSession',String(calcLiveMaxTrades()));
    }
  }
  // Simple heuristic, not a full Kelly/Monte-Carlo model: edge is win rate
  // minus loss rate (floored so a coin-flip-or-worse win rate doesn't blow
  // up the division), and suggested risk scales the target down by how many
  // trades/session and how much edge you actually have — more trades or more
  // edge per session both mean less risk needed on any single one.
  const calcEdge=Math.max(0.05,(calcWinRate-(100-calcWinRate))/100);
  const calcSuggestedRisk=Math.min(20,Math.max(0.5,+(calcTargetPct/(calcTradesN*calcEdge)).toFixed(1)));
  // riskPercent is global (not per-mode), so "current setting" is the same
  // number regardless of which mode the calculator's toggle is on.
  const calcCurrentPct=parseFloat(f.riskPercent)||5;
  const calcBalanceNum=parseFloat(f.riskCalcBalance)||0;
  const calcClose=Math.abs(calcCurrentPct-calcSuggestedRisk)<=0.5;
  function applySuggestedRisk(){set('riskPercent',Math.max(1,Math.min(20,calcSuggestedRisk)));}

  async function save(){await saveSettings({...f,startingBalanceDemo:parseFloat(f.startingBalanceDemo||0),startingBalanceReal:parseFloat(f.startingBalanceReal||0)});setSaved(true);setTimeout(()=>setSaved(false),2000);}

  function requestDesktopAlerts(){
    if(typeof Notification==='undefined')return;
    Notification.requestPermission().then(setNotifPerm);
  }
  function previewAlert(){
    const el=new Audio(ALERT_CHIME_SRC);
    el.volume=f.alertVolume??ALERT_VOLUME_DEFAULT;
    el.play().catch(()=>{});
  }

  function askReset(scope){
    const modes=scope==='BOTH'?['DEMO','REAL']:[scope];
    const label=scope==='BOTH'?'Demo and Real':(scope==='REAL'?'Real':'Demo');
    const extra=includeBalances?', and reset the starting balance to $0'+(modes.includes('REAL')?' (withdrawal history for Real will also be cleared)':''):'';
    setConfirmReset({scope,label,body:`This permanently deletes all ${label} trades and session history${extra}. This cannot be undone.`});
  }
  async function confirmResetNow(){
    const{scope}=confirmReset;
    setConfirmReset(null);
    await resetAccount(scope,includeBalances);
    setResetDone(true);
    setTimeout(()=>setResetDone(false),3000);
  }

  async function applyStyle(id){
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

  // Never affects a session already in progress — enforcement for a running
  // session is decided by that session's own strictAtStart (stamped at
  // creation), not by re-reading this setting live. Toggling OFF while a
  // strict-mode session is currently locked only changes what the NEXT
  // session (for this mode) will do.
  async function applyStrictLocking(on){
    const key=mode==='REAL'?'strictLockingReal':'strictLockingDemo';
    const activeForMode=ss?getActive(ss,mode):null;
    if(!on&&activeForMode?.strictAtStart){
      alert('This change will apply to your next session. Your current lock remains in effect.');
    }
    const updated={...f,[key]:on};
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
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Settings</div>
        {/* Same badge treatment as the sidebar's own mode indicator — Real
            stays visually loud on purpose, same reasoning as everywhere else
            in the app: it's real money. */}
        <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',padding:'3px 9px',borderRadius:999,background:mode==='REAL'?'var(--bg-danger)':'var(--bg-accent)',color:mode==='REAL'?'var(--text-danger)':'var(--text-accent)',border:`1px solid ${mode==='REAL'?'var(--border-danger)':'var(--border-accent)'}`}}>
          Configuring: {modeKey} account
        </span>
      </div>

      {sessionWarn&&(
        <Alert type="warn" title="Active session in progress" body="This change will apply starting from your next session. Your current session continues under its original rules."/>
      )}

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>AI provider</div>
        {!f.apiKey&&!f.groqApiKey&&(
          <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>Not set up yet — only needed if you want to use the Zone Analyzer's AI grading. Everything else in the app works without one.</p>
        )}
        <div style={{display:'flex',gap:8,marginBottom:14,marginTop:f.apiKey||f.groqApiKey?8:0}}>
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
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Free key at <a href="https://console.groq.com/keys" style={{color:'var(--text-accent)'}}>console.groq.com</a> · Model: qwen3.6-27b</div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Account</div>
        <div><label style={lbl}>{modeKey} starting balance ($)</label><input style={inp} type="number" min="1" value={f[`startingBalance${modeKey}`]} onChange={e=>set(`startingBalance${modeKey}`,e.target.value)}/></div>
        <div style={{marginTop:10}}><label style={lbl}>Broker min withdrawal ($)</label><input style={inp} type="number" min="1" value={f.brokerMin} onChange={e=>set('brokerMin',parseFloat(e.target.value))}/></div>
      </div>

      {/* ── Money management ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Money management</div>
        <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:12}}>
          Switchable any time — takes effect from your next trade. Anti-Martingale escalates the stake after a win (up to your configured max escalations, capped at a % of balance); Profit Lock stakes only the profit just banked, never original capital. Both reset to base on any loss and end their own session on a profit target, loss target, or max trades reached, instead of the Trade Management rules in the Fixed Risk % tab, so that selector is disabled for whichever mode uses either.
        </p>

        {/* Active style — a compact segmented switch, deliberately NOT styled
            like the tab headers below: this picks what's actually live for
            {modeKey}. Synced two-way with the tab selector below — picking a
            style here also switches the tab to it, and picking a tab down
            there also makes that style active, so the two can never disagree. */}
        <div style={{background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px',marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>Active style</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <span style={{fontSize:12,color:'var(--text-secondary)'}}>{modeKey} is using</span>
            <div style={{display:'flex',gap:2,background:'var(--surface-0)',border:'1px solid var(--border)',borderRadius:999,padding:2}}>
              {MM_STYLES.map(o=>(
                <button key={o.id} type="button" onClick={()=>{applyMoneyMgmtStyle(o.id);setMmTab(o.id);}}
                  style={{padding:'4px 10px',fontSize:11,fontWeight:600,borderRadius:999,border:'none',cursor:'pointer',
                    background:f[`moneyMgmtStyle${modeKey}`]===o.id?'var(--fill-accent)':'transparent',
                    color:f[`moneyMgmtStyle${modeKey}`]===o.id?'#fff':'var(--text-muted)'}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk sizing — shared across all three styles, not Fixed-Risk-%-
            specific: amBaseStake() (the base stake formula every style
            escalates or resets to) reads riskPercent/riskAmount directly,
            regardless of which Money Management style is active. Lives
            above the tabs so it's always visible, never hidden by tab
            selection. */}
        <div style={{background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px',marginBottom:16}}>
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

        {/* Tab content — a distinct bordered/elevated card, tabs as its header
            (underline-active-tab pattern), so it reads as one unit clearly
            separate from the Active style switch above and the calculator
            below. Tabs are shared (not per-mode) and, per the sync note
            above, selecting one also applies it as {modeKey}'s active style —
            the fields inside each tab are mode-filtered to {modeKey} like the
            rest of the page. */}
        <div style={{border:'1px solid var(--border)',borderRadius:'var(--radius)',background:'var(--surface-0)',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'1px solid var(--border)'}}>
            {MM_STYLES.map(t=>(
              <button key={t.id} type="button" onClick={()=>{setMmTab(t.id);applyMoneyMgmtStyle(t.id);}}
                style={{flex:1,padding:'10px 12px',fontSize:13,fontWeight:600,border:'none',cursor:'pointer',
                  background:mmTab===t.id?'var(--bg-accent)':'transparent',
                  color:mmTab===t.id?'var(--text-accent)':'var(--text-muted)',
                  borderBottom:mmTab===t.id?'2px solid var(--fill-accent)':'2px solid transparent',
                  marginBottom:-1}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:14}}>
          {mmTab==='FIXED'?(
            <div>
              <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:12}}>
                Risk per trade is set once above and shared by all three styles — this tab is just Fixed Risk %'s own session-ending rules: which Trade Management style governs the countdown/stop conditions, and how many sessions you run per day.
              </p>
              <div>
                <label style={lbl}>Trade management style</label>
                <div style={isEscalatingStyle(f[`moneyMgmtStyle${modeKey}`])?{opacity:0.45,pointerEvents:'none'}:undefined}>
                  {isEscalatingStyle(f[`moneyMgmtStyle${modeKey}`])&&<p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>Disabled — {modeKey} is on {f[`moneyMgmtStyle${modeKey}`]==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'} money management, which ends sessions on its own profit/loss target instead.</p>}
                  {STYLES.map(st=>(
                    <div key={st.id} onClick={()=>applyStyle(st.id)} style={{...card,cursor:'pointer',marginBottom:8,border:f[`tradeStyle${modeKey}`]===st.id?'1.5px solid var(--border-accent)':'1px solid var(--border)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                        <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)'}}>{st.name}</div>
                        {f[`tradeStyle${modeKey}`]===st.id&&<i className="ti ti-circle-check" style={{color:'var(--text-accent)',fontSize:16}} aria-hidden="true"/>}
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
                <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Used for money-management projections only — sessions no longer gate trade logging.</p>
              </div>
            </div>
          ):mmTab==='ANTI_MARTINGALE'?(
            <div style={{padding:10,borderRadius:'var(--radius)',border:'1px solid var(--border)',background:'var(--surface-0)'}}>
              <label style={lbl}>Multiplier: {(f[`amMultiplier${modeKey}`]??1.3).toFixed(1)}×</label>
              <input type="range" min="1.2" max="1.5" step="0.1" value={f[`amMultiplier${modeKey}`]??1.3} onChange={e=>set(`amMultiplier${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Ceiling: {f[`amCeilingPct${modeKey}`]??20}% of balance</label>
              <input type="range" min="5" max="50" step="1" value={f[`amCeilingPct${modeKey}`]??20} onChange={e=>set(`amCeilingPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Max consecutive escalations</label>
              <div style={{display:'flex',gap:8}}>
                {[1,2].map(n=>(
                  <button key={n} type="button" style={{...btn((f[`amMaxEscalations${modeKey}`]??1)===n?'pri':'def'),flex:1,fontSize:12}} onClick={()=>set(`amMaxEscalations${modeKey}`,n)}>{n}</button>
                ))}
              </div>
              <label style={{...lbl,marginTop:8}}>Profit target: {f[`amProfitTargetPct${modeKey}`]??10}% of session start balance</label>
              <input type="range" min="1" max="50" step="1" value={f[`amProfitTargetPct${modeKey}`]??10} onChange={e=>set(`amProfitTargetPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Loss target: {f[`amLossTargetPct${modeKey}`]??10}% of session start balance</label>
              <input type="range" min="1" max="50" step="1" value={f[`amLossTargetPct${modeKey}`]??10} onChange={e=>set(`amLossTargetPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Max trades per session: {f[`amMaxTrades${modeKey}`]??8}</label>
              <input type="range" min="3" max="20" step="1" value={f[`amMaxTrades${modeKey}`]??8} onChange={e=>set(`amMaxTrades${modeKey}`,parseInt(e.target.value,10))} style={{width:'100%'}}/>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Session also ends the moment this trade count is reached, regardless of P&L — a separate safety net from the profit/loss targets above.</p>
            </div>
          ):(
            <div style={{padding:10,borderRadius:'var(--radius)',border:'1px solid var(--border)',background:'var(--surface-0)'}}>
              <label style={lbl}>Ceiling: {f[`plCeilingPct${modeKey}`]??20}% of balance</label>
              <input type="range" min="5" max="50" step="1" value={f[`plCeilingPct${modeKey}`]??20} onChange={e=>set(`plCeilingPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Max consecutive escalations</label>
              <div style={{display:'flex',gap:8}}>
                {[1,2].map(n=>(
                  <button key={n} type="button" style={{...btn((f[`plMaxEscalations${modeKey}`]??1)===n?'pri':'def'),flex:1,fontSize:12}} onClick={()=>set(`plMaxEscalations${modeKey}`,n)}>{n}</button>
                ))}
              </div>
              <label style={{...lbl,marginTop:8}}>Profit target: {f[`plProfitTargetPct${modeKey}`]??10}% of session start balance</label>
              <input type="range" min="1" max="50" step="1" value={f[`plProfitTargetPct${modeKey}`]??10} onChange={e=>set(`plProfitTargetPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Loss target: {f[`plLossTargetPct${modeKey}`]??10}% of session start balance</label>
              <input type="range" min="1" max="50" step="1" value={f[`plLossTargetPct${modeKey}`]??10} onChange={e=>set(`plLossTargetPct${modeKey}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
              <label style={{...lbl,marginTop:8}}>Max trades per session: {f[`plMaxTrades${modeKey}`]??8}</label>
              <input type="range" min="3" max="20" step="1" value={f[`plMaxTrades${modeKey}`]??8} onChange={e=>set(`plMaxTrades${modeKey}`,parseInt(e.target.value,10))} style={{width:'100%'}}/>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>No multiplier — growth comes from actual trade profit, not a configured rate. Session also ends the moment this trade count is reached, regardless of P&L.</p>
            </div>
          )}
          </div>
        </div>

        {/* Suggested risk % — collapsed by default: a secondary, optional
            reference tool that shouldn't compete for attention with the
            primary settings above on every page load. Computes and displays
            only, never writes to riskPercent or any setting on its own. */}
        <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid var(--border)'}}>
          <button type="button" onClick={()=>setCalcExpanded(v=>!v)}
            style={{display:'flex',alignItems:'center',gap:6,width:'100%',background:'none',border:'none',cursor:'pointer',padding:0,fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>
            <i className={`ti ti-chevron-${calcExpanded?'down':'right'}`} aria-hidden="true" style={{fontSize:14,color:'var(--text-muted)'}}/>
            Suggested risk % calculator
            <span style={{fontSize:11,fontWeight:400,color:'var(--text-muted)'}}>— optional reference tool</span>
          </button>
          {calcExpanded&&(
          <div style={{marginTop:10}}>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
            <button type="button" onClick={resetCalcToLive} style={{background:'none',border:'none',cursor:'pointer',fontSize:11,color:'var(--text-accent)',flexShrink:0,padding:'0 4px'}}>Reset to my current settings</button>
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:-4,marginBottom:10}}>
            Auto-filled from your real {modeKey} balance{calcIsAM?', profit target, and max trades':''} — edit any field to explore a hypothetical instead. Switch the account mode in the sidebar to calculate for the other account.
          </p>
          <div className="grid-2">
            <div><label style={lbl}>Balance ($)</label><input style={inp} type="number" min="0" value={f.riskCalcBalance} onChange={e=>set('riskCalcBalance',e.target.value)}/></div>
            <div><label style={lbl}>Session profit target (%){!calcIsAM&&' — manual estimate, no live equivalent under Fixed Risk %'}</label><input style={inp} type="number" min="0.1" step="0.5" value={f.riskCalcTargetPct} onChange={e=>set('riskCalcTargetPct',e.target.value)}/></div>
          </div>
          <div style={{marginTop:8}}><label style={lbl}>Trades per session{!calcIsAM?' (est. — manual, no live equivalent under Fixed Risk %)':''}</label><input style={inp} type="number" min="1" step="1" value={f.riskCalcTradesPerSession} onChange={e=>set('riskCalcTradesPerSession',e.target.value)}/></div>
          <div style={{marginTop:10,padding:10,borderRadius:'var(--radius)',background:calcClose?'var(--bg-success)':'var(--bg-accent)',fontSize:13,color:calcClose?'var(--text-success)':'var(--text-accent)'}}>
            {calcClose?(
              <>
                Your current setting (<strong>{calcCurrentPct}%</strong>) is already close to the suggested <strong>{calcSuggestedRisk}%</strong>
                {calcBalanceNum>0&&<> (~{f$(calcBalanceNum*(calcCurrentPct/100))} vs ~{f$(calcBalanceNum*(calcSuggestedRisk/100))} per trade)</>}.
                {' '}<button style={{...btn(),fontSize:11,padding:'3px 8px'}} onClick={applySuggestedRisk}>Apply anyway</button>
              </>
            ):(
              <>
                Your current setting: <strong>{calcCurrentPct}%</strong>{calcBalanceNum>0&&<> (~{f$(calcBalanceNum*(calcCurrentPct/100))}/trade at {f$(calcBalanceNum)})</>}<br/>
                Suggested: <strong>{calcSuggestedRisk}%</strong>{calcBalanceNum>0&&<> (~{f$(calcBalanceNum*(calcSuggestedRisk/100))}/trade)</>}
                {' '}<button style={{...btn('pri'),fontSize:11,padding:'3px 8px'}} onClick={applySuggestedRisk}>Apply this suggestion</button>
              </>
            )}
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>
            To reach {calcTargetPct}% target from ~{calcTradesN} trades/session at {calcWinRate.toFixed(0)}% win rate ({calcDone.length} {modeKey} trade{calcDone.length===1?'':'s'} on record, defaults to 65% with none), ~{calcSuggestedRisk}% risk per trade keeps drawdown risk moderate. This is a simple heuristic, not a guarantee.
            {calcIsAM&&<> {modeKey} is on {calcStyle==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'} — this sets the <em>base</em> stake size only (what a loss always resets to); it has no effect on the profit/loss session-ending targets in the section above.</>}
          </p>
          </div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Session rules</div>

        {isEscalatingStyle(f[`moneyMgmtStyle${modeKey}`])?(
          <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>
            Strict Session Locking and per-style session duration only apply to Trade Management (Fixed Risk %) sessions —
            {' '}{modeKey} is on {f[`moneyMgmtStyle${modeKey}`]==='PROFIT_LOCK'?'Profit Lock':'Anti-Martingale'}, which ends its own
            sessions on profit target, loss target, max trades, or the fixed 60-minute limit instead.
          </p>
        ):(<>
        {/* ── Strict Session Locking ──────────────────────────────────── */}
        <div style={{marginTop:14}}>
          <label style={lbl}>Strict Session Locking</label>
          <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>
            Off (default): reaching a stop/take-profit condition only warns you — you can still log the trade, marked off-plan.
            On: reaching it blocks the normal Journal/Analyzer flow for that session, same as the original hard lock. A separate
            "Log an off-plan trade anyway" action still lets you record a trade taken outside the lock.
          </p>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,marginBottom:6}}>
            <input type="checkbox" checked={!!f[`strictLocking${modeKey}`]} onChange={e=>applyStrictLocking(e.target.checked)}/>
            {modeKey} account
          </label>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
            Changing this never affects a session already in progress — it only takes effect for your next session. The daily
            loss circuit breaker is unaffected either way; it always blocks new trades once hit.
          </p>
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
        </>)}


        {/* ── Session-lock alert (shared — plays on ANY session end, Fixed
            Risk % lock or Anti-Martingale/Profit Lock's own natural end,
            so this stays visible regardless of active style). ─────────── */}
        <div style={{marginTop:14}}>
          <label style={{...lbl,display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={f.soundAlertOn!==false} onChange={e=>set('soundAlertOn',e.target.checked)}/>
            Session-lock alert sound
          </label>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6,opacity:f.soundAlertOn===false?0.5:1}}>
            <span style={{fontSize:11,color:'var(--text-muted)',flexShrink:0,width:38}}>{Math.round((f.alertVolume??ALERT_VOLUME_DEFAULT)*100)}%</span>
            <input type="range" min={0} max={1} step="0.05" value={f.alertVolume??ALERT_VOLUME_DEFAULT} disabled={f.soundAlertOn===false}
              onChange={e=>set('alertVolume',parseFloat(e.target.value))}
              style={{width:'100%'}}/>
            <button type="button" style={btn()} onClick={previewAlert} disabled={f.soundAlertOn===false} title="Preview the alert sound">Test</button>
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
            A short chime plays the instant a session locks (time expired, stop loss, take profit, or max trades) — separate from the background music volume.
          </p>
          <div style={{marginTop:8}}>
            {notifPerm==='granted'?(
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
                <input type="checkbox" checked={f.desktopAlertOn!==false} onChange={e=>set('desktopAlertOn',e.target.checked)}/>
                <Bell size={14}/>Desktop alerts on session lock
              </label>
            ):notifPerm==='denied'?(
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-muted)'}}><BellOff size={14}/>Desktop alerts blocked — allow notifications for this site in your browser settings.</div>
            ):notifPerm==='unsupported'?null:(
              <button type="button" style={{...btn(),gap:6}} onClick={requestDesktopAlerts}><Bell size={14}/>Enable desktop alerts</button>
            )}
            <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
              If a session locks while this tab is in the background, a desktop notification backs up the sound in case your browser blocks background-tab audio.
              {notifPerm==='granted'&&' Turning this off only stops alerts here in the app — your browser\'s own notification permission stays granted, since only the browser itself can revoke that.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Manage strategies ───────────────────────────────────────── */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Manage strategies</div>
        <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>Strategies tag every trade in the Journal. Zone (S&D) and Trend/Pattern are built in and can't be deleted; add your own below.</p>
        {(strategies||[]).map(s=>(
          <StrategyRow key={s.id} strategy={s} trades={trades} updateStrategy={updateStrategy} deleteStrategy={deleteStrategy}/>
        ))}
        <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
          <label style={lbl}>Add strategy</label>
          <div className="grid-2">
            <input style={inp} placeholder="Name" value={newStratName} onChange={e=>setNewStratName(e.target.value)}/>
            <input style={inp} placeholder="Description (optional)" value={newStratDesc} onChange={e=>setNewStratDesc(e.target.value)}/>
          </div>
          <button style={{...btn('pri'),marginTop:8}} disabled={!newStratName.trim()} onClick={async()=>{await addStrategy(newStratName,newStratDesc);setNewStratName('');setNewStratDesc('');}}>+ Add strategy</button>
        </div>
      </div>

      <div style={{...card,background:'var(--bg-danger)',borderColor:'var(--border-danger)',marginTop:16}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:10,color:'var(--text-danger)'}}>Reset account data</div>
        <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
          Choose a scope below, then decide whether you also want to reset starting balances. Real reset with balances also clears withdrawal history.
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
          <button style={{...btn('dan'),flex:1}} onClick={()=>askReset('DEMO')}>Reset Demo{includeBalances?' + balances':''}</button>
          <button style={{...btn('dan'),flex:1}} onClick={()=>askReset('REAL')}>Reset Real{includeBalances?' + balances':''}</button>
          <button style={{...btn('dan'),flex:1}} onClick={()=>askReset('BOTH')}>Reset All{includeBalances?' + balances':''}</button>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
          <input type="checkbox" checked={includeBalances} onChange={e=>setIncludeBalances(e.target.checked)} />
          Also reset starting balances and clear Real withdrawal history
        </label>
        {resetDone&&<div style={{fontSize:12,color:'var(--text-success)',marginTop:10,display:'flex',alignItems:'center',gap:4}}><i className="ti ti-check" aria-hidden="true"/>Account reset.</div>}
      </div>

      {confirmReset&&(
        <ConfirmDialog
          title={`Reset ${confirmReset.label} data?`}
          body={confirmReset.body}
          confirmLabel="Reset"
          onCancel={()=>setConfirmReset(null)}
          onConfirm={confirmResetNow}
        />
      )}

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
    {icon:ScanSearch,title:'AI Setup Validator',desc:'Upload a chart screenshot and AI grades it against the matching rule-based checklist — supply/demand zones against 10 strict structural gates, or one of 7 price-action strategies against its own — before you enter a trade.'},
    {icon:BookOpen,title:'Trade Journal',desc:'Log every trade with screenshots, notes, trade grades, and outcomes. Track your execution quality over time.'},
    {icon:BarChart3,title:'Performance Analytics',desc:'Win rate with a real confidence interval, by trade grade, strategy, pair, and account mode — plus an auto-generated weekly/monthly Review digest, no manual entry.'},
    {icon:Target,title:'A Full Strategy Curriculum',desc:'7 rule-based price-action strategies plus Zone (S&D) and Trend/Pattern, built in from day one — or define your own. Tag every trade and break down win rate and P&L by strategy in Analytics.'},
    {icon:Wallet,title:'Money Management',desc:'Choose Fixed Risk % (a percent of balance or a fixed dollar amount, overridable per trade), Anti-Martingale (stakes escalate on a win up to a configurable cap, reset on any loss), or Profit Lock (stakes only the profit just banked, never original capital) — each ends its own session on a profit target, loss target, or max trades, independently per Demo/Real account. Milestone-based withdrawal tracking and growth projection included.'},
    {icon:Zap,title:'Quick Log',desc:'A spreadsheet-style table built for Anti-Martingale and Profit Lock’s pace — mark each trade Win or Loss and watch balance, session P&L, and the next suggested stake update instantly, row by row.'},
    {icon:ClipboardList,title:'Trading Plan',desc:'Your rules, your style. A zone-selection checklist, pre-trade checklist, and discipline guidelines keep you consistent and away from emotional overtrading.'},
    {icon:Timer,title:'Session Timer',desc:'Each trade style carries its own adjustable session duration, with pause and auto-resume. A session ends the moment time runs out or your trade-limit rules trigger — whichever comes first. Skipping a session with no qualifying setup gets a shorter cooldown instead of the full gap.'},
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
    {n:'01',icon:ScanSearch,title:'Analyze',desc:'Upload your chart. AI identifies whether it’s a supply/demand zone or a price-action setup, grades it against the matching rule-based checklist, and returns a grade.'},
    {n:'02',icon:CircleCheck,title:'Confirm',desc:'Watch the live 10-second chart yourself and confirm a Tier 1 trigger before entering — this step is on you, not tracked in-app.'},
    {n:'03',icon:BookOpen,title:'Journal',desc:'Log the trade with one click. Screenshots, notes, and analysis data carry over automatically.'},
    {n:'04',icon:BarChart3,title:'Improve',desc:'Review your analytics. See which grades, pairs, and styles produce the best results.'},
  ];

  return(
    <div className="ld-wrap">
      <div className="ld-motion-bg" aria-hidden="true">
        <div className="ld-motion-glow"/>
        <div className="ld-motion-grid"/>
        <div className="ld-motion-noise"/>
      </div>
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
          <div className="ld-badge">AI-Powered Trading Curriculum</div>
          <h1 className="ld-hero-title">Learn a Proven Strategy<br/>with <span className="ld-gradient-text">Precision</span></h1>
          <p className="ld-hero-sub">A 7-strategy price-action system plus supply/demand zones — validate every setup with AI, journal every trade, manage risk intelligently, and track your progress toward consistency, all in one workspace.</p>
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
            <p className="ld-section-sub">Nine integrated modules that work together to keep you consistent, data-driven, and in control.</p>
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
              <h2 className="ld-section-title" style={{textAlign:'left'}}>Rule-Based Grading, Not Vibes</h2>
              <p className="ld-section-sub" style={{textAlign:'left',maxWidth:480}}>A supply/demand zone is evaluated against 10 strict binary gates — 4 of them hard filters that instantly invalidate it if any one fails. Any of the other 6 price-action strategies gets its own 5-item checklist built the same way. No curves, no partial credit — a setup either meets the standard or it doesn't. Shown below: the 10-gate zone system.</p>
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
              {val:'7',label:'Price Action Strategies'},
              {val:'10',label:'Zone Validation Gates'},
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
      :await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/confirmed`}});
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

// ── Email confirmation landing (/auth/confirmed) ────────────────────────────
// Supabase's confirmation link redirects here (via emailRedirectTo at signUp
// time + this path added to the project's Redirect URLs allow-list — see
// README). detectSessionInUrl (default on) means the session from the
// link's token is already being established by the time this mounts;
// getSession() awaits that in-flight work rather than racing it. A failed
// or expired link comes back as ?error=...&error_description=... in the
// URL (hash or query, depending on flow) — checked first so that case shows
// its own message instead of a misleading generic "not confirmed" state.
function EmailConfirmed({onLogin}){
  const[status,setStatus]=useState('checking'); // 'checking'|'success'|'error'
  const[errMsg,setErrMsg]=useState('');

  useEffect(()=>{
    const raw=window.location.hash.replace(/^#/,'')||window.location.search.replace(/^\?/,'');
    const params=new URLSearchParams(raw);
    const urlError=params.get('error_description')||params.get('error');
    if(urlError){
      setErrMsg(decodeURIComponent(urlError.replace(/\+/g,' ')));
      setStatus('error');
      return;
    }
    let cancelled=false;
    supabase.auth.getSession().then(({data:{session}})=>{
      if(cancelled)return;
      setStatus(session?'success':'error');
    }).catch(()=>{if(!cancelled)setStatus('error');});
    return()=>{cancelled=true;};
  },[]);

  return(
    <div className="login-wrap">
      <div className="login-orb login-orb-1"/>
      <div className="login-orb login-orb-2"/>
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrap" style={{background:status==='error'?'var(--fill-danger)':undefined}}>
            {status==='checking'?<Sparkles size={28} strokeWidth={2} color="#fff"/>
              :status==='success'?<CircleCheck size={28} strokeWidth={2} color="#fff"/>
              :<TriangleAlert size={28} strokeWidth={2} color="#fff"/>}
          </div>
          <div className="login-title">TheGiftedMan Trading Tool</div>
          <div className="login-subtitle">
            {status==='checking'&&'Confirming your email…'}
            {status==='success'&&'Your email has been confirmed'}
            {status==='error'&&"This confirmation link isn't valid"}
          </div>
        </div>

        {status==='success'&&<div className="login-success">You're all set — log in to start using the app.</div>}
        {status==='error'&&<div className="login-error">{errMsg||'This link may have expired or already been used. Try logging in — if your email still shows unconfirmed, sign up again to get a new link.'}</div>}

        {status!=='checking'&&<button className="login-btn" type="button" onClick={onLogin}>Log in</button>}
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
  const[strategies,setStrategies]=useState([]);
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
    if(!userId){setSettings(null);setTrades([]);setAnalyses([]);setWds([]);setStrategies([]);setSS(null);setLoading(false);prevUserId.current=null;return;}
    if(prevUserId.current===userId)return;
    prevUserId.current=userId;
    setLoading(true);
    (async()=>{
      await maybeMigrateLocal(userId);
      // Every user gets their own 'zone-sd'/'trend-pattern' rows on first
      // load — a no-op after the first time (both ids already exist).
      await ensureBuiltinStrategies(userId);
      const[{data:s},{data:t},{data:sessRows},{data:w},{data:a},{data:strat}]=await Promise.all([
        supabase.from('settings').select('*').eq('user_id',userId).maybeSingle(),
        supabase.from('trades').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
        supabase.from('sessions').select('*').eq('user_id',userId).eq('date',tod()),
        supabase.from('withdrawals').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
        supabase.from('zone_analyses').select('*').eq('user_id',userId).order('timestamp',{ascending:false}),
        supabase.from('strategies').select('*').eq('user_id',userId).order('created_at',{ascending:true}),
      ]);
      const sObj=s?fromSettingsRow(s):null;
      let normalized=sObj&&{
        ...sObj,
        tradeStyleDemo:sObj.tradeStyleDemo ?? sObj.tradeStyle ?? 1,
        tradeStyleReal:sObj.tradeStyleReal ?? sObj.tradeStyle ?? 1,
        startingBalanceDemo:parseFloat(sObj.startingBalanceDemo||0),
        startingBalanceReal:parseFloat(sObj.startingBalanceReal||0),
      };
      // One-time migration: the AM multiplier's max was tightened from 3x to
      // 1.5x (peak exposure 2.25x-3.375x base at the 1-or-2 escalations cap,
      // down from up to 9x). A value saved before this change could still be
      // sitting above the new max, which the slider can no longer represent
      // — clamp it down and persist immediately rather than leave it stuck.
      // Self-resolving: once clamped, this condition is false on every
      // future load, so the notice never repeats.
      if(normalized&&(normalized.amMultiplierDemo>1.5||normalized.amMultiplierReal>1.5)){
        normalized={...normalized,
          amMultiplierDemo:Math.min(1.5,normalized.amMultiplierDemo??1.3),
          amMultiplierReal:Math.min(1.5,normalized.amMultiplierReal??1.3)};
        await supabase.from('settings').upsert(toSettingsRow(userId,normalized));
        alert('Your Anti-Martingale multiplier was reduced to 1.5x, the new maximum.');
      }
      setSettings(normalized||null);
      const tradesObj=(t||[]).map(fromTradeRow);
      const analysesObj=(a||[]).map(fromAnalysisRow);
      setTrades(await Promise.all(tradesObj.map(async tr=>({...tr,screenshots:await Promise.all((tr.screenshots||[]).map(signShot))}))));
      setAnalyses(await Promise.all(analysesObj.map(async an=>({...an,screenshot:await signShot(an.screenshot)}))));
      setWds((w||[]).map(fromWdRow));
      setStrategies((strat||[]).map(fromStrategyRow));
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

  const addStrategy=async(name,description)=>{
    const s={id:uid(),name:(name||'').trim(),description:(description||'').trim()||null,isBuiltin:false,archived:false,createdAt:Date.now()};
    if(!s.name)return null;
    setStrategies(prev=>[...prev,s]);
    if(authUser)await supabase.from('strategies').insert(toStrategyRow(authUser.id,s));
    return s;
  };
  const updateStrategy=async s=>{
    setStrategies(prev=>prev.map(x=>x.id===s.id?s:x));
    if(authUser)await supabase.from('strategies').upsert(toStrategyRow(authUser.id,s));
  };
  // Hard delete only when nothing references it; otherwise archive (soft
  // delete) so past trades can still resolve their strategy name. Builtins
  // are never deletable — enforced here too, not just by hiding the button.
  const deleteStrategy=async strat=>{
    if(strat.isBuiltin)return;
    const inUse=trades.some(t=>(t.strategyId||'zone-sd')===strat.id);
    if(inUse){await updateStrategy({...strat,archived:true});return;}
    setStrategies(prev=>prev.filter(s=>s.id!==strat.id));
    if(authUser)await supabase.from('strategies').delete().eq('user_id',authUser.id).eq('id',strat.id);
  };

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
  // Confirmation is the caller's responsibility (Cfg shows a ConfirmDialog
  // before calling this) — this function just performs the reset.
  const resetAccount=async(scope,includeBalances)=>{
    if(!authUser)return;
    const modes=scope==='BOTH'?['DEMO','REAL']:[scope];
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
      // sessionNum is only unique per (day, mode) — buildSession restarts it
      // at 1 every calendar day, so matching on accountMode+sessionNum alone
      // against the full, all-time trades array pulls in a PRIOR day's
      // same-numbered session too. That's exactly how a brand-new, genuinely
      // empty session ended up inheriting another day's trade count/pnl/lock
      // wholesale. t.date must match today's date as well.
      const sessionTrades=trades
        .filter(t=>getTradeMode(t)===sess.accountMode&&t.sessionNum===sess.num&&t.date===todaySS.date)
        .sort((a,b)=>a.timestamp-b.timestamp);
      if(!sessionTrades.length)return sess;
      // Rebuild counters from scratch (in order) so streaks are correct.
      const amStyle=getMoneyMgmtStyleForMode(settings,sess.accountMode);
      const isPL=amStyle==='PROFIT_LOCK';
      let streak=0,nextStake=isEscalatingStyle(amStyle)?amBaseStake(sess.startBalance??0,settings):null;
      let runningBal=sess.startBalance??0;
      let w=0,l=0,tc=0,cl=0,cw=0,sp=0;
      for(const t of sessionTrades){
        if(t.outcome==='PENDING'){tc++;continue;}
        tc++;
        if(t.outcome==='WIN'){w++;cw++;cl=0;}
        if(t.outcome==='LOSS'){l++;cl++;cw=0;}
        sp+=t.pnl||0;
        if(isEscalatingStyle(amStyle)){
          runningBal+=t.pnl||0;
          const r=isPL
            ?advanceProfitLock({streak,nextStake},t.outcome,t.pnl||0,runningBal,settings,sess.accountMode)
            :advanceAntiMartingale({streak,nextStake},t.outcome,runningBal,settings,sess.accountMode);
          streak=r.streak;nextStake=r.nextStake;
        }
      }
      const nl=Math.max(0,l-w);
      const rebuilt={...sess,trades:tc,wins:w,losses:l,conLoss:cl,conWin:cw,netLoss:nl,sPnl:sp,
        ...(isPL?{plStreak:streak,plNextStake:nextStake}:amStyle==='ANTI_MARTINGALE'?{amStreak:streak,amNextStake:nextStake}:{})};
      // Use the last resolved trade's timestamp as endTime so the 6h
      // session gap is measured from when trading actually stopped,
      // not from when this reconciliation runs.
      const lastTrade=sessionTrades.filter(t=>t.outcome!=='PENDING').pop();
      const endTime=lastTrade?lastTrade.timestamp:Date.now();
      if(isEscalatingStyle(amStyle)){
        // No chkLock/Strict Locking replay here — Trade Management stop
        // rules don't apply to Anti-Martingale or Profit Lock sessions.
        const endReason=checkEscalatingSessionEnd(rebuilt,sess.accountMode,settings);
        if(endReason){changed=true;return{...rebuilt,isActive:false,endTime,endReason};}
        // A trade delete can leave streak/next-stake stale even with no end
        // event (e.g. an escalation trade removed) — still worth persisting.
        const streakKey=isPL?'plStreak':'amStreak',stakeKey=isPL?'plNextStake':'amNextStake';
        if(rebuilt[streakKey]!==(sess[streakKey]||0)||rebuilt[stakeKey]!==sess[stakeKey]){changed=true;return rebuilt;}
        return sess;
      }
      const lk=chkLock(rebuilt,getTradeStyleForMode(settings,sess.accountMode));
      if(lk.locked){
        changed=true;
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
  //
  // Excludes Anti-Martingale/Profit Lock sessions from the Trade-Management
  // timer-expiry branch for the same reason as the Dashboard's own tick
  // above: that countdown is purely informational under either style, never
  // a locking/ending trigger — only their own profit/loss/max-trades/60min
  // check (checkEscalatingSessionEnd) ends those, non-blockingly, below.
  //
  // Also backstops pause-auto-resume (style-agnostic — Dashboard's own tick
  // was previously the ONLY place this ran, so pausing a session from Quick
  // Log and never revisiting Dashboard meant it would stay paused forever).
  useEffect(()=>{
    if(!todaySS)return;
    const id=setInterval(()=>{
      const now=Date.now();
      let changed=false;
      const nextSessions=todaySS.sessions.map(s=>{
        if(s.isActive&&s.pausedAt&&now-s.pausedAt>=PAUSE_AUTO_RESUME_MS){
          changed=true;
          return{...s,pausedMsTotal:(s.pausedMsTotal||0)+(now-s.pausedAt),pausedAt:null};
        }
        const style=getMoneyMgmtStyleForMode(settings,s.accountMode);
        if(s.isActive&&!s.isLocked&&isEscalatingStyle(style)){
          const endReason=checkEscalatingSessionEnd(s,s.accountMode,settings,now);
          if(endReason){changed=true;return{...s,isActive:false,endTime:now,endReason};} // non-blocking, no isLocked
          return s;
        }
        if(s.isActive&&!s.isLocked&&!isEscalatingStyle(style)&&isSessionTimeExpired(s,now)){
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

  // Plays the session-lock chime the instant any session (either mode) ends —
  // separate from the email effect above so it isn't gated on having an email
  // on file. If the tab is in the background at that moment, also fires an OS
  // desktop notification (visible even when this tab isn't focused/active),
  // since an in-page toast can't be seen in a tab that isn't on screen.
  const alertedRef=useRef(new Set());
  const prevSessionsForAlertRef=useRef([]);
  useEffect(()=>{
    if(!todaySS)return;
    const prev=prevSessionsForAlertRef.current;
    const justEnded=todaySS.sessions.filter(s=>{
      if(s.isActive||!s.endTime||alertedRef.current.has(s.id))return false;
      const before=prev.find(p=>p.id===s.id);
      return !before||before.isActive;
    });
    prevSessionsForAlertRef.current=todaySS.sessions;
    justEnded.forEach(s=>{
      alertedRef.current.add(s.id);
      if(settings?.soundAlertOn!==false)music.playAlert(ALERT_CHIME_SRC,settings?.alertVolume??ALERT_VOLUME_DEFAULT);
      if(document.hidden&&settings?.desktopAlertOn!==false&&typeof Notification!=='undefined'&&Notification.permission==='granted'){
        try{
          new Notification('Session locked',{body:`${s.accountMode==='REAL'?'Real':'Demo'} session ended — ${s.lockReason||'locked'}.`,tag:`session-lock-${s.id}`});
        }catch{}
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[todaySS]);

  if(authLoading)return<Loading/>;
  if(!isSupabaseConfigured)return(
    <div style={{maxWidth:440,margin:'4rem auto',padding:'1rem',textAlign:'center'}}>
      <div style={{fontSize:18,fontWeight:500,color:'var(--text-danger)',marginBottom:8}}>Supabase not configured</div>
      <div style={{fontSize:13,color:'var(--text-secondary)'}}>
        Set <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> environment variables, then rebuild and redeploy.
      </div>
    </div>
  );
  // No client-side router in this app (SPA rewrite in vercel.json serves
  // index.html for every path) — a plain pathname check is enough for one
  // dedicated route, and takes priority over the normal auth gate below:
  // a just-confirmed session shouldn't silently drop the user straight into
  // the dashboard, it should show the confirmation screen first.
  if(window.location.pathname==='/auth/confirmed'){
    return<EmailConfirmed onLogin={()=>{window.history.replaceState({},'','/');setPage('login');}}/>;
  }
  if(!authUser)return page==='login'?<Login onBack={()=>setPage('landing')}/>:<Landing onLogin={()=>setPage('login')}/>;
  if(loading)return<Loading/>;
  if(!settings?.setupComplete)return<Setup onDone={saveSettings}/>;

  const nav=[
    {id:'dashboard',icon:LayoutDashboard,label:'Dashboard'},
    {id:'analyzer',icon:ScanSearch,label:'Zone analyzer'},
    {id:'journal',icon:BookOpen,label:'Journal',badge:pending},
    // Only relevant while Anti-Martingale or Profit Lock is this mode's
    // active Money Management Style — same gate QuickLog's own alert uses,
    // so the nav entry and the page content never disagree.
    ...(isEscalatingStyle(getMoneyMgmtStyleForMode(settings,mode))?[{id:'quicklog',icon:Zap,label:'Quick log'}]:[]),
    {id:'money',icon:Wallet,label:'Money mgmt'},
    {id:'plan',icon:ClipboardList,label:'Trading plan'},
    {id:'analytics',icon:BarChart3,label:'Analytics'},
    {id:'ask',icon:MessageCircle,label:'Ask'},
    {id:'settings',icon:Settings,label:'Settings'},
  ];

  return(
    <div className="flex h-screen flex-col overflow-hidden bg-base text-ink" data-theme={theme} style={{background:'var(--bg)'}}>
      <div className="app-glow" aria-hidden="true"/>
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
            {view==='dashboard'&&<Dashboard settings={settings} trades={trades} wds={wds} ss={todaySS} saveSS={saveSS} bal={bal} mode={mode} nav={setView} music={music} userId={authUser?.id}/>}
            {view==='analyzer'&&<Analyzer settings={settings} ss={todaySS} mode={mode} saveAnalyses={saveAnalyses} analyses={analyses} nav={setView} setPA={setPA} trades={trades}/>}
            {view==='journal'&&<Journal settings={settings} trades={trades} saveTrades={saveTrades} deleteTrade={deleteTrade} ss={todaySS} saveSS={saveSS} pa={pa} setPA={setPA} wds={wds} mode={mode} userId={authUser?.id} strategies={strategies}/>}
            {view==='quicklog'&&<QuickLog settings={settings} trades={trades} saveTrades={saveTrades} deleteTrade={deleteTrade} ss={todaySS} saveSS={saveSS} wds={wds} mode={mode} strategies={strategies} music={music} userId={authUser?.id}/>}
            {view==='money'&&<Money settings={settings} trades={trades} wds={wds} saveWds={saveWds} mode={mode} ss={todaySS}/>}
            {view==='plan'&&<Plan settings={settings}/>}
            {view==='analytics'&&<Analytics trades={trades} analyses={analyses} settings={settings} bal={bal} wds={wds} strategies={strategies}/>}
            {view==='ask'&&<Ask trades={trades} settings={settings} mode={mode} userId={authUser?.id} strategies={strategies} analyses={analyses} wds={wds} ss={todaySS}/>}
            {view==='settings'&&<Cfg settings={settings} saveSettings={saveSettings} ss={todaySS} resetAccount={resetAccount} trades={trades} wds={wds} strategies={strategies} mode={mode} addStrategy={addStrategy} updateStrategy={updateStrategy} deleteStrategy={deleteStrategy}/>}
          </div>

          {/* Rendered once here (not inside Dashboard) so it's never unmounted by navigation. */}
          <audio ref={music.audioRef} src={music.track?.audio} onEnded={music.next} onError={music.next}/>
          {active&&view!=='dashboard'&&<MusicWidget music={music}/>}
        </main>
      </div>
    </div>
  );
}
