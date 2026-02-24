# 🛠️ Setup Guide: Simple Eq Auth & Database (Neon + Better Auth)

เพื่อให้ระบบพร้อมทำงานก่อนเริ่มเขียน Code คุณนนท์ต้องเตรียม "รากฐาน" 3 ส่วนหลักดังนี้ครับ:

---

### Phase 1: Setup Neon Database (The Backbone)
1.  **สมัคร/เข้าสู่ระบบ**: ไปที่ [Neon.tech](https://neon.tech/)
2.  **Create Project**: ตั้งชื่อว่า `SimpleEq-DB`
3.  **Connection String**: เมื่อสร้างเสร็จจะได้ค่า `DATABASE_URL` 
    *   *สำคัญ*: ให้เลือกโหมด "Pooling" (ที่ลงท้ายด้วย `:5432` หรือมี `?pgbouncer=true`) เพื่อใช้กับ Vercel
4.  **Direct URL**: จดค่าตัวเครื่องตรง (Port 5432 ปกติ) สำหรับใช้รัน `prisma migrate` ด้วย

---

### Phase 2: Setup Google Cloud Console (The Identity)
เราจะใช้ Google เป็นประตูทางเข้าเดียว (Google Login Only):
1.  **เข้าสู่ Console**: [Google Cloud Console](https://console.cloud.google.com/)
2.  **Create Project**: ตั้งชื่อว่า `SimpleEq-Auth`
3.  **OAuth Consent Screen**:
    *   User Type: **External**
    *   Scopes: เพิ่ม `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
4.  **Credentials**: สร้าง **OAuth client ID** ประเภท **Web application**
    *   **Authorized JavaScript origins**:
        - `http://localhost:3000` (Server Dev)
        - `chrome-extension://[SimpleEq-ID]` (รหัส Extension ของคุณนนท์)
        - `https://simple-eq-hub.vercel.app` (URL ที่จะใช้ในอนาคต)
    *   **Authorized redirect URIs**:
        - `http://localhost:3000/api/auth/callback/google`
        - `https://simple-eq-hub.vercel.app/api/auth/callback/google`

---

### Phase 3: Prepare Environment Variables (.env.example)

สร้างไฟล์ `.env` สำหรับ Backend Hub (Vercel) และ Extension (Vite) โดยมีค่าดังนี้:

#### สำหรับ Backend Hub (Next.js/Server)
```env
# Database (จาก Neon)
DATABASE_URL="postgres://user:pass@ep-db-pool-123.pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://user:pass@ep-db-123.neon.tech/neondb?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="[รันคำสั่ง 'openssl rand -base64 32' เพื่อสร้างค่านี้]"
BETTER_AUTH_URL="http://localhost:3000" # หรือ URL ของ Vercel

# Google Social Provider
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### สำหรับ Extension Client (Vite/Client)
```env
# URL ของ Backend Hub ที่เราจะคุยด้วย
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000" 
```

---

### Phase 4: Project Structure Preparation
1.  **Backend Hub**: เราจะสร้างโฟลเดอร์ใหม่ `projects/simple-eq-hub` (Next.js)
2.  **Extension Migration**: เราจะย้าย `SimpleEq` เดิมเข้าสู่ **Vite** เพื่อให้รองรับ `import { createAuthClient } from "better-auth/client"`

---
**พร้อมเริ่มจากจุดไหนก่อนดีครับคุณนนท์?** 
- ให้ผมช่วยสร้างโปรเจกต์ Next.js เปล่าๆ สำหรับ Backend รอไว้เลยไหมครับ? 
- หรือจะจัดการเรื่อง Credentials ใน Google Console ก่อนครับ?
