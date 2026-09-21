import React from 'react';
import { PageHeader } from '../components/ui.jsx';

export default function FeatureStore() {
  return (
    <div>
      <PageHeader
        title="Feature store"
        subtitle="Feature storage, transformations and versioning for ML inputs (backend/src/features)"
      />
      <div className="grid-3">
        <div className="card">
          <h3>featureStorage.js</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            Singleton FeatureStorage — persists computed features (demand aggregates, stock ratios,
            trend signals) keyed by entity, consumed by sub-agents before calling AI/ML models.
          </p>
        </div>
        <div className="card">
          <h3>featureTransformations.js</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            Pure transforms: rolling averages, seasonality flags, velocity deltas, normalization.
            Exported as named transform functions composed by agents.
          </p>
        </div>
        <div className="card">
          <h3>featureVersioning.js</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            FeatureVersioning — schema versions so model inputs stay reproducible across deploys.
          </p>
        </div>
      </div>
      <div className="card">
        <h3>Also in this directory</h3>
        <div className="event-row"><code>demoFeatures.js</code><span className="muted">seed/demo feature data</span></div>
        <div className="event-row"><code>testFeatures.js</code><span className="muted">feature pipeline self-test</span></div>
        <div className="event-row"><code>FEATURE_STORAGE.md</code><span className="muted">design doc</span></div>
      </div>
    </div>
  );
}
