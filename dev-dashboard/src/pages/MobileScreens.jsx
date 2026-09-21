import React from 'react';
import { PageHeader } from '../components/ui.jsx';
import { MOBILE_SCREENS } from '../lib/registry.js';

export default function MobileScreens() {
  return (
    <div>
      <PageHeader
        title="Mobile app screens"
        subtitle="Expo app (App/) — role dashboards rendered by App.js based on stored user role"
      />
      <div className="grid-2">
        {Object.entries(MOBILE_SCREENS).map(([role, screens]) => (
          <div className="card" key={role}>
            <h3 style={{ textTransform: 'capitalize' }}>{role === 'mesh' ? 'Mesh console' : `${role} screens`}</h3>
            {screens.map((s) => (
              <div key={s} className="event-row">
                <span className="badge">screen</span>
                <span>{s}</span>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                  App/users/{role === 'mesh' ? 'mesh' : role}/{s.toLowerCase()}.js
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>App data layer</h3>
        <div className="event-row"><code>src/api/config.js</code><span className="muted">resolves gateway URL from EXPO_PUBLIC_BACKEND_URL or Expo hostUri → :8080</span></div>
        <div className="event-row"><code>src/api/apiClient.js</code><span className="muted">fetch wrapper + AsyncStorage token</span></div>
        <div className="event-row"><code>src/api/endpoints.js</code><span className="muted">typed endpoint catalog</span></div>
        <div className="event-row"><code>src/api/offlineCache.js</code><span className="muted">offline queue/cache</span></div>
        <div className="event-row"><code>src/api/websocket.js</code><span className="muted">live updates</span></div>
      </div>
    </div>
  );
}
