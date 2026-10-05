# رمز — Student QR

Simple Arabic React/JSX application with CSS Modules. Generate one student QR or import up to 500 students from an XLSX file. QR payloads contain only the student number. Excel data is processed locally in the browser.

## Run

Requires Node.js 22.12+ (verified with Node 24).

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

Use the downloadable template or put `اسم الطالب` and `رقم الطالب` in the first row of the first worksheet. English `student name` and `student number` headers also work. Store numbers as text to preserve leading zeros. Duplicate numbers, incomplete rows and formula cells are reported for correction. Maximum upload size is 10 MB. Click a generated QR to download it.
