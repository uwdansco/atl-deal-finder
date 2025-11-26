# User-Tracked Destination Checking System

**Date:** 2025-11-26  
**Status:** ✅ Deployed and Scheduled

---

## 🎯 Overview

Simplified flight price checking to focus exclusively on destinations that users are actively tracking. This maximizes API efficiency by eliminating checks on destinations nobody is monitoring.

### Problem Solved
- **Before:** Checked all 7 destinations equally, wasting API quota on untracked destinations
- **After:** Only check the 3 destinations users are tracking
- **API Usage Reduction:** ~57% reduction in API calls

---

## 📊 Check Modes

The `check-flight-prices` edge function supports two modes:

### 1. **Priority Mode** (Default) 🎯
- **Purpose:** Check only destinations that users are actively tracking
- **Frequency:** Every 2 hours via automated cron job
- **Current Count:** 3 destinations (London, Seattle, San Diego)
- **API Calls:** 3 × 12 checks/day = **36 calls/day** = **1,080/month**

### 2. **All Mode** 🌍
- **Purpose:** Check all active destinations (manual testing only)
- **Frequency:** Manual only
- **Use Case:** Admin testing, comprehensive system checks

---

## 🔧 Implementation Details

### Edge Function

Supports `check_mode` parameter in request body:

```typescript
// Default behavior (user-tracked only)
{
  "check_mode": "priority"
}

// Manual testing (all destinations)
{
  "check_mode": "all"
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

### Cron Job Schedule

Single automated cron job running every 2 hours:

```sql
Name: check-priority-destinations-every-2h
Schedule: 0 */2 * * * (Every 2 hours at minute 0)
Payload: {"check_mode": "priority"}
```

**Runs at:** 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00

---

## 📈 API Usage & Cost

### Current Usage (User-Tracked Only)
| Check Type | Destinations | Frequency | Daily Calls | Monthly Calls |
|------------|--------------|-----------|-------------|---------------|
| User-Tracked | 3          | Every 2h  | 36          | 1,080         |

### Cost Estimates (When APIs Upgraded)

**Amadeus Production API:**
- 1,080 calls × $0.40 = **$432/month**

**SerpApi Developer Plan:**
- Fixed cost: **$50/month** (5,000 searches included)
- Covers all fallback needs

**Grand Total: ~$482/month**

### Comparison to Old Approach
| Metric | Old (All 7 Dest) | New (3 User-Tracked) | Savings |
|--------|------------------|----------------------|---------|
| Checks/day | 84 (7 × 12) | 36 (3 × 12) | **57% reduction** |
| Monthly calls | 2,520 | 1,080 | **1,440 fewer calls** |
| Est. cost | $1,008 | $482 | **$526/month saved** |

---

## 🧪 Testing the System

### Manual Testing

```bash
# Test priority mode (user-tracked only)
curl -X POST https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_mode": "priority"}'

# Test all mode (everything - manual testing only)
curl -X POST https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_mode": "all"}'
```

### View Cron Job Status

```sql
-- View scheduled cron job
SELECT * FROM cron.job WHERE jobname LIKE '%check-priority%';

-- View execution history
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE '%check-priority%'
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 🔄 Dynamic Destination Tracking

### Automatic Priority Adjustment

The system automatically adjusts based on user actions:
- **User adds destination → Included in next check (2h later)**
- **Last user removes destination → Automatically excluded from checks**

No manual configuration needed! The edge function dynamically queries `user_destinations` to determine which destinations to check.

### Example Flow:
1. User adds "Rome" to their tracking
2. Next scheduled check (2h later) automatically includes Rome
3. User receives alerts every 2 hours for Rome
4. If user removes Rome, it's excluded from future checks
5. No API quota wasted on untracked destinations

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **API Success Rate:**
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

2. **User-Tracked Destinations Count:**
```sql
SELECT COUNT(DISTINCT destination_id) as tracked_count
FROM user_destinations 
WHERE is_active = true;
```

3. **Cron Job Health:**
```sql
SELECT 
  jobname,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'check-priority-destinations-every-2h'
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚠️ Current Limitations

### API Quotas Still Exhausted
- ⚠️ Amadeus: Rate-limited (test API quota exhausted)
- ⚠️ SerpApi: Rate-limited (429 errors)
- **Action Needed:** Upgrade both API plans to enable testing

### Once APIs Are Upgraded:
- ✅ User-tracked destinations get fresh prices every 2 hours
- ✅ Users receive timely alerts for their tracked destinations
- ✅ 57% reduction in API costs vs checking all destinations
- ✅ Zero API quota wasted on untracked destinations

---

## 🚀 Next Steps

### Immediate (Blocked by API Upgrades)
1. ⚠️ Upgrade Amadeus to Production API
2. ⚠️ Upgrade SerpApi to Developer plan ($50/month)
3. ✅ Monitor cron job execution via Supabase logs
4. ✅ Verify user-tracked destinations checked every 2 hours

### Short-Term Enhancements
- [ ] Add admin dashboard showing tracked destination count
- [ ] Implement manual "check now" for specific destinations
- [ ] Add email alerts when cron job fails
- [ ] Create API usage tracking dashboard

### Long-Term Optimizations
- [ ] Implement "super priority" for destinations with multiple users
- [ ] Add time-of-day optimization (check during peak booking hours)
- [ ] Smart scheduling based on historical price volatility
- [ ] Predictive checking based on seasonal patterns

---

## 📝 Maintenance

### Updating Check Frequency

To change from every 2 hours to a different schedule:

```sql
-- Unschedule existing job
SELECT cron.unschedule('check-priority-destinations-every-2h');

-- Create with new schedule (e.g., every 3 hours)
SELECT cron.schedule(
  'check-priority-destinations-every-3h',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
      url:='https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"check_mode": "priority"}'::jsonb
  ) as request_id;
  $$
);
```

### Monitoring Cron Health

Set up alerts for failed cron jobs:
- Check `cron.job_run_details` for status='failed'
- Alert admins if no successful runs in 4 hours
- Dashboard showing last successful check timestamp

---

## ✅ Success Criteria

The user-tracked system is working correctly when:

- ✅ Only user-tracked destinations are checked automatically
- ✅ Checks happen every 2 hours as scheduled
- ✅ API usage reduced by ~57% vs checking all destinations
- ✅ Users receive timely alerts for their tracked destinations
- ✅ No API calls wasted on untracked destinations
- ✅ Cron job running successfully without failures

---

**Implementation Complete**  
**Status: Deployed ✅**  
**Pending: API Quota Upgrades to Enable Testing**
