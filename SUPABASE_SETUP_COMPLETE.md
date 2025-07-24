# Complete Supabase Setup Guide

## Step 1: Access Your Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project (koeoqfcxstsqmxphqxmh)
3. Navigate to the **SQL Editor** in the left sidebar

## Step 2: Run Database Migrations

### Option A: Using SQL Editor (Recommended)

1. In the SQL Editor, click "New query"
2. Copy the ENTIRE contents of `/supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" (or press Cmd/Ctrl + Enter)

**Important**: You may see an error about `ALTER DATABASE` - this is normal and can be ignored. The rest of the migration will run successfully.

### Option B: Run Modified Migration

If you get errors, use this modified version that removes the problematic line:

```sql
-- Enable Row Level Security
-- (Remove the ALTER DATABASE line as it requires superuser privileges)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE visualization_category AS ENUM (
  'ambient', 'electronic', 'hip_hop', 'rock', 'pop', 'classical', 'jazz', 'other'
);

-- Continue with the rest of the migration from line 12 onwards...
```

## Step 3: Enable Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Ensure **Email** provider is enabled
3. Configure the following settings:
   - Enable email confirmations: OFF (for testing)
   - Minimum password length: 8

## Step 4: Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Set Site URL: `http://localhost:5173` (or your dev URL)
3. Add Redirect URLs:
   - `http://localhost:5173/*`
   - `http://localhost:5174/*` (if using port 5174)

## Step 5: Verify Table Creation

1. Go to **Table Editor** in the sidebar
2. You should see these tables:
   - profiles
   - visualizations
   - likes
   - saves
   - comments
   - follows
   - categories

## Step 6: Test Authentication

1. Go to **Authentication** → **Users**
2. Click "Invite user" to create a test account
3. Use this account to test sign in

## Troubleshooting

### "Permission denied" errors
- Make sure Row Level Security (RLS) is enabled on all tables
- Check that the policies were created correctly

### "Relation does not exist" errors
- The migration hasn't run yet
- Run the migration script in SQL Editor

### Authentication not working
- Check that Email provider is enabled
- Verify your anon key in .env matches Supabase dashboard

### Save visualization failing
- Ensure user is authenticated first
- Check browser console for specific errors
- Verify tables exist in Table Editor

## Quick Test Script

Run this in SQL Editor to verify setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check auth settings
SELECT * FROM auth.users LIMIT 1;
```

## Next Steps

After setup is complete:
1. Restart your dev server: `pnpm run dev`
2. Test sign up at http://localhost:5173
3. Try saving a visualization
4. Check the test page at http://localhost:5173/test-auth