-- Numberly manual database setup
-- If your MySQL user cannot CREATE DATABASE, create the database in your hosting panel first
-- and then run this script after selecting that database.

CREATE DATABASE IF NOT EXISTS `numberly`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `numberly`;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) NOT NULL DEFAULT '#0ea5e9',
  age_group VARCHAR(40) NOT NULL DEFAULT '5-7',
  total_xp INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 1,
  last_lesson_on DATE NULL,
  hearts INT NOT NULL DEFAULT 5,
  daily_goal INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT PRIMARY KEY,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
  routine_mode BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_voice VARCHAR(40) NOT NULL DEFAULT 'gentle',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS level_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level_id VARCHAR(80) NOT NULL,
  best_score INT NOT NULL DEFAULT 0,
  stars_earned INT NOT NULL DEFAULT 0,
  times_completed INT NOT NULL DEFAULT 0,
  last_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_level_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_level UNIQUE (user_id, level_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level_id VARCHAR(80) NOT NULL,
  correct_answers INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  hearts_left INT NOT NULL DEFAULT 5,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  object_name VARCHAR(120) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  source_type VARCHAR(30) NOT NULL DEFAULT 'manual',
  manual_tags JSON NULL,
  vision_labels JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NULL,
  level_id VARCHAR(80) NOT NULL,
  title VARCHAR(120) NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
  source_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  review_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  prompt TEXT NOT NULL,
  narration TEXT NOT NULL,
  choices JSON NOT NULL,
  answer VARCHAR(255) NOT NULL,
  visual_type VARCHAR(80) NOT NULL,
  template_payload JSON NULL,
  tags JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_templates_asset FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE SET NULL
);

-- Demo account
-- email: demo@numberly.app
-- password: demo123
INSERT INTO users (id, display_name, email, password_hash, avatar_color, age_group, total_xp, streak_days, last_lesson_on, hearts, daily_goal)
VALUES
  (1, 'Demo Learner', 'demo@numberly.app', '7f911c18d13e9bc3b98100c8fffbb39e2cef8a3bf08692b416fba8d461ea04906d0f825cdcdffc5c3f728c60b7c0b470f542a504cacb7fb96903aeb2afec1f4e', '#0ea5e9', '10-12', 180, 4, CURRENT_DATE, 5, 5)
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  password_hash = VALUES(password_hash),
  avatar_color = VALUES(avatar_color),
  age_group = VALUES(age_group),
  total_xp = VALUES(total_xp),
  streak_days = VALUES(streak_days),
  last_lesson_on = VALUES(last_lesson_on),
  hearts = VALUES(hearts),
  daily_goal = VALUES(daily_goal);

INSERT INTO user_settings (user_id, sound_enabled, high_contrast, routine_mode, preferred_voice)
VALUES
  (1, TRUE, FALSE, TRUE, 'gentle')
ON DUPLICATE KEY UPDATE
  sound_enabled = VALUES(sound_enabled),
  high_contrast = VALUES(high_contrast),
  routine_mode = VALUES(routine_mode),
  preferred_voice = VALUES(preferred_voice);

INSERT INTO level_progress (user_id, level_id, best_score, stars_earned, times_completed, last_accuracy)
VALUES
  (1, 'counting-1', 60, 3, 3, 100.00),
  (1, 'counting-2', 48, 2, 1, 80.00)
ON DUPLICATE KEY UPDATE
  best_score = VALUES(best_score),
  stars_earned = VALUES(stars_earned),
  times_completed = VALUES(times_completed),
  last_accuracy = VALUES(last_accuracy);

INSERT INTO game_sessions (user_id, level_id, correct_answers, total_questions, xp_earned, hearts_left)
VALUES
  (1, 'counting-1', 5, 5, 60, 5),
  (1, 'counting-2', 4, 5, 48, 4);

INSERT INTO media_assets (title, object_name, image_path, source_type, manual_tags, vision_labels)
VALUES
  ('Red Apple', 'apple', '/sample-assets/apple.png', 'manual', JSON_ARRAY('fruit', 'red', 'counting'), JSON_ARRAY()),
  ('Yellow Duck', 'duck', '/sample-assets/duck.png', 'manual', JSON_ARRAY('animal', 'yellow', 'counting'), JSON_ARRAY())
ON DUPLICATE KEY UPDATE
  object_name = VALUES(object_name),
  manual_tags = VALUES(manual_tags),
  vision_labels = VALUES(vision_labels);

INSERT INTO question_templates (asset_id, level_id, title, difficulty, source_type, review_status, prompt, narration, choices, answer, visual_type, template_payload, tags)
VALUES
  (1, 'emotion-match-1', 'Happy Face Match', 'easy', 'manual', 'approved', 'Which face looks happy?', 'Look at the faces. Pick the happy one.', JSON_ARRAY('Happy', 'Sad', 'Angry'), 'Happy', 'choiceOnly', JSON_OBJECT(), JSON_ARRAY('emotion', 'happy')),
  (2, 'routine-order-1', 'Morning Routine', 'easy', 'manual', 'approved', 'What comes first in the morning routine?', 'Pick the first step in the routine.', JSON_ARRAY('Wake up', 'Go to sleep', 'Eat dinner'), 'Wake up', 'choiceOnly', JSON_OBJECT(), JSON_ARRAY('routine', 'sequence'))
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  narration = VALUES(narration);
