import { useState, useRef, useEffect, useCallback } from "react";

// ══════════════════════════════════════════
//  【Dify AI 設定區】— 上線前填入
// ══════════════════════════════════════════
const DIFY_API_ENDPOINT = "https://api.dify.ai/v1";

// ══════════════════════════════════════════
//  【NPC 設定】
// ══════════════════════════════════════════
const NPCS = [
  {
    id: "sales", label: "業務專員", color: "#b8935a",
    apiKey: "app-9uROUbCdyOpCWqkVKKR6WILz",
    desk: { x: 90, y: 195 },
    greeting: "您好！我是 Ledoux 智能業務秘書，報價、客戶開發、產品建議都找我！",
    difyInputs: {},
  },
  {
    id: "tech", label: "技術專員", color: "#4a9b6a",
    apiKey: "app-awrE84SxLg1OUwfbJyOeKl5M",
    desk: { x: 250, y: 195 },
    greeting: "您好！我是 Ledoux 技術專員，安裝估價、規格確認、施工圖面都找我。",
    difyInputs: {},
  },
  {
    id: "admin", label: "智能秘書", color: "#7a6aab",
    apiKey: "app-9uROUbCdyOpCWqkVKKR6WILz",
    desk: { x: 410, y: 195 },
    greeting: "您好！訂單查詢、樣品申請、行政事務請告訴我。",
    difyInputs: {},
  },
  {
    id: "stock", label: "庫存管理", color: "#9b5a5a",
    apiKey: "app-WABywuZSL6JwOvN88BaABMjX",
    desk: { x: 570, y: 195 },
    greeting: "您好！我是庫存管理專員，現貨查詢、備料、出貨安排都由我處理。",
    difyInputs: {},
  },
];

async function difyChat(message, conversationId, npc) {
  try {
    const res = await fetch(`${DIFY_API_ENDPOINT}/chat-messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${npc.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: npc.difyInputs,
        query: message,
        response_mode: "blocking",
        conversation_id: conversationId || "",
        user: `ledoux-${npc.id}`,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { answer: data.answer, conversationId: data.conversation_id };
  } catch (e) {
    return { answer: `⚠️ AI 連線異常（${e.message}）。請確認 Dify API Key 已正確設定。`, conversationId };
  }
}

// ══════════════════════════════════════════
//  Canvas 動畫場景
// ══════════════════════════════════════════
const W = 740, H = 340;

function drawScene(ctx, agents, activeId, frame) {
  ctx.clearRect(0, 0, W, H);

  // 地板
  ctx.fillStyle = "#0f0d08";
  ctx.fillRect(0, 0, W, H);

  // 地板網格
  ctx.strokeStyle = "#1a1710";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // 會議桌
  ctx.save();
  ctx.fillStyle = "#2a1d0e"; ctx.strokeStyle = "#4a3318"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(370, 100, 55, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#3d2a12"; ctx.font = "8px monospace"; ctx.textAlign = "center";
  ctx.fillText("MEETING", 370, 104);
  ctx.restore();

  // 桌子 + 螢幕
  NPCS.forEach(npc => {
    const { x, y } = npc.desk;
    ctx.fillStyle = "#231808"; ctx.strokeStyle = "#3d2a10"; ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, 100, 52); ctx.strokeRect(x, y, 100, 52);
    ctx.fillStyle = "#080810"; ctx.fillRect(x + 20, y + 5, 60, 36);
    const blink = (frame >> 4) % 3 === 0 && activeId === npc.id;
    ctx.fillStyle = blink ? "#1a3a2a" : "#0a1820";
    ctx.fillRect(x + 22, y + 7, 56, 32);
    if (activeId === npc.id && (frame >> 3) % 2 === 0) {
      ctx.fillStyle = npc.color; ctx.fillRect(x + 26, y + 28, 8, 2);
    }
    ctx.fillStyle = "#1a1410"; ctx.fillRect(x + 15, y + 43, 70, 6);
  });

  // NPC 角色
  agents.forEach(agent => {
    const npc = NPCS.find(n => n.id === agent.id);
    if (!npc) return;
    const isActive = activeId === agent.id;
    const bob = Math.sin(frame * 0.05 + agent.phase) * (agent.moving ? 2 : 0.5);

    if (isActive) {
      ctx.save();
      ctx.shadowColor = npc.color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(agent.x, agent.y - 12 + bob, 18, 0, Math.PI * 2);
      ctx.strokeStyle = npc.color + "66"; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = npc.color;
    ctx.fillRect(agent.x - 9, agent.y - 8 + bob, 18, 22);
    ctx.fillStyle = npc.color + "aa";
    ctx.fillRect(agent.x - 5, agent.y - 8 + bob, 10, 6);
    ctx.fillStyle = "#e8c890";
    ctx.beginPath(); ctx.arc(agent.x, agent.y - 20 + bob, 11, 0, Math.PI * 2); ctx.fill();
    const eyeBlink = (frame >> 5) % 8 === 0;
    ctx.fillStyle = "#2a1a08";
    if (!eyeBlink) {
      ctx.fillRect(agent.x - 5, agent.y - 22 + bob, 3, 3);
      ctx.fillRect(agent.x + 2, agent.y - 22 + bob, 3, 3);
    } else {
      ctx.fillRect(agent.x - 5, agent.y - 21 + bob, 3, 1);
      ctx.fillRect(agent.x + 2, agent.y - 21 + bob, 3, 1);
    }

    ctx.fillStyle = isActive ? npc.color : "#888";
    ctx.font = `bold 10px 'Noto Sans TC', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(npc.label, agent.x, agent.y + 22 + bob);

    if (!isActive) {
      ctx.fillStyle = "#55442288";
      ctx.font = "8px monospace";
      ctx.fillText("▶ 點擊", agent.x, agent.y - 36 + bob);
    }

    if (agent.bubble && agent.bubbleTimer > 0) {
      const bx = agent.x, by = agent.y - 48 + bob;
      const tw = Math.min(ctx.measureText(agent.bubble).width + 16, 120);
      ctx.fillStyle = "#1a1a1a"; ctx.strokeStyle = npc.color; ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx - tw / 2, by - 14, tw, 20, 4);
      else ctx.rect(bx - tw / 2, by - 14, tw, 20);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ddd"; ctx.font = "8px 'Noto Sans TC', sans-serif";
      ctx.fillText(agent.bubble.length > 14 ? agent.bubble.slice(0, 14) + "…" : agent.bubble, bx, by);
    }
  });

  if ((frame >> 4) % 2 === 0) {
    ctx.fillStyle = "#b8935a"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
    ctx.fillText("● LIVE", 10, 16);
  }
}

// ══════════════════════════════════════════
//  對話面板
// ══════════════════════════════════════════
const IDLE_PHRASES = [
  "報價出去了！", "客戶回覆了", "新案子～", "庫存確認中", "開會時間到", "圖面更新了",
  "樣品寄出", "技術規格OK", "發票開好了", "現貨充足",
];

function ChatPanel({ npc, onClose }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: npc.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text }]);
    setLoading(true);
    const { answer, conversationId } = await difyChat(text, convId, npc);
    setConvId(conversationId);
    setMsgs(m => [...m, { role: "ai", text: answer }]);
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(500px,94vw)", background: "#0e0c08", border: `1px solid ${npc.color}`, display: "flex", flexDirection: "column", maxHeight: "78vh", borderRadius: 2 }}>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${npc.color}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: npc.color }} />
            <span style={{ color: npc.color, fontFamily: "'Cormorant Garamond',serif", fontSize: 15, letterSpacing: 2 }}>{npc.label}</span>
            <span style={{ color: "#444", fontSize: 9, letterSpacing: 2 }}>LEDOUX AI STAFF</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{
                padding: "10px 14px", fontSize: 12, lineHeight: 1.75,
                background: m.role === "user" ? npc.color : "#1a1a1a",
                color: m.role === "user" ? "#0e0c08" : "#ddd",
                borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                fontWeight: m.role === "user" ? 600 : 400,
              }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: "#555", fontSize: 11, fontStyle: "italic", paddingLeft: 4 }}>
              {npc.label} 思考中…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`詢問${npc.label}… (Enter 送出)`}
            style={{ flex: 1, padding: "9px 12px", background: "#141414", border: "1px solid #2a2a2a", color: "#ddd", fontSize: 12, fontFamily: "'Noto Sans TC',sans-serif", outline: "none", borderRadius: 2 }}
            autoFocus
          />
          <button onClick={send} disabled={loading} style={{
            padding: "9px 16px", background: loading ? "#333" : npc.color,
            border: "none", color: loading ? "#666" : "#0e0c08", fontWeight: 700, fontSize: 11,
            cursor: loading ? "default" : "pointer", letterSpacing: 1, borderRadius: 2, transition: "background .2s",
          }}>送出</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  主頁面
// ══════════════════════════════════════════
export default function Office() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const agentsRef = useRef([]);
  const [activeNpc, setActiveNpc] = useState(null);

  const [agents, setAgents] = useState(() =>
    NPCS.map((npc, i) => ({
      id: npc.id,
      x: npc.desk.x + 50,
      y: npc.desk.y - 25,
      tx: npc.desk.x + 50,
      ty: npc.desk.y - 25,
      home: { x: npc.desk.x + 50, y: npc.desk.y - 25 },
      phase: i * 1.2,
      idle: Math.random() * 80,
      moving: false,
      bubble: "",
      bubbleTimer: 0,
    }))
  );

  // 同步 agentsRef 供 canvas tick 讀取（避免閉包舊值）
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const tick = () => {
      frameRef.current++;
      const f = frameRef.current;

      setAgents(prev => {
        const next = prev.map(agent => {
          if (agentsRef.current.find(a => a.id === agent.id)?.activeDialog) return agent;

          let { x, y, tx, ty, home, idle, moving, bubble, bubbleTimer } = agent;
          const dx = tx - x, dy = ty - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.5) {
            x += (dx / dist) * 0.7;
            y += (dy / dist) * 0.7;
            moving = true;
          } else {
            x = tx; y = ty; moving = false;
            idle++;
            if (idle > 140 + Math.random() * 160) {
              idle = 0;
              const r = Math.random();
              if (r < 0.25) { tx = 310 + Math.random() * 120; ty = 80 + Math.random() * 40; }
              else if (r < 0.45) {
                const other = NPCS[Math.floor(Math.random() * NPCS.length)];
                tx = other.desk.x + 50 + (Math.random() - 0.5) * 30;
                ty = other.desk.y - 15;
              } else { tx = home.x + (Math.random() - 0.5) * 40; ty = home.y + (Math.random() - 0.5) * 20; }

              if (Math.random() < 0.35) {
                bubble = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
                bubbleTimer = 90;
              }
            }
          }

          if (bubbleTimer > 0) bubbleTimer--;
          return { ...agent, x, y, tx, ty, moving, idle, bubble, bubbleTimer };
        });
        agentsRef.current = next;
        drawScene(ctx, next, activeNpc?.id, f);
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeNpc]);

  const handleCanvasClick = useCallback(e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleX;
    const hit = agentsRef.current.find(a => Math.hypot(mx - a.x, my - a.y) < 24);
    if (hit) {
      const npc = NPCS.find(n => n.id === hit.id);
      if (npc) setActiveNpc(npc);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080806", color: "#e0d5c5", fontFamily: "'Noto Sans TC',sans-serif" }}>
      <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #1a1710", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, letterSpacing: 4, color: "#b8935a" }}>LEDOUX</span>
          <span style={{ fontSize: 9, letterSpacing: 3, color: "#444", marginLeft: 12 }}>VIRTUAL OFFICE</span>
        </div>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>點擊畫面中的員工進行對話</div>
      </div>

      <canvas
        ref={canvasRef}
        width={W} height={H}
        onClick={handleCanvasClick}
        style={{ width: "100%", display: "block", cursor: "crosshair", imageRendering: "pixelated" }}
      />

      <div style={{ display: "flex", gap: 10, padding: "12px 20px", flexWrap: "wrap", borderTop: "1px solid #1a1710" }}>
        {NPCS.map(npc => (
          <button key={npc.id} onClick={() => setActiveNpc(npc)} style={{
            flex: "1 1 130px", padding: "10px 14px", background: "#111",
            border: `1px solid ${activeNpc?.id === npc.id ? npc.color : "#2a2010"}`,
            cursor: "pointer", textAlign: "left", transition: "border-color .2s", borderRadius: 1,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: npc.color, marginBottom: 6 }} />
            <div style={{ color: npc.color, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{npc.label}</div>
            <div style={{ color: "#444", fontSize: 9, marginTop: 2, letterSpacing: 1 }}>AI STAFF → 點擊對話</div>
          </button>
        ))}
      </div>

      {activeNpc && <ChatPanel npc={activeNpc} onClose={() => setActiveNpc(null)} />}
    </div>
  );
}
