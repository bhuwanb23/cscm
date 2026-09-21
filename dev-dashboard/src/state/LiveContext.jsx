import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const LiveContext = createContext({ status: {}, events: [] });

export function LiveProvider({ children }) {
  const { token } = useAuth();
  const [status, setStatus] = useState({});
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}`);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const frame = JSON.parse(msg.data);
        if (frame.type === 'status') setStatus(frame.data);
        if (frame.type === 'event') {
          setEvents((prev) => [frame.data, ...prev].slice(0, 200));
        }
        if (frame.type === 'events') setEvents(frame.data || []);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      // Reconnect after a short delay while authenticated
      setTimeout(() => {
        if (wsRef.current === ws) wsRef.current = null;
      }, 100);
    };

    return () => {
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    };
  }, [token]);

  return (
    <LiveContext.Provider value={{ status, events }}>{children}</LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}
