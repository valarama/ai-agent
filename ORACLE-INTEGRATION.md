# 🔗 ORACLE SERVICE CLOUD INTEGRATION GUIDE

## ✅ Complete Oracle PHP Integration

---

## 📋 STEP 1: Oracle Custom Script

Create a new custom script in Oracle Service Cloud:

### File: `costco_agent_assist.php`

```php
<?php
/**
 * Costco Agent Assist Integration
 * Fetches latest session from GCP and displays iframe
 */

// Configuration
$gcpApiUrl = "https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/api/latest-session";
$appBaseUrl = "https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app";

// Function to get latest session ID from GCP
function getLatestSessionId($apiUrl) {
    try {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($apiUrl, false, $context);
        
        if ($response === false) {
            error_log("Failed to fetch session from GCP API");
            return null;
        }
        
        $data = json_decode($response, true);
        return $data['sessionId'] ?? null;
        
    } catch (Exception $e) {
        error_log("Error fetching session: " . $e->getMessage());
        return null;
    }
}

// Get latest session
$sessionId = getLatestSessionId($gcpApiUrl);

// Build iframe URL
if ($sessionId) {
    $iframeUrl = $appBaseUrl . "?sessionId=" . urlencode($sessionId);
} else {
    // Fallback to app without session parameter
    $iframeUrl = $appBaseUrl;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Agent Assist</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #agent-assist-frame {
            width: 100%;
            height: 100vh;
            border: none;
            display: block;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: Arial, sans-serif;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Loading Agent Assist...</div>
    <iframe 
        id="agent-assist-frame"
        src="<?php echo htmlspecialchars($iframeUrl); ?>"
        onload="document.getElementById('loading').style.display='none';">
    </iframe>
</body>
</html>
```

---

## 📋 STEP 2: Oracle Workspace Integration

### Option A: Add as Custom Widget

1. Go to Oracle Service Cloud Admin Console
2. Navigate to **Workspace** > **Custom Workspace**
3. Click **Add Widget**
4. Select **Custom Content**
5. Set URL to: `https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app`
6. Enable **Auto-refresh** (every 30 seconds)

### Option B: Embed in Incident Tab

Add to incident workspace configuration:

```xml
<CustomTab>
    <Title>Agent Assist</Title>
    <Url>costco_agent_assist.php</Url>
    <Width>400</Width>
    <Height>800</Height>
    <Refresh>30</Refresh>
</CustomTab>
```

---

## 📋 STEP 3: Test the Integration

### Test API Directly:

```bash
curl https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/api/latest-session
```

**Expected Response:**
```json
{
  "sessionId": "1195KLp4P-dQguTC75y9GF85w",
  "timestamp": "2025-10-24T20:30:00.000Z"
}
```

### Test Full URL:

```
https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/?sessionId=1195KLp4P-dQguTC75y9GF85w
```

**Should:**
- ✅ Load Agent Assist UI
- ✅ Auto-select the session from URL
- ✅ Display transcript
- ✅ Show Agent Assist suggestions

---

## 📋 STEP 4: Advanced - Pass Oracle Context

If you want to pass Oracle incident/customer info:

```php
<?php
// Get Oracle context
$incidentId = getIncidentId();
$customerId = getCustomerId();

// Build URL with additional context
$iframeUrl = $appBaseUrl . 
    "?sessionId=" . urlencode($sessionId) .
    "&incidentId=" . urlencode($incidentId) .
    "&customerId=" . urlencode($customerId);
?>
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Failed to fetch session"

**Check:**
```bash
# Verify API is accessible from Oracle server
curl -I https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/api/latest-session

# Check Oracle firewall rules
# Ensure outbound HTTPS to *.run.app is allowed
```

### Issue: "Session not loading"

**Debug:**
```php
<?php
// Add debug output
$sessionId = getLatestSessionId($gcpApiUrl);
error_log("Session ID fetched: " . ($sessionId ?? "null"));

if (!$sessionId) {
    echo "Debug: Failed to fetch session ID<br>";
    echo "API URL: " . htmlspecialchars($gcpApiUrl) . "<br>";
}
?>
```

### Issue: "Iframe blocked"

**Fix:**
1. Check Oracle CSP (Content Security Policy) settings
2. Add to allowed iframe sources:
   ```
   frame-src https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app
   ```

---

## ✅ VERIFICATION CHECKLIST

After deployment:

- [ ] API endpoint `/api/latest-session` returns valid session ID
- [ ] PHP script successfully calls GCP API
- [ ] Iframe loads in Oracle workspace
- [ ] Session auto-selects in dropdown
- [ ] Transcript displays correctly
- [ ] Agent Assist suggestions appear
- [ ] Auto-refresh works every 10 seconds
- [ ] No console errors in browser

---

## 🎯 PRODUCTION READY

Once verified:

1. **Document** the integration for your team
2. **Train** agents on using Agent Assist
3. **Monitor** API logs in Cloud Run:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=50
   ```
4. **Scale** if needed (Cloud Run auto-scales)

---

## 📞 SUPPORT

**API Endpoint:**
```
https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/api/latest-session
```

**Full App:**
```
https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app
```

**With Session:**
```
https://costco-agent-assist-6yq2rq6n7a-uc.a.run.app/?sessionId=YOUR_SESSION_ID
```

---

## 🚀 YOU'RE DONE!

Oracle now fetches the latest session from GCP and displays Agent Assist automatically!
