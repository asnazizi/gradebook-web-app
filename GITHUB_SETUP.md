# GitHub Setup Instructions

Follow these steps to upload your project to GitHub:

## 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Gradebook web application"
```

## 2. Create GitHub Repository
1. Go to GitHub.com and create a new repository
2. Name it `gradebook-web-app` (or your preferred name)
3. Don't initialize with README, .gitignore, or license (we already have them)

## 3. Connect to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

## 4. Set up Environment Variables
1. Copy `.env.example` to `.env`
2. Update the values in `.env` with your actual configuration
3. Never commit the `.env` file (it's already in .gitignore)

## 5. Install Dependencies
```bash
npm install
```

## 6. Run the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Important Notes:
- Update the repository URL in `package.json` after creating your GitHub repo
- Replace "Your Name" in `package.json` with your actual name
- Make sure MongoDB is running before starting the application
- The `.env` file is ignored by Git for security reasons
