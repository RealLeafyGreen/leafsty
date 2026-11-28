"use client";

import React, { useCallback, useEffect, useState } from "react";
import { X, Gamepad2, RotateCcw, Send, Trophy, Bomb, Flag } from "lucide-react";

interface LeafstyGamesModalProps {
  onClose: () => void;
  onShareResult: (summaryText: string) => Promise<void> | void;
}

type GameTab = "snake" | "mines" | "2048" | "memory" | "ttt" | "rps" | "calc";
const MEMORY_ICONS = ["🌿", "🍃", "🦊", "🐸", "🍄", "💎", "🔥", "🌙"];

const SNAC_PALETTE = [
  "rgb(0, 150, 100)", "rgb(0, 142, 104)", "rgb(0, 134, 108)", "rgb(0, 126, 112)", "rgb(0, 118, 116)",
  "rgb(0, 110, 120)", "rgb(5, 102, 128)", "rgb(10, 94, 136)", "rgb(15, 86, 144)", "rgb(20, 78, 152)",
  "rgb(25, 70, 160)", "rgb(35, 66, 165)", "rgb(45, 62, 170)", "rgb(55, 58, 175)", "rgb(65, 54, 180)",
  "rgb(75, 50, 185)", "rgb(85, 50, 190)", "rgb(95, 50, 195)", "rgb(105, 50, 200)", "rgb(115, 50, 205)",
  "rgb(125, 50, 210)", "rgb(135, 50, 210)", "rgb(145, 50, 210)", "rgb(155, 50, 210)", "rgb(165, 50, 215)",
  "rgb(175, 45, 220)", "rgb(185, 40, 225)", "rgb(195, 35, 230)", "rgb(205, 30, 235)", "rgb(215, 25, 240)",
];

const SNAC_DIFFS = [
  { label: "SLOW", fps: 7 },
  { label: "NORMAL", fps: 15 },
  { label: "FAST", fps: 25 },
] as const;

function evaluateMathExpr(raw: string): string {
  try {
    let expr = raw
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, `(${Math.PI})`)
      .replace(/\be\b/g, `(${Math.E})`)
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/\bsin\(/g, "Math.sin((Math.PI/180)*")
      .replace(/\bcos\(/g, "Math.cos((Math.PI/180)*")
      .replace(/\btan\(/g, "Math.tan((Math.PI/180)*")
      .replace(/\blog\(/g, "Math.log10(")
      .replace(/\bln\(/g, "Math.log(")
      .replace(/\^/g, "**")
      .replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    // Auto-close any unclosed parentheses
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      expr += ")".repeat(openCount - closeCount);
    }

    // Strictly allow only numbers, math operators, parentheses, and Math.* calls
    const stripped = expr.replace(/Math\.(sqrt|sin|cos|tan|log10|log|PI|E)/g, "");
    if (!/^[0-9+\-*/().\s*]+$/.test(stripped)) {
      return "Error";
    }

    const val = Function(`"use strict"; return (${expr});`)();
    if (typeof val !== "number" || !Number.isFinite(val)) return "Error";
    return String(Number(val.toPrecision(12)));
  } catch {
    return "Error";
  }
}

export default function LeafstyGamesModal({
  onClose,
  onShareResult,
}: LeafstyGamesModalProps) {
  const [tab, setTab] = useState<GameTab>("snake");

  // ================= 1. SNAC (Friend's Pygame Port) =================
  const SNAC_COLS = 20;
  const SNAC_ROWS = 15;
  const [snacScreen, setSnacScreen] = useState<"MENU" | "PLAYING" | "SETTINGS" | "GAMEOVER">("MENU");
  const [diffIdx, setDiffIdx] = useState<number>(1);
  const [speedModeEnabled, setSpeedModeEnabled] = useState<boolean>(true);
  const [snacFps, setSnacFps] = useState<number>(15);
  const [snacHigh, setSnacHigh] = useState<number>(0);

  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 10, y: 7 },
    { x: 9, y: 7 },
  ]);
  const [dir, setDir] = useState<{ x: number; y: number }>({ x: 1, y: 0 });
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 14, y: 7 });
  const [snakeScore, setSnakeScore] = useState(0);

  const spawnSnacFood = (body: { x: number; y: number }[]) => {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * SNAC_COLS),
        y: Math.floor(Math.random() * SNAC_ROWS),
      };
      if (!body.some((s) => s.x === candidate.x && s.y === candidate.y)) {
        return candidate;
      }
    }
  };

  const resetSnake = () => {
    const startBody = [
      { x: 10, y: 7 },
      { x: 9, y: 7 },
    ];
    setSnake(startBody);
    setDir({ x: 1, y: 0 });
    setFood(spawnSnacFood(startBody));
    setSnakeScore(0);
    setSnacFps(SNAC_DIFFS[diffIdx]?.fps || 15);
    setSnacScreen("PLAYING");
  };

  useEffect(() => {
    if (snacScreen !== "PLAYING" || tab !== "snake") return;
    const ms = Math.max(25, Math.round(1000 / snacFps));
    const t = setInterval(() => {
      setSnake((prev) => {
        const hx = (prev[0].x + dir.x + SNAC_COLS) % SNAC_COLS;
        const hy = (prev[0].y + dir.y + SNAC_ROWS) % SNAC_ROWS;
        const head = { x: hx, y: hy };

        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          setSnacHigh((h) => Math.max(h, snakeScore));
          setSnacScreen("GAMEOVER");
          return prev;
        }
        const next = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setSnakeScore((s) => s + 10);
          setFood(spawnSnacFood(next));
          if (speedModeEnabled) {
            setSnacFps((f) => f + 1.5);
          }
        } else {
          next.pop();
        }
        return next;
      });
    }, ms);
    return () => clearInterval(t);
  }, [snacScreen, snacFps, dir, food, tab, speedModeEnabled, snakeScore]);

  // ================= 2. MINESWEEPER (7x7, 7 mines) =================
  const M_SIZE = 7;
  const M_MINES = 7;
  type MineCell = { mine: boolean; open: boolean; flag: boolean; adj: number };

  const buildMines = useCallback((): MineCell[] => {
    const cells: MineCell[] = Array.from({ length: M_SIZE * M_SIZE }, () => ({
      mine: false,
      open: false,
      flag: false,
      adj: 0,
    }));
    let placed = 0;
    while (placed < M_MINES) {
      const idx = Math.floor(Math.random() * cells.length);
      if (!cells[idx].mine) {
        cells[idx].mine = true;
        placed++;
      }
    }
    for (let i = 0; i < cells.length; i++) {
      const r = Math.floor(i / M_SIZE);
      const c = i % M_SIZE;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < M_SIZE && nc >= 0 && nc < M_SIZE) {
            if (cells[nr * M_SIZE + nc].mine) count++;
          }
        }
      }
      cells[i].adj = count;
    }
    return cells;
  }, []);

  const [mines, setMines] = useState<MineCell[]>(() => buildMines());
  const [mineState, setMineState] = useState<"playing" | "won" | "lost">(
    "playing"
  );

  const openMineCell = (idx: number) => {
    if (mineState !== "playing") return;
    const next = mines.map((c) => ({ ...c }));
    if (next[idx].open || next[idx].flag) return;
    if (next[idx].mine) {
      next.forEach((c) => {
        if (c.mine) c.open = true;
      });
      setMines(next);
      setMineState("lost");
      return;
    }
    const flood = (i: number) => {
      if (i < 0 || i >= next.length || next[i].open || next[i].flag) return;
      next[i].open = true;
      if (next[i].adj === 0) {
        const r = Math.floor(i / M_SIZE);
        const c = i % M_SIZE;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < M_SIZE && nc >= 0 && nc < M_SIZE) {
              flood(nr * M_SIZE + nc);
            }
          }
        }
      }
    };
    flood(idx);
    const allSafeOpen = next.every((c) => c.mine || c.open);
    setMines(next);
    if (allSafeOpen) setMineState("won");
  };

  const toggleFlag = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (mineState !== "playing" || mines[idx].open) return;
    setMines((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, flag: !c.flag } : c))
    );
  };

  // ================= 3. 2048 =================
  const spawnTile = (b: number[]) => {
    const empty = b.map((v, i) => (v === 0 ? i : -1)).filter((i) => i !== -1);
    if (empty.length === 0) return b;
    const pick = empty[Math.floor(Math.random() * empty.length)];
    const copy = [...b];
    copy[pick] = Math.random() < 0.85 ? 2 : 4;
    return copy;
  };

  const init2048 = () => spawnTile(spawnTile(Array(16).fill(0)));
  const [grid2048, setGrid2048] = useState<number[]>(() => init2048());
  const [score2048, setScore2048] = useState(0);

  const slideRow = (row: number[]) => {
    const nonZero = row.filter((v) => v !== 0);
    const merged: number[] = [];
    let gained = 0;
    for (let i = 0; i < nonZero.length; i++) {
      if (nonZero[i] === nonZero[i + 1]) {
        const val = nonZero[i] * 2;
        merged.push(val);
        gained += val;
        i++;
      } else {
        merged.push(nonZero[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    return { merged, gained };
  };

  const move2048 = (dir2048: "L" | "R" | "U" | "D") => {
    let totalGain = 0;
    const next = [...grid2048];
    for (let i = 0; i < 4; i++) {
      const idxs =
        dir2048 === "L"
          ? [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3]
          : dir2048 === "R"
          ? [i * 4 + 3, i * 4 + 2, i * 4 + 1, i * 4]
          : dir2048 === "U"
          ? [i, i + 4, i + 8, i + 12]
          : [i + 12, i + 8, i + 4, i];
      const line = idxs.map((idx) => next[idx]);
      const { merged, gained } = slideRow(line);
      totalGain += gained;
      idxs.forEach((idx, k) => {
        next[idx] = merged[k];
      });
    }
    if (next.some((v, idx) => v !== grid2048[idx])) {
      setGrid2048(spawnTile(next));
      setScore2048((s) => s + totalGain);
    }
  };
  // ================= 4. MEMORY MATCH =================
  const buildMemory = () =>
    [...MEMORY_ICONS, ...MEMORY_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon) => ({ icon, flipped: false, matched: false }));

  const [cards, setCards] = useState(() => buildMemory());
  const [flippedIdxs, setFlippedIdxs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const flipCard = (idx: number) => {
    if (
      flippedIdxs.length >= 2 ||
      cards[idx].flipped ||
      cards[idx].matched
    ) {
      return;
    }
    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    const nextFlipped = [...flippedIdxs, idx];
    setCards(next);
    setFlippedIdxs(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextFlipped;
      if (next[a].icon === next[b].icon) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, matched: true } : c
            )
          );
          setFlippedIdxs([]);
        }, 280);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, flipped: false } : c
            )
          );
          setFlippedIdxs([]);
        }, 650);
      }
    }
  };

  // ================= 5. TIC-TAC-TOE =================
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttStatus, setTttStatus] = useState<string>("Your turn (🌿)");

  const checkWinner = (b: (string | null)[]) => {
  const lines = Array.of(
  Array.of(0, 1, 2),
  Array.of(3, 4, 5),
  Array.of(6, 7, 8),
  Array.of(0, 3, 6),
  Array.of(1, 4, 7),
  Array.of(2, 5, 8),
  Array.of(0, 4, 8),
  Array.of(2, 4, 6)
);


    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(Boolean) ? "draw" : null;
  };

  const handleTttClick = (idx: number) => {
    if (board[idx] || checkWinner(board)) return;
    const next = [...board];
    next[idx] = "🌿";
    const w1 = checkWinner(next);
    if (w1) {
      setBoard(next);
      setTttStatus(w1 === "draw" ? "It's a draw!" : "You won! 🎉");
      return;
    }
    const empty = next
      .map((v, i) => (v === null ? i : -1))
      .filter((i) => i !== -1);
    if (empty.length > 0) {
      next[empty[Math.floor(Math.random() * empty.length)]] = "🤖";
    }
    const w2 = checkWinner(next);
    setBoard(next);
    if (w2 === "🤖") setTttStatus("LeafyBot won! 🤖");
    else if (w2 === "draw") setTttStatus("It's a draw!");
    else setTttStatus("Your turn (🌿)");
  };

  // ================= 6. ROCK PAPER SCISSORS =================
  const [rpsScore, setRpsScore] = useState({ you: 0, bot: 0 });
  const [rpsLast, setRpsLast] = useState("Pick Rock, Paper, or Scissors!");

  const playRps = (choice: "🪨" | "📄" | "✂️") => {
    const opts: ("🪨" | "📄" | "✂️")[] = ["🪨", "📄", "✂️"];
    const bot = opts[Math.floor(Math.random() * opts.length)];
    if (choice === bot) {
      setRpsLast(`You ${choice} vs ${bot} Bot — Tie!`);
      return;
    }
    const win =
      (choice === "🪨" && bot === "✂️") ||
      (choice === "📄" && bot === "🪨") ||
      (choice === "✂️" && bot === "📄");
    if (win) {
      setRpsScore((s) => ({ ...s, you: s.you + 1 }));
      setRpsLast(`You ${choice} beats ${bot} — You Win! 🎉`);
    } else {
      setRpsScore((s) => ({ ...s, bot: s.bot + 1 }));
      setRpsLast(`Bot ${bot} beats ${choice} — Bot Wins!`);
    }
  };

  // ================= 7. CALCULATOR =================
const [calcExpr, setCalcExpr] = useState("");
const [calcResult, setCalcResult] = useState("0");
const [calcCopied, setCalcCopied] = useState(false);

const handleCalcPress = (token: string) => {
  setCalcCopied(false);
  if (token === "C") {
    setCalcExpr("");
    setCalcResult("0");
    return;
  }
  if (token === "⌫") {
    setCalcExpr((prev) => prev.slice(0, -1));
    return;
  }
  if (token === "=") {
    if (!calcExpr.trim()) return;
    const res = evaluateMathExpr(calcExpr);
    setCalcResult(res);
    if (res !== "Error") setCalcExpr(res);
    return;
  }
  setCalcExpr((prev) => (prev === "Error" ? token : `${prev}${token}`));
};

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
           if (tab === "snake" && snacScreen === "PLAYING") {
        if (e.key === "ArrowUp" && dir.y !== 1) setDir({ x: 0, y: -1 });
        if (e.key === "ArrowDown" && dir.y !== -1) setDir({ x: 0, y: 1 });
        if (e.key === "ArrowLeft" && dir.x !== 1) setDir({ x: -1, y: 0 });
        if (e.key === "ArrowRight" && dir.x !== -1) setDir({ x: 1, y: 0 });
      } else if (tab === "2048") {
        if (e.key === "ArrowLeft") move2048("L");
        if (e.key === "ArrowRight") move2048("R");
        if (e.key === "ArrowUp") move2048("U");
        if (e.key === "ArrowDown") move2048("D");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shareScore = async () => {
    const textMap: Record<GameTab, string> = {
      snake: `🐍 **SNAC (${SNAC_DIFFS[diffIdx]?.label} • ${speedModeEnabled ? "DYNAMIC" : "STATIC"}):** Scored **${snakeScore} pts** (High: ${snacHigh})!`,
      mines: `💣 **Leafsty Minesweeper:** ${
        mineState === "won" ? "Cleared the minefield! 🎉" : "Hit a mine! 💥"
      }`,
      "2048": `🔢 **Leafsty 2048:** Reached **${score2048} pts** (Top tile: ${Math.max(
        ...grid2048
      )})!`,
      memory: `🃏 **Leafsty Memory Match:** ${
        cards.every((c) => c.matched)
          ? `Matched all pairs in **${moves} moves**! 🎉`
          : `${moves} moves played`
      }`,
      ttt: `⭕ **Leafsty Tic-Tac-Toe:** ${tttStatus}`,
      rps: `✊ **Leafsty RPS:** You **${rpsScore.you}** – **${rpsScore.bot}** LeafyBot`,
      calc: `🧮 **Calculator:** \`${calcExpr || calcResult}\` = **${calcResult}**`,
    };
    await onShareResult(textMap[tab]);
    onClose();
  };
  return (
    <div className="w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/30 shadow-2xl overflow-hidden text-emerald-50">
      <div className="px-3.5 py-2.5 bg-[#061410] border-b border-emerald-500/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-extrabold tracking-wide text-emerald-100">
            Leafsty Classic Arcade
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-emerald-300/70 hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2 bg-[#061410]/60 border-b border-emerald-500/15 grid grid-cols-3 gap-1">
        {(
          [
            { id: "snake", label: "🐍 SNAC" },
            { id: "calc", label: "🧮 Calc" },
            { id: "mines", label: "💣 Mines" },
            { id: "2048", label: "🔢 2048" },
            { id: "memory", label: "🃏 Memory" },
            { id: "ttt", label: "⭕ Tic-Tac" },
            { id: "rps", label: "✊ RPS" },
          ] as const
        ).map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setTab(g.id)}
            className={`py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              tab === g.id
                ? "bg-emerald-600 text-white"
                : "text-emerald-300/75 hover:bg-emerald-500/15"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="p-3.5">
             {tab === "snake" && (
       <div className="space-y-2.5 text-center font-mono">
         <div className="flex items-center justify-between text-[11px] font-bold px-1">
           <span className="text-[#00ffc8]">
             Score: {snakeScore} | High: {snacHigh}
           </span>
           <span className="text-emerald-300/80">
             {Math.round(snacFps)} FPS ({speedModeEnabled ? "DYNAMIC" : "STATIC"})
           </span>
         </div>

         <div className="relative w-64 h-48 mx-auto rounded-xl bg-[#0f0f19] border border-emerald-500/30 overflow-hidden shadow-inner">
           {/* 20x15 Grid + Snake + Food */}
                        <div
                className="grid w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${SNAC_COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${SNAC_ROWS}, minmax(0, 1fr))`,
                }}
              >
             {Array.from({ length: SNAC_COLS * SNAC_ROWS }).map((_, i) => {
               const x = i % SNAC_COLS;
               const y = Math.floor(i / SNAC_COLS);
               const segIdx = snake.findIndex((s) => s.x === x && s.y === y);
               const isFood = food.x === x && food.y === y;
               const scoreOffset = Math.floor(snakeScore / 10);
               const bg =
                 segIdx === 0
                   ? "rgb(0, 255, 200)"
                   : segIdx > 0
                   ? SNAC_PALETTE[(segIdx + 1 + scoreOffset) % SNAC_PALETTE.length]
                   : undefined;

               return (
                 <div
                   key={i}
                   className="border-[0.5px] border-[#191928] flex items-center justify-center"
                 >
                   {segIdx !== -1 ? (
                     <div
                       style={{ backgroundColor: bg }}
                       className="w-full h-full rounded-[2px]"
                     />
                   ) : isFood ? (
                     <div className="w-2.5 h-2.5 rounded-full bg-[#ff3c3c]" />
                   ) : null}
                 </div>
               );
             })}
           </div>

           {/* MENU & GAMEOVER Overlays */}
           {(snacScreen === "MENU" || snacScreen === "GAMEOVER") && (
             <div className="absolute inset-0 bg-[#0f0f19]/90 flex flex-col items-center justify-center p-3 space-y-2.5">
               <div className="text-2xl font-extrabold tracking-widest text-[#00ffc8]">
                 {snacScreen === "MENU" ? "SNAC" : "GAME OVER"}
               </div>
               <div className="text-[10px] text-zinc-200">
                 {snacScreen === "MENU"
                   ? "WRAP-AROUND ARENA • SHIFTING GRADIENT"
                   : `Score: ${snakeScore} | High Score: ${snacHigh}`}
               </div>
               <div className="flex flex-col gap-1.5 pt-1 w-44">
                 <button
                   type="button"
                   onClick={resetSnake}
                   className="py-1.5 px-3 rounded-lg bg-[#ffd700] text-zinc-950 font-extrabold text-xs hover:brightness-110 cursor-pointer"
                 >
                   &gt; START GAME &lt;
                 </button>
                 <button
                   type="button"
                   onClick={() => setSnacScreen("SETTINGS")}
                   className="py-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-100 font-bold text-xs cursor-pointer"
                 >
                   SETTINGS
                 </button>
               </div>
             </div>
           )}

           {/* SETTINGS Submenu */}
           {snacScreen === "SETTINGS" && (
             <div className="absolute inset-0 bg-[#0f0f19]/95 flex flex-col items-center justify-center p-3 space-y-2.5 text-[11px]">
               <div className="text-lg font-extrabold text-[#00ffc8]">
                 SETTINGS
               </div>
               <button
                 type="button"
                 onClick={() => setDiffIdx((d) => (d + 1) % 3)}
                 className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#ffd700] font-bold cursor-pointer"
               >
                 STARTING SPEED: &lt; {SNAC_DIFFS[diffIdx]?.label} &gt;
               </button>
               <button
                 type="button"
                 onClick={() => setSpeedModeEnabled((v) => !v)}
                 className={`px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-bold cursor-pointer ${
                   speedModeEnabled ? "text-[#32ff32]" : "text-zinc-400"
                 }`}
               >
                 SPEED MODE: {speedModeEnabled ? "ON (ACCELERATING)" : "OFF (CONSTANT)"}
               </button>
               <button
                 type="button"
                 onClick={() => setSnacScreen("MENU")}
                 className="mt-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer"
               >
                 &gt; SAVE &amp; RETURN &lt;
               </button>
             </div>
           )}
         </div>

         <div className="flex justify-center gap-1.5 pt-0.5">
           {[
             { label: "↑", d: { x: 0, y: -1 }, oppY: 1 },
             { label: "←", d: { x: -1, y: 0 }, oppX: 1 },
             { label: "↓", d: { x: 0, y: 1 }, oppY: -1 },
             { label: "→", d: { x: 1, y: 0 }, oppX: -1 },
           ].map((b) => (
             <button
               key={b.label}
               type="button"
               onClick={() => {
                 if (snacScreen !== "PLAYING") resetSnake();
                 if (b.oppY !== undefined && dir.y === b.oppY) return;
                 if (b.oppX !== undefined && dir.x === b.oppX) return;
                 setDir(b.d);
               }}
               className="w-8 h-7 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs font-bold hover:border-emerald-400 cursor-pointer"
             >
               {b.label}
             </button>
           ))}
         </div>
       </div>
     )}

        {tab === "mines" && (
          <div className="space-y-2.5 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>
                {mineState === "won"
                  ? "Cleared! 🎉"
                  : mineState === "lost"
                  ? "Boom! 💥"
                  : "Click to open • Right-click flag"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMines(buildMines());
                  setMineState("playing");
                }}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                New Board
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 w-56 mx-auto">
              {mines.map((cell, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openMineCell(i)}
                  onContextMenu={(e) => toggleFlag(e, i)}
                  className={`h-7 rounded-md text-xs font-extrabold flex items-center justify-center border cursor-pointer ${
                    cell.open
                      ? cell.mine
                        ? "bg-red-500/30 border-red-400 text-red-200"
                        : "bg-[#04120e] border-emerald-500/15 text-emerald-200"
                      : "bg-[#0d261e] border-emerald-500/30 hover:border-emerald-400"
                  }`}
                >
                  {cell.open ? (
                    cell.mine ? (
                      <Bomb className="w-3.5 h-3.5" />
                    ) : cell.adj > 0 ? (
                      cell.adj
                    ) : (
                      ""
                    )
                  ) : cell.flag ? (
                    <Flag className="w-3 h-3 text-amber-400" />
                  ) : (
                    ""
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === "2048" && (
          <div className="space-y-2.5 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Trophy className="w-3.5 h-3.5" /> Score: {score2048}
              </span>
              <button
                type="button"
                onClick={() => {
                  setGrid2048(init2048());
                  setScore2048(0);
                }}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 w-52 mx-auto p-1.5 rounded-xl bg-[#04120e] border border-emerald-500/25">
              {grid2048.map((val, i) => (
                <div
                  key={i}
                  className={`h-11 rounded-lg font-extrabold text-xs flex items-center justify-center ${
                    val === 0
                      ? "bg-[#091e18]"
                      : val >= 128
                      ? "bg-amber-500 text-zinc-950"
                      : val >= 16
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-700/80 text-emerald-50"
                  }`}
                >
                  {val || ""}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5">
              {(["←", "↑", "↓", "→"] as const).map((arrow) => {
                const map = { "←": "L", "↑": "U", "↓": "D", "→": "R" } as const;
                return (
                  <button
                    key={arrow}
                    type="button"
                    onClick={() => move2048(map[arrow])}
                    className="w-8 h-7 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs font-bold hover:border-emerald-400 cursor-pointer"
                  >
                    {arrow}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "memory" && (
          <div className="space-y-2.5 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Moves: {moves}</span>
              <button
                type="button"
                onClick={() => {
                  setCards(buildMemory());
                  setFlippedIdxs([]);
                  setMoves(0);
                }}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                Shuffle
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 w-52 mx-auto">
              {cards.map((card, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => flipCard(i)}
                  className={`h-11 rounded-xl border text-lg flex items-center justify-center transition cursor-pointer ${
                    card.flipped || card.matched
                      ? "bg-emerald-500/25 border-emerald-400"
                      : "bg-[#0d261e] border-emerald-500/25 hover:border-emerald-400/60"
                  }`}
                >
                  {card.flipped || card.matched ? card.icon : "?"}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "ttt" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
              <span>{tttStatus}</span>
              <button
                type="button"
                onClick={() => {
                  setBoard(Array(9).fill(null));
                  setTttStatus("Your turn (🌿)");
                }}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
              {board.map((cell, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTttClick(i)}
                  className="h-14 rounded-xl bg-[#0d261e] border border-emerald-500/25 hover:border-emerald-400/60 text-xl flex items-center justify-center transition cursor-pointer"
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "rps" && (
          <div className="space-y-3 text-center">
            <div className="text-xs font-extrabold text-emerald-300">
              You {rpsScore.you} — {rpsScore.bot} LeafyBot
            </div>
            <div className="text-xs text-emerald-100/85">{rpsLast}</div>
            <div className="flex justify-center gap-3 pt-1">
              {(["🪨", "📄", "✂️"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => playRps(c)}
                  className="w-14 h-14 rounded-2xl bg-[#0d261e] border border-emerald-500/25 hover:border-emerald-400 text-2xl flex items-center justify-center hover:scale-105 transition cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "calc" && (
       <div className="space-y-2.5 font-mono">
         {/* Display Screen */}
         <div className="p-3 rounded-xl bg-[#04120e] border border-emerald-500/25 text-right space-y-1">
           <input
             type="text"
             value={calcExpr}
             onChange={(e) => setCalcExpr(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === "Enter") {
                 e.preventDefault();
                 handleCalcPress("=");
               }
             }}
             placeholder="Type or tap equation..."
             className="w-full bg-transparent text-right text-xs text-emerald-300/80 placeholder:text-emerald-400/35 focus:outline-none"
           />
           <div className="flex items-center justify-between gap-2">
             <button
               type="button"
               onClick={() => {
                 navigator.clipboard?.writeText(calcResult);
                 setCalcCopied(true);
                 setTimeout(() => setCalcCopied(false), 1200);
               }}
               className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-bold text-emerald-300 cursor-pointer"
             >
               {calcCopied ? "Copied!" : "Copy"}
             </button>
             <div className="text-xl font-extrabold text-white truncate">
               {calcResult}
             </div>
           </div>
         </div>

         {/* Scientific Row */}
         <div className="grid grid-cols-5 gap-1">
           {["sin(", "cos(", "tan(", "√(", "^"].map((fn) => (
             <button
               key={fn}
               type="button"
               onClick={() => handleCalcPress(fn)}
               className="py-1.5 rounded-lg bg-[#061410] hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-bold text-emerald-300 cursor-pointer"
             >
               {fn.replace("(", "")}
             </button>
           ))}
           {["log(", "ln(", "π", "(", ")"].map((fn) => (
             <button
               key={fn}
               type="button"
               onClick={() => handleCalcPress(fn)}
               className="py-1.5 rounded-lg bg-[#061410] hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-bold text-emerald-300 cursor-pointer"
             >
               {fn.replace("(", "")}
             </button>
           ))}
         </div>

         {/* Standard Keypad */}
         <div className="grid grid-cols-4 gap-1.5">
           {[
             "C", "⌫", "%", "÷",
             "7", "8", "9", "×",
             "4", "5", "6", "−",
             "1", "2", "3", "+",
             "0", ".", "e", "=",
           ].map((btn) => {
             const isEq = btn === "=";
             const isClear = btn === "C" || btn === "⌫";
             const isOp = ["÷", "×", "−", "+", "%"].includes(btn);
             return (
               <button
                 key={btn}
                 type="button"
                 onClick={() => handleCalcPress(btn)}
                 className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                   isEq
                     ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                     : isClear
                     ? "bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200"
                     : isOp
                     ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200"
                     : "bg-[#0d261e] hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-50"
                 }`}
               >
                 {btn}
               </button>
             );
           })}
         </div>
       </div>
     )}


        <button
          type="button"
          onClick={shareScore}
          className="mt-3.5 w-full py-2 px-3 rounded-xl bg-[#0d261e] hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post Result to Chat</span>
        </button>
      </div>
    </div>
  );
}
