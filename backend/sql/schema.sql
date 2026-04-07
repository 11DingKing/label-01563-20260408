-- NestJS Auth System Database Schema
-- 数据库: nestjs_auth

-- 创建数据库
CREATE DATABASE IF NOT EXISTS nestjs_auth DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nestjs_auth;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    role TINYINT DEFAULT 0 COMMENT '角色: 0普通用户 1管理员',
    login_attempts INT DEFAULT 0 COMMENT '登录失败次数',
    locked_until DATETIME DEFAULT NULL COMMENT '锁定截止时间',
    last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 刷新令牌表
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

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL COMMENT '操作用户ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    module VARCHAR(50) NOT NULL COMMENT '模块名称',
    method VARCHAR(10) NOT NULL COMMENT '请求方法',
    path VARCHAR(255) NOT NULL COMMENT '请求路径',
    params TEXT DEFAULT NULL COMMENT '请求参数',
    result TEXT DEFAULT NULL COMMENT '响应结果',
    ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    user_agent VARCHAR(255) DEFAULT NULL COMMENT '用户代理',
    duration INT DEFAULT 0 COMMENT '耗时(ms)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0失败 1成功',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_action (action),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 插入默认管理员账号 (密码: admin123)
-- bcrypt hash 由 bcrypt.hashSync('admin123', 10) 生成
INSERT INTO users (username, password, email, nickname, status, role)
VALUES (
    'admin',
    '$2a$10$JVsZMkHC0umyRUPqzkRVb.DUad9L72jxtJNdTiPoqnYuQfNwHRbv6',
    'admin@example.com',
    '系统管理员',
    1,
    1
);

-- 插入测试普通用户 (密码: user123456)
-- bcrypt hash 由 bcrypt.hashSync('user123456', 10) 生成
INSERT INTO users (username, password, email, nickname, status, role)
VALUES (
    'testuser',
    '$2a$10$RQN6S7zfx/rKx5IMhBstXe0C4HxgoYN01pb6p/OV3AKZN/SkfYu8q',
    'testuser@example.com',
    '测试用户',
    1,
    0
);
