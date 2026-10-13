require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const cron     = require('node-cron');
const twilio   = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ─────────────────────────────────────────────────────────
//  TWILIO CONFIG
// ─────────────────────────────────────────────────────────
const twilioClient       = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const TWILIO_WA_FROM     = 'whatsapp:+14155238886';
const PHOTOGRAPHER_PHONE = process.env.PHOTOGRAPHER_PHONE;

// ─────────────────────────────────────────────────────────
//  SCHEMAS
// ─────────────────────────────────────────────────────────
const imageSchema = new mongoose.Schema({
  filename:   String,
  path:       String,
  uploadedAt: { type: Date, default: Date.now }
});
const Image = mongoose.model('Image', imageSchema);

const contactSchema = new mongoose.Schema({
  name: String, email: String, phone: String,
  date: String, plan: String,
  submittedAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

const orderSchema = new mongoose.Schema({
  clientName:     { type: String, required: true, trim: true },
  phone:          { type: String, required: true, trim: true },
  email:          { type: String, trim: true, default: '' },
  eventDate:      { type: Date,   required: true },
  eventType:      { type: String, default: '' },
  plan:           { type: String, default: '' },
  advance:        { type: Number, default: 0 },
  totalAmount:    { type: Number, default: 0 },
  status:         { type: String, enum: ['Pending','Confirmed','Cancelled'], default: 'Pending' },
  notes:          { type: String, default: '' },
  reminderSent:   { type: Boolean, default: false },
  reminderSentAt: { type: Date,    default: null },
  createdAt:      { type: Date,    default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ─────────────────────────────────────────────────────────
//  MULTER
// ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ─────────────────────────────────────────────────────────
//  WHATSAPP REMINDER — IST timezone safe
// ─────────────────────────────────────────────────────────
async function sendReminders() {
  // Always calculate in IST — works even if server runs in UTC
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  nowIST.setDate(nowIST.getDate() + 2);

  const dayStart = new Date(nowIST); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(nowIST); dayEnd.setHours(23, 59, 59, 999);

  console.log(`\n[Reminder] Checking for events on: ${dayStart.toDateString()}`);
  console.log(`[Reminder] Window: ${dayStart} → ${dayEnd}`);

  try {
    const orders = await Order.find({
      eventDate:    { $gte: dayStart, $lte: dayEnd },
      reminderSent: { $ne: true },
      status:       { $ne: 'Cancelled' }
    });

    console.log(`[Reminder] Found ${orders.length} order(s) to remind.`);

    if (!orders.length) {
      return { sent: 0, message: 'No events in 2 days.' };
    }

    let sentCount = 0;

    for (const order of orders) {
      const dateLabel = new Date(order.eventDate).toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });

      const message =
`📸 *Thoozhaa Photography — Event Reminder*

You have an event in *2 days!*

👤 Client   : ${order.clientName}
📞 Phone    : ${order.phone}
📅 Date     : ${dateLabel}
🎉 Type     : ${order.eventType  || 'Not specified'}
📦 Package  : ${order.plan       || 'Not specified'}
💰 Total    : ₹${order.totalAmount ? Number(order.totalAmount).toLocaleString('en-IN') : '0'}
💵 Advance  : ₹${order.advance   ? Number(order.advance).toLocaleString('en-IN')   : '0'}
📝 Notes    : ${order.notes      || 'None'}

Please confirm your availability and prepare accordingly.
— Thoozhaa Admin`;

      try {
        await twilioClient.messages.create({
          from: TWILIO_WA_FROM,
          to:   `whatsapp:${PHOTOGRAPHER_PHONE}`,
          body: message
        });

        await Order.findByIdAndUpdate(order._id, {
          reminderSent:   true,
          reminderSentAt: new Date()
        });

        sentCount++;
        console.log(`  ✅ Sent → ${order.clientName} (${dateLabel})`);

      } catch (twilioErr) {
        console.error(`  ❌ Twilio error for ${order.clientName}:`);
        console.error(`     Code   : ${twilioErr.code}`);
        console.error(`     Message: ${twilioErr.message}`);
      }
    }

    return { sent: sentCount, total: orders.length };

  } catch (err) {
    console.error('[Reminder] DB error:', err.message);
    throw err;
  }
}

// ── ✅ FIX: Cron is started INSIDE .then() after DB connects ──
function startReminderCron() {
  cron.schedule('0 8 * * *', () => {
    console.log('\n[Cron] ⏰ 8:00 AM IST — running daily reminder check...');
    sendReminders();
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Reminder cron started — fires daily at 8:00 AM IST');

  // Test log every minute so you can confirm cron is alive
  // (remove this after confirming it works)
  cron.schedule('* * * * *', () => {
    console.log(`[Cron] ✔ alive — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  });
}

// ─────────────────────────────────────────────────────────
//  ✅ FIX: MongoDB connects THEN starts cron
// ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    startReminderCron(); // ← MUST be inside .then()
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─────────────────────────────────────────────────────────
//  IMAGE ROUTES
// ─────────────────────────────────────────────────────────
app.get('/api/images', async (req, res) => {
  try { res.json(await Image.find().sort({ uploadedAt: -1 })); }
  catch { res.status(500).json({ success: false, message: 'Error fetching images' }); }
});

app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    const newImage = new Image({ filename: req.file.filename, path: req.file.path });
    await newImage.save();
    res.json({ success: true, image: newImage });
  } catch { res.status(500).json({ success: false, message: 'Error uploading image' }); }
});

app.delete('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });
    const filePath = path.join(__dirname, image.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Image.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch { res.status(500).json({ success: false, message: 'Error deleting image' }); }
});

// ─────────────────────────────────────────────────────────
//  CONTACT ROUTES
// ─────────────────────────────────────────────────────────
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, date, plan } = req.body;
    await new Contact({ name, email, phone, date, plan }).save();
    res.json({ success: true, message: 'Contact saved!' });
  } catch { res.status(500).json({ success: false, message: 'Error saving contact' }); }
});

app.get('/api/contacts', async (req, res) => {
  try { res.json(await Contact.find().sort({ submittedAt: -1 })); }
  catch { res.status(500).json({ success: false, message: 'Error fetching contacts' }); }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch { res.status(500).json({ success: false, message: 'Error deleting contact' }); }
});

// ─────────────────────────────────────────────────────────
//  ORDER ROUTES
// ─────────────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let filter = {};
    if      (req.query.type === 'pre')  filter = { eventDate: { $gte: today } };
    else if (req.query.type === 'post') filter = { eventDate: { $lt:  today } };
    res.json(await Order.find(filter).sort({ eventDate: 1 }));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders', details: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await new Order(req.body).save();
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ error: 'Failed to create order', details: err.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const result = await Order.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Manual trigger from "Send Now" button
app.post('/api/orders/send-reminders', async (req, res) => {
  try {
    const result = await sendReminders();
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─────────────────────────────────────────────────────────
app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));