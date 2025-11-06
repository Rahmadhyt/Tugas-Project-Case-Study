import { auth, db } from './firebase-config.js';

const verifySetup = () => {
  console.log('🔍 Verifying Firebase Setup...');
  
  // Check if auth is initialized
  if (auth) {
    console.log('✅ Firebase Auth initialized successfully');
    console.log('   - Current User:', auth.currentUser);
    console.log('   - Auth Domain:', auth.app.options.authDomain);
  } else {
    console.log('❌ Firebase Auth failed to initialize');
  }
  
  // Check if firestore is initialized
  if (db) {
    console.log('✅ Firestore initialized successfully');
    console.log('   - Project ID:', db.app.options.projectId);
  } else {
    console.log('❌ Firestore failed to initialize');
  }
  
  // Check Firebase Config
  const config = auth.app.options;
  console.log('📋 Firebase Configuration:');
  console.log('   - Project ID:', config.projectId);
  console.log('   - Auth Domain:', config.authDomain);
  console.log('   - API Key exists:', !!config.apiKey);
  
  return {
    auth: !!auth,
    firestore: !!db,
    config: {
      projectId: config.projectId,
      authDomain: config.authDomain,
      apiKey: !!config.apiKey
    }
  };
};

export default verifySetup;