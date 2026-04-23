import React, { useState } from 'react';
import api from '../services/api';

function LoginOTP({ onLogin, onSwitchToRegister }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/send-otp', { email });
      setStep('otp');
      setCountdown(60);
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
      setError(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/verify-otp', { email, otp });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <i className="fas fa-headset"></i>
            <h2>HelpDesk Việt</h2>
            <p>Đăng nhập bằng email</p>
          </div>
          
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Email đăng nhập</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhập email của bạn"
                required
              />
            </div>
            
            <div className="demo-accounts">
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>📧 Tài khoản demo:</p>
              <code>admin@helpdesk.com</code> (Admin)<br/>
              <code>nguyenvana@email.com</code> (Nhân viên)
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
            
            <button type="button" onClick={onSwitchToRegister} className="register-link">
              Chưa có tài khoản? Đăng ký
            </button>
          </form>
        </div>
        
        <style jsx>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .login-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .login-header i {
            font-size: 3rem;
            color: #667eea;
            margin-bottom: 1rem;
          }
          .login-header h2 {
            color: #333;
            margin-bottom: 0.5rem;
          }
          .login-header p {
            color: #6b7280;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #555;
          }
          .form-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
          }
          .form-group input:focus {
            outline: none;
            border-color: #667eea;
          }
          .demo-accounts {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
            text-align: center;
          }
          .demo-accounts code {
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
          .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
          }
          .login-btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .login-btn:hover {
            transform: translateY(-2px);
          }
          .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .register-link {
            background: none;
            border: none;
            color: #667eea;
            margin-top: 12px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            width: 100%;
            text-align: center;
            transition: all 0.2s;
          }
          .register-link:hover {
            color: #764ba2;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-icon">
            <i className="fas fa-key"></i>
          </div>
          <h2>Xác thực OTP</h2>
          <p>Mã xác thực đã được gửi đến</p>
          <div className="otp-email">{email}</div>
        </div>
        
        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label>Nhập mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              autoFocus
              className="otp-input"
            />
          </div>
          
          {countdown > 0 && (
            <div className="countdown">
              <i className="fas fa-clock"></i>
              Mã có hiệu lực: <span>{countdown}</span> giây
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="verify-btn">
            {loading ? 'Đang xác thực...' : 'Xác nhận đăng nhập'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
            }}
            className="back-btn"
          >
            ← Quay lại nhập email
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .otp-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .otp-card {
          background: white;
          border-radius: 32px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        
        .otp-header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .otp-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        
        .otp-icon i {
          font-size: 32px;
          color: white;
        }
        
        .otp-header h2 {
          font-size: 24px;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .otp-header p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .otp-email {
          background: #f3f4f6;
          padding: 8px 16px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
          display: inline-block;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .otp-input {
          width: 100%;
          padding: 14px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 28px;
          text-align: center;
          letter-spacing: 8px;
          font-family: monospace;
          transition: all 0.3s;
        }
        
        .otp-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        
        .countdown {
          text-align: center;
          padding: 10px;
          background: #f3f4f6;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #374151;
        }
        
        .countdown span {
          font-weight: bold;
          color: #dc2626;
          font-size: 16px;
        }
        
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
        }
        
        .verify-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 12px;
        }
        
        .verify-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(16,185,129,0.3);
        }
        
        .verify-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .back-btn {
          width: 100%;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          padding: 10px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .back-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
}

export default LoginOTP;