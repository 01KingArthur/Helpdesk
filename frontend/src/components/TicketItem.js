import React, { useState } from 'react';

function TicketItem({ ticket, userRole, userId, staffList = [], onUpdateRating, onUpdateStatus, onDeleteTicket, onAssignTicket }) {
  const [showAssign, setShowAssign] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(ticket.assignedTo?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const isTicketOwner = userId === ticket.userId;

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Cao': return 'priority-high';
      case 'Trung bình': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getPriorityText = (priority) => {
    switch(priority) {
      case 'Cao': return '🔴 Cao';
      case 'Trung bình': return '🟠 Trung bình';
      default: return '🟢 Thấp';
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'received':
        return { text: 'Đã nhận', icon: 'fa-inbox', color: '#3b82f6', bg: '#dbeafe' };
      case 'open':
        return { text: 'Đang xử lý', icon: 'fa-spinner fa-pulse', color: '#f59e0b', bg: '#fed7aa' };
      case 'resolved':
        return { text: 'Đã xử lý', icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' };
      default:
        return { text: 'Đã nhận', icon: 'fa-inbox', color: '#3b82f6', bg: '#dbeafe' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
  };

  const handleAssign = () => {
    if (onAssignTicket && selectedStaff) {
      onAssignTicket(ticket.id, selectedStaff);
      setShowAssign(false);
      setSearchTerm('');
    }
  };

  const statusInfo = getStatusInfo(ticket.status);

  // Lọc nhân viên theo từ khóa tìm kiếm
  const filteredStaffList = (staffList.length > 0 ? staffList : []).filter(staff =>
    staff.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ticket-item">
      <div className="ticket-header">
        <div className="ticket-subject">
          <i className="fas fa-ticket-alt"></i>
          <span>{ticket.subject}</span>
          <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
            {getPriorityText(ticket.priority)}
          </span>
        </div>
      </div>
      
      <div className="ticket-info">
        <div className="ticket-meta">
          <span><i className="fas fa-user"></i> {ticket.name}</span>
          <span><i className="fas fa-envelope"></i> {ticket.email}</span>
          <span><i className="fas fa-calendar-alt"></i> {formatDate(ticket.createdAt)}</span>
          <span className="status-badge" style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600' }}>
            <i className={`fas ${statusInfo.icon}`} style={{ marginRight: '4px' }}></i>
            {statusInfo.text}
          </span>
        </div>
      </div>
      
      {/* Hiển thị thời gian cập nhật nếu có */}
      {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
        <div className="updated-info">
          <i className="fas fa-clock"></i>
          <span>Cập nhật: {formatDate(ticket.updatedAt)}</span>
        </div>
      )}
      
      {/* Hiển thị nhân viên được phân công */}
      {ticket.assignedTo && ticket.assignedTo.name && (
        <div className="assigned-info">
          <i className="fas fa-user-check"></i>
          <span>Phân công: <strong>{ticket.assignedTo.name}</strong></span>
          {ticket.assignedAt && <span className="assigned-time">({formatDate(ticket.assignedAt)})</span>}
        </div>
      )}
      
      <div className="ticket-description">
        <i className="fas fa-comment-dots"></i>
        <p>{ticket.description || 'Không có mô tả chi tiết'}</p>
      </div>
      
      <div className="ticket-footer">
        {/* PHẦN ĐÁNH GIÁ */}
        <div className="rating-section">
          {ticket.rating > 0 ? (
            <div className="rating-display">
              <span><i className="fas fa-star-of-life"></i> Đánh giá: </span>
              {[...Array(ticket.rating)].map((_, i) => (
                <i key={i} className="fas fa-star" style={{ color: '#fbbf24' }}></i>
              ))}
              {[...Array(3 - ticket.rating)].map((_, i) => (
                <i key={i} className="far fa-star" style={{ color: '#d1d5db' }}></i>
              ))}
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#666' }}>
                ({ticket.rating}/3 sao)
              </span>
            </div>
          ) : (
            (userRole === 'admin' || isTicketOwner) && (
              <div className="rating-input">
                <span><i className="fas fa-star-of-life"></i> Đánh giá dịch vụ: </span>
                {[1, 2, 3].map(star => (
                  <i
                    key={star}
                    onClick={() => onUpdateRating(ticket.id, star)}
                    className="far fa-star"
                    style={{ fontSize: '1.1rem', cursor: 'pointer', marginLeft: '5px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#fbbf24'}
                    onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
                  ></i>
                ))}
              </div>
            )
          )}
        </div>
        
        {/* PHẦN ACTION BUTTONS */}
        <div className="action-buttons">
          {userRole === 'admin' && (
            <>
              <div className="assign-wrapper">
                <button 
                  onClick={() => setShowAssign(!showAssign)} 
                  className="btn-assign"
                  title="Phân công nhân viên"
                >
                  <i className="fas fa-user-plus"></i> Phân công
                </button>
                
                {showAssign && (
                  <div className="assign-dropdown">
                    <div className="assign-dropdown-header">
                      <i className="fas fa-user-plus"></i> Phân công nhân viên
                    </div>
                    
                    <div className="assign-dropdown-search">
                      <i className="fas fa-search"></i>
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm nhân viên..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <div className="assign-staff-list">
                      <div 
                        className="assign-staff-item unassign" 
                        onClick={() => {
                          setSelectedStaff('unassigned');
                          handleAssign();
                        }}
                      >
                        <div className="staff-avatar">
                          <i className="fas fa-ban"></i>
                        </div>
                        <div className="staff-info">
                          <div className="staff-name">Hủy phân công</div>
                          <div className="staff-email">Gỡ nhân viên đang xử lý</div>
                        </div>
                      </div>
                      
                      {filteredStaffList.length === 0 && searchTerm && (
                        <div className="no-result">
                          <i className="fas fa-user-slash"></i>
                          <span>Không tìm thấy nhân viên</span>
                        </div>
                      )}
                      
                      {filteredStaffList.map(staff => (
                        <div 
                          key={staff.id} 
                          className={`assign-staff-item ${selectedStaff === staff.id ? 'selected' : ''}`}
                          onClick={() => setSelectedStaff(staff.id)}
                        >
                          <div className="staff-avatar">
                            <i className="fas fa-user-circle"></i>
                          </div>
                          <div className="staff-info">
                            <div className="staff-name">{staff.fullname}</div>
                            <div className="staff-email">{staff.email}</div>
                          </div>
                          {selectedStaff === staff.id && <i className="fas fa-check-circle check-icon"></i>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="assign-dropdown-actions">
                      <button 
                        onClick={handleAssign} 
                        disabled={!selectedStaff || selectedStaff === ''}
                        className="confirm-assign-btn"
                      >
                        <i className="fas fa-check"></i> Xác nhận
                      </button>
                      <button 
                        onClick={() => {
                          setShowAssign(false);
                          setSearchTerm('');
                        }} 
                        className="cancel-assign-btn"
                      >
                        <i className="fas fa-times"></i> Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <select
                value={ticket.status}
                onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                className="status-select"
              >
                <option value="received">📥 Đã nhận</option>
                <option value="open">⚙️ Đang xử lý</option>
                <option value="resolved">✅ Đã xử lý</option>
              </select>
              
              <button 
                onClick={() => onDeleteTicket(ticket.id)} 
                className="btn-delete"
                title="Xóa ticket"
              >
                <i className="fas fa-trash-alt"></i> Xóa
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .ticket-item {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .ticket-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .ticket-header {
          margin-bottom: 12px;
        }
        .ticket-subject {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          font-weight: 600;
          font-size: 1rem;
          color: #1f2937;
        }
        .ticket-subject i {
          color: #667eea;
        }
        .priority-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .priority-high {
          background: #fee2e2;
          color: #dc2626;
        }
        .priority-medium {
          background: #fed7aa;
          color: #ea580c;
        }
        .priority-low {
          background: #d1fae5;
          color: #059669;
        }
        .ticket-info {
          margin-bottom: 12px;
        }
        .ticket-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .ticket-meta i {
          margin-right: 4px;
          width: 14px;
        }
        .updated-info {
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 6px;
          margin: 8px 0;
          font-size: 0.7rem;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .assigned-info {
          background: #e0e7ff;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .assigned-info i {
          color: #667eea;
        }
        .assigned-time {
          color: #6b7280;
          font-size: 0.7rem;
        }
        .ticket-description {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0;
          display: flex;
          gap: 8px;
        }
        .ticket-description i {
          color: #9ca3af;
          margin-top: 2px;
        }
        .ticket-description p {
          margin: 0;
          font-size: 0.85rem;
          color: #4b5563;
          line-height: 1.4;
        }
        .ticket-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .rating-section {
          font-size: 0.8rem;
        }
        .rating-section span {
          margin-right: 5px;
        }
        .rating-input i {
          transition: color 0.2s;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        /* ========== ASSIGN DROPDOWN STYLES ========== */
        .assign-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .btn-assign {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          white-space: nowrap;
        }
        
        .btn-assign:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(139,92,246,0.3);
        }
        
        .assign-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border-radius: 16px;
          margin-top: 8px;
          z-index: 1000;
          min-width: 320px;
          max-width: 350px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: dropdownFadeIn 0.2s ease;
        }
        
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .assign-dropdown-header {
          padding: 14px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .assign-dropdown-search {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fafafa;
        }
        
        .assign-dropdown-search i {
          color: #9ca3af;
          font-size: 14px;
        }
        
        .assign-dropdown-search input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 0.85rem;
          padding: 6px 0;
        }
        
        .assign-dropdown-search input::placeholder {
          color: #cbd5e1;
        }
        
        .assign-staff-list {
          max-height: 280px;
          overflow-y: auto;
        }
        
        .assign-staff-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
        }
        
        .assign-staff-item:hover {
          background: #f3f4f6;
        }
        
        .assign-staff-item.selected {
          background: #e0e7ff;
        }
        
        .assign-staff-item.unassign {
          border-bottom: 1px solid #fee2e2;
        }
        
        .assign-staff-item.unassign:hover {
          background: #fee2e2;
        }
        
        .staff-avatar i {
          font-size: 32px;
          color: #9ca3af;
        }
        
        .assign-staff-item.selected .staff-avatar i {
          color: #667eea;
        }
        
        .staff-info {
          flex: 1;
        }
        
        .staff-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: #1f2937;
        }
        
        .staff-email {
          font-size: 0.7rem;
          color: #6b7280;
        }
        
        .check-icon {
          color: #10b981;
          font-size: 1.1rem;
        }
        
        .no-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 30px 20px;
          color: #9ca3af;
          text-align: center;
        }
        
        .no-result i {
          font-size: 40px;
        }
        
        .assign-dropdown-actions {
          display: flex;
          gap: 10px;
          padding: 12px 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .confirm-assign-btn, .cancel-assign-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          border: none;
        }
        
        .confirm-assign-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .confirm-assign-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(16,185,129,0.3);
        }
        
        .confirm-assign-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .cancel-assign-btn {
          background: #f3f4f6;
          color: #4b5563;
        }
        
        .cancel-assign-btn:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }
        
        /* Scrollbar */
        .assign-staff-list::-webkit-scrollbar {
          width: 5px;
        }
        
        .assign-staff-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .assign-staff-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }
        
        .assign-staff-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Responsive cho mobile */
        @media (max-width: 640px) {
          .assign-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 350px;
          }
        }
        
        /* Other action buttons */
        .status-select {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.75rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .status-select:hover {
          border-color: #667eea;
        }
        
        .btn-delete {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        
        .btn-delete:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
        
        @media (max-width: 640px) {
          .ticket-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .action-buttons {
            width: 100%;
          }
          .assign-wrapper {
            flex: 1;
          }
          .btn-assign, .status-select, .btn-delete {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default TicketItem;