// Google OAuth Configuration
// Lấy từ Firebase Console > Authentication > Sign-in method > Google

export const GOOGLE_AUTH_CONFIG = {
  // Web Client ID từ Firebase Console - Dùng cho tất cả platforms
  webClientId: '1001290868749-5vrllmdt5jfg3tfi5hq7t989fdeeikem.apps.googleusercontent.com',
  
  // Dùng Web Client ID cho Android trong Expo
  androidClientId: '1001290868749-5vrllmdt5jfg3tfi5hq7t989fdeeikem.apps.googleusercontent.com',
  
  // Dùng Web Client ID cho iOS trong Expo
  iosClientId: '1001290868749-5vrllmdt5jfg3tfi5hq7t989fdeeikem.apps.googleusercontent.com',
};

// Hướng dẫn lấy Web Client ID:
// 1. Vào https://console.firebase.google.com/
// 2. Chọn project "ev-renter"
// 3. Authentication > Sign-in method
// 4. Enable Google
// 5. Copy "Web client ID"
// 6. Paste vào GOOGLE_AUTH_CONFIG.webClientId ở trên

