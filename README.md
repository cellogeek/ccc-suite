# CCC Suite - Church Media Tools

A comprehensive suite of tools for creating professional church media presentations with scripture slides that comply with CCC (Christian Copyright Council) guidelines.

## Features

- **Scripture Slide Generation**: Create beautiful, compliant scripture slides
- **ESV API Integration**: Fetch accurate scripture text from the ESV API
- **Organization-wide Settings**: Shared ESV API key management
- **Multiple Export Formats**: RTF, TXT, and PRO formats
- **User Authentication**: Secure login with Google OAuth or credentials
- **Cloud Database**: Persistent storage with Supabase
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ccc-suite
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- Get Supabase credentials from [supabase.com](https://supabase.com)
- Generate NEXTAUTH_SECRET at [generate-secret.vercel.app](https://generate-secret.vercel.app)
- Optional: Get Google OAuth credentials from [console.cloud.google.com](https://console.cloud.google.com)

### 3. Set Up Database
1. Create a new Supabase project
2. Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor
3. Update your `.env.local` with the Supabase URL and anon key

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

See `step-by-step-deployment.md` for detailed deployment instructions.

## Project Structure

```
ccc-suite/
├── app/                    # Next.js 13+ app directory
│   ├── api/auth/          # NextAuth API routes
│   ├── scripture/         # Scripture slide creation
│   ├── library/           # Presentation library
│   ├── export/            # Batch export tools
│   ├── settings/          # Organization settings
│   └── page.tsx           # Home page
├── components/            # Reusable React components
├── services/              # Business logic and API calls
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Key Components

### Services
- **supabaseService.ts**: Database operations and organization ESV key management
- **scriptureService.ts**: Scripture processing and CCC compliance checking

### Pages
- **Home**: Quick scripture slide generation
- **Scripture**: Advanced slide creation with customization
- **Library**: Manage saved presentations
- **Export**: Batch export functionality
- **Settings**: Organization-wide ESV API key management

## ESV API Integration

The application supports organization-wide ESV API key management:

1. Any authenticated user can set the organization's ESV API key
2. The key is shared across all users in the organization
3. Get your free ESV API key at [api.esv.org](https://api.esv.org)
4. Set it in the Settings page after logging in

## CCC Compliance

All generated slides automatically comply with CCC guidelines:
- Maximum 4 verses per slide
- Proper attribution and copyright notices
- Readable font sizes and contrast ratios
- Professional formatting standards

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the GitHub repository or contact your church's technical team.