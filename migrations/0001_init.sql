-- =========================================================================
-- Magic Resume · D1 初始化 schema
-- 时间: 2026-06-24
--
-- 表清单:
--   users           用户
--   sessions        会话(cookie session)
--   resumes_meta    简历元数据(正文存 COS)
--   admins          管理员标记
--   ai_quota        AI 调用配额
--   ai_logs         AI 调用日志(可选,管理员后台统计用)
--   login_attempts  登录限流(可选)
--   audit_logs      审计日志(可选)
-- =========================================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  is_banned     INTEGER NOT NULL DEFAULT 0,
  ban_reason    TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------- sessions ----------
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);

-- ---------- resumes_meta ----------
CREATE TABLE IF NOT EXISTS resumes_meta (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  template_id TEXT,
  updated_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  cos_key     TEXT NOT NULL,
  size        INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes_meta(user_id, updated_at DESC);

-- ---------- admins ----------
CREATE TABLE IF NOT EXISTS admins (
  user_id    TEXT PRIMARY KEY,
  granted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- ai_quota ----------
CREATE TABLE IF NOT EXISTS ai_quota (
  user_id       TEXT PRIMARY KEY,
  monthly_limit INTEGER NOT NULL DEFAULT 200,
  used          INTEGER NOT NULL DEFAULT 0,
  reset_at      INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- ai_logs (可选) ----------
CREATE TABLE IF NOT EXISTS ai_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,           -- 'polish' | 'grammar'
  model       TEXT NOT NULL,
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  duration_ms INTEGER,
  status      TEXT NOT NULL,           -- 'ok' | 'error'
  error_msg   TEXT,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_time ON ai_logs(user_id, created_at DESC);

-- ---------- login_attempts (可选,登录限流) ----------
CREATE TABLE IF NOT EXISTS login_attempts (
  ip          TEXT NOT NULL,
  tried_at    INTEGER NOT NULL,
  success     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, tried_at DESC);

-- ---------- audit_logs (可选,管理员操作审计) ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id   TEXT NOT NULL,            -- 操作者 user_id
  action     TEXT NOT NULL,            -- 'ban' | 'unban' | 'set_quota' | ...
  target_id  TEXT,                     -- 被操作对象 user_id
  detail     TEXT,                     -- JSON 详情
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_actor_time ON audit_logs(actor_id, created_at DESC);
