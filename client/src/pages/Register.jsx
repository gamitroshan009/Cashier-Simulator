import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    shift: 'parttime'
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        shift: form.shift
      });

      alert(response.data.msg || 'Registration successful!');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.msg || 'Registration failed!');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Your Account</h2>

        <input
          type="text"
          name="username"
          placeholder="Full Name"
          value={form.username}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="shift"
              value="parttime"
              checked={form.shift === 'parttime'}
              onChange={handleChange}
            />
            Part Time (100 Score)
          </label>

          <label>
            <input
              type="radio"
              name="shift"
              value="fulltime"
              checked={form.shift === 'fulltime'}
              onChange={handleChange}
            />
            Full Time (200 Score)
          </label>
        </div>

        <button type="submit">Register</button>

        <p>
          Already registered? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
