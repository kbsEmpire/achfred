# AchFred Elite Cleaning

Professional cleaning services website with Supabase-powered content management.

**Public site:** `index.html`  
**Admin portal:** `admin.html`

---

## Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project (or open an existing one).
2. Wait for the project to finish provisioning.

### Step 2 — Run the Database Setup

1. Open **Supabase Dashboard → SQL Editor → New Query**.
2. Copy the entire contents of `supabase-setup.sql`.
3. Paste and click **Run**.

This creates:
- `admin_users`, `services`, and `before_after` tables
- Row Level Security policies
- Storage bucket `achfred-images` with access policies
- Initial service and transformation records

### Step 3 — Create the Admin User

1. Go to **Authentication → Users → Add User**.
2. Choose **Email + Password**.
3. Enter the admin email and password.
4. Save the user.

### Step 4 — Copy the Admin User UUID

1. In **Authentication → Users**, click the admin user.
2. Copy the **User UID** (UUID).

### Step 5 — Add the UUID to admin_users

In the SQL Editor, run:

```sql
INSERT INTO admin_users (user_id)
VALUES ('YOUR-ADMIN-AUTH-USER-UUID-HERE');
```

Replace the placeholder with the UUID from Step 4.

### Step 6 — Add Supabase URL

Open `supabase-config.js` and replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
```

with your project URL from **Project Settings → API → Project URL**.

### Step 7 — Add Supabase Publishable/Anon Key

In the same file, replace:

```js
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
```

with your **anon/public** key from **Project Settings → API → Project API keys**.

> **Never** put the `service_role` secret key in frontend code. Only the publishable/anon key belongs in the browser.

### Step 8 — Configure Storage Bucket

The SQL setup creates the `achfred-images` bucket automatically. Verify in **Storage**:

- Bucket name: `achfred-images`
- Public bucket: **Yes** (images must be viewable on the public website)
- Folders used: `services/` and `before-after/`

### Step 9 — Open the Admin Portal

Navigate to:

```
admin.html
```

Log in with the email and password created in Step 3.

### Step 10 — Manage Content

From the admin dashboard you can:

- Edit service titles, descriptions, icons, images, order, and active status
- Add, edit, and delete before/after transformations
- Upload images directly to Supabase Storage

Changes appear on the public website the next time it loads — no code changes required.

---

## Project Structure

```
achfred-elite-cleaning/
├── index.html           Public website
├── style.css            Public styles
├── script.js            Public JavaScript (with Supabase content loading)
├── admin.html           Admin login and dashboard
├── admin.css            Admin styles
├── admin.js             Admin authentication and content management
├── supabase-config.js   Supabase credentials (URL + anon key only)
├── supabase-setup.sql   Database, RLS, storage, and seed data
├── README.md            This file
└── assets/
    └── images/          Local images (used as fallback)
```

---

## Security Notes

- **RLS is enforced** on all content tables. Anonymous visitors can only read active records.
- **Only authenticated admins** listed in `admin_users` can create, update, or delete content.
- **Storage uploads** require admin authentication. Public users can only view images.
- The **service_role key must never** appear in any frontend file.

---

## Fallback Content

If Supabase is unavailable or not yet configured, the public website automatically displays the original hardcoded service cards and transformation slides. Visitors never see database errors.

---

## Booking

The booking form continues to redirect to WhatsApp (`233500940089`). Booking data is **not** stored in Supabase.
