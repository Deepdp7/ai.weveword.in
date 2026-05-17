# KolomFlow — Product Requirements Document (PRD)

> **Version:** 1.0.0 | **Date:** May 2026 | **Status:** Draft  
> **Admin Credentials:** dp918121@gmail.com / 98749898

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Objectives](#2-goals--objectives)
3. [Target Audience](#3-target-audience)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Feature Modules](#6-feature-modules)
7. [Credit System](#7-credit-system)
8. [Ads & Rewards System](#8-ads--rewards-system)
9. [Wallet System](#9-wallet-system)
10. [Subscription Plans](#10-subscription-plans)
11. [Pricing Summary](#11-pricing-summary)
12. [Payment — Razorpay Integration](#12-payment--razorpay-integration)
13. [User Profile Section](#13-user-profile-section)
14. [Admin Panel](#14-admin-panel)
15. [Android App — Capacitor](#15-android-app--capacitor)
16. [Authentication & Security](#16-authentication--security)
17. [File Storage Strategy](#17-file-storage-strategy)
18. [Database Schema — MongoDB](#18-database-schema--mongodb)
19. [API Endpoints Overview](#19-api-endpoints-overview)
20. [Non-Functional Requirements](#20-non-functional-requirements)
21. [Future Roadmap](#21-future-roadmap)
22. [Appendix](#22-appendix)

---

## 1. Product Overview

**KolomFlow** is a full-stack all-in-one creative and document productivity platform for students, educators, content creators, and professionals. It combines handwriting tools, document conversion, photo restoration, animated writing videos, digital signature creation, academic project report building, PDF utilities, and presentation making — all in a single platform.

The name **"Kalom"** means **Pen** in Bengali — representing writing, creativity, and knowledge. KolomFlow is available on web (Vite + React) and Android (via Capacitor), with a credit-based economy, ad rewards, subscription plans, and Razorpay payments.

---

## 2. Goals & Objectives

| Goal | Description |
|---|---|
| All-in-One Platform | One app for all document, handwriting, and creative needs |
| Credit Economy | Sustainable monetisation at 1 Credit = ₹1 |
| Creator Earnings | Ad-watch rewards benefit users; platform earns ad revenue |
| Freemium Entry | PDF Tools are free to reduce onboarding friction |
| Cross-Platform | Web + Android (Capacitor) with fully responsive UI |
| Scalable Architecture | Modular backend; easy to add new tools in the future |

---

## 3. Target Audience

| Segment | Primary Use Cases |
|---|---|
| Students (School / College) | Handwritten notes, project builder, PDF tools |
| Teachers & Educators | Scan old notes, writing animator videos, PPT maker |
| Content Creators | Writing animator exports for YouTube, Instagram, TikTok |
| Freelancers & Professionals | Signature generator, PDF tools, PPT maker |
| General Users | Cloud library, document management |

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Vite + React + Tailwind CSS | Web UI, fully responsive |
| **Mobile** | Capacitor | Android app wrapping the web app |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MongoDB + Mongoose | All application data |
| **File Storage** | Cloudinary | Images, PDFs, videos, DOCX |
| **Authentication** | JWT + bcrypt | Secure login and session management |
| **Payments** | Razorpay | Credit packs and subscriptions |
| **Email** | Nodemailer + SMTP | OTP, notifications, payment receipts |
| **PDF Processing** | pdf-lib, pdf-parse, LibreOffice (headless) | All PDF tool operations |
| **Handwriting Render** | Canvas API + Google Fonts | Studio module |
| **OCR** | Tesseract.js / Google Vision API | Scan & Fix, PDF OCR |
| **Video Render** | FFmpeg (server-side) | Writing Animator output |
| **Rich Text Editor** | Tiptap.js | Project Builder editor |
| **PPT Export** | PptxGenJS | PPT Maker .pptx export |
| **Ads (Web)** | Google AdSense | Rewarded ads for web |
| **Ads (Android)** | Google AdMob | Rewarded video ads on Android |
| **CDN** | Cloudflare | Fast global content delivery |
| **Deployment** | Vercel (Frontend) + Railway/Render (Backend) | Hosting |

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│           CLIENT — React (Vite + Tailwind CSS)           │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Tools  │ │ Wallet  │ │ Profile  │ │ Admin Panel  │  │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │  REST API (Axios)
┌──────────────────────▼───────────────────────────────────┐
│           BACKEND — Node.js + Express.js                 │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐             │
│  │ Auth API │  │  Tools API │  │ Admin API│             │
│  └──────────┘  └────────────┘  └──────────┘             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │   Credit Engine | Ad Engine | Billing | Webhooks   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────┬─────────────────┬────────────────┬────────────────┘
       │                 │                │
┌──────▼──────┐  ┌───────▼──────┐  ┌─────▼──────┐
│   MongoDB   │  │  Cloudinary  │  │  Razorpay  │
│ (Database)  │  │(File Storage)│  │ (Payments) │
└─────────────┘  └──────────────┘  └────────────┘

       ┌──────────────────────────┐
       │  Android App (Capacitor) │
       │  Wraps React Web App     │
       │  + AdMob rewarded ads    │
       └──────────────────────────┘
```

---

## 6. Feature Modules

---

### 6.1 Cloud Library

**Description:** A private file vault where all files generated inside KolomFlow are automatically saved. Users cannot upload external files — only KolomFlow-generated outputs appear here.

**Features:**
- Auto-save all tool outputs to the library
- Organised folders by tool: Studio, Scan & Fix, Animator, PDF, PPT, Projects, Signatures
- File operations: Preview, Download, Rename, Delete, Share (signed URL)
- Preview support: PDF viewer, image viewer, inline video player
- Search and filter by name, date, file type, tool
- Storage quota enforced per subscription plan
- File metadata stored: tool source, creation date, file size, file type

**Storage Quotas by Plan:**

| Plan | Storage |
|---|---|
| Free | 200 MB |
| Basic | 2 GB |
| Pro | 10 GB |
| Elite | Unlimited |

**Credit Cost:** Free (quota is plan-based)

---

### 6.2 Studio — Text to Handwriting

**Description:** Convert typed text, uploaded .txt, .docx, or .pdf into a beautifully rendered human handwritten note — downloadable as image or PDF.

**Features:**
- Input methods: Type directly, or upload .txt / .docx / .pdf
- Handwriting styles: 8+ options (Neat Cursive, Rough Student, Casual Scrawl, Elegant Formal, Child Print, etc.)
- Pen colours: Black, Blue, Red, Green, Pencil Grey
- Paper styles: Plain White, Ruled (single/double line), Graph, Aged/Yellow
- Page settings: A4, Letter, Legal, Custom size
- Controls: Font size, line spacing, left/right margins
- Multi-page support: long text auto-paginates
- Output formats: PNG, JPG, PDF (multi-page)
- Auto-save to Cloud Library

**Tech Notes:**
- Backend extracts text from DOCX (mammoth.js) and PDF (pdf-parse)
- Canvas API renders handwriting using Google Fonts: Kalam, Caveat, Indie Flower, Shadows Into Light, Rock Salt, Reenie Beanie
- Server-side rendering with node-canvas for consistent output
- pdf-lib compiles pages into a multi-page PDF

**Credit Cost:** 5 credits per page

---

### 6.3 Scan & Fix

**Description:** Upload photos of old, damaged, or poorly handwritten notes and photos. The platform enhances, repairs, and optionally converts bad handwriting into clean, readable text.

**Sub-Tools:**

| Sub-Tool | Description | Credits |
|---|---|---|
| Photo Restoration | Denoise, sharpen, enhance colours on old or damaged photos | 8 per image |
| Note Cleaner | Remove shadows, improve contrast on scanned or photographed notes | 5 per image |
| Bad Handwriting Fix | Convert messy handwriting into clean handwriting-style output | 10 per image |
| OCR Text Extract | Extract text from handwritten/scanned notes as .txt or .docx | 6 per document |

**Features:**
- Drag & drop upload, or camera capture on Android
- Before/After comparison slider for all enhancement tools
- Zoom in/out on output preview
- Output auto-saved to Cloud Library

**Tech Notes:**
- Image enhancement via Cloudinary AI transformations (e_improve, e_sharpen, e_upscale, e_restore)
- OCR: Tesseract.js (open-source) or Google Cloud Vision API (higher accuracy option)
- DOCX output assembled using docx.js

---

### 6.4 Writing Animator

**Description:** Type or paste text and generate a video of it being hand-written live on screen. Designed for social media content creation.

**Features:**
- Text input: Type, paste, or import from Studio output
- Writing styles: Ballpoint pen, Fountain pen, Marker, Chalk, Pencil
- Backgrounds: Whiteboard, Blackboard, Ruled Notebook, Kraft Paper, Custom colour
- Writing speed: Slow (dramatic) / Medium / Fast
- Optional animated hand holding pen overlay
- Background music: Built-in royalty-free library (10+ tracks)
- Export formats:

| Format | Resolution | Target Platform |
|---|---|---|
| Landscape 16:9 | 1920×1080 | YouTube |
| Portrait 9:16 | 1080×1920 | Instagram Reels / TikTok |
| Square 1:1 | 1080×1080 | Instagram Post |

- Async processing: user notified when video is ready
- Auto-saved to Cloud Library

**Tech Notes:**
- Canvas renders per-character stroke frames
- PNG frame sequence compiled to MP4 (H.264) via FFmpeg on server
- Audio mixed in using FFmpeg `-i audio.mp3`
- Job queue (Bull / BullMQ + Redis) for async video rendering

**Credit Cost:** 20 credits per minute of video (minimum 1 minute)

---

### 6.5 Signature Generator

**Description:** Create a personalised digital signature from a name input or freehand drawing, with multiple styles to choose from.

**Features:**
- Mode 1 — Generate from Name: Type name → auto-generate 10+ signature style previews
- Mode 2 — Draw Your Own: Freehand canvas drawing (mouse + touchscreen)
- Customisation: colour (black, navy blue, dark red), stroke thickness, size, slant
- Background options: Transparent, White, Cream, Custom colour
- Save up to 5 signatures to profile (plan-based limit)
- Download formats: PNG (transparent background), SVG, PDF

**Tech Notes:**
- Signature fonts: Alex Brush, Dancing Script, Great Vibes, Pacifico, Sacramento, Pinyon Script
- Freehand draw mode: HTML5 Canvas with Bezier curve smoothing
- SVG export via canvas-to-svg.js

**Credit Cost:** 3 credits per signature download

---

### 6.6 Project Builder

**Description:** A structured academic and professional project report builder with predefined drag-and-drop sections.

**Available Sections:**

| # | Section |
|---|---|
| 1 | Front Page / Title Page |
| 2 | Certificate Page |
| 3 | Declaration Page |
| 4 | Acknowledgement |
| 5 | Table of Contents (auto-generated) |
| 6 | Introduction |
| 7 | Problem Statement |
| 8 | Objectives |
| 9 | Literature Review |
| 10 | Methodology |
| 11 | Tools & Technologies Used |
| 12 | System Design (with diagram/image placeholder) |
| 13 | Implementation |
| 14 | Results & Screenshots |
| 15 | Conclusion |
| 16 | References / Bibliography |
| 17 | Appendix |

**Features:**
- Drag & drop section reordering
- Rich text editor per section (Tiptap.js: bold, italic, headings, lists, tables, image insert)
- Live A4 page preview panel
- Project templates: B.Tech, MBA, School, Internship, Research Paper
- Image/screenshot upload per section
- Export as PDF (via Puppeteer) or DOCX (via docx.js)
- Multiple projects per user (plan-based limit)
- Auto-save to Cloud Library

**Credit Cost:** 15 credits per export (PDF or DOCX)

---

### 6.7 PDF Tools

**Description:** A comprehensive PDF utility suite. This is the **only completely free module** for all users — no credits required for the basic tool set.

#### Free PDF Tools (0 Credits)

| Tool | Description |
|---|---|
| Merge PDF | Combine multiple PDFs into one file |
| Split PDF | Split by page range or every N pages |
| Compress PDF | Reduce file size (low / medium / high quality) |
| PDF to Images | Export each page as PNG or JPG |
| Images to PDF | Combine multiple images into one PDF |
| Rotate PDF | Rotate pages 90° / 180° / 270° |
| Word to PDF | Convert .docx to PDF |
| Excel to PDF | Convert .xlsx to PDF |
| PPT to PDF | Convert .pptx to PDF |
| Unlock PDF | Remove password protection |
| Reorder Pages | Drag & drop page reordering |

#### Premium PDF Tools (Credits Required)

| Tool | Credits |
|---|---|
| PDF to Word (.docx) | 8 |
| PDF to Excel (.xlsx) | 8 |
| PDF to PPT (.pptx) | 10 |
| PDF OCR (make searchable) | 10 |
| Add E-Signature to PDF | 5 |
| Password Protect PDF | 3 |
| Add Watermark | 5 |
| PDF Form Filler | 8 |
| PDF Annotate & Comment | 6 |

**Tech Notes:**
- pdf-lib: merge, split, rotate, protect, watermark, reorder pages
- LibreOffice headless: Office ↔ PDF conversion (Word, Excel, PPT)
- Tesseract.js: OCR on scanned PDFs
- All server-side processing; temp files deleted after 1 hour

**Reference UX:** ilovepdf.com, smallpdf.com

---

### 6.8 PPT Maker

**Description:** A drag-and-drop presentation builder to create beautiful slide decks and export as .pptx or PDF.

**Features:**
- 20+ built-in themes (Business, Academic, Creative, Dark, Minimal, Colourful)
- Slide types: Title, Content, Image, Two-Column, Quote, Chart, Blank
- Elements: Text boxes, Images, Icons, Shapes, Tables, Charts (bar, pie, line)
- Slide transitions: Fade, Slide, Zoom
- Presenter notes per slide
- Slide panel with thumbnail view (drag to reorder)
- Present mode: fullscreen browser slideshow
- Export: .pptx via PptxGenJS, or PDF via Puppeteer
- 10+ ready-made templates in template library
- Auto-save to Cloud Library

**Credit Cost:** 10 credits per export

---

## 7. Credit System

**Core Rule:** 1 Credit = ₹1

### Credit Task Pricing Table

| Tool / Action | Credits |
|---|---|
| Studio — Text to Handwriting | 5 per page |
| Scan & Fix — Photo Restoration | 8 per image |
| Scan & Fix — Note Cleaner | 5 per image |
| Scan & Fix — Bad Handwriting Fix | 10 per image |
| Scan & Fix — OCR Extract | 6 per document |
| Writing Animator | 20 per minute |
| Signature Generator | 3 per download |
| Project Builder — Export | 15 per export |
| PDF Tools — Premium (range) | 3–10 per task |
| PPT Maker — Export | 10 per export |
| PDF Tools — Basic | FREE |

### Credit Purchase Packs (Razorpay)

| Pack | Credits | Price (₹) | Bonus Credits |
|---|---|---|---|
| Starter | 50 | ₹50 | — |
| Basic | 150 | ₹140 | +10 |
| Popular | 500 | ₹450 | +50 |
| Pro | 1,000 | ₹850 | +150 |
| Elite | 2,500 | ₹2,000 | +500 |

### Credit Rules:
- Credits never expire (unless account is permanently deleted)
- Subscription plans include a monthly credit allocation
- Ad rewards add credits to the wallet instantly
- Credits are non-refundable once consumed by a tool
- Failed or errored tasks automatically refund the credits used

---

## 8. Ads & Rewards System

**Concept:** Users watch short ads (15–30 seconds) to earn free credits. KolomFlow earns ad revenue from Google AdSense (web) and AdMob (Android).

### Ad Reward Rules

| Action | Reward |
|---|---|
| Watch a 15-second ad | +1 Credit |
| Watch a 30-second ad | +2 Credits |
| Daily ad watch limit | 10 ads/day (max 10–20 credits/day) |
| 7-day consecutive streak bonus | +5 bonus credits |

### Implementation:
- **Web:** Google AdSense rewarded ad units embedded on Wallet page
- **Android:** Google AdMob rewarded video ads via `@capacitor-community/admob` plugin
- After ad completes, backend receives a verified server-side callback
- Credits added to wallet only after backend verification
- Anti-abuse: server-side rate limiting; max ads per user per day enforced in DB

### Platform Revenue:
- KolomFlow earns CPM-based revenue from Google AdSense / AdMob
- Ad earnings tracked in Admin Dashboard (daily/monthly revenue charts)

---

## 9. Wallet System

Every user has a Wallet page that shows credit balance, transaction history, ad earning summary, and purchase options.

### Wallet Page Sections:

**1. Credit Balance Card**
- Prominent display of current credit balance
- Equivalent value shown in ₹

**2. Quick Actions**
- Buy Credits → opens Razorpay checkout
- Watch Ad → plays rewarded ad, credits added instantly
- Redeem Coupon Code → text input + apply button

**3. Transaction History Table**

| Column | Description |
|---|---|
| Date & Time | When the transaction occurred |
| Type | Purchase / Ad Reward / Tool Usage / Subscription / Refund / Bonus |
| Description | e.g. "Studio — 3 pages converted" |
| Credits | +/– amount |
| Balance After | Running balance after transaction |

**4. Subscription Status Card**
- Current plan name and badge
- Renewal date
- Monthly credits included and remaining

**5. Referral Section** *(v1.1)*
- Unique referral link per user
- Earn 10 credits for every referred user who uses any paid tool

### MongoDB Wallet Transaction Schema:
```json
{
  "userId": "ObjectId",
  "type": "purchase | ad_reward | tool_usage | subscription | refund | bonus | coupon",
  "description": "Studio — 2 pages",
  "credits": -10,
  "balanceAfter": 240,
  "razorpayOrderId": "order_abc123",
  "createdAt": "ISODate"
}
```

---

## 10. Subscription Plans

| Feature | Free | Basic | Pro | Elite |
|---|---|---|---|---|
| **Price / month** | ₹0 | ₹99 | ₹249 | ₹599 |
| **Monthly Credits** | 0 | 100 | 300 | 800 |
| **Cloud Storage** | 200 MB | 2 GB | 10 GB | Unlimited |
| **PDF Basic Tools** | ✅ Free | ✅ Free | ✅ Free | ✅ Free |
| **PDF Premium Tools** | Credits | Credits | Credits | ✅ Included |
| **Studio** | Credits | Credits | Credits | Credits |
| **Writing Animator** | Credits | Credits | Credits | Credits |
| **Project Builder** | Credits | Credits | Credits | Credits |
| **Signature Generator** | Credits | Credits | Credits | Credits |
| **PPT Maker** | Credits | Credits | Credits | Credits |
| **Ad Watch Daily Limit** | 10/day | 15/day | 20/day | 20/day |
| **Max Saved Signatures** | 2 | 5 | 10 | Unlimited |
| **Max Projects** | 2 | 10 | 30 | Unlimited |
| **Priority Processing** | ❌ | ❌ | ✅ | ✅ |
| **Watermark on Output** | ✅ KolomFlow | ❌ None | ❌ None | ❌ None |
| **Support** | Community | Email | Priority Email | Dedicated |

**Billing:** Monthly auto-renew via Razorpay Subscriptions API.  
**Annual Discount:** 2 months free on any annual plan.

---

## 11. Pricing Summary

| Module | Free Users | All Paid Users |
|---|---|---|
| PDF Tools — Basic | ✅ Free forever | ✅ Free forever |
| PDF Tools — Premium | Credits per task | Credits per task |
| Studio | 5 credits/page | 5 credits/page |
| Scan & Fix | 5–10 credits/image | 5–10 credits/image |
| Writing Animator | 20 credits/min | 20 credits/min |
| Signature Generator | 3 credits | 3 credits |
| Project Builder | 15 credits/export | 15 credits/export |
| PPT Maker | 10 credits/export | 10 credits/export |

---

## 12. Payment — Razorpay Integration

### Payment Flows:

**1. Credit Pack Purchase:**
- User selects a credit pack
- Backend creates a Razorpay Order
- Frontend opens Razorpay checkout modal
- On payment success, backend verifies HMAC signature
- Credits added to user wallet

**2. Subscription:**
- User selects plan
- Backend creates a Razorpay Subscription
- Auto-renews each billing cycle
- Webhook updates subscription status and credits in DB

**3. Webhook Events Handled:**

| Event | Action |
|---|---|
| `payment.captured` | Add credits or activate subscription |
| `subscription.charged` | Renew subscription + add monthly credits |
| `payment.failed` | Notify user, no credits added |
| `refund.processed` | Return credits to wallet |

**Security:**
- Razorpay signature verified with `crypto.createHmac('sha256', secret)`
- Webhook secret stored in environment variables (never in frontend code)
- All payment records stored in MongoDB `payments` collection

---

## 13. User Profile Section

### Profile Page Sections:

**1. Personal Info**
- Avatar (upload image or choose from defaults)
- Full Name, Username, Email (read-only after verification), Phone
- Bio (optional, 160 characters max)
- Edit & Save button

**2. Account Stats**
- Total files created, tools used, credits spent, credits earned via ads
- Member since date
- Current subscription plan badge

**3. My Signatures**
- Grid view of all saved signatures (up to plan limit)
- Preview, Download, or Delete each signature

**4. Security Settings**
- Change Password (current + new + confirm new)
- Two-Factor Authentication toggle (email OTP)
- Active Sessions list with revoke option
- Delete Account (confirmation modal + 30-day recovery grace period)

**5. Notification Preferences**
- Toggle email notifications: tool completion, low credit warning, subscription renewal
- Toggle in-app notification preferences

---

## 14. Admin Panel

**Access:** Only users with `role: "admin"` in MongoDB.  
**Default Admin:** dp918121@gmail.com / 98749898

### Admin Panel Sections:

**1. Dashboard Overview**
- Total users (all-time, active today, new this week)
- Total revenue (today, this month, all-time)
- Credits sold vs credits consumed
- Estimated ad revenue from impressions
- Tool usage breakdown (bar chart)
- Total file storage used across all users

**2. User Management**
- Search and filter by email, name, plan, join date, credit balance
- View individual user: credits, plan, files, transaction history
- Actions: Ban/Unban user, Reset Password, Add/Remove Credits manually, Change Plan
- Export user list as CSV

**3. Subscription Management**
- All active, paused, and expired subscriptions
- Revenue breakdown by plan
- Monthly churn rate chart

**4. Credit Management**
- All credit transactions with filters (type, user, date range)
- Bulk credit allocation (for promotions or compensation)
- Update credit price per tool (stored in `toolPricing` collection, editable from UI)

**5. Tool Usage Analytics**
- Usage count per tool (daily / weekly / monthly)
- Average credits consumed per tool
- Most used and least used tools
- File output count by type

**6. Ad Revenue Dashboard**
- Total ad impressions, estimated revenue
- Daily ad watch counts
- Abuse detection: flag users with suspiciously high ad watch velocity

**7. File Management**
- Total files stored in Cloudinary by type
- Top 10 users by storage consumption
- Delete orphaned or stale files

**8. Coupon / Promo Codes**
- Create coupons: fixed credits, percentage bonus, free plan upgrade
- Set expiry date, total usage limit, per-user usage limit
- Track all redemptions with user details

**9. Announcements & Content**
- Push in-app banner announcements
- Manage homepage featured tool highlight
- Edit subscription plan pricing from admin UI (updates DB)

**10. Admin Action Logs**
- Immutable log of every admin action
- Format: "Admin X gave User Y 50 credits at 14:32 on May 5, 2026"

---

## 15. Android App — Capacitor

**Strategy:** The existing React web app is wrapped using Capacitor to produce a native Android APK. The same codebase serves both web and Android with minimal platform-specific code.

### Setup Commands:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init KolomFlow com.kolomflow.app
npm install @capacitor/android
npx cap add android
npx cap sync
npx cap open android
```

### Capacitor Plugins Used:

| Plugin | Purpose |
|---|---|
| `@capacitor/camera` | Scan & Fix — capture photo from camera |
| `@capacitor/filesystem` | Save downloaded files to device storage |
| `@capacitor/share` | Share outputs via Android share sheet |
| `@capacitor/network` | Detect offline state and show fallback UI |
| `@capacitor/push-notifications` | Notify on tool completion and credit alerts |
| `@capacitor-community/admob` | In-app rewarded video ads (replaces AdSense) |
| `@capacitor/status-bar` | Style status bar to match KolomFlow brand |
| `@capacitor/splash-screen` | Branded KolomFlow splash screen on app launch |

### Android-Specific Notes:
- Downloads saved to `Downloads/KolomFlow/` on device
- Camera and storage permissions requested at runtime (Android 13+ scoped storage)
- AdMob App ID configured in `AndroidManifest.xml`
- Minimum SDK: Android 7.0 (API Level 24)
- Target SDK: Android 14 (API Level 34)
- Release APK signed with a keystore file for Play Store submission

---

## 16. Authentication & Security

### Auth Flow:
1. **Signup:** Name + Email + Password → OTP sent via email → verify OTP → account created
2. **Login:** Email + Password → JWT issued (access token 15 min + refresh token 7 days)
3. **Forgot Password:** Email OTP → validate → reset password
4. **Google OAuth:** *(planned for v1.1)*

### Security Measures:
- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in httpOnly, Secure, SameSite cookies (not localStorage)
- Rate limiting on all auth routes (express-rate-limit)
- Helmet.js for HTTP security headers (CSP, HSTS, X-Frame-Options)
- CORS configured to whitelist only KolomFlow domains
- File uploads validated by MIME type and size (max 50 MB per file)
- Admin routes protected by `requireAdmin` middleware checking `role: "admin"`
- Razorpay webhook signature verified with HMAC-SHA256 before processing
- All user files stored in user-specific private Cloudinary folders (served via signed URLs)

---

## 17. File Storage Strategy

**Provider: Cloudinary**

### Why Cloudinary:
- Built-in AI image transformations (enhance, restore, upscale) — essential for Scan & Fix
- Free tier: 25 GB storage + 25 GB bandwidth per month
- Supports video hosting and streaming for Writing Animator outputs
- Handles PDF, image, video, and document storage in one platform
- Signed private URLs for secure file access
- Simple Node.js SDK (`cloudinary` npm package)

### Folder Structure in Cloudinary:
```
kolomflow/
  users/
    {userId}/
      studio/
      scan/
      animator/
      signatures/
      projects/
      pdf/
      ppt/
```

### Upload Flow:
1. User triggers a tool action on the frontend
2. Backend processes the file (handwriting render, PDF operation, video compile, etc.)
3. Processed output uploaded to Cloudinary via server SDK
4. Cloudinary URL and metadata saved to MongoDB `files` collection
5. File appears in user's Cloud Library instantly

### File Lifecycle:
- Tool processing temp files: deleted from server immediately after Cloudinary upload
- PDF tool temp files: deleted from server 1 hour after processing
- Cloud Library files: retained until user deletes them or storage quota is exceeded

---

## 18. Database Schema — MongoDB

### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique, indexed)",
  "passwordHash": "string",
  "role": "user | admin",
  "avatar": "string (Cloudinary URL)",
  "bio": "string",
  "phone": "string",
  "isVerified": "boolean",
  "plan": "free | basic | pro | elite",
  "planExpiresAt": "ISODate",
  "credits": "number",
  "storageUsed": "number (bytes)",
  "savedSignatures": ["Cloudinary URL"],
  "isBanned": "boolean",
  "createdAt": "ISODate",
  "lastLoginAt": "ISODate"
}
```

### files
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "toolSource": "studio | scan | animator | pdf | ppt | project | signature",
  "fileName": "string",
  "fileUrl": "string (Cloudinary URL)",
  "fileType": "pdf | png | jpg | mp4 | docx | pptx | svg",
  "size": "number (bytes)",
  "isDeleted": "boolean",
  "createdAt": "ISODate"
}
```

### transactions
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "type": "purchase | ad_reward | tool_usage | subscription | refund | bonus | coupon",
  "description": "string",
  "credits": "number (positive = earned, negative = spent)",
  "balanceAfter": "number",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "createdAt": "ISODate"
}
```

### payments
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "credit_pack | subscription",
  "amount": "number (in paise, e.g. 14900 = ₹149)",
  "credits": "number",
  "planId": "string",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySubscriptionId": "string",
  "status": "created | captured | failed",
  "createdAt": "ISODate"
}
```

### projects
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "template": "btech | mba | school | internship | research",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "order": "number",
      "content": "JSON (Tiptap editor format)"
    }
  ],
  "lastExportedAt": "ISODate",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### toolPricing
```json
{
  "_id": "ObjectId",
  "toolKey": "studio_per_page | animator_per_minute | signature_download | ...",
  "credits": "number",
  "updatedAt": "ISODate",
  "updatedBy": "admin email"
}
```

### coupons
```json
{
  "_id": "ObjectId",
  "code": "string (unique, uppercase)",
  "type": "fixed_credits | percentage_bonus | free_plan",
  "value": "number",
  "maxUses": "number",
  "usedCount": "number",
  "perUserLimit": "number",
  "expiresAt": "ISODate",
  "createdBy": "admin email",
  "createdAt": "ISODate"
}
```

### adImpressions
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "adType": "15sec | 30sec",
  "creditsEarned": "number",
  "platform": "web | android",
  "createdAt": "ISODate"
}
```

---

## 19. API Endpoints Overview

### Auth — `/api/auth`
```
POST   /signup                → Register new user
POST   /verify-otp            → Verify email OTP
POST   /login                 → Login, returns JWT cookie
POST   /logout                → Invalidate refresh token
POST   /forgot-password       → Send password reset OTP
POST   /reset-password        → Reset password using OTP
POST   /refresh-token         → Issue new access token
```

### User — `/api/user`
```
GET    /profile               → Get current user profile
PUT    /profile               → Update name, bio, avatar, phone
PUT    /change-password       → Change password
GET    /signatures            → Get all saved signatures
POST   /signatures            → Save a new signature
DELETE /signatures/:id        → Delete a saved signature
DELETE /account               → Request account deletion (30-day grace)
```

### Cloud Library — `/api/files`
```
GET    /                      → List user files (filterable, paginated)
GET    /:id                   → Get single file metadata
DELETE /:id                   → Delete a file
PUT    /:id/rename            → Rename a file
GET    /:id/share             → Generate 24-hour signed share URL
```

### Tools — `/api/tools`
```
POST   /studio                → Convert text/file to handwriting output
POST   /scan/restore          → Photo restoration
POST   /scan/clean            → Note cleaner
POST   /scan/fix-handwriting  → Bad handwriting fix
POST   /scan/ocr              → OCR text extraction
POST   /animator              → Queue writing animation video job
GET    /animator/:jobId       → Poll animation job status
POST   /signature/generate    → Generate signature options from name
POST   /signature/save        → Save drawn signature (base64 input)
POST   /project/export        → Export project as PDF or DOCX
POST   /pdf/:toolName         → Run a PDF tool (merge, split, compress, etc.)
POST   /ppt/export            → Export PPT as .pptx or PDF
```

### Wallet & Credits — `/api/wallet`
```
GET    /                      → Get balance and transaction history
POST   /buy-credits           → Create Razorpay order for a credit pack
POST   /verify-payment        → Verify payment and add credits to wallet
POST   /watch-ad              → Record ad completion and award credits
POST   /redeem-coupon         → Redeem a coupon code
```

### Subscriptions — `/api/subscription`
```
GET    /plans                 → Get all plans and pricing
POST   /subscribe             → Create Razorpay subscription
POST   /cancel                → Cancel active subscription
GET    /status                → Get current subscription status
POST   /webhook               → Razorpay webhook handler (raw body)
```

### Admin — `/api/admin` *(role: admin only)*
```
GET    /dashboard             → Overview stats and charts data
GET    /users                 → List all users (search, filter, paginate)
GET    /users/:id             → Single user full details
PUT    /users/:id             → Update user (credits, plan, ban status)
GET    /transactions          → All credit transactions
GET    /payments              → All payment records
GET    /files                 → File storage overview
GET    /ad-impressions        → Ad watch stats
POST   /credits/bulk          → Bulk grant credits to multiple users
GET    /tool-pricing          → Get current credit price for each tool
PUT    /tool-pricing/:key     → Update a tool's credit price
POST   /coupons               → Create a new coupon code
GET    /coupons               → List all coupons
DELETE /coupons/:id           → Delete a coupon
POST   /announcements         → Push in-app banner announcement
GET    /admin-logs            → View admin action log
```

---

## 20. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page Load Time | Under 2 seconds (web), under 3 seconds (Android) |
| API Response Time | Under 500 ms for all standard routes |
| PDF Processing Time | Under 10 seconds for basic tools |
| Animation Render Time | Under 60 seconds per minute of video (async) |
| Uptime | 99.5% monthly SLA |
| Concurrent Users | 500+ without performance degradation |
| Mobile Responsiveness | 320 px to 2560 px viewport support |
| File Upload Size Limit | 50 MB per file |
| Storage Redundancy | Cloudinary handles geo-replicated storage |
| Data Backup | MongoDB Atlas daily automated backups |
| Data Deletion | User data deleted within 30 days of account deletion request |
| Accessibility | WCAG 2.1 Level AA for all core pages |

---

## 21. Future Roadmap

| Version | Feature |
|---|---|
| v1.1 | Google OAuth one-click login |
| v1.1 | Referral system — 10 credits per successful referral |
| v1.2 | iOS app via Capacitor |
| v1.2 | Full dark mode across all pages |
| v1.3 | AI learns handwriting style from user's own photo sample |
| v1.3 | Collaborative Project Builder — share and co-edit with teammates |
| v2.0 | KolomFlow REST API for third-party developers |
| v2.0 | Resume and CV Builder tool |
| v2.1 | AI writing assistant integrated into Studio |
| v2.2 | WhatsApp / Telegram bot for PDF tools |
| v3.0 | KolomFlow Marketplace — sell custom handwriting styles and PPT themes |

---

## 22. Appendix

### Appendix A — Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://kolomflow.app

# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin seed credentials
ADMIN_EMAIL=dp918121@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt hash of 98749898>

# Optional — Google Vision API for OCR
GOOGLE_VISION_API_KEY=...

# FFmpeg binary path on server
FFMPEG_PATH=/usr/bin/ffmpeg

# Redis (for BullMQ job queue)
REDIS_URL=redis://localhost:6379
```

### Appendix B — Project Folder Structure

```
kolomflow/
├── client/                         # Vite + React + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Logos, icons, fonts
│   │   ├── components/             # Shared reusable UI components
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Studio.jsx
│   │   │   ├── ScanFix.jsx
│   │   │   ├── Animator.jsx
│   │   │   ├── SignatureGenerator.jsx
│   │   │   ├── ProjectBuilder.jsx
│   │   │   ├── PDFTools.jsx
│   │   │   ├── PPTMaker.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── Credits.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── Coupons.jsx
│   │   │   └── Auth/
│   │   │       ├── Login.jsx
│   │   │       ├── Signup.jsx
│   │   │       └── ForgotPassword.jsx
│   │   ├── context/                # AuthContext, CreditContext
│   │   ├── hooks/                  # useCredits, useAuth, useFiles
│   │   ├── services/               # Axios API call wrappers
│   │   ├── utils/                  # Helpers, formatters
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                         # Node.js + Express.js
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   ├── cloudinary.js           # Cloudinary setup
│   │   └── razorpay.js             # Razorpay instance
│   ├── controllers/                # Route handler logic
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── adminMiddleware.js      # Role check
│   │   └── rateLimiter.js
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # Express routers
│   ├── services/
│   │   ├── ffmpegService.js        # Writing Animator rendering
│   │   ├── ocrService.js           # Tesseract / Google Vision
│   │   ├── pdfService.js           # pdf-lib operations
│   │   ├── handwritingService.js   # Canvas handwriting render
│   │   └── emailService.js         # Nodemailer OTP/notification
│   ├── utils/
│   ├── jobs/                       # BullMQ job queues (video render)
│   └── index.js                    # App entry point
│
├── android/                        # Capacitor Android project
│   └── app/
│
├── capacitor.config.ts
├── package.json
└── README.md
```

---

*KolomFlow PRD v1.0.0 — Confidential Internal Document — May 2026*
