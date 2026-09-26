import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiVideo,
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiBell,
  FiChevronDown,
  FiArrowUpLeft,
  FiHelpCircle,
  FiLogOut,
  FiShield,
  FiX,
  FiMenu,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { Avatar, Brand, Modal } from "./UI";
import s from "./Layout.module.css";
export default function Layout() {
  const {
    user,
    members,
    presence,
    logout,
    demo,
    connected,
    invitations,
    setInvitations,
  } = useTeam();
  const [panel, setPanel] = useState(null),
    [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const nav = [
    ["/", "نظرة عامة", FiGrid],
    ["/meetings", "غرف الاجتماعات", FiVideo],
    ["/private", "المحادثات الخاصة", FiMessageSquare],
    ["/team", "أعضاء الفريق", FiUsers],
  ];
  async function signOut() {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      toast.error(e.message);
    }
  }
  return (
    <div className={s.app}>
      <header className={s.header}>
        <Link to="/" aria-label="لقاء الرئيسية">
          <Brand />
        </Link>
        <div className={s.headerDivider} />
        <p className={s.tagline}>
          مساحة تجمع فريقك<span>أفكار أقرب. إنجاز أكبر.</span>
        </p>
        <nav className={s.topNav}>
          <NavLink to="/" end>
            مساحة العمل
          </NavLink>
          <NavLink to="/meetings">اجتماعاتي</NavLink>
        </nav>
        <div className={s.headerActions}>
          <button
            className={s.notification}
            aria-label="الإشعارات"
            onClick={() => setPanel("notifications")}
          >
            <FiBell />
            {invitations.length > 0 && <i />}
          </button>
          <span className={s.actionDivider} />
          <button className={s.userButton} onClick={() => setPanel("profile")}>
            <Avatar member={user} size={41} />
            <span>
              {user.name}
              <small>
                {user.role === 200 ? "مدير مساحة العمل" : "عضو الفريق"}
              </small>
            </span>
            <FiChevronDown />
          </button>
          <button
            className={s.mobileMenu}
            aria-label="القائمة"
            onClick={() => setMenu(!menu)}
          >
            <FiMenu />
          </button>
        </div>
      </header>
      <div className={s.workspace}>
        <aside className={`${s.sidebar} ${menu ? s.open : ""}`}>
          <div className={s.workspacePicker}>
            <div className={s.workspaceIcon}>م</div>
            <span>
              مساحة فريق الإبداع
              <small>{demo ? "مساحة تجريبية" : "مساحة العمل المشتركة"}</small>
            </span>
            <FiChevronDown />
          </div>
          <div className={s.navLabel}>مساحة العمل</div>
          <nav className={s.sideNav}>
            {nav.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setMenu(false)}
                className={({ isActive }) => (isActive ? s.active : "")}
              >
                <Icon />
                <span>{label}</span>
                {to === "/private" && invitations.length > 0 && (
                  <b>{invitations.length}</b>
                )}
              </NavLink>
            ))}
          </nav>
          <div className={s.navLabel}>إدارة المساحة</div>
          <nav className={s.sideNav}>
            <NavLink
              to="/admin"
              onClick={() => setMenu(false)}
              className={({ isActive }) => (isActive ? s.active : "")}
            >
              <FiShield />
              <span>لوحة الإدارة</span>
            </NavLink>
            <button onClick={() => setPanel("settings")}>
              <FiSettings />
              <span>الإعدادات</span>
            </button>
          </nav>
          <div className={s.sidebarBottom}>
            <div className={s.onlineBox}>
              <span className={s.liveDot} />
              <span>{presence.onlineIds.length} أعضاء متصلون الآن</span>
              <div className={s.miniAvatars}>
                {members
                  .filter((m) => presence.onlineIds.includes(m.id))
                  .slice(0, 3)
                  .map((m) => (
                    <Avatar key={m.id} member={m} size={25} />
                  ))}
              </div>
            </div>
            <div className={s.helpBox}>
              <span className={s.helpIcon}>
                <FiHelpCircle />
              </span>
              <h4>لقاء أفضل، كل يوم</h4>
              <p>
                كل ما تحتاجه لتبقى قريباً
                <br />
                من فريقك، أينما كنت.
              </p>
              <button onClick={() => setPanel("help")}>
                اكتشف كيف <FiArrowUpLeft />
              </button>
              <span className={s.helpDecoration} />
            </div>
            <button className={s.logout} onClick={signOut}>
              <FiLogOut />
              تسجيل الخروج
            </button>
          </div>
        </aside>
        <main className={s.main}>
          {!connected && (
            <div className={s.connectionBanner}>
              جارٍ إعادة الاتصال بالخادم…
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <footer className={s.footer}>
        <div>
          <Brand />
          <span>تواصل يجمعنا، وإنجاز يلهمنا.</span>
        </div>
        <p>© {new Date().getFullYear()} لقاء. جميع الحقوق محفوظة.</p>
        <button onClick={() => setPanel("privacy")}>
          الخصوصية والأمان <FiShield />
        </button>
      </footer>
      {panel && (
        <Modal
          title={
            {
              profile: "ملفك الشخصي",
              notifications: "الإشعارات",
              settings: "إعدادات مساحة العمل",
              help: "أهلاً بك في لقاء",
              privacy: "الخصوصية والأمان",
            }[panel]
          }
          onClose={() => setPanel(null)}
        >
          {panel === "profile" && (
            <div className={s.profile}>
              <Avatar member={user} size={72} />
              <h3>{user.name}</h3>
              <p>
                {user.title} · {user.team}
              </p>
              <p dir="ltr">{user.email}</p>
              <button className="secondaryButton" onClick={signOut}>
                <FiLogOut />
                تسجيل الخروج
              </button>
            </div>
          )}
          {panel === "notifications" && (
            <div>
              {invitations.length ? (
                invitations.map((i) => (
                  <div className={s.invite} key={i.roomId}>
                    <Avatar member={i.from} />
                    <p>
                      {i.from.name}
                      <small>يدعوك إلى محادثة خاصة</small>
                    </p>
                    <button
                      className="primaryButton"
                      onClick={() => {
                        setPanel(null);
                        setInvitations((old) =>
                          old.filter((x) => x.roomId !== i.roomId),
                        );
                        navigate(`/room/${i.roomId}`);
                      }}
                    >
                      انضمام <FiArrowLeft />
                    </button>
                    <button
                      className={s.notification}
                      aria-label="رفض الدعوة"
                      onClick={() =>
                        setInvitations((old) =>
                          old.filter((x) => x.roomId !== i.roomId),
                        )
                      }
                    >
                      <FiX />
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">
                  لا توجد إشعارات جديدة. ستظهر دعوات المحادثات هنا.
                </p>
              )}
            </div>
          )}
          {panel === "settings" && (
            <div className={s.settings}>
              <p>
                <FiCheck /> اللغة: العربية
              </p>
              <p>
                <FiCheck /> المظهر: فاتح
              </p>
              <p>
                <FiCheck /> إشعارات دعوات الاجتماعات مفعلة
              </p>
              <p className="muted">
                يمكنك التحكم بالكاميرا والميكروفون داخل كل اجتماع. إعدادات
                أذونات الأجهزة متاحة من متصفحك.
              </p>
            </div>
          )}
          {panel === "help" && (
            <div className={s.helpContent}>
              <h3>فريقك على بُعد لقاء</h3>
              <p>
                ابدأ اجتماعاً جديداً أو انضم إلى غرفة مشروعك. يمكنك دعوة زملائك
                بمشاركة رابط الاجتماع.
              </p>
              <p>
                لحديث أكثر خصوصية، اختر أحد أعضاء الفريق من صفحة المحادثات
                الخاصة وأرسل دعوة فيديو.
              </p>
              <p>يضيف مدير المساحة الأعضاء ويمنحهم بيانات تسجيل الدخول.</p>
            </div>
          )}
          {panel === "privacy" && (
            <div className={s.helpContent}>
              <p>
                ينتقل الفيديو والصوت مباشرةً بين المشاركين عبر WebRTC المشفر. لا
                يسجّل التطبيق الاجتماعات.
              </p>
              <p>
                تُحفظ الرسائل والأعضاء في قاعدة بيانات مساحة العمل. يستطيع
                المدير رؤية الحضور وأطراف المكالمات الخاصة؛ لا تُعرض له رسائل
                المحادثات الخاصة.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
