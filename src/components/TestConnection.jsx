import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const TestConnection = () => {
  const [status, setStatus] = useState('testing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      setStatus('testing');
      setMessage('Testing Firebase connection...');

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      setMessage('✅ Firebase Auth initialized');

      if (!db) {
        throw new Error('Firestore not initialized');
      }
      setMessage('✅ Firestore initialized');

      const testData = {
        message: 'Test connection from React app',
        timestamp: new Date(),
        test: true
      };

      const docRef = await addDoc(collection(db, 'testConnection'), testData);
      setMessage(`✅ Firestore write successful - Document ID: ${docRef.id}`);

      const querySnapshot = await getDocs(collection(db, 'testConnection'));
      const docs = querySnapshot.docs.map(doc => doc.data());
      setMessage(`✅ Firestore read successful - ${docs.length} documents found`);

      setStatus('success');
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      borderRadius: '8px',
      background: status === 'testing' ? '#fff3cd' : 
                  status === 'success' ? '#d4edda' : '#f8d7da',
      border: status === 'testing' ? '1px solid #ffeaa7' : 
              status === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
    }}>
      <h3>Firebase Connection Test</h3>
      <div style={{ 
        fontFamily: 'monospace', 
        fontSize: '14px',
        marginTop: '10px'
      }}>
        {message}
      </div>
      <button 
        onClick={testFirebaseConnection}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Again
      </button>
    </div>
  );
};

export default TestConnection;