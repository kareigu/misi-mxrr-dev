import React from 'react';
import './Home.css';
import Logo from '../../temp.gif'

function perms() {
  localStorage.setItem('token', 'asdasda');
}

function Home() {
  return (
    <div>
      <img id="logo" src={Logo} alt="kettukaani"/>
      <button onClick={perms}>Get perms</button>
    </div>
  );
}

export default Home;