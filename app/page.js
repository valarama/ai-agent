'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Check for session ID in URL parameter (from Oracle)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('sessionId');
    
    if (urlSessionId) {
      setSelectedConv(urlSessionId);
    } else {
      // No URL parameter - fetch and auto-load LATEST session
      fetchLatestSession();
    }
  }, []);

  // Fetch LATEST session and auto-select it
  const fetchLatestSession = async () => {
    try {
      const res = await fetch('/api/latest-session');
      const data = await res.json();
      if (data.sessionId) {
        console.log('Auto-loading latest session:', data.sessionId);
        setSelectedConv(data.sessionId);
      }
    } catch (error) {
      console.error('Error fetching latest session:', error);
    }
  };

  // Fetch conversation list on load
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch transcript when conversation selected
  useEffect(() => {
    if (selectedConv) {
      console.log('Loading transcript for session:', selectedConv);
      fetchTranscript(selectedConv);
      const interval = setInterval(() => fetchTranscript(selectedConv), 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [selectedConv]); // Re-run when selectedConv changes!

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setLoading(false);
    }
  };

  const fetchTranscript = async (sessionId) => {
    try {
      const res = await fetch(`/api/transcript?sessionId=${sessionId}`);
      const data = await res.json();
      setTranscript(data.messages || []);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Fetch transcript error:', error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', background: '#0f1729' }}>
      {/* Header */}
      <div style={{ background: '#1a1f36', color: 'white', padding: '20px 24px', borderBottom: '1px solid #2a3547' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>COSTCO SMART APPLIANCE SUPPORT</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Live Agent Assist - Real-Time Transcription</p>
          </div>
          <button 
            onClick={fetchLatestSession}
            style={{ 
              padding: '8px 16px', 
              background: '#3b82f6', 
              border: 'none', 
              borderRadius: '6px', 
              color: 'white', 
              fontSize: '13px', 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Load Latest Session
          </button>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            value={selectedConv || ''} 
            onChange={(e) => setSelectedConv(e.target.value)} 
            style={{ padding: '8px 12px', background: '#2a3547', border: '1px solid #3a4557', borderRadius: '4px', color: 'white', fontSize: '14px', flex: 1 }}
          >
            <option value="">Select Conversation</option>
            {conversations.map(conv => (
              <option key={conv.sessionId} value={conv.sessionId}>
                {conv.sessionId} ({conv.duration} - {conv.turns} turns)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Live Transcript */}
        <div style={{ flex: 1, background: '#0f1729', padding: '24px', overflowY: 'auto', borderRight: '1px solid #2a3547' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '20px', borderBottom: '2px solid #3a4557', paddingBottom: '12px' }}>
            Live Transcript
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>Loading conversations...</div>
          ) : !selectedConv ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>Select a conversation to view transcript</div>
          ) : transcript.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No messages in this conversation</div>
          ) : (
            <div>
              {transcript.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                      padding: '4px 12px', 
                      background: msg.role === 'agent' ? '#374151' : '#1e40af', 
                      borderRadius: '4px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'white',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      {msg.role === 'agent' ? 'Agent' : 'Customer'}
                    </div>
                    {msg.sentiment && (
                      <div style={{ 
                        padding: '4px 12px', 
                        background: msg.sentiment === 'Negative' ? '#7f1d1d' : msg.sentiment === 'Neutral' ? '#374151' : '#166534', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        color: 'white'
                      }}>
                        {msg.sentiment}
                      </div>
                    )}
                    <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
                      {msg.time}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    background: '#1a1f36', 
                    borderLeft: `3px solid ${msg.role === 'agent' ? '#6b7280' : '#3b82f6'}`, 
                    borderRadius: '4px',
                    color: '#e5e7eb',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Right Panel - Agent Assist */}
        <div style={{ width: '400px', background: '#1a1f36', padding: '24px', overflowY: 'auto' }}>
          {/* Agent Behaviour Suggestions */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
              Agent Behaviour Suggestions
            </h3>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
              {suggestions.behavior?.map((sug, idx) => (
                <li key={idx} style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px', lineHeight: '1.5' }}>
                  {sug}
                </li>
              )) || (
                <>
                  <li style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
                    Acknowledge customer's smart appliance setup needs
                  </li>
                  <li style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
                    Confirm device model and connection type (WiFi/Bluetooth)
                  </li>
                  <li style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
                    Provide step-by-step setup instructions clearly
                  </li>
                  <li style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
                    Verify each step completed before proceeding
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Cross/Up Sell Opportunities */}
          <div style={{ marginBottom: '32px', padding: '16px', background: '#0f1729', borderRadius: '8px', border: '1px solid #2a3547' }}>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
              Cross / Up Sell Opportunities
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', marginBottom: '6px' }}>
                Possibility: {suggestions.upsell?.possibility || 'No'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
                <strong>Explanation:</strong> {suggestions.upsell?.explanation || 'No upsell opportunity detected. Customer query is related to basic smart appliance setup and troubleshooting.'}
              </div>
            </div>
          </div>

          {/* Recommended Questions */}
          <div>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
              Recommended Questions for K Assist
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestions.questions?.map((q, idx) => (
                <button key={idx} style={{ 
                  padding: '8px 14px', 
                  background: '#1e3a8a', 
                  border: '1px solid #3b82f6', 
                  borderRadius: '6px', 
                  color: 'white', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  {q}
                </button>
              )) || (
                <>
                  <button style={{ padding: '8px 14px', background: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    How do I set up WiFi on smart fridge?
                  </button>
                  <button style={{ padding: '8px 14px', background: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    How do I connect via Bluetooth?
                  </button>
                  <button style={{ padding: '8px 14px', background: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    How to reset smart appliance?
                  </button>
                  <button style={{ padding: '8px 14px', background: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    Troubleshooting connection issues?
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
