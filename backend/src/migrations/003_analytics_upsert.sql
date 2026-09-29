DELETE FROM ai_forecasts a
USING ai_forecasts b
WHERE a.branch_id = b.branch_id AND a.item_id = b.item_id
  AND a.computed_date = b.computed_date AND a.forecast_id < b.forecast_id;

ALTER TABLE ai_forecasts
  ADD CONSTRAINT ai_forecasts_branch_item_day_key UNIQUE (branch_id, item_id, computed_date);