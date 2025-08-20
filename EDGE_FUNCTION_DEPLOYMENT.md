# Edge Function Deployment Guide

## Prerequisites

1. **Supabase CLI installed:**
```bash
npm install -g supabase
```

2. **Link your project:**
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

## Deployment Steps

### 1. Deploy the Edge Function
```bash
# Navigate to your project root
cd /Users/the-crypt/dev/music-viz

# Deploy the delete-user function
supabase functions deploy delete-user
```

### 2. Apply Database Migrations
```bash
# Apply the user preferences migration
supabase db push

# Or apply specific migrations:
supabase migration up --local=false
```

### 3. Verify Deployment
After deployment, you should see:
- Function deployed at: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/delete-user`
- New tables: `user_preferences` 
- Updated RLS policies

### 4. Test the Function (Optional)
```bash
# Test locally first (if you have Docker)
supabase functions serve delete-user

# Test with curl:
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "user_password"}'
```

## What the Edge Function Does

### **Complete Account Deletion Process:**

1. **Verifies Password** - Ensures user authorization
2. **Deletes Private Data:**
   - User preferences
   - Private visualizations
   - User comments
   - User likes
   - Follow relationships

3. **Anonymizes Public Data:**
   - Profile → "Deleted User"
   - Public visualizations → "Visualization by Deleted User"
   - Makes public visualizations private

4. **Removes Auth User** - User cannot login anymore
5. **Signs Out User** - Ends current session

### **Result:**
- ✅ User cannot login again
- ✅ Personal data completely removed
- ✅ Public contributions anonymized but preserved
- ✅ Database integrity maintained

## Troubleshooting

### Common Issues:

1. **Function not found:**
   - Check deployment: `supabase functions list`
   - Redeploy: `supabase functions deploy delete-user`

2. **Permission errors:**
   - Ensure you're linked to the correct project
   - Check your service role key in Supabase dashboard

3. **CORS errors:**
   - Edge function includes CORS headers
   - Check browser network tab for actual error

4. **Database errors:**
   - Apply migrations: `supabase db push`
   - Check RLS policies in Supabase dashboard

## Environment Variables

The Edge Function uses these automatically:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key

These are automatically available in Edge Functions.

## Security Notes

- Function verifies user password before deletion
- Uses admin client to bypass RLS for cleanup
- Preserves referential integrity
- GDPR compliant (actual data deletion)

## After Deployment

1. Test account deletion in your app's settings
2. Verify deleted users cannot login
3. Check that public visualizations are anonymized
4. Confirm personal data is removed

The frontend is already updated to use this Edge Function!