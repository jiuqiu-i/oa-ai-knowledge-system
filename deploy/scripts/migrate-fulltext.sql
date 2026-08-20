-- ============================================================================
-- OA 办公知识库 - 数据库索引迁移脚本（生产环境执行）
-- 用途：创建 MySQL FULLTEXT 索引以支持中文全文检索（ngram 解析器）
-- 执行：mysql -u root -p oa_knowledge_db < deploy/scripts/migrate-fulltext.sql
--
-- 说明：TypeORM 的 synchronize:true 不会自动创建带 PARSER 的 FULLTEXT 索引，
--       因此生产部署后需手动执行本脚本。检索逻辑已内置 LIKE 降级，
--       未执行本脚本不影响可用性，仅影响检索性能与召回。
-- ============================================================================

-- 1) 知识库 title + content 中文全文索引（ngram，token_size=2 适配中文短语）
CREATE FULLTEXT INDEX IF NOT EXISTS idx_kb_fulltext
  ON knowledge_base (title, content) WITH PARSER ngram;

-- 2) 辅助查询索引（若 synchronize 未自动建）
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base (category);
CREATE INDEX IF NOT EXISTS idx_kb_views    ON knowledge_base (views);
CREATE INDEX IF NOT EXISTS idx_kb_author   ON knowledge_base (author_id);

-- 3) 审批按状态/类型/紧急度统计索引（加速 Agent 工具的 GROUP BY 查询）
CREATE INDEX IF NOT EXISTS idx_approval_status  ON approvals (status);
CREATE INDEX IF NOT EXISTS idx_approval_type    ON approvals (type);
CREATE INDEX IF NOT EXISTS idx_approval_urgency  ON approvals (urgency);

-- 4) 会话按用户检索索引
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations (user_id, updated_at);

-- 验证索引创建结果
SELECT TABLE_NAME, INDEX_NAME, INDEX_TYPE
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE()
   AND INDEX_NAME LIKE 'idx_%';
