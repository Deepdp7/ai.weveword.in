# KolomFlow — Guest Access (Use Without Login)

> **Feature:** Allow users to use selected free tools without creating an account.  
> **Strategy:** Guest session via anonymous token + rate limiting + soft signup nudge.

---

## 1. What Guests Can and Cannot Do

| Feature | Guest (No Login) | Logged-in Free | Logged-in Paid |
|---|---|---|---|
| **PDF Basic Tools** (all 13) | ✅ Yes — limited | ✅ Yes | ✅ Yes |
| **Studio** | ❌ Login required | Credits | Credits |
| **Scan & Fix** | ❌ Login required | Credits | Credits |
| **Writing Animator** | ❌ Login required | Credits | Credits |
| **Signature Generator** | ❌ Login required | Credits | Credits |
| **Project Builder** | ❌ Login required | Credits | Credits |
| **PPT Maker** | ❌ Login required | Credits | Credits |
| **Cloud Library** | ❌ Login required | ✅ Yes | ✅ Yes |
| **Download output** | ✅ Direct download only | ✅ Save + download | ✅ Save + download |
| **Save to Cloud Library** | ❌ No | ✅ Yes | ✅ Yes |
| **Watch ads for credits** | ❌ No | ✅ Yes | ✅ Yes |
| **Buy credits** | ❌ No | ✅ Yes | ✅ Yes |

### Guest Rate Limits (PDF Tools)

| Tool Category | Guest Limit |
|---|---|
| Any single PDF tool | 3 uses per day per IP |
| Total PDF operations | 5 per day per IP |
| Max file size | 10 MB (vs 50 MB for logged-in) |
| Output file retention | Direct download only — not saved |

---

## 2. How Guest Sessions Work

Guests are identified by a **short-lived anonymous token** stored in `localStorage`. The backend tracks usage against this token + IP address combination.

```
Guest visits site
      │
      ▼
Frontend checks localStorage for guestToken
      │
      ├── exists? → attach to every API request as header: X-Guest-Token
      │
      └── missing? → POST /api/guest/session → backend issues token → store in localStorage
```

### Guest Token Schema (MongoDB — `guestSessions` collection)

```json
{
  "_id": "ObjectId",
  "token": "string (UUID v4, indexed)",
  "ipAddress": "string",
  "usageToday": {
    "pdfOps": 0,
    "date": "ISODate (today)"
  },
  "createdAt": "ISODate",
  "expiresAt": "ISODate (7 days from creation)"
}
```

> MongoDB TTL index on `expiresAt` auto-deletes expired sessions.

---

## 3. Backend Implementation

### 3.1 New Route — `/api/guest`

```js
// server/routes/guest.js

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const GuestSession = require('../models/GuestSession');

// POST /api/guest/session — issue or refresh a guest token
router.post('/session', async (req, res) => {
  try {
    const ip = req.ip;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await GuestSession.create({ token, ipAddress: ip, expiresAt });
    res.json({ token: session.token });
  } catch (err) {
    res.status(500).json({ message: 'Could not create guest session' });
  }
});

module.exports = router;
```

---

### 3.2 Guest Mongoose Model

```js
// server/models/GuestSession.js

const mongoose = require('mongoose');

const guestSessionSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  ipAddress: { type: String, required: true },
  usageToday: {
    pdfOps: { type: Number, default: 0 },
    date:   { type: Date, default: () => new Date().setHours(0,0,0,0) }
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// Auto-delete expired sessions
guestSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GuestSession', guestSessionSchema);
```

---

### 3.3 Guest Rate Limit Middleware

Add this middleware to all PDF tool routes for unauthenticated requests:

```js
// server/middleware/guestRateLimit.js

const GuestSession = require('../models/GuestSession');

const DAILY_PDF_LIMIT = 5;

const guestRateLimit = async (req, res, next) => {
  // If user is logged in, skip guest checks
  if (req.user) return next();

  const token = req.headers['x-guest-token'];
  if (!token) {
    return res.status(401).json({
      message: 'Please sign up or log in to continue.',
      requiresAuth: true
    });
  }

  const session = await GuestSession.findOne({ token });
  if (!session) {
    return res.status(401).json({
      message: 'Guest session expired. Please refresh the page.',
      requiresAuth: false,
      sessionExpired: true
    });
  }

  // Reset daily counter if it's a new day
  const today = new Date().setHours(0, 0, 0, 0);
  if (session.usageToday.date < today) {
    session.usageToday.pdfOps = 0;
    session.usageToday.date = today;
  }

  // Check limit
  if (session.usageToday.pdfOps >= DAILY_PDF_LIMIT) {
    return res.status(429).json({
      message: `Daily limit reached. Sign up free to get more uses.`,
      requiresAuth: true,
      limitReached: true,
      used: session.usageToday.pdfOps,
      limit: DAILY_PDF_LIMIT
    });
  }

  // Increment and save
  session.usageToday.pdfOps += 1;
  await session.save();

  // Attach remaining count to response header (frontend uses this)
  res.setHeader('X-Guest-Uses-Remaining', DAILY_PDF_LIMIT - session.usageToday.pdfOps);
  next();
};

module.exports = guestRateLimit;
```

---

### 3.4 Apply Middleware to PDF Routes

```js
// server/routes/tools.js (updated)

const guestRateLimit = require('../middleware/guestRateLimit');
const optionalAuth   = require('../middleware/optionalAuth');   // see 3.5 below

// Apply to all PDF tool routes
router.use('/pdf', optionalAuth, guestRateLimit);

router.post('/pdf/merge',         upload.array('files'),  pdfController.merge);
router.post('/pdf/split',         upload.single('file'),  pdfController.split);
router.post('/pdf/compress',      upload.single('file'),  pdfController.compress);
router.post('/pdf/word-to-pdf',   upload.single('file'),  pdfController.wordToPdf);
router.post('/pdf/txt-to-pdf',    upload.single('file'),  pdfController.txtToPdf);
router.post('/pdf/ppt-to-pdf',    upload.single('file'),  pdfController.pptToPdf);
router.post('/pdf/excel-to-pdf',  upload.single('file'),  pdfController.excelToPdf);
router.post('/pdf/jpg-to-pdf',    upload.array('files'),  pdfController.jpgToPdf);
// ... all other free PDF tools

// Paid PDF tools — always require auth
router.post('/pdf/pdf-to-word',   requireAuth, pdfController.pdfToWord);
router.post('/pdf/pdf-to-excel',  requireAuth, pdfController.pdfToExcel);
router.post('/pdf/ocr',           requireAuth, pdfController.ocrPdf);
// ... all other premium PDF tools

// All other tools — always require auth
router.post('/studio',     requireAuth, studioController.convert);
router.post('/animator',   requireAuth, animatorController.queue);
// ...
```

---

### 3.5 Optional Auth Middleware

This middleware tries to verify a JWT but does NOT block the request if none is present. It sets `req.user` if logged in, leaves it `null` if not.

```js
// server/middleware/optionalAuth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next(); // no token = guest, continue

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
  } catch {
    // Invalid/expired token — treat as guest
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
```

---

### 3.6 PDF Controller — Guest vs Logged-in Behaviour

The only difference for guests: output is returned as a direct download, not saved to Cloudinary or the Cloud Library.

```js
// server/controllers/pdfController.js (updated merge as example)

exports.merge = async (req, res) => {
  try {
    const pdfBuffer = await pdfService.merge(req.files.map(f => f.path));

    if (req.user) {
      // Logged-in: upload to Cloudinary, save to library, return URL
      const url = await uploadAndSave({
        userId: req.user._id,
        buffer: pdfBuffer,
        fileName: `merged_${Date.now()}`,
        toolSource: 'pdf',
      });
      return res.json({ success: true, url });
    } else {
      // Guest: return file directly — no cloud save
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
      return res.send(pdfBuffer);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## 4. Frontend Implementation

### 4.1 Guest Session Manager — `useGuestSession.js`

```js
// src/hooks/useGuestSession.js

import { useEffect } from 'react';
import axios from 'axios';

export const useGuestSession = () => {
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem('guestToken')) return; // already have one
      try {
        const { data } = await axios.post('/api/guest/session');
        localStorage.setItem('guestToken', data.token);
      } catch (e) {
        console.warn('Guest session init failed');
      }
    };
    init();
  }, []);
};
```

Call this once in `App.jsx`:

```jsx
// src/App.jsx

import { useGuestSession } from './hooks/useGuestSession';

export default function App() {
  useGuestSession(); // runs once on mount
  // ...
}
```

---

### 4.2 Axios Interceptor — Attach Guest Token

```js
// src/services/api.js

import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Attach guest token on every request if user is not logged in
api.interceptors.request.use((config) => {
  const guestToken = localStorage.getItem('guestToken');
  if (guestToken) {
    config.headers['X-Guest-Token'] = guestToken;
  }
  return config;
});

// Handle 401 / 429 responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;

    if (data?.requiresAuth) {
      // Trigger signup modal
      window.dispatchEvent(new CustomEvent('kolomflow:requireAuth', {
        detail: { reason: data.limitReached ? 'limit' : 'feature' }
      }));
    }

    if (data?.sessionExpired) {
      localStorage.removeItem('guestToken');
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

### 4.3 Route Guard — `GuestRoute.jsx`

Wraps any route that requires login. Guests see a prompt instead of the page.

```jsx
// src/components/GuestRoute.jsx

import { useAuth } from '../context/AuthContext';
import SignupNudge from './SignupNudge';

export default function GuestRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <SignupNudge />;
  return children;
}
```

Use it in `App.jsx`:

```jsx
<Route path="/studio"    element={<GuestRoute><Studio /></GuestRoute>} />
<Route path="/animator"  element={<GuestRoute><Animator /></GuestRoute>} />
<Route path="/wallet"    element={<GuestRoute><Wallet /></GuestRoute>} />
<Route path="/library"   element={<GuestRoute><Library /></GuestRoute>} />
// PDF tools route — NO GuestRoute wrapper (guests can access)
<Route path="/pdf-tools" element={<PDFTools />} />
```

---

### 4.4 Signup Nudge Component — `SignupNudge.jsx`

Shown when a guest tries to access a login-required page or hits the rate limit.

```jsx
// src/components/SignupNudge.jsx

import { useNavigate } from 'react-router-dom';

export default function SignupNudge({ reason = 'feature' }) {
  const navigate = useNavigate();

  const messages = {
    feature: {
      title: 'Create a free account to use this tool',
      sub: 'Sign up in 30 seconds — no credit card needed.',
    },
    limit: {
      title: "You've used today's free quota",
      sub: 'Sign up free to get more daily uses, save files to your library, and earn credits.',
    },
  };

  const { title, sub } = messages[reason] || messages.feature;

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <p style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>{title}</p>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28 }}>{sub}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={() => navigate('/auth/signup')} style={{ fontWeight: 500 }}>
          Sign up free
        </button>
        <button onClick={() => navigate('/auth/login')} style={{ opacity: 0.7 }}>
          Log in
        </button>
      </div>
    </div>
  );
}
```

---

### 4.5 Guest Usage Counter — PDF Tools Page

Show guests how many free uses they have left today:

```jsx
// src/pages/PDFTools.jsx (add to top of page)

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function GuestUsageBanner() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(null);

  // Read from response header after first PDF operation
  useEffect(() => {
    const handler = (e) => setRemaining(e.detail.remaining);
    window.addEventListener('kolomflow:guestUsage', handler);
    return () => window.removeEventListener('kolomflow:guestUsage', handler);
  }, []);

  if (user) return null; // logged-in users don't see this
  if (remaining === null) return null;

  return (
    <div style={{
      background: 'var(--color-background-warning)',
      color: 'var(--color-text-warning)',
      borderRadius: 'var(--border-radius-md)',
      padding: '10px 16px',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }}>
      <span>
        <strong>{remaining}</strong> free use{remaining !== 1 ? 's' : ''} left today
      </span>
      <a href="/auth/signup" style={{ fontWeight: 500, color: 'var(--color-text-warning)' }}>
        Sign up to get more →
      </a>
    </div>
  );
}
```

---

### 4.6 Emit Guest Usage Event from Axios Interceptor

After a PDF call succeeds, emit the remaining count from the response header:

```js
// src/services/api.js — update the response interceptor

api.interceptors.response.use((res) => {
  const remaining = res.headers['x-guest-uses-remaining'];
  if (remaining !== undefined) {
    window.dispatchEvent(new CustomEvent('kolomflow:guestUsage', {
      detail: { remaining: parseInt(remaining) }
    }));
  }
  return res;
}, ...);
```

---

## 5. Guest → Signup Conversion Flow

When a guest hits the daily limit or tries a locked tool:

```
Guest uses 5th PDF op
        │
        ▼
Backend returns 429 + { limitReached: true, requiresAuth: true }
        │
        ▼
Axios interceptor fires 'kolomflow:requireAuth' event
        │
        ▼
App.jsx listens → opens SignupModal (or redirects to /auth/signup)
        │
        ▼
User signs up → JWT issued → guestToken cleared from localStorage
        │
        ▼
User continues with full free account (Cloud Library, ad credits, etc.)
```

### Signup Modal Trigger (Global Listener in App.jsx)

```jsx
// src/App.jsx

import { useState, useEffect } from 'react';
import SignupModal from './components/SignupModal';

export default function App() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [nudgeReason, setNudgeReason] = useState('feature');

  useEffect(() => {
    const handler = (e) => {
      setNudgeReason(e.detail.reason);
      setShowSignupModal(true);
    };
    window.addEventListener('kolomflow:requireAuth', handler);
    return () => window.removeEventListener('kolomflow:requireAuth', handler);
  }, []);

  return (
    <>
      {/* your router / layout */}
      {showSignupModal && (
        <SignupModal
          reason={nudgeReason}
          onClose={() => setShowSignupModal(false)}
        />
      )}
    </>
  );
}
```

---

## 6. Security Considerations

| Risk | Mitigation |
|---|---|
| Guest token abuse (many tokens from same IP) | Rate limit guest session creation: max 3 new tokens per IP per day |
| IP spoofing via X-Forwarded-For | Use `express-rate-limit` with `trustProxy: false` unless behind a known proxy |
| Large file uploads without auth | Cap guest file size at 10 MB in multer config |
| Token scraping / sharing | Token + IP must match on every request |
| Bypassing limit via `localStorage` clear | Limit enforced server-side on the token, not client-side |

### Multer Config for Guests

```js
// server/middleware/upload.js

const upload = multer({
  storage: multer.diskStorage({ destination: '/tmp/kolomflow', filename: ... }),
  limits: {
    fileSize: req => req.user ? 50 * 1024 * 1024 : 10 * 1024 * 1024  // 50 MB auth, 10 MB guest
  }
});
```

> Note: `multer` doesn't support per-request `limits` natively. Use a custom middleware that checks `req.user` before `multer` and sets the limit accordingly, or use a `before` hook to reject oversized requests.

---

## 7. Summary of All Changes

| File | Change |
|---|---|
| `server/models/GuestSession.js` | New model with TTL index |
| `server/routes/guest.js` | New route: `POST /api/guest/session` |
| `server/middleware/guestRateLimit.js` | Daily limit check for guests |
| `server/middleware/optionalAuth.js` | Tries JWT, sets `req.user` or `null` |
| `server/routes/tools.js` | Apply `optionalAuth + guestRateLimit` to free PDF routes |
| `server/controllers/pdfController.js` | Branch: Cloudinary save (auth) vs direct download (guest) |
| `server/index.js` | Mount `router.use('/api/guest', guestRouter)` |
| `client/src/App.jsx` | `useGuestSession()` hook, global `requireAuth` listener |
| `client/src/hooks/useGuestSession.js` | Init / retrieve guest token |
| `client/src/services/api.js` | Axios interceptors: attach token, handle 401/429 |
| `client/src/components/GuestRoute.jsx` | Wrapper for login-required pages |
| `client/src/components/SignupNudge.jsx` | Full-page nudge for locked tools |
| `client/src/components/SignupModal.jsx` | Modal nudge triggered by rate limit |
| `client/src/pages/PDFTools.jsx` | `GuestUsageBanner` showing remaining uses |

---

## 8. PRD Update — Section 16 (Authentication)

Add to the Auth section:

> **Guest Mode:** Unauthenticated users may use all 13 free PDF tools without creating an account, subject to a daily limit of 5 operations per device. Guest sessions are tracked via an anonymous token stored in `localStorage` and expire after 7 days. Guest outputs are served as direct downloads and are not saved to the Cloud Library. All other tools require a free account.

---

*KolomFlow — Guest Access Feature Guide | Phase 10 | May 2026*
