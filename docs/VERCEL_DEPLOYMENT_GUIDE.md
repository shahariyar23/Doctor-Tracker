# Doctor Tracker — Vercel Deployment Guide

এই অ্যাপ্লিকেশনটি ফুলস্ট্যাক আর্কিটেকচার:
- **Frontend**: Next.js 16 (App Router) located in `web/`
- **Backend API**: Express 5 + TypeScript located in `server/`
- **Database**: MongoDB (Atlas)

---

## ১. Vercel এ ফ্রন্টেন্ড ও ব্যাকএন্ড ডিপ্লয় করার উপায়

Vercel মূলত Next.js ও সার্ভারলেস ফাংশন হোস্ট করে। আপনার অ্যাপ্লিকেশনটি Vercel-এ দুটি উপায়ে লাইভ করা যায়:

### সেরা ও স্ট্যান্ডার্ড পদ্ধতি (Recommended):
1. **Frontend (`web/`) -> Vercel**:
   - Vercel ড্যাশবোর্ডে গিয়ে আপনার GitHub রিপোজিটরি ইমপোর্ট করুন।
   - **Root Directory**: `web` সিলেক্ট করুন।
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: আপনার লাইভ ব্যাকএন্ডের URL (যেমন: `https://api.yourdomain.com/api/v1` বা `https://your-server.vercel.app/api/v1`)
2. **Backend (`server/`) -> Vercel Serverless Function** অথবা **Railway / Render**:
   - আমরা ইতিমধ্যে `server/vercel.json` এবং `server/api/index.ts` তৈরি করে দিয়েছি যা Express অ্যাপকে Vercel সার্ভারলেস ফাংশন হিসেবে রান করাবে।
   - **Environment Variables (Backend)**:
     - `MONGODB_URI`: আপনার MongoDB Atlas ক্লাউড কানেকশন স্ট্রিং (`mongodb+srv://...`)
     - `JWT_SECRET`: একটি শক্তিশালী সিক্রেট কি
     - `CLIENT_URL`: আপনার Vercel ফ্রন্টেন্ড ডোমেইন (যেমন: `https://doctor-tracker.vercel.app`)
     - `NODE_ENV`: `production`

---

## ২. Vercel ডিপ্লয়মেন্ট চেকলিস্ট

| প্রজেক্ট | Root Directory | Build Command | Output Directory | Environment Variables |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `web` | `next build` | `.next` | `NEXT_PUBLIC_API_URL` |
| **Backend** | `server` | `tsc` | `dist` | `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV` |

---

## ৩. Vercel CLI দিয়ে সরাসরি ডিপ্লয় করতে চাইলে:

```bash
# ১. Vercel CLI গ্লোবালি ইন্সটল করুন
npm install -g vercel

# ২. Vercel-এ লগইন করুন
vercel login

# ৩. ফ্রন্টেন্ড ডিপ্লয় (web ফোল্ডারে গিয়ে)
cd web
vercel --prod

# ৪. ব্যাকএন্ড ডিপ্লয় (server ফোল্ডারে গিয়ে)
cd ../server
vercel --prod
```

