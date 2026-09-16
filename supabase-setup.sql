-- =============================================================
-- ACHFRED ELITE CLEANING — SUPABASE SETUP
-- =============================================================
-- RUN THIS SQL IN SUPABASE
-- Dashboard → SQL Editor → New Query → Paste & Run
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLES
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_number INTEGER NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    description    TEXT NOT NULL,
    icon           TEXT NOT NULL DEFAULT 'fa-broom',
    image_url      TEXT NOT NULL,
    display_order  INTEGER NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS before_after (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL DEFAULT '',
    description      TEXT NOT NULL DEFAULT '',
    before_image_url TEXT NOT NULL,
    after_image_url  TEXT NOT NULL,
    display_order    INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 2. INDEXES
-- -------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_services_display_order ON services (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_before_after_display_order ON before_after (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_before_after_active ON before_after (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users (user_id);

-- -------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS before_after_updated_at ON before_after;
CREATE TRIGGER before_after_updated_at
    BEFORE UPDATE ON before_after
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------
-- 4. ADMIN CHECK HELPER (avoids circular RLS dependencies)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- -------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -------------------------------------------------------------

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after ENABLE ROW LEVEL SECURITY;

-- admin_users: admins can read their own row
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
CREATE POLICY "Admins can read admin_users"
    ON admin_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- services: public read active only
DROP POLICY IF EXISTS "Public can read active services" ON services;
CREATE POLICY "Public can read active services"
    ON services FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- services: admins read all
DROP POLICY IF EXISTS "Admins can read all services" ON services;
CREATE POLICY "Admins can read all services"
    ON services FOR SELECT
    TO authenticated
    USING (is_admin());

-- services: admins insert/update
DROP POLICY IF EXISTS "Admins can insert services" ON services;
CREATE POLICY "Admins can insert services"
    ON services FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update services" ON services;
CREATE POLICY "Admins can update services"
    ON services FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- before_after: public read active only
DROP POLICY IF EXISTS "Public can read active transformations" ON before_after;
CREATE POLICY "Public can read active transformations"
    ON before_after FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- before_after: admins read all
DROP POLICY IF EXISTS "Admins can read all transformations" ON before_after;
CREATE POLICY "Admins can read all transformations"
    ON before_after FOR SELECT
    TO authenticated
    USING (is_admin());

-- before_after: admins full CRUD
DROP POLICY IF EXISTS "Admins can insert transformations" ON before_after;
CREATE POLICY "Admins can insert transformations"
    ON before_after FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update transformations" ON before_after;
CREATE POLICY "Admins can update transformations"
    ON before_after FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete transformations" ON before_after;
CREATE POLICY "Admins can delete transformations"
    ON before_after FOR DELETE
    TO authenticated
    USING (is_admin());

-- -------------------------------------------------------------
-- 6. STORAGE BUCKET
-- -------------------------------------------------------------
-- Create the bucket in Supabase Dashboard → Storage → New Bucket
--   Name: achfred-images
--   Public bucket: YES (images must be viewable on the public website)
--
-- Then run the storage policies below.

INSERT INTO storage.buckets (id, name, public)
VALUES ('achfred-images', 'achfred-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for images
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'achfred-images');

-- Admin upload
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'achfred-images'
        AND is_admin()
    );

-- Admin update
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'achfred-images' AND is_admin())
    WITH CHECK (bucket_id = 'achfred-images' AND is_admin());

-- Admin delete
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'achfred-images' AND is_admin());

-- -------------------------------------------------------------
-- 7. INITIAL SERVICE RECORDS
-- -------------------------------------------------------------

INSERT INTO services (service_number, title, description, icon, image_url, display_order, is_active)
VALUES
    (1, 'Residential Cleaning',
     'Professional cleaning for homes, apartments, bedrooms, kitchens, bathrooms and everyday living spaces.',
     'fa-house', 'assets/images/service-residential.webp', 1, true),
    (2, 'Commercial Cleaning',
     'Cleaning solutions for offices, shops, workplaces and commercial environments.',
     'fa-building', 'assets/images/service-commercial.webp', 2, true),
    (3, 'Deep Cleaning',
     'Detailed cleaning for spaces requiring more intensive attention.',
     'fa-broom', 'assets/images/service-deep.webp', 3, true),
    (4, 'Move-In / Move-Out Cleaning',
     'Prepare a property for a new occupant or leave it ready for the next one.',
     'fa-box-open', 'assets/images/service-move.webp', 4, true),
    (5, 'Post-Construction Cleaning',
     'Detailed cleaning to remove construction dust, residue and debris from completed spaces.',
     'fa-hard-hat', 'assets/images/service-construction.webp', 5, true),
    (6, 'Property & Office Maintenance',
     'Routine cleaning support for spaces that need to remain consistently clean and presentable.',
     'fa-clipboard-check', 'assets/images/service-maintenance.webp', 6, true)
ON CONFLICT (service_number) DO NOTHING;

-- Initial before/after records (image paths match existing local assets)
INSERT INTO before_after (title, description, before_image_url, after_image_url, display_order, is_active)
SELECT * FROM (VALUES
    ('Transformation 1', '', 'assets/images/after-1.webp', 'assets/images/before-1.webp', 1, true),
    ('Transformation 2', '', 'assets/images/after-2.webp', 'assets/images/before-2.webp', 2, true),
    ('Transformation 3', '', 'assets/images/after-3.webp', 'assets/images/before-3.webp', 3, true)
) AS v(title, description, before_image_url, after_image_url, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM before_after LIMIT 1);

-- =============================================================
-- REPLACE WITH YOUR ADMIN USER UUID
-- =============================================================
-- Step 1: Create an admin account in Supabase Dashboard:
--         Authentication → Users → Add User → Email + Password
--
-- Step 2: Copy the user's UUID from the Users table.
--
-- Step 3: Uncomment and run the INSERT below, replacing the UUID:
--
-- INSERT INTO admin_users (user_id)
-- VALUES ('YOUR-ADMIN-AUTH-USER-UUID-HERE');
--
-- Example:
-- INSERT INTO admin_users (user_id)
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
-- =============================================================
