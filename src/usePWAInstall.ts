import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const CAPACITOR_ANDROID_BUILD_SCRIPT = `#!/usr/bin/env bash
# =============================================================================
# One-Command Android APK Builder for Grade 1 Khmer Alphabet & Vowels Quiz
# Creates a standalone Android APK (app-debug.apk) using Capacitor + Gradle
# =============================================================================
set -e

mkdir -p khmer-grade1-quiz-apk/www
cd khmer-grade1-quiz-apk

# 1. Initialize Node project & install Capacitor Android
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Place your downloaded index.html into the www/ folder
echo "Place your downloaded index.html inside ./www/index.html"

# 3. Initialize Capacitor with Khmer Quiz App ID
npx cap init "Khmer Kids Quiz" "com.khmerkids.grade1quiz" --web-dir www

# 4. Add Android platform & sync web assets
npx cap add android
npx cap sync android

# 5. Build installable Android APK (requires JDK 17 + Android SDK)
cd android
./gradlew assembleDebug

echo "✅ APK built successfully at: android/app/build/outputs/apk/debug/app-debug.apk"
`;

export const CAPACITOR_IOS_BUILD_SCRIPT = `#!/usr/bin/env bash
# =============================================================================
# One-Command iOS App (.ipa / Xcode) Builder for Grade 1 Khmer Quiz
# Creates a native iOS Xcode project using Capacitor for iPhone & iPad
# =============================================================================
set -e

mkdir -p khmer-grade1-quiz-ios/www
cd khmer-grade1-quiz-ios

# 1. Initialize Node project & install Capacitor iOS
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. Place your downloaded index.html into the www/ folder
echo "Place your downloaded index.html inside ./www/index.html"

# 3. Initialize Capacitor with Khmer Quiz Bundle ID
npx cap init "Khmer Kids Quiz" "com.khmerkids.grade1quiz" --web-dir www

# 4. Add iOS platform & sync web assets
npx cap add ios
npx cap sync ios

# 5. Open in Xcode on macOS to run on iPhone/iPad or archive .ipa
npx cap open ios

echo "✅ iOS Xcode project ready at: ios/App/App.xcworkspace"
`;

/**
 * Generates an Apple iOS Configuration Profile (.mobileconfig) Web Clip
 * that installs a full-screen standalone Home Screen icon on iPhone & iPad.
 */
export function generateIOSMobileConfig(appUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>រៀនអក្សរខ្មែរ</string>
      <key>PayloadDescription</key>
      <string>ដំឡើងកម្មវិធី រៀនអក្សរខ្មែរថ្នាក់ទី១ លើអេក្រង់ដើម iPhone / iPad</string>
      <key>PayloadDisplayName</key>
      <string>រៀនអក្សរខ្មែរថ្នាក់ទី១ (Khmer Kids Quiz)</string>
      <key>PayloadIdentifier</key>
      <string>com.khmerkids.grade1quiz.webclip</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>8A9C7E32-4B1D-4E2A-9F11-393994BB0AD1</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>Precomposed</key>
      <true/>
      <key>URL</key>
      <string>${appUrl}</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>កម្មវិធីសិក្សាព្យញ្ជនៈ និងស្រៈខ្មែរថ្នាក់ទី១ សម្រាប់កុមារអាយុ ៦ឆ្នាំ លើប្រព័ន្ធ iOS (iPhone &amp; iPad)</string>
  <key>PayloadDisplayName</key>
  <string>រៀនអក្សរខ្មែរថ្នាក់ទី១ (iOS App Profile)</string>
  <key>PayloadIdentifier</key>
  <string>com.khmerkids.grade1quiz.profile</string>
  <key>PayloadOrganization</key>
  <string>Khmer Kids EdTech</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>1F4B2C90-7D8E-4A3F-8B22-393994BB0AD2</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
}

