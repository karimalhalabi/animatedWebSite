import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BookOpen, CalendarDays, Camera, Check, CheckCircle2, ChevronLeft,
  CircleAlert, Download, FileSpreadsheet, QrCode, ScanLine, Sparkles, Users,
} from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import ExcelDropZone from './components/ExcelDropZone';
import {
  downloadTemplate, exportAttendanceFile, formatArabicDate, formatArabicTime,
  getPeriodStatus, markStudentAttendance, periods, readAttendanceFile,
} from './utils/attendanceUtils';
import styles from './App.module.css';

const initialSession = { courseName: '', teacherName: '', periodNumber: 1 };
const QrScanner = lazy(() => import('./components/QrScanner'));

export default function App() {
  const [page, setPage] = useState('home');
  const [session, setSession] = useState(initialSession);
  const [students, setStudents] = useState([]);
  const studentsRef = useRef([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [toast, setToast] = useState(null);
  const [manualNumber, setManualNumber] = useState('');
  const [exporting, setExporting] = useState(false);

  const periodStatus = useMemo(
    () => students.length ? getPeriodStatus(students, session.periodNumber) : null,
    [students, session.periodNumber],
  );

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const openSetup = () => setPage('setup');

  const resetSession = () => {
    setSession(initialSession);
    setStudents([]);
    studentsRef.current = [];
    setFileName('');
    setFileError('');
    setAttendees([]);
    setManualNumber('');
    setPage('setup');
  };

  const handleFile = async (file) => {
    setFileLoading(true);
    setFileError('');
    try {
      const result = await readAttendanceFile(file);
      setStudents(result.students);
      studentsRef.current = result.students;
      setFileName(result.fileName);
    } catch (error) {
      setStudents([]);
      studentsRef.current = [];
      setFileName('');
      setFileError(error.message || 'تعذّرت قراءة الملف.');
    } finally {
      setFileLoading(false);
    }
  };

  const clearFile = () => {
    setStudents([]);
    studentsRef.current = [];
    setFileName('');
    setFileError('');
  };

  const startSession = (event) => {
    event.preventDefault();
    if (!session.courseName.trim() || !session.teacherName.trim() || !students.length || periodStatus?.type !== 'empty') return;
    setAttendees([]);
    setPage('attendance');
  };

  const handleScan = useCallback((scannedValue) => {
    const result = markStudentAttendance(studentsRef.current, scannedValue, session.periodNumber);
    if (result.status === 'notFound') {
      showToast('هذا الرقم غير موجود في قائمة الطلبة.', 'error');
      return;
    }
    if (result.status === 'duplicate') {
      showToast(`تم تسجيل حضور ${result.student.name} مسبقاً.`, 'info');
      return;
    }
    studentsRef.current = result.students;
    setStudents(result.students);
    setAttendees((current) => [{ ...result.student, attendedAt: new Date() }, ...current]);
    showToast(`تم تسجيل حضور ${result.student.name}`);
  }, [session.periodNumber, showToast]);

  const submitManualNumber = (event) => {
    event.preventDefault();
    if (!manualNumber.trim()) return;
    handleScan(manualNumber);
    setManualNumber('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAttendanceFile({ students, ...session });
      showToast('تم تجهيز ملف الحضور للتحميل.');
    } catch {
      showToast('تعذّر تصدير الملف. حاول مرة أخرى.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.appShell}>
      <Header page={page} onHome={() => setPage('home')} onNewSession={resetSession} />
      <main className={styles.main}>
        {page === 'home' && <HomePage onStart={openSetup} />}
        {page === 'setup' && (
          <SetupPage
            session={session}
            setSession={setSession}
            students={students}
            fileName={fileName}
            fileError={fileError}
            fileLoading={fileLoading}
            periodStatus={periodStatus}
            onFile={handleFile}
            onClearFile={clearFile}
            onStart={startSession}
          />
        )}
        {page === 'attendance' && (
          <AttendancePage
            session={session}
            students={students}
            attendees={attendees}
            manualNumber={manualNumber}
            setManualNumber={setManualNumber}
            onManualSubmit={submitManualNumber}
            onScan={handleScan}
            onExport={handleExport}
            exporting={exporting}
          />
        )}
      </main>
      <Footer />
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`} role="status">
          {toast.type === 'error' ? <CircleAlert size={20} /> : <CheckCircle2 size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function HomePage({ onStart }) {
  return (
    <section className={styles.homePage}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}><Sparkles size={16} /> حضور أسرع، درس أهدأ</span>
        <h1>الحضور، ببساطة<br /><em>مسحة واحدة.</em></h1>
        <p>حوّل قائمة طلبتك إلى جلسة حضور ذكية. ارفع ملف Excel، امسح رموز QR، وصدّر تقريراً مرتباً خلال دقائق.</p>
        <button className={styles.primaryButton} onClick={onStart}>
          ابدأ جلسة حضور <ArrowLeft size={19} />
        </button>
        <div className={styles.trustLine}>
          <span><Check size={15} /> بدون تسجيل دخول</span>
          <span><Check size={15} /> بياناتك تبقى على جهازك</span>
        </div>
      </div>
      <div className={styles.heroVisual} aria-label="معاينة نظام تسجيل الحضور">
        <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
        <div className={styles.previewCard}>
          <div className={styles.previewTop}><span><i /> جلسة نشطة</span><QrCode size={22} /></div>
          <div className={styles.previewCourse}><small>مقرر اليوم</small><strong>أساسيات البرمجة</strong><span>الفترة الرابعة</span></div>
          <div className={styles.previewScan}><ScanLine size={27} /><span>وجّه الرمز نحو الكاميرا</span></div>
          <div className={styles.previewStudent}>
            <span>س</span><div><strong>سارة أحمد</strong><small>20260124</small></div><i><Check size={18} /></i>
          </div>
          <div className={styles.previewStudent}>
            <span>م</span><div><strong>محمد علي</strong><small>20260087</small></div><i><Check size={18} /></i>
          </div>
        </div>
        <div className={styles.floatingBadge}><Users size={20} /><strong>٢٤</strong><small>حاضر اليوم</small></div>
      </div>
      <div className={styles.featureStrip}>
        <article><FileSpreadsheet size={21} /><span><strong>ارفع القائمة</strong><small>ملف Excel جاهز</small></span></article>
        <ChevronLeft size={18} />
        <article><Camera size={21} /><span><strong>امسح الرمز</strong><small>بكاميرا جهازك</small></span></article>
        <ChevronLeft size={18} />
        <article><Download size={21} /><span><strong>صدّر النتيجة</strong><small>تقرير أنيق ومنظم</small></span></article>
      </div>
    </section>
  );
}

function SetupPage({ session, setSession, students, fileName, fileError, fileLoading, periodStatus, onFile, onClearFile, onStart }) {
  const canStart = session.courseName.trim() && session.teacherName.trim() && students.length && periodStatus?.type === 'empty';
  return (
    <section className={styles.setupPage}>
      <div className={styles.pageHeading}>
        <span className={styles.stepBadge}>١</span>
        <div><p>إعداد جلسة جديدة</p><h1>لنجهّز حصة اليوم</h1><span>أدخل التفاصيل وارفع قائمة الطلبة، وسنتولى الباقي.</span></div>
      </div>
      <form className={styles.setupGrid} onSubmit={onStart}>
        <section className={styles.formCard}>
          <div className={styles.cardTitle}><span><BookOpen size={20} /></span><div><h2>تفاصيل الجلسة</h2><p>المعلومات التي ستظهر في تقرير الحضور</p></div></div>
          <div className={styles.fieldGrid}>
            <label><span>اسم المقرر</span><input required value={session.courseName} onChange={(event) => setSession({ ...session, courseName: event.target.value })} placeholder="مثال: أساسيات البرمجة" /></label>
            <label><span>اسم المدرس</span><input required value={session.teacherName} onChange={(event) => setSession({ ...session, teacherName: event.target.value })} placeholder="مثال: د. أحمد محمد" /></label>
            <label className={styles.fullField}><span>الفترة الحالية</span><select value={session.periodNumber} onChange={(event) => setSession({ ...session, periodNumber: Number(event.target.value) })}>{periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}</select></label>
          </div>
          {periodStatus && (
            <div className={`${styles.periodStatus} ${styles[periodStatus.type]}`}>
              {periodStatus.type === 'empty' ? <CheckCircle2 size={19} /> : <CircleAlert size={19} />}
              <span><strong>{periodStatus.type === 'empty' ? 'الفترة متاحة' : 'تنبيه بيانات'}</strong>{periodStatus.message}</span>
            </div>
          )}
        </section>
        <section className={styles.formCard}>
          <div className={styles.cardTitle}><span><FileSpreadsheet size={20} /></span><div><h2>قائمة الطلبة</h2><p>Student number، Student name، ثم period1 إلى period16</p></div></div>
          <ExcelDropZone fileName={fileName} loading={fileLoading} onFile={onFile} onClear={onClearFile} />
          {fileError && <div className={styles.fileError}><CircleAlert size={17} />{fileError}</div>}
          <button className={styles.templateButton} type="button" onClick={downloadTemplate}><Download size={16} /> تنزيل ملف نموذجي</button>
        </section>
        <div className={styles.startBar}>
          <span>{students.length ? <><Users size={18} /><b>{students.length}</b> طالباً جاهزون للجلسة</> : 'ارفع القائمة لإظهار عدد الطلبة'}</span>
          <button className={styles.primaryButton} type="submit" disabled={!canStart}>بدء المسح <Camera size={18} /></button>
        </div>
      </form>
    </section>
  );
}

function AttendancePage({ session, students, attendees, manualNumber, setManualNumber, onManualSubmit, onScan, onExport, exporting }) {
  return (
    <section className={styles.attendancePage}>
      <div className={styles.sessionHeader}>
        <div><span className={styles.liveDot}><i /> جلسة نشطة</span><h1>{session.courseName}</h1><p>{session.teacherName} <b>•</b> الفترة {session.periodNumber} <b>•</b> {formatArabicDate()}</p></div>
        <button className={styles.exportButton} onClick={onExport} disabled={exporting}><Download size={18} />{exporting ? 'جارٍ التجهيز...' : 'تصدير Excel'}</button>
      </div>
      <div className={styles.attendanceGrid}>
        <section className={styles.scannerPanel}>
          <div className={styles.panelHeading}><div><h2>امسح رمز الطالب</h2><p>يجب أن يحتوي رمز QR على رقم الطالب فقط</p></div><span><QrCode size={24} /></span></div>
          <Suspense fallback={<div className={styles.scannerLoading}>جارٍ تجهيز ماسح QR...</div>}>
            <QrScanner onScan={onScan} />
          </Suspense>
          <form className={styles.manualForm} onSubmit={onManualSubmit}>
            <label htmlFor="manualNumber">أو أدخل رقم الطالب يدوياً</label>
            <div><input id="manualNumber" inputMode="numeric" value={manualNumber} onChange={(event) => setManualNumber(event.target.value)} placeholder="رقم الطالب" /><button>تسجيل <ArrowLeft size={17} /></button></div>
          </form>
        </section>
        <section className={styles.listPanel}>
          <div className={styles.listHeading}><div><h2>الحضور المسجّل</h2><p>يتحدّث مباشرة بعد كل عملية مسح</p></div><span><strong>{attendees.length}</strong><small>من {students.length}</small></span></div>
          <div className={styles.progressTrack}><i style={{ width: `${students.length ? (attendees.length / students.length) * 100 : 0}%` }} /></div>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>اسم الطالب</th><th>رقم الطالب</th><th>الحضور</th></tr></thead>
              <tbody>
                {attendees.map((student) => (
                  <tr key={student.id}>
                    <td><span className={styles.avatar}>{student.name.charAt(0)}</span><strong>{student.name}</strong></td>
                    <td>{student.number}</td>
                    <td><span className={styles.checkMark}><Check size={25} strokeWidth={3} /></span><small>{formatArabicTime(student.attendedAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!attendees.length && <div className={styles.emptyState}><span><ScanLine size={28} /></span><strong>بانتظار أول عملية مسح</strong><p>ستظهر أسماء الطلبة هنا فور تسجيل حضورهم.</p></div>}
          </div>
        </section>
      </div>
    </section>
  );
}
