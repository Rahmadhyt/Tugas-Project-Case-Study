import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Environment Setup');
console.log('===================');

if (fs.existsSync('.env')) {
  console.log('✅ .env file already exists');
  console.log('📁 You can edit it manually if needed');
} else {
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file from .env.example');
    console.log('📝 Please update .env with your actual Firebase configuration');
  } else {
    console.log('💡 Creating basic .env file...');
    
    const basicEnv = `# Firebase Configuration - UPDATE THESE VALUES
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789000
VITE_FIREBASE_APP_ID=1:123456789000:web:abcdef123456789

# Security Settings
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOGIN_TIMEOUT_MINUTES=15
VITE_ENABLE_SECURITY_LOGGING=true
VITE_APP_ENV=development
`;
    
    fs.writeFileSync('.env', basicEnv);
    console.log('✅ Created basic .env file');
    console.log('🚨 IMPORTANT: Update .env with your Firebase configuration!');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit .env file with your Firebase config');
console.log('2. Run: npm run dev');
console.log('3. Check browser console for initialization status');