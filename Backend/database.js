const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'helpdesk',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Lỗi kết nối PostgreSQL:', err.message);
    } else {
        console.log('✅ Kết nối PostgreSQL thành công!');
        release();
    }
});

// Hàm tạo bảng otp_register
async function createRegisterTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_register (
                email VARCHAR(200) PRIMARY KEY,
                otp VARCHAR(10) NOT NULL,
                expires_at BIGINT NOT NULL,
                fullname VARCHAR(200),
                phone VARCHAR(20),
                password VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng otp_register đã sẵn sàng');

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
        `);
        console.log('✅ Cột phone đã được thêm vào bảng users');
    } catch (error) {
        console.error('❌ Lỗi tạo bảng otp_register:', error.message);
    }
}

// Hàm khởi tạo database và bảng
async function initDatabase() {
    try {
        // Tạo bảng users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'staff',
                fullname VARCHAR(200) NOT NULL,
                email VARCHAR(200) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng users đã sẵn sàng');

        // Tạo bảng tickets
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(200) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                priority VARCHAR(50) DEFAULT 'Trung bình',
                description TEXT,
                status VARCHAR(50) DEFAULT 'received',
                rating INTEGER DEFAULT 0,
                user_id VARCHAR(50),
                assigned_to_id VARCHAR(50),
                assigned_to_name VARCHAR(200),
                assigned_to_email VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                assigned_at TIMESTAMP
            )
        `);
        console.log('✅ Bảng tickets đã sẵn sàng');

        // Tạo bảng otp
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp (
                email VARCHAR(200) PRIMARY KEY,
                otp VARCHAR(10) NOT NULL,
                expires_at BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng otp đã sẵn sàng');

        // Tạo bảng otp_register và thêm cột phone
        await createRegisterTables();

        // Thêm dữ liệu mẫu nếu chưa có
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('123456', 10);
            
            await pool.query(
                `INSERT INTO users (id, username, password, role, fullname, email) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['admin1', 'admin', hashedPassword, 'admin', 'Quản trị viên', 'admin@helpdesk.com']
            );
            
            await pool.query(
                `INSERT INTO users (id, username, password, role, fullname, email) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['user1', 'nguyenvana', hashedPassword, 'staff', 'Nguyễn Văn A', 'nguyenvana@email.com']
            );
            
            console.log('✅ Đã thêm dữ liệu mẫu');
        }

        console.log('\n🎉 Database khởi tạo thành công!\n');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo database:', error.message);
        throw error;
    }
}

module.exports = { pool, initDatabase };