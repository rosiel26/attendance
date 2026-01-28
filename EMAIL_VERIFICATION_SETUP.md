# Email Verification Setup Guide

## Overview
The application now supports email verification. When users sign up, they should receive a verification email to confirm their account.

## Changes Made
1. ✅ Updated `authStore.js` signup function to include email redirect URL
2. ✅ User data is automatically saved to Supabase `users` table during signup
3. ✅ Email confirmation is configured and ready

## To Enable Email Verification in Supabase

### Step 1: Configure Email Provider
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email**
4. Enable **Confirm email**:
   - Turn on the toggle for "Confirm email"
   - This will require users to verify their email before they can log in

### Step 2: Setup Email Template (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation email template if needed
3. The default template includes a link that redirects to: `{REDIRECT_URL}`
4. Our app is configured to redirect to: `http://localhost:5173/login-portal` (for development)

### Step 3: For Production - Set Redirect URL
1. Go to **Authentication** → **URL Configuration**
2. Add your production domain under **Redirect URLs**:
   - Example: `https://yourdomain.com/login-portal`
   - Also add: `https://yourdomain.com/`

### Step 4: Verify Email Settings
1. Go to **Authentication** → **Policies**
2. Check that email confirmations are enabled
3. Optional: Set password confirmation requirement if needed

## Email Verification Flow

### For Users:
1. User fills out registration form (Role, Name, Email, Password)
2. Clicks "Create Account"
3. **Receives verification email** at their email address
4. Clicks link in email to confirm account
5. Redirected to login page
6. Can now log in with their credentials

### For Development/Testing:
If you're testing without real emails:
1. **Check Supabase Console**:
   - Go to **Authentication** → **Users**
   - Look for newly registered users
   - Their `email_confirmed_at` field will be NULL until they verify
   - You can manually mark as confirmed (not recommended for production)

2. **Use Test Email Service**:
   - Use services like Mailtrap, Ethereal, or similar
   - Configure in Supabase → Authentication → Email Templates

## Troubleshooting

### Issue: Not receiving verification emails
**Solution**:
- Check Supabase dashboard for error logs
- Verify email provider is configured
- Check spam/junk folder
- For SMTP, verify credentials are correct

### Issue: Verification link not working
**Solution**:
- Ensure redirect URL is correctly configured in Supabase
- Check that domain in URL matches your deployment domain
- For localhost, use: `http://localhost:5173`

### Issue: User not being created in database
**Solution**:
- Check that Supabase has proper RLS policies on `users` table
- Verify that user can write to `users` table after authentication
- Check Supabase logs for any database errors

## Database Fields Saved

When a user registers, the following data is saved to the `users` table:

```
- id (from auth)
- email (from auth)
- full_name
- organization_id (null by default)
- manager_id (null by default, for employees)
- department_id (null by default, for employees)
- role (admin, manager, or employee)
```

## Next Steps

1. **Configure Supabase Email** following the steps above
2. **Test the flow** by registering a test account
3. **Check for verification email** in your inbox
4. **Click the verification link** to confirm the account
5. **Log in** with the confirmed account

## Support

If verification emails are not being received:
1. Check Supabase Authentication logs
2. Verify SMTP/email provider configuration
3. Review URL configuration for correct redirect URLs
4. Contact Supabase support if needed
