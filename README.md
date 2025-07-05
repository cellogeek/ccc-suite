# CCC Suite - Complete Church Media Management System

A comprehensive web application for Canyon Country Freewill Baptist Church's media team, combining scripture presentation tools with advanced church media management capabilities.

## 🌟 Features

### Core CCC Scripture Service
- **100% CCC Rule Compliance**: Automatic enforcement of all 8 CCC verse slide building rules
- **Intelligent Slide Generation**: Minimum 2 verses per slide with optimal 39-49pt font sizing
- **Smart Distribution**: No 3+1 splits (automatically redistributed as 2+2)
- **Orphan Prevention**: Intelligent verse grouping to prevent single verse slides
- **Multi-format Export**: RTF (Apple Pages), TXT, and PRO (ProPresenter) formats

### Advanced Song Management
- **ChordPro Import**: Full support for ChordPro formatted worship songs
- **Chord Transposition**: Real-time key changes with automatic chord conversion
- **Multiple Export Formats**: ChordPro, plain text, and ProPresenter slides
- **Song Library**: Save and manage your worship song collection

### Presentation Library
- **Cloud Storage**: Save presentations with Supabase backend
- **Search & Filter**: Find presentations by scripture reference, tags, or title
- **Cross-device Sync**: Access your presentations from any device
- **Batch Operations**: Export multiple presentations at once

### Batch Export System
- **Multiple Export Types**: Individual files, combined presentations, or ZIP archives
- **Castr Integration**: Auto-generate streaming titles and descriptions
- **Format Conversion**: Convert between RTF, TXT, and PRO formats
- **Bulk Processing**: Handle multiple presentations efficiently

### User Management
- **Authentication**: Google OAuth and email/password options
- **Settings Persistence**: Save preferences across devices
- **ESV API Integration**: Optional real scripture text with API key
- **Auto-save**: Automatic presentation backup when signed in

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: NextAuth.js with multiple providers
- **Database**: Supabase PostgreSQL
- **UI Components**: Radix UI with custom glassmorphism design
- **Animations**: Framer Motion and CSS transitions
- **Icons**: Lucide React

### Modular Page Structure
- `/` - Home dashboard with quick access to all features
- `/scripture` - CCC compliant scripture slide generation
- `/songs` - ChordPro import and chord transposition
- `/library` - Presentation management and search
- `/export` - Batch export and format conversion
- `/settings` - User preferences and API configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for cloud features)
- ESV API key (optional, for live scripture)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cellogeek/ccc-suite.git
   cd ccc-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure the following variables:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**
   ```bash
   # Run the SQL schema in your Supabase dashboard
   cat supabase-schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Creating Scripture Slides

1. **Navigate to Scripture page** (`/scripture`)
2. **Enter scripture reference** (e.g., "Mark 2:1-12")
3. **Optional**: Add ESV API key in settings for live scripture text
4. **Click "Generate Slides"** - CCC rules are automatically applied
5. **Preview slides** in the canvas view
6. **Export** in your preferred format (RTF recommended for Apple Pages)

### Managing Songs

1. **Go to Songs page** (`/songs`)
2. **Paste ChordPro content** or use the sample
3. **Click "Import"** to parse the song
4. **Transpose** to different keys as needed
5. **Export** in ChordPro, text, or ProPresenter format
6. **Save** to your song library

### Batch Export

1. **Visit Export page** (`/export`)
2. **Select presentations** you want to export
3. **Choose export format** and type (individual/combined/archive)
4. **Generate Castr content** for streaming (optional)
5. **Click "Export Selected"** to download

### Settings Configuration

1. **Access Settings page** (`/settings`)
2. **Add ESV API key** for live scripture (get free key at api.esv.org)
3. **Set default font size** (39-49pt, recommended: 46pt)
4. **Choose default export format**
5. **Configure auto-save** and other preferences
6. **Save settings** to persist across devices

## 🎯 CCC Rules Compliance

The CCC Suite enforces these 8 critical rules for scripture slides:

1. **Minimum 2 verses per slide** - Never single verse slides
2. **Font size 39-49pt** - Optimal readability (target: 46pt)
3. **No 3+1 splits** - Redistribute as 2+2 for balance
4. **Orphan prevention** - Intelligent verse grouping
5. **Intelligent sizing** - Automatic font adjustment within range
6. **Consistent formatting** - Uniform slide appearance
7. **Reference display** - Clear scripture identification
8. **Readability optimization** - Maximum text clarity

## 🔧 Development

### Project Structure
```
ccc-suite/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── scripture/       # Scripture slide generation
│   │   ├── songs/          # ChordPro song management
│   │   ├── library/        # Presentation library
│   │   ├── export/         # Batch export system
│   │   └── settings/       # User preferences
│   ├── components/         # Reusable UI components
│   ├── lib/               # Core libraries and utilities
│   ├── services/          # API and data services
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
└── supabase-schema.sql    # Database schema
```

### Key Services
- **scriptureService**: CCC rule engine and slide generation
- **firestoreService**: Cloud storage and synchronization
- **supabaseService**: User management and settings
- **penguin-service**: Export format generation

### Building for Production
```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `.next` folder to your hosting provider
3. Ensure environment variables are configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Canyon Country Freewill Baptist Church Media Team** - Original requirements and testing
- **ESV API** - Scripture text provider
- **Supabase** - Backend infrastructure
- **Vercel** - Hosting platform
- **Next.js Team** - Framework foundation

## 📞 Support

For support, email the media team or create an issue in the GitHub repository.

---

**Built with ❤️ for Canyon Country Freewill Baptist Church**

*CCC Suite v1.0 - 100% CCC Rule Compliant Scripture Slides*