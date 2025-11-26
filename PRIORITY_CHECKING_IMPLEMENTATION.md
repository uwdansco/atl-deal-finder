# Priority-Based Destination Checking Implementation

**Date:** 2025-11-26  
**Status:** ✅ Deployed and Scheduled

---

## 🎯 Overview

Implemented intelligent priority-based checking that optimizes API usage by checking user-tracked destinations more frequently than inactive destinations.

### Problem Solved
- **Before:** Checked all 7 destinations equally, exhausting API quotas quickly
- **After:** Smart scheduling prioritizes destinations users care about
- **API Usage Reduction:** ~70% reduction in unnecessary API calls

---

## 📊 Check Modes

The `check-flight-prices` edge function now supports three modes:

### 1. **Priority Mode** (Default) 🎯
- **Purpose:** Check only destinations that users are actively tracking
- **Frequency:** Every 2 hours
- **Current Count:** 3 destinations (London, Seattle, San Diego)
- **API Calls:** 3 × 12 checks/day = **36 calls/day** = **1,080/month**

### 2. **Inactive Mode** 💤
- **Purpose:** Check destinations without active user tracking
- **Frequency:** Every 12 hours  
- **Current Count:** 4 destinations (Rome, Seoul, Singapore, Bangkok)
- **API Calls:** 4 × 2 checks/day = **8 calls/day** = **240/month**

### 3. **All Mode** 🌍
- **Purpose:** Check all active destinations (manual testing only)
- **Frequency:** Manual only
- **Use Case:** Admin testing, comprehensive system checks

---

## 🔧 Implementation Details

### Edge Function Changes

Added `check_mode` parameter support to `check-flight-prices`:

```typescript
// Request body
{
  "check_mode": "priority" | "inactive" | "all"
}

// Response includes mode information
{
  "success": true,
  "checkMode": "priority",
  "destinationsChecked": 3,
  "alertsTriggered": 0,
  "apiUsage": { ... }
}
```

### Cron Job Schedules

Two automated cron jobs are now running:

#### Job 1: Priority Destinations (Every 2 Hours)
```sql
Name: check-priority-destinations-every-2h
Schedule: 0 */2 * * * (Every 2 hours at minute 0)
Payload: {"check_mode": "priority"}
```
**Runs at:** 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00

#### Job 2: Inactive Destinations (Every 12 Hours)
```sql
Name: check-inactive-destinations-every-12h  
Schedule: 0 */12 * * * (Every 12 hours at minute 0)
Payload: {"check_mode": "inactive"}
```
**Runs at:** 00:00, 12:00

---

## 📈 API Usage Projections

### Current Usage (Priority-Based)
| Check Type | Destinations | Frequency | Daily Calls | Monthly Calls |
|------------|--------------|-----------|-------------|---------------|
| Priority   | 3            | Every 2h  | 36          | 1,080         |
| Inactive   | 4            | Every 12h | 8           | 240           |
| **TOTAL**  | **7**        | -         | **44**      | **1,320**     |

### Cost Estimates (When APIs Upgraded)

**Amadeus Production API:**
- Priority calls: 1,080 × $0.40 = **$432/month**
- Inactive calls: 240 × $0.40 = **$96/month**
- **Amadeus Total: $528/month**

**SerpApi Developer Plan:**
- Fixed cost: **$50/month** (5,000 searches included)
- Covers all fallback needs
- **SerpApi Total: $50/month**

**Grand Total: ~$578/month**

### Comparison to Old Approach
| Metric | Old (All Equal) | New (Priority) | Savings |
|--------|----------------|----------------|---------|
| Checks/day | 168 (7 × 24) | 44 | **74% reduction** |
| Monthly calls | 5,040 | 1,320 | **3,720 fewer calls** |
| Est. cost | $2,016 | $578 | **$1,438/month saved** |

---

## 🧪 Testing the System

### Manual Testing

Test each mode manually:

```bash
# Test priority mode (user-tracked only)
curl -X POST https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_mode": "priority"}'

# Test inactive mode (non-tracked destinations)
curl -X POST https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_mode": "inactive"}'

# Test all mode (everything)
curl -X POST https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_mode": "all"}'
```

### View Cron Job Status

```sql
-- View all scheduled cron jobs
SELECT * FROM cron.job ORDER BY schedule;

-- View cron job execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;

-- Check if cron jobs are enabled
SELECT * FROM cron.job 
WHERE jobname LIKE '%check-%destinations%';
```

### Disable/Enable Cron Jobs

```sql
-- Disable a job temporarily
SELECT cron.unschedule('check-priority-destinations-every-2h');

-- Re-enable with same schedule
SELECT cron.schedule(
  'check-priority-destinations-every-2h',
  '0 */2 * * *',
  $$ ... $$
);
```

---

## 🔄 Dynamic Priority Adjustment

### When Users Add Destinations

The system automatically adjusts:
- **New user tracking → Destination moves to "priority" mode**
- **Last user stops tracking → Destination moves to "inactive" mode**

No manual configuration needed! The edge function dynamically queries `user_destinations` to determine which destinations to check.

### Example Flow:
1. User adds "Rome" to their tracking
2. Next priority check (2h later) automatically includes Rome
3. User gets alerts every 2 hours for Rome
4. If user removes Rome, it goes back to 12h checks

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **API Success Rate by Mode:**
```sql
SELECT 
  price_source,
  DATE(checked_at) as date,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE price IS NOT NULL) as successful
FROM price_history
WHERE checked_at >= NOW() - INTERVAL '7 days'
GROUP BY price_source, DATE(checked_at)
ORDER BY date DESC;
```

2. **Destinations Per Mode:**
```sql
-- Priority destinations
SELECT COUNT(DISTINCT destination_id) as priority_count
FROM user_destinations WHERE is_active = true;

-- Inactive destinations  
SELECT COUNT(*) as inactive_count
FROM destinations d
WHERE d.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_destinations ud 
    WHERE ud.destination_id = d.id AND ud.is_active = true
  );
```

3. **Cron Job Success:**
```sql
SELECT 
  jobname,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname LIKE '%check-%destinations%'
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚠️ Current Limitations

### API Quotas Still Exhausted
- ⚠️ Amadeus: Still rate-limited (no calls since Nov 2)
- ⚠️ SerpApi: Still rate-limited (429 errors)
- **Action Needed:** Upgrade both API plans to test priority system

### Once APIs Are Upgraded:
- ✅ Priority destinations get fresh prices every 2 hours
- ✅ Users receive timely alerts for tracked destinations
- ✅ Inactive destinations still monitored for deal discovery
- ✅ 74% reduction in API costs vs equal checking

---

## 🚀 Next Steps

### Immediate (Blocked by API Upgrades)
1. ⚠️ Upgrade Amadeus to Production API
2. ⚠️ Upgrade SerpApi to Developer plan
3. ✅ Monitor cron job execution via Supabase logs
4. ✅ Verify priority vs inactive destinations are checked at correct intervals

### Short-Term Enhancements
- [ ] Add admin dashboard showing check frequency per destination
- [ ] Implement manual "check now" for specific destinations
- [ ] Add email alerts when cron jobs fail
- [ ] Create API usage tracking dashboard

### Long-Term Optimizations
- [ ] Implement "super priority" for destinations with multiple users
- [ ] Add time-of-day optimization (check during peak booking hours)
- [ ] Smart scheduling based on historical price volatility
- [ ] Predictive checking based on seasonal patterns

---

## 📝 Maintenance

### Updating Cron Schedules

To change check frequencies:

```sql
-- Unschedule existing job
SELECT cron.unschedule('check-priority-destinations-every-2h');

-- Create with new schedule (e.g., every 3 hours)
SELECT cron.schedule(
  'check-priority-destinations-every-3h',
  '0 */3 * * *',
  $$ ... $$
);
```

### Monitoring Cron Health

Set up alerts for failed cron jobs:
- Check `cron.job_run_details` for status='failed'
- Alert admins via edge function if no successful runs in 4 hours
- Dashboard showing last successful check per mode

---

## ✅ Success Criteria

The priority-based system is working correctly when:

- ✅ Priority destinations (user-tracked) checked every 2 hours
- ✅ Inactive destinations checked every 12 hours  
- ✅ API usage reduced by ~70%
- ✅ User-tracked destinations receive timely alerts
- ✅ No unnecessary API calls to inactive destinations
- ✅ Cron jobs running successfully without failures

---

**Implementation Complete**  
**Status: Deployed ✅**  
**Pending: API Quota Upgrades to Enable Testing**
