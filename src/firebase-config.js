import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
}

console.log('🚀 Firebase Configuration Status:');
console.log('   - Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set');
console.log('   - API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   - Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set');
console.log('   - Environment:', import.meta.env.VITE_APP_ENV || 'development');

let app;
let auth;
let db;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    analytics = getAnalytics(app);
  }
  
  console.log('✅ Firebase initialized successfully!');
  console.log('📊 Project:', firebaseConfig.projectId);
  console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
  console.log('🌐 Environment:', import.meta.env.VITE_APP_ENV);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  
  if (error.code === 'auth/invalid-api-key') {
    console.error('💡 Solution: Check your VITE_FIREBASE_API_KEY in .env file');
  } else if (error.code === 'app/duplicate-app') {
    console.error('💡 Solution: Firebase app already initialized');
  }
  
  throw error;
}

export { app, auth, db, analytics };
export default app;