import React from 'react';

const Loading = () => {
  return (
    <div className="loading-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(126, 184, 166, 0.8)',
    }}>
      <img 
        src="/Photo/loading.gif" 
        alt="Loading..." 
        className="loading-image"
        style={{ 
          width: '150px', 
          height: '150px',
          
        }}
      />
    </div>
  );
};

export default Loading;