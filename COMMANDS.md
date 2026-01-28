# 🚀 Quick Start Commands

## ⚡ Get Running in 5 Minutes

### Copy & Paste These Commands

```bash
# 1. Navigate to project (if not already there)
cd c:\Users\RLB\Music\attendance

# 2. Install dependencies (2 min)
npm install

# 3. Start development server (instant)
npm run dev
```

**That's it!** 🎉

Open your browser to: **http://localhost:5173**

---

## 📋 Before You Run

### 1. Get Supabase Credentials

**Visit:** https://app.supabase.com

**Steps:**
1. Login to your account
2. Click on project `gecidqdnnezymamgkcjv`
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://gecidqdnnezymamgkcjv.supabase.co`)
   - **Anon Key** (long string of characters)

### 2. Update .env.local

Edit the file: `c:\Users\RLB\Music\attendance\.env.local`

```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

**Replace:** `paste_your_anon_key_here` with your actual key

### 3. Setup Database (First Time Only)

Go to: https://app.supabase.com → SQL Editor

**Copy-paste the entire SQL from:** [DEPLOYMENT.md](./DEPLOYMENT.md#a-create-tables)

Run it in the SQL editor. Done! ✅

---

## 🎯 After Running npm run dev

You should see:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Test the App

1. **Go to:** http://localhost:5173
2. **Click:** "Register here"
3. **Fill in:**
   - Full Name: Your Name
   - Email: test@example.com
   - Password: Password123
   - Confirm Password: Password123
4. **Click:** "Create Account"
5. **Login** with your credentials
6. **Click:** "CHECK IN" button
7. **You're in!** ✅

---

## 📁 Important Files to Know

```
c:\Users\RLB\Music\attendance\

.env.local                 ← Update this with Supabase keys
package.json              ← Don't modify (unless adding packages)
src/App.jsx               ← Main app entry
src/main.jsx              ← React root
src/components/           ← UI components
src/services/             ← API calls
src/stores/               ← State management
```

---

## 🔧 Useful Development Commands

### Development
```bash
npm run dev        # Start dev server (hot reload)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code style (when configured)
```

### Stop the Server
```bash
# In the terminal where npm run dev is running:
Ctrl + C
```

### Install New Package
```bash
npm install package-name
# Then restart: npm run dev
```

### Clear Cache
```bash
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'react'"
**Fix:**
```bash
npm install
npm run dev
```

### Issue: ".env.local not found"
**Fix:**
- Create `.env.local` in project root
- Add Supabase credentials

### Issue: "Supabase anon key is not set"
**Fix:**
- Add key to `.env.local`
- Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Port 5173 already in use"
**Fix:**
```bash
# Kill the process using port 5173
# Or run on different port:
npm run dev -- --port 3000
```

### Issue: "Cannot connect to Supabase"
**Fix:**
- Verify .env.local has correct credentials
- Check internet connection
- Try signing up again

### Issue: "Check-in button doesn't work"
**Fix:**
- Make sure you're logged in
- Check browser console (F12 → Console tab)
- Look for error messages

---

## 📚 Learn More

### Quick Navigation
- **Getting Started:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Full Setup:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Product Info:** [PRD.md](./PRD.md)
- **Everything:** [README.md](./README.md)

### Video Tutorial (If Needed)
- React Basics: https://react.dev/learn
- Vite Tutorial: https://vitejs.dev/
- Supabase Setup: https://supabase.com/docs

---

## ✅ Verification Steps

After running, verify:

1. ✅ Server started (see green checkmark)
2. ✅ Port 5173 is open
3. ✅ Page loads without errors
4. ✅ Can register new account
5. ✅ Can login
6. ✅ Can check in/out
7. ✅ Check-in button works
8. ✅ Calendar shows data

If all pass → **You're good to go!** 🎉

---

## 🚀 Next Steps

### Option 1: Explore the Features (15 min)
1. Check-in/out several times
2. View the calendar
3. Request a leave
4. See history

### Option 2: Review the Code (30 min)
1. Open `src/components/Dashboard/EmployeeDashboard.jsx`
2. Look at `src/services/supabaseService.js`
3. Check `src/stores/authStore.js`
4. Understand the structure

### Option 3: Deploy (1 hour)
Follow: [DEPLOYMENT.md](./DEPLOYMENT.md#production-deployment)

### Option 4: Customize (2+ hours)
1. Change colors in `tailwind.config.js`
2. Edit component styles
3. Add new features
4. Update database

---

## 🎁 Pro Tips

### Tip 1: Use Browser DevTools
Press `F12` to open developer tools
- **Console:** See errors and logs
- **Network:** See API calls
- **Application:** See stored data

### Tip 2: Check Supabase Dashboard
- See real-time attendance data
- Monitor database changes
- Check logs for errors

### Tip 3: Test Multiple Users
1. Register user 1
2. Open incognito window
3. Register user 2
4. Compare their records

### Tip 4: Mobile Testing
Press `F12` → Click device toggle (top left)
Test on different screen sizes

---

## 💬 Getting Help

### If Something Breaks:

1. **Check the error message**
   - Read it carefully
   - Copy the error
   - Search online

2. **Check documentation**
   - [README.md](./README.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

3. **Check browser console**
   - Press F12
   - Go to Console tab
   - Look for red error messages

4. **Check Supabase logs**
   - Go to Supabase dashboard
   - Check Logs section
   - Look for recent errors

5. **Reset everything**
   ```bash
   npm install
   npm run dev
   ```

---

## 📞 Quick Support Links

| Issue | Resource |
|-------|----------|
| Setup | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Code | [README.md](./README.md) |
| Tips | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Features | [PRD.md](./PRD.md) |
| Business | [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) |
| Navigation | [INDEX.md](./INDEX.md) |

---

## 🎯 Success Criteria

You're successful when:
- ✅ App runs without errors
- ✅ Can register account
- ✅ Can check in/out
- ✅ Can view calendar
- ✅ Can request leave
- ✅ Data persists in database

---

## ⏱️ Timeline

| Action | Time |
|--------|------|
| npm install | 2-3 min |
| npm run dev | < 1 min |
| First test | 5 min |
| Full exploration | 30 min |
| Code review | 1 hour |
| Deployment | 30 min |

**Total time to production:** ~2 hours

---

## 🏁 Final Checklist

Before you start:
- [ ] Downloaded/have access to project files
- [ ] Have Node.js installed (`node --version`)
- [ ] Have npm installed (`npm --version`)
- [ ] Have Supabase project access
- [ ] Have .env.local configured
- [ ] Have 30 minutes free time

Ready to go:
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run dev` successfully
- [ ] Page loads in browser
- [ ] Can see login screen

Success:
- [ ] Registered account
- [ ] Can check in
- [ ] Can check out
- [ ] Can see calendar
- [ ] Can request leave

---

**🚀 Ready? Run this now:**

```bash
cd c:\Users\RLB\Music\attendance
npm install
npm run dev
```

**Open:** http://localhost:5173

**Enjoy!** 🎉

---

**Last Updated:** January 21, 2026  
**Version:** 1.0  
**Status:** ✅ Ready to Launch
