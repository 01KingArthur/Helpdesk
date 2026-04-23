import React, { useState } from 'react';
import api from '../services/api';

function Register({ onSwitchToLogin }) {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({ 
    fullname: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/register', formData);
      setMessage(res.data.message);
      setEmailForOtp(formData.email);
      setStep('otp');
      setCountdown(600); // 10 phút = 600 giây
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/verify-register', { email: emailForOtp, otp });
      alert('🎉 Đăng ký thành công! Vui lòng đăng nhập.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'otp') {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="otp-header">
            <div className="otp-icon">
              <i className="fas fa-envelope-open-text"></i>
            </div>
            <h2>Xác thực email</h2>
            <p>Mã OTP đã được gửi đến</p>
            <div className="otp-email">{emailForOtp}</div>
          </div>
          
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-input-group">
              <label>Nhập mã OTP</label>
              <div className="otp-input-wrapper">
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required 
                  autoFocus
                  className="otp-input"
                />
              </div>
            </div>
            
            {countdown > 0 && (
              <div className="countdown-timer">
                <i className="fas fa-hourglass-half"></i>
                <span>Mã có hiệu lực trong: </span>
                <strong>{formatTime(countdown)}</strong>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={loading} className="verify-btn">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang xác thực...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i> Xác thực
                </>
              )}
            </button>
            
            <button type="button" onClick={() => setStep('form')} className="back-btn">
              <i className="fas fa-arrow-left"></i> Quay lại
            </button>
          </form>
        </div>
        
        <style jsx>{`
          .register-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .register-card {
            background: white;
            border-radius: 32px;
            padding: 40px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            animation: slideIn 0.4s ease;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .otp-header {
            text-align: center;
            margin-bottom: 32px;
          }
          .otp-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 25px -5px rgba(102,126,234,0.4);
          }
          .otp-icon i {
            font-size: 36px;
            color: white;
          }
          .otp-header h2 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .otp-header p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .otp-email {
            background: #f3f4f6;
            padding: 10px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            color: #667eea;
            display: inline-block;
            word-break: break-all;
          }
          .otp-input-group {
            margin-bottom: 24px;
          }
          .otp-input-group label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          .otp-input-wrapper {
            text-align: center;
          }
          .otp-input {
            width: 100%;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            font-size: 32px;
            text-align: center;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
            background: #f9fafb;
          }
          .otp-input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 4px rgba(102,126,234,0.1);
          }
          .countdown-timer {
            text-align: center;
            padding: 12px;
            background: #f3f4f6;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
            color: #374151;
          }
          .countdown-timer i {
            color: #f59e0b;
          }
          .countdown-timer strong {
            font-size: 18px;
            color: #dc2626;
            background: white;
            padding: 2px 8px;
            border-radius: 8px;
            margin-left: 4px;
          }
          .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px;
            border-radius: 12px;
            margin-bottom: 20px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .verify-btn, .back-btn {
            width: 100%;
            padding: 14px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: none;
          }
          .verify-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            margin-bottom: 12px;
          }
          .verify-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(16,185,129,0.4);
          }
          .verify-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .back-btn {
            background: #f3f4f6;
            color: #4b5563;
          }
          .back-btn:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Đăng ký tài khoản</h2>
          <p>Tham gia HelpDesk để được hỗ trợ tốt nhất</p>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label><i className="fas fa-user"></i> Họ và tên *</label>
            <input 
              type="text" 
              name="fullname" 
              placeholder="Nhập họ và tên" 
              value={formData.fullname} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-envelope"></i> Email *</label>
            <input 
              type="email" 
              name="email" 
              placeholder="example@email.com" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-phone"></i> Số điện thoại</label>
            <input 
              type="tel" 
              name="phone" 
              placeholder="Không bắt buộc" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-lock"></i> Mật khẩu *</label>
            <input 
              type="password" 
              name="password" 
              placeholder="Ít nhất 6 ký tự" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-check-circle"></i> Xác nhận mật khẩu *</label>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Nhập lại mật khẩu" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Đăng ký
              </>
            )}
          </button>
          
          <p className="login-link">
            Đã có tài khoản? 
            <button type="button" onClick={onSwitchToLogin} className="link-btn">
              Đăng nhập
            </button>
          </p>
        </form>
      </div>
      
      <style jsx>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .register-card {
          background: white;
          border-radius: 32px;
          padding: 40px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: slideIn 0.4s ease;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .register-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 25px -5px rgba(102,126,234,0.4);
        }
        .register-icon i {
          font-size: 36px;
          color: white;
        }
        .register-header h2 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .register-header p {
          color: #6b7280;
          font-size: 14px;
        }
        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        .input-group label i {
          color: #667eea;
          margin-right: 6px;
        }
        .input-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102,126,234,0.1);
        }
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .success-message {
          background: #d1fae5;
          color: #059669;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .register-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(102,126,234,0.4);
        }
        .register-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-link {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .link-btn {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          margin-left: 8px;
          transition: all 0.2s;
        }
        .link-btn:hover {
          color: #764ba2;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Register;