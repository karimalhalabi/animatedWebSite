import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { attachLocalTracks } from "../utils/rtc";
import { useTeam } from "../context/teamStore";
export function useMeeting(roomId) {
  const { socket, call, iceServers } = useTeam();
  const [joined, setJoined] = useState(false),
    [busy, setBusy] = useState(false),
    [room, setRoom] = useState(null),
    [localStream, setLocalStream] = useState(null),
    [peers, setPeers] = useState([]),
    [messages, setMessages] = useState([]),
    [mic, setMic] = useState(true),
    [camera, setCamera] = useState(true),
    [sharing, setSharing] = useState(false);
  const media = useRef(null),
    screen = useRef(null),
    connections = useRef(new Map()),
    alive = useRef(true),
    inRoom = useRef(false),
    starting = useRef(false);
  const syncPeers = () =>
    setPeers(
      [...connections.current.entries()].map(([socketId, p]) => ({
        socketId,
        memberId: p.memberId,
        stream: p.stream,
        state: p.pc.connectionState,
      })),
    );
  async function sendSignal(target, data) {
    await call("signal:send", { target, ...data });
  }
  function makePeer(socketId, memberId) {
    if (connections.current.has(socketId))
      return connections.current.get(socketId);
    const pc = new RTCPeerConnection({ iceServers }),
      stream = new MediaStream();
    const peer = { pc, stream, memberId, candidates: [] };
    connections.current.set(socketId, peer);
    pc.onicecandidate = (e) => {
      if (e.candidate)
        sendSignal(socketId, { candidate: e.candidate.toJSON() }).catch(
          () => {},
        );
    };
    pc.ontrack = (e) => {
      if (!stream.getTracks().some((t) => t.id === e.track.id))
        stream.addTrack(e.track);
      syncPeers();
    };
    pc.onconnectionstatechange = () => {
      syncPeers();
      if (pc.connectionState === "failed")
        toast.error(
          "تعذر الاتصال بأحد المشاركين. قد تحتاج الشبكة إلى خادم TURN.",
        );
    };
    syncPeers();
    return peer;
  }
  useEffect(() => {
    alive.current = true;
    async function signal({ from, memberId, description, candidate }) {
      if (!inRoom.current) return;
      try {
        const p = makePeer(from, memberId);
        if (description) {
          await p.pc.setRemoteDescription(description);
          for (const c of p.candidates) await p.pc.addIceCandidate(c);
          p.candidates = [];
          if (description.type === "offer") {
            await attachLocalTracks(p.pc, media.current, screen.current);
            await p.pc.setLocalDescription(await p.pc.createAnswer());
            await sendSignal(from, { description: p.pc.localDescription });
          }
        } else if (candidate) {
          if (p.pc.remoteDescription) await p.pc.addIceCandidate(candidate);
          else p.candidates.push(candidate);
        }
      } catch {
        if (alive.current)
          toast.error(
            "تعذر إعداد الاتصال المرئي، أعد الانضمام للمحاولة مجدداً",
          );
      }
    }
    const left = ({ socketId }) => {
      connections.current.get(socketId)?.pc.close();
      connections.current.delete(socketId);
      syncPeers();
    };
    const message = (m) =>
      setMessages((old) =>
        old.some((x) => x.id === m.id) ? old : [...old, m],
      );
    const disconnected = () => {
      cleanup();
      if (alive.current) {
        setJoined(false);
        setPeers([]);
        toast.error("انقطع الاتصال. أعد الانضمام بعد استعادته.");
      }
    };
    socket.on("signal:receive", signal);
    socket.on("peer:left", left);
    socket.on("message:new", message);
    socket.on("disconnect", disconnected);
    return () => {
      alive.current = false;
      socket.off("signal:receive", signal);
      socket.off("peer:left", left);
      socket.off("message:new", message);
      socket.off("disconnect", disconnected);
      if (inRoom.current) call("room:leave").catch(() => {});
      cleanup();
    };
  }, [roomId]);
  function cleanup() {
    inRoom.current = false;
    for (const p of connections.current.values()) p.pc.close();
    connections.current.clear();
    media.current?.getTracks().forEach((t) => t.stop());
    screen.current?.getTracks().forEach((t) => t.stop());
    media.current = null;
    screen.current = null;
  }
  async function join(withMedia = true) {
    if (starting.current || inRoom.current) return;
    starting.current = true;
    setBusy(true);
    try {
      let stream;
      if (withMedia) {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("الكاميرا تحتاج اتصال HTTPS ومتصفحاً يدعم WebRTC");
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: 640, height: 480 },
          });
        } catch {
          throw new Error(
            "تعذر تشغيل الكاميرا والميكروفون. تحقق من الأذونات أو انضم بدون أجهزة.",
          );
        }
      }
      if (!alive.current) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      media.current = stream || new MediaStream();
      setLocalStream(media.current);
      setMic(Boolean(stream));
      setCamera(Boolean(stream));
      setSharing(false);
      inRoom.current = true;
      const data = await call("room:join", { roomId });
      if (!alive.current) {
        await call("room:leave");
        cleanup();
        return;
      }
      setRoom(data.room);
      setMessages(data.messages);
      setJoined(true);
      for (const peer of data.peers) {
        const p = makePeer(peer.socketId, peer.memberId);
        await attachLocalTracks(p.pc, media.current, screen.current);
        await p.pc.setLocalDescription(await p.pc.createOffer());
        await sendSignal(peer.socketId, { description: p.pc.localDescription });
      }
    } catch (e) {
      if (inRoom.current) await call("room:leave").catch(() => {});
      cleanup();
      setJoined(false);
      toast.error(e.message);
    } finally {
      starting.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function toggle(kind) {
    if (kind === "video" && screen.current) {
      toast("أوقف مشاركة الشاشة أولاً");
      return;
    }
    try {
      let track = media.current
        ?.getTracks()
        .find((t) => t.kind === kind && t.readyState === "live");
      if (track) {
        track.enabled = !track.enabled;
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: kind === "audio",
          video: kind === "video",
        });
        track = stream.getTracks()[0];
        if (!inRoom.current) {
          track.stop();
          return;
        }
        media.current.addTrack(track);
        for (const p of connections.current.values()) {
          const sender = p.pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === kind)?.sender;
          await sender?.replaceTrack(track);
        }
        setLocalStream(new MediaStream(media.current.getTracks()));
      }
      if (kind === "audio") setMic(track.enabled);
      else setCamera(track.enabled);
    } catch {
      toast.error("تعذر تشغيل الجهاز، تحقق من أذونات المتصفح");
    }
  }
  async function stopShare() {
    screen.current?.getTracks().forEach((t) => t.stop());
    screen.current = null;
    const track = media.current?.getVideoTracks()[0] || null;
    for (const p of connections.current.values())
      await p.pc
        .getTransceivers()
        .find((t) => t.receiver.track.kind === "video")
        ?.sender.replaceTrack(track);
    setLocalStream(
      media.current ? new MediaStream(media.current.getTracks()) : null,
    );
    setSharing(false);
  }
  async function share() {
    if (screen.current) {
      await stopShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      if (!inRoom.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      screen.current = stream;
      const track = stream.getVideoTracks()[0];
      for (const p of connections.current.values())
        await p.pc
          .getTransceivers()
          .find((t) => t.receiver.track.kind === "video")
          ?.sender.replaceTrack(track);
      track.onended = () => stopShare();
      setLocalStream(stream);
      setSharing(true);
    } catch {
      toast.error("لم تبدأ مشاركة الشاشة");
    }
  }
  return {
    joined,
    busy,
    room,
    localStream,
    peers,
    messages,
    mic,
    camera,
    sharing,
    join,
    toggle,
    share,
  };
}
