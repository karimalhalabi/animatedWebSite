import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiMessageSquare,
  FiPhoneOff,
  FiLink,
  FiSend,
  FiArrowRight,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { useMeeting } from "../hooks/useMeeting";
import { Avatar } from "../components/UI";
import { timeLabel } from "../utils/helpers";
import s from "./Room.module.css";
function VideoTile({
  stream,
  member,
  local = false,
  camera = true,
  mic = true,
  state,
}) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <div className={s.videoTile}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={local}
        className={local ? s.localVideo : ""}
      />
      {(!stream?.getVideoTracks().length || !camera) && (
        <div className={s.videoPlaceholder}>
          <Avatar member={member} size={90} />
        </div>
      )}
      <div className={s.videoLabel}>
        <span>
          {member?.name || "عضو الفريق"}
          {local ? " (أنت)" : ""}
        </span>
        {local && !mic ? <FiMicOff /> : <FiMic />}
      </div>
      {state === "connecting" && (
        <span className={s.connecting}>جارٍ الاتصال…</span>
      )}
    </div>
  );
}
export default function Room() {
  const { roomId } = useParams();
  const { user, members, conversations, call, connected } = useTeam();
  const meeting = useMeeting(roomId);
  const navigate = useNavigate();
  const [chat, setChat] = useState(true),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false);
  const end = useRef();
  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    [meeting.messages],
  );
  async function send(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await call("message:send", { text: message });
      setMessage("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط الاجتماع");
    } catch {
      toast.error("تعذر النسخ. انسخ الرابط من شريط العنوان.");
    }
  }
  if (!meeting.joined)
    return (
      <div className={s.prejoin}>
        <Link to="/meetings">
          <FiArrowRight /> العودة إلى الغرف
        </Link>
        <div className={s.prejoinCard}>
          <div className={s.prejoinArt}>
            <FiVideo />
            <span />
            <i />
          </div>
          <span className={s.prejoinTag}>مساحة للأفكار، ولقاء للإنجاز</span>
          <h1>
            {conversations.find((r) => r.id === roomId)?.name || "محادثة خاصة"}
          </h1>
          <p>
            أنت على وشك الانضمام إلى اللقاء.
            <br />
            سنطلب إذنك لتشغيل الكاميرا والميكروفون.
          </p>
          <div className={s.prejoinButtons}>
            <button
              className="primaryButton"
              disabled={meeting.busy || !connected}
              onClick={() => meeting.join(true)}
            >
              <FiVideo />
              {meeting.busy
                ? "جارٍ الانضمام…"
                : "الانضمام بالكاميرا والميكروفون"}
            </button>
            <button
              className="secondaryButton"
              disabled={meeting.busy || !connected}
              onClick={() => meeting.join(false)}
            >
              الانضمام بدون كاميرا وميكروفون
            </button>
          </div>
          <span className={s.prejoinSecurity}>
            <FiShield /> يمكنك التحكم بالأجهزة في أي وقت
          </span>
        </div>
      </div>
    );
  return (
    <div className={s.meeting}>
      <div className={s.meetingHeader}>
        <div>
          <span className={s.live}>
            <i /> اجتماع جارٍ
          </span>
          <h1>{meeting.room?.name}</h1>
          <p>
            <FiUsers /> {meeting.peers.length + 1} مشاركين <span>•</span>{" "}
            {meeting.room?.type === "private" ? "محادثة خاصة" : "غرفة الفريق"}
          </p>
        </div>
        <button className="secondaryButton" onClick={copy}>
          <FiLink />
          نسخ رابط الدعوة
        </button>
      </div>
      <div className={s.meetingBody}>
        <div
          className={`${s.videos} ${meeting.peers.length ? s.multiple : ""}`}
        >
          <VideoTile
            local
            stream={meeting.localStream}
            member={user}
            camera={meeting.camera || meeting.sharing}
            mic={meeting.mic}
          />
          {meeting.peers.map((p) => (
            <VideoTile
              key={p.socketId}
              stream={p.stream}
              member={members.find((m) => m.id === p.memberId)}
              state={p.state}
            />
          ))}
          {!meeting.peers.length && (
            <div className={s.waiting}>
              <FiUsers />
              <h3>اللقاء أجمل بوجود فريقك</h3>
              <p>شارك رابط الغرفة وانتظر انضمام زملائك.</p>
              <button onClick={copy}>
                <FiLink /> نسخ الرابط
              </button>
            </div>
          )}
        </div>
        {chat && (
          <aside className={s.chat}>
            <h2>
              <FiMessageSquare />
              محادثة الاجتماع
            </h2>
            <div className={s.messages}>
              {!meeting.messages.length && (
                <div className={s.chatEmpty}>
                  <FiMessageSquare />
                  <p>قل مرحباً لفريقك 👋</p>
                  <span>تظهر رسائل هذا الاجتماع هنا.</span>
                </div>
              )}
              {meeting.messages.map((m) => (
                <div
                  key={m.id}
                  className={`${s.message} ${m.memberId === user.id ? s.myMessage : ""}`}
                >
                  <span>
                    {members.find((u) => u.id === m.memberId)?.name || "عضو"}
                    <small>{timeLabel(m.createdAt)}</small>
                  </span>
                  <p>{m.text}</p>
                </div>
              ))}
              <div ref={end} />
            </div>
            <form onSubmit={send}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="شارك فكرة أو اكتب رسالة…"
                aria-label="رسالة الاجتماع"
              />
              <button
                disabled={!message.trim() || sending}
                aria-label="إرسال الرسالة"
              >
                <FiSend />
              </button>
            </form>
          </aside>
        )}
      </div>
      <div className={s.controls}>
        <div className={s.controlGroup}>
          <button
            className={!meeting.mic ? s.off : ""}
            onClick={() => meeting.toggle("audio")}
            aria-label={meeting.mic ? "كتم الميكروفون" : "تشغيل الميكروفون"}
          >
            {meeting.mic ? <FiMic /> : <FiMicOff />}
            <span>الميكروفون</span>
          </button>
          <button
            className={!meeting.camera ? s.off : ""}
            onClick={() => meeting.toggle("video")}
            aria-label={meeting.camera ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
          >
            {meeting.camera ? <FiVideo /> : <FiVideoOff />}
            <span>الكاميرا</span>
          </button>
          <button
            className={meeting.sharing ? s.activeControl : ""}
            onClick={meeting.share}
            aria-label={
              meeting.sharing ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"
            }
          >
            <FiMonitor />
            <span>{meeting.sharing ? "إيقاف المشاركة" : "مشاركة الشاشة"}</span>
          </button>
          <button
            className={chat ? s.activeControl : ""}
            onClick={() => setChat(!chat)}
            aria-label="إظهار أو إخفاء المحادثة"
          >
            <FiMessageSquare />
            <span>المحادثة</span>
          </button>
        </div>
        <button className={s.leave} onClick={() => navigate("/meetings")}>
          <FiPhoneOff />
          مغادرة اللقاء
        </button>
      </div>
    </div>
  );
}
