#!/bin/bash

# Script to configure CORS for Firebase Storage
# This fixes the CORS error when uploading files from localhost

set -e  # Exit on error

echo "🔧 Setting up Firebase Storage CORS configuration..."
echo ""

# Add Google Cloud SDK to PATH
export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil is not installed."
    echo ""
    echo "Installing Google Cloud SDK..."
    brew install --cask google-cloud-sdk
    export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"
fi

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "❌ Error: cors.json not found in current directory"
    exit 1
fi

# Set the project
echo "📦 Setting Google Cloud project to 'racket-pong'..."
gcloud config set project racket-pong 2>/dev/null || {
    echo "⚠️  Project not set, continuing..."
}

# Check if user is authenticated
echo ""
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "⚠️  Not authenticated. Starting authentication process..."
    echo "   This will open a browser window for you to sign in."
    echo ""
    gcloud auth login --no-launch-browser 2>/dev/null || gcloud auth login
    echo ""
    echo "✅ Authentication successful!"
else
    echo "✅ Already authenticated"
fi

# Apply CORS configuration
echo ""
echo "🚀 Applying CORS configuration to Firebase Storage bucket..."

BUCKET_NAME=""
SUCCESS=false

# Try different bucket name formats
for bucket in "racket-pong.firebasestorage.app" "racket-pong.appspot.com"; do
    echo "Trying bucket: gs://${bucket}..."
    if gsutil cors set cors.json "gs://${bucket}" 2>/dev/null; then
        BUCKET_NAME="${bucket}"
        SUCCESS=true
        echo "✅ CORS configuration applied successfully to gs://${bucket}!"
        break
    else
        ERROR=$(gsutil cors set cors.json "gs://${bucket}" 2>&1)
        if echo "$ERROR" | grep -q "does not exist"; then
            echo "  ⚠️  Bucket gs://${bucket} does not exist yet"
        else
            echo "  ⚠️  Failed: $ERROR"
        fi
    fi
done

if [ "$SUCCESS" = false ]; then
    echo ""
    echo "⚠️  Could not apply CORS configuration - bucket may not exist yet."
    echo ""
    echo "Firebase Storage buckets are created automatically when you first use Storage."
    echo "Please try one of the following:"
    echo ""
    echo "1. Upload a file once through your app, then run this script again"
    echo "2. Check if the bucket exists: gsutil ls"
    echo "3. Create the bucket manually (requires billing):"
    echo "   gcloud storage buckets create gs://racket-pong.firebasestorage.app --location=us-central1"
    echo ""
    echo "After the bucket is created, run this script again:"
    echo "   ./setup-firebase-cors.sh"
    echo ""
    exit 1
fi

# Verify CORS configuration
echo ""
echo "🔍 Verifying CORS configuration..."
gsutil cors get "gs://${BUCKET_NAME}"

echo ""
echo "🎉 Done! CORS configuration is now active."
echo ""
echo "You should now be able to upload files from:"
echo "  - http://localhost:3000"
echo "  - http://localhost:3001"
echo "  - http://localhost:5173"
echo "  - https://racket-pong.firebaseapp.com"
echo ""
echo "Try uploading a file again - the CORS error should be resolved!"
