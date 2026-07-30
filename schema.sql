-- ============================================================
--  BlastMail – Database Schema (MySQL)
--  Database: db_emailblast
--  Connection: mysql://root:@127.0.0.1:3308/db_emailblast
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_emailblast
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_emailblast;

-- ------------------------------------------------------------
--  Table: campaigns
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    campaign_id   VARCHAR(255)  NOT NULL UNIQUE,
    name          VARCHAR(500)  NOT NULL,
    subject       VARCHAR(1000) NOT NULL,
    content       LONGTEXT      NOT NULL,

    -- Status: DRAFT | PENDING | RUNNING | DONE | FAILED
    status        VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',

    total_target  INT           NOT NULL DEFAULT 0,
    total_sent    INT           NOT NULL DEFAULT 0,
    total_failed  INT           NOT NULL DEFAULT 0,

    cover_img     TEXT,           -- URL or base64 of campaign cover image

    started_at    DATETIME      NULL,
    finished_at   DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns (created_at DESC);

-- ------------------------------------------------------------
--  Table: spreadsheet_config
--  Stores sheet names for blast database selection
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spreadsheet_config (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sheet_name  VARCHAR(255)  NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Example seed row
-- ------------------------------------------------------------
-- INSERT INTO campaigns (campaign_id, name, subject, content)
-- VALUES (
--   'promo-januari-2026',
--   'Promo Januari 2026',
--   '🎉 Promo Spesial Januari - Diskon s/d 50%!',
--   '<p>Halo <b>{{name}}</b>, selamat datang di promo kami!</p>'
-- );
