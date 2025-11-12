# Deployment Troubleshooting Guide

## PDF Loading Issues

If PDFs are not loading in your deployed application, follow this checklist:

### 1. Verify Environment Variables

Ensure these environment variables are set in your deployment platform:

```bash
# Required for Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional for AI features
NEXT_PUBLIC_AI_URL=your-ai-endpoint
AI_SECRET=your-ai-secret
```

**Check:**
- Go to your deployment platform (Vercel, Netlify, etc.)
- Navigate to Environment Variables section
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the anon key)
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### 2. Verify PDF Worker File

The PDF.js worker file must be present in the deployed version:

**Check:**
```bash
# In your deployed app, verify this URL works:
https://your-domain.com/pdf.worker.min.mjs
```

**Fix if missing:**
1. Ensure `postinstall` script runs during build:
   ```json
   "postinstall": "npm run copy:pdf-worker"
   ```
2. Check if your deployment platform runs `postinstall` (some don't)
3. Alternatively, commit the file directly to git:
   ```bash
   npm run copy:pdf-worker
   git add public/pdf.worker.min.mjs
   git commit -m "Add PDF worker"
   ```

### 3. Configure Supabase Storage CORS

PDFs are served from Supabase Storage, which needs proper CORS configuration:

**Steps:**
1. Go to Supabase Dashboard → Storage → Configurations
2. Click on the `docs` bucket
3. Go to Configuration tab
4. Add CORS rules:

```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

**For production (recommended):**
```json
[
  {
    "allowedOrigins": ["https://your-domain.com"],
    "allowedMethods": ["GET"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

### 4. Verify Storage Bucket Configuration

**Check:**
1. Go to Supabase Dashboard → Storage
2. Verify `docs` bucket exists
3. Check bucket is **private** (for security)
4. Verify RLS policies allow reading:

```sql
-- Check existing policies
SELECT * FROM storage.policies 
WHERE bucket_id = 'docs';

-- If missing, create read policy (server-side only via service key)
CREATE POLICY "Service role can read docs"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'docs');
```

### 5. Test API Endpoint

Test the signed URL endpoint manually:

**In browser console (on your site):**
```javascript
fetch('/api/storage/signed-url?path=path/to/your/file.pdf')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

**Expected response:**
```json
{
  "url": "https://your-project.supabase.co/storage/v1/object/sign/docs/..."
}
```

**Error response:**
```json
{
  "error": "Failed to create signed URL",
  "detail": "error message"
}
```

### 6. Check Browser Console

Open browser DevTools (F12) and check for errors:

**Common errors:**

1. **"Failed to load PDF worker"**
   - Solution: Ensure `/pdf.worker.min.mjs` is accessible
   - Test: Open `https://your-domain.com/pdf.worker.min.mjs`

2. **"CORS policy blocked"**
   - Solution: Configure CORS in Supabase Storage (see #3)

3. **"Failed to create signed URL"**
   - Solution: Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly

4. **"Network error"**
   - Solution: Check Supabase project is active and not paused

### 7. Verify Build Output

**Check your build logs:**
```bash
# Should see this during build:
> doccop@0.1.0 postinstall
> npm run copy:pdf-worker

Copied .../pdfjs-dist/build/pdf.worker.min.mjs -> public/pdf.worker.min.mjs
```

### 8. Test Locally First

Before deploying, test the production build locally:

```bash
npm run build
npm start

# Visit http://localhost:3000
# Upload and view a PDF
```

If it works locally but not in deployment:
- It's likely an environment variable issue
- Or a build configuration issue

### 9. Platform-Specific Issues

#### Vercel
- Environment variables: Project Settings → Environment Variables
- Ensure variables are set for Production environment
- Redeploy after adding variables

#### Netlify
- Environment variables: Site Settings → Environment Variables
- Check if `postinstall` runs (may need to enable)
- Consider adding `public/pdf.worker.min.mjs` to git

#### Railway/Render
- Check if `postinstall` script runs
- May need to set `NODE_ENV=production`

### 10. Quick Fix Checklist

Run through this quick checklist:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in deployment
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set in deployment  
- [ ] `/pdf.worker.min.mjs` is accessible at your domain
- [ ] CORS is configured in Supabase Storage for `docs` bucket
- [ ] `docs` bucket exists and is private
- [ ] You've redeployed after making changes
- [ ] Browser console shows specific error (check DevTools)
- [ ] Production build works locally (`npm run build && npm start`)

### 11. Advanced Debugging

If issues persist, add debug logging:

**In `app/api/storage/signed-url/route.ts`:**
```typescript
export async function GET(req: NextRequest) {
  console.log("=== Signed URL Request ===");
  console.log("Path:", req.nextUrl.searchParams.get("path"));
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Has Service Key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // ... rest of code
  } catch (e) {
    console.error("Signed URL Error:", e);
    // ... rest of code
  }
}
```

Check your deployment logs for these console outputs.

### Common Solutions Summary

| Error | Solution |
|-------|----------|
| "Failed to load PDF worker" | Ensure `/pdf.worker.min.mjs` exists, commit to git if needed |
| "CORS blocked" | Configure CORS in Supabase Storage for your domain |
| "Failed to create signed URL" | Check `SUPABASE_SERVICE_ROLE_KEY` environment variable |
| "No URL returned" | Check Supabase bucket exists and is accessible |
| Works locally, not deployed | Environment variables missing in deployment |

### Still Having Issues?

1. Check deployment platform logs for errors
2. Check Supabase logs: Dashboard → Logs
3. Test with a different PDF file
4. Verify your Supabase project is not paused (free tier)
5. Check if storage quota is exceeded

### Contact Support

If none of these solutions work:
1. Share the exact error message from browser console
2. Share deployment platform logs
3. Verify all environment variables are set
4. Test the signed URL endpoint manually

