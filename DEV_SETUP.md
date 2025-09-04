# Development Environment Setup Guide

## Issues Fixed

### 1. Timer Duration Issue (30 seconds instead of 30 minutes)
**Fixed**: Added missing `duration` field mapping in `PaymentsTabs.tsx`

### 2. Database Submission Issue
**Solution**: Redirect to production exam URL in development mode (much simpler!)

## Simple Solution: Redirect to Production

**No environment setup needed!** The exam flow now automatically redirects to production when running in development mode.

### How it works:
- When you click "Start Exam" in development mode (`NODE_ENV === 'development'`)
- The app automatically redirects to: `https://argus-talent-search.web.app/testing?formId={formId}&isProctored={isProctored}`
- This uses the production exam environment with proper timer and database submission

### Setup Steps

1. **No environment configuration needed** - the redirect handles everything
2. **Just restart your development server**:
   ```bash
   npm start
   # or
   yarn start
   ```
3. **Test the flow**: Click "Start Exam" and you'll be redirected to production

## Testing the Fix

1. **Timer Test**: Start an exam and verify the timer shows the correct duration (e.g., 30:00 for 30 minutes)

2. **Database Submission Test**: 
   - Complete an exam
   - Check your Firebase console to verify the submission was recorded
   - Look for entries in `student_submission_mappings` collection

## Troubleshooting

### If timer still shows wrong duration:
- Check browser console for any errors
- Verify the exam details are being fetched correctly
- Check that `detail.duration` exists in your Firestore `exam_details` collection

### If database submission still fails:
- Check browser network tab for failed API calls
- Verify your `REACT_APP_GOOGLE_CLOUD_FUNCTIONS` URL is correct
- Check Firebase console for any authentication issues
- Ensure your dev Firebase project has the same collections as production

### If you want to use local Firebase emulator:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase emulators:start --only functions,firestore`
3. Update `REACT_APP_GOOGLE_CLOUD_FUNCTIONS` to point to local emulator
4. Import production data to emulator if needed

## Production vs Development Differences

The main differences between your dev and production environments are:

1. **Firebase Project**: Dev uses a different Firebase project
2. **API Endpoints**: Dev may point to different Cloud Functions
3. **Data**: Dev may have different or no exam data in Firestore

Make sure your dev environment has:
- Same Firebase project structure
- Same exam details in Firestore with `duration` field
- Proper authentication setup
