import logo from './logo.svg';
import './App.css';

import { useEffect } from 'react';

function App() {
  
  const fetchData = async () => {
  try {
    const response = await fetch('/api/fetch-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'SG_APIM_4A20F12K69B8YC47D1E094QEZPMW7Q73B1BZCN2PW2QF88VQ3C4G'
      },
      body: JSON.stringify({
        endpoints: ['recommendations/most-bought/bilkatogo/feed',],
        basePath: '/v1'
      })
    });
    
    const data = await response.json();
    console.log('Success:', data.success);
    console.log('Failed:', data.failed);
    console.log('Results:', data.results);
    console.log('Full response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};


  useEffect(() => {
    fetchData();
  }, []);

  
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
