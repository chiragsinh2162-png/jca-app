const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Uploads setup ----------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ---------- Database setup ----------
const db = new DatabaseSync('./dealership.db');

db.exec(`CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT, model TEXT, year INTEGER,
    fuel TEXT, transmission TEXT, km INTEGER,
    purchasePrice REAL DEFAULT 0,
    repairCost REAL DEFAULT 0,
    sellingPrice REAL DEFAULT 0,
    profit REAL DEFAULT 0,
    purchaseDate TEXT, soldDate TEXT,
    photo TEXT, rcFile TEXT, insuranceFile TEXT,
    notes TEXT,
    buyerName TEXT, buyerPhone TEXT, buyerAddress TEXT,
    invoiceNo TEXT,
    status TEXT DEFAULT 'In Stock'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carId INTEGER,
    stage TEXT,
    screenshot TEXT,
    note TEXT,
    date TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS repairBills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carId INTEGER,
    billImage TEXT,
    garageName TEXT,
    amount REAL DEFAULT 0,
    note TEXT,
    date TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carId INTEGER, customerName TEXT, phone TEXT,
    message TEXT, date TEXT
)`);

// ---------- Middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// ---------- Helper ----------
function calcProfit(car) {
    if (car.status === 'Sold' && car.sellingPrice > 0) {
        return (car.sellingPrice || 0) - (car.purchasePrice || 0) - (car.repairCost || 0);
    }
    return 0;
}

function nextInvoiceNo() {
    const row = db.prepare("SELECT COUNT(*) as c FROM cars WHERE invoiceNo IS NOT NULL").get();
    const n = (row.c || 0) + 1;
    const year = new Date().getFullYear();
    return `JCA/${year}/${String(n).padStart(3, '0')}`;
}

// ---------- Routes ----------

app.get('/', (req, res) => {
    const cars = db.prepare("SELECT * FROM cars ORDER BY id DESC").all();
    const totalInvestment = cars.filter(c => c.status !== 'Sold')
        .reduce((s, c) => s + (c.purchasePrice || 0) + (c.repairCost || 0), 0);
    const totalProfit = cars.reduce((s, c) => s + calcProfit(c), 0);
    const soldCount = cars.filter(c => c.status === 'Sold').length;
    const stockCount = cars.filter(c => c.status === 'In Stock').length;

    res.render('dashboard', {
        cars, totalInvestment, totalProfit, soldCount, stockCount,
        search: '', filter: 'all',
        active: 'dashboard', pageTitle: 'Dashboard'
    });
});

app.get('/add', (req, res) => {
    res.render('add', { active: 'add', pageTitle: 'Add New Car' });
});

app.post('/add', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'rcFile', maxCount: 1 },
    { name: 'insuranceFile', maxCount: 1 }
]), (req, res) => {
    const b = req.body;
    const files = req.files || {};
    const photo = files.photo ? files.photo[0].filename : null;
    const rcFile = files.rcFile ? files.rcFile[0].filename : null;
    const insuranceFile = files.insuranceFile ? files.insuranceFile[0].filename : null;

    db.prepare(`INSERT INTO cars
        (make, model, year, fuel, transmission, km,
         purchasePrice, repairCost, purchaseDate,
         photo, rcFile, insuranceFile, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Stock')`)
      .run(
        b.make, b.model, Number(b.year) || 0,
        b.fuel || '', b.transmission || '', Number(b.km) || 0,
        Number(b.purchasePrice) || 0, Number(b.repairCost) || 0,
        b.purchaseDate || '',
        photo, rcFile, insuranceFile, b.notes || ''
      );
    res.redirect('/');
});

// View single car
app.get('/car/:id', (req, res) => {
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);
    if (!car) return res.redirect('/');
    const payments = db.prepare("SELECT * FROM payments WHERE carId = ? ORDER BY id DESC").all(req.params.id);
    const repairBills = db.prepare("SELECT * FROM repairBills WHERE carId = ? ORDER BY id DESC").all(req.params.id);
    const totalRepairCost = repairBills.reduce((s, b) => s + (b.amount || 0), 0);
    res.render('car-detail', {
        car, payments, repairBills, totalRepairCost,
        active: 'dashboard', pageTitle: `${car.year} ${car.make} ${car.model}`
    });
});

// Sell car
app.post('/sell/:id', (req, res) => {
    const id = req.params.id;
    const b = req.body;
    const sellingPrice = Number(b.sellingPrice) || 0;
    const soldDate = b.soldDate || new Date().toISOString().slice(0, 10);
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(id);

    if (car) {
        const repairRow = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM repairBills WHERE carId = ?").get(id);
        const totalRepair = repairRow.total || 0;
        const profit = sellingPrice - (car.purchasePrice || 0) - totalRepair;
        const invoiceNo = car.invoiceNo || nextInvoiceNo();
        db.prepare(`UPDATE cars SET sellingPrice=?, soldDate=?, profit=?,
                    repairCost=?, buyerName=?, buyerPhone=?, buyerAddress=?,
                    invoiceNo=?, status='Sold' WHERE id=?`)
          .run(sellingPrice, soldDate, profit, totalRepair,
               b.buyerName || '', b.buyerPhone || '', b.buyerAddress || '',
               invoiceNo, id);
    }
    res.redirect('/');
});

// Update car details
app.post('/update/:id', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'rcFile', maxCount: 1 },
    { name: 'insuranceFile', maxCount: 1 }
]), (req, res) => {
    const id = req.params.id;
    const b = req.body;
    const files = req.files || {};
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(id);
    if (!car) return res.redirect('/');

    const photo = files.photo ? files.photo[0].filename : car.photo;
    const rcFile = files.rcFile ? files.rcFile[0].filename : car.rcFile;
    const insuranceFile = files.insuranceFile ? files.insuranceFile[0].filename : car.insuranceFile;

    db.prepare(`UPDATE cars SET make=?, model=?, year=?, fuel=?, transmission=?,
                km=?, purchasePrice=?, purchaseDate=?, notes=?,
                photo=?, rcFile=?, insuranceFile=? WHERE id=?`)
      .run(b.make, b.model, Number(b.year) || 0, b.fuel || '', b.transmission || '',
           Number(b.km) || 0, Number(b.purchasePrice) || 0,
           b.purchaseDate || '', b.notes || '',
           photo, rcFile, insuranceFile, id);
    res.redirect('/car/' + id);
});

// Upload payment screenshot
app.post('/car/:id/payment', upload.single('screenshot'), (req, res) => {
    const id = req.params.id;
    if (!req.file) return res.redirect('/car/' + id);
    db.prepare(`INSERT INTO payments (carId, stage, screenshot, note, date)
                VALUES (?, ?, ?, ?, ?)`)
      .run(id, req.body.stage || 'General', req.file.filename,
           req.body.note || '', new Date().toISOString().slice(0, 10));
    res.redirect('/car/' + id);
});

// Delete payment
app.post('/payment/:id/delete', (req, res) => {
    const p = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id);
    if (p) {
        db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);
        res.redirect('/car/' + p.carId);
    } else {
        res.redirect('/');
    }
});

// Upload repair bill
app.post('/car/:id/repair', upload.single('billImage'), (req, res) => {
    const id = req.params.id;
    if (!req.file) return res.redirect('/car/' + id);
    db.prepare(`INSERT INTO repairBills (carId, billImage, garageName, amount, note, date)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, req.file.filename,
           req.body.garageName || '',
           Number(req.body.amount) || 0,
           req.body.note || '',
           new Date().toISOString().slice(0, 10));

    const row = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM repairBills WHERE carId = ?").get(id);
    db.prepare("UPDATE cars SET repairCost = ? WHERE id = ?").run(row.total || 0, id);

    res.redirect('/car/' + id);
});

// Delete repair bill
app.post('/repair/:id/delete', (req, res) => {
    const b = db.prepare("SELECT * FROM repairBills WHERE id = ?").get(req.params.id);
    if (b) {
        db.prepare("DELETE FROM repairBills WHERE id = ?").run(req.params.id);
        const row = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM repairBills WHERE carId = ?").get(b.carId);
        db.prepare("UPDATE cars SET repairCost = ? WHERE id = ?").run(row.total || 0, b.carId);
        res.redirect('/car/' + b.carId);
    } else {
        res.redirect('/');
    }
});

// Delete car
app.post('/delete/:id', (req, res) => {
    db.prepare("DELETE FROM payments WHERE carId = ?").run(req.params.id);
    db.prepare("DELETE FROM repairBills WHERE carId = ?").run(req.params.id);
    db.prepare("DELETE FROM cars WHERE id = ?").run(req.params.id);
    res.redirect('/');
});

// Search
app.get('/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const filter = req.query.filter || 'all';
    let cars = db.prepare("SELECT * FROM cars ORDER BY id DESC").all();
    if (q) cars = cars.filter(c =>
        (c.make || '').toLowerCase().includes(q) ||
        (c.model || '').toLowerCase().includes(q) ||
        String(c.year).includes(q));
    if (filter === 'stock') cars = cars.filter(c => c.status === 'In Stock');
    if (filter === 'sold') cars = cars.filter(c => c.status === 'Sold');

    const totalInvestment = cars.filter(c => c.status !== 'Sold')
        .reduce((s, c) => s + (c.purchasePrice || 0) + (c.repairCost || 0), 0);
    const totalProfit = cars.reduce((s, c) => s + calcProfit(c), 0);
    const soldCount = cars.filter(c => c.status === 'Sold').length;
    const stockCount = cars.filter(c => c.status === 'In Stock').length;

    res.render('dashboard', {
        cars, totalInvestment, totalProfit, soldCount, stockCount,
        search: req.query.q || '', filter,
        active: filter === 'stock' ? 'stock' : filter === 'sold' ? 'sold' : 'dashboard',
        pageTitle: 'Search Results'
    });
});

// Reports
app.get('/reports', (req, res) => {
    const cars = db.prepare("SELECT * FROM cars").all();
    const totalProfit = cars.reduce((s, c) => s + calcProfit(c), 0);
    const totalRevenue = cars.filter(c => c.status === 'Sold').reduce((s, c) => s + (c.sellingPrice || 0), 0);
    const totalSpend = cars.reduce((s, c) => s + (c.purchasePrice || 0) + (c.repairCost || 0), 0);
    const totalRepairBills = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM repairBills").get().t || 0;

    const monthly = {};
    cars.forEach(c => {
        if (c.status === 'Sold' && c.soldDate) {
            const m = c.soldDate.slice(0, 7);
            monthly[m] = (monthly[m] || 0) + calcProfit(c);
        }
    });

    res.render('reports', {
        totalProfit, totalRevenue, totalSpend, monthly, totalRepairBills,
        active: 'reports', pageTitle: 'Reports'
    });
});

// Enquiries
app.get('/enquiries', (req, res) => {
    const rows = db.prepare(`SELECT e.*, c.make, c.model FROM enquiries e
                             LEFT JOIN cars c ON c.id = e.carId
                             ORDER BY e.id DESC`).all();
    res.render('enquiries', {
        enquiries: rows,
        active: 'enquiries', pageTitle: 'Customer Enquiries'
    });
});

app.post('/enquiry', (req, res) => {
    const { carId, customerName, phone, message } = req.body;
    db.prepare(`INSERT INTO enquiries (carId, customerName, phone, message, date)
                VALUES (?, ?, ?, ?, ?)`)
      .run(carId, customerName, phone, message, new Date().toISOString());
    res.redirect('/');
});

// ---------- START SERVER ----------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Jai Chehar Auto Consult running on port ${PORT}`);
});
