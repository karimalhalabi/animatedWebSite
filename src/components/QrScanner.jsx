import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import styles from './QrScanner.module.css';

export default function QrScanner({ onScan }) {
  const callbackRef = useRef(onScan);
  const lastScanRef = useRef({ value: '', time: 0 });
  const [status, setStatus] = useState('starting');
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => { callbackRef.current = onScan; }, [onScan]);

  useEffect(() => {
    let active = true;
    const scanner = new Html5Qrcode('qrReader');

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: (width, height) => ({ width: Math.min(width, height) * 0.7, height: Math.min(width, height) * 0.7 }) },
      (decodedText) => {
        const now = Date.now();
        if (decodedText === lastScanRef.current.value && now - lastScanRef.current.time < 2500) return;
        lastScanRef.current = { value: decodedText, time: now };
        callbackRef.current(decodedText);
      },
      () => {},
    ).then(async () => {
      if (!active) {
        await scanner.stop();
        scanner.clear();
        return;
      }
      setStatus('ready');
    }).catch(() => active && setStatus('error'));

    return () => {
      active = false;
      if (scanner.isScanning) scanner.stop().catch(() => {}).finally(() => scanner.clear());
      else scanner.clear();
    };
  }, [restartKey]);

  return (
    <div className={styles.scannerShell}>
      <div id="qrReader" className={styles.reader} />
      {status !== 'ready' && (
        <div className={styles.scannerState}>
          {status === 'starting' ? <Camera className={styles.pulse} size={34} /> : <CameraOff size={34} />}
          <strong>{status === 'starting' ? 'جارٍ تشغيل الكاميرا...' : 'تعذّر الوصول إلى الكاميرا'}</strong>
          <small>{status === 'starting' ? 'اسمح للمتصفح باستخدام الكاميرا' : 'تحقق من الإذن أو استخدم الإدخال اليدوي'}</small>
          {status === 'error' && <button onClick={() => { setStatus('starting'); setRestartKey((key) => key + 1); }}><RefreshCw size={16} /> إعادة المحاولة</button>}
        </div>
      )}
      <div className={styles.scanLine} aria-hidden="true" />
    </div>
  );
}
