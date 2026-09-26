import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiVideo,
  FiUsers,
  FiMessageSquare,
  FiArrowLeft,
  FiCalendar,
  FiShield,
  FiCheck,
  FiChevronLeft,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { Avatar, Modal, Empty } from "../components/UI";
import MeetingModal from "../components/MeetingModal";
import { RoomCard } from "./Dashboard";
import s from "./WorkspacePages.module.css";
export function Meetings() {
  const { conversations, presence } = useTeam();
  const [modal, setModal] = useState(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const list = conversations
    .filter((c) => c.name.includes(query) || c.project.includes(query))
    .filter((c) => filter !== "live" || presence.rooms[c.id]?.length);
  return (
    <>
      <PageTitle
        title="غرف اجتماعات الفريق"
        subtitle="لكل مشروع مساحة، ولكل فكرة فرصة لتكبر."
        action={
          <button className="primaryButton" onClick={() => setModal("instant")}>
            <FiPlus />
            اجتماع جديد
          </button>
        }
      />
      <div className={s.toolbar}>
        <Search
          value={query}
          onChange={setQuery}
          placeholder="ابحث عن غرفة أو مشروع…"
        />
        <div className={s.tabs}>
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
            نشطة الآن
          </button>
        </div>
        <button
          className="secondaryButton"
          onClick={() => setModal("schedule")}
        >
          <FiCalendar />
          جدولة اجتماع
        </button>
      </div>
      <div className={s.rooms}>
        {list.map((r, i) => (
          <RoomCard key={r.id} room={r} index={i} />
        ))}
      </div>
      {!list.length && (
        <Empty
          icon={FiVideo}
          title="لا توجد غرف مطابقة"
          text="جرّب البحث باسم آخر أو أنشئ اجتماعاً جديداً."
        />
      )}
      {modal && (
        <MeetingModal
          schedule={modal === "schedule"}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
export function Team({ privateMode = false }) {
  const { user, members, presence, call, invitations, setInvitations } =
    useTeam();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(null);
  const navigate = useNavigate();
  const list = members
    .filter((m) => !privateMode || m.id !== user.id)
    .filter((m) => `${m.name} ${m.team} ${m.title}`.includes(query))
    .filter((m) => filter !== "online" || presence.onlineIds.includes(m.id));
  async function start(m) {
    setBusy(m.id);
    try {
      const room = await call("private:create", { memberId: m.id });
      toast.success("تم إنشاء المحادثة وإرسال الدعوة للعضو المتصل");
      navigate(`/room/${room.id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageTitle
        title={privateMode ? "المحادثات الخاصة" : "أعضاء الفريق"}
        subtitle={
          privateMode
            ? "حديث أقرب. مساحة آمنة لك ولزميلك."
            : "أشخاص مختلفون، شغف واحد. تعرّف إلى فريقك."
        }
      />
      {privateMode &&
        invitations.map((i) => (
          <div className={s.invitation} key={i.roomId}>
            <Avatar member={i.from} />
            <p>{i.from.name} يدعوك إلى لقاء خاص</p>
            <button
              className="primaryButton"
              onClick={() => {
                setInvitations((old) =>
                  old.filter((x) => x.roomId !== i.roomId),
                );
                navigate(`/room/${i.roomId}`);
              }}
            >
              قبول الدعوة <FiArrowLeft />
            </button>
          </div>
        ))}
      <div className={s.toolbar}>
        <Search
          value={query}
          onChange={setQuery}
          placeholder="ابحث عن عضو في فريقك…"
        />
        <div className={s.tabs}>
          <button
            className={filter === "all" ? s.selected : ""}
            onClick={() => setFilter("all")}
          >
            جميع الأعضاء
          </button>
          <button
            className={filter === "online" ? s.selected : ""}
            onClick={() => setFilter("online")}
          >
            متصلون الآن
          </button>
        </div>
        <span className="muted">{list.length} أعضاء</span>
      </div>
      <div className={s.memberGrid}>
        {list.map((m) => (
          <article className={s.memberCard} key={m.id}>
            <span
              className={`${s.status} ${presence.onlineIds.includes(m.id) ? s.online : ""}`}
            >
              <i />
              {presence.onlineIds.includes(m.id) ? "متصل الآن" : "غير متصل"}
            </span>
            <Avatar member={m} size={70} />
            <h3>
              {m.name}
              {m.id === user.id && " (أنت)"}
            </h3>
            <p>{m.title}</p>
            <span className={s.teamTag}>{m.team}</span>
            {m.id !== user.id ? (
              <button
                className="secondaryButton"
                disabled={busy === m.id}
                onClick={() => start(m)}
              >
                <FiVideo />
                {busy === m.id ? "جارٍ الاتصال…" : "محادثة خاصة"}
                <FiArrowLeft />
              </button>
            ) : (
              <div className={s.selfLabel}>
                مساحتك تبدأ بك <FiCheck />
              </div>
            )}
          </article>
        ))}
      </div>
      {!list.length && (
        <Empty
          icon={FiUsers}
          title="لم نجد أعضاء مطابقين"
          text="جرّب البحث باسم أو فريق آخر."
        />
      )}
    </>
  );
}
export function PageTitle({ title, subtitle, action }) {
  return (
    <>
      <div className={s.breadcrumb}>
        <Link to="/">مساحة العمل</Link>
        <FiChevronLeft />
        {title}
      </div>
      <div className={s.title}>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
    </>
  );
}
function Search({ value, onChange, placeholder }) {
  return (
    <label className={s.search}>
      <FiSearch />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function MemberForm({ onClose }) {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      title: "",
      team: "",
      role: 100,
    });
  const { call } = useTeam();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await call("members:add", form);
      toast.success("تمت إضافة العضو بنجاح");
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="إضافة عضو إلى الفريق" onClose={onClose}>
      <div className={s.stepper}>
        {["البيانات الشخصية", "بيانات العمل", "مراجعة وتأكيد"].map((v, i) => (
          <button
            key={v}
            disabled={i > step || busy}
            onClick={() => setStep(i)}
            className={i <= step ? s.stepActive : ""}
          >
            <span>{i < step ? <FiCheck /> : i + 1}</span>
            {v}
          </button>
        ))}
      </div>
      <form className="formStack" onSubmit={submit}>
        <div className={s.formStep} key={step}>
          {step === 0 && (
            <>
              <label>
                الاسم الكامل
                <input
                  name="name"
                  required
                  maxLength={120}
                  autoFocus
                  value={form.name}
                  onChange={change}
                  placeholder="اسم العضو"
                />
              </label>
              <label>
                البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={120}
                  value={form.email}
                  onChange={change}
                  placeholder="name@company.com"
                  dir="ltr"
                />
              </label>
              <label>
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={change}
                  placeholder="8 أحرف على الأقل"
                />
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <label>
                المسمى الوظيفي
                <input
                  name="title"
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={change}
                  placeholder="مثال: مصمم تجربة المستخدم"
                  autoFocus
                />
              </label>
              <label>
                الفريق
                <input
                  name="team"
                  required
                  maxLength={120}
                  value={form.team}
                  onChange={change}
                  placeholder="مثال: فريق التصميم"
                />
              </label>
              <label>
                الصلاحية
                <select name="role" value={form.role} onChange={change}>
                  <option value={100}>عضو فريق</option>
                  <option value={200}>مدير مساحة العمل</option>
                </select>
              </label>
            </>
          )}
          {step === 2 && (
            <div className={s.review}>
              <Avatar member={form} size={60} />
              <h3>{form.name}</h3>
              <dl>
                <dt>البريد الإلكتروني</dt>
                <dd dir="ltr">{form.email}</dd>
                <dt>المسمى الوظيفي</dt>
                <dd>{form.title}</dd>
                <dt>الفريق</dt>
                <dd>{form.team}</dd>
                <dt>الصلاحية</dt>
                <dd>
                  {Number(form.role) === 200 ? "مدير مساحة العمل" : "عضو فريق"}
                </dd>
              </dl>
            </div>
          )}
        </div>
        <div className={s.formButtons}>
          {step > 0 && (
            <button
              type="button"
              className="secondaryButton"
              disabled={busy}
              onClick={() => setStep(step - 1)}
            >
              السابق
            </button>
          )}
          <button disabled={busy} className="primaryButton" type="submit">
            {busy
              ? "جارٍ الإضافة…"
              : step === 2
                ? "تأكيد وإضافة العضو"
                : "التالي"}
            {step === 2 ? <FiCheck /> : <FiArrowLeft />}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Admin() {
  const { members, presence, activity } = useTeam();
  const [adding, setAdding] = useState(false),
    [query, setQuery] = useState("");
  const online = members.filter((m) => presence.onlineIds.includes(m.id));
  return (
    <>
      <PageTitle
        title="لوحة إدارة الفريق"
        subtitle="كل ما تحتاجه لإدارة فريق متصل ومنتج."
        action={
          <button className="primaryButton" onClick={() => setAdding(true)}>
            <FiPlus />
            إضافة عضو
          </button>
        }
      />
      <div className={s.adminStats}>
        <div>
          <FiUsers />
          <strong>{members.length}</strong>
          <span>إجمالي الأعضاء</span>
        </div>
        <div>
          <FiVideo />
          <strong>{online.length}</strong>
          <span>متصلون الآن</span>
        </div>
        <div>
          <FiMessageSquare />
          <strong>{Object.keys(activity).length}</strong>
          <span>محادثات خاصة نشطة</span>
        </div>
      </div>
      <section className={s.tableCard}>
        <div className={s.tableTitle}>
          <h2>أعضاء مساحة العمل</h2>
          <Search
            value={query}
            onChange={setQuery}
            placeholder="البحث عن عضو…"
          />
        </div>
        <div className={s.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>العضو</th>
                <th>الفريق</th>
                <th>الصلاحية</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {members
                .filter((m) => `${m.name} ${m.email}`.includes(query))
                .map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className={s.tableMember}>
                        <Avatar member={m} />
                        <div>
                          {m.name}
                          <small dir="ltr">{m.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{m.team}</td>
                    <td>
                      <span className={s.teamTag}>
                        {m.role === 200 ? "مدير" : "عضو"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${s.status} ${presence.onlineIds.includes(m.id) ? s.online : ""}`}
                      >
                        <i />
                        {presence.onlineIds.includes(m.id)
                          ? "متصل الآن"
                          : "غير متصل"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={s.activityCard}>
        <h2>المحادثات الخاصة النشطة</h2>
        <p>حضور المشاركين فقط. تبقى الرسائل خاصة بين أصحابها.</p>
        {Object.values(activity).length ? (
          Object.entries(activity).map(([id, ids]) => (
            <div className={s.activityRow} key={id}>
              <FiVideo />
              {ids
                .map(
                  (memberId) =>
                    members.find((m) => m.id === memberId)?.name || "عضو",
                )
                .join(" ↔ ")}
              <span>
                {ids.length === 1 ? "بانتظار الطرف الآخر" : "مكالمة خاصة"}
              </span>
            </div>
          ))
        ) : (
          <Empty
            icon={FiMessageSquare}
            title="لا توجد محادثات خاصة نشطة"
            text="ستظهر أطراف المحادثات هنا عند الانضمام إلى الغرفة."
          />
        )}
      </section>
      {adding && <MemberForm onClose={() => setAdding(false)} />}
    </>
  );
}
export function Unauthorized() {
  return (
    <div className={s.unauthorized}>
      <span>
        <FiShield />
      </span>
      <p>403</p>
      <h1>عذراً، غير مصرح لك بالدخول</h1>
      <p>
        هذه الصفحة مخصصة لمدير مساحة العمل.
        <br />
        يمكنك العودة للتواصل مع فريقك.
      </p>
      <Link to="/" className="primaryButton">
        العودة إلى مساحة العمل <FiArrowLeft />
      </Link>
    </div>
  );
}
export function NotFound() {
  return (
    <div className={s.unauthorized}>
      <p>404</p>
      <h1>هذه الصفحة غير موجودة</h1>
      <Link to="/" className="primaryButton">
        العودة إلى مساحة العمل <FiArrowLeft />
      </Link>
    </div>
  );
}
