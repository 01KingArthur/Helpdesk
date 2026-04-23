import React, { useState, useEffect, useCallback } from 'react';
import LoginOTP from './components/LoginOTP';
import Register from './components/Register';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StaffManagement from './components/StaffManagement';
import Dashboard from './components/Dashboard';
import api from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tickets, setTickets] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = user?.role === 'admin' ? '/tickets' : '/tickets/my-tickets';
      const response = await api.get(endpoint);
      setTickets(response.data);
    } catch (error) {
      console.error('Lỗi tải tickets:', error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  const loadStaffList = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const response = await api.get('/staff');
      setStaffList(response.data);
    } catch (error) {
      console.error('Lỗi tải staff:', error);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadTickets();
      loadStaffList();
    }
  }, [token, loadTickets, loadStaffList]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setShowDashboard(false);
    setShowStaffManagement(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setShowStaffManagement(false);
    setShowDashboard(false);
    setShowRegister(false);
  };

  const handleGoHome = () => {
    setShowStaffManagement(false);
    setShowDashboard(false);
    setShowRegister(false);
    loadTickets();
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      setTickets([response.data, ...tickets]);
      alert('✅ Đã gửi yêu cầu hỗ trợ thành công!');
    } catch (error) {
      alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateRating = async (ticketId, rating) => {
    try {
      const response = await api.put(`/tickets/${ticketId}/rating`, { rating });
      setTickets(tickets.map(t => t.id === ticketId ? response.data : t));
      alert(`⭐ Cảm ơn bạn đã đánh giá ${rating} sao!`);
    } catch (error) {
      alert('Lỗi cập nhật đánh giá');
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    if (user?.role !== 'admin') return;
    try {
      const response = await api.put(`/tickets/${ticketId}/status`, { status });
      setTickets(tickets.map(t => t.id === ticketId ? response.data : t));
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (user?.role !== 'admin') return;
    if (!window.confirm('Bạn có chắc muốn xóa ticket này?')) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (error) {
      alert('Lỗi xóa ticket');
    }
  };

  const handleAssignTicket = async (ticketId, staffId) => {
    if (user?.role !== 'admin') return;
    try {
      const response = await api.put(`/tickets/${ticketId}/assign`, { assignedTo: staffId });
      setTickets(tickets.map(t => t.id === ticketId ? response.data : t));
      alert('✅ Đã phân công ticket thành công!');
    } catch (error) {
      alert('❌ Lỗi phân công: ' + (error.response?.data?.message || error.message));
    }
  };

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập hoặc đăng ký
  if (!user) {
    return showRegister ? 
      <Register onSwitchToLogin={handleSwitchToLogin} /> : 
      <LoginOTP onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />;
  }

  // Đã đăng nhập, hiển thị giao diện chính
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
            <i className="fas fa-headset"></i>
            <h1>HelpDesk Việt</h1>
          </div>
          <div className="user-info">
            <span><i className="fas fa-user"></i> {user.fullname} ({user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'})</span>
            {user.role === 'admin' && (
              <>
                <button 
                  onClick={() => {
                    setShowDashboard(false);
                    setShowStaffManagement(!showStaffManagement);
                  }} 
                  className={`staff-btn ${showStaffManagement ? 'active' : ''}`}
                >
                  <i className="fas fa-users"></i> QL Nhân viên
                </button>
                <button 
                  onClick={() => {
                    setShowStaffManagement(false);
                    setShowDashboard(!showDashboard);
                  }} 
                  className="dashboard-btn"
                >
                  <i className="fas fa-chart-line"></i> Thống kê
                </button>
                <button onClick={loadTickets} className="refresh-btn" title="Làm mới">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {showDashboard ? (
            <Dashboard user={user} onClose={() => setShowDashboard(false)} />
          ) : showStaffManagement && user.role === 'admin' ? (
            <StaffManagement onStaffChange={loadStaffList} />
          ) : (
            <div className="dashboard">
              <TicketForm onSubmit={handleCreateTicket} />
              <TicketList
                tickets={tickets}
                loading={loading}
                userRole={user.role}
                userId={user.id}
                staffList={staffList}
                onUpdateRating={handleUpdateRating}
                onUpdateStatus={handleUpdateStatus}
                onDeleteTicket={handleDeleteTicket}
                onAssignTicket={handleAssignTicket}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 HelpDesk Việt - Hỗ trợ 24/7 | Đánh giá từ 1-3 sao</p>
      </footer>
    </div>
  );
}

export default App;