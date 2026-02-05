# 🔧 Panduan Fix Export/Import Database

## 🚨 Masalah yang Terjadi

File SQL export memiliki **INSERT statement yang terlalu panjang** (1.5 juta karakter dalam 1 baris) karena:
- Gambar signature dan stamp disimpan sebagai **base64** dalam database
- phpMyAdmin export secara default menggabungkan semua INSERT dalam 1 baris
- MySQL tidak bisa import data sebesar ini karena limit `max_allowed_packet`

---

## ✅ Solusi 1: Export Database yang Benar (RECOMMENDED)

### Gunakan Endpoint Baru di Backend

Backend sekarang punya endpoint untuk export database dengan format yang benar:

```bash
# Export database (otomatis split INSERT per row)
GET http://localhost:5000/api/database/export
```

**Cara pakai:**
1. Buka browser: `http://localhost:5000/api/database/export`
2. File SQL akan otomatis download dengan format yang benar
3. File sudah siap untuk di-import tanpa error

### Keuntungan:
- ✅ INSERT statement di-split per row (tidak ada baris super panjang)
- ✅ Aman untuk import ke MySQL mana pun
- ✅ Otomatis backup (tersimpan di folder `backend/backups/`)
- ✅ Auto cleanup (hanya keep 5 backup terakhir)

---

## 🔧 Solusi 2: Export via mysqldump (Manual)

Jika ingin export manual via command line:

```bash
mysqldump --skip-extended-insert --single-transaction --quick ^
  -h 127.0.0.1 -u root -p invoiceapp > invoiceapp-fixed.sql
```

**Parameter penting:**
- `--skip-extended-insert` → Split INSERT per row (PENTING!)
- `--single-transaction` → Backup konsisten
- `--quick` → Tidak buffer seluruh table di memory

---

## 📥 Cara Import Database (Untuk Teman Anda)

### Metode 1: Via Command Line (RECOMMENDED)

```bash
# Increase max_allowed_packet saat import
mysql --max_allowed_packet=64M -u root -p invoiceapp < backup.sql
```

### Metode 2: Via phpMyAdmin

Jika tetap pakai phpMyAdmin, adjust settings dulu:

**1. Edit `php.ini`:**
```ini
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 600
max_input_time = 600
```

**2. Edit `my.ini` atau `my.cnf` (MySQL config):**
```ini
[mysqld]
max_allowed_packet=64M
```

**3. Restart Apache/MySQL**

**4. Import via phpMyAdmin:**
- Upload file SQL
- Jika masih error, pecah file SQL jadi beberapa bagian

---

## 🔍 Cara Cek MySQL Settings

### Cek max_allowed_packet saat ini:

```sql
SHOW VARIABLES LIKE 'max_allowed_packet';
```

### Set max_allowed_packet (temporary):

```sql
SET GLOBAL max_allowed_packet=67108864; -- 64MB
```

### Untuk permanent, edit `my.ini` atau `my.cnf`:

```ini
[mysqld]
max_allowed_packet=64M
```

---

## 📊 Rekomendasi Settings untuk Aplikasi Ini

```ini
# MySQL Configuration (my.ini / my.cnf)
[mysqld]
max_allowed_packet = 64M
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M

# PHP Configuration (php.ini)
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 600
memory_limit = 256M
```

---

## 🎯 Quick Fix untuk File SQL yang Sudah Ada

Jika sudah punya file SQL dengan baris super panjang, ada 2 cara:

### Cara 1: Re-export pakai endpoint baru
1. Import dulu ke database Anda (adjust max_allowed_packet)
2. Export ulang via `http://localhost:5000/api/database/export`
3. Kirim file baru ini ke teman

### Cara 2: Manual split (advanced)
Gunakan text editor yang support file besar (Notepad++, VS Code) dan ganti:
```sql
# Dari:
INSERT INTO invoices (...) VALUES (data1),(data2),(data3);

# Jadi:
INSERT INTO invoices (...) VALUES (data1);
INSERT INTO invoices (...) VALUES (data2);
INSERT INTO invoices (...) VALUES (data3);
```

---

## 📞 Testing

### Test endpoint baru:

```bash
# Cek MySQL config recommendations
curl http://localhost:5000/api/database/config

# Download backup
curl http://localhost:5000/api/database/export -o backup.sql
```

---

## 💡 Tips Tambahan

1. **Untuk Production:**
   - Gunakan file storage (S3, cloud storage) untuk gambar, bukan base64 di database
   - Simpan hanya URL/path gambar di database

2. **Untuk Development:**
   - Backup database secara regular
   - Test import di environment lain sebelum kirim ke teman

3. **Untuk Sharing:**
   - Compress file SQL: `gzip backup.sql` → menghasilkan `backup.sql.gz`
   - File jadi lebih kecil untuk transfer

---

## ✅ Checklist untuk Teman yang Import

- [ ] MySQL installed dan running
- [ ] Set `max_allowed_packet=64M` di MySQL config
- [ ] Restart MySQL service
- [ ] Create database: `CREATE DATABASE invoiceapp;`
- [ ] Import via command line: `mysql --max_allowed_packet=64M -u root -p invoiceapp < backup.sql`
- [ ] Verify: `USE invoiceapp; SELECT COUNT(*) FROM invoices;`

---

## 🚀 Cara Pakai Sekarang

1. **Restart backend server** (sudah ada endpoint baru)
2. **Export database**: Buka `http://localhost:5000/api/database/export`
3. **Kirim file** hasil export ke teman
4. **Teman import** dengan command: `mysql --max_allowed_packet=64M -u root -p invoiceapp < filename.sql`

DONE! ✨
