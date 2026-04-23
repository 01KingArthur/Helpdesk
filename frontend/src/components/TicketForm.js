import React, { useState } from 'react';

function TicketForm({ onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', priority: 'Trung bình', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject) {
      alert('Vui lòng điền đầy đủ họ tên, email và tiêu đề!');
      return;
    }
    setSubmitting(true);
    await onSubmit(formData);
    setFormData({ name: '', email: '', subject: '', priority: 'Trung bình', description: '' });
    setSubmitting(false);
  };

  return (
    <div className="ticket-form">
      <h3 className="form-title"><i className="fas fa-plus-circle"></i> Gửi yêu cầu hỗ trợ</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>Họ và tên *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
        <div className="form-group"><label>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
        <div className="form-group"><label>Tiêu đề *</label><input type="text" name="subject" value={formData.subject} onChange={handleChange} required /></div>
        <div className="form-group"><label>Mức độ ưu tiên</label><select name="priority" value={formData.priority} onChange={handleChange}><option>Thấp</option><option>Trung bình</option><option>Cao</option></select></div>
        <div className="form-group"><label>Mô tả chi tiết</label><textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Mô tả chi tiết vấn đề..."></textarea></div>
        <button type="submit" disabled={submitting} className="submit-btn"><i className="fas fa-paper-plane"></i> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
      </form>
      <style jsx>{`
        .ticket-form { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .form-title { font-size: 1.3rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
        .submit-btn { width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .submit-btn:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}

export default TicketForm;