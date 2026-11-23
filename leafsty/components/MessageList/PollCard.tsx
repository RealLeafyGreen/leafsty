"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";

export default function PollCard({
  message,
  question,
  options,
  activeChannel,
}: {
  message: any;
  question: string;
  options: string[];
  activeChannel: any;
}) {
  const [optimisticIdx, setOptimisticIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const serverVotedIdx = useMemo(() => {
    if (!Array.isArray(message?.own_reactions)) return null;
    for (const r of message.own_reactions) {
      const t = String(r?.type || "");
      if (t.startsWith("poll_vote_")) {
        const idx = Number(t.replace("poll_vote_", ""));
        if (!Number.isNaN(idx)) return idx;
      }
    }
    return null;
  }, [message?.own_reactions]);

  const activeVoteIdx =
    optimisticIdx !== null ? optimisticIdx : serverVotedIdx;

  const voteCounts = useMemo(() => {
    const counts = options.map((_, idx) => {
      const key = `poll_vote_${idx}`;
      const raw = Number(message?.reaction_counts?.[key] || 0);
      return Math.max(0, raw);
    });

    if (optimisticIdx !== null && optimisticIdx !== serverVotedIdx) {
      if (serverVotedIdx !== null && counts[serverVotedIdx] !== undefined) {
        counts[serverVotedIdx] = Math.max(0, counts[serverVotedIdx] - 1);
      }
      if (counts[optimisticIdx] !== undefined) {
        counts[optimisticIdx] += 1;
      }
    }
    return counts;
  }, [options, message?.reaction_counts, optimisticIdx, serverVotedIdx]);

  const totalVotes = voteCounts.reduce((acc, n) => acc + n, 0);

  const handleVote = async (idx: number) => {
    if (busy || !message?.id || !activeChannel) return;
    setBusy(true);
    const prevIdx = activeVoteIdx;
    setOptimisticIdx(idx);

    try {
      if (prevIdx !== null && prevIdx !== idx) {
        await activeChannel
          .deleteReaction?.(message.id, `poll_vote_${prevIdx}`)
          .catch(() => {});
      }
      if (prevIdx !== idx) {
        await activeChannel.sendReaction?.(message.id, {
          type: `poll_vote_${idx}`,
        });
      }
    } catch {
      setOptimisticIdx(prevIdx);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-[#0b211a] border border-emerald-500/30 p-3.5 shadow-lg space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
            Live Poll
          </div>
          <div className="text-sm font-extrabold text-emerald-50 leading-snug">
            {question}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {options.map((opt, idx) => {
          const count = voteCounts.at(idx) ?? 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = activeVoteIdx === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left rounded-xl border px-3 py-2 overflow-hidden transition cursor-pointer ${
                isSelected
                  ? "border-emerald-400 bg-emerald-500/15 text-white"
                  : "border-emerald-500/20 bg-[#071611] hover:border-emerald-400/45 text-emerald-100"
              }`}
            >
              <div
                style={{ width: `${pct}%` }}
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                  isSelected ? "bg-emerald-500/30" : "bg-emerald-500/15"
                }`}
              />
              <div className="relative flex items-center justify-between gap-2 text-xs">
                <span className="font-bold flex items-center gap-1.5 truncate">
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{opt}</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-300/85 shrink-0">
                  {pct}% ({count})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-emerald-400/70 font-semibold flex items-center justify-between">
        <span>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        <span>Click an option to vote</span>
      </div>
    </div>
  );
}
