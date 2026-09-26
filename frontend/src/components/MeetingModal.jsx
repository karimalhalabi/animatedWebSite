import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiVideo, FiCalendar, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { Modal } from "./UI";
export default function MeetingModal({ onClose, schedule = false }) {
  const [form, setForm] = useState({ name: "", project: "", scheduledAt: "" }),
    [busy, setBusy] = useState(false);
  const { call } = useTeam();
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const room = await call("rooms:create", {
        ...form,
        scheduledAt: form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : null,
      });
      toast.success(schedule ? "تمت جدولة الاجتماع" : "غرفتك جاهزة");
      onClose();
      if (!schedule) navigate(`/room/${room.id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={schedule ? "جدولة اجتماع جديد" : "ابدأ لقاءً جديداً"}
      onClose={onClose}
    >
      <p className="formIntro">
        الأفكار الرائعة تبدأ بمحادثة. اجمع فريقك في مكان واحد.
      </p>
      <form onSubmit={submit} className="formStack">
        <label>
          عنوان الاجتماع
          <input
            required
            maxLength={120}
            placeholder="مثال: جلسة الأفكار الأسبوعية"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          المشروع
          <input
            required
            maxLength={120}
            placeholder="اسم المشروع أو الفريق"
            value={form.project}
            onChange={(e) => setForm({ ...form, project: e.target.value })}
          />
        </label>
        {schedule && (
          <label>
            تاريخ ووقت الاجتماع
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(e) =>
                setForm({ ...form, scheduledAt: e.target.value })
              }
            />
          </label>
        )}
        <button disabled={busy} className="primaryButton" type="submit">
          {schedule ? <FiCalendar /> : <FiVideo />}
          {busy
            ? "جارٍ الإنشاء…"
            : schedule
              ? "تأكيد الموعد"
              : "إنشاء الاجتماع"}
          <FiArrowLeft />
        </button>
      </form>
    </Modal>
  );
}
