-- 数据库迁移脚本 v2
-- 新增登录安全相关功能

USE nestjs_auth;

-- 1. 用户表新增字段
ALTER TABLE users
    ADD COLUMN login_attempts INT DEFAULT 0 COMMENT '登录失败次数' AFTER role,
    ADD COLUMN locked_until DATETIME DEFAULT NULL COMMENT '锁定截止时间' AFTER login_attempts,
    ADD COLUMN last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间' AFTER locked_until,
    ADD COLUMN last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP' AFTER last_login_at;

-- 2. 创建刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE COMMENT '刷新令牌',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    expires_at DATETIME NOT NULL COMMENT '过期时间',
    is_revoked BOOLEAN DEFAULT FALSE COMMENT '是否已撤销',
    user_agent VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
    ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- 3. 更新管理员密码为符合新强度要求的密码 (Admin@123)
UPDATE users SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqDlgjsIelOaFPVVm.9R.IXR7RsOi' WHERE username = 'admin';

-- 4. 更新测试用户密码为符合新强度要求的密码 (User@123)
UPDATE users SET password = '$2a$10$WCCCHNvL2QmNKH7X0QY16.Hzw9I7wNKuLqB9OzJJP9fQr0P7VVBai' WHERE username = 'testuser';
