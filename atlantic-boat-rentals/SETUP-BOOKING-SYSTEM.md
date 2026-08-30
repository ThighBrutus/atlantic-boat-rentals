# Setting up the booking system

This connects your booking form to a Google Sheet (where every request gets saved) and gives you a
private "Booking Desk" webpage where your crew can see requests and mark them finalized.

It's free, and Google hosts the backend for you — you don't need your own server.

## Part 1 — Create the Sheet + backend (10 minutes)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
   Name it something like **Atlantic Bookings**.
2. Look at the address bar. The URL looks like:
   `https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlmNoPQRstuVWxyz1234567890/edit`
   Copy the long ID part between `/d/` and `/edit` — you'll paste it in step 5.
3. Go to **[script.google.com](https://script.google.com)** in a new tab (don't use the
   Extensions → Apps Script menu inside the Sheet — on some accounts that link is broken and
   throws a "Sorry, unable to open the file" Google Drive error; going straight to script.google.com
   avoids that entirely).
4. Click **New project**. Delete whatever's in the code editor (usually `function myFunction() {}`),
   and paste in the entire contents of **`booking-backend.gs`** (included in your files).
5. Near the top of that code, find these two lines:
   ```
   const SHEET_ID = '';
   const WORKER_TOKEN = 'CHANGE-THIS-TO-YOUR-OWN-SECRET';
   ```
   - Paste the Sheet ID you copied in step 2 between the quotes for `SHEET_ID`.
   - Replace the `WORKER_TOKEN` text with your own password — this protects your customers' info,
     so make it something only your crew knows (not "password123").
6. Click **Save** (the disk icon), then click **Deploy → New deployment**.
7. Click the gear icon next to "Select type" and choose **Web app**.
8. Fill in:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
9. Click **Deploy**. The first time, Google will ask you to authorize it — click through
   "Advanced" → "Go to (your project name)" if it warns you, since this is your own script.
10. Copy the **Web app URL** it gives you (looks like `https://script.google.com/macros/s/AKfycb.../exec`).
    You'll need this in the next two steps.

A sheet tab called **Bookings** will automatically be created the first time a booking (or the
dashboard) touches it — you don't need to set up columns yourself.

**If you'd rather use the Extensions → Apps Script menu and it's working for you:** that's fine
too — just leave `SHEET_ID` blank in that case, since a script opened that way is already
"bound" to the right sheet automatically.

## Part 2 — Connect your live site to it

1. Open **`script.js`** on your site, find this line near the top:
   ```js
   const BOOKING_API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
   and replace the placeholder with the Web App URL you copied above (keep the quotes).
2. Re-upload `script.js` to your host, replacing the old version.

That's it — every "Request my rental" submission now saves straight into your Google Sheet.

## Part 3 — Set up the Booking Desk (worker dashboard)

1. Open **`worker-dashboard.html`**, find the same placeholder near the top of the `<script>` tag,
   and paste in the same Web App URL.
2. Upload `worker-dashboard.html` to your host, in the same folder as the rest of your site.
3. **Don't link to it from your public site or navigation.** It isn't listed anywhere and search
   engines are told not to index it, but treat the URL itself (e.g.
   `yoursite.com/worker-dashboard.html`) as something you only share with your crew — like a
   password, not a public page.
4. To use it: open that URL, enter the password you set in `WORKER_TOKEN`, and you'll see every
   trip request, newest first, with tabs for **Pending**, **Finalized**, and **All**. Hit
   **Finalize** once you've confirmed a trip with the customer, or **Mark pending** to undo that.

## A couple of things worth knowing

- **Anyone with the dashboard URL *and* the password can see customer names/phone numbers.**
  Keep the password out of texts/emails where possible, and change `WORKER_TOKEN` any time
  someone who knew it shouldn't have access anymore (then update it in `worker-dashboard.html` too).
- **The Google Sheet itself is also a perfectly good way to see bookings** if you ever want to skip
  the dashboard — it's the same data, just as a spreadsheet, and you can filter/sort/export from
  there too.
- If you ever want text or email alerts the moment someone books (instead of only checking the
  dashboard), that's a small addition to the Apps Script — just ask and I can add it.
