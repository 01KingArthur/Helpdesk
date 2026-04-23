require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { pool, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'helpdesk_secret_key_2025';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

app.use(cors());
app.use(express.json());

// Kiểm tra cấu hình email
if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ LỖI: Thiếu cấu hình EMAIL trong file .env');
    console.log('📌 Tạo file .env với nội dung:');
    console.log('   EMAIL_USER=your_email@gmail.com');
    console.log('   EMAIL_PASS=your_app_password');
    process.exit(1);
}

// Cấu hình Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

transporter.verify((error) => {
    if (error) {
        console.error('❌ LỖI KẾT NỐI GMAIL:', error.message);
        console.log('\n📌 CÁCH KHẮC PHỤC:');
        console.log('   1. Vào https://myaccount.google.com/security');
        console.log('   2. Bật "Xác minh 2 bước"');
        console.log('   3. Tạo "Mật khẩu ứng dụng" cho Mail\n');
    } else {
        console.log('✅ KẾT NỐI GMAIL THÀNH CÔNG!');
        console.log(`📧 Email gửi OTP: ${EMAIL_USER}\n`);
    }
});

// ============= MIDDLEWARE =============
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Không có token xác thực' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token không hợp lệ' });
        }
        req.user = user;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Yêu cầu quyền admin' });
    }
    next();
}

// ============= API GỬI OTP =============
async function sendOTPEmail(to, fullname, otp) {
    try {
        const info = await transporter.sendMail({
            from: `"HelpDesk System" <${EMAIL_USER}>`,
            to: to,
            subject: '🔐 Mã OTP đăng nhập HelpDesk',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">🔐 XÁC THỰC ĐĂNG NHẬP</h2>
                    <p>Xin chào <strong>${fullname}</strong>,</p>
                    <p>Mã OTP đăng nhập HelpDesk của bạn là:</p>
                    <div style="font-size: 42px; font-weight: bold; color: #764ba2; background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
                        ${otp}
                    </div>
                    <p>Mã này có hiệu lực trong <strong>60 giây</strong>.</p>
                    <p>Nếu bạn không yêu cầu đăng nhập, vui lòng bỏ qua email này.</p>
                </div>
            `
        });
        console.log(`✅ Email đã gửi: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi gửi email: ${error.message}`);
        return false;
    }
}

app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        const usersData = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (usersData.rows.length === 0) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
        }
        
        const user = usersData.rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 60000;
        
        await pool.query(
            `INSERT INTO otp (email, otp, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3`,
            [email, otp, expiresAt]
        );
        
        sendOTPEmail(email, user.fullname, otp);
        console.log(`📧 OTP cho ${email}: ${otp}`);
        
        res.json({ message: 'Đã gửi OTP thành công', email: email });
    } catch (error) {
        console.error('Lỗi gửi OTP:', error);
        res.status(500).json({ message: 'Lỗi gửi OTP' });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const result = await pool.query('SELECT * FROM otp WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Mã OTP không chính xác' });
        }
        
        const otpRecord = result.rows[0];
        if (otpRecord.otp !== otp) {
            return res.status(401).json({ message: 'Mã OTP không chính xác' });
        }
        if (Date.now() > otpRecord.expires_at) {
            return res.status(401).json({ message: 'Mã OTP đã hết hạn' });
        }
        
        await pool.query('DELETE FROM otp WHERE email = $1', [email]);
        
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, fullname: user.fullname, email: user.email },
            SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        console.log(`✅ Đăng nhập thành công: ${user.fullname} (${user.role})`);
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullname: user.fullname,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Lỗi xác thực OTP:', error);
        res.status(500).json({ message: 'Lỗi xác thực OTP' });
    }
});

// ============= API ĐĂNG KÝ =============
app.post('/api/register', async (req, res) => {
    const { fullname, email, phone, password, confirmPassword } = req.body;
    
    if (!fullname || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    try {
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email đã được đăng ký' });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO otp_register (email, otp, expires_at, fullname, phone, password)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO UPDATE SET otp=$2, expires_at=$3, fullname=$4, phone=$5, password=$6`,
            [email, otp, expiresAt, fullname, phone || null, hashedPassword]
        );
        
        await sendOTPEmail(email, fullname, otp);
        console.log(`📧 OTP đăng ký cho ${email}: ${otp}`);
        
        res.json({ message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực trong vòng 10 phút.', email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi đăng ký' });
    }
});

app.post('/api/verify-register', async (req, res) => {
    const { email, otp } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM otp_register WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Yêu cầu đăng ký không hợp lệ hoặc đã hết hạn' });
        }
        
        const record = result.rows[0];
        if (record.otp !== otp) {
            return res.status(400).json({ message: 'Mã OTP không chính xác' });
        }
        if (Date.now() > record.expires_at) {
            return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
        }
        
        const userId = 'cust_' + Date.now();
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);
        
        // QUAN TRỌNG: role là 'customer' cho khách hàng đăng ký
        await pool.query(
            `INSERT INTO users (id, username, password, role, fullname, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, username, record.password, 'customer', record.fullname, email, record.phone]
        );
        
        await pool.query('DELETE FROM otp_register WHERE email = $1', [email]);
        
        console.log(`✅ Đăng ký thành công: ${email} - ${record.fullname} (khách hàng)`);
        res.json({ message: 'Đăng ký thành công. Vui lòng đăng nhập.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xác thực đăng ký' });
    }
});

// ============= API QUẢN LÝ NHÂN VIÊN =============
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role, fullname, email, phone FROM users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách người dùng' });
    }
});

app.get('/api/staff', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, fullname, email FROM users WHERE role = $1', ['staff']);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhân viên' });
    }
});

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, password, fullname, email, role } = req.body;
        
        if (!username || !password || !fullname || !email) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        const existing = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Date.now().toString();
        
        await pool.query(
            `INSERT INTO users (id, username, password, role, fullname, email)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, username, hashedPassword, role || 'staff', fullname, email]
        );
        
        console.log(`✅ Đã tạo nhân viên: ${username} - ${fullname}`);
        res.status(201).json({ id, username, role, fullname, email });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo người dùng' });
    }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ message: 'Không thể xóa chính mình' });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        console.log(`✅ Đã xóa người dùng ID: ${id}`);
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa người dùng' });
    }
});

// ============= API TICKETS =============
app.get('/api/tickets', authenticateToken, async (req, res) => {
    try {
        let query = `SELECT * FROM tickets ORDER BY created_at DESC`;
        let params = [];
        
        if (req.user.role !== 'admin') {
            query = `SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC`;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách ticket' });
    }
});

app.get('/api/tickets/my-tickets', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT * FROM tickets WHERE user_id = $1 OR assigned_to_id = $1 ORDER BY created_at DESC`;
        const result = await pool.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách ticket' });
    }
});

app.get('/api/tickets/staff/:staffId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { staffId } = req.params;
        const result = await pool.query('SELECT * FROM tickets WHERE assigned_to_id = $1', [staffId]);
        
        const tickets = result.rows;
        const stats = {
            total: tickets.length,
            received: tickets.filter(t => t.status === 'received').length,
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            avgRating: tickets.length > 0 
                ? (tickets.reduce((sum, t) => sum + (t.rating || 0), 0) / tickets.length).toFixed(1)
                : 0
        };
        
        res.json({ tickets, stats });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy tickets staff' });
    }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
    try {
        const { name, email, subject, priority, description } = req.body;
        const id = Date.now().toString();
        
        await pool.query(
            `INSERT INTO tickets (id, name, email, subject, priority, description, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [id, name, email, subject, priority, description, req.user.id]
        );
        
        const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        console.log(`✅ Ticket mới: ${subject} - ${name}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo ticket' });
    }
});

app.put('/api/tickets/:id/rating', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        
        if (rating < 1 || rating > 3) {
            return res.status(400).json({ message: 'Đánh giá sao phải từ 1 đến 3' });
        }
        
        await pool.query(
            `UPDATE tickets SET rating = $1, status = 'resolved', updated_at = NOW() WHERE id = $2`,
            [rating, id]
        );
        
        const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        console.log(`⭐ Đánh giá ${rating} sao cho ticket: ${id}`);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật đánh giá' });
    }
});

app.put('/api/tickets/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['received', 'open', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        
        await pool.query(`UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
        const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        console.log(`✅ Cập nhật trạng thái ticket ${id}: ${status}`);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
});

app.put('/api/tickets/:id/assign', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;
        
        console.log(`📌 Đang phân công ticket ${id} cho nhân viên: ${assignedTo}`);
        
        if (!assignedTo || assignedTo === 'unassigned') {
            await pool.query(
                `UPDATE tickets SET assigned_to_id = NULL, assigned_to_name = NULL, assigned_to_email = NULL, assigned_at = NULL, updated_at = NOW() WHERE id = $1`,
                [id]
            );
            console.log(`✅ Đã hủy phân công ticket ${id}`);
        } else {
            const staffResult = await pool.query('SELECT * FROM users WHERE id = $1', [assignedTo]);
            if (staffResult.rows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
            }
            const staff = staffResult.rows[0];
            
            await pool.query(
                `UPDATE tickets SET assigned_to_id = $1, assigned_to_name = $2, assigned_to_email = $3, assigned_at = NOW(), updated_at = NOW() WHERE id = $4`,
                [assignedTo, staff.fullname, staff.email, id]
            );
            console.log(`✅ Đã phân công ticket ${id} cho ${staff.fullname}`);
        }
        
        const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Lỗi phân công:', error);
        res.status(500).json({ message: 'Lỗi phân công ticket' });
    }
});

app.delete('/api/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
        console.log(`🗑️ Đã xóa ticket: ${id}`);
        res.json({ message: 'Xóa ticket thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa ticket' });
    }
});

// ============= API DASHBOARD =============
app.get('/api/dashboard/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        const tickets = result.rows;
        
        const stats = {
            total: tickets.length,
            received: tickets.filter(t => t.status === 'received').length,
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            avgRating: tickets.length > 0 
                ? (tickets.reduce((sum, t) => sum + (t.rating || 0), 0) / tickets.length).toFixed(1)
                : 0,
            byPriority: [
                { name: 'Cao', value: tickets.filter(t => t.priority === 'Cao').length, color: '#ef4444' },
                { name: 'Trung bình', value: tickets.filter(t => t.priority === 'Trung bình').length, color: '#f59e0b' },
                { name: 'Thấp', value: tickets.filter(t => t.priority === 'Thấp').length, color: '#10b981' }
            ],
            recentTickets: tickets.slice(0, 10)
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Lỗi dashboard:', error);
        res.status(500).json({ message: 'Lỗi lấy dashboard' });
    }
});

app.get('/api/dashboard/admin', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { staff = 'all' } = req.query;
        
        let query = `SELECT * FROM tickets ORDER BY created_at DESC`;
        let params = [];
        
        if (staff !== 'all') {
            query = `SELECT * FROM tickets WHERE assigned_to_id = $1 ORDER BY created_at DESC`;
            params = [staff];
        }
        
        const result = await pool.query(query, params);
        const tickets = result.rows;
        
        const staffResult = await pool.query(
            `SELECT u.id, u.fullname, 
                COUNT(t.id) as total,
                SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                AVG(t.rating) as avg_rating
             FROM users u
             LEFT JOIN tickets t ON t.assigned_to_id = u.id
             WHERE u.role = 'staff'
             GROUP BY u.id, u.fullname`
        );
        
        const staffPerformance = staffResult.rows.map(s => ({
            id: s.id,
            name: s.fullname,
            total: parseInt(s.total) || 0,
            resolved: parseInt(s.resolved) || 0,
            avgRating: parseFloat(s.avg_rating) || 0
        }));
        
        const stats = {
            total: tickets.length,
            received: tickets.filter(t => t.status === 'received').length,
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            avgRating: tickets.length > 0 
                ? (tickets.reduce((sum, t) => sum + (t.rating || 0), 0) / tickets.length).toFixed(1)
                : 0,
            byPriority: [
                { name: 'Cao', value: tickets.filter(t => t.priority === 'Cao').length, color: '#ef4444' },
                { name: 'Trung bình', value: tickets.filter(t => t.priority === 'Trung bình').length, color: '#f59e0b' },
                { name: 'Thấp', value: tickets.filter(t => t.priority === 'Thấp').length, color: '#10b981' }
            ],
            staffPerformance: staffPerformance,
            recentTickets: tickets.slice(0, 10)
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Lỗi dashboard admin:', error);
        res.status(500).json({ message: 'Lỗi lấy dashboard' });
    }
});

// ============= KHỞI ĐỘNG SERVER =============
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 HelpDesk Server đang chạy tại http://localhost:${PORT}`);
        console.log('=' .repeat(60));
        console.log('📧 CẤU HÌNH GMAIL:');
        console.log(`   Email gửi: ${EMAIL_USER}`);
        console.log('\n📌 TÀI KHOẢN MẶC ĐỊNH:');
        console.log(`   Admin: admin@helpdesk.com / 123456`);
        console.log(`   Staff: nguyenvana@email.com / 123456`);
        console.log(`   Khách hàng: đăng ký mới qua form đăng ký`);
        console.log('=' .repeat(60));
        console.log('\n💡 CÁC TRẠNG THÁI TICKET:');
        console.log('   📥 Đã nhận (received) → ⚙️ Đang xử lý (open) → ✅ Đã xử lý (resolved)\n');
    });
}

startServer();