# Invoice Management System - Backend API

Backend API untuk Invoice Management System menggunakan Express.js dan MongoDB.

## 🚀 Features

- ✅ RESTful API untuk CRUD Invoice
- ✅ MongoDB database dengan Mongoose ODM
- ✅ Auto-generate Invoice ID (INV-YYYY-NNN)
- ✅ Validasi data otomatis
- ✅ CORS enabled
- ✅ Error handling
- ✅ Request logging

## 📋 Prerequisites

- Node.js v18+
- MongoDB v8.0+ (running locally atau MongoDB Atlas)
- npm atau yarn

## 🛠️ Installation

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env  # (gunakan .env yang sudah ada)
```

## ⚙️ Environment Variables

Edit file `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/invoiceapp
PORT=5000
NODE_ENV=development
```

## 🎯 Running the Server

### Development Mode (dengan auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di: **http://localhost:5000**

## 📊 Seeding Database

Untuk mengisi database dengan sample data:

```bash
node seed.js
```

Ini akan membuat 4 invoice sample.

## 📡 API Endpoints

### Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | Get all invoices |
| GET | `/invoices/:id` | Get single invoice by ID |
| POST | `/invoices` | Create new invoice |
| PUT | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Delete invoice |
| GET | `/invoices/stats` | Get invoice statistics |

### Example Requests

#### 1. Get All Invoices
```bash
GET http://localhost:5000/api/invoices
```

Response:
```json
{
  "success": true,
  "count": 4,
  "data": [...]
}
```

#### 2. Create New Invoice
```bash
POST http://localhost:5000/api/invoices
Content-Type: application/json

{
  "clientName": "PT Example",
  "clientEmail": "client@example.com",
  "status": "pending",
  "dateIssued": "2026-01-24",
  "dueDate": "2026-01-31",
  "items": [
    {
      "desc": "Web Development",
      "qty": 1,
      "price": 10000000
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "INV-2026-005",
    ...
  }
}
```

#### 3. Update Invoice
```bash
PUT http://localhost:5000/api/invoices/INV-2026-001
Content-Type: application/json

{
  "status": "paid"
}
```

#### 4. Delete Invoice
```bash
DELETE http://localhost:5000/api/invoices/INV-2026-001
```

#### 5. Get Statistics
```bash
GET http://localhost:5000/api/invoices/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 11000000,
    "pendingCount": 2,
    "paidCount": 1,
    "overdueCount": 1,
    "totalInvoices": 4
  }
}
```

## 📦 Project Structure

```
backend/
├── controllers/
│   └── invoiceController.js    # Business logic
├── models/
│   └── Invoice.js               # Mongoose schema
├── routes/
│   └── invoices.js              # API routes
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies
├── seed.js                      # Database seeding script
└── server.js                    # Main server file
```

## 🔍 MongoDB Schema

```javascript
{
  id: String,           // Auto-generated: INV-YYYY-NNN
  clientName: String,
  clientEmail: String,
  status: String,       // enum: ['pending', 'paid', 'overdue']
  dateIssued: String,
  dueDate: String,
  items: [{
    desc: String,
    qty: Number,
    price: Number
  }],
  total: Number,        // Auto-calculated
  createdAt: Date,      // Auto-generated
  updatedAt: Date       // Auto-generated
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
- Pastikan MongoDB service running
- Check dengan command: `mongosh`
- Atau gunakan MongoDB Atlas (cloud)

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Atau ganti PORT di .env
PORT=5001
```

## 🔗 Integration dengan Frontend

Frontend React app harus running di port berbeda (default: 5173)

CORS sudah enabled untuk `http://localhost:5173`

## 📝 License

ISC
