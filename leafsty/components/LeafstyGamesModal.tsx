"use client";

import React, { useCallback, useEffect, useState } from "react";
import { X, Gamepad2, RotateCcw, Send, Trophy, Bomb, Flag } from "lucide-react";

interface LeafstyGamesModalProps {
  onClose: () => void;
  onShareResult: (summaryText: string) => Promise<void> | void;
}

type GameTab = "snake" | "mines" | "2048" | "memory" | "ttt" | "rps";

const MEMORY_ICONS = ["🌿", "🍃", "🦊", "🐸", "🍄", "💎", "🔥", "🌙"];

export default function LeafstyGamesModal({
  onClose,
  onShareResult,
}: LeafstyGamesModalProps) {
  const [tab, setTab] = useState<GameTab>("snake");

  // ================= 1. SNAKE =================
  const GRID = 12;
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ]);
  const [dir, setDir] = useState<{ x: number; y: number }>({ x: 1, y: 0 });
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 8, y: 6 });
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeOver, setSnakeOver] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);

  const resetSnake = () => {
    setSnake([
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ]);
    setDir({ x: 1, y: 0 });
    setFood({ x: 8, y: 6 });
    setSnakeScore(0);
    setSnakeOver(false);
    setSnakeRunning(true);
  };

  useEffect(() => {
    if (!snakeRunning || tab !== "snake") return;
    const t = setInterval(() => {
      setSnake((prev) => {
        const head = { x: prev.x + dir.x, y: prev.y + dir.y };
        if (
          head.x < 0 ||
          head.x >= GRID ||
          head.y < 0 ||
          head.y >= GRID ||
          prev.some((s) => s.x === head.x && s.y === head.y)
        ) {
          setSnakeRunning(false);
          setSnakeOver(true);
          return prev;
        }
        const next = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setSnakeScore((s) => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID),
          });
        } else {
          next.pop();
        }
        return next;
      });
    }, 170);
    return () => clearInterval(t);
  }, [snakeRunning, dir, food, tab]);

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
    const lines = [,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
    ];
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tab === "snake" && snakeRunning) {
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
      snake: `🐍 **Leafsty Snake:** Scored **${snakeScore} pts**!`,
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
            { id: "snake", label: "🐍 Snake" },
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
          <div className="space-y-2.5 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-300">Score: {snakeScore}</span>
              <button
                type="button"
                onClick={resetSnake}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                {snakeRunning ? "Restart" : "Start Game"}
              </button>
            </div>
            <div className="grid grid-cols-12 gap-0.5 w-52 h-52 mx-auto p-1 rounded-xl bg-[#04120e] border border-emerald-500/25">
              {Array.from({ length: GRID * GRID }).map((_, i) => {
                const x = i % GRID;
                const y = Math.floor(i / GRID);
                const isHead = snake[0]?.x === x && snake[0]?.y === y;
                const isBody = snake.some((s) => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;
                return (
                  <div
                    key={i}
                    className={`rounded-[2px] ${
                      isHead
                        ? "bg-emerald-300"
                        : isBody
                        ? "bg-emerald-500"
                        : isFood
                        ? "bg-amber-400"
                        : "bg-[#091e18]"
                    }`}
                  />
                );
              })}
            </div>
            {snakeOver && (
              <div className="text-xs font-bold text-red-300">
                Game Over! Final Score: {snakeScore}
              </div>
            )}
            <div className="flex justify-center gap-1.5 pt-0.5">
              {[
                { label: "↑", d: { x: 0, y: -1 } },
                { label: "←", d: { x: -1, y: 0 } },
                { label: "↓", d: { x: 0, y: 1 } },
                { label: "→", d: { x: 1, y: 0 } },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => {
                    if (!snakeRunning && !snakeOver) setSnakeRunning(true);
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
