import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [calendarDates, setCalendarDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [money, setMoney] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [score, setScore] = useState(0);
  const [entries, setEntries] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    startLoading();
  }, []);

  const startLoading = () => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 5) + 1;
      if (p >= 100) {
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          generateCalendar();
          fetchScore();
        }, 500);
      } else {
        setProgress(p);
      }
    }, 30);
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
        fetchScore();
      }, 1000);
    } else if (countdown === 0) {
      generateCalendar();
      fetchScore();
      setMessage('');
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchScore = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/score/${user.username}`);
      setScore(res.data.score);
      setEntries(res.data.entries || []);
      if (res.data.score === 0) setMessage("You lose the game");
      else if (res.data.score < 10) setMessage("Work hard!");
      else if (res.data.score >= 100) setMessage("Well done!");
    } catch (err) {
      setScore(0);
      setEntries([]);
    }
  };

  const generateCalendar = () => {
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    if (today.getDate() > 25) {
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
    }

    const startDate = new Date(currentYear, currentMonth - 1, 26);
    const endDate = new Date(currentYear, currentMonth, 25);

    const formatDate = (date) => {
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    setDateRange(`${formatDate(startDate)} – ${formatDate(endDate)}`);

    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    setCalendarDates(dates);
  };

  const handleDateClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    setSelectedDate(formatted);
  };

  const handleButtonClick = async (type) => {
    if (!selectedDate || !money) {
      alert('Please select a date and enter rupees.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/score/entry', {
        username: user.username,
        date: selectedDate,
        status: type.toLowerCase(),
        rupees: Number(money)
      });
      setScore(res.data.score);
      alert(`${type} marked on ${selectedDate} with ₹${money}`);

      const selected = new Date(selectedDate);
      if (selected.getDate() === 25) {
        setCountdown(60);
      }

      setSelectedDate('');
      setMoney('');
      fetchScore();
    } catch (err) {
      alert('Failed to update score');
    }
  };

  const getDateStatus = (dateStr) => {
    const entry = entries.find(e => e.date === dateStr);
    return entry ? entry.status : null;
  };

  return (
    <div className="home-container">
      {loading && (
        <div className="loading-overlay">
          <div className="progress-box">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        </div>
      )}

      <div className="user-box">
        <div className="username" onClick={() => setShowDropdown(!showDropdown)}>
          Welcome, {user?.username || 'User'} 👋
        </div>
        {showDropdown && (
          <div className="dropdown">
           <button onClick={() => window.location.href = '/leaderboard'}>🏆 Top List</button>

            <button onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      <div className="score-display">
        Total Score: <b>{score}</b>
      </div>

      {countdown > 0 && (
        <div className="countdown">
          📅 Calendar will update in <b>{countdown}</b> second(s)
        </div>
      )}

      {message && (
        <div className="score-message">
          🎯 <b>{message}</b>
        </div>
      )}

      <div className="month-header">{dateRange}</div>

      <div className="calendar-grid">
        {calendarDates.map((date, index) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const isSelected = dateStr === selectedDate;
          const status = getDateStatus(dateStr);

          let statusClass = '';
          if (status === 'short') statusClass = 'date-short';
          else if (status === 'excess') statusClass = 'date-excess';
          else if (status === 'holiday') statusClass = 'date-holiday';

          return (
            <div
              key={index}
              className={`calendar-date ${isSelected ? 'selected' : ''} ${statusClass}`}
              onClick={() => !status && handleDateClick(date)}
              style={{ cursor: status ? 'not-allowed' : 'pointer' }}
              title={status ? `Already marked as ${status}` : ''}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="input-group">
        <input type="text" placeholder="Selected Date" value={selectedDate} readOnly />
        <input type="number" placeholder="Rupees" value={money} onChange={(e) => setMoney(e.target.value)} />
      </div>

      <div className="button-group">
        <button className="btn holiday" onClick={() => handleButtonClick('Excess')}>Excess</button>
        <button className="btn short" onClick={() => handleButtonClick('Short')}>Short</button>
        <button className="btn excess" onClick={() => handleButtonClick('Holiday')}>Tally/Holiday</button>
      </div>
    </div>
  );
};

export default Home;
