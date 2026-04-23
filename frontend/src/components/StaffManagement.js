import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StaffDetail from './Dashboard'; // tái sử dụng Dashboard để xem chi tiết? Thực tế nên tách riêng, nhưng để đơn giản, tôi dùng StaffDetail riêng
// Tạo một component nhỏ để xem chi tiết nhân viên
// Thay thế phần StaffDetailModal hiện tại bằng code sau:

function StaffDetailModal({ staff, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStaffTickets = async () => {
      try {
        const res = await api.get(`/tickets/staff/${staff.id}`);
        setTickets(res.data.tickets || []);
        setStats(res.data.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffTickets();
  }, [staff]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'received': return <span className="status-badge received"><i className="fas fa-inbox"></i> Đã nhận</span>;
      case 'open': return <span className="status-badge open"><i className="fas fa-spinner fa-pulse"></i> Đang xử lý</span>;
      case 'resolved': return <span className="status-badge resolved"><i className="fas fa-check-circle"></i> Đã xử lý</span>;
      default: return <span>{status}</span>;
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A';

  return (
    <div className="staff-modal-overlay" onClick={onClose}>
      <div className="staff-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <div className="staff-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="staff-title">
            <h2>{staff.fullname}</h2>
            <p className="staff-role">{staff.role === 'admin' ? 'Quản trị viên' : 'Nhân viên hỗ trợ'}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="staff-info-section">
          <div className="info-row">
            <i className="fas fa-envelope"></i>
            <span className="info-label">Email:</span>
            <span className="info-value">{staff.email}</span>
          </div>
          <div className="info-row">
            <i className="fas fa-user-tag"></i>
            <span className="info-label">Vai trò:</span>
            <span className="info-value">{staff.role === 'admin' ? '👑 Admin' : '👤 Nhân viên'}</span>
          </div>
          <div className="info-row">
            <i className="fas fa-calendar-alt"></i>
            <span className="info-label">Ngày tạo:</span>
            <span className="info-value">{formatDate(staff.created_at)}</span>
          </div>
        </div>

        {stats && (
          <div className="staff-stats">
            <div className="stat-item">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Tổng ticket</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.received}</div>
              <div className="stat-label">Đã nhận</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.open}</div>
              <div className="stat-label">Đang xử lý</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.resolved}</div>
              <div className="stat-label">Đã xử lý</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.avgRating || 0}</div>
              <div className="stat-label">Đánh giá TB</div>
            </div>
          </div>
        )}

        <div className="tickets-section">
          <h3>
            <i className="fas fa-ticket-alt"></i>
            Ticket được phân công ({tickets.length})
          </h3>
          {loading ? (
            <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Đang tải...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-tickets">
              <i className="fas fa-inbox"></i>
              <p>Chưa có ticket nào được phân công</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-card-header">
                    <span className="ticket-subject">{ticket.subject}</span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="ticket-card-info">
                    <span><i className="fas fa-user"></i> {ticket.name}</span>
                    <span><i className="fas fa-calendar"></i> {formatDate(ticket.createdAt)}</span>
                  </div>
                  <div className="ticket-card-desc">
                    {ticket.description?.substring(0, 100)}...
                  </div>
                  {ticket.rating > 0 && (
                    <div className="ticket-card-rating">
                      Đánh giá: {[...Array(ticket.rating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                      {[...Array(3 - ticket.rating)].map((_, i) => <i key={i} className="far fa-star"></i>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-btn">Đóng</button>
        </div>
      </div>

      <style jsx>{`
        .staff-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .staff-modal-container {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .staff-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 24px 20px 24px;
          border-radius: 24px 24px 0 0;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }
        .staff-avatar i {
          font-size: 64px;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .staff-title {
          flex: 1;
        }
        .staff-title h2 {
          color: white;
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }
        .staff-role {
          color: rgba(255,255,255,0.9);
          margin: 4px 0 0;
          font-size: 0.85rem;
        }
        .modal-close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }
        .modal-close-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }
        .staff-info-section {
          padding: 20px 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-row i {
          width: 20px;
          color: #667eea;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          width: 80px;
        }
        .info-value {
          color: #1f2937;
        }
        .staff-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          padding: 20px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .stat-item {
          text-align: center;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 12px;
          transition: transform 0.2s;
        }
        .stat-item:hover {
          transform: translateY(-2px);
        }
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        .tickets-section {
          padding: 20px 24px;
        }
        .tickets-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          color: #1f2937;
        }
        .tickets-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .ticket-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }
        .ticket-card:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .ticket-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .ticket-subject {
          font-weight: 600;
          color: #1f2937;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-badge.received {
          background: #dbeafe;
          color: #3b82f6;
        }
        .status-badge.open {
          background: #fed7aa;
          color: #f59e0b;
        }
        .status-badge.resolved {
          background: #d1fae5;
          color: #10b981;
        }
        .ticket-card-info {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .ticket-card-info i {
          margin-right: 4px;
        }
        .ticket-card-desc {
          font-size: 12px;
          color: #4b5563;
          margin-bottom: 8px;
        }
        .ticket-card-rating {
          font-size: 11px;
          color: #fbbf24;
        }
        .empty-tickets {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }
        .empty-tickets i {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .loading-spinner {
          text-align: center;
          padding: 40px;
          color: #667eea;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }
        .close-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #dc2626;
          transform: scale(1.02);
        }
        @media (max-width: 640px) {
          .staff-modal-container { width: 95%; }
          .staff-stats { grid-template-columns: repeat(3, 1fr); }
          .staff-title h2 { font-size: 1.4rem; }
          .staff-avatar i { font-size: 48px; }
        }
      `}</style>
    </div>
  );
}

function StaffManagement({ onStaffChange }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', fullname: '', email: '', role: 'staff' });
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch(e) { console.error(e); }
  };
  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', formData);
      alert('✅ Tạo nhân viên thành công!');
      setFormData({ username: '', password: '', fullname: '', email: '', role: 'staff' });
      setShowForm(false);
      loadUsers();
      if (onStaffChange) onStaffChange();
    } catch(err) { alert('❌ Lỗi: ' + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };
  const handleDelete = async (id, username) => {
    if (!window.confirm(`Xóa nhân viên "${username}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      alert('Xóa thành công!');
      loadUsers();
      if (onStaffChange) onStaffChange();
    } catch(err) { alert('Lỗi xóa: ' + (err.response?.data?.message)); }
  };

  return (
    <div className="staff-management">
      <div className="staff-header"><h3><i className="fas fa-users"></i> Quản lý nhân viên</h3><button onClick={()=>setShowForm(!showForm)} className="btn-add">+ Thêm nhân viên</button></div>
      {showForm && <form onSubmit={handleCreate} className="staff-form"><input placeholder="Tên đăng nhập *" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} required /><input placeholder="Mật khẩu *" type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} required /><input placeholder="Họ tên *" value={formData.fullname} onChange={e=>setFormData({...formData, fullname:e.target.value})} required /><input placeholder="Email *" type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} required /><select value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})}><option value="staff">Nhân viên</option><option value="admin">Admin</option></select><button type="submit" disabled={loading} className="btn-save">{loading?'Đang tạo...':'Tạo tài khoản'}</button></form>}
      <table className="staff-table"><thead><tr><th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><button className="staff-name-link" onClick={()=>setSelectedStaff(u)}>{u.username}</button></td><td>{u.fullname}</td><td>{u.email}</td><td>{u.role==='admin'?'👑 Admin':'👤 Nhân viên'}</td><td>{u.username!=='admin' && <button onClick={()=>handleDelete(u.id, u.username)} className="btn-delete"><i className="fas fa-trash"></i></button>}</td></tr>)}</tbody></table>
      {selectedStaff && <StaffDetailModal staff={selectedStaff} onClose={()=>setSelectedStaff(null)} />}
      <style jsx>{`
        .staff-management { background: white; border-radius: 16px; padding: 1.5rem; margin-top: 2rem; }
        .staff-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .btn-add { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .staff-form { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 10px; background: #f9fafb; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; }
        .staff-form input, .staff-form select { padding: 6px; border-radius: 6px; border: 1px solid #ddd; }
        .btn-save { background: #3b82f6; color: white; border: none; padding: 6px; border-radius: 6px; cursor: pointer; }
        .staff-table { width: 100%; border-collapse: collapse; }
        .staff-table th, .staff-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .staff-name-link { background: none; border: none; color: #667eea; cursor: pointer; font-weight: 600; }
        .btn-delete { background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default StaffManagement;