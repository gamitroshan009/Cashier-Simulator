import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ⬅️ Import for navigation
import './auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // ⬅️ Hook to navigate

  const sendOtp = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      if (res.data.success) {
        setMessage('OTP sent to your email.');
        setStep(2);
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setMessage('OTP verified. Now set a new password.');
        setStep(3);
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || 'OTP verification failed');
    }
  };

  const resetPassword = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', { email, newPassword });
      if (res.data.success) {
        setMessage('Password reset successfully. Please log in.');
        setStep(4);
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to reset password');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Forgot Password</h2>

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendOtp}>Send OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp}>Verify OTP</button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={resetPassword}>Reset Password</button>
          </>
        )}

        {step === 4 && (
          <>
            <p style={{ color: 'green' }}>✔️ Password reset! You can now log in.</p>
            <button onClick={() => navigate('/login')}>Go to Login</button> {/* ⬅️ Redirect Button */}
          </>
        )}

        <p style={{ marginTop: '10px', color: 'red' }}>{message}</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
