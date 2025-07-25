import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';
import Footer from '../components/Footer';

const Home = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [missingLast25, setMissingLast25] = useState(false);
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
  const [progress, setProgress] = useState(1);
  const [shift, setShift] = useState('parttime'); // Add this state
  const [lostPoints, setLostPoints] = useState(null);
  const [lostPointsType, setLostPointsType] = useState('');
  const [dateUsed, setDateUsed] = useState(false);
  const [showOldCalendar, setShowOldCalendar] = useState(false);
  const [showWinBox, setShowWinBox] = useState(false);
  const [winCountdown, setWinCountdown] = useState(60);
  const [winMessage, setWinMessage] = useState('');

  useEffect(() => {
    simulateProgressWhileLoading();
    fetchAllData().then(() => {
      finishProgressAndHideLoader();
    });
  }, []);

  const simulateProgressWhileLoading = () => {
    let p = 1;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 3) + 1;
      if (p >= 90) {
        clearInterval(interval); // Stop at 90%
      } else {
        setProgress(p);
      }
    }, 30);
  };

  const fetchAllData = async () => {
    await generateCalendar();
    await fetchScore();
  };

  const finishProgressAndHideLoader = () => {
    let p = progress;
    const finalInterval = setInterval(() => {
      p += 1;
      if (p >= 100) {
        clearInterval(finalInterval);
        setProgress(100);
        setTimeout(() => setLoading(false), 400);
      } else {
        setProgress(p);
      }
    }, 20);
  };

  const fetchScore = async () => {
    try {
      const res = await axios.get(`https://cashier-simulator.onrender.com/api/score/${user.username}`);
      setScore(res.data.score);
      setEntries(res.data.entries || []);
      setShift(res.data.shift || user.shift || 'parttime');
      setMissingLast25(res.data.missingLast25 || false);
      setShowOldCalendar(res.data.missingLast25 || false);
      generateCalendar(res.data.missingLast25 || false);
    } catch (err) {
      setScore(0);
      setEntries([]);
      setShift(user.shift || 'parttime');
      setMissingLast25(false);
      setShowOldCalendar(false);
      generateCalendar(false);
    }
  };

  const generateCalendar = (showOld) => {
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    let startDate, endDate;

    if (showOld) {
      // Show previous month calendar
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      startDate = new Date(prevYear, prevMonth, 26);
      endDate = new Date(currentYear, currentMonth, 25);
    } else {
      // Show current month calendar
      if (today.getDate() > 25) {
        currentMonth += 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear += 1;
        }
      }
      startDate = new Date(currentYear, currentMonth - 1, 26);
      endDate = new Date(currentYear, currentMonth, 25);
    }

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

  const handleDateClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    setSelectedDate(formatted);

    // Find entry for this date
    const entry = entries.find(e => e.date === formatted);
    if (entry) {
      setDateUsed(true);
      if (entry.status === 'short') {
        setLostPoints(-Math.abs(entry.rupees));
        setLostPointsType('short');
      } else if (entry.status === 'excess') {
        setLostPoints(Math.abs(entry.rupees));
        setLostPointsType('excess');
      } else if (entry.status === 'holiday') {
        setLostPoints(0);
        setLostPointsType('holiday');
      }
    } else {
      setDateUsed(false);
      setLostPoints(null);
      setLostPointsType('');
    }
  };

  const handleButtonClick = async (type) => {
    if (!selectedDate || !money) {
      alert('Please select a date and enter rupees.');
      return;
    }
    try {
      const res = await axios.post('https://cashier-simulator.onrender.com/api/score/entry', {
        username: user.username,
        date: selectedDate,
        status: type.toLowerCase(),
        rupees: Number(money)
      });
      setScore(res.data.score);
      alert(`${type} marked on ${selectedDate} with ₹${money}`);

      const selected = new Date(selectedDate);
      if (selected.getDate() === 25) {
        // Show win box
        if (res.data.score >= 0) {
          setWinMessage(`🎉 You win! Incentive: ₹${800 + res.data.score}`);
        } else {
          setWinMessage('😢 Try next time with better performance');
        }
        setShowWinBox(true);
        setWinCountdown(60);
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

  // Calculate remaining days (including today)
  const today = new Date();
  const lastDay = calendarDates.length > 0 ? calendarDates[calendarDates.length - 1] : today;
  const daysLeft = Math.max(
    1,
    Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24)) + 1
  );

  // Calculate spend per day
  const spendPerDay = daysLeft > 0 ? Math.floor(score / daysLeft) : score;

  // After marking 25th, switch to next calendar after 1 minute
  useEffect(() => {
    if (!showOldCalendar) return;
    const lastDate = calendarDates.length > 0 ? calendarDates[calendarDates.length - 1] : null;
    if (lastDate) {
      const year = lastDate.getFullYear();
      const month = String(lastDate.getMonth() + 1).padStart(2, '0');
      const day = String(lastDate.getDate()).padStart(2, '0');
      const lastDateStr = `${year}-${month}-${day}`;
      const entry = entries.find(e => e.date === lastDateStr);
      if (entry) {
        setTimeout(() => {
          setShowOldCalendar(false);
          generateCalendar(false);
        }, 60000); // 1 minute
      }
    }
  }, [entries, calendarDates, showOldCalendar]);

  useEffect(() => {
    if (!showWinBox) return;
    if (winCountdown <= 0) {
      setShowWinBox(false);
      setWinMessage('');
      return;
    }
    const timer = setTimeout(() => setWinCountdown(winCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [showWinBox, winCountdown]);

  return (
    <div className="home-container">
      {loading && (
        <div className="loading-overlay fade-in">
          <div className="progress-box">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
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
                }}>🚪 Logout</button>
              </div>
            )}
          </div>

          <div className="score-display">
            Total Score: <b>{score}</b> <span style={{fontSize: '0.8em', color: '#aaa'}}>({shift})</span>
          </div>
          <div style={{ margin: '8px 0', color: '#0077cc', fontWeight: 500 }}>
            Spend per day: {spendPerDay}
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
                  onClick={() => handleDateClick(date)} // <-- always allow click
                  style={{ cursor: 'pointer' }}         // <-- always pointer
                  title={status ? `Already marked as ${status}` : ''}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          {/* Show lost points for selected date */}
          {selectedDate && lostPoints !== null && (
            <div className={`lost-points-box ${lostPointsType}`}>
              <button
                className="lost-points-back"
                onClick={() => {
                  setSelectedDate('');
                  setLostPoints(null);
                  setLostPointsType('');
                  setDateUsed(false);
                }}
              >
                Back
              </button>
              {lostPointsType === 'excess' && (
                <span className="lost-points-value">+{Math.abs(lostPoints)}</span>
              )}
              {lostPointsType === 'short' && (
                <span className="lost-points-value">-{Math.abs(lostPoints)}</span>
              )}
              {lostPointsType === 'holiday' && (
                <span className="lost-points-value">0</span>
              )}
              <span className="lost-points-label">
                {lostPointsType === 'excess' && ' Excess'}
                {lostPointsType === 'short' && ' Short'}
                {lostPointsType === 'holiday' && ' Holiday/Tally'}
              </span>
            </div>
          )}

          <div className="input-group">
            <input type="text" placeholder="Selected Date" value={selectedDate} readOnly />
            <input
              type="number"
              placeholder="Rupees"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              disabled={dateUsed}
            />
          </div>

          <div className="button-group">
            <button className="btn holiday" onClick={() => handleButtonClick('Excess')}>Excess</button>
            <button className="btn short" onClick={() => handleButtonClick('Short')}>Short</button>
            <button className="btn excess" onClick={() => handleButtonClick('Holiday')}>Tally/Holiday</button>
          </div>

          {showWinBox && (
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#eaffea',
                border: '3px solid #28a745',
                borderRadius: '16px',
                boxShadow: '0 8px 32px #0003',
                minWidth: '260px',
                minHeight: '120px',
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#28a745',
                padding: '32px 24px',
                textAlign: 'center'
              }}
            >
              <div>{winMessage}</div>
              <div style={{ fontSize: '1rem', color: '#333', marginTop: 12 }}>
                Calendar will update in <b>{winCountdown}</b> second(s)
              </div>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
};

export default Home;
