import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 Leaderboard</h2>
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
          {leaders.map((user, idx) => (
            <tr key={user.username}>
              <td>{idx + 1}</td>
              <td>{user.username}</td>
              <td>{user.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile cards */}
    <div className="mobile-card-list">
      {leaders.map((user, idx) => (
        <div key={user.username} className="mobile-card">
          <div className="rank">🏅 Rank #{idx + 1}</div>
          <div className="username">{user.username}</div>
          <div className="score">Score: {user.score}</div>
        </div>
      ))}
    </div>
  </>
)}

    </div>
  );
};

export default Leaderboard;
