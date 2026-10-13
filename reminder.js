
// ══════════════════════════════════════════════════════════════════
//  reminder.js  —  WhatsApp Reminder System via Twilio
//  
//  HOW IT WORKS:
//  - Runs every day at 8:00 AM automatically
//  - Finds all orders whose eventDate = day after tomorrow (exactly 2 days away)
//  - Sends a WhatsApp message to PHOTOGRAPHER_PHONE for each such order
//  - Marks the order as reminderSent: true so it never sends twice
//
//  SETUP:
//  1. npm install node-cron twilio
//  2. Fill in your Twilio credentials below (or use .env)
//  3. require('./reminder')(app) in your server.js
// ══════════════════════════════════════════════════════════════════

const cron   = require('node-cron');
const twilio = require('twilio');

// ── CONFIG — replace with your real values or load from .env ─────
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID  || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN   || 'your_auth_token_here';
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';   // Twilio sandbox number (keep as-is for sandbox)
                                                         // For production: 'whatsapp:+YOUR_APPROVED_NUMBER'

// Photographer's WhatsApp number (with country code, no spaces)
const PHOTOGRAPHER_PHONE  = process.env.PHOTOGRAPHER_PHONE  || '+918940048067';
// ─────────────────────────────────────────────────────────────────

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Import the Order model (assumes same mongoose connection)
// If your model is in a separate file, adjust the path:
const mongoose = require('mongoose');

function getOrderModel() {
  // Re-use already registered model if it exists
  if (mongoose.models.Order) return mongoose.models.Order;
  const orderSchema = new mongoose.Schema({
    clientName:    String,
    phone:         String,
    email:         String,
    eventDate:     Date,
    eventType:     String,
    plan:          String,
    advance:       Number,
    totalAmount:   Number,
    status:        String,
    notes:         String,
    reminderSent:  { type: Boolean, default: false },
    reminderSentAt:{ type: Date },
    createdAt:     { type: Date, default: Date.now }
  });
  return mongoose.model('Order', orderSchema);
}

// ── Core reminder function ───────────────────────────────────────
async function sendReminders() {
  const Order = getOrderModel();

  // Build "day after tomorrow" date range (full 24-hour window)
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const startOfDay = new Date(twoDaysLater);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(twoDaysLater);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Find orders that are exactly 2 days away AND haven't been reminded yet
    const orders = await Order.find({
      eventDate:    { $gte: startOfDay, $lte: endOfDay },
      reminderSent: { $ne: true },
      status:       { $ne: 'Cancelled' }
    });

    if (orders.length === 0) {
      console.log(`[Reminder ${new Date().toLocaleString('en-IN')}] No events in 2 days. Nothing sent.`);
      return;
    }

    console.log(`[Reminder] Found ${orders.length} event(s) on ${startOfDay.toDateString()}. Sending WhatsApp...`);

    for (const order of orders) {
      const eventDateFormatted = new Date(order.eventDate).toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });

      const message =
`📸 *Thoozhaa Photography — Event Reminder*

Hello! You have an event scheduled in *2 days*.

👤 *Client:* ${order.clientName}
📞 *Client Phone:* ${order.phone}
📅 *Event Date:* ${eventDateFormatted}
🎉 *Event Type:* ${order.eventType || 'Not specified'}
📦 *Package:* ${order.plan || 'Not specified'}
💰 *Total Amount:* ₹${order.totalAmount ? Number(order.totalAmount).toLocaleString('en-IN') : '0'}
💵 *Advance Paid:* ₹${order.advance ? Number(order.advance).toLocaleString('en-IN') : '0'}
📝 *Notes:* ${order.notes || 'None'}

Please confirm your availability and make necessary preparations.

— Thoozhaa Admin`;

      try {
        await client.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to:   `whatsapp:${PHOTOGRAPHER_PHONE}`,
          body: message
        });

        // Mark as reminded so it won't send again
        await Order.findByIdAndUpdate(order._id, {
          reminderSent:   true,
          reminderSentAt: new Date()
        });

        console.log(`  ✅ Reminder sent for: ${order.clientName} (${eventDateFormatted})`);
      } catch (twilioErr) {
        console.error(`  ❌ Failed to send for ${order.clientName}:`, twilioErr.message);
      }
    }

  } catch (err) {
    console.error('[Reminder] DB error:', err.message);
  }
}

// ── Schedule: runs every day at 8:00 AM server time ──────────────
// Cron format: 'second minute hour day month weekday'
// '0 8 * * *' = At 08:00 every day
function startReminderCron() {
  cron.schedule('0 8 * * *', () => {
    console.log('\n[Reminder Cron] Running daily check at 8:00 AM...');
    sendReminders();
  }, {
    timezone: 'Asia/Kolkata'   // Indian Standard Time
  });

  console.log('✅ WhatsApp reminder cron job started — runs daily at 8:00 AM IST');

  // Also run once immediately on server start (optional — catches missed reminders)
  // Comment this out if you don't want it:
  sendReminders();
}

module.exports = { startReminderCron, sendReminders };