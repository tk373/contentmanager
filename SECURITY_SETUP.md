# 🔐 Security Setup Guide

## 🚨 CRITICAL SECURITY CONFIGURATION

Your X API credentials are now **encrypted** before being stored in Firestore, but you need to set up the encryption keys properly.

## 📋 Required Environment Variables

### Frontend (.env.local)
Create a `.env.local` file in your project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Encryption Key (generate a strong random key)
NEXT_PUBLIC_ENCRYPTION_KEY=your_very_strong_encryption_key_here
```

### Firebase Functions Environment
Set the encryption key in Firebase Functions:

```bash
firebase functions:config:set encryption.key="your_very_strong_encryption_key_here"
```

**⚠️ IMPORTANT:** Use the **SAME** encryption key for both frontend and Firebase Functions!

## 🔑 Generating a Strong Encryption Key

Use one of these methods to generate a secure encryption key:

### Method 1: Node.js
```javascript
console.log(require('crypto').randomBytes(32).toString('hex'));
```

### Method 2: OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: Online Generator
Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
- Select "256-bit"
- Use the generated key

## 🚀 Deployment Steps

### 1. Update Firestore Rules
Copy the rules from `firestore-security-rules.txt` to your Firebase Console.

### 2. Deploy Firebase Functions
```bash
# Set the encryption key
firebase functions:config:set encryption.key="your_encryption_key"

# Deploy functions
firebase deploy --only functions
```

### 3. Test the Setup
1. Add your X API credentials in the Settings page
2. Click "Test Connection" to verify encryption/decryption works
3. Try posting a test message to X

## 🛡️ Security Features

✅ **API Keys Encrypted** - All X API credentials are encrypted before storage
✅ **User Isolation** - Users can only access their own posts and settings  
✅ **Server-Side Processing** - X API calls only happen on secure Firebase Functions
✅ **No Client-Side API Keys** - Frontend never sees actual API keys
✅ **Audit Logging** - All X API actions are logged in Firebase Functions

## ⚠️ Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Rotate encryption keys** periodically in production
3. **Monitor Firebase logs** for any suspicious activity
4. **Use strong passwords** for Firebase accounts
5. **Enable 2FA** on your Firebase and X developer accounts

## 🔧 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ENCRYPTION_KEY` | ✅ | Encryption key for API credentials |
| `encryption.key` (Functions) | ✅ | Same encryption key for Functions |
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Firebase project configuration |

## 🚨 If Encryption Key is Compromised

1. Generate a new encryption key
2. Update both frontend and Functions environment
3. Re-save all user settings (they'll be re-encrypted)
4. Redeploy your application

---

**🔒 Your X API credentials are now secure!** Only Firebase Functions can decrypt and use them. 