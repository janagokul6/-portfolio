import React, { useState, useEffect } from 'react';

const Toast = ({ showToast, setShowToast }) => {
  useEffect(() => {
    if (showToast.toast) {
      const timeout = setTimeout(() => {
        setShowToast({toast:false, message:""});
      }, 3000); // Adjust the time the toast is displayed (in milliseconds)
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [showToast.toast, setShowToast]);

  return (
    <>
      
      <div className="fixed bottom-10 right-4 bg-gray-800 text-white px-4 py-3 rounded-md shadow-md">
        {showToast.message}
      </div>
      
    </>
  );
};

export default Toast;
