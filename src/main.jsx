import React from 'react';
import { createRoot } from 'react-dom/client';
import { QrCode, ArrowUpLeft, ArrowLeft, Sparkles, ShieldCheck, Zap, Download, UploadCloud, FileSpreadsheet, Check, ScanLine, Layers3, UserRound } from 'lucide-react';
import { useGenerator, downloadQr } from './util';
import styles from './App.module.css';

function App() {
  const app = useGenerator();
  return <div className={styles.app}>
    <header className={styles.header}>
      <a href="#home" className={styles.brand} onClick={() => app.navigate('home')}><span className={styles.brandIcon}><QrCode size={28}/></span><span>رمز<span className={styles.brandCaption}>لكل طالب، هويّة رقمية</span></span></a>
      <nav className={styles.nav} aria-label="التنقل الرئيسي">{[['home', 'الرئيسية'], ['single', 'توليد فردي'], ['bulk', 'توليد جماعي']].map(([id, label]) => <button key={id} className={app.page === id ? styles.activeNav : ''} onClick={() => app.navigate(id)}>{label}</button>)}</nav>
      <span className={styles.headerNote}><span/> بسيط. سريع. بلا حدود.</span>
    </header>
    <main className={styles.main} key={app.page}>
      {app.page === 'home' ? <div className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}><span/> تفاصيل أقل، إمكانيات أكثر</div>
            <h1>رقم طالب.<br/><span>عالم من الإمكانيات.</span></h1>
            <p className={styles.heroDescription}>حوّل أرقام الطلاب إلى رموز QR في لحظات.<br/>لطالب واحد أو لقائمة كاملة، كل ما تحتاجه في مكان واحد.</p>
            <div className={styles.heroActions}><button className={styles.primaryButton} onClick={() => app.navigate('single')}>ابدأ التوليد الآن <ArrowUpLeft size={20}/></button><button className={styles.secondaryButton} onClick={() => app.navigate('bulk')}><Layers3 size={18}/> توليد من ملف Excel</button></div>
            <div className={styles.trustLine}><span><Check/> دون تسجيل حساب</span><span><Check/> بياناتك تبقى على جهازك</span></div>
          </div>
          <div className={styles.heroArt} aria-label="معاينة بطاقة رمز طالب">
            <div className={styles.orbitOne}/><div className={styles.orbitTwo}/><span className={styles.starOne}>✦</span><span className={styles.starTwo}>+</span><span className={styles.tinySquare}/>
            <div className={styles.floatingLabel}><span className={styles.greenIcon}><Check size={15}/></span> جاهز للمسح <span className={styles.labelDot}/></div>
            <div className={styles.sampleCard}><div className={styles.cardTop}><span><span className={styles.smallGoldDot}/> بطاقة الطالب</span><QrCode size={18}/></div><div className={styles.demoQr}><img src="./student-demo.svg" alt="رمز تجريبي للطالب 2024001234"/></div><div className={styles.sampleName}>أحمد محمد العلي</div><div className={styles.sampleNumber}>2024001234</div><div className={styles.cardBottom}><span>هويّة واحدة، وصول أسرع</span><ScanLine size={17}/></div></div>
            <div className={styles.floatingFile}><span className={styles.fileIcon}><FileSpreadsheet size={23}/></span><div><strong>قائمة كاملة. بخطوة واحدة.</strong><small>ارفع ملفك، واترك الباقي لنا</small></div><span className={styles.fileArrow}><ArrowUpLeft size={17}/></span></div>
            <span className={styles.artCaption}>A SMALL CODE. A WORLD OF POSSIBILITIES.</span>
          </div>
        </section>
        <section className={styles.chooseSection}><div className={styles.sectionHeading}><div><span className={styles.sectionKicker}>مصمّم ليختصر وقتك</span><h2>كيف تحب أن تبدأ؟</h2></div><p>اختر طريقتك، والباقي علينا.</p></div>
          <div className={styles.optionGrid}>
            <button className={styles.optionCard} onClick={() => app.navigate('single')}><span className={styles.optionIcon}><QrCode size={26}/></span><span className={styles.optionContent}><span className={styles.optionTitle}>طالب واحد <span>توليد فردي</span></span><span className={styles.optionDescription}>أدخل اسم الطالب ورقمه واحصل على رمز QR جاهز للتحميل.</span><span className={styles.optionLink}>إنشاء رمز جديد <ArrowLeft size={16}/></span></span><span className={styles.optionIndex}>01</span></button>
            <button className={styles.optionCard} onClick={() => app.navigate('bulk')}><span className={styles.optionIcon}><FileSpreadsheet size={26}/></span><span className={styles.optionContent}><span className={styles.optionTitle}>قائمة طلاب <span>توليد جماعي</span></span><span className={styles.optionDescription}>ارفع ملف Excel وأنشئ رموز جميع الطلاب دفعة واحدة.</span><span className={styles.optionLink}>رفع ملف الطلاب <ArrowLeft size={16}/></span></span><span className={styles.optionIndex}>02</span></button>
          </div>
        </section>
        <section className={styles.features}><div><Zap/><span><strong>سرعة تواكبك</strong><small>رموز جاهزة خلال ثوانٍ</small></span></div><div><ShieldCheck/><span><strong>خصوصيتك أولًا</strong><small>تُعالج الملفات محليًا على جهازك</small></span></div><div><ScanLine/><span><strong>وضوح في كل مسح</strong><small>رموز عالية الجودة، سهلة القراءة</small></span></div><div><Sparkles/><span><strong>بساطة في كل خطوة</strong><small>تجربة سلسة على جميع أجهزتك</small></span></div></section>
      </div> : <div className={styles.toolPage}>
        <button className={styles.backLink} onClick={() => app.navigate('home')}>الرئيسية <ArrowLeft size={15}/></button>
        <span className={styles.eyebrow}>{app.page === 'single' ? 'طالب واحد، رمز خاص' : 'قائمة كاملة، بخطوة واحدة'}</span>
        <h1>{app.page === 'single' ? 'إنشاء رمز الطالب' : 'توليد رموز الطلاب'}</h1>
        <p className={styles.pageDescription}>{app.page === 'single' ? 'أدخل بيانات الطالب. سنحوّل رقمه إلى رمز QR جاهز للاستخدام.' : 'ارفع ملف Excel يحتوي على أسماء الطلاب وأرقامهم، وشاهد الرموز في مكان واحد.'}</p>
        {app.page === 'single' ? <div className={styles.singleGrid}>
          <form className={styles.formCard} onSubmit={app.generate}><span className={styles.formHeading}><UserRound size={21}/> بيانات الطالب</span><label htmlFor="name">اسم الطالب</label><input id="name" required maxLength={120} placeholder="مثال: أحمد محمد العلي" value={app.name} onChange={app.changeName}/><label htmlFor="number">رقم الطالب</label><input id="number" required maxLength={100} dir="auto" placeholder="مثال: 2024001234" value={app.number} onChange={app.changeNumber}/><p className={styles.inputHint}>يتضمّن رمز QR رقم الطالب فقط.</p><button className={styles.primaryButton} disabled={app.busy} type="submit">{app.busy ? 'جارٍ التوليد…' : 'إنشاء رمز QR'}<QrCode size={19}/></button><span className={styles.formPrivacy}><ShieldCheck size={15}/> بياناتك آمنة وتبقى على جهازك</span></form>
          <section className={styles.resultBox} aria-live="polite">{app.student ? <><span className={styles.resultStatus}><Check size={16}/> رمز الطالب جاهز</span><img className={styles.singleQr} src={app.student.qr} width="400" height="400" alt={`رمز الطالب ${app.student.number}`}/><h2>{app.student.name}</h2><p dir="ltr">{app.student.number}</p><button className={styles.secondaryButton} onClick={() => downloadQr(app.student)}><Download size={18}/> تحميل الرمز PNG</button></> : <div className={styles.emptyResult}><span><QrCode size={60}/></span><h2>رمزك يبدأ من هنا</h2><p>أدخل بيانات الطالب واضغط على إنشاء<br/>ليظهر رمز QR بحجم 400 × 400 بكسل.</p></div>}</section>
        </div> : <>
          <div className={styles.uploadPanel}><label className={`${styles.dropZone} ${app.dragging ? styles.dragging : ''} ${app.busy ? styles.loading : ''}`} onDrop={app.onDrop} onDragOver={app.onDragOver} onDragLeave={app.onDragLeave}><input type="file" accept=".xlsx" onChange={app.onFile} disabled={app.busy} aria-label="رفع ملف الطلاب"/><span className={styles.uploadIcon}><UploadCloud size={34}/></span><h2>{app.busy ? 'جارٍ قراءة الملف وإنشاء الرموز…' : 'اسحب ملف Excel وأفلته هنا'}</h2><p>أو <span>تصفّح الملفات</span> من جهازك</p><small>XLSX فقط · حتى 10 ميغابايت · 500 طالب كحد أقصى</small></label><div className={styles.templateBar}><span><FileSpreadsheet size={19}/> ابدأ بملف يحتوي على «اسم الطالب» و«رقم الطالب»</span><button onClick={app.template}><Download size={16}/> تنزيل القالب</button></div></div>
          <p className={styles.bulkHint}>لحفظ الأصفار في بداية الرقم، نسّق عمود رقم الطالب كنص في Excel. تُقرأ البيانات من الورقة الأولى.</p>
          {app.students.length > 0 && <section className={styles.tableSection}><div className={styles.tableHeading}><h2>رموز الطلاب <span>{app.students.length} طالب</span></h2><span><Check size={16}/><bdi>{app.fileName}</bdi></span></div><div className={styles.tableScroll}><table><thead><tr><th>اسم الطالب</th><th>رقم الطالب</th><th>رمز QR</th></tr></thead><tbody>{app.students.map(student => <tr key={student.number}><td>{student.name}</td><td><bdi>{student.number}</bdi></td><td><button className={styles.qrDownload} onClick={() => downloadQr(student)} aria-label={`تحميل رمز ${student.name}`}><img src={student.qr} width="150" height="150" alt={`رمز الطالب ${student.number}`}/><span><Download size={13}/> تحميل الرمز</span></button></td></tr>)}</tbody></table></div></section>}
        </>}
        {app.error && <p className={styles.error} role="alert">{app.error}</p>}
      </div>}
    </main>
    <footer className={styles.footer}><span className={styles.footerBrand}><QrCode size={18}/> رمز <span>رمز صغير. أثر كبير.</span></span><span>صُنع لتبسيط يومك <span className={styles.goldSpark}>✦</span></span><span className={styles.footerCopyright}>© {new Date().getFullYear()} رمز. جميع الحقوق محفوظة.</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
