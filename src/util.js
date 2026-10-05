import { useState } from 'react';
import QRCode from 'qrcode';

export async function makeQr(number, width = 400) {
  return QRCode.toDataURL(number, { width, margin: 3, errorCorrectionLevel: 'M', color: { dark: '#102438', light: '#ffffff' } });
}
export function downloadFile(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
}
export function downloadQr(student) { downloadFile(student.qr, `student-${student.number.replace(/[^\p{L}\p{N}_-]/gu, '_')}.png`); }
export async function downloadTemplate() {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('الطلاب');
  sheet.columns = [{ header: 'اسم الطالب', key: 'name', width: 30 }, { header: 'رقم الطالب', key: 'number', width: 24 }];
  sheet.addRow({ name: 'أحمد محمد', number: '00123456' });
  sheet.getColumn(2).numFmt = '@';
  const url = URL.createObjectURL(new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  downloadFile(url, 'students-template.xlsx');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function cellText(cell) {
  if (cell.type === 6 || cell.value?.formula) throw new Error('يرجى استبدال المعادلات بقيم نصية في أعمدة الطلاب.');
  const value = cell.text.trim();
  if (typeof cell.value === 'number' && /^0+$/.test(cell.numFmt || '')) return value.padStart(cell.numFmt.length, '0');
  return value;
}
export async function readStudents(file) {
  if (!file || !/\.xlsx$/i.test(file.name)) throw new Error('يرجى اختيار ملف Excel بصيغة XLSX.');
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يجب ألا يتجاوز 10 ميغابايت.');
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); } catch { throw new Error('تعذّر قراءة الملف. تأكد من أنه ملف XLSX صالح وغير محمي.'); }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('الملف لا يحتوي على ورقة بيانات.');
  let nameColumn, numberColumn;
  sheet.getRow(1).eachCell((cell, index) => {
    const header = cell.text.trim().toLowerCase().replace(/[\s_]+/g, ' ');
    if (['اسم الطالب', 'الاسم', 'student name', 'name'].includes(header)) nameColumn = index;
    if (['رقم الطالب', 'الرقم', 'الرقم الجامعي', 'student number', 'number', 'student id'].includes(header)) numberColumn = index;
  });
  if (!nameColumn || !numberColumn) throw new Error('يجب أن يحتوي الصف الأول على «اسم الطالب» و«رقم الطالب». يمكنك تنزيل القالب.');
  const students = [];
  const seen = new Set();
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const name = cellText(row.getCell(nameColumn));
    const number = cellText(row.getCell(numberColumn));
    if (!name && !number) continue;
    if (!name || !number) throw new Error(`الصف ${i}: يرجى إدخال اسم الطالب ورقمه.`);
    if (number.length > 100 || name.length > 120) throw new Error(`الصف ${i}: الاسم أو الرقم طويل جدًا.`);
    if (seen.has(number)) throw new Error(`الصف ${i}: رقم الطالب ${number} مكرر.`);
    seen.add(number);
    students.push({ name, number });
    if (students.length > 500) throw new Error('يمكن توليد رموز لـ 500 طالب في الملف الواحد.');
  }
  if (!students.length) throw new Error('لا توجد بيانات طلاب في الملف.');
  return Promise.all(students.map(async student => ({ ...student, qr: await makeQr(student.number, 450) })));
}
export function useGenerator() {
  const [page, setPage] = useState('home');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  function navigate(next) { setPage(next); setError(''); }
  async function generate(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (!name.trim() || !number.trim()) throw new Error('يرجى إدخال اسم الطالب ورقمه.');
      setStudent({ name: name.trim(), number: number.trim(), qr: await makeQr(number.trim()) });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function upload(file) {
    if (busy || !file) return;
    setError(''); setBusy(true); setStudents([]); setFileName('');
    try { setStudents(await readStudents(file)); setFileName(file.name); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  function onFile(event) { upload(event.target.files[0]); event.target.value = ''; }
  function onDrop(event) { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files[0]); }
  function onDragOver(event) { event.preventDefault(); setDragging(true); }
  function onDragLeave(event) { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }
  function changeName(event) { setName(event.target.value); }
  function changeNumber(event) { setNumber(event.target.value); }
  async function template() { try { await downloadTemplate(); } catch { setError('تعذّر تنزيل القالب. يرجى المحاولة مرة أخرى.'); } }
  return { page, navigate, name, number, student, students, fileName, error, busy, dragging, generate, onFile, onDrop, onDragOver, onDragLeave, changeName, changeNumber, template };
}
