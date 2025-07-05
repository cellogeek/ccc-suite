# ChordPro Worship Team Features

## Overview

The CCC Suite now includes comprehensive ChordPro functionality for worship teams, making it a complete solution for both scripture presentations and chord chart management.

## Features Added

### 🎵 **Song Library Management**
- **ChordPro Editor**: Full-featured editor with syntax highlighting help
- **Song Metadata**: Title, artist, key, tempo, capo settings
- **Search & Filter**: Find songs by title, artist, or content
- **Export Options**: HTML, PDF, and TXT formats
- **Chord Transposition**: Change keys with automatic chord conversion

### 📅 **Setlist Planning**
- **Service Planning**: Create setlists for worship services
- **Song Ordering**: Drag and drop to reorder songs
- **Key Overrides**: Change keys for specific performances
- **Service Notes**: Add notes for each song or service
- **Export Setlists**: Generate printable setlist documents

### 🎤 **Combined Presentations**
- **Scripture + Songs**: Mix scripture slides with chord charts
- **Service Flow**: Plan complete worship services
- **Presentation Export**: Generate complete service documents
- **Team Coordination**: Share presentations with worship teams

### 🎼 **ChordPro Format Support**
- **Standard ChordPro**: Full support for ChordPro syntax
- **Chord Positioning**: Precise chord placement above lyrics
- **Song Sections**: Verse, chorus, bridge, intro, outro
- **Metadata Support**: All standard ChordPro directives
- **Comments**: Add performance notes and instructions

## ChordPro Syntax Guide

### Basic Chord Placement
```
[G]Amazing [C]grace how [G]sweet the sound
That [G]saved a [D]wretch like [G]me
```

### Song Sections
```
{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 90}

{verse 1}
[G]Amazing [C]grace how [G]sweet the sound
That [G]saved a [D]wretch like [G]me

{chorus}
[G]How precious [C]did that [G]grace appear
The [G]hour I [D]first be[G]lieved
```

### Metadata Directives
- `{title: Song Title}` - Song title
- `{artist: Artist Name}` - Artist or composer
- `{key: G}` - Song key
- `{tempo: 120}` - Tempo in BPM
- `{capo: 2}` - Capo position
- `{time: 4/4}` - Time signature

### Section Labels
- `{verse}` or `{verse 1}` - Verse sections
- `{chorus}` - Chorus sections
- `{bridge}` - Bridge sections
- `{intro}` - Introduction
- `{outro}` - Ending
- `{tag}` - Tag or coda

### Comments and Notes
```
# Play softly during verse 1
[G]Amazing [C]grace how [G]sweet the sound
# Build intensity here
That [G]saved a [D]wretch like [G]me
```

## Database Schema

### Songs Table
- **id**: Unique identifier
- **title**: Song title
- **artist**: Artist/composer name
- **key**: Song key
- **tempo**: Tempo in BPM
- **capo**: Capo position
- **content**: ChordPro formatted content
- **tags**: Song categories/tags
- **user_id**: Owner of the song
- **is_public**: Public visibility
- **created_at/updated_at**: Timestamps

### Setlists Table
- **id**: Unique identifier
- **title**: Setlist name
- **description**: Service description
- **service_date**: Date of service
- **user_id**: Creator of setlist
- **created_at/updated_at**: Timestamps

### Setlist Songs Table
- **setlist_id**: Reference to setlist
- **song_id**: Reference to song
- **order_index**: Order in setlist
- **override_key**: Key override for performance
- **notes**: Performance notes

## Usage Examples

### Creating a New Song
1. Navigate to **Songs** page
2. Click **New Song**
3. Enter song metadata (title, artist, key, etc.)
4. Write ChordPro content in the editor
5. Use the help panel for syntax reference
6. Save the song

### Building a Setlist
1. Navigate to **Setlists** page
2. Click **New Setlist**
3. Enter setlist details
4. Add songs from your library
5. Reorder songs as needed
6. Add performance notes
7. Export for team distribution

### Creating Combined Presentations
1. Navigate to **Presentations** page
2. Click **New Presentation**
3. Add scripture slides using references
4. Add songs from your library
5. Arrange order for service flow
6. Export complete presentation

## Export Formats

### HTML Export
- Clean, printable chord charts
- Responsive design for mobile devices
- Chord highlighting and formatting
- Print-friendly styling

### PDF Export
- Professional chord charts
- Consistent formatting
- Page break optimization
- Print-ready documents

### Text Export
- Plain text ChordPro format
- Compatible with other ChordPro software
- Easy sharing and backup

## Integration with CCC Suite

### Shared Authentication
- Same login system as scripture features
- User permissions and data security
- Organization-wide settings

### Consistent UI/UX
- Matching design language
- Familiar navigation patterns
- Responsive mobile design

### Database Integration
- Uses existing Supabase database
- Row Level Security policies
- Efficient data relationships

## Worship Team Benefits

### For Music Directors
- Plan complete worship services
- Manage song library and arrangements
- Export materials for team distribution
- Track song usage and popularity

### For Musicians
- Access chord charts on any device
- Transpose songs to comfortable keys
- View clean, readable chord charts
- Practice with consistent formatting

### For Vocalists
- Clear lyric presentation
- Key information readily available
- Performance notes and cues
- Mobile-friendly viewing

### For Tech Teams
- Integrate with existing scripture system
- Export presentations for projection
- Coordinate with media presentations
- Streamlined worship service flow

## Getting Started

1. **Set up Database**: Run the ChordPro schema SQL
2. **Add Songs**: Start building your song library
3. **Create Setlists**: Plan your first worship service
4. **Export Materials**: Generate chord charts for your team
5. **Train Team**: Share ChordPro syntax guide with musicians

## Future Enhancements

- **CCLI Integration**: Automatic licensing tracking
- **Audio Playback**: Practice tracks and click tracks
- **Mobile App**: Dedicated mobile interface
- **Team Collaboration**: Real-time editing and sharing
- **Advanced Transposition**: Nashville number system
- **Chord Diagrams**: Visual chord charts for guitarists

The ChordPro integration makes CCC Suite a complete worship team solution, combining scripture presentation with professional chord chart management in one unified platform.