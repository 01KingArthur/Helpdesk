import React from 'react';
import TicketItem from './TicketItem';

function TicketList({ tickets, loading, userRole, userId, staffList, onUpdateRating, onUpdateStatus, onDeleteTicket, onAssignTicket }) {
  if (loading) return <div className="loading"><i className="fas fa-spinner fa-spin"></i> Đang tải...</div>;
  return (
    <div className="ticket-list">
      <h3 className="list-title"><i className="fas fa-ticket-alt"></i> Danh sách yêu cầu ({tickets.length})</h3>
      <div className="tickets-container">
        {tickets.length === 0 ? (
          <div className="empty-state"><i className="fas fa-inbox" style={{ fontSize: '3rem' }}></i><p>Chưa có ticket nào.</p></div>
        ) : (
          tickets.map(ticket => (
            <TicketItem key={ticket.id} ticket={ticket} userRole={userRole} userId={userId} staffList={staffList}
              onUpdateRating={onUpdateRating} onUpdateStatus={onUpdateStatus} onDeleteTicket={onDeleteTicket} onAssignTicket={onAssignTicket} />
          ))
        )}
      </div>
      <style jsx>{`
        .ticket-list { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .list-title { margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        .tickets-container { max-height: 600px; overflow-y: auto; }
        .empty-state { text-align: center; padding: 3rem; color: #9ca3af; }
        .loading { text-align: center; padding: 2rem; color: #667eea; }
      `}</style>
    </div>
  );
}

export default TicketList;