import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language

  const availableLanguages = [
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'Arabic' },
      { code: 'bn', name: 'Bengali' },
      { code: 'fr', name: 'French' },
      { code: 'sw', name: 'Swahili' },
  ];

  useEffect(() => {
    // Fetch a new session ID when the component mounts
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:5000/session');
        setSessionId(response.data.sessionId);
      } catch (error) {
        console.error('Error fetching session ID:', error);
        // Handle error, maybe display a message to the user
      }
    };

    fetchSession();
  }, []); // Empty dependency array ensures this runs only once on mount

  const sendMessage = async () => {
    if (input.trim() === '') return;
    if (!sessionId) {
      console.error('Session ID not available.');
      // Optionally show a message to the user
      return;
    }

    const newUserMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    const currentInput = input; // Store current input
    setInput('');

    try {
      // Send message to backend with session ID and selected language
      const response = await axios.post('http://localhost:5000/chat', { sessionId: sessionId, message: currentInput, language: selectedLanguage });
      const botResponse = { text: response.data.reply, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { text: 'Error sending message.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const handleLanguageChange = (event) => {
      setSelectedLanguage(event.target.value);
  };

  const requestEmergencyAssistance = async () => {
      if (!sessionId) {
          console.error('Session ID not available.');
          return;
      }
      const userMessage = "Emergency assistance needed.";
      const newUserMessage = { text: userMessage, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);

      try {
          // Call a dedicated emergency assistance endpoint with session ID and selected language
          const response = await axios.post('http://localhost:5000/emergency', { sessionId: sessionId, language: selectedLanguage });
          const botResponse = { text: response.data.reply, sender: 'bot' };
          setMessages((prevMessages) => [...prevMessages, botResponse]);
      } catch (error) {
          console.error('Error requesting emergency assistance:', error);
          const errorMessage = { text: 'Error requesting emergency assistance.', sender: 'bot' };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>SafeHaven Chat</h1>
        {/* Language Selector */}
        <select onChange={handleLanguageChange} value={selectedLanguage} disabled={!sessionId}>
            {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
        </select>
        {/* Emergency Assistance Button */}
        <button className="emergency-button" onClick={requestEmergencyAssistance} disabled={!sessionId}>
          Emergency Assistance
        </button>
      </header>
      <div className="chat-window">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!sessionId}
          />
          <button onClick={sendMessage} disabled={!sessionId}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;