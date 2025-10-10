#!/bin/bash

# Test the actual query that backend runs
# Run this on your VPS

echo "=================================="
echo "Testing Backend Query"
echo "=================================="
echo ""

echo "Running the actual query from backend..."
docker exec -i pm_postgres psql -U pm_user -d project_manager << 'EOF'
SELECT
  t.*,
  u1.first_name || ' ' || u1.last_name as assigned_user_name,
  u1.email as assigned_user_email,
  u2.first_name || ' ' || u2.last_name as created_user_name,
  g.name as assigned_group_name,
  g.color as assigned_group_color,
  COUNT(DISTINCT st.id) as subtask_count,
  COUNT(DISTINCT td.id) as dependency_count
FROM tasks t
LEFT JOIN users u1 ON t.assigned_to = u1.id
INNER JOIN users u2 ON t.created_by = u2.id
LEFT JOIN groups g ON t.assigned_group_id = g.id AND g.deleted_at IS NULL
LEFT JOIN tasks st ON st.parent_task_id = t.id AND st.deleted_at IS NULL
LEFT JOIN task_dependencies td ON td.task_id = t.id
WHERE t.project_id = 2 AND t.deleted_at IS NULL
GROUP BY t.id, u1.first_name, u1.last_name, u1.email, u2.first_name, u2.last_name, g.name, g.color
ORDER BY t.start_date ASC NULLS LAST, t.created_at DESC
LIMIT 1;
EOF

echo ""
echo "=================================="
echo "Check if 'color' column appears in the output above"
echo "=================================="
