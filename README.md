# Invoice App

Aplikasi Manajemen Invoice modern yang dibuat dengan React (Vite) dan Express (Node.js).

## 🚀 Instalasi & Setup (Untuk aaPanel / Local)

### 1. Setup Backend
Backend bertugas mengurus database dan API.

1.  Masuk ke folder `backend`:
    ```bash
    cd backend
    ```
2.  Install library yang dibutuhkan:
    ```bash
    npm install
    ```
3.  **Konfigurasi Database**:
    - Pastikan MongoDB sudah jalan (bisa di local laptop atau cloud).
    - Aplikasi akan **otomatis membuat** database bernama `invoiceapp` saat pertama kali dijalankan.
    - (Opsional) Isi database dengan data contoh biar nggak kosong:
        ```bash
        npm run seed
        ```
4.  Jalankan server:
    ```bash
    npm start
    ```
    Server jalan di: `http://localhost:5000`

### 2. Setup Frontend
Frontend adalah tampilan antarmuka aplikasinya.

1.  Masuk ke folder utama project (kalau belum):
    ```bash
    cd ..
    ```
2.  Install library:
    ```bash
    npm install
    ```
3.  Jalankan mode development:
    ```bash
    npm run dev
    ```

## 🌐 Cara Deploy (aaPanel Node.js Manager)

Kalau mau upload ke aaPanel, ikuti langkah ini:

1.  **Upload File**:
    - **PENTING**: Jangan upload folder `node_modules` atau `backend/data`. Biarin aja folder itu, nanti kita install di sana.
    - Upload sisa file project-nya (bisa di-zip dulu biar gampang).
2.  **Node.js Project Manager (di aaPanel)**:
    - Buka menu **Website > Node Project**.
    - Klik **Add Node Project**.
    - Arahkan folder ke tempat upload tadi (`/www/wwwroot/namafolder/backend`).
    - **PENTING**: Centang opsi **Install Dependencies** (atau klik tombol "Install" di menu projects setelah dibuat).
    - aaPanel akan otomatis menjalankan `npm install` buat kamu. Jadi nggak perlu ketik manual di terminal.
    - Set *Start Script* ke `server.js`.
3.  **Database**:
    - Pastikan *MongoDB Service* sudah diinstall dan jalan di aaPanel (cek di App Store aaPanel).
    - Kalau mau isi data contoh, buka terminal di aaPanel, masuk ke folder backend, terus ketik `npm run seed`.
