-- Gravity Game — MySQL Schema
-- Run once: mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS gravity
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gravity;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Scores table (keeps all scores; queries limit to top 10)
CREATE TABLE IF NOT EXISTS scores (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(50)  NOT NULL,
  score     INT          NOT NULL,
  played_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_score_desc (score DESC)
);
