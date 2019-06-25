CREATE TABLE voices (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(40) UNIQUE NOT NULL,
  file_id_cached VARCHAR(40),
  hash_sha256 VARCHAR(64),
  owner_id INTEGER NOT NULL,
  title VARCHAR(40),
  duration INTEGER,
  size INTEGER,
  active BOOLEAN NOT NULL DEFAULT 'f'
);

-- Your SQL goes here
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  message_type INTEGER NOT NULL,
  task VARCHAR(15) NOT NULL,
  content VARCHAR(40) NOT NULL,
  fullfilled BOOLEAN NOT NULL DEFAULT 'f'
);

CREATE TABLE voice_permissions (
  id SERIAL PRIMARY KEY,
  voice_id SERIAL,
  owner_chat_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE file_source (
  id SERIAL PRIMARY KEY,
  mime_type VARCHAR(20) NOT NULL,
  hash_sha256 VARCHAR(64) NOT NULL,
  original_id VARCHAR(40) NOT NULL,
  original_size INTEGER,
  voice_id SERIAL
);

CREATE TABLE kek_user (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_role (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role_name VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CREATE TABLE voices (
--   id SERIAL PRIMARY KEY,
--   file_id VARCHAR(40) UNIQUE NOT NULL,
--   file_id_cached VARCHAR(40),
--   hash_sha256 VARCHAR(64),
--   owner_id INTEGER NOT NULL,
--   title VARCHAR(40),
--   duration INTEGER,
--   size INTEGER,
--   active BOOLEAN NOT NULL DEFAULT 'f'
-- );

-- -- Your SQL goes here
-- CREATE TABLE tasks (
--   id SERIAL PRIMARY KEY,
--   chat_id INTEGER NOT NULL,
--   message_type INTEGER NOT NULL,
--   task VARCHAR(15) NOT NULL,
--   content VARCHAR(40) NOT NULL,
--   fullfilled BOOLEAN NOT NULL DEFAULT 'f'
-- );

-- CREATE TABLE voice_permissions (
--   id SERIAL PRIMARY KEY,
--   voice_id SERIAL,
--   owner_chat_id INTEGER NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
--   FOREIGN KEY ("voice_id") REFERENCES voices(id)
-- );

-- CREATE TABLE file_source (
--   id SERIAL PRIMARY KEY,
--   mime_type VARCHAR(20) NOT NULL,
--   hash_sha256 VARCHAR(64) NOT NULL,
--   original_id VARCHAR(40) NOT NULL,
--   original_size INTEGER,
--   voice_id SERIAL,
--   FOREIGN KEY ("voice_id") REFERENCES voices(id)
-- );

-- CREATE TABLE kek_user (
--   id SERIAL PRIMARY KEY,
--   chat_id INTEGER NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT NOW()
-- );

-- CREATE TABLE user_role (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL,
--   role_name VARCHAR(10) NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
--   FOREIGN KEY ("user_id") REFERENCES kek_user(id)
-- );