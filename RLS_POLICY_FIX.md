# RLS Policy Fix - Infinite Recursion Error

## Problem
You're getting: `infinite recursion detected in policy for relation "users"`

This occurs because the RLS (Row Level Security) policies on the `users` table are incorrectly configured and creating infinite loops.

## Solution

### Option 1: Disable RLS (Quick Fix - Development Only)
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → `users` table
3. Click the **RLS icon** (shield icon in the top right)
4. Click **Disable RLS** on this table

⚠️ **Important**: This disables security. Only use for development/testing!

### Option 2: Fix RLS Policies (Recommended)

#### Step 1: Remove Bad Policies
1. Go to **Authentication** → **Policies**
2. Look for policies on the `users` table
3. Delete any policies that seem problematic or recursive

#### Step 2: Set Correct Policies
1. Go to Table Editor → `users` table
2. Click the **RLS icon**
3. Click **Create Policy** or **Enable RLS**
4. Create these policies:

**Policy 1: Users can view their own profile**
```sql
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

**Policy 2: Users can update their own profile**
```sql
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Policy 3: New users can insert their profile (for signup)**
```sql
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);
```

**Policy 4: Service role can always access (if using service role key)**
```sql
-- If you're using anon key, skip this
-- This only applies if you switch to service role key
CREATE POLICY "Service role can access all"
ON public.users
USING (auth.role() = 'service_role');
```

### Option 3: Use Service Role Key (Advanced)

If you want more control without RLS restrictions:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy your **Service Role Secret Key** (keep it private!)
3. Update [src/config/supabase.js](src/config/supabase.js):

```javascript
// Add a service role client for admin operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});
```

⚠️ **Important**: Never expose service role key in frontend code! Only use in backend/server.

## What Changed in the Code

The signup flow has been simplified:
- ✅ User is created in Supabase Auth (with role, organization, manager, department as metadata)
- ✅ Email verification is sent
- ✅ No RLS policy issues on signup
- ✅ Profile syncs on first login

## Testing the Fix

1. **Try registering a new account**:
   - Go to registration page
   - Select role (Admin/Manager/Employee)
   - Enter email and password
   - Click "Create Account"

2. **Check if it succeeds**:
   - Should see success message
   - User should receive verification email
   - Check Supabase Dashboard → Authentication → Users to verify user was created

3. **If still failing**:
   - Go to **Authentication** → **Logs** in Supabase Dashboard
   - Look for error details
   - Check RLS policies again

## Best Practices

1. **For Development**:
   - Disable RLS or use permissive policies
   - Use anon key (current setup)

2. **For Production**:
   - Keep RLS enabled
   - Use service role key for server operations only
   - Use restrictive policies for client operations
   - Never expose service role key in frontend

3. **Policy Guidelines**:
   - Users can only view/update their own data
   - Admins need special policies to manage others
   - Keep policies simple to avoid recursion

## Support

If the issue persists:
1. Check Supabase Dashboard → Authentication → Logs for detailed errors
2. Review all RLS policies on the `users` table
3. Try Option 1 (disable RLS) first to test if auth works
4. Then implement proper policies using Option 2
