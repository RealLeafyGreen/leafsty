"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  ShieldCheck,
} from "lucide-react";

interface LeafstyCallStageProps {
  channel: any;
  currentUserId: string;
  currentUserImage?: string;
  peerName?: string;
  peerImage?: string;
  roomLabel: string;
  startWithVideo?: boolean;
  onLeave: () => void;
}

function useSpeakingDetector(stream: MediaStream | null, enabled = true) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || !enabled || stream.getAudioTracks().length === 0) {
      setSpeaking(false);
      return;
    }

    let rafId: number;
    let ctx: AudioContext | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setSpeaking(sum / data.length > 14);
        rafId = requestAnimationFrame(checkVolume);
      };

      rafId = requestAnimationFrame(checkVolume);
    } catch {}

    return () => {
      cancelAnimationFrame(rafId);
      ctx?.close().catch(() => {});
    };
  }, [stream, enabled]);

  return speaking;
}
export default function LeafstyCallStage({
  channel,
  currentUserId,
  currentUserImage,
  peerName,
  peerImage,
  roomLabel,
  startWithVideo = false,
  onLeave,
}: LeafstyCallStageProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(startWithVideo);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerCamOn, setPeerCamOn] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState(peerName || "Peer");
  const [remotePeerImage, setRemotePeerImage] = useState(peerImage || "");
  const [statusText, setStatusText] = useState("Connecting media devices...");

  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const localSpeaking = useSpeakingDetector(localStreamState, micOn);
  const remoteSpeaking = useSpeakingDetector(remoteStreamState, peerConnected);

  const sendSignal = (payload: Record<string, any>) => {
    bcRef.current?.postMessage({
      signalType: "webrtc",
      senderId: currentUserId,
      senderImage: currentUserImage || "",
      ...payload,
    });
  };

  const toPlainSdp = (desc: RTCSessionDescription | null) =>
    desc ? { type: desc.type, sdp: desc.sdp } : null;
  useEffect(() => {
    if (!channel) return;
    let active = true;
    const tabId = Math.random().toString(36).slice(2);
    const pendingCandidates: RTCIceCandidateInit[] = [];
    let pcReady = false;
    let peerTabId: string | null = null;

    const createAndSendOffer = async () => {
      const pc = pcRef.current;
      if (!active || !pc || !pcReady || pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      if (!active || pc.signalingState !== "stable") return;
      await pc.setLocalDescription(offer);
      sendSignal({ sdp: toPlainSdp(pc.localDescription), tabId, camActive: camOn || sharingScreen });
    };

    const handleSignal = async (event: any) => {
      if (!active || event?.signalType !== "webrtc" || event.tabId === tabId) return;
      const pc = pcRef.current;
      if (!pc || !pcReady) return;

      if (event.senderId) setRemotePeerName(event.senderId);
      if (event.senderImage) setRemotePeerImage(event.senderImage);
      if (typeof event.camActive === "boolean") setPeerCamOn(event.camActive);

      try {
        if (event.ready || event.readyAck) {
          peerTabId = event.tabId;
          if (tabId > event.tabId) {
            await createAndSendOffer();
          } else if (event.ready) {
            sendSignal({ readyAck: true, tabId, camActive: camOn || sharingScreen });
          }
          return;
        }

        if (event.sdp) {
          if (event.sdp.type === "offer") {
            if ((peerTabId && tabId > peerTabId) || pc.signalingState !== "stable") return;
            await pc.setRemoteDescription(new RTCSessionDescription(event.sdp));
            while (pendingCandidates.length > 0) {
              const cand = pendingCandidates.shift();
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            const answer = await pc.createAnswer();
            if (!active || (pc.signalingState as RTCSignalingState) !== "have-remote-offer") return;
            const fixedAnswer = {
              type: answer.type,
              sdp: (answer.sdp || "").replace(/a=setup:actpass/g, "a=setup:active"),
            };
            await pc.setLocalDescription(fixedAnswer);
            sendSignal({ sdp: fixedAnswer, tabId, camActive: camOn || sharingScreen });
          } else if (event.sdp.type === "answer") {
            if (pc.signalingState !== "have-local-offer") return;
            await pc.setRemoteDescription(new RTCSessionDescription(event.sdp));
            while (pendingCandidates.length > 0) {
              const cand = pendingCandidates.shift();
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
        } else if (event.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
          } else {
            pendingCandidates.push(event.candidate);
          }
        }
      } catch (err) {
        console.error("WebRTC signaling error:", err);
      }
    };

    const bc = new BroadcastChannel(`leafsty-call-${channel.id}`);
    bcRef.current = bc;
    bc.onmessage = (msg) => handleSignal(msg.data);

    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: startWithVideo,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStreamState(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        setStatusText("Waiting for peer to join...");
        const pc = new RTCPeerConnection({ iceServers: [] });
        pcRef.current = pc;

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setPeerConnected(true);
            setStatusText("Connected • Peer-to-Peer Encrypted");
          } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            setPeerConnected(false);
            setStatusText("Peer disconnected • Waiting...");
          }
        };

        const audioTx = pc.addTransceiver("audio", { direction: "sendrecv" });
        const videoTx = pc.addTransceiver("video", { direction: "sendrecv" });

        const audioTrack = stream.getAudioTracks().at(0) || null;
        const videoTrack = stream.getVideoTracks().at(0) || null;
        if (audioTrack) await audioTx.sender.replaceTrack(audioTrack);
        if (videoTrack) await videoTx.sender.replaceTrack(videoTrack);

        pc.ontrack = (event) => {
          const rStream = event.streams.at(0) || new MediaStream([event.track]);
          setRemoteStreamState(rStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = rStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          if (event.track.kind === "video") {
            event.track.onunmute = () => setPeerCamOn(true);
            event.track.onmute = () => setPeerCamOn(false);
          }
          setPeerConnected(true);
          setStatusText("Connected • Peer-to-Peer Encrypted");
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ candidate: event.candidate.toJSON(), tabId });
          }
        };

        pcReady = true;
        sendSignal({ ready: true, tabId, camActive: startWithVideo });

        const globalBc = new BroadcastChannel("leafsty-global-calls");
        globalBc.postMessage({
          type: "incoming-call",
          channelId: channel.id,
          callerId: currentUserId,
          callerName: currentUserId,
          roomLabel,
          withVideo: startWithVideo,
        });
        globalBc.close();
      } catch (err: any) {
        setStatusText(err?.message || "Mic/Camera permission denied");
      }
    };

    const startTimer = setTimeout(() => {
      if (active) setupCall();
    }, 50);

    return () => {
      active = false;
      clearTimeout(startTimer);
      const endBc = new BroadcastChannel("leafsty-global-calls");
      endBc.postMessage({ type: "call-ended", channelId: channel.id, callerId: currentUserId });
      endBc.close();
      bc.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [channel, currentUserId, startWithVideo, roomLabel]);
  useEffect(() => {
    if (peerCamOn && remoteVideoRef.current && remoteStreamState) {
      remoteVideoRef.current.srcObject = remoteStreamState;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [peerCamOn, remoteStreamState]);

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCamera = async () => {
    const stream = localStreamRef.current;
    const pc = pcRef.current;
    if (!stream || !pc) return;
    const existing = stream.getVideoTracks().at(0);
    if (existing) {
      const next = !camOn;
      existing.enabled = next;
      setCamOn(next);
      sendSignal({ camActive: next || sharingScreen });
      return;
    }
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = camStream.getVideoTracks().at(0);
      if (!track) return;
      stream.addTrack(track);
      const videoTx = pc.getTransceivers().at(1);
      await videoTx?.sender.replaceTrack(track);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCamOn(true);
      sendSignal({ camActive: true });
    } catch {
      setStatusText("Camera permission denied");
    }
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    const stream = localStreamRef.current;
    if (!pc || !stream) return;
    if (sharingScreen) {
      setSharingScreen(false);
      sendSignal({ camActive: camOn });
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks().at(0);
      if (!screenTrack) return;
      const videoTx = pc.getTransceivers().at(1);
      await videoTx?.sender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = displayStream;
      setSharingScreen(true);
      sendSignal({ camActive: true });
      screenTrack.onended = async () => {
        setSharingScreen(false);
        const camTrack = stream.getVideoTracks().at(0) || null;
        await videoTx?.sender.replaceTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        sendSignal({ camActive: camOn });
      };
    } catch {}
  };
  const mediaBox = (ref: React.RefObject<HTMLVideoElement | null>, visible: boolean, muted: boolean) =>
    React.createElement("video", {
      ref,
      autoPlay: true,
      playsInline: true,
      muted,
      className: visible ? "w-full h-full object-cover" : "hidden",
    });

  const renderAvatar = (name: string, imgUrl: string | undefined, speaking: boolean) => (
    <div className="relative flex items-center justify-center">
      {speaking && (
        <span className="absolute -inset-3 rounded-full bg-emerald-500/25 animate-ping" />
      )}
      <div className={`relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-black text-2xl transition-all duration-150 ${speaking ? "ring-4 ring-emerald-400 scale-105 shadow-lg shadow-emerald-500/40" : "ring-2 ring-emerald-500/20"} bg-emerald-600 text-white`}>
        {imgUrl ? (
          <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
    </div>
  );

  return (
    <section className="flex-1 flex flex-col justify-between bg-[#07110d] text-white p-5 overflow-hidden">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold">{roomLabel}</h3>
          <p className="text-xs text-emerald-400">{statusText}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" /> E2EE Call
        </span>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 flex-1 min-h-0">
        <article className="relative rounded-3xl bg-[#0d1c16] border border-emerald-500/20 overflow-hidden flex items-center justify-center">
          {mediaBox(localVideoRef, camOn || sharingScreen, true)}
          {!camOn && !sharingScreen && renderAvatar(currentUserId, currentUserImage, localSpeaking)}
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-xs font-bold flex items-center gap-1.5">
            {localSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            You
          </span>
        </article>

        <article className="relative rounded-3xl bg-[#0d1c16] border border-emerald-500/20 overflow-hidden flex items-center justify-center">
          {mediaBox(remoteVideoRef, peerConnected && peerCamOn, false)}
          {(!peerConnected || !peerCamOn) && (
            <div className="flex flex-col items-center gap-3">
              {renderAvatar(remotePeerName, remotePeerImage, remoteSpeaking)}
              {!peerConnected && <span className="text-xs font-semibold text-zinc-400">Waiting for peer...</span>}
            </div>
          )}
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-xs font-bold flex items-center gap-1.5">
            {remoteSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            {remotePeerName}
          </span>
        </article>
      </main>

      <footer className="flex items-center justify-center gap-3 pb-2">
        <button type="button" onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${micOn ? "bg-white/10" : "bg-red-500"}`}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button type="button" onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${camOn ? "bg-emerald-600" : "bg-white/10"}`}>
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button type="button" onClick={toggleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${sharingScreen ? "bg-emerald-600" : "bg-white/10"}`}>
          <MonitorUp className="w-5 h-5" />
        </button>
        <button type="button" onClick={onLeave} className="w-14 h-12 rounded-full bg-red-600 flex items-center justify-center cursor-pointer">
          <PhoneOff className="w-5 h-5" />
        </button>
      </footer>
    </section>
  );
}
