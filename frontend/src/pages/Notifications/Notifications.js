import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../services/apiService';

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread | join | mentions
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchServer = async (p = page) => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list({ page: p, limit, unreadOnly: filter === 'unread' });
      if (res?.success) {
        setItems(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('studyhive_bell_notifications');
        if (saved) setItems(JSON.parse(saved));
      }
    } catch (_) {
      const saved = localStorage.getItem('studyhive_bell_notifications');
      if (saved) setItems(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServer(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchServer(page);
    } catch (_) {
      setItems(prev => prev.map(n => ({ ...n, read: true })));
    }
  };
  const clearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      fetchServer(1);
    } catch (_) {
      setItems([]);
    }
  };

  const filtered = items.filter(n => {
    if (filter === 'join') return n.type === 'join_request' || n.type === 'join_request_update';
    if (filter === 'mentions') return n.type === 'mention';
    return true;
  });

  const goTo = (n) => {
    if (n?.meta?.hiveId) navigate(`/study-groups/${n.meta.hiveId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Mark all read</button>
          <button onClick={clearAll} className="px-3 py-1 text-sm rounded bg-red-100 text-red-700">Clear all</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600 dark:text-gray-300">Filter:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="join">Join Requests</option>
          <option value="mentions">Mentions</option>
        </select>
      </div>

      {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
      <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-lg shadow">
        {!loading && filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No notifications</li>
        )}
        {filtered.map(n => (
          <li key={n.id} className={`px-4 py-4 ${!n.read ? 'bg-primary-50/40 dark:bg-gray-800' : ''}`}>
            <div className="flex items-start">
              <div className="mt-0.5 mr-3">
                {n.type === 'join_request' ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">✉️</span>
                ) : n.type === 'join_request_update' ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">✔️</span>
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">@</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-100">{n.text}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(n.time).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-2">
                  {!n.read && (
                    <button onClick={async () => { try { await notificationsAPI.markRead(n._id || n.id); fetchServer(page); } catch (_) { setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read: true } : i))); } }} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700">Mark read</button>
                  )}
                  <button onClick={() => goTo(n)} className="px-2 py-1 text-xs rounded bg-primary-600 text-white">Open</button>
                  <button onClick={() => setItems(prev => prev.filter(i => i.id !== n.id))} className="px-2 py-1 text-xs rounded bg-red-600 text-white">Remove</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchServer(p); }} className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50">Prev</button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchServer(p); }} className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default Notifications;
