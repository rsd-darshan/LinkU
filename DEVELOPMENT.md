# Development Guide

## Running the app from another device (e.g. phone on same Wi‑Fi)

When you open the app at `http://<your-ip>:3000` (e.g. `http://192.168.100.115:3000`), Clerk can fail with:

**`ClerkJS: Something went wrong initializing Clerk.`**

Clerk’s development instance is tied to the **origin** of the page. It works with `http://localhost:3000` by default, but not with a raw IP like `http://192.168.100.115:3000` unless you use one of the options below.

### Option A: Use a tunnel (recommended for mobile/LAN)

Use a tunnel so your app is served at a single public URL that Clerk accepts:

1. **Install a tunnel tool** (pick one):
   - [ngrok](https://ngrok.com): `ngrok http 3000`
   - [localtunnel](https://localtunnel.github.io/www/): `npx localtunnel --port 3000`
2. **Start your app:** `npm run dev`
3. **Start the tunnel** in another terminal (e.g. `ngrok http 3000`).
4. **Open the tunnel URL** on your phone (e.g. `https://abc123.ngrok.io`). Use that URL everywhere instead of the IP.

You may need to add that tunnel URL in the Clerk Dashboard (see Option B) if Clerk still rejects it.

### Option B: Allow your URL in Clerk Dashboard

If your Clerk project has an allowlist for development URLs:

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → your application.
2. Go to **Configure** → **Paths** (or **Domains** / **Settings**).
3. Look for **Allowed redirect URLs**, **Additional redirect URLs**, or **Development URLs**.
4. Add:
   - `http://192.168.100.115:3000` (your LAN IP; use your actual IP if different)
   - Or your tunnel URL, e.g. `https://abc123.ngrok.io`
5. Save.

Dashboard labels differ by Clerk version; if you don’t see an obvious “allowed origins” or “redirect URLs” list, use **Option A (tunnel)** so you have a stable URL.

### Optional: redirect URL when using IP or tunnel

When testing at a specific host (IP or tunnel), set in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://192.168.100.115:3000
# or
NEXT_PUBLIC_APP_URL=https://your-tunnel-url.ngrok.io
```

Use the same URL you open in the browser so redirects (e.g. after sign-in) go to the right place.

## Video calls and Chrome on Mac

If Chrome quits or freezes when a video call is about to start, try:

- **Use Safari** for the call — it’s generally more stable with WebRTC on Mac.
- Update Chrome to the latest version.
- In Chrome, go to `chrome://settings/content/camera` and ensure the site is allowed; same for microphone.

The app uses `720p_2` for video quality; if performance is an issue on low-end devices, consider switching to `480p_1`. Use Safari for calls if you see WebRTC issues on Chrome. **Echo:** AEC (echo cancellation) and AGC are enabled; if you still hear echo, use headphones or lower speaker volume.

## Hydration warning (browser extensions)

If you see a hydration error about `__gchrome_uniqueid` or similar on `<form>` / `<input>`, it’s usually a **browser extension** (e.g. Chrome) modifying the DOM. The app already uses `suppressHydrationWarning` on the affected fields to avoid the warning. For a clean dev setup, you can disable extensions or use a separate browser profile.
