# 🚀 Quick Setup Guide - Get Running in 5 Minutes

## Option 1: Use as Artifact (FASTEST - No Setup)

Copy the `App.tsx` content directly into Claude.ai as an artifact. It will render immediately.

---

## Option 2: Cursor Setup (For Development)

### Step 1: Create Project (30 seconds)
```bash
npm create vite@latest praxis-study-app -- --template react-ts
cd praxis-study-app
```

### Step 2: Install Dependencies (1 minute)
```bash
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind (30 seconds)

Replace `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Replace `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Add the Code (1 minute)

1. Create `src/brain/` folder
2. Copy `knowledge-base.ts` into `src/brain/`
3. Replace `src/App.tsx` with the provided code
4. Add your questions to `src/data/questions.json`

### Step 5: Run It
```bash
npm run dev
```

---

## Adding the Full 125 Questions

Create `src/data/questions.json` and paste the questions array:

```json
[
  {
    "id": "SP5403_Q001",
    "question": "...",
    "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correct_answer": ["C"],
    "rationale": "..."
  },
  // ... all 125 questions
]
```

Then import in App.tsx:
```tsx
import QUESTIONS_DATA from './data/questions.json';
```

---

## Project Structure After Setup

```
praxis-study-app/
├── src/
│   ├── brain/
│   │   └── knowledge-base.ts    ← Domain knowledge
│   ├── data/
│   │   └── questions.json       ← Your 125 questions
│   ├── App.tsx                  ← Main app
│   └── index.css               ← Tailwind imports
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## What You Get

### Pre-Assessment Mode
- 20 questions (2 per NASP domain)
- Identifies your weak areas
- Shows specific knowledge gaps

### Adaptive Practice Mode
- Prioritizes your weak domains
- Tracks your streak
- Provides detailed explanations

### Progress Dashboard
- Domain-by-domain scores
- Recommended focus areas
- Concepts to review

---

## Customization Ideas

### Add More Questions
The system will automatically analyze new questions and categorize them by domain.

### Add Study Mode
Show the knowledge-base content as flashcards:
```tsx
// Study a specific concept
const concept = NASP_DOMAINS[1].mustKnowTerms['interobserver agreement'];
```

### Add Spaced Repetition
Track when questions were last seen and prioritize based on forgetting curve.

### Persist Data
Replace in-memory state with localStorage:
```tsx
useEffect(() => {
  localStorage.setItem('praxisProfile', JSON.stringify(profile));
}, [profile]);
```

---

## Need Help?

The architecture is designed to be extended. Key files:

- **knowledge-base.ts** - Add more concepts, laws, patterns
- **App.tsx** - Modify UI, add new modes
- **questions.json** - Add/modify questions

The "brain" functions can be enhanced without changing the UI.
