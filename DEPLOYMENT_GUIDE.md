# CCC Suite - Simple Deployment Guide
## GitHub → Supabase → Vercel (Easiest Path)

## 🎯 **Total Setup Time: ~20 minutes**

### Step 1: GitHub (5 minutes) ✅ You're doing this
```bash
git clone https://github.com/cellogeek/ccc-suite.git
# Copy all files to the cloned directory
git add .
git commit -m "Initial CCC Suite with Supabase integration"
git push origin main
```

### Step 2: Supabase Setup (10 minutes)
1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up** with your GitHub account
3. **Create new project**: 
   - Name: `ccc-suite`
   - Database password: (save this!)
   - Region: Choose closest to your church
4. **Wait 2 minutes** for project to initialize
5. **Copy connection details**:
   - Go to Settings → API
   - Copy `Project URL` and `anon public key`
6. **Set up database**:
   - Go to SQL Editor
   - Copy/paste the contents of `supabase-schema.sql`
   - Click "Run"
7. **Enable Google Auth** (optional):
   - Go to Authentication → Providers
   - Enable Google
   - Add your Google OAuth credentials

### Step 3: Vercel Deployment (5 minutes)
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up** with your GitHub account
3. **Import project**:
   - Click "New Project"
   - Import `cellogeek/ccc-suite`
4. **Add environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. **Deploy!** (Vercel does the rest)

### Step 4: Test Everything (2 minutes)
1. **Visit your Vercel URL**
2. **Sign in with Google** (if enabled)
3. **Generate slides** for "Mark 2:1-12"
4. **Check Supabase dashboard** to see saved data

## 🎉 **You're Live!**

### What You Get:
- ✅ **Live CCC Suite** at your-app.vercel.app
- ✅ **Automatic deployments** from GitHub
- ✅ **User authentication** with Google
- ✅ **Cloud database** with Supabase
- ✅ **$0/month cost** for church usage
- ✅ **SSL certificate** (automatic HTTPS)
- ✅ **Global CDN** (fast worldwide)

### Next Steps:
- **Custom domain**: Add your church domain in Vercel
- **ESV API**: Add real scripture data
- **Team access**: Invite media team members
- **Castr integration**: Add streaming workflow features

## 🆘 **Need Help?**
- **Supabase docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel docs**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub issues**: Create issues in your repo for tracking

## 💰 **Costs**
- **Development**: $0/month (free tiers)
- **Production**: $0-25/month (only if you exceed free limits)
- **Custom domain**: ~$12/year (optional)