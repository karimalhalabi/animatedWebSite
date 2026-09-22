import { Heart } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>حاضِر © {new Date().getFullYear()}</span>
      <span>صُمم للتعليم <Heart size={14} fill="currentColor" aria-label="بحب" /></span>
    </footer>
  );
}
