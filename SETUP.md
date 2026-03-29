# PrinceSpins - Secure Backend Setup

## Files:
- `public/index.html` - Frontend (NO keys stored here)
- `api/validate-key.js` - Key validation (server-side)
- `api/open-case.js` - Case opening + result rolling (server-side) 
- `api/activity.js` - Activity feed
- `api/admin.js` - Admin panel (password protected)
- `api/register-user.js` - User registration
- `api/_firebase.js` - Firebase admin init
- `api/_keys.json` - All 3000 keys (server-side only, never sent to browser)
- `package.json` - Dependencies
- `vercel.json` - Routing config

## Deploy to Vercel:

1. Push ALL these files to your GitHub repo (replace everything)
2. In Vercel dashboard → your project → Settings → Environment Variables
3. Add these 3 variables:

   FIREBASE_PROJECT_ID = princespins-11a50
   FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@princespins-11a50.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY = (paste the entire private key including -----BEGIN/END-----)

4. Redeploy

## Lock Firebase Rules:
Go to Firebase Console → Firestore → Rules and set:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

This blocks ALL client-side access. Only your server can read/write.
