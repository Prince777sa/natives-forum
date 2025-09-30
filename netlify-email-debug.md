# Netlify Email Debugging Guide

## Common Netlify Email Issues

### 1. Function Timeout
- **Issue**: Netlify Functions have a 10-second timeout by default
- **Solution**: SMTP connections can be slow; check if the function times out
- **Fix**: Consider using `netlify.toml` to increase function timeout

### 2. Environment Variables Not Loading
- **Issue**: Variables set in Netlify UI not available in functions
- **Check**: Ensure variables are set in "Site Settings → Environment Variables"
- **Important**: Variables need to be re-deployed after setting

### 3. SMTP Port Restrictions
- **Issue**: Some hosting providers block certain SMTP ports
- **Your config**: Using port 465 (SSL/TLS)
- **Alternative**: Try port 587 with STARTTLS

### 4. GoDaddy SMTP Issues
- **Issue**: GoDaddy SMTP (smtpout.secureserver.net) can have auth issues
- **Check**: Ensure email account is properly configured
- **Alternative**: Consider using a dedicated email service (SendGrid, etc.)

## Debugging Steps

### Step 1: Test Environment Variables
Visit: `https://your-site.netlify.app/api/debug/email-config?key=debug123`

Expected response should show all variables as "SET"

### Step 2: Test Email Functionality
Send POST request to: `https://your-site.netlify.app/api/debug/test-email`

Body:
```json
{
  "debugKey": "debug123",
  "email": "your-test-email@example.com"
}
```

### Step 3: Check Netlify Function Logs
1. Go to Netlify Dashboard → Functions
2. Check the function logs for detailed error messages
3. Look for the enhanced logging we added (🚀, 📧, ❌ emojis)

### Step 4: Monitor during Sign-up
1. Attempt a real sign-up on your production site
2. Check Netlify function logs immediately after
3. Look for the detailed error logs we added

## Potential Solutions

### Solution 1: Switch SMTP Configuration
If GoDaddy SMTP is problematic, try these alternatives:

#### Option A: Use STARTTLS instead of SSL
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false  # This enables STARTTLS
```

#### Option B: Use Gmail SMTP (if you have Gmail)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
```

### Solution 2: Add Netlify Function Configuration
Create `netlify.toml` in project root:

```toml
[functions]
  node_bundler = "esbuild"

[build]
  functions = ".netlify/functions"

[[functions]]
  path = "/api/*"
  included_files = ["node_modules/**"]

[functions.environment]
  NODE_ENV = "production"
```

### Solution 3: Use Netlify Forms + Email Service
Consider using Netlify Forms with a webhook to a more reliable email service.

## Testing Commands

Run these after deploying the debug endpoints:

```bash
# Test environment variables
curl "https://your-site.netlify.app/api/debug/email-config?key=debug123"

# Test email sending
curl -X POST "https://your-site.netlify.app/api/debug/test-email" \
  -H "Content-Type: application/json" \
  -d '{"debugKey": "debug123", "email": "test@example.com"}'
```

## Next Steps

1. Deploy the current changes with enhanced logging
2. Test using the debug endpoints above
3. Check Netlify function logs for detailed error information
4. Based on the specific error, implement the appropriate solution