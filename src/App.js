import { useState, useEffect, useRef, useCallback } from "react";
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
    extra:{startingBalanceDemo:s.startingBalanceDemo,startingBalanceReal:s.startingBalanceReal,tradeStyleDemo:s.tradeStyleDemo,tradeStyleReal:s.tradeStyleReal,aiProvider:s.aiProvider,sessionDurations:s.sessionDurations,riskMode:s.riskMode,riskAmount:s.riskAmount,alertVolume:s.alertVolume,soundAlertOn:s.soundAlertOn,desktopAlertOn:s.desktopAlertOn,strictLockingDemo:s.strictLockingDemo,strictLockingReal:s.strictLockingReal,
      moneyMgmtStyleDemo:s.moneyMgmtStyleDemo,moneyMgmtStyleReal:s.moneyMgmtStyleReal,
      amMultiplierDemo:s.amMultiplierDemo,amMultiplierReal:s.amMultiplierReal,
      amCeilingPctDemo:s.amCeilingPctDemo,amCeilingPctReal:s.amCeilingPctReal,
      amProfitTargetPctDemo:s.amProfitTargetPctDemo,amProfitTargetPctReal:s.amProfitTargetPctReal,
      amLossTargetPctDemo:s.amLossTargetPctDemo,amLossTargetPctReal:s.amLossTargetPctReal,
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
      startBalance:s.startBalance,amStreak:s.amStreak||0,amNextStake:s.amNextStake??null,endReason:s.endReason||null}};
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
  return{id:q.id,user_id:userId,timestamp:new Date(q.timestamp).toISOString(),question:q.question,answer:q.answer,mode:q.mode||null,extra:{}};
}
function fromQueryRow(r){
  return{id:r.id,timestamp:new Date(r.timestamp).getTime(),question:r.question,answer:r.answer,mode:r.mode};
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
// The two reserved strategies every user gets on first load — fixed ids so
// Zone Analyzer's auto-log path can tag 'zone-sd' directly, no name lookup.
const BUILTIN_STRATEGIES=[
  {id:'zone-sd',name:'Zone (S&D)'},
  {id:'trend-pattern',name:'Trend/Pattern'},
];
async function ensureBuiltinStrategies(userId){
  const{data,error}=await supabase.from('strategies').select('id').eq('user_id',userId).in('id',BUILTIN_STRATEGIES.map(s=>s.id));
  if(error)return;
  const existing=new Set((data||[]).map(r=>r.id));
  const missing=BUILTIN_STRATEGIES.filter(s=>!existing.has(s.id))
    .map(s=>({id:s.id,user_id:userId,name:s.name,description:null,is_builtin:true,archived:false}));
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
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:30,display:'flex',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)',boxShadow:'var(--shadow-card), var(--highlight-top)'}}>
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
// Compact two-button BUY/SELL toggle. Pass `onChange` for an editable picker
// (Quick Log's draft row); omit it for a read-only pill (committed rows) —
// both directions stay visible so the row's still scannable at a glance.
function DirToggle({value,onChange}){
  const opt=(d,label)=>{
    const on=value===d;
    const base={padding:'2px 8px',fontSize:11,fontWeight:600,borderRadius:4,border:'1px solid var(--border)'};
    const style=on
      ?{...base,background:d==='BUY'?'var(--bg-success)':'var(--bg-danger)',color:d==='BUY'?'var(--text-success)':'var(--text-danger)',borderColor:d==='BUY'?'var(--border-success)':'var(--border-danger)'}
      :{...base,background:'transparent',color:'var(--text-muted)',cursor:onChange?'pointer':'default'};
    return onChange
      ?<button key={d} type="button" style={style} onClick={()=>onChange(d)}>{label}</button>
      :<span key={d} style={{...style,opacity:on?1:0.35}}>{label}</span>;
  };
  return<div style={{display:'flex',gap:4}}>{opt('BUY','BUY')}{opt('SELL','SELL')}</div>;
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
  return Number.isFinite(v)?v:2;
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

// Anti-Martingale engine — verbatim per spec, do not redesign. A win escalates
// the stake (up to AM_MAX_ESCALATIONS, capped at amCeilingPct% of balance);
// any loss, or completing the escalation ladder, resets to the base stake.
const AM_MAX_ESCALATIONS = 2;
function amBaseStake(balance, settings) {
  const riskPct = settings?.riskPercent ?? 5;
  return Math.max(1, Math.round(balance * (riskPct / 100) * 100) / 100);
}
function advanceAntiMartingale(state, outcome, balance, settings, mode) {
  const base = amBaseStake(balance, settings);
  if (outcome !== 'WIN') {
    return { streak: 0, nextStake: base }; // any loss resets immediately
  }
  // Cap check on the PRE-increment streak: a WIN only forces the reset once
  // it happens AT the max-escalated stake (the actual "2nd escalated win") —
  // both escalation levels get placed before the ladder caps out.
  if (state.streak >= AM_MAX_ESCALATIONS) {
    return { streak: 0, nextStake: base };
  }
  const multiplier = settings?.[`amMultiplier${mode}`] ?? 2;
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
  if (streak === 0) {
    return 'Base stake — a win escalates the next stake up.';
  }
  const multiplier = getAmMultiplierForMode(settings, mode);
  const ceiling = balance * (getAmCeilingPctForMode(settings, mode) / 100);
  const onWin = Math.max(1, Math.min(Math.round(stake * multiplier * 100) / 100, ceiling));
  if (streak >= AM_MAX_ESCALATIONS) {
    return `Final escalation (${streak} of ${AM_MAX_ESCALATIONS}) — any outcome resets to $${base.toFixed(2)} base next.`;
  }
  return `Escalation ${streak} of ${AM_MAX_ESCALATIONS} — win again for $${onWin.toFixed(2)}, any loss resets to $${base.toFixed(2)} base.`;
}
function checkAntiMartingaleSessionEnd(session, mode, settings) {
  if (!session?.isActive) return null;
  if (getMoneyMgmtStyleForMode(settings, mode) !== 'ANTI_MARTINGALE') return null;
  const startBal = session.startBalance;
  const pnlPct = startBal ? (session.sPnl / startBal) * 100 : 0;
  const profitTarget = settings?.[`amProfitTargetPct${mode}`] ?? 10;
  const lossTarget = settings?.[`amLossTargetPct${mode}`] ?? 10;
  if (pnlPct >= profitTarget) return 'AM_PROFIT_TARGET';
  if (pnlPct <= -Math.abs(lossTarget)) return 'AM_LOSS_TARGET';
  return null;
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
    amStreak:0,amNextStake:amStyle==='ANTI_MARTINGALE'?amBaseStake(startBalance??0,settings):null};
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
  const model=provider==='groq'?'meta-llama/llama-4-scout-17b-16e-instruct':'nvidia/nemotron-nano-12b-v2-vl:free';
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'user',content:`${NOTE_POLISH_PROMPT}\n\n---\n${trimmed}`}],temperature:0.3,max_tokens:600})});
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
async function aiChat(prompt,settings,{json=false,maxTokens=500,temperature=0.1}={}){
  const provider=settings?.aiProvider||'gemini';
  const key=provider==='groq'?settings?.groqApiKey:settings?.apiKey;
  if(!key)throw userError(`Add your ${provider==='groq'?'Groq':'OpenRouter'} API key in Settings first.`);
  const url=provider==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
  const model=provider==='groq'?'meta-llama/llama-4-scout-17b-16e-instruct':'nvidia/nemotron-nano-12b-v2-vl:free';
  const body={model,messages:[{role:'user',content:prompt}],temperature,max_tokens:maxTokens};
  if(json)body.response_format={type:'json_object'};
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw userError(e.error?.message||`${provider==='groq'?'Groq':'OpenRouter'} API error ${res.status}`);}
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content;
  if(!txt)throw userError('No response from AI. Try again.');
  return txt.trim();
}

// Stage 1: turn the question into a structured, checkable spec. This model
// is given ZERO trade data — it cannot hallucinate a stat because it has
// nothing to hallucinate from. The advice/opinion refusal, the impliesAdvice
// closing line, and the Demo/Real ambiguity check all happen on this JSON in
// plain app code (see Ask component), never by trusting a generated sentence
// to self-censor.
const ASK_CLASSIFY_PROMPT=`You are a query classifier for a trading journal app. You have NOT been given any trade data and must never state a number, percentage, date, or fact about the user's trades. Your only job: read the question and output JSON describing what's being asked. Output ONLY valid JSON, no prose, matching exactly this shape:

{
  "intent": "DATA_QUERY" | "ADVICE_OR_OPINION" | "OUT_OF_SCOPE",
  "mode": "DEMO" | "REAL" | "AMBIGUOUS",
  "metric": "WIN_RATE" | "PNL" | "TRADE_COUNT" | "STREAK" | "GRADE_BREAKDOWN" | "PAIR_BREAKDOWN" | "STRATEGY_BREAKDOWN" | "OFF_PLAN_IMPACT" | "DAY_OF_WEEK" | "SESSION_NUMBER" | "TIME_OF_DAY" | null,
  "range": "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CURRENT_MONTH" | "PREV_MONTH" | "ALL" | null,
  "impliesAdvice": true | false
}

Rules:
- intent=ADVICE_OR_OPINION only when the question has NO answerable data component at all — pure opinion/prediction/reassurance requests ("should I keep using Structured style?", "am I ready to go live?", "is my win rate good?").
- impliesAdvice=true whenever the question attaches a should/stop/change hook to an otherwise answerable data question ("should I stop trading Wednesdays?" -> intent=DATA_QUERY, metric=DAY_OF_WEEK, impliesAdvice=true). The data half still gets answered; only the "should" half is declined.
- intent=DATA_QUERY for anything answerable by counting/aggregating/cross-referencing the user's own logged trades, including broad questions ("how am I doing this month") — leave metric as the closest single primary metric (e.g. WIN_RATE); the app checks other dimensions automatically.
- intent=OUT_OF_SCOPE for anything not about the user's own trade data.
- mode=AMBIGUOUS whenever Demo/Real isn't specified or clearly implied — do not guess or default.
- If intent=ADVICE_OR_OPINION, still fill "metric" with whatever data dimension the question is closest to (e.g. STRATEGY_BREAKDOWN for the Structured-style example) so the app can offer that breakdown instead of just refusing.
- "range" defaults to "ALL" if the question doesn't specify a time period.

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

FACTS:
`;

async function classifyAskQuery(question,settings){
  const txt=await aiChat(ASK_CLASSIFY_PROMPT+question,settings,{json:true,maxTokens:200});
  try{return JSON.parse(txt.replace(/```json|```/g,'').trim());}
  catch{throw userError('Could not parse the classifier response. Try again.');}
}
async function composeAskAnswer(question,facts,settings){
  return aiChat(`${ASK_COMPOSE_PROMPT}${JSON.stringify(facts)}\n\nQuestion: ${question}`,settings,{maxTokens:300,temperature:0.2});
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

  const linePath=points.map((p,i)=>`${i===0?'M':'L'} ${x(i).toFixed(2)} ${y(p.v).toFixed(2)}`).join(' ');
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
            <line x1={padL} x2={width-padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4"/>
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
  const alertPlayingRef=useRef(false); // true while the shared <audio> element is borrowed for a lock alert

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

  return{tracks,trackIdx,track:tracks?.[trackIdx],playing,volume,setVolume,muted,setMuted,audioRef,toggle,next,selectTrack,playAlert};
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
  const amDisplayStake=liveAmNextStake(active,bal,settings,mode);
  const amReasoning=amStakeReasoning(active,bal,settings,mode);
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
  const isDailyLocked=isDailyCircuitBroken(trades,mode);
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

  // Same race as Journal's mkSession (two tabs both pressing "Start Session"
  // for the same mode before either write is visible to the other) — same
  // fix: insert directly so a uniq_session_slot conflict is attributable to
  // this call, and retry once against the mode's real current rows.
  async function startSession(){
    const duration=getSessionDuration(settings,getTradeStyleForMode(settings,mode));
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
          ):(
            <div style={{flex:1}}>
              <div style={{width:36,height:36,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-accent)',border:'1px solid var(--border-accent)',marginBottom:10}}>
                <Target size={17} style={{color:'var(--text-accent)'}}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Ready for session {ss.sessions.filter(s=>s.accountMode===mode).length+1}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Start a session to begin the timer, or analyze a zone / open the journal directly.</div>
              <button style={{...btn('suc'),width:'100%'}} onClick={startSession}><Timer size={15}/>Start session ({getSessionDuration(settings,getTradeStyleForMode(settings,mode))}m)</button>
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
          {mmStyle==='ANTI_MARTINGALE'
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

// ── Journal ───────────────────────────────────────────────────────────────────
export function Journal({settings,trades,saveTrades,deleteTrade,ss,saveSS,pa,setPA,wds,mode,userId,strategies,openTradeId,onConsumedJump}){
  const activeStrategies=(strategies||[]).filter(s=>!s.archived);
  const[filt,setFilt]=useState('ALL');
  const[stratFilt,setStratFilt]=useState('ALL');
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
    return{pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:mode||'DEMO',stakeMode:'DEFAULT',stakeValue:'',payoutPct:'',strategyId:lastStrategyId()};
  });
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[selectedTrade,setSelectedTrade]=useState(null);
  // Deep-link from Quick Log: opens the exact same Detail/Edit modal below,
  // rather than duplicating it — same component, same code path, just
  // triggered by a trade id instead of a row click inside this component.
  useEffect(()=>{
    if(!openTradeId)return;
    const t=trades.find(x=>x.id===openTradeId);
    if(t)setSelectedTrade(t);
    onConsumedJump?.();
  },[openTradeId,trades,onConsumedJump]);
  // Opening a trade always lands on the read-only Detail view first —
  // Edit is a deliberate secondary action, never the default.
  const[editingTrade,setEditingTrade]=useState(false);
  const[editDraft,setEditDraft]=useState({notes:'',screenshots:[],pair:'',strategyId:'',dir:'BUY',outcome:'PENDING',grade:'A',stake:'',payoutPct:''});
  const[preview,setPreview]=useState(null); // {items:[url,...], index}
  const[saving,setSaving]=useState(false);
  const[savingEdit,setSavingEdit]=useState(false);
  const[editErr,setEditErr]=useState(null);
  const[savedFlash,setSavedFlash]=useState(false);
  const[journalNotice,setJournalNotice]=useState(null);
  function flashNotice(msg){setJournalNotice(msg);setTimeout(()=>setJournalNotice(null),6000);}
  const[confirmingDelete,setConfirmingDelete]=useState(false);
  const[paStakeMode,setPaStakeMode]=useState('DEFAULT');
  const[paStakeValue,setPaStakeValue]=useState('');
  const[polishingManual,setPolishingManual]=useState(false);
  const[manualPolishErr,setManualPolishErr]=useState(null);
  const[manualSuggestion,setManualSuggestion]=useState(null);
  const[polishingTrade,setPolishingTrade]=useState(false);
  const[tradeSuggestion,setTradeSuggestion]=useState(null);
  const manualNotesRef=useRef(null);
  const tradeNotesRef=useRef(null);

  // Directly overwriting a controlled textarea's React state clears the
  // browser's native undo stack (Ctrl+Z stops working). Using execCommand
  // routes the change through the same input pipeline as real typing, so
  // undo/redo keeps working after an AI suggestion is accepted.
  function applyTextWithUndo(ref,text){
    const el=ref.current;
    if(el&&document.execCommand){
      el.focus();
      el.select();
      if(document.execCommand('insertText',false,text))return true;
    }
    return false;
  }

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

  // AM-aware: when Anti-Martingale is the active style for this mode, the
  // "default" stake is the live escalation-aware suggestion, not Fixed-Risk
  // math — same {calc,actual,eff} shape as calcStake so every call site
  // (paStake, manualDefaultStake, the stake-mode buttons) works unchanged.
  const stakeFor=m=>{
    const modeBal=balForMode(settings,trades,wds,m);
    if(getMoneyMgmtStyleForMode(settings,m)==='ANTI_MARTINGALE'){
      const actual=liveAmNextStake(getActive(ss,m),modeBal,settings,m);
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
  const dailyLocked=isDailyCircuitBroken(trades,mode);
  const strictLocked=!!active?.strictAtStart&&lk.locked;

  const tabActive=getActive(ss,journalTab);
  const tabLk=tabActive?chkLock(tabActive,getTradeStyleForMode(settings,journalTab)):{locked:false};
  const tabDailyLocked=isDailyCircuitBroken(trades,journalTab);
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
      const candidate=buildSession(base,mode,getSessionDuration(settings,getTradeStyleForMode(settings,mode)),isStrictForMode(settings,mode),settings,balForMode(settings,trades,wds,mode));
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
      if(getMoneyMgmtStyleForMode(settings,tMode)==='ANTI_MARTINGALE'){
        // t's prior pnl was 0 (it was PENDING), so trades still reflects
        // balance BEFORE this outcome — adding pnl gives balance after it,
        // which is what the next stake should be sized against.
        const balAfter=balForMode(settings,trades,wds,tMode)+pnl;
        const am=advanceAntiMartingale({streak:sess.amStreak||0,nextStake:sess.amNextStake??amBaseStake(balAfter,settings)},outcome,balAfter,settings,tMode);
        us={...us,amStreak:am.streak,amNextStake:am.nextStake};
        const endReason=checkAntiMartingaleSessionEnd(us,tMode,settings);
        // No isLocked/lockReason/lockCode here — Strict Locking never applies
        // to an Anti-Martingale profit/loss-target ending.
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
          // Locking that can block on them) don't apply to Anti-Martingale
          // sessions — those end on the AM profit/loss target instead.
          if(amStyle!=='ANTI_MARTINGALE'){
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
          if(amStyle==='ANTI_MARTINGALE'&&outcome!=='PENDING'){
            const balAfter=entryBal+pnl;
            const am=advanceAntiMartingale({streak:sess.amStreak||0,nextStake:sess.amNextStake??amBaseStake(balAfter,settings)},outcome,balAfter,settings,entryAccountMode);
            us={...us,amStreak:am.streak,amNextStake:am.nextStake};
            const endReason=checkAntiMartingaleSessionEnd(us,entryAccountMode,settings);
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
      setManual(false);setOffPlanOverride(false);smf({pair:'',dir:'BUY',grade:'A',notes:'',screenshots:[],outcome:'PENDING',tradeDate:tod(),accountMode:journalTab,stakeMode:'DEFAULT',stakeValue:'',payoutPct:'',strategyId:mf.strategyId});setManualSuggestion(null);
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
  const manualIsAm=getMoneyMgmtStyleForMode(settings,manualAccountMode)==='ANTI_MARTINGALE';
  const manualAmReasoning=manualIsAm?amStakeReasoning(getActive(ss,manualAccountMode),manualBal,settings,manualAccountMode):null;

  const tabTrades=trades.filter(t=>getTradeMode(t)===journalTab);
  // Outcome and strategy filters combine (AND), not exclusive alternatives —
  // "Zone + Win" narrows both dimensions at once, same as either alone.
  const outcomeFiltered=filt==='ALL'?tabTrades:tabTrades.filter(t=>filt==='PENDING'?t.outcome==='PENDING':t.outcome===filt);
  const stratFiltered=stratFilt==='ALL'?outcomeFiltered:outcomeFiltered.filter(t=>(t.strategyId||'zone-sd')===stratFilt);
  const sorted=[...stratFiltered].sort((a,b)=>b.timestamp-a.timestamp);

  async function saveTradeEdits(){
    if(!selectedTrade||savingEdit)return;
    setSavingEdit(true);setEditErr(null);
    try{
      const screenshots=editDraft.screenshots.map(x=>x.b64||x).filter(Boolean);
      const pair=(editDraft.pair||'').trim()||selectedTrade.pair;
      addPairOption(pair);
      const stake=parseFloat(editDraft.stake);
      const validStake=Number.isFinite(stake)&&stake>0?stake:selectedTrade.stake;
      const payoutPct=editDraft.outcome==='WIN'?parseFloat(editDraft.payoutPct)||undefined:undefined;
      const pnl=calcPnl(validStake,editDraft.outcome,payoutPct);
      const updated={...selectedTrade,notes:editDraft.notes,screenshots,pair,strategyId:editDraft.strategyId,
        direction:editDraft.dir,zoneGrade:editDraft.grade,stake:validStake,outcome:editDraft.outcome,pnl,
        payoutPct:payoutPct||null};
      await saveTrades(prev=>prev.map(t=>t.id===selectedTrade.id?updated:t));
      setSelectedTrade(updated);
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
  // Detail view reads straight off selectedTrade (read-only), not editDraft
  // (which only exists for the Edit view) — same zoom modal, different source.
  function openSelectedTradeImage(i){
    const items=(selectedTrade.screenshots||[]).map(src=>{
      const raw=typeof src==='string'?src:(src?.b64||src?.b);
      return toDataUrl(raw,src?.mime);
    });
    setPreview({items,index:i});
  }

  // addTradeImage closes over editDraft/selectedTrade directly (not via a
  // functional state updater), so it must always be called through a ref
  // that's refreshed every render — otherwise a paste effect that only
  // re-attaches when selectedTrade's identity changes could fire a stale
  // closure and drop screenshots added earlier in the same edit session.
  const addTradeImageRef=useRef(addTradeImage);
  addTradeImageRef.current=addTradeImage;

  // Global (document-level), matching the Analyzer's paste handling — an
  // onPaste prop on just the notes textarea only fires while that exact
  // element has focus, which is easy to miss. Keyed on presence (not the
  // object itself) so it attaches once per trade opened, not on every edit.
  const hasSelectedTrade=!!selectedTrade;
  useEffect(()=>{
    if(!hasSelectedTrade)return;
    function onPaste(e){
      const item=Array.from(e.clipboardData?.items||[]).find(it=>it.type.startsWith('image/'));
      if(!item)return;
      e.preventDefault();
      const file=item.getAsFile();
      if(file)addTradeImageRef.current(file);
    }
    document.addEventListener('paste',onPaste);
    return()=>document.removeEventListener('paste',onPaste);
  },[hasSelectedTrade]);

  // Keyed on trade id (not the whole object) — addTradeImage/removeTradeImage
  // update selectedTrade in place to keep other displays in sync, and re-keying
  // on every such mutation would blow away in-progress notes edits mid-typing.
  useEffect(()=>{
    if(selectedTrade){
      setEditDraft({notes:selectedTrade.notes||'',pair:selectedTrade.pair||'',strategyId:selectedTrade.strategyId||'zone-sd',
        dir:selectedTrade.direction||'BUY',outcome:selectedTrade.outcome||'PENDING',grade:selectedTrade.zoneGrade||'UNGRADED',
        stake:String(selectedTrade.stake??''),payoutPct:selectedTrade.payoutPct?String(selectedTrade.payoutPct):'',
        screenshots:(selectedTrade.screenshots||[]).map((src,i)=>{
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
            {getMoneyMgmtStyleForMode(settings,mode)==='ANTI_MARTINGALE'&&paStakeMode==='DEFAULT'&&<div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>Anti-Martingale: {amStakeReasoning(active,paBal,settings,mode)}</div>}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...btn('suc'),flex:1}} onClick={()=>recordPA()} disabled={dailyLocked||strictLocked}>Create journal entry</button>
            <button style={btn()} onClick={()=>setPA(null)}>Discard</button>
          </div>
          {dailyLocked&&<div style={{fontSize:12,color:'var(--text-danger)',marginTop:6}}>Daily loss limit reached — resume tomorrow.</div>}
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

      {tabDailyLocked&&<Alert type="dan" title={`${journalTab==='REAL'?'Real':'Demo'} day locked`} body={`${MAX_DL}-loss daily limit reached for this account. Manual entries resume tomorrow.`}/>}

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
      {manual&&offPlanOverride&&(
        <div style={{fontSize:12,color:'var(--text-warning)',marginBottom:8}}>Logging as off-plan — this will not reopen or unlock the session.</div>
      )}

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
            {manualIsAm&&mf.stakeMode==='DEFAULT'&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Anti-Martingale: {manualAmReasoning}</div>}
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
            <div style={{display:'flex',gap:8}}>
              <button style={{...btn('suc'),flex:1}} onClick={e=>{
                e.stopPropagation();
                const input=window.prompt(`Payout % for this win (broker payout was different from the default ${Math.round(PAYOUT*100)}%? enter it here — leave blank to use ${Math.round(PAYOUT*100)}%):`,String(Math.round(PAYOUT*100)));
                if(input===null)return;
                const pct=parseFloat(input);
                setOutcome(t.id,'WIN',Number.isFinite(pct)&&pct>0?pct:undefined);
              }}>Win ✓</button>
              <button style={{...btn('dan'),flex:1}} onClick={e=>{e.stopPropagation();setOutcome(t.id,'LOSS');}}>Loss ✗</button>
            </div>
          )}
          {t.notes&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6,fontStyle:'italic'}}>{t.notes}</div>}
        </div>
      ))}

      {selectedTrade&&(
        <div role="dialog" aria-modal="true" aria-label={editingTrade?'Edit trade':'Trade detail'} style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1000}} onClick={()=>setSelectedTrade(null)}>
          <div style={{...card,width:'100%',maxWidth:820,maxHeight:'90vh',overflowY:'auto',border:'1px solid var(--border-strong)',boxShadow:'0 18px 50px rgba(0,0,0,0.35)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>{editingTrade?'Edit trade':'Trade detail'}</div>
                <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span>{selectedTrade.pair} · {selectedTrade.direction}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                {!editingTrade&&<button style={btn('pri')} onClick={()=>setEditingTrade(true)}><i className="ti ti-pencil" aria-hidden="true" style={{marginRight:5}}/>Edit</button>}
                <button style={btn()} onClick={()=>editingTrade?setEditingTrade(false):setSelectedTrade(null)}>{editingTrade?'Back':'Close'}</button>
              </div>
            </div>

            {!editingTrade?(
              <TradeDetailView trade={selectedTrade} onZoom={openSelectedTradeImage} strategies={strategies}/>
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
                <div style={g2}>
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

// ── Quick Log ────────────────────────────────────────────────────────────────
// Rapid-entry table for an active Anti-Martingale session — same trades-table
// schema as Journal's manual entry (source:'QUICKLOG' instead of 'MANUAL'),
// just a faster per-row commit instead of opening the full form each time.
// Row clicks deep-link into Journal's own Detail/Edit modal (onOpenTrade)
// rather than duplicating that ~800-line modal here.
function QuickLog({settings,trades,saveTrades,ss,saveSS,wds,mode,strategies,onOpenTrade}){
  const active=getActive(ss,mode);
  const isAm=getMoneyMgmtStyleForMode(settings,mode)==='ANTI_MARTINGALE';
  const bal=balForMode(settings,trades,wds,mode);
  const canLog=isAm&&active?.isActive;

  const sessionTrades=trades
    .filter(t=>getTradeMode(t)===mode&&t.sessionNum===active?.num&&t.date===tod())
    .sort((a,b)=>a.timestamp-b.timestamp);
  // Running balance per row, folded from the session's own starting point —
  // "balance after" always reads as "what it was right after that trade,"
  // not today's live figure.
  let running=active?.startBalance??bal;
  const rows=sessionTrades.map(t=>{running+=t.pnl;return{t,balanceAfter:running};});

  const liveStake=canLog?liveAmNextStake(active,bal,settings,mode):0;
  // This app's own local pair/direction quick-entry state, same tiny pattern
  // Journal's addPairOption uses — not lifted to shared state since it's a
  // session-local autocomplete convenience, not persisted data.
  const[pairOptions,setPairOptions]=useState(PAIRS);
  const[draftPair,setDraftPair]=useState('');
  const[draftDir,setDraftDir]=useState(lastDirection());
  const[draftStakeOverride,setDraftStakeOverride]=useState('');
  const[saving,setSaving]=useState(false);
  const draftStake=parseFloat(draftStakeOverride)||liveStake;

  function addPairOption(value){
    const trimmed=(value||'').trim();
    if(!trimmed)return;
    setPairOptions(prev=>prev.includes(trimmed)?prev:[...prev,trimmed]);
  }

  async function commitRow(outcome){
    if(!canLog||saving)return;
    setSaving(true);
    try{
      const pair=(draftPair||'Manual').trim();
      addPairOption(pair);
      setLastDirection(draftDir);
      const stake=draftStake;
      const pnl=calcPnl(stake,outcome);
      const balAfter=bal+pnl;

      // Exact same AM state machine addManual already uses — no new logic.
      const am=advanceAntiMartingale(
        {streak:active.amStreak||0,nextStake:active.amNextStake??amBaseStake(balAfter,settings)},
        outcome,balAfter,settings,mode);
      let us={...active,trades:active.trades+1,
        wins:active.wins+(outcome==='WIN'?1:0),losses:active.losses+(outcome==='LOSS'?1:0),
        sPnl:active.sPnl+pnl,amStreak:am.streak,amNextStake:am.nextStake};
      const endReason=checkAntiMartingaleSessionEnd(us,mode,settings);
      if(endReason)us={...us,isActive:false,endTime:Date.now(),endReason}; // non-blocking, no isLocked

      const nextSessions=ss.sessions.map(s=>s.id===active.id?us:s);
      await saveSS({...ss,sessions:nextSessions,perMode:perModeFromSessions(nextSessions)});

      const t={id:uid(),timestamp:Date.now(),date:tod(),sessionNum:active.num,pair,direction:draftDir,
        zoneType:'',zoneGrade:'',stake,outcome,pnl,source:'QUICKLOG',screenshots:[],notes:'',
        isAnalyzed:false,accountMode:mode,offPlan:false,lockingModeAtTime:'SOFT',payoutPct:null,
        strategyId:lastStrategyId()||'zone-sd'};
      await saveTrades(prev=>[t,...(prev||[])]);

      setDraftPair('');setDraftStakeOverride('');
    }finally{setSaving(false);}
  }

  return(
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:16,color:'var(--text-primary)'}}>Quick log — {mode==='REAL'?'Real':'Demo'}</div>

      {!isAm&&<Alert type="inf" title="Anti-Martingale only" body="Quick Log is built for Anti-Martingale's escalating-stake rhythm. Switch this mode's Money Management Style in Settings, or use the Journal for Fixed Risk %."/>}
      {isAm&&!active&&<Alert type="inf" title="No active session" body="Start an Anti-Martingale session from the Dashboard to begin logging here."/>}
      {isAm&&active&&!active.isActive&&<Alert type="suc" title="Session ended" body={`Ended — ${active.endReason==='AM_PROFIT_TARGET'?'profit target reached':'loss target reached'}. Start a new session to keep logging; this table is read-only until then.`}/>}

      {isAm&&active&&(
        <div style={g3}>
          <Metric label="Balance" value={f$(bal)}/>
          <Metric label="Session P&L" value={(active.sPnl>=0?'+':'')+f$(active.sPnl)} color={active.sPnl>=0?'var(--text-success)':'var(--text-danger)'}/>
          <Metric label="Trades this session" value={`${active.wins}W / ${active.losses}L`}/>
        </div>
      )}

      <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
        <thead>
          <tr style={{fontSize:11,color:'var(--text-muted)',textAlign:'left'}}>
            <th style={{padding:'4px 6px'}}>Pair</th><th style={{padding:'4px 6px'}}>Dir</th><th style={{padding:'4px 6px'}}>Stake</th><th style={{padding:'4px 6px'}}>Outcome</th><th style={{padding:'4px 6px'}}>Balance after</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({t,balanceAfter})=>(
            <tr key={t.id} style={{cursor:'pointer',borderTop:'1px solid var(--border)'}} onClick={()=>onOpenTrade(t.id)}>
              <td style={{padding:'6px'}}>{t.pair}</td>
              <td style={{padding:'6px'}}><DirToggle value={t.direction}/></td>
              <td style={{padding:'6px'}}>{f$(t.stake)}</td>
              <td style={{padding:'6px',color:t.outcome==='WIN'?'var(--text-success)':'var(--text-danger)',fontWeight:600}}>{t.outcome}</td>
              <td style={{padding:'6px'}}>{f$(balanceAfter)}</td>
            </tr>
          ))}
          {canLog&&(
            <tr style={{borderTop:'1px solid var(--border)'}}>
              <td style={{padding:'6px'}}>
                <input list="quicklog-pairs" style={inp} value={draftPair} onChange={e=>setDraftPair(e.target.value)} placeholder="EUR/USD OTC"/>
                <datalist id="quicklog-pairs">{pairOptions.map(p=><option key={p} value={p}/>)}</datalist>
              </td>
              <td style={{padding:'6px'}}><DirToggle value={draftDir} onChange={setDraftDir}/></td>
              <td style={{padding:'6px'}}><input type="number" style={inp} value={draftStakeOverride||liveStake} onChange={e=>setDraftStakeOverride(e.target.value)}/></td>
              <td style={{padding:'6px'}}>
                <button style={btn('suc')} onClick={()=>commitRow('WIN')} disabled={saving}>W</button>{' '}
                <button style={btn('dan')} onClick={()=>commitRow('LOSS')} disabled={saving}>L</button>
              </td>
              <td style={{padding:'6px',fontSize:12}}>
                <span style={{color:'var(--text-success)'}}>{f$(bal+calcPnl(draftStake,'WIN'))}</span>
                {' / '}
                <span style={{color:'var(--text-danger)'}}>{f$(bal+calcPnl(draftStake,'LOSS'))}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
  const amNextStake=mmStyle==='ANTI_MARTINGALE'?liveAmNextStake(activeAmSession,bal,settings,mode):null;
  const amReasoning=mmStyle==='ANTI_MARTINGALE'?amStakeReasoning(activeAmSession,bal,settings,mode):null;
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
          {mmStyle==='ANTI_MARTINGALE'
            ?<Metric label="Style" value="Anti-Martingale" sub={amReasoning}/>
            :<Metric label={settings.riskMode==='FIXED'?'Fixed stake':'Risk %'} value={settings.riskMode==='FIXED'?f$(settings.riskAmount):fp(settings.riskPercent)}/>}
          <Metric label="Trade stake" value={f$(mmStyle==='ANTI_MARTINGALE'?amNextStake:stake.actual)} color="var(--text-accent)"/>
        </div>
        {mmStyle==='ANTI_MARTINGALE'&&(
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>
            {getAmMultiplierForMode(settings,mode).toFixed(1)}× multiplier per win, capped at {getAmCeilingPctForMode(settings,mode)}% of balance · ends at +{getAmProfitTargetPctForMode(settings,mode)}% or −{getAmLossTargetPctForMode(settings,mode)}% of this session's starting balance.
          </div>
        )}
        {mmStyle!=='ANTI_MARTINGALE'&&settings.riskMode!=='FIXED'&&stake.eff>settings.riskPercent*1.1&&(
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
            Real account P&L this period: <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:cur.realPnl>=0?'var(--text-success)':'var(--text-danger)'}}>{(cur.realPnl>=0?'+':'')+f$(cur.realPnl)}</span>
            {pnlDelta!=null&&<> ({pnlDelta>=0?'+':''}{f$(pnlDelta)} vs {prevLabel})</>}
          </div>
        </div>
      </div>

      {/* ── Discipline Impact ──────────────────────────────────────────── */}
      <div style={{...card,marginTop:16}}>
        <div style={{fontSize:14,fontWeight:500}}>Discipline Impact · {mode==='REAL'?'Real':'Demo'}</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Off-plan trades, counted the same way as everything else above.</div>

        <div style={g2}>
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
        <TrendChart points={pnlTrend} color={pnl>=0?'var(--text-success)':'var(--text-danger)'} />
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
// button reply (not a guess), and log each finished Q&A to Supabase — it does
// not accumulate any user "profile", each question is answered from scratch.
function Ask({trades,settings,mode,userId,strategies}){
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState('');
  const[busy,setBusy]=useState(false);
  const listRef=useRef(null);

  useEffect(()=>{
    if(!userId)return;
    supabase.from('queries').select('*').eq('user_id',userId).order('timestamp',{ascending:true})
      .then(({data})=>{
        if(!data)return;
        setMessages(data.flatMap(r=>{
          const q=fromQueryRow(r);
          return[{id:q.id+'-q',role:'user',text:q.question},{id:q.id+'-a',role:'assistant',text:q.answer}];
        }));
      });
  },[userId]);

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

  async function persistAndShow(question,text,resolvedMode){
    appendPlain(text); // show the real answer first — history logging is best-effort and must never block or corrupt it
    if(!userId)return;
    try{
      const row={id:uid(),timestamp:Date.now(),question,answer:text,mode:resolvedMode};
      const{error}=await supabase.from('queries').insert(toQueryRow(userId,row));
      if(error)console.error('Failed to log query history:',error);
    }catch(err){
      console.error('Failed to log query history:',err); // never surfaced to the user
    }
  }

  async function resolveAndAnswer(spec,question,resolvedMode){
    if(spec.intent==='OUT_OF_SCOPE'){
      await persistAndShow(question,"That's outside what I can look up in your own trade data.",resolvedMode);
      return;
    }
    if(spec.intent==='ADVICE_OR_OPINION'){
      const facts=spec.metric?computeAskFacts({...spec,mode:resolvedMode},trades,resolvedMode,strategies):null;
      const text=`I can show you the data on this, but I can't tell you what to do with it.`+(facts?` ${factsToText(facts)}`:'');
      await persistAndShow(question,text,resolvedMode);
      return;
    }
    const facts=computeAskFacts(spec,trades,resolvedMode,strategies);
    let text;
    try{text=await composeAskAnswer(question,facts,settings);}
    catch{text=factsToText(facts);} // composer call failed — still show the real, computed numbers
    // Enforced in code, not trusted to the compose prompt — same reasoning
    // as the ADVICE_OR_OPINION gate above: a boundary a model might forget
    // to restate on any given call shouldn't be the only thing enforcing it.
    if(spec.impliesAdvice)text=`${text} What to do with that is your call.`;
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

  async function handleAsk(e){
    e.preventDefault();
    const q=input.trim();
    if(!q||busy)return;
    setInput('');
    appendUser(q);
    setBusy(true);
    try{
      const spec=await classifyAskQuery(q,settings);
      if(spec.intent==='DATA_QUERY'&&spec.mode==='AMBIGUOUS'){
        appendClarify(q,spec);
        return;
      }
      await resolveAndAnswer(spec,q,spec.mode==='AMBIGUOUS'?mode:spec.mode);
    }catch(err){
      appendError(err);
    }finally{setBusy(false);}
  }
  async function handleClarify(question,spec,chosenMode){
    setBusy(true);
    try{await resolveAndAnswer(spec,question,chosenMode);}
    catch(err){appendError(err);}
    finally{setBusy(false);}
  }

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:4}}>
        <div style={{fontSize:18,fontWeight:500,color:'var(--text-primary)'}}>Ask</div>
        <button style={btn()} onClick={handleSurface} disabled={busy}><Sparkles size={14}/>Surface something interesting</button>
      </div>
      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Ask factual questions about your own logged trades — win rate, P&L, streaks, breakdowns. This looks up your data; it doesn't give advice.</div>

      <div style={{...card,padding:0,display:'flex',flexDirection:'column',height:480}}>
        <div ref={listRef} style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
          {messages.length===0&&!busy&&(
            <div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',marginTop:20}}>
              Try: "What's my win rate on Grade A zones?" or "How many trades did I take this week?"
            </div>
          )}
          {messages.map(m=>(
            <div key={m.id} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'80%'}}>
              {m.clarify?(
                <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                  <div style={{fontSize:13,color:'var(--text-primary)',marginBottom:8}}>Are you asking about your Demo or Real account?</div>
                  <div style={{display:'flex',gap:8}}>
                    <button style={btn()} onClick={()=>handleClarify(m.clarify.question,m.clarify.spec,'DEMO')} disabled={busy}>Demo</button>
                    <button style={btn('dan')} onClick={()=>handleClarify(m.clarify.question,m.clarify.spec,'REAL')} disabled={busy}>Real</button>
                  </div>
                </div>
              ):(
                <div style={{background:m.role==='user'?'var(--fill-accent)':'var(--surface-2)',color:m.role==='user'?'#fff':'var(--text-primary)',border:m.role==='user'?'none':'1px solid var(--border)',borderRadius:'var(--radius)',padding:'8px 12px',fontSize:13,whiteSpace:'pre-wrap'}}>{m.text}</div>
              )}
            </div>
          ))}
          {busy&&<div style={{alignSelf:'flex-start',fontSize:12,color:'var(--text-muted)'}}>Looking up your data…</div>}
        </div>
        <form onSubmit={handleAsk} style={{display:'flex',gap:8,padding:12,borderTop:'1px solid var(--border)'}}>
          <input style={{...inp,flex:1}} placeholder="Ask about your trades…" value={input} onChange={e=>setInput(e.target.value)} disabled={busy}/>
          <button type="submit" style={{...btn('pri'),padding:'9px 14px'}} disabled={busy||!input.trim()} aria-label="Send"><Send size={15}/></button>
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

function Cfg({settings,saveSettings,ss,resetAccount,trades,strategies,addStrategy,updateStrategy,deleteStrategy}){
  const[f,sf]=useState({...settings,tradeStyleDemo:settings?.tradeStyleDemo ?? settings?.tradeStyle ?? 1,tradeStyleReal:settings?.tradeStyleReal ?? settings?.tradeStyle ?? 1,startingBalanceDemo:settings?.startingBalanceDemo ?? 0,startingBalanceReal:settings?.startingBalanceReal ?? 0,riskMode:settings?.riskMode ?? 'PERCENT',riskAmount:settings?.riskAmount ?? 5,alertVolume:settings?.alertVolume ?? ALERT_VOLUME_DEFAULT,soundAlertOn:settings?.soundAlertOn ?? true,desktopAlertOn:settings?.desktopAlertOn ?? true,
    moneyMgmtStyleDemo:settings?.moneyMgmtStyleDemo ?? 'FIXED',moneyMgmtStyleReal:settings?.moneyMgmtStyleReal ?? 'FIXED',
    amMultiplierDemo:settings?.amMultiplierDemo ?? 2,amMultiplierReal:settings?.amMultiplierReal ?? 2,
    amCeilingPctDemo:settings?.amCeilingPctDemo ?? 20,amCeilingPctReal:settings?.amCeilingPctReal ?? 20,
    amProfitTargetPctDemo:settings?.amProfitTargetPctDemo ?? 10,amProfitTargetPctReal:settings?.amProfitTargetPctReal ?? 10,
    amLossTargetPctDemo:settings?.amLossTargetPctDemo ?? 10,amLossTargetPctReal:settings?.amLossTargetPctReal ?? 10,
    riskCalcBalance:settings?.riskCalcBalance ?? '',riskCalcTargetPct:settings?.riskCalcTargetPct ?? '',riskCalcTradesPerSession:settings?.riskCalcTradesPerSession ?? 6});
  const[saved,setSaved]=useState(false);
  const[notifPerm,setNotifPerm]=useState(typeof Notification!=='undefined'?Notification.permission:'unsupported');
  const[sessionWarn,setSessionWarn]=useState(false);
  const[includeBalances,setIncludeBalances]=useState(false);
  const[confirmReset,setConfirmReset]=useState(null); // {scope,label,body}
  const[resetDone,setResetDone]=useState(false);
  const[newStratName,setNewStratName]=useState('');
  const[newStratDesc,setNewStratDesc]=useState('');
  const[calcMode,setCalcMode]=useState('DEMO');
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const activeSession=ss?getActive(ss):null;

  async function applyMoneyMgmtStyle(mode,styleVal){
    if(activeSession)setSessionWarn(true);
    const key=mode==='REAL'?'moneyMgmtStyleReal':'moneyMgmtStyleDemo';
    const updated={...f,[key]:styleVal};
    sf(updated);
    await saveSettings({...updated,startingBalanceDemo:parseFloat(updated.startingBalanceDemo||0),startingBalanceReal:parseFloat(updated.startingBalanceReal||0)});
  }

  // Suggested risk % — display-only, never writes to riskPercent or any other
  // setting. Reuses the same win-rate math Analytics uses (wins/total*100).
  const calcDone=(trades||[]).filter(t=>getTradeMode(t)===calcMode&&t.outcome!=='PENDING');
  const calcWinRate=calcDone.length?(calcDone.filter(t=>t.outcome==='WIN').length/calcDone.length)*100:65;
  const calcModeKey=calcMode==='REAL'?'Real':'Demo';
  const calcIsAM=f[`moneyMgmtStyle${calcModeKey}`]==='ANTI_MARTINGALE';
  const calcTargetPct=parseFloat(f.riskCalcTargetPct)||(calcIsAM?parseFloat(f[`amProfitTargetPct${calcModeKey}`])||10:10);
  const calcTradesN=Math.max(1,parseFloat(f.riskCalcTradesPerSession)||6);
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

  // Never affects a session already in progress — enforcement for a running
  // session is decided by that session's own strictAtStart (stamped at
  // creation), not by re-reading this setting live. Toggling OFF while a
  // strict-mode session is currently locked only changes what the NEXT
  // session (for this mode) will do.
  async function applyStrictLocking(mode,on){
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
          <div style={f.moneyMgmtStyleDemo==='ANTI_MARTINGALE'?{opacity:0.45,pointerEvents:'none'}:undefined}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Demo account</div>
            {f.moneyMgmtStyleDemo==='ANTI_MARTINGALE'&&<p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>Disabled — Demo is on Anti-Martingale money management, which ends sessions on its own profit/loss target instead.</p>}
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
          <div style={f.moneyMgmtStyleReal==='ANTI_MARTINGALE'?{opacity:0.45,pointerEvents:'none'}:undefined}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Real account</div>
            {f.moneyMgmtStyleReal==='ANTI_MARTINGALE'&&<p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>Disabled — Real is on Anti-Martingale money management, which ends sessions on its own profit/loss target instead.</p>}
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
          <p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Used for money-management projections only — sessions no longer gate trade logging.</p>
        </div>

        {/* ── Strict Session Locking ──────────────────────────────────── */}
        <div style={{marginTop:14}}>
          <label style={lbl}>Strict Session Locking</label>
          <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>
            Off (default): reaching a stop/take-profit condition only warns you — you can still log the trade, marked off-plan.
            On: reaching it blocks the normal Journal/Analyzer flow for that session, same as the original hard lock. A separate
            "Log an off-plan trade anyway" action still lets you record a trade taken outside the lock.
          </p>
          {ACCOUNT_MODES.map(m=>{
            const key=m==='REAL'?'strictLockingReal':'strictLockingDemo';
            return(
              <label key={m} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,marginBottom:6}}>
                <input type="checkbox" checked={!!f[key]} onChange={e=>applyStrictLocking(m,e.target.checked)}/>
                {m==='REAL'?'Real':'Demo'} account
              </label>
            );
          })}
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


        {/* ── Session-lock alert ───────────────────────────────────────── */}
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

      {/* ── Money management style ──────────────────────────────────── */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Money management style</div>
        <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:12}}>
          Switchable any time — takes effect from your next trade. Anti-Martingale escalates the stake after a win (up to {AM_MAX_ESCALATIONS} steps, capped at a % of balance) and resets on any loss; it ends its own session on a profit or loss target instead of the Trade Management rules above, so that selector is disabled for whichever mode uses it.
        </p>
        <div style={g2}>
          {ACCOUNT_MODES.map(m=>{
            const key=m==='REAL'?'moneyMgmtStyleReal':'moneyMgmtStyleDemo';
            const modeLabel=m==='REAL'?'Real':'Demo';
            return(
              <div key={m}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>{modeLabel} account</div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  {[{id:'FIXED',label:'Fixed Risk %'},{id:'ANTI_MARTINGALE',label:'Anti-Martingale'}].map(o=>(
                    <button key={o.id} style={{...btn(f[key]===o.id?'pri':'def'),flex:1,fontSize:12}} onClick={()=>applyMoneyMgmtStyle(m,o.id)}>{o.label}</button>
                  ))}
                </div>
                {f[key]==='ANTI_MARTINGALE'&&(
                  <div style={{padding:10,borderRadius:'var(--radius)',border:'1px solid var(--border)',background:'var(--surface-0)'}}>
                    <label style={lbl}>Multiplier: {(f[`amMultiplier${modeLabel}`]??2).toFixed(1)}×</label>
                    <input type="range" min="1.2" max="3" step="0.1" value={f[`amMultiplier${modeLabel}`]??2} onChange={e=>set(`amMultiplier${modeLabel}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
                    <label style={{...lbl,marginTop:8}}>Ceiling: {f[`amCeilingPct${modeLabel}`]??20}% of balance</label>
                    <input type="range" min="5" max="50" step="1" value={f[`amCeilingPct${modeLabel}`]??20} onChange={e=>set(`amCeilingPct${modeLabel}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
                    <label style={{...lbl,marginTop:8}}>Profit target: {f[`amProfitTargetPct${modeLabel}`]??10}% of session start balance</label>
                    <input type="range" min="1" max="50" step="1" value={f[`amProfitTargetPct${modeLabel}`]??10} onChange={e=>set(`amProfitTargetPct${modeLabel}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
                    <label style={{...lbl,marginTop:8}}>Loss target: {f[`amLossTargetPct${modeLabel}`]??10}% of session start balance</label>
                    <input type="range" min="1" max="50" step="1" value={f[`amLossTargetPct${modeLabel}`]??10} onChange={e=>set(`amLossTargetPct${modeLabel}`,parseFloat(e.target.value))} style={{width:'100%'}}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggested risk % — computes and displays only, never writes to riskPercent or any setting. */}
        <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:8}}>Suggested risk % calculator</div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            {ACCOUNT_MODES.map(m=>(
              <button key={m} style={{...btn(calcMode===m?'pri':'def'),flex:1,fontSize:12}} onClick={()=>setCalcMode(m)}>{m==='REAL'?'Real':'Demo'}</button>
            ))}
          </div>
          <div style={g2}>
            <div><label style={lbl}>Balance ($, optional — for the $ estimate below)</label><input style={inp} type="number" min="0" placeholder="e.g. 500" value={f.riskCalcBalance} onChange={e=>set('riskCalcBalance',e.target.value)}/></div>
            <div><label style={lbl}>Session profit target (%)</label><input style={inp} type="number" min="0.1" step="0.5" placeholder={String(calcIsAM?(f[`amProfitTargetPct${calcModeKey}`]??10):10)} value={f.riskCalcTargetPct} onChange={e=>set('riskCalcTargetPct',e.target.value)}/></div>
          </div>
          <div style={{marginTop:8}}><label style={lbl}>Trades per session (est.)</label><input style={inp} type="number" min="1" step="1" value={f.riskCalcTradesPerSession} onChange={e=>set('riskCalcTradesPerSession',e.target.value)}/></div>
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
            To reach {calcTargetPct}% target from ~{calcTradesN} trades/session at {calcWinRate.toFixed(0)}% win rate ({calcDone.length} {calcModeKey} trade{calcDone.length===1?'':'s'} on record, defaults to 65% with none), ~{calcSuggestedRisk}% risk per trade keeps drawdown risk moderate. This is a simple heuristic, not a guarantee.
            {calcIsAM&&<> {calcModeKey} is on Anti-Martingale — this sets the <em>base</em> stake size only (what escalation resets to after a loss); it has no effect on the profit/loss session-ending targets in the section above.</>}
          </p>
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
          <div style={g2}>
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
    {icon:ScanSearch,title:'AI Zone Analyzer',desc:'Upload a chart screenshot and let AI validate your supply/demand zone against 10 strict structural gates, 4 of them hard filters, before you enter a trade.'},
    {icon:BookOpen,title:'Trade Journal',desc:'Log every trade with screenshots, notes, trade grades, and outcomes. Track your execution quality over time.'},
    {icon:BarChart3,title:'Performance Analytics',desc:'Win rate with a real confidence interval, by trade grade, strategy, pair, and account mode — plus an auto-generated weekly/monthly Review digest, no manual entry.'},
    {icon:Wallet,title:'Money Management',desc:'Risk sizing as a percent of balance or a fixed dollar amount, overridable per trade, with milestone-based withdrawal tracking and growth projection.'},
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
    {n:'01',icon:ScanSearch,title:'Analyze',desc:'Upload your chart. AI evaluates the zone against 10 strict gates, 4 of them hard filters, and returns a grade.'},
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
  const[strategies,setStrategies]=useState([]);
  const[ss,setSS]=useState(null);
  const[view,setView]=useState(()=>sessionStorage.getItem('gm_view')||'dashboard');
  // Quick Log row click → Journal's own Detail/Edit modal, by trade id.
  const[jumpToTradeId,setJumpToTradeId]=useState(null);
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
      let amStreak=0,amNextStake=amStyle==='ANTI_MARTINGALE'?amBaseStake(sess.startBalance??0,settings):null;
      let runningBal=sess.startBalance??0;
      let w=0,l=0,tc=0,cl=0,cw=0,sp=0;
      for(const t of sessionTrades){
        if(t.outcome==='PENDING'){tc++;continue;}
        tc++;
        if(t.outcome==='WIN'){w++;cw++;cl=0;}
        if(t.outcome==='LOSS'){l++;cl++;cw=0;}
        sp+=t.pnl||0;
        if(amStyle==='ANTI_MARTINGALE'){
          runningBal+=t.pnl||0;
          const am=advanceAntiMartingale({streak:amStreak,nextStake:amNextStake},t.outcome,runningBal,settings,sess.accountMode);
          amStreak=am.streak;amNextStake=am.nextStake;
        }
      }
      const nl=Math.max(0,l-w);
      const rebuilt={...sess,trades:tc,wins:w,losses:l,conLoss:cl,conWin:cw,netLoss:nl,sPnl:sp,
        ...(amStyle==='ANTI_MARTINGALE'?{amStreak,amNextStake}:{})};
      // Use the last resolved trade's timestamp as endTime so the 6h
      // session gap is measured from when trading actually stopped,
      // not from when this reconciliation runs.
      const lastTrade=sessionTrades.filter(t=>t.outcome!=='PENDING').pop();
      const endTime=lastTrade?lastTrade.timestamp:Date.now();
      if(amStyle==='ANTI_MARTINGALE'){
        // No chkLock/Strict Locking replay here — Trade Management stop
        // rules don't apply to Anti-Martingale sessions.
        const endReason=checkAntiMartingaleSessionEnd(rebuilt,sess.accountMode,settings);
        if(endReason){changed=true;return{...rebuilt,isActive:false,endTime,endReason};}
        // A trade delete can leave streak/next-stake stale even with no end
        // event (e.g. an escalation trade removed) — still worth persisting.
        if(rebuilt.amStreak!==(sess.amStreak||0)||rebuilt.amNextStake!==sess.amNextStake){changed=true;return rebuilt;}
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
  if(!authUser)return page==='login'?<Login onBack={()=>setPage('landing')}/>:<Landing onLogin={()=>setPage('login')}/>;
  if(loading)return<Loading/>;
  if(!settings?.setupComplete)return<Setup onDone={saveSettings}/>;

  const nav=[
    {id:'dashboard',icon:LayoutDashboard,label:'Dashboard'},
    {id:'analyzer',icon:ScanSearch,label:'Zone analyzer'},
    {id:'journal',icon:BookOpen,label:'Journal',badge:pending},
    // Only relevant while Anti-Martingale is this mode's active Money
    // Management Style — same gate QuickLog's own "Anti-Martingale only"
    // alert uses, so the nav entry and the page content never disagree.
    ...(getMoneyMgmtStyleForMode(settings,mode)==='ANTI_MARTINGALE'?[{id:'quicklog',icon:Zap,label:'Quick log'}]:[]),
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
            {view==='journal'&&<Journal settings={settings} trades={trades} saveTrades={saveTrades} deleteTrade={deleteTrade} ss={todaySS} saveSS={saveSS} pa={pa} setPA={setPA} wds={wds} mode={mode} userId={authUser?.id} strategies={strategies} openTradeId={jumpToTradeId} onConsumedJump={()=>setJumpToTradeId(null)}/>}
            {view==='quicklog'&&<QuickLog settings={settings} trades={trades} saveTrades={saveTrades} ss={todaySS} saveSS={saveSS} wds={wds} mode={mode} strategies={strategies} onOpenTrade={id=>{setJumpToTradeId(id);setView('journal');}}/>}
            {view==='money'&&<Money settings={settings} trades={trades} wds={wds} saveWds={saveWds} mode={mode} ss={todaySS}/>}
            {view==='plan'&&<Plan settings={settings}/>}
            {view==='analytics'&&<Analytics trades={trades} analyses={analyses} settings={settings} bal={bal} wds={wds} strategies={strategies}/>}
            {view==='ask'&&<Ask trades={trades} settings={settings} mode={mode} userId={authUser?.id} strategies={strategies}/>}
            {view==='settings'&&<Cfg settings={settings} saveSettings={saveSettings} ss={todaySS} resetAccount={resetAccount} trades={trades} strategies={strategies} addStrategy={addStrategy} updateStrategy={updateStrategy} deleteStrategy={deleteStrategy}/>}
          </div>

          {/* Rendered once here (not inside Dashboard) so it's never unmounted by navigation. */}
          <audio ref={music.audioRef} src={music.track?.audio} onEnded={music.next} onError={music.next}/>
          {active&&view!=='dashboard'&&<MusicWidget music={music}/>}
        </main>
      </div>
    </div>
  );
}
