# Delete User Edge Function Setup

This Edge Function allows automatic deletion of users from both the database and Supabase Authentication.

## Setup Instructions

### 1. Deploy the Edge Function

Run this command in your terminal:

```bash
cd d:\attendance
supabase functions deploy delete-user
```

If you don't have the Supabase CLI installed, install it first:
```bash
npm install -g supabase
```

### 2. Verify in Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Edge Functions** in the left sidebar
4. You should see `delete-user` listed
5. Click on it to view logs

### 3. How It Works

When an admin deletes a user from the dashboard:

1. ✅ The user record is deleted from the `users` table
2. ✅ The auth account is automatically deleted from Supabase Authentication
3. ✅ All associated records are cleaned up

### 4. Testing

Try deleting a user from the Admin Dashboard. Both the database record and auth account will be removed automatically.

## Troubleshooting

**If deletion fails:**
- Make sure the Edge Function is deployed
- Check the Supabase Dashboard → Edge Functions → delete-user for error logs
- Verify your Supabase URL and Service Role Key are correct

**If you see "Edge Function not found":**
- Run `supabase functions deploy delete-user` again
- Wait a few seconds for the function to be ready
