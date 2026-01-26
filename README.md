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

## Deployment

This app can be deployed to various platforms. Configuration files are included for easy deployment.

### Option 1: Vercel (Recommended - Easiest)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings (or use the included `vercel.json`)
   - Click "Deploy"
   - Your app will be live at `https://your-project-name.vercel.app`

3. **Automatic deployments**: Every push to `main` will automatically deploy

### Option 2: Netlify

1. **Push your code to GitHub** (if not already done)

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Netlify will auto-detect settings (or use the included `netlify.toml`)
   - Click "Deploy site"
   - Your app will be live at `https://your-project-name.netlify.app`

3. **Automatic deployments**: Every push to `main` will automatically deploy

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Update vite.config.ts** to set base path:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/'  // Replace with your GitHub repo name
   })
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: `gh-pages` branch
   - Your app will be at `https://your-username.github.io/your-repo-name/`

### Option 4: Manual Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to any static hosting service:
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Any web hosting service that supports static files

### Testing Your Deployment Locally

Before deploying, test the production build locally:

```bash
npm run build
npm run preview
```

This will serve the production build at `http://localhost:4173` (or similar).

## Requirements

- Node.js 16+ and npm
- Modern browser with localStorage support

## License

Private project for personal study use.
