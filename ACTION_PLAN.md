# 🚀 Action Plan - Get Your App Working

## Step 1: Test Locally First (Recommended)

### 1.1 Install Dependencies
```bash
cd /Users/dylanduan/Desktop/SaintThunderBirdTutoring
npm install
```

### 1.2 Create `.env` File
Create a file named `.env` in the root directory with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here_make_it_long_and_random
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
PORT=5000
```

**Important:**
- Get MongoDB URI from MongoDB Atlas (or your MongoDB provider)
- Generate a random JWT_SECRET (any long random string)
- For Gmail: Use App Password, NOT your regular password

### 1.3 Start Server Locally
```bash
npm start
```

### 1.4 Test in Browser
1. Open `http://localhost:5000` in your browser
2. Try to sign up/login
3. Test creating a request
4. Check browser console (F12) for errors

---

## Step 2: Deploy to Render

### 2.1 Push to GitHub (if not already)
```bash
git add .
git commit -m "Fixed all issues - ready for deployment"
git push origin main
```

### 2.2 Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET = your_long_random_secret_key_here
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your_gmail_app_password_16_chars
```

**⚠️ Critical:**
- `EMAIL_PASSWORD` must be a Gmail App Password (16 characters)
- Get it from: Google Account → Security → 2-Step Verification → App Passwords

### 2.3 Deploy
- Render will auto-deploy when you push to GitHub
- Or click "Manual Deploy" in Render dashboard
- Wait for deployment to complete

### 2.4 Check Logs
1. In Render dashboard, go to **Logs** tab
2. Look for:
   - ✅ `MongoDB Connected`
   - ✅ `Email transporter ready`
   - ✅ `Server running on port...`

---

## Step 3: Test the Application

### 3.1 Test Student Flow
1. **Sign up as Student:**
   - Go to signup page
   - Create student account
   - Login

2. **Create Request:**
   - Go to student dashboard
   - Click "Request Tutoring Help"
   - Fill form and submit
   - Check if request appears in "Your Requests"

3. **Check Stats:**
   - Verify stats boxes show correct numbers
   - Check browser console for errors

### 3.2 Test Tutor Flow
1. **Sign up as Tutor:**
   - Create tutor account
   - Apply to be tutor (if needed)
   - Get approved by admin

2. **Accept Request:**
   - Login as tutor
   - Go to tutor dashboard
   - See student requests
   - Click "Accept Request"
   - Check if emails are sent

3. **Verify:**
   - Session appears in tutor dashboard
   - Student receives email with Zoom link
   - Tutor receives email with Zoom link

### 3.3 Test Admin Flow (if you're Dylan)
1. Login as `dylanduancanada@gmail.com`
2. Go to admin panel
3. Approve/deny tutor applications
4. Verify emails are sent

---

## Step 4: Troubleshooting

### If Something Doesn't Work:

#### Check Browser Console (F12)
- Look for red errors
- Copy error messages
- Check Network tab for failed API calls

#### Check Render Logs
- Go to Render dashboard → Logs
- Look for error messages
- Common errors:
  - `MongoDB Error` → Check MONGODB_URI
  - `Email transporter error` → Check EMAIL_PASSWORD
  - `Cannot find module` → Run `npm install`

#### Test API Directly
Open browser console and run:
```javascript
// Test if API is working
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/available-tutors', {
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
    }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## Step 5: Common Issues & Quick Fixes

### Issue: "Cannot GET /"
**Fix:** Server is running, this is normal for root path. Try `/index.html`

### Issue: "401 Unauthorized"
**Fix:** 
- Token expired, re-login
- Check JWT_SECRET is set in Render

### Issue: "Email not sending"
**Fix:**
- Verify EMAIL_PASSWORD is Gmail App Password (16 chars)
- Check Render logs for email errors
- Test email config in Render logs

### Issue: "MongoDB connection failed"
**Fix:**
- Check MONGODB_URI format
- Verify MongoDB allows connections from Render IP
- Check MongoDB credentials

### Issue: "Stats show 0"
**Fix:**
- Create some test data (requests, sessions)
- Check API responses in Network tab
- Verify data exists in database

---

## Step 6: Verify Everything Works

### ✅ Checklist:
- [ ] Server starts without errors
- [ ] Can sign up as student
- [ ] Can sign up as tutor
- [ ] Student can create request
- [ ] Tutor can see requests
- [ ] Tutor can accept request
- [ ] Emails are sent (check inbox)
- [ ] Sessions appear in dashboards
- [ ] Stats update correctly
- [ ] Zoom links are generated

---

## Need Help?

1. **Check DEBUGGING_GUIDE.md** for detailed troubleshooting
2. **Check Render logs** for server-side errors
3. **Check browser console** for client-side errors
4. **Test API endpoints** directly using fetch() in console

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start server locally
npm start

# Check for syntax errors
node -c server.js
node -c routes/tutor.js

# View logs (if using nodemon)
npm run dev
```

---

## Next Steps After Everything Works

1. ✅ Test with real users
2. ✅ Monitor Render logs for errors
3. ✅ Set up error tracking (optional)
4. ✅ Consider adding Zoom API integration for real meetings
5. ✅ Add session scheduling interface
6. ✅ Add session completion tracking
