# Supabase Setup Instructions

## Initial Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Save your project URL and anon key

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Run Database Migrations**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and run the migration from `supabase/migrations/001_initial_schema.sql`
   - This creates all necessary tables, indexes, and RLS policies

## Authentication Setup

1. **Enable Email Authentication**
   - In Supabase dashboard, go to Authentication > Providers
   - Ensure Email provider is enabled
   - Configure email templates if desired

2. **Configure Auth Settings**
   - Go to Authentication > Settings
   - Set your site URL (e.g., http://localhost:5173 for development)
   - Configure redirect URLs as needed

## Testing the Setup

1. **Start the Development Server**
   ```bash
   pnpm run dev
   ```

2. **Test Authentication**
   - Click "Sign Up" in the sidebar
   - Create a test account
   - Check your email for confirmation (required for production)
   - Sign in with your credentials

3. **Test Visualization Saving**
   - Create a visualization with your preferred settings
   - Click "Save draft" 
   - The visualization will be saved to your account
   - Check Supabase dashboard > Table Editor > visualizations to verify

## Production Considerations

1. **Row Level Security**
   - All tables have RLS enabled by default
   - Users can only access their own data
   - Public visualizations are viewable by everyone

2. **Email Confirmation**
   - In production, enable email confirmation in Auth settings
   - Configure SMTP settings for custom email domains

3. **Storage Setup** (Future)
   - For audio file uploads, configure Supabase Storage
   - Create buckets for audio files and thumbnails
   - Set appropriate CORS policies

## Troubleshooting

- **"Missing environment variable" error**: Ensure .env file exists and contains valid credentials
- **Authentication errors**: Check that email provider is enabled in Supabase
- **Save errors**: Verify user is logged in and database migrations have run
- **CORS issues**: Add your frontend URL to allowed origins in Supabase settings