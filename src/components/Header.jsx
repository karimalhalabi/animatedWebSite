import { GraduationCap, House, Plus } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ page, onHome, onNewSession }) {
  return (
    <header className={styles.header}>
      <button className={styles.brand} onClick={onHome} aria-label="العودة إلى الصفحة الرئيسية">
        <span className={styles.logo}><GraduationCap size={27} strokeWidth={2.2} /></span>
        <span><strong>حاضِر</strong><small>نظام الحضور الذكي</small></span>
      </button>
      <nav aria-label="التنقل الرئيسي">
        <button className={page === 'home' ? styles.active : ''} onClick={onHome}>
          <House size={18} /><span>الرئيسية</span>
        </button>
        <button className={page === 'setup' ? styles.active : ''} onClick={onNewSession}>
          <Plus size={18} /><span>جلسة جديدة</span>
        </button>
      </nav>
    </header>
  );
}
