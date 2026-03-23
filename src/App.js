import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════ */
const SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbzA7veSkLtnIlRyiD0VchIKy7nZfAFXB5SQ2rQJzl6zCLbqnC3Q74VABqX0TE3gZUrMbw/exec";

// Storage key prefix for localStorage persistence
const STORAGE_KEY = "xai_study_";

/* ═══════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════ */
const T = {
  bg: "#ece2d0", bgAlt: "#e3d7c2", card: "#f5ede0", cardBorder: "#d4c8b0",
  dark: "#2c2418", text: "#3d3327", textMuted: "#7a6e5e", textFaint: "#a89b89",
  accent: "#b65e48", accentAlt: "#8b5e3c", cool: "#4a7c72", warn: "#c49a2a",
  danger: "#a63d2f", success: "#4a7c52",
};
const mono = "'IBM Plex Mono', 'Courier New', monospace";
const serif = "'Source Serif 4', 'Georgia', serif";

/* ═══════════════════════════════════════════
   GAME ECONOMY
   ═══════════════════════════════════════════ */
const COLORS = ["green", "yellow", "orange", "pink", "blue", "purple"];
const COLOR_HEX = { green: "#5a8a5e", yellow: "#d4a843", orange: "#d4783a", pink: "#c4627a", blue: "#4a7c8a", purple: "#7d5e8a" };
const POINTS = { green: 1, yellow: 3, orange: 6, pink: 15, blue: 30, purple: 75 };
const START_INV = { green: 5, yellow: 5, orange: 3, pink: 1, blue: 0, purple: 0 };
const GAME_DURATION = 30 * 60;
const DISRUPTION_TIME = 12 * 60;

/* ═══════════════════════════════════════════
   CAMPUS CONFIGURATION
   ═══════════════════════════════════════════
*/

// Average steps per minute (normal walking pace ~100 steps/min)
const STEPS_PER_MIN = 100;

const SHOPS_BASE = [
  {
    id: "gallery", name: "Gallery", tag: "A", specialty: "green", location: "Entrance hall",
    desc: "Trading post",
    x: 25, y: 30,
    freePickup: null,
    trades: [
      { give: { green: 3 }, receive: { orange: 1 }, label: "3 Green → 1 Orange" },
      { give: { yellow: 2, green: 2 }, receive: { pink: 1 }, label: "2 Yellow + 2 Green → 1 Pink" },
      { give: { blue: 1 }, receive: { pink: 2, yellow: 1 }, label: "1 Blue → 2 Pink + 1 Yellow" },
    ],
    tradesDisrupted: [
      { give: { green: 2 }, receive: { orange: 1 }, label: "2 Green → 1 Orange" },
      { give: { yellow: 3, green: 2 }, receive: { pink: 1 }, label: "3 Yellow + 2 Green → 1 Pink" },
      { give: { blue: 1 }, receive: { pink: 3, yellow: 1 }, label: "1 Blue → 3 Pink + 1 Yellow" },
    ],
  },
  {
    id: "montreal", name: "Gallery Staircase", tag: "B", specialty: "pink", location: "Top of the main staircase",
    desc: "Trading post",
    x: 18, y: 10,
    freePickup: { green: 2, label: "+2 free Green on first trade" },
    trades: [
      { give: { orange: 2 }, receive: { pink: 1 }, label: "2 Orange → 1 Pink" },
      { give: { green: 3, yellow: 1 }, receive: { orange: 1 }, label: "3 Green + 1 Yellow → 1 Orange" },
      { give: { pink: 1, green: 1 }, receive: { orange: 2 }, label: "1 Pink + 1 Green → 2 Orange" },
    ],
    tradesDisrupted: [
      { give: { orange: 3 }, receive: { pink: 1 }, label: "3 Orange → 1 Pink" },
      { give: { green: 3, yellow: 1 }, receive: { orange: 1 }, label: "3 Green + 1 Yellow → 1 Orange" },
      { give: { pink: 1, green: 1 }, receive: { orange: 3 }, label: "1 Pink + 1 Green → 3 Orange" },
    ],
  },
  {
    id: "starbucks", name: "Starbucks", tag: "C", specialty: "blue", location: null,
    desc: "Trading post",
    x: 88, y: 55,
    freePickup: null,
    trades: [
      { give: { pink: 1, orange: 2 }, receive: { blue: 1 }, label: "1 Pink + 2 Orange → 1 Blue" },
      { give: { pink: 2, blue: 1 }, receive: { purple: 1 }, label: "2 Pink + 1 Blue → 1 Purple" },
      { give: { orange: 1, yellow: 1 }, receive: { green: 3 }, label: "1 Orange + 1 Yellow → 3 Green" },
    ],
    tradesDisrupted: [
      { give: { pink: 1, orange: 1 }, receive: { blue: 1 }, label: "1 Pink + 1 Orange → 1 Blue" },
      { give: { pink: 3, blue: 1 }, receive: { purple: 1 }, label: "3 Pink + 1 Blue → 1 Purple" },
      { give: { orange: 1, yellow: 1 }, receive: { green: 3 }, label: "1 Orange + 1 Yellow → 3 Green" },
    ],
  },
  {
    id: "computing129", name: "Computing 129", tag: "D", specialty: "yellow", location: null,
    desc: "Trading post",
    x: 60, y: 75,
    freePickup: null,
    trades: [
      { give: { yellow: 2 }, receive: { orange: 1 }, label: "2 Yellow → 1 Orange" },
      { give: { yellow: 3, green: 1 }, receive: { pink: 1 }, label: "3 Yellow + 1 Green → 1 Pink" },
      { give: { pink: 1, orange: 1, yellow: 2 }, receive: { blue: 1 }, label: "1 Pink + 1 Orange + 2 Yellow → 1 Blue" },
    ],
    tradesDisrupted: [
      { give: { yellow: 2 }, receive: { orange: 1 }, label: "2 Yellow → 1 Orange" },
      { give: { yellow: 2, green: 1 }, receive: { pink: 1 }, label: "2 Yellow + 1 Green → 1 Pink" },
      { give: { pink: 1, orange: 2, yellow: 2 }, receive: { blue: 1 }, label: "1 Pink + 2 Orange + 2 Yellow → 1 Blue" },
    ],
  },
  {
    id: "librarypods", name: "Library Pods", tag: "E", specialty: "orange", location: "Top floor of library",
    desc: "Trading post",
    x: 35, y: 55,
    freePickup: null,
    freePickupDisrupted: { orange: 1, label: "+1 free Orange on first trade" },
    trades: [
      { give: { green: 4, yellow: 3 }, receive: { pink: 1, orange: 1 }, label: "4 Green + 3 Yellow → 1 Pink + 1 Orange" },
      { give: { yellow: 2, orange: 1 }, receive: { pink: 1 }, label: "2 Yellow + 1 Orange → 1 Pink" },
      { give: { green: 3 }, receive: { yellow: 2 }, label: "3 Green → 2 Yellow" },
    ],
    tradesDisrupted: [
      { give: { green: 3, yellow: 2 }, receive: { pink: 1, orange: 1 }, label: "3 Green + 2 Yellow → 1 Pink + 1 Orange" },
      { give: { yellow: 3, orange: 1 }, receive: { pink: 1 }, label: "3 Yellow + 1 Orange → 1 Pink" },
      { give: { green: 3 }, receive: { yellow: 2 }, label: "3 Green → 2 Yellow" },
    ],
  },
];

/* ═══════════════════════════════════════════
   DISTANCE MATRIX (in steps)
   ═══════════════════════════════════════════ */
const DISTANCES = {
  "start→gallery":     250,
  "start→montreal":     280,
  "start→starbucks":  140,
  "start→computing129":    20,
  "start→librarypods":  400,
  "gallery→montreal":     30,
  "gallery→starbucks":  150,
  "gallery→computing129":    310,
  "gallery→librarypods":  200,
  "montreal→starbucks":  250,
  "montreal→computing129":    330,
  "montreal→librarypods":  130,
  "starbucks→computing129":  160,
  "starbucks→librarypods": 250,
  "computing129→librarypods":  420,
};

// Lookup steps between two shops (works in either direction)
function stepsBetween(a, b) {
  if (!a || !b) return 200; // default for first move (from start)
  if (a.id === b.id) return 0;
  const key1 = `${a.id}→${b.id}`;
  const key2 = `${b.id}→${a.id}`;
  return DISTANCES[key1] || DISTANCES[key2] || 300; // fallback
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
// Walk time in minutes between two shops
function walkMins(a, b) {
  return Math.max(1, Math.round(stepsBetween(a, b) / STEPS_PER_MIN));
}
function totalPoints(inv) {
  return COLORS.reduce((s, c) => s + (inv[c] || 0) * POINTS[c], 0);
}
function canAfford(inv, cost) {
  return Object.entries(cost).every(([c, n]) => (inv[c] || 0) >= n);
}
function doTradeCalc(inv, trade) {
  const ni = { ...inv };
  Object.entries(trade.give).forEach(([c, n]) => (ni[c] -= n));
  Object.entries(trade.receive).forEach(([c, n]) => (ni[c] = (ni[c] || 0) + n));
  return ni;
}

/* ═══════════════════════════════════════════
   PERSISTENCE — localStorage wrappers
   ═══════════════════════════════════════════ */
function saveState(key, value) {
  try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(value)); } catch (e) { /* no-op in artifact */ }
}
function loadState(key, fallback) {
  try {
    const v = localStorage.getItem(STORAGE_KEY + key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function clearState() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY)).forEach(k => localStorage.removeItem(k));
  } catch (e) { /* no-op */ }
}

/* ═══════════════════════════════════════════
   GOOGLE SHEETS SUBMISSION
   ═══════════════════════════════════════════ */
async function submitToSheets(data) {
  if (SHEETS_WEBHOOK === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
    console.log("Sheets webhook not configured. Data:", data);
    return { ok: false, reason: "not_configured" };
  }
  try {
    // Google Apps Script requires no-cors mode; response is opaque but data is received
    await fetch(SHEETS_WEBHOOK, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // If fetch didn't throw, data was sent successfully
    return { ok: true };
  } catch (e) {
    console.error("Sheets submit error:", e);
    return { ok: false, reason: "network_error" };
  }
}

/* ═══════════════════════════════════════════
   URL PARAM PARSING
   ═══════════════════════════════════════════ */
function getUrlGroup() {
  try {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("group");
    if (g && ["blackbox", "xai", "human"].includes(g)) return g;
    return null;
  } catch (e) { return null; }
}
function getUrlPid() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("pid") || "";
  } catch (e) { return ""; }
}

// Get the active free pickup for a shop (some only appear post-disruption)
function getShopPickup(shop, disrupted) {
  if (disrupted && shop.freePickupDisrupted !== undefined) return shop.freePickupDisrupted;
  return shop.freePickup;
}

/* ═══════════════════════════════════════════
   AI ROUTE PLANNER — Distance-aware
   Optimises for points-per-minute, not just
   raw point gain. Factors in walk time to
   each shop from current position.
   ═══════════════════════════════════════════ */
function planRoute(inv, shops, disrupted, lastShop, collected, timeRemainingSec, usedTradesSet) {
  const startInv = { ...inv };
  const initPickups = new Set(collected || []);
  const initUsedTrades = new Set(usedTradesSet || []);
  const timeLeft = (timeRemainingSec || GAME_DURATION) / 60;

  let bestScore = totalPoints(startInv);
  let bestPath = [];

  // Brute-force search (~0.4M paths, <200ms)
  function search(current, prevShop, pickups, usedTrades, path, tl) {
    const pts = totalPoints(current);
    // Prefer higher score; tiebreak: fewer steps = cleaner route
    if (pts > bestScore || (pts === bestScore && path.length < bestPath.length)) {
      bestScore = pts;
      bestPath = [...path];
    }
    if (path.length >= 10 || tl <= 1) return;
    if (pts + (tl * 6) < bestScore) return; // prune

    for (const s of shops) {
      // Only constraint: no consecutive same shop
      if (prevShop && s.id === prevShop.id) continue;

      const trades = (disrupted && s.tradesDisrupted) ? s.tradesDisrupted : s.trades;
      const walkTime = Math.max(1, stepsBetween(prevShop, s) / STEPS_PER_MIN);
      if (walkTime + 2 > tl) continue;

      const pk = (!pickups.has(s.id) && getShopPickup(s, disrupted)) ? getShopPickup(s, disrupted) : null;

      for (const trade of trades) {
        const tradeKey = `${s.id}:${trade.label}`;
        if (usedTrades.has(tradeKey)) continue;
        if (!canAfford(current, trade.give)) continue;

        let after = doTradeCalc(current, trade);
        if (pk) {
          after = { ...after };
          Object.entries(pk).forEach(([c, n]) => { if (c !== "label") after[c] = (after[c] || 0) + n; });
        }
        const gain = totalPoints(after) - totalPoints(current);
        if (gain < -8) continue;

        const nt = new Set(usedTrades); nt.add(tradeKey);
        const np = new Set(pickups); if (pk) np.add(s.id);

        search(after, s, np, nt, [...path, {
          shop: s, trade, gain, after, hasPickup: !!pk,
          totalTime: walkTime + 2,
        }], tl - (walkTime + 2));
      }
    }
  }

  search(startInv, lastShop, initPickups, initUsedTrades, [], timeLeft);

  // Build XAI reasoning for each step
  const routeSteps = [];
  let timeRemaining = timeLeft;
  const purpleViable = !disrupted;

  for (const step of bestPath) {
    timeRemaining -= step.totalTime;
    const timeLeftRounded = Math.round(timeRemaining);
    const pickupNote = step.hasPickup ? ` You'll also receive bonus balls on your first trade here.` : ``;
    const timeNote = timeLeftRounded <= 5 ? ` Time is running low — ${timeLeftRounded} min left.` : ``;

    const giveTotal = Object.entries(step.trade.give).reduce((s, [c, n]) => s + n * POINTS[c], 0);
    const receiveTotal = Object.entries(step.trade.receive).reduce((s, [c, n]) => s + n * POINTS[c], 0);
    const netGain = receiveTotal - giveTotal;

    let why;
    if (step.trade.receive.purple) {
      why = `This is the highest-value trade in the game. Converting your Pink and Blue into Purple is the endgame payoff.`;
    } else if (step.trade.receive.blue && !step.trade.give.blue) {
      why = purpleViable
        ? `Building towards Blue (${POINTS.blue}pts) opens up the Purple conversion later.`
        : `Blue is worth ${POINTS.blue}pts. Since market changes made Purple less viable, stacking Blue is now the best strategy.`;
    } else if (step.trade.give.blue) {
      why = purpleViable
        ? `Breaking Blue into Pink gives you flexibility — the Pink can be used towards Purple.`
        : `Since market changes, breaking Blue into Pink is very profitable at the improved rate.`;
    } else if (step.hasPickup && step.gain > netGain) {
      why = `The first-trade bonus here adds extra balls, making this trade worth more than it appears.`;
    } else if (netGain >= 7) {
      why = `High-value conversion — you gain +${netGain} points from the trade itself.`;
    } else if (netGain >= 3) {
      why = `A solid trade that moves your resources up the value chain.`;
    } else if (netGain <= 0) {
      why = `This converts your resources into colours needed for a more valuable trade next.`;
    } else {
      why = `A small positive trade that builds towards bigger conversions.`;
    }

    routeSteps.push({
      shop: step.shop,
      trade: step.trade,
      reason: `${step.shop.name} — ${step.trade.label} (+${step.gain}pts). ${why}${pickupNote}${timeNote}`,
      pointsAfter: totalPoints(step.after),
    });
  }

  const finalInv = bestPath.length > 0 ? bestPath[bestPath.length - 1].after : startInv;
  return { steps: routeSteps, finalPoints: totalPoints(finalInv), finalInv };
}

/* ═══════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════ */
const cardStyle = {
  background: T.card, border: `1px solid ${T.cardBorder}`,
  borderRadius: 3, padding: "20px 24px", marginBottom: 14,
};
const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2,
  color: T.textFaint, fontFamily: mono, marginBottom: 10,
};

const Ball = ({ color, size = 18 }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: COLOR_HEX[color], border: `2px solid ${T.bgAlt}`,
    boxShadow: `inset 0 -2px 3px rgba(0,0,0,0.15)`, flexShrink: 0,
  }} />
);

const Tag = ({ children, color }) => (
  <span style={{
    display: "inline-block", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1.5,
    color: color || T.accent, background: `${color || T.accent}18`,
    border: `1px solid ${color || T.accent}33`,
    padding: "3px 10px", borderRadius: 2, fontFamily: mono,
  }}>{children}</span>
);

function Btn({ children, onClick, disabled, color, full, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "transparent" : (color || T.dark),
      color: disabled ? T.textFaint : T.bg,
      border: `1.5px solid ${disabled ? T.cardBorder : (color || T.dark)}`,
      borderRadius: 2,
      padding: small ? "10px 18px" : "14px 28px",
      fontSize: small ? 13 : 15, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: mono, transition: "all 0.15s", letterSpacing: 0.5,
      width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1,
      minHeight: 48, // mobile touch target
    }}>{children}</button>
  );
}

function Inventory({ inv, showPoints, cond, flash }) {
  const pts = totalPoints(inv);
  const showTotal = showPoints && cond === "xai";
  return (
    <div style={{
      ...cardStyle,
      transition: "all 0.3s ease",
      boxShadow: flash ? `0 0 0 3px ${T.cool}66` : "none",
      borderColor: flash ? T.cool : T.cardBorder,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={labelStyle}>Your Collection {flash && <span style={{ color: T.cool, fontSize: 11 }}>✓ Updated</span>}</div>
        {showTotal && <Tag color={T.warn}>{pts} points</Tag>}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {COLORS.map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Ball color={c} />
            <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: T.dark }}>{inv[c]}</span>
            <span style={{ fontSize: 13, color: T.textMuted }}>{c}</span>
            {showPoints && <span style={{ fontSize: 11, color: T.textFaint, fontFamily: mono }}>({POINTS[c]}pt)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Timer({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const urgent = seconds < 300;
  return (
    <div style={{
      fontFamily: mono, fontSize: 32, fontWeight: 700, textAlign: "center",
      color: urgent ? T.danger : T.dark, letterSpacing: 2, padding: "8px 0",
    }}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

function CampusMap({ shops, currentShop, route, onShopClick, disrupted, cond }) {
  return (
    <div style={{
      ...cardStyle, position: "relative", height: 350, overflow: "hidden",
      background: T.bgAlt, touchAction: "manipulation",
    }}>
      <div style={labelStyle}>Campus Map</div>
      {/* Campus map image — place campus-map.png in the /public folder */}
      <img
        src="/campus-map.png"
        alt="Campus map"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 0.6, pointerEvents: "none",
        }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
      {route && route.length > 1 && route.map((step, i) => {
        if (i === 0) return null;
        const prev = route[i - 1].shop;
        const cur = step.shop;
        return (
          <svg key={i} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <line x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${cur.x}%`} y2={`${cur.y}%`}
              stroke={T.accent} strokeWidth={2} strokeDasharray="6,4" opacity={0.5} />
            {cond === "xai" && (
              <text x={`${(prev.x + cur.x) / 2}%`} y={`${(prev.y + cur.y) / 2 - 2}%`}
                fill={T.textMuted} fontSize={10} fontFamily={mono} textAnchor="middle">
                ~{walkMins(prev, cur)}m
              </text>
            )}
          </svg>
        );
      })}
      {shops.map((shop) => {
        const isCurrent = currentShop?.id === shop.id;
        const isDisrupted = disrupted && shop.tradesDisrupted;
        return (
          <button key={shop.id} onClick={() => onShopClick(shop)} style={{
            position: "absolute", left: `${shop.x}%`, top: `${shop.y}%`,
            transform: "translate(-50%, -50%)", cursor: "pointer",
            background: isCurrent ? T.dark : T.card,
            border: `2px solid ${isDisrupted && cond === "xai" ? T.danger : isCurrent ? T.dark : T.cardBorder}`,
            borderRadius: 3, padding: "8px 14px",
            fontFamily: mono, fontSize: 13, fontWeight: 700,
            color: isCurrent ? T.bg : T.dark,
            transition: "all 0.15s", zIndex: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            minWidth: 48, minHeight: 48, // mobile touch target
          }}>
            {shop.tag}
            <div style={{ fontSize: 9, fontWeight: 400, color: isCurrent ? T.bgAlt : T.textMuted, whiteSpace: "nowrap" }}>
              {shop.name}
            </div>
            {isDisrupted && cond === "xai" && <div style={{ fontSize: 8, color: T.danger }}>RATES CHANGED</div>}
          </button>
        );
      })}
    </div>
  );
}

function LikertQuestion({ question, value, onChange }) {
  return (
    <div style={cardStyle}>
      <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.6, color: T.text }}>{question}</p>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 44, height: 44, borderRadius: 2,
            background: value === n ? T.dark : "transparent",
            border: `1.5px solid ${value === n ? T.dark : T.cardBorder}`,
            color: value === n ? T.bg : T.textMuted,
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: mono, transition: "all 0.1s",
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: T.textFaint, fontFamily: mono }}>Strongly disagree</span>
        <span style={{ fontSize: 10, color: T.textFaint, fontFamily: mono }}>Strongly agree</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
const LIKERT_QUESTIONS = [
  { id: "trust", dim: "Trust", text: "I trusted the guidance/process I received during the game." },
  { id: "understanding", dim: "Understanding", text: "I understood why trades were being suggested/chosen." },
  { id: "control", dim: "Control", text: "I felt in control of my decisions throughout the game." },
  { id: "satisfaction", dim: "Satisfaction", text: "I am satisfied with my final score." },
  { id: "cognitive_load", dim: "Cognitive Load", text: "I found it mentally demanding to decide which trades to make." },
  { id: "optimality", dim: "Calibration", text: "I believe the route I took maximised my final score." },
  { id: "willingness", dim: "Willingness", text: "I would be comfortable relying on a similar system for important decisions in the future." },
];

const MULTI_CHOICE_QUESTIONS_AI = [
  { id: "emotion_during", dim: "Emotional", text: "Which best describes how you felt during the game?",
    options: ["Confident", "Uncertain", "Frustrated", "Calm", "Overwhelmed"], multi: true },
  { id: "emotion_disruption", dim: "Emotional", text: "How did you feel when the trade rates changed at 12 minutes?",
    options: ["Stressed", "Curious", "Confused", "Unfazed", "Panicked"], multi: true },
  { id: "clarity", dim: "Understanding", text: "How clear was it to you why each trade was being recommended?",
    options: ["Very clear", "Somewhat clear", "Not very clear", "Not at all clear"], multi: false },
];

const MULTI_CHOICE_QUESTIONS_HUMAN = [
  { id: "emotion_during", dim: "Emotional", text: "Which best describes how you felt during the game?",
    options: ["Confident", "Uncertain", "Frustrated", "Calm", "Overwhelmed"], multi: true },
  { id: "emotion_disruption", dim: "Emotional", text: "How did you feel when the trade rates changed at 12 minutes?",
    options: ["Stressed", "Curious", "Confused", "Unfazed", "Panicked"], multi: true },
  { id: "clarity", dim: "Understanding", text: "How clear was your overall strategy throughout the game?",
    options: ["Very clear", "Somewhat clear", "Not very clear", "Not at all clear"], multi: false },
];

const FREE_TEXT_QUESTIONS_AI = [
  { id: "disagree", dim: "Trust + Behaviour", text: "Did you ever disagree with the AI's suggestion? If so, what did you do and why?" },
  { id: "confusion", dim: "Understanding", text: "Was there any point where you were confused about what to do next? Describe what happened." },
  { id: "improvement", dim: "Overall", text: "If you could change anything about the guidance you received, what would it be?" },
];

const FREE_TEXT_QUESTIONS_HUMAN = [
  { id: "strategy", dim: "Trust + Behaviour", text: "How did you decide which shops to visit and in what order?" },
  { id: "confusion", dim: "Understanding", text: "Was there any point where you were confused about what to do next? Describe what happened." },
  { id: "improvement", dim: "Overall", text: "If you could change anything about the information you received (or didn't receive), what would it be?" },
];

export default function App() {
  // URL params
  const urlGroup = useRef(getUrlGroup());
  const urlPid = useRef(getUrlPid());

  // Core state — loaded from localStorage if available
  const [phase, setPhase] = useState(() => loadState("phase", "intro"));
  const [cond, setCond] = useState(() => loadState("cond", urlGroup.current));
  const [pid, setPid] = useState(() => loadState("pid", urlPid.current || ""));
  const [inv, setInv] = useState(() => loadState("inv", { ...START_INV }));
  const [timer, setTimer] = useState(() => loadState("timer", GAME_DURATION));
  const [timerActive, setTimerActive] = useState(false);
  const [disrupted, setDisrupted] = useState(() => loadState("disrupted", false));
  const [currentShop, setCurrentShop] = useState(null);
  const [route, setRoute] = useState(null);
  const [tradeLog, setTradeLog] = useState(() => loadState("tradeLog", []));
  const [finalSurvey, setFinalSurvey] = useState(() => loadState("finalSurvey", {}));
  const [multiChoice, setMultiChoice] = useState(() => loadState("multiChoice", {}));
  const [freeTexts, setFreeTexts] = useState(() => loadState("freeTexts", {}));
  const [collectedPickups, setCollectedPickups] = useState(() => loadState("collectedPickups", []));
  const [usedTrades, setUsedTrades] = useState(() => loadState("usedTrades", []));
  const [showDisruptionAlert, setShowDisruptionAlert] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [tradeFeedback, setTradeFeedback] = useState(false);
  const timerRef = useRef(null);
  const [startedAt, setStartedAt] = useState(() => loadState("startedAt", null));

  // Scroll to top helper
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Auto-scroll on phase change
  useEffect(() => { scrollToTop(); }, [phase]);

  // Persist state on every change
  useEffect(() => { saveState("phase", phase); }, [phase]);
  useEffect(() => { saveState("cond", cond); }, [cond]);
  useEffect(() => { saveState("pid", pid); }, [pid]);
  useEffect(() => { saveState("inv", inv); }, [inv]);
  useEffect(() => { saveState("timer", timer); }, [timer]);
  useEffect(() => { saveState("disrupted", disrupted); }, [disrupted]);
  useEffect(() => { saveState("tradeLog", tradeLog); }, [tradeLog]);
  useEffect(() => { saveState("finalSurvey", finalSurvey); }, [finalSurvey]);
  useEffect(() => { saveState("multiChoice", multiChoice); }, [multiChoice]);
  useEffect(() => { saveState("freeTexts", freeTexts); }, [freeTexts]);
  useEffect(() => { saveState("collectedPickups", collectedPickups); }, [collectedPickups]);
  useEffect(() => { saveState("usedTrades", usedTrades); }, [usedTrades]);
  useEffect(() => { saveState("startedAt", startedAt); }, [startedAt]);

  // On mount: if we have a startedAt and are in a playing phase, recalculate timer
  useEffect(() => {
    if (startedAt && (phase === "playing" || phase === "playing2")) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimer(remaining);
      if (remaining > 0) setTimerActive(true);
      else setPhase("finalSurvey");
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          const nt = t - 1;
          if (nt <= 0) { setTimerActive(false); setPhase("finalSurvey"); return 0; }
          return nt;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timerActive]);

  // Disruption check
  useEffect(() => {
    if (!startedAt) return;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed >= DISRUPTION_TIME && !disrupted && (phase === "playing" || phase === "playing2")) {
      setDisrupted(true);
      setShowDisruptionAlert(true);
      recomputeRoute(inv);
    }
  }, [timer, disrupted, phase, startedAt]);

  // Track last visited shop for distance-aware AI planning
  const [lastVisitedShop, setLastVisitedShop] = useState(null);

  // Compute route for AI groups
  const recomputeRoute = useCallback((newInv, fromShop, updatedUsedTrades) => {
    if (cond === "blackbox" || cond === "xai") {
      const plan = planRoute(newInv || inv, SHOPS_BASE, disrupted, fromShop || lastVisitedShop, collectedPickups, timer, new Set(updatedUsedTrades || usedTrades));
      setRoute(plan.steps);
    }
  }, [cond, disrupted, inv, lastVisitedShop, collectedPickups, timer, usedTrades]);

  useEffect(() => {
    if (cond && (cond === "blackbox" || cond === "xai")) {
      recomputeRoute(inv);
    }
  }, [cond, disrupted]);

  // Execute trade — auto-applies free pickup on first trade at a shop
  const executeTrade = useCallback((shop, trade) => {
    if (!canAfford(inv, trade.give)) { setMsg("You don't have enough balls for this trade."); return; }
    let ni = doTradeCalc(inv, trade);

    // Auto-apply free pickup on first trade at this shop
    const pickup = getShopPickup(SHOPS_BASE.find(s => s.id === shop.id), disrupted);
    const isFirstTrade = !collectedPickups.includes(shop.id);
    let pickupNote = "";
    if (isFirstTrade && pickup) {
      Object.entries(pickup).forEach(([c, n]) => {
        if (c !== "label") ni[c] = (ni[c] || 0) + n;
      });
      pickupNote = ` + ${pickup.label}`;
      setCollectedPickups((p) => [...p, shop.id]);
    }

    const entry = {
      timestamp: new Date().toISOString(),
      shop: shop.name, trade: trade.label + pickupNote,
      pointsBefore: totalPoints(inv), pointsAfter: totalPoints(ni),
      condition: cond, disrupted,
      followedAI: (cond !== "human" && route && route[0]) ? (route[0].shop.id === shop.id) : null,
      timerRemaining: timer,
      freePickupApplied: isFirstTrade && pickup ? pickup.label : null,
    };
    setInv(ni);
    const updatedLog = [...tradeLog, entry];
    setTradeLog(updatedLog);
    const tradeKey = `${shop.id}:${trade.label}`;
    const updatedUsedTrades = [...usedTrades, tradeKey];
    setUsedTrades(updatedUsedTrades);
    setLastVisitedShop(shop);
    setMsg(`Traded at ${shop.name}: ${trade.label}${pickupNote}`);
    setCurrentShop(null);
    setTradeFeedback(true);
    setTimeout(() => setTradeFeedback(false), 800);
    scrollToTop();

    // If player followed the AI suggestion, advance the existing route
    // Only do a full replan if they overrode or route is empty
    const followedAI = route && route[0] && route[0].shop.id === shop.id && route[0].trade.label === trade.label;
    if (followedAI && route.length > 1) {
      setRoute(route.slice(1));
    } else {
      recomputeRoute(ni, shop, updatedUsedTrades);
    }
  }, [inv, cond, route, timer, disrupted, recomputeRoute, collectedPickups, usedTrades, tradeLog]);

  // Build final data payload
  const buildPayload = useCallback(() => {
    const mcQuestions = cond === "human" ? MULTI_CHOICE_QUESTIONS_HUMAN : MULTI_CHOICE_QUESTIONS_AI;
    const ftQuestions = cond === "human" ? FREE_TEXT_QUESTIONS_HUMAN : FREE_TEXT_QUESTIONS_AI;
    return {
      participantName: pid,
      condition: cond,
      finalScore: totalPoints(inv),
      finalInventory: inv,
      startingInventory: START_INV,
      trades: tradeLog,
      totalTrades: tradeLog.length,
      tradesFollowedAI: tradeLog.filter(t => t.followedAI === true).length,
      tradesOverrodeAI: tradeLog.filter(t => t.followedAI === false).length,
      gameTimeUsed: startedAt ? Math.floor((Date.now() - startedAt) / 1000) : GAME_DURATION - timer,
      disrupted: true,
      likertResponses: Object.fromEntries(
        LIKERT_QUESTIONS.map(q => [q.text, finalSurvey[q.id] || null])
      ),
      multiChoiceResponses: Object.fromEntries(
        mcQuestions.map(q => [q.text, multiChoice[q.id] || null])
      ),
      freeTextResponses: Object.fromEntries(
        ftQuestions.map(q => [q.text, freeTexts[q.id] || ""])
      ),
      completedAt: new Date().toISOString(),
    };
  }, [pid, cond, inv, tradeLog, finalSurvey, multiChoice, freeTexts, timer, startedAt]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    const payload = buildPayload();
    setSubmitStatus("sending");
    const result = await submitToSheets(payload);
    if (result.ok) {
      setSubmitStatus("sent");
      clearState();
    } else if (result.reason === "not_configured") {
      setSubmitStatus("not_configured");
    } else {
      setSubmitStatus("error");
    }
    setPhase("results");
  }, [buildPayload]);

  const condInfo = {
    blackbox: { label: "Group A", color: T.accent },
    xai: { label: "Group B", color: T.warn },
    human: { label: "Group C", color: T.cool },
  };

  // If URL had group, skip condition select
  const skipCondition = urlGroup.current !== null;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text, fontFamily: serif,
      WebkitTextSizeAdjust: "100%",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px", position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", fontFamily: mono, marginBottom: 4 }}>
            XAI Dissertation Study
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.dark, margin: 0, fontFamily: mono, textTransform: "uppercase", letterSpacing: 3 }}>
            Resource Allocation
          </h1>
          <div style={{ width: 40, height: 2, background: T.accent, margin: "10px auto 0" }} />
        </div>

        {/* ══════ INTRO ══════ */}
        {phase === "intro" && (
          <div>
            <div style={cardStyle}>
              <p style={{ margin: "0 0 14px", lineHeight: 1.8, fontSize: 16 }}>
                Welcome to the Resource Allocation experiment. You will physically walk between
                <strong> five trading shops</strong> spread across campus, exchanging coloured balls to
                <strong style={{ color: T.accent }}> maximise the total point value</strong> of your collection.
              </p>
              <p style={{ margin: "0 0 14px", lineHeight: 1.8, fontSize: 16 }}>
                You have <strong>30 minutes</strong>. Each colour has a different point value.
                Shops have different exchange rates. Planning your route and trades wisely is key.
              </p>
              <div style={{ ...cardStyle, background: T.bgAlt, margin: "16px 0 0" }}>
                <div style={labelStyle}>Point Values</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Ball color={c} />
                      <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: T.dark }}>
                        {c}: {POINTS[c]}pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.cardBorder}`, margin: "20px 0" }} />

            <div style={{ textAlign: "center" }}>
              <div style={{ ...labelStyle, marginBottom: 12 }}>Participant Name</div>
              <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="e.g. John"
                style={{
                  background: "transparent", border: `1.5px solid ${T.cardBorder}`,
                  borderRadius: 2, padding: "12px 16px", color: T.dark,
                  fontSize: 16, fontFamily: mono, width: "100%", maxWidth: 280, outline: "none",
                }} />

              {urlGroup.current && (
                <div style={{ marginTop: 12 }}>
                  <Tag color={condInfo[urlGroup.current].color}>
                    Assigned: {condInfo[urlGroup.current].label}
                  </Tag>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <Btn onClick={() => {
                  if (!pid.trim()) return;
                  if (skipCondition) {
                    setCond(urlGroup.current);
                    setPhase("briefing");
                  } else {
                    setPhase("condition");
                  }
                }} disabled={!pid.trim()} full>
                  Continue →
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══════ CONDITION SELECT (only if no URL param) ══════ */}
        {phase === "condition" && (
          <div>
            <div style={{ ...labelStyle, textAlign: "center", marginBottom: 20 }}>Select assigned group</div>
            {Object.entries(condInfo).map(([k, v]) => (
              <button key={k} onClick={() => { setCond(k); setPhase("briefing"); }}
                style={{
                  ...cardStyle, cursor: "pointer", textAlign: "left", width: "100%",
                  borderLeft: `4px solid ${v.color}`, transition: "all 0.15s",
                  minHeight: 64,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bgAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.card)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.dark, fontFamily: mono }}>{v.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* ══════ BRIEFING ══════ */}
        {phase === "briefing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Tag color={condInfo[cond].color}>{condInfo[cond].label}</Tag>
            </div>

            <CampusMap shops={SHOPS_BASE} currentShop={null}
              route={null}
              onShopClick={() => { }} disrupted={false} cond={cond} />

            {/* Rate card */}
            <div style={cardStyle}>
              <div style={labelStyle}>Shop Rate Card</div>
              {SHOPS_BASE.map((shop) => (
                <div key={shop.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.cardBorder}44` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 14, color: T.dark,
                      width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
                      border: `1.5px solid ${T.cardBorder}`, borderRadius: 2,
                    }}>{shop.tag}</span>
                    <span style={{ fontWeight: 700, color: T.dark, fontSize: 15 }}>{shop.name}</span>
                    <Ball color={shop.specialty} size={14} />
                  </div>
                  {shop.freePickup && (
                    <div style={{ fontSize: 14, color: T.cool, fontFamily: mono, marginLeft: 36, fontWeight: 600 }}>
                      ✦ {shop.freePickup.label} (first trade bonus)
                    </div>
                  )}
                  {shop.trades.map((tr, i) => (
                    <div key={i} style={{ fontSize: 14, color: T.textMuted, fontFamily: mono, marginLeft: 36 }}>
                      {tr.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {cond === "human" && (
              <div style={{ ...cardStyle, borderLeft: `4px solid ${T.cool}` }}>
                <div style={{ ...labelStyle, color: T.cool }}>Your Task</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
                  Plan your own route across campus. Visit shops, make trades, and maximise your points
                  within 30 minutes. Use the map and rate card above to plan your strategy.
                </p>
              </div>
            )}

            <Inventory inv={inv} showPoints cond={cond} />

            <div style={{ marginTop: 16 }}>
              <Btn full onClick={() => {
                const now = Date.now();
                setStartedAt(now);
                setPhase("playing");
                setTimerActive(true);
              }}>
                Start Timer & Begin →
              </Btn>
            </div>
          </div>
        )}

        {/* ══════ PLAYING ══════ */}
        {(phase === "playing" || phase === "playing2") && (
          <div>
            <Timer seconds={timer} />

            <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "8px 0 16px", flexWrap: "wrap" }}>
              <Tag color={condInfo[cond].color}>{condInfo[cond].label}</Tag>
              {disrupted && <Tag color={T.danger}>Market Disrupted</Tag>}
            </div>

            <Inventory inv={inv} showPoints cond={cond} flash={tradeFeedback} />

            {msg && (
              <div style={{
                background: `${T.cool}12`, border: `1px solid ${T.cool}33`,
                borderRadius: 2, padding: "12px 16px", marginBottom: 14,
                fontSize: 14, color: T.cool, fontFamily: mono,
              }}>{msg}</div>
            )}

            {/* Disruption alert — dismissible */}
            {showDisruptionAlert && (
              <div style={{
                ...cardStyle, borderLeft: `4px solid ${T.danger}`,
                background: `${T.danger}08`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ ...labelStyle, color: T.danger }}>Market Update — Rates Changed</div>
                  <button onClick={() => setShowDisruptionAlert(false)} style={{
                    background: "transparent", border: "none", color: T.textFaint,
                    fontFamily: mono, fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1,
                  }}>✕</button>
                </div>
                {cond === "xai" ? (
                  <div>
                    <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.7 }}>
                      Market conditions have shifted. Trade rates have changed across multiple shops — some are
                      <strong style={{ color: T.danger }}> worse</strong> and some are
                      <strong style={{ color: T.cool }}> better</strong>.
                    </p>
                    <div style={{ fontFamily: mono, fontSize: 11, lineHeight: 2.2, color: T.dark }}>
                      <div><span style={{ color: T.cool }}>▲</span> Gallery: 3G→1O now <strong>2G→1O</strong></div>
                      <div><span style={{ color: T.danger }}>▼</span> Gallery: 2Y+2G→1P now <strong>3Y+2G→1P</strong></div>
                      <div><span style={{ color: T.cool }}>▲</span> Gallery: 1B→2P+1Y now <strong>1B→3P+1Y</strong></div>
                      <div><span style={{ color: T.danger }}>▼</span> Gallery Staircase: 2O→1P now <strong>3O→1P</strong></div>
                      <div><span style={{ color: T.cool }}>▲</span> Gallery Staircase: 1P+1G→2O now <strong>1P+1G→3O</strong></div>
                      <div><span style={{ color: T.cool }}>▲</span> Starbucks: 1P+2O→1B now <strong>1P+1O→1B</strong></div>
                      <div><span style={{ color: T.danger }}>▼</span> Starbucks: 2P+1B→1Pu now <strong>3P+1B→1Pu</strong></div>
                      <div><span style={{ color: T.cool }}>▲</span> Computing 129: 3Y+1G→1P now <strong>2Y+1G→1P</strong></div>
                      <div><span style={{ color: T.danger }}>▼</span> Computing 129: 1P+1O+2Y→1B now <strong>1P+2O+2Y→1B</strong></div>
                      <div><span style={{ color: T.cool }}>▲</span> Library Pods: 4G+3Y→1P+1O now <strong>3G+2Y→1P+1O</strong></div>
                      <div><span style={{ color: T.danger }}>▼</span> Library Pods: 2Y+1O→1P now <strong>3Y+1O→1P</strong></div>
                    </div>
                    <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.7, color: T.accentAlt }}>
                      Strategy has shifted significantly. The AI has recalculated your optimal route below.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.7 }}>
                      Trade rates have changed at multiple shops.
                    </p>
                    <div style={{ fontFamily: mono, fontSize: 11, lineHeight: 2.2, color: T.dark }}>
                      <div>Gallery: 3G→1O now <strong>2G→1O</strong></div>
                      <div>Gallery: 2Y+2G→1P now <strong>3Y+2G→1P</strong></div>
                      <div>Gallery: 1B→2P+1Y now <strong>1B→3P+1Y</strong></div>
                      <div>Gallery Staircase: 2O→1P now <strong>3O→1P</strong></div>
                      <div>Gallery Staircase: 1P+1G→2O now <strong>1P+1G→3O</strong></div>
                      <div>Starbucks: 1P+2O→1B now <strong>1P+1O→1B</strong></div>
                      <div>Starbucks: 2P+1B→1Pu now <strong>3P+1B→1Pu</strong></div>
                      <div>Computing 129: 3Y+1G→1P now <strong>2Y+1G→1P</strong></div>
                      <div>Computing 129: 1P+1O+2Y→1B now <strong>1P+2O+2Y→1B</strong></div>
                      <div>Library Pods: 4G+3Y→1P+1O now <strong>3G+2Y→1P+1O</strong></div>
                      <div>Library Pods: 2Y+1O→1P now <strong>3Y+1O→1P</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI instruction */}
            {cond !== "human" && route && route.length > 0 && (
              <div style={{
                ...cardStyle,
                borderLeft: `4px solid ${cond === "blackbox" ? T.accent : T.warn}`,
                background: `${cond === "blackbox" ? T.accent : T.warn}08`,
              }}>
                <div style={{ ...labelStyle, color: cond === "blackbox" ? T.accent : T.warn }}>
                  {cond === "blackbox" ? "Directive" : "Next Suggestion"}
                  {cond === "xai" && <span style={{ marginLeft: 8, color: T.textFaint }}>{route.length} step{route.length !== 1 ? "s" : ""} remaining</span>}
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.dark }}>
                  Go to <strong>{route[0].shop.name}</strong> — {route[0].trade.label}
                </p>
                {cond === "xai" && (
                  <div style={{
                    marginTop: 8, padding: "8px 12px",
                    background: `${T.warn}10`, border: `1px solid ${T.warn}30`,
                    borderRadius: 2, fontSize: 13, color: T.accentAlt,
                    fontFamily: mono, lineHeight: 1.6,
                  }}>↳ {route[0].reason}</div>
                )}
                {cond === "xai" && route.length > 1 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.cardBorder}44` }}>
                    <div style={{ fontSize: 11, color: T.textFaint, fontFamily: mono, marginBottom: 4 }}>UPCOMING</div>
                    {route.slice(1).map((step, i) => (
                      <div key={i} style={{ fontSize: 13, color: T.textMuted, fontFamily: mono, padding: "3px 0" }}>
                        {i + 2}. {step.shop.name} — {step.trade.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {cond !== "human" && route && route.length === 0 && (
              <div style={{ ...cardStyle, borderLeft: `4px solid ${T.cool}` }}>
                <p style={{ margin: 0, fontSize: 14, color: T.cool, fontFamily: mono }}>
                  ✦ Route complete. No further trades recommended.
                </p>
              </div>
            )}

            <CampusMap shops={SHOPS_BASE} currentShop={currentShop}
              route={(cond === "xai" && route) ? route : null}
              onShopClick={setCurrentShop} disrupted={disrupted} cond={cond} />

            {/* Shop trade panel — directly under map */}
            {currentShop && (
              <div style={{ ...cardStyle, borderTop: `2px solid ${COLOR_HEX[currentShop.specialty]}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{
                    fontFamily: mono, fontWeight: 700, fontSize: 16, color: T.bg,
                    background: T.dark, width: 32, height: 32, borderRadius: 2,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>{currentShop.tag}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: T.dark, fontSize: 17 }}>{currentShop.name}</div>
                    {currentShop.location && (
                      <div style={{ fontSize: 13, color: T.accent, fontFamily: mono, marginTop: 2 }}>📍 {currentShop.location}</div>
                    )}
                  </div>
                </div>

                {/* First trade bonus indicator */}
                {(() => {
                  const shopData = SHOPS_BASE.find(s => s.id === currentShop.id);
                  const pickup = getShopPickup(shopData, disrupted);
                  if (!pickup) return null;
                  const collected = collectedPickups.includes(currentShop.id);
                  return (
                  <div style={{
                    padding: "10px 14px", marginBottom: 10,
                    background: collected ? `${T.textFaint}08` : `${T.cool}10`,
                    border: `1px solid ${collected ? T.cardBorder : T.cool}33`,
                    borderRadius: 2,
                  }}>
                    <div style={{ fontFamily: mono, fontSize: 13, color: collected ? T.textFaint : T.cool, fontWeight: 600 }}>
                      {collected ? "✓ First trade bonus collected" : `✦ ${pickup.label}`}
                    </div>
                  </div>
                  );
                })()}

                {((disrupted && SHOPS_BASE.find(s => s.id === currentShop.id).tradesDisrupted)
                  ? SHOPS_BASE.find(s => s.id === currentShop.id).tradesDisrupted
                  : SHOPS_BASE.find(s => s.id === currentShop.id).trades
                ).map((trade, i) => {
                  const affordable = canAfford(inv, trade.give);
                  return (
                    <div key={i} style={{ padding: "14px 0", borderBottom: `1px solid ${T.cardBorder}44` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: mono, fontSize: 14, color: T.dark, fontWeight: 600 }}>{trade.label}</div>
                          {!affordable && (
                            <div style={{ fontSize: 13, color: T.danger, fontFamily: mono, marginTop: 2 }}>
                              Not enough balls
                            </div>
                          )}
                        </div>
                        <Btn small onClick={() => executeTrade(currentShop, trade)} disabled={!affordable}
                          color={affordable ? T.dark : undefined}>
                          Trade
                        </Btn>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => setCurrentShop(null)} style={{
                  background: "transparent", border: "none", color: T.textMuted,
                  fontFamily: mono, fontSize: 13, cursor: "pointer", marginTop: 12, padding: "8px 0",
                  textDecoration: "underline",
                }}>← Close shop</button>
              </div>
            )}

            {/* Rate card — collapsible, with dropdown icon */}
            <details style={{
              ...cardStyle, cursor: "pointer",
            }}>
              <summary style={{
                ...labelStyle, marginBottom: 0, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                listStyle: "none", WebkitAppearance: "none",
              }}>
                <span style={{ fontSize: 14, transition: "transform 0.2s" }}>▸</span>
                Shop Rate Card {disrupted && <Tag color={T.danger}>Updated</Tag>}
              </summary>
              <div style={{ marginTop: 12 }}>
                {SHOPS_BASE.map((shop) => {
                  const trades = (disrupted && shop.tradesDisrupted) ? shop.tradesDisrupted : shop.trades;
                  return (
                    <div key={shop.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.cardBorder}44` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontFamily: mono, fontWeight: 700, fontSize: 13, color: T.dark,
                          width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
                          border: `1.5px solid ${T.cardBorder}`, borderRadius: 2,
                        }}>{shop.tag}</span>
                        <span style={{ fontWeight: 700, color: T.dark, fontSize: 14 }}>{shop.name}</span>
                        <Ball color={shop.specialty} size={12} />
                      </div>
                      {getShopPickup(shop, disrupted) && (
                        <div style={{ fontSize: 13, color: T.cool, fontFamily: mono, marginLeft: 32, fontWeight: 600 }}>
                          ✦ {getShopPickup(shop, disrupted).label} (first trade bonus)
                        </div>
                      )}
                      {trades.map((tr, i) => (
                        <div key={i} style={{ fontSize: 13, color: T.textMuted, fontFamily: mono, marginLeft: 32 }}>
                          {tr.label}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </details>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setTimerActive(false); setPhase("finalSurvey"); }} style={{
                background: "transparent", border: `1px solid ${T.cardBorder}`,
                borderRadius: 2, padding: "10px 24px", fontFamily: mono, fontSize: 13,
                color: T.textMuted, cursor: "pointer", minHeight: 44,
              }}>End game early →</button>
            </div>
          </div>
        )}

        {/* ══════ FINAL SURVEY ══════ */}
        {phase === "finalSurvey" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", fontFamily: mono, marginBottom: 4 }}>Post-game</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.dark, margin: 0, fontFamily: mono, textTransform: "uppercase", letterSpacing: 3 }}>Survey</h2>
              <div style={{ width: 30, height: 2, background: T.accent, margin: "10px auto 0" }} />
            </div>

            <Inventory inv={inv} showPoints cond={null} />

            {/* SECTION 1: Likert Scale */}
            <div style={{ ...labelStyle, marginTop: 8 }}>
              Rate each statement (1 = strongly disagree, 7 = strongly agree)
            </div>

            {LIKERT_QUESTIONS.map((q) => (
              <LikertQuestion key={q.id} question={q.text} value={finalSurvey[q.id]}
                onChange={(v) => setFinalSurvey((p) => ({ ...p, [q.id]: v }))} />
            ))}

            {/* SECTION 2: Multiple Choice */}
            <div style={{ ...labelStyle, marginTop: 20 }}>
              Select the option(s) that best apply
            </div>

            {(cond === "human" ? MULTI_CHOICE_QUESTIONS_HUMAN : MULTI_CHOICE_QUESTIONS_AI).map((q) => (
              <div key={q.id} style={cardStyle}>
                <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.6, color: T.text }}>{q.text}</p>
                {q.multi && <p style={{ margin: "0 0 10px", fontSize: 12, color: T.textFaint, fontFamily: mono }}>Select all that apply</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {q.options.map((opt) => {
                    const selected = q.multi
                      ? (multiChoice[q.id] || []).includes(opt)
                      : multiChoice[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => {
                        if (q.multi) {
                          setMultiChoice((p) => {
                            const current = p[q.id] || [];
                            return { ...p, [q.id]: current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt] };
                          });
                        } else {
                          setMultiChoice((p) => ({ ...p, [q.id]: opt }));
                        }
                      }} style={{
                        background: selected ? T.dark : "transparent",
                        color: selected ? T.bg : T.text,
                        border: `1.5px solid ${selected ? T.dark : T.cardBorder}`,
                        borderRadius: 2, padding: "10px 16px",
                        fontSize: 14, cursor: "pointer", fontFamily: mono,
                        transition: "all 0.12s", minHeight: 44,
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* SECTION 3: Free Text */}
            <div style={{ ...labelStyle, marginTop: 20 }}>
              Please answer in your own words
            </div>

            {(cond === "human" ? FREE_TEXT_QUESTIONS_HUMAN : FREE_TEXT_QUESTIONS_AI).map((q) => (
              <div key={q.id} style={cardStyle}>
                <p style={{ margin: "0 0 12px", fontSize: 15, color: T.text, lineHeight: 1.6 }}>{q.text}</p>
                <textarea value={freeTexts[q.id] || ""} onChange={(e) => setFreeTexts((p) => ({ ...p, [q.id]: e.target.value }))}
                  placeholder="Type your response here..."
                  style={{
                    width: "100%", minHeight: 100, background: T.bgAlt, border: `1px solid ${T.cardBorder}`,
                    borderRadius: 2, color: T.text, fontFamily: serif, fontSize: 15,
                    padding: 14, resize: "vertical", outline: "none", lineHeight: 1.7,
                  }} />
              </div>
            ))}

            <Btn full onClick={() => {
              const mcQuestions = cond === "human" ? MULTI_CHOICE_QUESTIONS_HUMAN : MULTI_CHOICE_QUESTIONS_AI;
              const ftQuestions = cond === "human" ? FREE_TEXT_QUESTIONS_HUMAN : FREE_TEXT_QUESTIONS_AI;
              const likertDone = LIKERT_QUESTIONS.every(q => finalSurvey[q.id]);
              const mcDone = mcQuestions.every(q => multiChoice[q.id] && (Array.isArray(multiChoice[q.id]) ? multiChoice[q.id].length > 0 : true));
              const ftDone = ftQuestions.every(q => (freeTexts[q.id] || "").trim());
              if (likertDone && mcDone && ftDone) {
                handleSubmit();
              } else { setMsg("Please complete all questions before submitting."); }
            }} disabled={false} color={T.success}>
              Submit Results →
            </Btn>
            {msg && phase === "finalSurvey" && (
              <p style={{ textAlign: "center", color: T.accent, fontSize: 13, fontFamily: mono, marginTop: 8 }}>{msg}</p>
            )}
          </div>
        )}

        {/* ══════ RESULTS ══════ */}
        {phase === "results" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", fontFamily: mono, marginBottom: 4 }}>Complete</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.dark, margin: 0, fontFamily: mono, textTransform: "uppercase", letterSpacing: 3 }}>Thank You</h2>
              <div style={{ width: 30, height: 2, background: T.accent, margin: "10px auto 0" }} />
            </div>

            {/* Submission status */}
            {submitStatus === "sent" && (
              <div style={{ ...cardStyle, borderLeft: `4px solid ${T.success}`, background: `${T.success}08` }}>
                <p style={{ margin: 0, fontSize: 15, color: T.success, fontFamily: mono, fontWeight: 600 }}>
                  ✓ Your results have been submitted successfully.
                </p>
              </div>
            )}
            {submitStatus === "error" && (
              <div style={{ ...cardStyle, borderLeft: `4px solid ${T.danger}` }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: T.danger, fontFamily: mono, fontWeight: 600 }}>
                  Submission failed. Please copy the data below and send it to the researcher.
                </p>
                <Btn small onClick={handleSubmit} color={T.accent}>Retry →</Btn>
              </div>
            )}
            {submitStatus === "not_configured" && (
              <div style={{ ...cardStyle, borderLeft: `4px solid ${T.warn}` }}>
                <p style={{ margin: 0, fontSize: 14, color: T.warn, fontFamily: mono }}>
                  Data collection not yet configured. Copy the JSON below.
                </p>
              </div>
            )}

            <Inventory inv={inv} showPoints cond={null} />

            <div style={cardStyle}>
              <div style={labelStyle}>Trade History ({tradeLog.length} trades)</div>
              {tradeLog.length === 0 && <p style={{ color: T.textMuted, fontSize: 14, fontFamily: mono }}>No trades recorded.</p>}
              {tradeLog.map((t, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: i < tradeLog.length - 1 ? `1px solid ${T.cardBorder}44` : "none",
                  fontSize: 13, gap: 8, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: mono, color: T.textFaint, fontSize: 11 }}>
                      {Math.floor((GAME_DURATION - t.timerRemaining) / 60)}m
                    </span>
                    <span>{t.shop}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: mono, fontSize: 12, color: T.textMuted }}>{t.trade}</span>
                    <Tag color={t.pointsAfter > t.pointsBefore ? T.cool : T.textFaint}>
                      {t.pointsAfter > t.pointsBefore ? "+" : ""}{t.pointsAfter - t.pointsBefore}pts
                    </Tag>
                    {t.followedAI !== null && (
                      <Tag color={t.followedAI ? T.cool : T.accent}>{t.followedAI ? "Followed" : "Overrode"}</Tag>
                    )}
                    {t.disrupted && <Tag color={T.danger}>Post-disruption</Tag>}
                  </div>
                </div>
              ))}
            </div>

            {/* JSON backup */}
            <div style={{ ...cardStyle, borderTop: `2px solid ${T.accent}` }}>
              <div style={{ ...labelStyle, color: T.accent }}>Backup Data (JSON)</div>
              <textarea readOnly value={JSON.stringify(buildPayload(), null, 2)}
                style={{
                  width: "100%", height: 200, background: T.bgAlt, border: `1px solid ${T.cardBorder}`,
                  borderRadius: 2, color: T.text, fontFamily: mono, fontSize: 11,
                  padding: 12, resize: "vertical", outline: "none",
                }} />
            </div>

            {/* Reset for next participant */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => {
                clearState();
                window.location.reload();
              }} style={{
                background: "transparent", border: `1px solid ${T.cardBorder}`,
                borderRadius: 2, padding: "10px 24px", fontFamily: mono, fontSize: 13,
                color: T.textMuted, cursor: "pointer", minHeight: 44,
              }}>Reset for next participant →</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, paddingTop: 16, borderTop: `1px solid ${T.cardBorder}` }}>
          <span style={{ fontSize: 10, color: T.textFaint, fontFamily: mono, letterSpacing: 1 }}>
            XAI TRUST & UNDERSTANDING STUDY — DISSERTATION
          </span>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => {
              if (window.confirm("Are you sure? This will erase all progress and cannot be undone.")) {
                clearState();
                window.location.reload();
              }
            }} style={{
              background: "transparent", border: "none",
              color: T.cardBorder, fontFamily: mono, fontSize: 10,
              cursor: "pointer", padding: "8px 12px", letterSpacing: 1,
            }}>RESET</button>
          </div>
        </div>
      </div>
    </div>
  );
}
