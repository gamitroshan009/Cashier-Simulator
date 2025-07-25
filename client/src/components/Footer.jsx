import React from 'react';

const Footer = () => (
  <footer style={{
    marginTop: 40,
    padding: '16px 0',
    textAlign: 'center',
    background: '#f8f9fa',
    color: '#333',
    fontSize: '1em'
  }}>
    © {new Date().getFullYear()} Gamit Roshan &nbsp;|&nbsp;
    <a
      href="https://instagram.com/gamit_roshan_009"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#E1306C', textDecoration: 'none', fontWeight: 500 }}
    >
      Instagram
    </a>
  </footer>
);

export default Footer;