import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiVideo,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTeam } from "../context/teamStore";
import { Brand } from "../components/UI";
import s from "./Login.module.css";
export default function Login() {
  const { user, login, connected, demo, loginDemo } = useTeam();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate(),
    location = useLocation();
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.page}>
      <div className={s.formSide}>
        <header className={s.loginHeader}>
          <Brand />
        </header>
        <div className={s.formWrapper}>
          <span className={s.eyebrow}>كل لقاء، بداية جديدة</span>
          <h1>أهلاً بعودتك إلى فريقك.</h1>
          <p>سجّل دخولك، ودع الأفكار تبدأ.</p>
          <form onSubmit={submit} className="formStack">
            <label>
              البريد الإلكتروني أو اسم المستخدم
              <div className={s.field}>
                <FiMail />
                <input
                  dir="ltr"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  maxLength={120}
                />
              </div>
            </label>
            <label>
              كلمة المرور
              <div className={s.field}>
                <FiLock />
                <input
                  dir="ltr"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
            <button className="primaryButton" disabled={busy || !connected}>
              {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
              <FiArrowLeft />
            </button>
          </form>
          {!connected && (
            <p className={s.error}>
              تعذر الاتصال بالخادم. جارٍ إعادة المحاولة…
            </p>
          )}
          {demo && (
            <button
              className={s.demoButton}
              onClick={async () => {
                try {
                  await loginDemo();
                  navigate("/");
                } catch (e) {
                  toast.error(e.message);
                }
              }}
            >
              استكشاف مساحة العمل التجريبية <FiArrowLeft />
            </button>
          )}
          <p className={s.note}>
            ليس لديك حساب؟ تواصل مع مدير مساحة العمل لإضافتك.
          </p>
        </div>
        <footer className={s.copyright}>
          © {new Date().getFullYear()} لقاء. تواصل يجمعنا.
        </footer>
      </div>
      <div className={s.artSide}>
        <div className={s.ring} />
        <div className={s.ringSmall} />
        <span className={s.star}>✦</span>
        <div className={s.artCard}>
          <FiVideo />
          <div className={s.faces}>
            {[1, 2, 3, 4].map((i) => (
              <img src={`/avatars/member-${i}.jpg`} alt="" key={i} />
            ))}
          </div>
          <span>
            <i /> مسافة أقل. أفكار أكثر.
          </span>
        </div>
        <div className={s.artCopy}>
          <h2>
            أقرب لفريقك.
            <br />
            أقرب لإنجازك.
          </h2>
          <p>
            اجتماعات ملهمة، محادثات مثمرة،
            <br />
            وفريق يشعر دائماً أنه في مكان واحد.
          </p>
        </div>
      </div>
    </div>
  );
}
