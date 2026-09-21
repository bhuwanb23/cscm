import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AiDomainPage from './AiDomainPage.jsx';
import { AI_DOMAINS } from '../../lib/registry.js';

export default function AiDomainRouter() {
  const { key } = useParams();
  const domain = AI_DOMAINS.find((d) => d.key === key);
  if (!domain) {
    return (
      <div className="card">
        <h3>Unknown AI domain: {key}</h3>
        <Link to="/ai">← Back to AI overview</Link>
      </div>
    );
  }
  return <AiDomainPage domain={domain} key={domain.key} />;
}
