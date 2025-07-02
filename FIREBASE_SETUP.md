# Firebase Setup Guide for CCC Suite

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `ccc-suite` or `ccc-scripture-service`
4. Enable Google Analytics (optional)
5. Choose your Google Analytics account

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Google** provider:
   - Click Google → Enable
   - Add your project's authorized domains
5. Enable **Email/Password** provider:
   - Click Email/Password → Enable
   - Enable "Email/Password" (first option)

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location (us-central1 recommended)

## 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web app** icon (`</>`)
4. App nickname: `CCC Suite`
5. Copy the configuration object

## 5. Set up Environment Variables

Create `.env.local` file in your project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth (from Firebase Auth settings)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Firebase Admin (for NextAuth adapter)
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
```

## 6. Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 7. Set up Service Account (for NextAuth)

1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract `client_email` and `private_key` for your `.env.local`

## 8. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## 9. Firestore Security Rules (Production)

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own presentations
    match /presentations/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Public presentations can be read by anyone
    match /presentations/{document} {
      allow read: if resource.data.isPublic == true;
    }
  }
}
```

## 10. Test the Setup

1. Start your development server: `npm run dev`
2. Try signing in with Google
3. Generate some slides
4. Check Firestore console to see saved presentations

## Troubleshooting

- **Auth errors**: Check your Google OAuth configuration
- **Firestore errors**: Verify your security rules
- **Environment variables**: Make sure all variables are set correctly
- **CORS errors**: Add your domain to Firebase authorized domains