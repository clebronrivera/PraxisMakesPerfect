# Praxis Study App - School Psychology 5403

A self-sufficient, locally-running study app for Praxis School Psychology exam preparation.

## Features

- ✅ **Complete Knowledge Base**: Comprehensive NASP domain knowledge, court cases, and question patterns
- ✅ **Pre-Assessment**: 20-question diagnostic to identify strengths and weaknesses
- ✅ **Adaptive Practice**: Questions prioritized based on your weak areas
- ✅ **Local Storage**: All progress automatically saved locally in your browser
- ✅ **100% Local**: No external APIs, databases, or internet required after initial setup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173` (or the next available port).

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve them with any static file server, or use:

```bash
npm run preview
```

## How It Works

### Knowledge Base
The app includes a comprehensive knowledge base (`knowledge-base.ts`) with:
- All 10 NASP domains with key concepts
- Important court cases (Tarasoff, IDEA, etc.)
- Common distractor patterns
- Question stem patterns

### Data Storage
- **User Progress**: Automatically saved to browser localStorage
- **Questions**: Embedded directly in the code (no external files needed)
- **No Backend**: Everything runs client-side

### Local Independence
- All data stored in browser localStorage
- No API calls or external dependencies
- Works completely offline after initial load
- Progress persists across browser sessions

## Project Structure

```
PraxisMakesPerfect/
├── App.tsx              # Main application component
├── knowledge-base.ts     # Domain knowledge and patterns
├── src/
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS imports
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## Usage

1. **Start Pre-Assessment**: Complete a 20-question diagnostic to identify your weak areas
2. **Review Results**: See your domain scores and identified knowledge gaps
3. **Practice Mode**: Adaptive practice questions focused on your weaknesses
4. **Track Progress**: Monitor your streak and total questions answered

## Data Persistence

Your progress is automatically saved to browser localStorage with the key `praxis-study-profile`. This includes:
- Pre-assessment completion status
- Domain scores
- Practice history
- Current streak
- Identified weaknesses

To reset your progress, clear your browser's localStorage or use browser developer tools.

## Customization

- **Add Questions**: Edit the `QUESTIONS_DATA` array in `App.tsx`
- **Modify Knowledge Base**: Update `knowledge-base.ts` with additional concepts
- **Change Styling**: Modify Tailwind classes or add custom CSS

## Requirements

- Node.js 16+ and npm
- Modern browser with localStorage support

## License

Private project for personal study use.
