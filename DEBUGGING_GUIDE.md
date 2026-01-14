# Debugging Guide - Saint Thunderbird Tutoring

## 🔍 Common Issues and Fixes

### 1. **"It doesn't work at all" - General Debugging**

#### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Check Network tab for failed API calls

#### Common Console Errors:
- `Cannot read property 'textContent' of null` → Element not found, check DOM loading
- `401 Unauthorized` → Token expired or missing, re-login
- `404 Not Found` → API endpoint wrong or server not running
- `500 Internal Server Error` → Server-side error, check server logs

### 2. **Student Dashboard Not Loading**

**Symptoms:**
- Blank page
- Stats show 0
- No tutors showing

**Fix:**
1. Check if user is logged in: `localStorage.getItem('authToken')`
2. Check API URL: Should be `https://saintthunderbirdtutoring.onrender.com/api`
3. Check browser console for errors
4. Verify user type is 'student'

**Debug Code:**
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('authToken'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

### 3. **Tutor Dashboard Not Loading**

**Symptoms:**
- No requests showing
- Stats not updating
- Accept button doesn't work

**Fix:**
1. Verify tutor has `tutorProfile.subjects` set
2. Check if requests exist in database
3. Verify tutor is approved (`tutorApplication.status === 'approved'`)

**Debug Code:**
```javascript
// Check tutor profile
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/requests', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log);
```

### 4. **Request Creation Not Working**

**Symptoms:**
- Modal doesn't open
- Request not saving
- Error on submit

**Fix:**
1. Check form validation
2. Verify API endpoint: `/api/tutor/create-request`
3. Check request payload in Network tab
4. Verify student has valid token

**Debug Code:**
```javascript
// Test request creation
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/create-request', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({
        subject: 'Mathematics',
        description: 'Test request',
        priority: 'medium'
    })
})
.then(r => r.json())
.then(console.log);
```

### 5. **Accept Request Not Working**

**Symptoms:**
- Button click does nothing
- Error message appears
- No email sent

**Fix:**
1. Check requestId format
2. Verify tutor can accept (is tutor, has subjects)
3. Check server logs for errors
4. Verify email configuration

**Debug Code:**
```javascript
// Test accept request
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/accept-request', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({
        requestId: 'YOUR_REQUEST_ID_HERE'
    })
})
.then(r => r.json())
.then(console.log);
```

### 6. **Email Not Sending**

**Symptoms:**
- No email received
- Server logs show email errors

**Fix:**
1. Check environment variables:
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASSWORD` - Gmail App Password (NOT regular password)
2. Verify Gmail App Password is set up correctly
3. Check server logs for email errors

**Gmail App Password Setup:**
1. Go to Google Account Settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use that password in `EMAIL_PASSWORD`

### 7. **Stats Not Updating**

**Symptoms:**
- Stats show 0
- Numbers don't change

**Fix:**
1. Check API endpoints:
   - Student: `/api/tutor/student-stats`
   - Tutor: `/api/tutor/stats`
2. Verify data exists in database
3. Check response format matches expected structure

**Debug Code:**
```javascript
// Check student stats
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/student-stats', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log);

// Check tutor stats
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/stats', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log);
```

### 8. **Render Deployment Issues**

**Symptoms:**
- Server won't start
- Database connection fails
- Environment variables not working

**Fix:**
1. Check Render logs for errors
2. Verify all environment variables are set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `PORT` (optional, Render sets this)
3. Check MongoDB connection string format
4. Verify server.js starts correctly

**Common Render Errors:**
- `MongoServerError: Authentication failed` → Wrong MongoDB credentials
- `Error: listen EADDRINUSE` → Port already in use (shouldn't happen on Render)
- `Cannot find module` → Missing dependency, run `npm install`

## 🧪 Testing Checklist

### Student Flow:
- [ ] Can log in as student
- [ ] Dashboard loads with stats
- [ ] Can see available tutors
- [ ] Can create tutoring request
- [ ] Request appears in "Your Requests"
- [ ] Can see sessions after tutor accepts
- [ ] Stats update correctly

### Tutor Flow:
- [ ] Can log in as tutor
- [ ] Dashboard loads with stats
- [ ] Can see student requests
- [ ] Can accept request
- [ ] Email received after accepting
- [ ] Session appears in tutor sessions
- [ ] Stats update correctly

### Admin Flow:
- [ ] Can log in as admin (dylanduancanada@gmail.com)
- [ ] Can see tutor applications
- [ ] Can approve/deny tutors
- [ ] Emails sent on approval/denial

## 📞 Getting Help

If issues persist:
1. Check browser console for errors
2. Check Render server logs
3. Verify all environment variables are set
4. Test API endpoints directly using fetch() in console
5. Check database for data existence

## 🔧 Quick Fixes

### Clear Local Storage (Reset Login):
```javascript
localStorage.clear();
location.reload();
```

### Check Current User:
```javascript
console.log(JSON.parse(localStorage.getItem('user')));
```

### Test API Connection:
```javascript
fetch('https://saintthunderbirdtutoring.onrender.com/api/tutor/available-tutors', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```
