import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard({ user, onClose }) {
  const [stats, setStats] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    if (user.role === 'admin') loadStaffList();
  }, [selectedStaff]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const endpoint = user.role === 'admin' ? `/dashboard/admin?staff=${selectedStaff}` : '/dashboard/my';
      const res = await api.get(endpoint);
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const loadStaffList = async () => {
    try { const res = await api.get('/staff'); setStaffList(res.data); } catch(e) {}
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h2><i className="fas fa-chart-line"></i> Báo cáo tổng quan</h2><div>{user.role === 'admin' && <select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)}>{staffList.map(s=><option key={s.id} value={s.id}>{s.fullname}</option>)}<option value="all">Tất cả nhân viên</option></select>}<button onClick={onClose}>Đóng</button></div></div>
      <div className="stats-grid"><div className="stat-card"><h3>{stats?.total||0}</h3><p>Tổng ticket</p></div><div className="stat-card"><h3>{stats?.received||0}</h3><p>📥 Đã nhận</p></div><div className="stat-card"><h3>{stats?.open||0}</h3><p>⚙️ Đang xử lý</p></div><div className="stat-card"><h3>{stats?.resolved||0}</h3><p>✅ Đã xử lý</p></div><div className="stat-card"><h3>{stats?.avgRating||0}/3</h3><p>⭐ Đánh giá TB</p></div></div>
      <div className="priority-stats"><h3>Ưu tiên</h3>{stats?.byPriority?.map(p=><div key={p.name}><span>{p.name}</span><div className="bar"><div className="fill" style={{width:`${(p.value/(stats.total||1))*100}%`, background:p.color}}></div></div><span>{p.value}</span></div>)}</div>
      <div className="recent-tickets"><h3>Ticket gần đây</h3>{stats?.recentTickets?.map(t=><div key={t.id}><span><b>{t.subject}</b> - {t.name}</span><span className={`status ${t.status}`}>{t.status==='received'?'📥 Mới':t.status==='open'?'⚙️ Đang xử lý':'✅ Đã xử lý'}</span></div>)}</div>
      <style jsx>{`
        .dashboard-container { padding: 20px; background: #f3f4f6; min-height: 100vh; }
        .dashboard-header { display: flex; justify-content: space-between; background: white; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; align-items: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 16px; border-radius: 12px; text-align: center; }
        .stat-card h3 { font-size: 28px; margin: 0; }
        .priority-stats { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .priority-stats > div { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
        .bar { flex: 1; height: 24px; background: #e5e7eb; border-radius: 12px; overflow: hidden; }
        .fill { height: 100%; }
        .recent-tickets { background: white; padding: 20px; border-radius: 12px; }
        .recent-tickets > div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .status { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .status.received { background: #dbeafe; color: #3b82f6; }
        .status.open { background: #fed7aa; color: #f59e0b; }
        .status.resolved { background: #d1fae5; color: #10b981; }
      `}</style>
    </div>
  );
}

export default Dashboard;