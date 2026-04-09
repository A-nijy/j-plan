import { useState, useRef } from 'react';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';

export type AuthAction = 'backup' | 'restore';

/**
 * Global Lock to prevent duplicate processing of the same code across re-renders or even unmounts.
 * This is the ultimate defense against background auto-exchange attempts by underlying libraries.
 */
const PROCESSED_CODES = new Set<string>();

// Google Discovery document for manual configuration
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const isExchanging = useRef(false);

  // MUST use exactly one slash after colon for Android Google OAuth
  const redirectUri = 'com.jplan.app:/settings';

  // Use low-level AuthSession.useAuthRequest instead of Google shorthand
  // to minimize background "magic" that causes duplicate exchanges.
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || '',
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      redirectUri,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  /**
   * Performs the Google OAuth process and exchanges the code for a token.
   * Uses a global lock to ensure each auth code is only ever sent to Google ONCE.
   */
  const signInAndGetToken = async (): Promise<string | null> => {
    // 0. Preliminary Guard: Prevent overlapping manual calls
    if (isExchanging.current) {
      console.log('[Auth] Exchange already in progress. Ignoring request.');
      return null;
    }

    try {
      setIsAuthLoading(true);
      
      const result = await promptAsync();

      if (result?.type === 'success' && result.params.code) {
        const { code } = result.params;

        // 1. ATOMIC CHECK: Use the global file-level set to block ANY reuse
        if (PROCESSED_CODES.has(code)) {
          console.log('[Auth] Ghost call detected or code already used. Blocking repeat request.');
          return null;
        }
        
        // Immediately lock this code BEFORE any async network call
        PROCESSED_CODES.add(code);
        isExchanging.current = true;

        console.log('[Auth] Starting token exchange for fresh code.');

        // 2. PKCE Validation
        if (!request?.codeVerifier) {
          throw new Error('인증 요청 세션이 만료되었습니다. 다시 시도해주세요.');
        }

        // 3. Exchange code for token
        // Use ANDROID_CLIENT_ID as indicated in the verified setup guide
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || '',
            code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier },
          },
          GOOGLE_DISCOVERY
        );

        console.log('[Auth] Token exchange successful.');
        return tokenResponse.accessToken;
      }

      return null;
    } catch (error: any) {
      console.error('[Auth] Error during token exchange:', error);
      Alert.alert('인증 실패', error.message || '구글 인증 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsAuthLoading(false);
      isExchanging.current = false;
    }
  };

  return {
    signInAndGetToken,
    isAuthLoading,
    resetAuthLoading: () => setIsAuthLoading(false),
  };
};
