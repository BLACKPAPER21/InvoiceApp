import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoiceapp';

// Sample invoices data
const sampleInvoices = [
  {
    id: 'INV-2026-001',
    clientName: 'PT Maju Jaya',
    clientEmail: 'admin@majujaya.co.id',
    status: 'paid',
    dateIssued: '2026-01-15',
    dueDate: '2026-01-22',
    items: [
      { desc: 'Web Development - Landing Page', qty: 1, price: 8500000 },
      { desc: 'SEO Optimization', qty: 1, price: 2500000 },
    ],
    total: 11000000,
  },
  {
    id: 'INV-2026-002',
    clientName: 'CV Kreatif Nusantara',
    clientEmail: 'contact@kreatifnusantara.com',
    status: 'pending',
    dateIssued: '2026-01-20',
    dueDate: '2026-01-27',
    items: [
      { desc: 'Mobile App Development', qty: 1, price: 45000000 },
      { desc: 'UI/UX Design', qty: 1, price: 12000000 },
    ],
    total: 57000000,
  },
  {
    id: 'INV-2026-003',
    clientName: 'Toko Berkah Online',
    clientEmail: 'info@tokoberkah.id',
    status: 'overdue',
    dateIssued: '2026-01-10',
    dueDate: '2026-01-17',
    items: [
      { desc: 'E-Commerce Website', qty: 1, price: 25000000 },
    ],
    total: 25000000,
  },
  {
    id: 'INV-2026-004',
    clientName: 'PT Solusi Digital',
    clientEmail: 'hello@solusidigital.co.id',
    status: 'pending',
    dateIssued: '2026-01-22',
    dueDate: '2026-01-29',
    items: [
      { desc: 'Brand Identity Design', qty: 1, price: 7500000 },
      { desc: 'Social Media Content (1 Month)', qty: 1, price: 5000000 },
    ],
    total: 12500000,
  },
];

async function seedDatabase() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing invoices
    console.log('🗑️  Clearing existing invoices...');
    await Invoice.deleteMany({});
    console.log('✅ Cleared existing invoices');

    // Insert sample data
    console.log('📝 Inserting sample invoices...');
    await Invoice.insertMany(sampleInvoices);
    console.log(`✅ Inserted ${sampleInvoices.length} sample invoices`);

    // Verify
    const count = await Invoice.countDocuments();
    console.log(`📊 Total invoices in database: ${count}`);

    mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
