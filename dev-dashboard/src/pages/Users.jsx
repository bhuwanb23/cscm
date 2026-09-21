import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';

const ROLES = ['user', 'admin', 'shopkeeper', 'transporter', 'wholesaler', 'guest'];

export default function Users() {
  const users = useAsyncData(() => api.get('/api/data/users?limit=200'), []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [showCreate, setShowCreate] = useState(false);

  async function changeRole(u, role) {
    setBusy(true);
    setNote(null);
    try {
      await callBackend('PATCH', `/api/v1/debug/data/users/${u.id}/role`, { role });
      setNote(`User ${u.username} → ${role}`);
      users.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u) {
    if (!window.confirm(`Delete user ${u.username}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-user', { params: [u.id] });
      setNote(`Deleted ${u.username}`);
      users.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      await callBackend('POST', '/api/v1/debug/database/create-user', form);
      setNote(`Created ${form.username}`);
      setForm({ username: '', email: '', password: '', role: 'user' });
      setShowCreate(false);
      users.refresh();
    } catch (err) {
      setNote(`Failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Accounts in the users table — role changes take effect on next token refresh"
        actions={<button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Create user'}</button>}
      />
      {note && <div className="card muted">{note}</div>}

      {showCreate && (
        <form className="card row" onSubmit={createUser} style={{ gap: 10, flexWrap: 'wrap' }}>
          <input placeholder="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input placeholder="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="password (12+ chars)" type="password" required minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: 190 }} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button type="submit" disabled={busy}>Create</button>
        </form>
      )}

      <ErrorBanner error={users.error} />
      <div className="card">
        {users.loading && <Loading />}
        {users.data && (
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'username', label: 'Username' },
              { key: 'email', label: 'Email' },
              {
                key: 'role',
                label: 'Role',
                render: (u) => (
                  <select value={u.role} disabled={busy} onChange={(e) => changeRole(u, e.target.value)}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                ),
              },
              { key: 'created_at', label: 'Created' },
            ]}
            rows={users.data.data || []}
            actions={(u) => (
              <button className="danger" disabled={busy} onClick={() => removeUser(u)}>Delete</button>
            )}
          />
        )}
      </div>
    </div>
  );
}
