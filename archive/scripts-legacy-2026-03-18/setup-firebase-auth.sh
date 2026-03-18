#!/bin/bash
# Firebase Authentication Setup Script
# This script helps verify Firebase Authentication is properly configured

echo "🔐 Firebase Authentication Setup Verification"
echo "=============================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in
echo "Checking Firebase login status..."
if firebase projects:list &> /dev/null; then
    echo "✅ Logged in to Firebase"
    CURRENT_PROJECT=$(firebase use --quiet 2>/dev/null || echo "")
    if [ -n "$CURRENT_PROJECT" ]; then
        echo "   Current project: $CURRENT_PROJECT"
    fi
else
    echo "⚠️  Not logged in to Firebase"
    echo "   Run: firebase login"
fi
echo ""

# Project info
echo "Project Information:"
echo "  Project ID: praxismakesperfect-65c57"
echo "  Firebase Console: https://console.firebase.google.com/project/praxismakesperfect-65c57"
echo ""

echo "📋 Manual Setup Steps:"
echo ""
echo "1. Enable Email/Password Authentication:"
echo "   https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers"
echo "   → Click 'Email/Password' → Enable → Save"
echo ""
echo "2. Enable Google Authentication:"
echo "   https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers"
echo "   → Click 'Google' → Enable → Configure → Save"
echo ""
echo "3. Enable Anonymous Authentication (optional):"
echo "   https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers"
echo "   → Click 'Anonymous' → Enable → Save"
echo ""
echo "4. Verify Authorized Domains:"
echo "   https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings"
echo "   → Check that 'localhost' is in Authorized domains"
echo ""
echo "✅ Setup complete! Test authentication in your app at http://localhost:5173"
echo ""
