import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/hooks/firebase';

// Hoàn thành web browser session sau khi authentication
WebBrowser.maybeCompleteAuthSession();

// Google Web Client ID từ Firebase Console
const GOOGLE_WEB_CLIENT_ID = '1001290868749-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Optional
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Optional
  });

  return { request, response, promptAsync };
};

export const signInWithGoogle = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    
    return {
      user: result.user,
      success: true,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Alternative: Sign in with Google using Web Browser
export const signInWithGoogleWeb = async () => {
  try {
    // This will open Google Sign-In in a web browser
    const result = await Google.useAuthRequest({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    
    return result;
  } catch (error: any) {
    console.error('Google Web Sign-In Error:', error);
    throw error;
  }
};


