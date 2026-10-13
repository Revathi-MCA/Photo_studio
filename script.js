// chatbot
// ── Chatbot ──
let isOpen = false;   // ← must be at top
let isTyping = false;

const responses = [
  {
    keywords: ['hi','hello','hey','vanakkam','start','help'],
    reply: "👋 Hello! Welcome to *Thoozhaa Studio*. I'm here to help you with bookings, pricing, and any questions about our photography services. What would you like to know?",
    chips: ['💰 Pricing', '📅 How to Book', '📸 Our Services', '📍 Location']
  },
  {
    keywords: ['price','cost','amount','charge','fee','rate','package','how much','budget'],
    reply: "💰 *Our Photography Packages:*\n\n📌 *Basic* — ₹8,000\nIncludes 4 hrs, 100 edited photos\n\n📌 *Standard* — ₹15,000\nIncludes 8 hrs, 300 edited photos + album\n\n📌 *Premium* — ₹25,000\nIncludes full day, 500+ photos, 2 albums, video highlights\n\n📌 *Wedding* — Starting ₹35,000\nCustom package based on your requirements\n\nAll packages include professional editing! 🎨",
    chips: ['📅 Book Now', '🎬 Video?', '📸 What\'s Included', '📞 Contact Us']
  },
  {
    keywords: ['book','booking','appointment','reserve','schedule','how to book'],
    reply: "📅 *Booking is easy!*\n\n1️⃣ Go to our *Contact Page*\n2️⃣ Fill in your name, email, phone & wedding date\n3️⃣ Tell us your plan/requirements\n4️⃣ Click Submit — we'll confirm within 24 hours!\n\nOr call us directly at *+91 8940048067* 📞",
    chips: ['💰 Pricing', '📍 Location', '📞 WhatsApp Us', '📸 Our Services']
  },
  {
    keywords: ['service','services','what do you','offer','photography','type','event'],
    reply: "📸 *Our Photography Services:*\n\n💍 Wedding Photography\n💑 Pre-Wedding Shoots\n🎂 Birthday & Events\n👶 Baby & Maternity\n🏢 Corporate Events\n📱 Product Photography\n🎓 Graduation & Portraits\n\nWe capture every precious moment! ✨",
    chips: ['💰 Pricing', '📅 Book Now', '🎬 Video Services', '📍 Location']
  },
  {
    keywords: ['video','videography','reel','film','cinema','cinematic'],
    reply: "🎬 *Yes! We offer Videography too!*\n\n🎥 Cinematic Wedding Films\n🎞️ Pre-Wedding Reels\n📱 Social Media Highlights\n🎶 Full Event Coverage\n\nVideo packages start from ₹12,000. Combined photo + video packages available at special rates! 🎁",
    chips: ['💰 Pricing', '📅 Book Now', '📸 Photo Only']
  },
  {
    keywords: ['location','address','where','place','studio','come','visit'],
    reply: "📍 *Find Us Here:*\n\nThoozhaa Studio Photography\nMain Road, Karkathi\nThiruvarur - 612203\n\n🕒 Open: Mon–Sat, 9AM – 7PM\n📞 +91 8940048067\n📧 thozhastudio@gmail.com",
    chips: ['📅 Book Now', '📞 Contact Us', '💰 Pricing']
  },
  {
    keywords: ['contact','phone','call','whatsapp','email','reach','number'],
    reply: "📞 *Contact Thoozhaa Studio:*\n\n📱 Phone/WhatsApp: *+91 8940048067*\n📧 Email: thozhastudio@gmail.com\n📍 Thiruvarur - 612203\n\nYou can also fill our Contact Form on the website and we'll reply within 24 hours! 😊",
    chips: ['📅 Book Now', '💰 Pricing', '📍 Location']
  },
  {
    keywords: ['wedding','marriage','bride','groom','reception','engagement'],
    reply: "💍 *Wedding Photography with Thoozhaa Studio!*\n\nWe specialize in capturing your most precious day.\n\n✅ Candid + Traditional shots\n✅ Full day coverage\n✅ Professional edited album\n✅ Same-day preview (Premium)\n✅ Drone shots available\n\nWedding packages start from *₹35,000*. We recommend booking at least *2 months in advance!* 📅",
    chips: ['💰 All Packages', '📅 Book Now', '🎬 Add Video', '📞 Call Us']
  },
  {
    keywords: ['album','photo','delivery','when','days','receive','get photos'],
    reply: "🖼️ *Photo Delivery:*\n\n📸 Preview gallery: *3–5 days*\n💿 Full edited photos: *2–3 weeks*\n📚 Printed album: *3–4 weeks*\n\nAll photos are delivered via Google Drive link. Printed albums are home-delivered! 🏠",
    chips: ['💰 Pricing', '📅 Book Now', '📸 Our Services']
  },
  {
    keywords: ['advance','deposit','payment','pay','token'],
    reply: "💳 *Payment Details:*\n\nWe require a *30% advance* to confirm your booking date.\n\nPayment methods accepted:\n✅ UPI / GPay / PhonePe\n✅ Bank Transfer\n✅ Cash\n\nBalance amount to be paid on the day of shoot. 😊",
    chips: ['📅 Book Now', '💰 Pricing', '📞 Contact Us']
  },
  {
    keywords: ['cancel','reschedule','postpone','refund'],
    reply: "📋 *Cancellation Policy:*\n\n• Cancel *7+ days before*: Full advance refunded ✅\n• Cancel *3–7 days before*: 50% refund\n• Cancel *less than 3 days*: No refund ❌\n\nRescheduling is allowed once at no extra charge (7+ days notice). 📅",
    chips: ['📅 Book Now', '📞 Contact Us', '💰 Pricing']
  },
  {
    keywords: ['outdoor','indoor','location shoot','travel'],
    reply: "🌿 *Location Shoots:*\n\nWe do both *indoor studio* and *outdoor location* shoots!\n\n🌅 Outdoor locations in Thiruvarur area — *no travel charge*\n🚗 Outside Thiruvarur — small travel fee applies\n\nPopular outdoor spots we use: beaches, temples, gardens, farmlands! 🏞️",
    chips: ['💰 Pricing', '📅 Book Now', '📍 Our Location']
  },
  {
    keywords: ['thank','thanks','ok','okay','great','nice','good','awesome','perfect','sure'],
    reply: "😊 You're welcome! Feel free to ask anything else. We'd love to be your photographer for your special day! 📷✨",
    chips: ['📅 Book Now', '💰 Pricing', '📞 Contact Us']
  }
];

const defaultReply = {
  reply: "🤔 I'm not sure about that. Here are some things I can help you with:",
  chips: ['💰 Pricing', '📅 How to Book', '📸 Our Services', '📍 Location', '📞 Contact Us']
};

function toggleChat() {
  isOpen = !isOpen;
  document.getElementById('chat-window').classList.toggle('open', isOpen);
  document.getElementById('chat-toggle').classList.toggle('open', isOpen);
  if (isOpen && document.getElementById('chatMessages').children.length === 0) {
    setTimeout(() => botReply(
      "👋 Hi! I'm the Thoozhaa Studio assistant. How can I help you today?",
      ['💰 Pricing', '📅 How to Book', '📸 Our Services', '📍 Location']
    ), 400);
  }
}

function handleKey(e) {
  if (e.key === 'Enter') sendMessage();
}

function sendMessage(text) {
  const input = document.getElementById('userInput');
  const msg = (text || input.value).trim();
  if (!msg || isTyping) return;
  input.value = '';
  appendMessage(msg, 'user');
  processInput(msg);
}

function processInput(msg) {
  const lower = msg.toLowerCase();
  let matched = null;
  const chipMap = {
    '💰 pricing': 'price', '📅 how to book': 'book', '📅 book now': 'book',
    '📸 our services': 'service', '📍 location': 'location',
    '📞 contact us': 'contact', '📞 whatsapp us': 'contact', '📞 call us': 'contact',
    '🎬 video services': 'video', '🎬 add video': 'video', '🎬 video?': 'video',
    '💰 all packages': 'price', '📸 photo only': 'service', '📸 what\'s included': 'service',
  };
  const chipKey = chipMap[msg.toLowerCase()];
  if (chipKey) matched = responses.find(r => r.keywords.includes(chipKey));
  if (!matched) matched = responses.find(r => r.keywords.some(k => lower.includes(k)));
  const result = matched || defaultReply;
  showTypingThen(() => botReply(result.reply, result.chips));
}

function showTypingThen(callback) {
  isTyping = true;
  const container = document.getElementById('chatMessages');
  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.id = 'typingEl';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(typingEl);
  scrollBottom();
  setTimeout(() => {
    typingEl.remove();
    isTyping = false;
    callback();
  }, 800 + Math.random() * 600);
}

function botReply(text, chips) {
  const formatted = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  appendMessage(formatted, 'bot', chips, true);
}

function appendMessage(text, sender, chips, isHTML) {
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = sender === 'user' ? 'flex-end' : 'flex-start';
  const bubble = document.createElement('div');
  bubble.className = `msg ${sender}`;
  if (isHTML) bubble.innerHTML = text;
  else bubble.textContent = text;
  const time = document.createElement('div');
  time.className = `msg-time ${sender === 'user' ? 'right' : ''}`;
  time.textContent = now;
  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  if (chips && chips.length) {
    const chipRow = document.createElement('div');
    chipRow.className = 'quick-replies';
    chips.forEach(label => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = label;
      chip.onclick = () => { chipRow.remove(); sendMessage(label); };
      chipRow.appendChild(chip);
    });
    wrapper.appendChild(chipRow);
  }
  container.appendChild(wrapper);
  scrollBottom();
}

function scrollBottom() {
  const c = document.getElementById('chatMessages');
  c.scrollTop = c.scrollHeight;
}

// gallery
const items = document.querySelectorAll(".gallery-item");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const images = entry.target.querySelectorAll("img");
      images.forEach((img, index) => {
        setTimeout(() => {
          entry.target.classList.add("show");
        }, index * 150); // 150ms delay between each
      });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

items.forEach(item => observer.observe(item));

// feedback
const cards = document.querySelectorAll(".person");

const observers = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      observers.unobserve(entry.target); // animate only once
    }
  });
}, { threshold: 0.2 });

cards.forEach(card => observers.observe(card));
cards.forEach((card, index) => {
  observers.observe(card);
  card.style.transitionDelay = `${index * 0.2}s`; // 0.2s delay per card
});

// black and white
const images = document.querySelectorAll(".baw-img img");

images.forEach(img => {
  const original = img.src;
  const hover = img.getAttribute("data-hover");

  img.addEventListener("mouseover", () => {
    img.src = hover;
  });

  img.addEventListener("mouseout", () => {
    img.src = original;
  });
});

// contact
function sendToWhatsApp(event) {
    event.preventDefault(); // stop page refresh

    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;
    let date = document.getElementById("date").value;
    let plan = document.getElementById("plan").value;

    let message = `Name: ${name}%0AEmail: ${email}%0APhone: ${phone}%0ADate: ${date}%0APlan: ${plan}`;
    
    let whatsappNumber = "9111111111"; // replace with your WhatsApp number
    let url = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(url, '_blank').focus();
}

// prewed
const carousel = document.querySelector('.carousel');
const image = document.querySelectorAll('.carousel img');
let activeIndex = 4; // middle image (5th one) at center by default

updateCarousel();

image.forEach((img, index) => {
  img.addEventListener('click', () => {
    activeIndex = index;
    updateCarousel();
  });
});

function updateCarousel() {
  image.forEach(img => img.classList.remove('active'));
  image[activeIndex].classList.add('active');

  // center the active image
  const centerX = carousel.offsetWidth / 2;
  const activeImg = image[activeIndex];
  const activeRect = activeImg.getBoundingClientRect();
  const carouselRect = carousel.getBoundingClientRect();
  const offset = centerX - (activeRect.left - carouselRect.left) - activeRect.width / 2;

  carousel.style.transform = `translateX(${offset}px)`;
}
// back button
function goBack() {
  // Option 1: Go to previous page
  window.history.back();
}

// shop
window.onload = function() {
  document.getElementById("contact-btn").addEventListener("click", function() {
    window.location.href = "contact.html";
  });
};

// gallery backend
const gallery = document.getElementById("gallery");
const API_URL = "http://localhost:5000/api/images";

async function loadImages() {
  const res = await fetch(API_URL);
  const images = await res.json();

  gallery.innerHTML = images.map(img => `
    <div class="gallery-item">
      <img src="http://localhost:5000/${img.path}" alt="${img.filename}">
    </div>
  `).join("");
}

loadImages();

