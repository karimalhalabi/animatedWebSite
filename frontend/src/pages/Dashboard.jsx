import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiArrowLeft,
  FiVideo,
  FiUsers,
  FiClock,
  FiCalendar,
  FiChevronLeft,
  FiMoreHorizontal,
  FiArrowUpLeft,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiMaximize2,
  FiLink,
  FiCheck,
  FiMessageCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { Avatar, Empty } from "../components/UI";
import MeetingModal from "../components/MeetingModal";
import { dateLabel, timeLabel } from "../utils/helpers";
import s from "./Dashboard.module.css";
function HeroArt({ members }) {
  return (
    <div className={s.heroArt} aria-hidden="true">
      <div className={s.orbit} />
      <div className={s.orbitTwo} />
      <span className={s.spark}>✦</span>
      <div className={s.callPreview}>
        <div className={s.previewBar}>
          <span>
            <i /> لقاء الفريق
          </span>
          <span>•••</span>
        </div>
        <div className={s.previewGrid}>
          {[1, 2, 3, 0].map((n, i) => (
            <div key={i} className={`${s.previewPerson} ${s[`person${i}`]}`}>
              <img
                src={members[n]?.avatar || `/avatars/member-${n + 1}.jpg`}
                alt=""
              />
              <span>
                {["سارة", "عمر", "نورة", "أنت"][i]}
                <FiMic />
              </span>
            </div>
          ))}
        </div>
        <div className={s.previewControls}>
          <span>
            <FiMic />
          </span>
          <span>
            <FiVideo />
          </span>
          <span className={s.hangup}>
            <FiPhoneOff />
          </span>
          <span>
            <FiMoreHorizontal />
          </span>
        </div>
      </div>
      <div className={s.heroBadge}>
        <span>
          <FiCheck />
        </span>
        <div>
          أقرب، مهما كانت المسافة<small>فريق واحد. إمكانيات لا حدود لها.</small>
        </div>
      </div>
      <span className={s.heroDots}>
        •••
        <br />
        •••
        <br />
        •••
      </span>
      <span className={s.yellowSquare} />
    </div>
  );
}
export function RoomCard({ room, index = 0 }) {
  const { members, presence } = useTeam();
  const live = presence.rooms[room.id]?.length || 0;
  const team = members.filter((m) => room.memberIds?.includes(m.id));
  return (
    <article className={s.roomCard}>
      <div className={`${s.roomArt} ${s[room.color || "blue"]}`}>
        <div className={s.artGrid} />
        <div className={s.artShape} />
        <div className={s.artShapeSmall} />
        <span className={s.projectTag}>{room.project}</span>
        <span className={s.artNumber}>0{index + 1}</span>
        <span className={`${s.roomStatus} ${live ? s.isLive : ""}`}>
          <i />
          {live ? "اجتماع جارٍ" : "غرفة الفريق"}
        </span>
      </div>
      <div className={s.roomBody}>
        <h3>{room.name}</h3>
        <p>{room.description || "مساحة تجمع الأفكار وتقرّب الفريق"}</p>
        <div className={s.roomMeta}>
          <div className={s.avatarStack}>
            {team.slice(0, 3).map((m) => (
              <Avatar key={m.id} member={m} size={26} />
            ))}
            {team.length > 3 && <span>+{team.length - 3}</span>}
          </div>
          <span>
            {live ? `${live} متصل الآن` : `${team.length} أعضاء الفريق`}
          </span>
        </div>
        <Link className={s.joinButton} to={`/room/${room.id}`}>
          <FiVideo />
          الانضمام إلى الغرفة
          <FiArrowLeft />
        </Link>
      </div>
    </article>
  );
}
export default function Dashboard() {
  const { user, members, conversations, presence, call } = useTeam();
  const [modal, setModal] = useState(null),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(null);
  const navigate = useNavigate();
  const group = conversations.filter((r) => r.type === "group");
  const rooms =
    filter === "live"
      ? group.filter((r) => presence.rooms[r.id]?.length)
      : group;
  const online = members.filter((m) => presence.onlineIds.includes(m.id));
  const upcoming = group
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  async function privateCall(id) {
    setBusy(id);
    try {
      const r = await call("private:create", { memberId: id });
      navigate(`/room/${r.id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className={s.dashboard}>
      <div className={s.pageHeading}>
        <div className={s.breadcrumb}>
          مساحة العمل <FiChevronLeft /> <span>نظرة عامة</span>
        </div>
        <span className={s.today}>
          <FiCalendar />
          {dateLabel(new Date())}
        </span>
      </div>
      <div className={s.welcome}>
        <div>
          <h1>
            أهلاً {user.name.split(" ")[0]} <span className={s.wave}>✺</span>
          </h1>
          <p>يوم جديد، أفكار جديدة. لنصنع شيئاً رائعاً مع فريقك.</p>
        </div>
        <button className="primaryButton" onClick={() => setModal("instant")}>
          <FiPlus />
          اجتماع جديد
        </button>
      </div>
      <section className={s.hero}>
        <div className={s.heroText}>
          <span className={s.eyebrow}>
            <span /> معاً، ننجز أكثر
          </span>
          <h2>
            كل الأفكار تبدأ بلقاء.
            <br />
            <span>وقصتنا تبدأ هنا.</span>
          </h2>
          <p>
            مساحتك للتواصل، مشاركة الأفكار، وصناعة الإنجاز.
            <br />
            اجمع فريقك في لقاء واحد، أينما كنتم.
          </p>
          <button onClick={() => setModal("instant")}>
            ابدأ لقاءك الآن <FiArrowLeft />
          </button>
          <span className={s.heroNote}>
            <FiVideo /> تواصل حقيقي، بدون مسافات
          </span>
        </div>
        <HeroArt members={members.filter((m) => m.avatar)} />
      </section>
      <div className={s.stats}>
        <div>
          <span className={`${s.statIcon} ${s.statBlue}`}>
            <FiVideo />
          </span>
          <div>
            <span>غرف الاجتماعات</span>
            <strong>{group.length.toString().padStart(2, "0")}</strong>
          </div>
          <span className={s.statHint}>مساحات للإبداع</span>
        </div>
        <div>
          <span className={`${s.statIcon} ${s.statGreen}`}>
            <FiUsers />
          </span>
          <div>
            <span>أعضاء متصلون</span>
            <strong>{online.length.toString().padStart(2, "0")}</strong>
          </div>
          <span className={s.statLive}>
            <i /> الآن
          </span>
        </div>
        <div>
          <span className={`${s.statIcon} ${s.statGold}`}>
            <FiCalendar />
          </span>
          <div>
            <span>اجتماعات قادمة</span>
            <strong>{upcoming.length.toString().padStart(2, "0")}</strong>
          </div>
          <span className={s.statHint}>كن على الموعد</span>
        </div>
      </div>
      <div className={s.contentGrid}>
        <div className={s.mainColumn}>
          <section>
            <div className={s.sectionTitle}>
              <h2>
                غرف اجتماعات الفريق <span>{group.length}</span>
              </h2>
              <Link to="/meetings">
                عرض الكل <FiArrowLeft />
              </Link>
            </div>
            <div className={s.roomFilters}>
              <button
                className={filter === "all" ? s.selected : ""}
                onClick={() => setFilter("all")}
              >
                جميع الغرف
              </button>
              <button
                className={filter === "live" ? s.selected : ""}
                onClick={() => setFilter("live")}
              >
                <i />
                نشطة الآن
              </button>
              <span>مساحة لكل مشروع، ولقاء لكل فكرة</span>
            </div>
            <div className={s.roomGrid}>
              {rooms.slice(0, 3).map((r, i) => (
                <RoomCard key={r.id} room={r} index={i} />
              ))}
            </div>
            {!rooms.length && (
              <Empty
                icon={FiVideo}
                title="لا توجد اجتماعات نشطة الآن"
                text="ابدأ لقاءً جديداً وادعُ فريقك للمشاركة."
              />
            )}
          </section>
          <section className={s.upcoming}>
            <div className={s.sectionTitle}>
              <h2>لقاؤك القادم</h2>
              <button onClick={() => setModal("schedule")}>
                جدولة اجتماع <FiPlus />
              </button>
            </div>
            {upcoming.length ? (
              <div className={s.upcomingCard}>
                <div className={s.calendarBlock}>
                  <span>
                    {new Intl.DateTimeFormat("ar", { month: "short" }).format(
                      new Date(upcoming[0].scheduledAt),
                    )}
                  </span>
                  <strong>{new Date(upcoming[0].scheduledAt).getDate()}</strong>
                </div>
                <div className={s.upcomingInfo}>
                  <h3>{upcoming[0].name}</h3>
                  <p>
                    <FiClock />
                    {timeLabel(upcoming[0].scheduledAt)}
                    <span>•</span>
                    {upcoming[0].project}
                  </p>
                </div>
                <Link
                  to={`/room/${upcoming[0].id}`}
                  className={s.upcomingAction}
                >
                  تفاصيل الاجتماع <FiArrowUpLeft />
                </Link>
              </div>
            ) : (
              <div className={s.upcomingCard}>
                <FiCalendar />
                <div className={s.upcomingInfo}>
                  <h3>مساحة لأفكارك القادمة</h3>
                  <p>حدد موعد اللقاء التالي واجمع فريقك.</p>
                </div>
                <button
                  className="secondaryButton"
                  onClick={() => setModal("schedule")}
                >
                  جدولة اجتماع
                </button>
              </div>
            )}
          </section>
        </div>
        <aside className={s.teamPanel}>
          <div className={s.sectionTitle}>
            <h2>
              فريقك، بالقرب منك <span className={s.greenDot} />
            </h2>
            <Link to="/team" aria-label="عرض أعضاء الفريق">
              <FiMoreHorizontal />
            </Link>
          </div>
          <p className={s.teamCaption}>
            <span>{online.length} متصل</span> من أصل {members.length} أعضاء في
            الفريق
          </p>
          <div className={s.teamList}>
            {members
              .filter((m) => m.id !== user.id)
              .slice(0, 5)
              .map((m) => (
                <div className={s.teamMember} key={m.id}>
                  <Avatar
                    member={m}
                    size={37}
                    online={presence.onlineIds.includes(m.id)}
                  />
                  <div>
                    <h4>{m.name}</h4>
                    <span>{m.title}</span>
                  </div>
                  <button
                    disabled={busy === m.id}
                    onClick={() => privateCall(m.id)}
                    aria-label={`محادثة خاصة مع ${m.name}`}
                  >
                    <FiVideo />
                  </button>
                </div>
              ))}
          </div>
          <Link to="/team" className={s.allMembers}>
            عرض جميع الأعضاء <FiArrowLeft />
          </Link>
          <div className={s.privateBanner}>
            <span>
              <FiMessageCircle />
            </span>
            <div>
              <h4>بعض الأفكار تحتاج حديثاً خاصاً</h4>
              <p>ابدأ محادثة آمنة، بينك وبين زميلك.</p>
            </div>
            <Link to="/private" aria-label="بدء محادثة خاصة">
              <FiArrowUpLeft />
            </Link>
          </div>
        </aside>
      </div>
      <div className={s.bottomNote}>
        <span>
          <FiLink />
        </span>
        فريق متصل، وأفكار بلا حدود.
        <span className={s.noteLine} />
        <span className={s.secure}>
          <FiCheck /> صُمّم ليجمعنا
        </span>
      </div>
      {modal && (
        <MeetingModal
          schedule={modal === "schedule"}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
