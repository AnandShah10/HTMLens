import React, { useState, useEffect } from 'react';

// Note: Local imports are stripped in preview with a warning banner.
// The Babel React preset transpiles JSX → React.createElement() calls at runtime.

function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello from HTMLens React Preview!');

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '2rem auto',
      border: '2px solid #667eea',
      borderRadius: '16px',
      textAlign: 'center',
      background: 'white',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#4f46e5' }}>React Preview Demo</h1>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
        {message}
      </p>
      
      <div style={{ 
        fontSize: '4rem', 
        margin: '1rem 0', 
        fontWeight: 'bold', 
        color: count > 5 ? '#ef4444' : '#10b981' 
      }}>
        {count}
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            margin: '0 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Increment
        </button>
        
        <button 
          onClick={() => setCount(c => Math.max(0, c - 1))}
          style={{
            background: '#64748b',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            margin: '0 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Decrement
        </button>
        
        <button 
          onClick={() => setMessage('State updated! 🚀')}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            margin: '0 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Update Message
        </button>
      </div>
      
      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
        This component was rendered using Babel + React 18 (with JSX transpilation) in the VS Code webview.
      </p>
    </div>
  );
}

// Default export - this is what HTMLens detects and renders
export default Counter;
