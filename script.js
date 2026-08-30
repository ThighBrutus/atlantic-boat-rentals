const $ = (selector) => document.querySelector(selector);
const bookingForm = $('#booking-form');
const success = $('.form-success');
const editable = [...document.querySelectorAll('h1, h2, h3, .hero-text, .section-top > p, .experience-copy > p:not(.eyebrow), .booking-intro > p:not(.eyebrow), address, .coral-card > p:last-of-type')];
const sections = [...document.querySelectorAll('.editable-section')];
const storageKey = 'atlantic-site-v4';
let editMode = false;

// ── Booking backend ──────────────────────────────────────────────────
// Paste the Web App URL you get after deploying booking-backend.gs here.
// See SETUP-BOOKING-SYSTEM.md for the full walkthrough.
const BOOKING_API_URL = 'https://thighbrutus.github.io/atlantic-boat-rentals/';
// ──────────────────────────────────────────────────────────────────────

$('#year').textContent = new Date().getFullYear();

const rentalDate = $('#rental-date');
const calendarDays = $('#calendar-days');
const calendarTitle = $('#calendar-title');
const dateHelper = $('#date-helper');
const today = new Date();
today.setHours(0, 0, 0, 0);
let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
function formatDate(date) { return date.toISOString().split('T')[0]; }
function renderCalendar() {
  calendarDays.innerHTML = '';
  calendarTitle.textContent = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = displayedMonth.getDay();
  const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
  for (let blank = 0; blank < firstDay; blank += 1) calendarDays.append(document.createElement('span'));
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), day);
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = day; button.disabled = date < today;
    if (rentalDate.value === formatDate(date)) button.classList.add('selected');
    button.addEventListener('click', () => { const selected = formatDate(date); rentalDate.value = selected; rentalDate.setAttribute('value', selected); dateHelper.dataset.rentalDate = selected; dateHelper.textContent = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} selected — next, tell us about your trip.`; renderCalendar(); });
    calendarDays.append(button);
  }
  $('#calendar-prev').disabled = displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() === today.getMonth();
}
$('#calendar-prev').addEventListener('click', () => { displayedMonth.setMonth(displayedMonth.getMonth() - 1); renderCalendar(); });
$('#calendar-next').addEventListener('click', () => { displayedMonth.setMonth(displayedMonth.getMonth() + 1); renderCalendar(); });
renderCalendar();

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const details = Object.fromEntries(new FormData(bookingForm));
  details.date ||= dateHelper.dataset.rentalDate;
  if (!details.date) { dateHelper.textContent = 'Choose a rental date above before you send your request.'; return; }

  const submitButton = bookingForm.querySelector('button[type="submit"]');
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Sending…'; }

  const finish = (ok) => {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Request my rental'; }
    success.textContent = ok
      ? `Thanks, ${details.name.split(' ')[0]} — your availability request is ready for the Atlantic crew. We’ll be in touch at ${details.phone}.`
      : `Thanks, ${details.name.split(' ')[0]} — we saved your details, but please also call ${$('.phone') ? $('.phone').textContent : 'us'} to confirm, just in case.`;
    success.style.display = 'block';
    bookingForm.reset();
  };

  if (!BOOKING_API_URL || BOOKING_API_URL.includes('PASTE_YOUR_APPS_SCRIPT')) {
    // Backend not connected yet — fall back to the old local-only confirmation.
    finish(true);
    return;
  }

  fetch(BOOKING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // avoids a CORS preflight against Apps Script
    body: JSON.stringify(details),
  })
    .then((response) => response.json())
    .then((result) => finish(Boolean(result && result.ok)))
    .catch(() => finish(false));
});

function savePage() {
  const content = editable.map((item) => item.innerHTML);
  localStorage.setItem(`${storageKey}-content`, JSON.stringify(content));
  localStorage.setItem(`${storageKey}-order`, JSON.stringify(sections.map((section) => section.id || section.classList[0])));
}
function restorePage() {
  const content = JSON.parse(localStorage.getItem(`${storageKey}-content`) || 'null');
  if (content) editable.forEach((item, index) => { if (content[index]) item.innerHTML = content[index]; });
  const order = JSON.parse(localStorage.getItem(`${storageKey}-order`) || 'null');
  if (order) { const main = $('main'); order.forEach((key) => { const section = key.startsWith('#') ? $(key) : document.querySelector(`.${key}`); if (section) main.append(section); }); }
}
restorePage();

$('#edit-toggle').addEventListener('click', () => {
  editMode = !editMode;
  document.body.classList.toggle('editing', editMode);
  $('#edit-panel').classList.toggle('active', editMode);
  $('#edit-panel').setAttribute('aria-hidden', String(!editMode));
  $('#edit-toggle').textContent = editMode ? 'Finish editing' : 'Customize page';
  editable.forEach((item) => item.contentEditable = String(editMode));
  sections.forEach((section) => {
    section.draggable = editMode;
    let handle = section.querySelector('.drag-handle');
    if (editMode && !handle) { handle = document.createElement('button'); handle.type = 'button'; handle.className = 'drag-handle'; handle.textContent = 'DRAG SECTION'; section.prepend(handle); }
  });
  if (!editMode) savePage();
});

let dragging;
sections.forEach((section) => {
  section.addEventListener('dragstart', () => { if (!editMode) return; dragging = section; section.classList.add('dragging'); });
  section.addEventListener('dragend', () => { section.classList.remove('dragging'); dragging = null; savePage(); });
  section.addEventListener('dragover', (event) => { if (!dragging || dragging === section) return; event.preventDefault(); const box = section.getBoundingClientRect(); if (event.clientY < box.top + box.height / 2) section.before(dragging); else section.after(dragging); });
});
$('#reset-page').addEventListener('click', () => { localStorage.removeItem(`${storageKey}-content`); localStorage.removeItem(`${storageKey}-order`); location.reload(); });
$('#save-copy').addEventListener('click', async () => { await navigator.clipboard.writeText(JSON.stringify({content: editable.map((item) => item.innerHTML), order: sections.map((section) => section.id || section.classList[0])}, null, 2)); $('#save-copy').textContent = 'Changes copied'; });
