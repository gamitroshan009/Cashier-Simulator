import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/home');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const simulateProgress = () => {
    setLoading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 10) + 5;
      if (p >= 100) {
        setProgress(100);
        clearInterval(interval);
      } else {
        setProgress(p);
      }
    }, 30);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    simulateProgress();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setTimeout(() => {
        setLoading(false);
        navigate('/home');
      }, 1000);
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      {loading && (
        <div className="loading-overlay">
          <div className="progress-box">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
