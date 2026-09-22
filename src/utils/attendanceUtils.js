export const periods = Array.from({ length: 16 }, (_, index) => ({
  value: index + 1,
  label: `الفترة ${index + 1}`,
}));

const numberAliases = ['studentnumber', 'studentno', 'number', 'id', 'رقمالطالب', 'الرقمالجامعي'];
const nameAliases = ['studentname', 'name', 'اسمالطالب', 'الاسم'];

const normalizeHeader = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[\s_-]+/g, '');

export const normalizeStudentNumber = (value) => String(value ?? '').trim();
const findColumn = (headers, aliases) => headers.findIndex((header) => aliases.includes(header));
const findPeriodColumn = (headers, periodNumber) => findColumn(
  headers,
  [`period${periodNumber}`, `الفترة${periodNumber}`, `الحصة${periodNumber}`],
);
const isFilled = (value) => value !== null && value !== undefined && String(value).trim() !== '';

export const formatArabicDate = (date = new Date()) => new Intl.DateTimeFormat('ar-SA', {
  year: 'numeric', month: 'long', day: 'numeric',
}).format(date);

export const formatArabicTime = (date = new Date()) => new Intl.DateTimeFormat('ar-SA', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}).format(date);

export const getPeriodStatus = (students, periodNumber) => {
  const filledCount = students.filter((student) => isFilled(student.periods[periodNumber])).length;
  if (filledCount === 0) return { type: 'empty', filledCount, message: 'هذه الفترة فارغة وجاهزة لتسجيل الحضور.' };
  if (filledCount === students.length) return { type: 'filled', filledCount, message: 'سبق تسجيل الحضور في هذه الفترة. اختر فترة أخرى.' };
  return { type: 'partial', filledCount, message: `تحتوي هذه الفترة على حضور سابق لـ ${filledCount} من الطلبة. اختر فترة أخرى لحماية البيانات.` };
};

export const readAttendanceFile = async (file) => {
  if (!file?.name?.toLowerCase().endsWith('.xlsx')) throw new Error('يرجى رفع ملف Excel بصيغة XLSX.');

  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('لا يحتوي الملف على ورقة عمل.');

  const headers = worksheet.getRow(1).values.slice(1).map(normalizeHeader);
  const numberColumn = findColumn(headers, numberAliases);
  const nameColumn = findColumn(headers, nameAliases);
  const periodColumns = Object.fromEntries(periods.map(({ value }) => [value, findPeriodColumn(headers, value)]));

  if (numberColumn < 0 || nameColumn < 0) {
    throw new Error('يجب أن يحتوي الصف الأول على عمودي student number و student name.');
  }
  const missingPeriod = periods.find(({ value }) => periodColumns[value] < 0);
  if (missingPeriod) throw new Error(`العمود period${missingPeriod.value} غير موجود في الملف.`);

  const students = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const studentNumber = normalizeStudentNumber(row.getCell(numberColumn + 1).value);
    const studentName = String(row.getCell(nameColumn + 1).value ?? '').trim();
    if (!studentNumber && !studentName) continue;
    if (!studentNumber || !studentName) throw new Error(`بيانات الطالب في الصف ${rowNumber} غير مكتملة.`);
    students.push({
      id: `${studentNumber}-${rowNumber}`,
      number: studentNumber,
      name: studentName,
      periods: Object.fromEntries(periods.map(({ value }) => [value, row.getCell(periodColumns[value] + 1).value ?? ''])),
    });
  }

  if (students.length === 0) throw new Error('لم يتم العثور على طلبة في الملف.');
  const seen = new Set();
  const duplicate = students.find((student) => seen.has(student.number) || !seen.add(student.number));
  if (duplicate) throw new Error(`رقم الطالب ${duplicate.number} مكرر في الملف.`);

  return { students, fileName: file.name };
};

export const markStudentAttendance = (students, scannedValue, periodNumber) => {
  const number = normalizeStudentNumber(scannedValue);
  const student = students.find((item) => item.number === number);
  if (!student) return { students, student: null, status: 'notFound' };
  if (isFilled(student.periods[periodNumber])) return { students, student, status: 'duplicate' };

  const attendedAt = new Date();
  return {
    students: students.map((item) => item.id === student.id
      ? { ...item, periods: { ...item.periods, [periodNumber]: attendedAt } }
      : item),
    student: { ...student, attendedAt },
    status: 'marked',
  };
};

const safeFileName = (value) => String(value).trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-');

const applyThinBorder = (cell) => {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD8C7BA' } },
    left: { style: 'thin', color: { argb: 'FFD8C7BA' } },
    bottom: { style: 'thin', color: { argb: 'FFD8C7BA' } },
    right: { style: 'thin', color: { argb: 'FFD8C7BA' } },
  };
};

export const exportAttendanceFile = async ({ students, courseName, teacherName, periodNumber }) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'نظام حاضر';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('سجل الحضور', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 6 }] });
  sheet.columns = [{ width: 10 }, { width: 26 }, { width: 22 }, { width: 22 }];

  sheet.mergeCells('A1:D1');
  const title = sheet.getCell('A1');
  title.value = 'سجل الحضور';
  title.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C2D12' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 38;

  sheet.mergeCells('A2:B2');
  sheet.mergeCells('C2:D2');
  sheet.getCell('A2').value = `المقرر: ${courseName}`;
  sheet.getCell('C2').value = `المدرس: ${teacherName}`;
  sheet.mergeCells('A3:B3');
  sheet.mergeCells('C3:D3');
  sheet.getCell('A3').value = `الفترة: ${periodNumber}`;
  sheet.getCell('C3').value = `التاريخ: ${formatArabicDate()}`;
  ['A2', 'C2', 'A3', 'C3'].forEach((address) => {
    const cell = sheet.getCell(address);
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF5B2C1C' } };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  });

  const attendedCount = students.filter((student) => isFilled(student.periods[periodNumber])).length;
  sheet.mergeCells('A5:D5');
  sheet.getCell('A5').value = `الحضور: ${attendedCount} من أصل ${students.length} طالباً`;
  sheet.getCell('A5').alignment = { horizontal: 'center' };
  sheet.getCell('A5').font = { name: 'Arial', bold: true, color: { argb: 'FF2B7A4B' } };

  const header = sheet.getRow(6);
  header.values = ['م', 'اسم الطالب', 'رقم الطالب', `حضور الفترة ${periodNumber}`];
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9A3F1F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyThinBorder(cell);
  });

  students.forEach((student, index) => {
    const value = student.periods[periodNumber];
    const row = sheet.addRow([index + 1, student.name, student.number, isFilled(value) ? value : 'غائب']);
    row.height = 25;
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', color: { argb: 'FF33251F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFFFFDFA' : 'FFF7F0E9' } };
      applyThinBorder(cell);
    });
    const attendanceCell = row.getCell(4);
    if (value instanceof Date) attendanceCell.numFmt = 'yyyy-mm-dd';
    attendanceCell.font = { name: 'Arial', bold: true, color: { argb: isFilled(value) ? 'FF2B7A4B' : 'FF9B2C2C' } };
  });

  sheet.autoFilter = { from: 'A6', to: `D${students.length + 6}` };
  sheet.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `حضور-${safeFileName(courseName)}-الفترة-${periodNumber}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadTemplate = async () => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('الطلبة', { views: [{ rightToLeft: true }] });
  sheet.addRow(['student number', 'student name', ...periods.map(({ value }) => `period${value}`)]);
  sheet.addRow(['2026001', 'مثال: أحمد محمد']);
  sheet.columns = [{ width: 18 }, { width: 28 }, ...periods.map(() => ({ width: 14 }))];
  const header = sheet.getRow(1);
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9A3F1F' } };
    cell.alignment = { horizontal: 'center' };
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer]));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'نموذج-قائمة-الطلبة.xlsx';
  anchor.click();
  URL.revokeObjectURL(url);
};
