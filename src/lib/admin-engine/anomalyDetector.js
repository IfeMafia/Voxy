import db from '../../lib/db.js';

/**
 * Detects usage anomalies by comparing recent usage against historical averages.
 */
export async function detectUsageAnomaly(businessId, type, currentCost) {
  try {
    // Get average hourly cost for the last 24 hours
    const avgQuery = `
      SELECT AVG(cost_sum) as avg_hourly_cost
      FROM (
        SELECT SUM(cost_estimate) as cost_sum
        FROM usage_logs
        WHERE business_id = $1 
        AND type = $2
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY date_trunc('hour', created_at)
      ) hourly_stats
    `;
    
    const avgRes = await db.query(avgQuery, [businessId, type]);
    const avgHourlyCost = parseFloat(avgRes.rows[0]?.avg_hourly_cost || 0);

    // Get usage in the last 1 hour
    const recentQuery = `
      SELECT SUM(cost_estimate) as recent_cost
      FROM usage_logs
      WHERE business_id = $1
      AND type = $2
      AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    const recentRes = await db.query(recentQuery, [businessId, type]);
    const recentCost = parseFloat(recentRes.rows[0]?.recent_cost || 0) + currentCost;

    // Threshold: If recent hourly cost is > 3x the 24h average AND > $0.50 (to avoid tiny spikes)
    const isAnomaly = avgHourlyCost > 0 && recentCost > (avgHourlyCost * 3) && recentCost > 0.50;

    if (isAnomaly) {
      return {
        isAnomaly: true,
        reason: `Usage spike detected: Recent hourly ${type} cost (₦${recentCost.toFixed(2)}) is over 3x the 24h average (₦${avgHourlyCost.toFixed(2)}).`,
        severity: recentCost > 5 ? 'high' : 'medium'
      };
    }

    return { isAnomaly: false };
  } catch (error) {
    console.error('[AnomalyDetector] Error:', error);
    return { isAnomaly: false };
  }
}

/**
 * Checks for abnormal STT/TTS durations or token counts.
 */
export function validateRequestMetrics(type, metrics) {
  if (type === 'llm' && metrics.tokensUsed > 8000) {
    return { isAnomaly: true, reason: 'Excessive token usage in single request', severity: 'low' };
  }
  if (type === 'stt' && metrics.duration > 300) { // 5 mins
    return { isAnomaly: true, reason: 'Abnormally long STT duration', severity: 'low' };
  }
  return { isAnomaly: false };
}
