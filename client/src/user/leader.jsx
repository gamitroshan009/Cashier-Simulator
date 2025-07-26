import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState('All'); // 👈 dropdown filter

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/leaderboard');
        setLeaders(res.data);
      } catch (err) {
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleHome = () => {
    window.location.href = '/home';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 👇 Filter logic
  const filteredLeaders = selectedShift === 'All'
    ? leaders
    : leaders.filter(user =>
        selectedShift === 'Full Time'
          ? user.shift === 'fulltime'
          : user.shift === 'parttime'
      );

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="header">
        <h2 className="leaderboard-title">🏆 Leaderboard</h2>
        <div className="menu-icon" onClick={handleMenuToggle}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={handleHome}>🏠 Home</button>
            <button onClick={handleLogout}>🚪 Log Out</button>
          </div>
        )}
      </div>

      {/* Filter Listbox */}
      <div className="filter-box">
        <label htmlFor="shift-select">Filter by Shift:</label>
        <select
          id="shift-select"
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaders.map((user, idx) => (
                  <tr key={user.username}>
                    <td>{idx + 1}</td>
                    <td>{user.username}</td>
                    <td>{user.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-card-list">
            {filteredLeaders.map((user, idx) => (
              <div key={user.username} className="mobile-card">
                <div className="rank">🏅 Rank #{idx + 1}</div>
                <div className="username">{user.username}</div>
                <div className="score">Score: {user.score}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
};

export default Leaderboard;
