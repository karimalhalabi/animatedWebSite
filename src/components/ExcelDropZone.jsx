import { useRef, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import styles from './ExcelDropZone.module.css';

export default function ExcelDropZone({ fileName, loading, onFile, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = (files) => {
    const [file] = files;
    if (file) onFile(file);
  };

  if (fileName) {
    return (
      <div className={styles.fileCard}>
        <span className={styles.fileIcon}><FileSpreadsheet size={24} /></span>
        <span><strong>{fileName}</strong><small><CheckCircle2 size={14} /> تم تحميل قائمة الطلبة بنجاح</small></span>
        <button type="button" onClick={onClear} aria-label="إزالة الملف"><X size={19} /></button>
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); pickFile(event.dataTransfer.files); }}
      onClick={() => !loading && inputRef.current?.click()}
      onKeyDown={(event) => event.key === 'Enter' && inputRef.current?.click()}
      role="button"
      tabIndex="0"
    >
      <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={(event) => pickFile(event.target.files)} />
      <span className={styles.uploadIcon}><UploadCloud size={29} /></span>
      <strong>{loading ? 'جارٍ قراءة الملف...' : 'اسحب ملف Excel إلى هنا'}</strong>
      <small>أو اضغط لاختيار ملف بصيغة XLSX</small>
    </div>
  );
}
