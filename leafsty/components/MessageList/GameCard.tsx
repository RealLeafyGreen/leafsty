"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Crown, Users, RotateCcw } from "lucide-react";

export interface LeafstyGameData {
  gameType: "chess" | "connect4" | "ttt" | "rps";
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  turn: "host" | "guest";
  winner?: string;
  board?: any;
  selectedIdx?: number | null;
  lastMove?: string;
  rpsChoices?: { host?: string; guest?: string };
}

export const INITIAL_CHESS_BOARD = [
  "bR","bN","bB","bQ","bK","bB","bN","bR",
  "bP","bP","bP","bP","bP","bP","bP","bP",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "wP","wP","wP","wP","wP","wP","wP","wP",
  "wR","wN","wB","wQ","wK","wB","wN","wR",
];

const CHESS_GLYPHS: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function isValidChessMove(board: string[], from: number, to: number, side: "w" | "b"): boolean {
  if (from === to) return false;
  const piece = board[from];
  if (!piece || !piece.startsWith(side)) return false;
  const target = board[to];
  if (target && target.startsWith(side)) return false;

  const r1 = Math.floor(from / 8), c1 = from % 8;
  const r2 = Math.floor(to / 8), c2 = to % 8;
  const dr = r2 - r1, dc = c2 - c1;
  const adr = Math.abs(dr), adc = Math.abs(dc);
  const kind = piece[1];

  const pathClear = () => {
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    let r = r1 + stepR, c = c1 + stepC;
    while (r !== r2 || c !== c2) {
      if (board[r * 8 + c]) return false;
      r += stepR;
      c += stepC;
    }
    return true;
  };

  if (kind === "P") {
    const dir = side === "w" ? -1 : 1;
    const startRow = side === "w" ? 6 : 1;
    if (dc === 0 && !target) {
      if (dr === dir) return true;
      if (r1 === startRow && dr === 2 * dir && !board[(r1 + dir) * 8 + c1]) return true;
    }
    if (adc === 1 && dr === dir && Boolean(target)) return true;
    return false;
  }
  if (kind === "N") return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
  if (kind === "K") return adr <= 1 && adc <= 1;
  if (kind === "R") return (dr === 0 || dc === 0) && pathClear();
  if (kind === "B") return adr === adc && pathClear();
  if (kind === "Q") return (dr === 0 || dc === 0 || adr === adc) && pathClear();
  return false;
}

export default function GameCard({
  message,
  game,
}: {
  message: any;
  game: LeafstyGameData;
}) {
  const { client } = useChatContext() as any;
  const meId = String(client?.userID || client?.user?.id || "");
  const meName = String((client?.user as any)?.name || meId || "Player");

  const [state, setState] = useState<LeafstyGameData>(game);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (game) setState(game);
  }, [game]);

  const isHost = meId === state.hostId;
  const isGuest = Boolean(state.guestId && meId === state.guestId);
  const canJoin = !isHost && !state.guestId && Boolean(meId);

  const pushGameState = async (next: LeafstyGameData) => {
    setState(next);
    if (!message?.id || String(message.id).startsWith("temp-")) return;
    setBusy(true);
    try {
      await fetch("/api/game-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          userId: meId,
          gameState: next,
        }),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () => {
    if (!canJoin || busy) return;
    pushGameState({
      ...state,
      guestId: meId,
      guestName: meName,
      lastMove: `${meName} joined the match!`,
    });
  };
  const myTurn =
    !state.winner &&
    ((state.turn === "host" && isHost) || (state.turn === "guest" && isGuest));

  const onChessSquareClick = (idx: number) => {
    if (state.gameType !== "chess" || !myTurn || busy) return;
    const board: string[] = Array.isArray(state.board)
      ? [...state.board]
      : [...INITIAL_CHESS_BOARD];
    const side: "w" | "b" = isHost ? "w" : "b";
    const clickedPiece = board[idx];

    if (selectedSquare === null) {
      if (clickedPiece && clickedPiece.startsWith(side)) {
        setSelectedSquare(idx);
      }
      return;
    }

    if (clickedPiece && clickedPiece.startsWith(side)) {
      setSelectedSquare(idx === selectedSquare ? null : idx);
      return;
    }

    if (isValidChessMove(board, selectedSquare, idx, side)) {
      const moving = board[selectedSquare];
      const captured = board[idx];
      board[idx] =
        moving === "wP" && Math.floor(idx / 8) === 0
          ? "wQ"
          : moving === "bP" && Math.floor(idx / 8) === 7
          ? "bQ"
          : moving;
      board[selectedSquare] = "";
      setSelectedSquare(null);

      const capturedKing = captured === "wK" || captured === "bK";
      pushGameState({
        ...state,
        board,
        turn: state.turn === "host" ? "guest" : "host",
        winner: capturedKing ? meName : undefined,
        lastMove: capturedKing
          ? `👑 ${meName} captured the King and won!`
          : `${meName} moved ${CHESS_GLYPHS[moving] || moving}`,
      });
    } else {
      setSelectedSquare(null);
    }
  };

  const onConnect4Col = (col: number) => {
    if (state.gameType !== "connect4" || !myTurn || busy) return;
    const board: number[] = Array.isArray(state.board)
      ? [...state.board]
      : Array(42).fill(0);
    const token = isHost ? 1 : 2;
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (board[r * 7 + col] === 0) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return;
    board[targetRow * 7 + col] = token;

    const has4 = () => {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          const v = board[r * 7 + c];
          if (!v) continue;
          if (c <= 3 && v === board[r * 7 + c + 1] && v === board[r * 7 + c + 2] && v === board[r * 7 + c + 3]) return true;
          if (r <= 2 && v === board[(r + 1) * 7 + c] && v === board[(r + 2) * 7 + c] && v === board[(r + 3) * 7 + c]) return true;
          if (r <= 2 && c <= 3 && v === board[(r + 1) * 7 + c + 1] && v === board[(r + 2) * 7 + c + 2] && v === board[(r + 3) * 7 + c + 3]) return true;
          if (r >= 3 && c <= 3 && v === board[(r - 1) * 7 + c + 1] && v === board[(r - 2) * 7 + c + 2] && v === board[(r - 3) * 7 + c + 3]) return true;
        }
      }
      return false;
    };

    const won = has4();
    const full = board.every((v) => v !== 0);
    pushGameState({
      ...state,
      board,
      turn: state.turn === "host" ? "guest" : "host",
      winner: won ? meName : full ? "Draw" : undefined,
      lastMove: won ? `🎉 ${meName} connected 4!` : `${meName} dropped in col ${col + 1}`,
    });
  };

  const onTttCell = (idx: number) => {
    if (state.gameType !== "ttt" || !myTurn || busy) return;
    const board: string[] = Array.isArray(state.board) ? [...state.board] : Array(9).fill("");
    if (board[idx]) return;
    board[idx] = isHost ? "🌿" : "🔥";
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

    const won = lines.some(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
    const draw = !won && board.every(Boolean);
    pushGameState({
      ...state,
      board,
      turn: state.turn === "host" ? "guest" : "host",
      winner: won ? meName : draw ? "Draw" : undefined,
      lastMove: won ? `🎉 ${meName} won Tic-Tac-Toe!` : `${meName} played`,
    });
  };

  const onRpsPick = (pick: "🪨" | "📄" | "✂️") => {
    if (state.gameType !== "rps" || (!isHost && !isGuest) || state.winner || busy) return;
    const choices = { ...(state.rpsChoices || {}) };
    if (isHost) choices.host = pick;
    if (isGuest) choices.guest = pick;

    if (choices.host && choices.guest) {
      const h = choices.host, g = choices.guest;
      let winner = "Draw";
      if (h !== g) {
        const hostWins = (h === "🪨" && g === "✂️") || (h === "📄" && g === "🪨") || (h === "✂️" && g === "📄");
        winner = hostWins ? state.hostName : state.guestName || "Guest";
      }
      pushGameState({
        ...state,
        rpsChoices: choices,
        winner,
        lastMove: `${state.hostName} ${h} vs ${g} ${state.guestName}`,
      });
    } else {
      pushGameState({
        ...state,
        rpsChoices: choices,
        lastMove: `${meName} locked in a move!`,
      });
    }
  };
  const titles: Record<string, string> = {
    chess: "♟️ Leafsty Multiplayer Chess",
    connect4: "🔴 Leafsty Connect 4",
    ttt: "⭕ Leafsty Tic-Tac-Toe",
    rps: "✊ Leafsty Rock-Paper-Scissors",
  };

  return (
    <div className="w-72 sm:w-80 rounded-2xl bg-[#071813] border border-emerald-500/30 p-3.5 shadow-xl text-emerald-50 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-emerald-200">
          {titles[state.gameType] || "Leafsty Activity"}
        </span>
        {state.winner && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-extrabold text-amber-200">
            <Crown className="w-3 h-3" /> {state.winner}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] bg-[#0b231c] border border-emerald-500/20 rounded-xl px-2.5 py-1.5">
        <span className={state.turn === "host" && !state.winner ? "font-extrabold text-emerald-300" : "text-emerald-200/75"}>
          {state.gameType === "chess" ? "♔" : "🌿"} {state.hostName}
        </span>
        <span className="text-emerald-500 font-bold">VS</span>
        {state.guestName ? (
          <span className={state.turn === "guest" && !state.winner ? "font-extrabold text-emerald-300" : "text-emerald-200/75"}>
            {state.gameType === "chess" ? "♚" : "🔥"} {state.guestName}
          </span>
        ) : canJoin ? (
          <button
            type="button"
            onClick={handleJoin}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
          >
            <Users className="w-3 h-3" /> Join Match
          </button>
        ) : (
          <span className="text-emerald-300/50 italic">Waiting for P2...</span>
        )}
      </div>

      {state.gameType === "chess" && (
        <div className="grid grid-cols-8 w-64 h-64 mx-auto rounded-xl overflow-hidden border border-emerald-500/30">
          {(Array.isArray(state.board) ? state.board : INITIAL_CHESS_BOARD).map((cell: string, idx: number) => {
            const r = Math.floor(idx / 8), c = idx % 8;
            const dark = (r + c) % 2 === 1;
            const selected = selectedSquare === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChessSquareClick(idx)}
                className={`w-8 h-8 flex items-center justify-center text-lg leading-none select-none cursor-pointer transition ${
                  selected
                    ? "bg-amber-400/70"
                    : dark
                    ? "bg-[#144234] hover:bg-[#1a5241]"
                    : "bg-[#a7d7c5] hover:bg-[#bce3d4]"
                } ${cell?.startsWith("w") ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]" : "text-zinc-950"}`}
              >
                {CHESS_GLYPHS[cell] || ""}
              </button>
            );
          })}
        </div>
      )}

      {state.gameType === "connect4" && (
        <div className="grid grid-cols-7 gap-1 w-64 mx-auto p-2 rounded-xl bg-[#0d2c23] border border-emerald-500/25">
          {(Array.isArray(state.board) ? state.board : Array(42).fill(0)).map((val: number, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => onConnect4Col(idx % 7)}
              className={`w-7 h-7 rounded-full border border-emerald-500/20 cursor-pointer transition ${
                val === 1 ? "bg-emerald-400" : val === 2 ? "bg-amber-400" : "bg-[#061410] hover:bg-emerald-500/15"
              }`}
            />
          ))}
        </div>
      )}

      {state.gameType === "ttt" && (
        <div className="grid grid-cols-3 gap-1.5 w-44 mx-auto">
          {(Array.isArray(state.board) ? state.board : Array(9).fill("")).map((val: string, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => onTttCell(idx)}
              className="h-13 rounded-xl bg-[#0d261e] border border-emerald-500/25 hover:border-emerald-400 text-xl flex items-center justify-center cursor-pointer"
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {state.gameType === "rps" && (
        <div className="flex justify-center gap-3 py-1">
          {(["🪨", "📄", "✂️"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onRpsPick(c)}
              className="w-12 h-12 rounded-xl bg-[#0d261e] border border-emerald-500/25 hover:border-emerald-400 text-xl flex items-center justify-center cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {state.lastMove && (
        <div className="text-[11px] text-center text-emerald-300/80 font-medium">
          {state.lastMove}
        </div>
      )}
    </div>
  );
}
