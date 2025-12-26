// ========================================
// GOOGLE SHEETS CONFIGURATION
// ========================================
// IMPORTANT: Replace these values with your credentials from Google Cloud Console
// Follow the GOOGLE-SHEETS-SETUP.md guide to get these values

const GOOGLE_CONFIG = {
    // Your OAuth 2.0 Client ID
    // Get this from: Google Cloud Console → APIs & Services → Credentials
    // Example: '123456789-abc123xyz.apps.googleusercontent.com'
    CLIENT_ID: '774665258794-oquckclq9m9ejesui9qviiuomeh86tg7.apps.googleusercontent.com', // ← REPLACE THIS
    
    // Your API Key
    // Get this from: Google Cloud Console → APIs & Services → Credentials
    // Example: 'AIzaSyAbc123...'
    API_KEY: 'AIzaSyDz3jXyqONLDWaSg6qzTDrGlmHFO9tC6GQ', // ← REPLACE THIS
    
    // Don't change these
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_CONFIG;
}
