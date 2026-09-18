/**
 * AchFred Elite Cleaning — Supabase Configuration
 *
 * Replace the placeholder values below with your Supabase project credentials.
 * Find these in: Supabase Dashboard → Project Settings → API
 *
 * IMPORTANT: Only use the publishable/anon key here.
 * NEVER put the service_role or secret key in frontend code.
 */

const SUPABASE_URL = 'https://bsfkvyvgtyubskihmgzx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dET_mBCXvlwwWnWIuULVdA_UtCXKZgO';
/**

/** Maximum image upload size in bytes (5 MB) */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types for uploads */
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
];

/** Supabase Storage bucket name */
const STORAGE_BUCKET = 'achfred-images';
