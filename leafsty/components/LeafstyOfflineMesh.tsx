"use client";

import React, { useEffect, useRef, useState } from "react";
import { Radio, Copy, Check, Link2, X } from "lucide-react";

export default function LeafstyOfflineMesh() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [peerName, setPeerName] = useState("Local Peer");
  const [offerCode, setOfferCode] = useState("");
  const [remoteInput, setRemoteInput] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [copied, setCopied] = useState<"offer" | "answer" | null>(null);
  const [statusMsg, setStatusMsg] = useState(
    "Connect two devices on the same Wi-Fi or Personal Hotspot without internet."
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const getMyProfile = () => {
    try {
      const u = JSON.parse(localStorage.getItem("leafsty_user") || "{}");
      return {
        id: String(u.id || "local-user"),
        name: String(u.name || u.id || "Local User"),
        image: u.image || "",
      };
    } catch {
      return { id: "local-user", name: "Local User", image: "" };
    }
  };

  const wireDataChannel = (dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onopen = () => {
      setConnected(true);
      setStatusMsg("Connected directly over Local LAN / Hotspot!");
      dc.send(JSON.stringify({ kind: "hello", user: getMyProfile() }));
    };
    dc.onclose = () => {
      setConnected(false);
      setStatusMsg("Local P2P link closed.");
    };
    dc.onmessage = (ev) => {
      try {
        const packet = JSON.parse(String(ev.data || "{}"));
        if (packet.kind === "hello" && packet.user?.name) {
          setPeerName(String(packet.user.name));
        } else if (packet.kind === "chat" && packet.message) {
          window.dispatchEvent(
            new CustomEvent("leafsty:message-sent", {
              detail: packet.message,
            })
          );
        }
      } catch {}
    };
  };
  const waitForIceComplete = (pc: RTCPeerConnection) =>
    new Promise<void>((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, 1800);
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timer);
          resolve();
        }
      };
    });

  const handleCreateHostOffer = async () => {
    try {
      pcRef.current?.close();
      setAnswerCode("");
      setStatusMsg("Gathering local LAN candidates...");
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;
      const dc = pc.createDataChannel("leafsty-lan");
      wireDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceComplete(pc);

      const encoded = btoa(JSON.stringify(pc.localDescription));
      setOfferCode(encoded);
      setStatusMsg(
        "Step 1 ready: Copy your Invite Code and send it to the other device."
      );
    } catch (err: any) {
      setStatusMsg(err?.message || "Could not create LAN offer.");
    }
  };

  const handleProcessRemoteCode = async () => {
    const raw = remoteInput.trim();
    if (!raw) return;
    try {
      const desc = JSON.parse(atob(raw));

      if (desc.type === "offer") {
        pcRef.current?.close();
        const pc = new RTCPeerConnection({ iceServers: [] });
        pcRef.current = pc;
        pc.ondatachannel = (ev) => wireDataChannel(ev.channel);

        await pc.setRemoteDescription(new RTCSessionDescription(desc));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceComplete(pc);

        const encodedAnswer = btoa(JSON.stringify(pc.localDescription));
        setAnswerCode(encodedAnswer);
        setRemoteInput("");
        setStatusMsg(
          "Step 2 ready: Copy your Reply Code back to the Host device!"
        );
      } else if (desc.type === "answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(desc)
        );
        setRemoteInput("");
        setStatusMsg("Completing direct LAN handshake...");
      }
    } catch {
      setStatusMsg("Invalid pairing code — make sure you copied the full text.");
    }
  };

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onLanSend = (e: any) => {
      const msg = e?.detail;
      const dc = dcRef.current;
      if (msg && dc && dc.readyState === "open") {
        dc.send(JSON.stringify({ kind: "chat", message: msg }));
      }
    };

    window.addEventListener("leafsty:open-lan-mesh", onOpen);
    window.addEventListener("leafsty:lan-send", onLanSend);
    return () => {
      window.removeEventListener("leafsty:open-lan-mesh", onOpen);
      window.removeEventListener("leafsty:lan-send", onLanSend);
    };
  }, []);

  const copyText = (val: string, kind: "offer" | "answer") => {
    navigator.clipboard?.writeText(val);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };
  if (!open) {
    if (!connected) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full bg-emerald-600/95 border border-emerald-300/40 text-white text-xs font-extrabold shadow-xl flex items-center gap-1.5 cursor-pointer"
      >
        <Radio className="w-3.5 h-3.5 animate-pulse" />
        <span>LAN P2P · {peerName}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#081914] border border-emerald-500/30 p-5 text-emerald-50 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold">
              Leafsty Offline LAN / Hotspot Mesh
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-emerald-300/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-emerald-300/80">{statusMsg}</p>

        {connected ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-emerald-100">
                Direct P2P Connected with {peerName}
              </div>
              <div className="text-[11px] text-emerald-300/75">
                Messages send directly device-to-device with zero internet.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                dcRef.current?.close();
                pcRef.current?.close();
                setConnected(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-200 text-xs font-bold cursor-pointer shrink-0"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCreateHostOffer}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>1. Host Local Room (Generate Invite Code)</span>
            </button>

            {offerCode && (
              <div className="p-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                  <span>Your Invite Code (Share to Other Device)</span>
                  <button
                    type="button"
                    onClick={() => copyText(offerCode, "offer")}
                    className="inline-flex items-center gap-1 text-emerald-200 hover:text-white cursor-pointer"
                  >
                    {copied === "offer" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copied === "offer" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={offerCode}
                  rows={2}
                  className="w-full bg-[#061410] rounded-lg p-1.5 text-[10px] font-mono text-emerald-200/80 resize-none focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5 pt-1 border-t border-emerald-500/15">
              <label className="block text-[11px] font-bold text-emerald-300/80">
                2. Paste Invite Code (Guest) or Reply Code (Host):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remoteInput}
                  onChange={(e) => setRemoteInput(e.target.value)}
                  placeholder="Paste code here..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleProcessRemoteCode}
                  disabled={!remoteInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-xs font-extrabold cursor-pointer"
                >
                  Pair
                </button>
              </div>
            </div>

            {answerCode && (
              <div className="p-2.5 rounded-xl bg-[#0d261e] border border-amber-400/35 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                  <span>Your Reply Code (Send Back to Host)</span>
                  <button
                    type="button"
                    onClick={() => copyText(answerCode, "answer")}
                    className="inline-flex items-center gap-1 text-amber-200 hover:text-white cursor-pointer"
                  >
                    {copied === "answer" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copied === "answer" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={answerCode}
                  rows={2}
                  className="w-full bg-[#061410] rounded-lg p-1.5 text-[10px] font-mono text-amber-200/80 resize-none focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
