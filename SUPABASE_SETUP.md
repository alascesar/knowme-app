# Supabase Backend Setup Guide

This app now uses Supabase for authentication, database, and file storage. Follow these steps to set up your Supabase backend.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `knowme-app` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
5. Wait for the project to be created (takes ~2 minutes)

## 2. Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor in Supabase
5. Click **Run** to execute the migration
6. Verify that all tables were created:
   - `users`
   - `profile_cards`
   - `groups`
   - `memberships`
   - `card_statuses`
   - `invitations`

## 3. Set Up Storage Bucket

### Step 1: Create the Bucket (via Dashboard)

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `profile-assets`
4. Make it **Public** (uncheck "Private bucket")
5. Click **Create bucket**

### Step 2: Set Up Policies (via SQL Script)

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/create_storage_bucket_policies_only.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor in Supabase
5. Click **Run** to execute the script
6. This will create all necessary policies automatically

**Note:** You cannot create storage buckets via SQL directly - they must be created through the dashboard first. The SQL script only sets up the security policies.

## 4. Get Your API Keys

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## 5. Configure Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Gemini API Key (if you're using AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from step 4.

## 6. Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Try signing up a new user
3. Verify that:
   - User is created in Supabase Auth
   - User profile appears in the `users` table
   - Profile card is created in the `profile_cards` table

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has the correct variable names
- Restart your dev server after adding environment variables
- Check that variable names start with `VITE_`

### RLS Policy Errors
- Make sure you ran the migration SQL that includes all RLS policies
- Check that Row Level Security is enabled on all tables

### File Upload Errors
- Verify the `profile-assets` bucket exists and is public
- Check that storage policies are set up correctly
- Ensure the user is authenticated before uploading

### Authentication Issues
- Check that email confirmation is disabled in Supabase Auth settings (for development)
- Go to **Authentication** > **Settings** > **Email Auth** and disable "Confirm email"

## Next Steps

- Set up email templates in Supabase for production
- Configure email confirmation for production use
- Set up backup strategies for your database
- Consider setting up database backups

