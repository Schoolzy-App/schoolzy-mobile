import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Mirrors the `darkMode` feature flag in `constants/featureFlags.ts`.
 *
 * `userInterfaceStyle` controls the NATIVE surfaces the JS theme can't reach —
 * keyboard appearance, action sheets, system alerts and the native splash. It
 * has to be pinned to 'light' too, otherwise the app renders light while those
 * surfaces render dark on a device set to dark mode.
 */
const DARK_MODE_ENABLED = ['1', 'true', 'yes', 'on'].includes(
  (process.env.EXPO_PUBLIC_ENABLE_DARK_MODE ?? '').trim().toLowerCase(),
);

const userInterfaceStyle: ExpoConfig['userInterfaceStyle'] = DARK_MODE_ENABLED
  ? 'automatic'
  : 'light';

/**
 * APNs environment. TestFlight and App Store builds are signed for production
 * APNs; using 'development' there makes push silently fail. EAS sets
 * EAS_BUILD_PROFILE during the build, so this follows the profile automatically.
 */
const apsEnvironment: 'development' | 'production' =
  process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development';

const configs: Record<string, ExpoConfig> = {
  brighton: {
    name: 'Brighton British School',
    slug: 'brighton',
    "owner": "schoolzy-app",
    // Live on the stores is 2.0.0 (versionCode 47). This is a full rewrite —
    // new codebase, live API, push notifications — hence the major bump.
    version: '3.0.0',
    orientation: 'portrait',
    icon: './assets/brighton/logo.png',
    scheme: 'brighton',
    userInterfaceStyle,
    platforms: ['ios', 'android'],
    "extra": {
      "eas": {
        "projectId": "eefc6378-d744-4638-ac81-7043a72d308a"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/eefc6378-d744-4638-ac81-7043a72d308a"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },

    ios: {
      // The live App Store record ("Brighton British School") uses this id, which
      // differs from the Android package — matching the package name instead is
      // what made EAS register a second, unwanted app.
      bundleIdentifier: 'com.edugistics.bbs',
      // eas.json uses appVersionSource "remote", so EAS owns this number now.
      // Kept as a record of what was last built locally.
      buildNumber: '6',
      supportsTablet: true,
      googleServicesFile: './firebase/brighton/GoogleService-Info.plist',
      entitlements: {
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        // The app only uses standard HTTPS, which is exempt. Declaring it here
        // avoids the manual export-compliance question on every TestFlight build.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.edugistics.brighton',
      // Live on Play is 47. EAS owns this number now (appVersionSource
      // "remote"); kept as a record of what was last built locally.
      versionCode: 48,
      // Required from Android 13 (API 33). Without it the runtime permission
      // prompt never appears and every notification is silently dropped.
      permissions: ['android.permission.POST_NOTIFICATIONS'],
      googleServicesFile: './firebase/brighton/google-services.json',
      adaptiveIcon: {
        backgroundColor: '#821037',
        foregroundImage: './assets/brighton/android-icon-foreground.png',
        backgroundImage: './assets/brighton/android-icon-background.png',
        monochromeImage: './assets/brighton/android-icon-monochrome.png',
      },
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/brighton/splash-icon.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: '#821037',
          dark: { backgroundColor: '#821037' },
        },
      ],
      'expo-font',
      'expo-secure-store',
      [
        // Generates NSFaceIDUsageDescription on iOS and the USE_BIOMETRIC
        // permission on Android. Without it `authenticateAsync` cannot
        // succeed, however correct the JS is.
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow $(PRODUCT_NAME) to use Face ID to sign you in without re-entering your password.',
        },
      ],
      [
        '@react-native-firebase/app',
        {
          // Firebase's SPM products are automatic (static) libraries, so with
          // SPM enabled every RNFirebase pod embeds its own copy and they
          // collide under CocoaPods' default static linkage. Resolving Firebase
          // through CocoaPods instead keeps the rest of the project on the
          // default linkage — the alternative is dynamic frameworks for every
          // pod in the app.
          ios: { disableSPM: true },
        },
      ],
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          // With SPM disabled above, Firebase resolves through CocoaPods, whose
          // Swift pods need framework linkage to expose module maps. Static
          // frameworks keep a single copy per symbol and avoid the dynamic
          // -framework launch cost.
          ios: { useFrameworks: 'static' },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow $(PRODUCT_NAME) to access your photos so you can attach a deposit screenshot or wellness documents.',
          cameraPermission:
            'Allow $(PRODUCT_NAME) to use the camera to capture a deposit screenshot.',
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
  },
  schoolzy: {
    name: 'Schoolzy',
    slug: 'schoolzy',
    "owner": "schoolzy-app",
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/schoolzy/logo.png',
    scheme: 'schoolzy',
    userInterfaceStyle,
    platforms: ['ios', 'android'],
    "extra": {
      "eas": {
        "projectId": "8d927747-196a-4b19-aeef-b1d49fce9ec5"
      }
    },
    ios: {
      bundleIdentifier: 'com.schoolzy.schoolzy',
      buildNumber: '2',
      supportsTablet: true,
      googleServicesFile: './firebase/schoolzy/GoogleService-Info.plist',
      entitlements: {
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        // The app only uses standard HTTPS, which is exempt. Declaring it here
        // avoids the manual export-compliance question on every TestFlight build.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.schoolzy.schoolzy',
      versionCode: 2,
      // Required from Android 13 (API 33). Without it the runtime permission
      // prompt never appears and every notification is silently dropped.
      permissions: ['android.permission.POST_NOTIFICATIONS'],
      googleServicesFile: './firebase/schoolzy/google-services.json',
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/schoolzy/android-icon-foreground.png',
        monochromeImage: './assets/schoolzy/android-icon-foreground.png',
      },
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/schoolzy/logo1.png',
          imageWidth: 180,
          resizeMode: 'contain',
          // Schoolzy splash uses the secondary color (orange)
          backgroundColor: '#1A1466',
          dark: { backgroundColor: '#1A1466' },
        },
      ],
      'expo-font',
      'expo-secure-store',
      [
        // Generates NSFaceIDUsageDescription on iOS and the USE_BIOMETRIC
        // permission on Android. Without it `authenticateAsync` cannot
        // succeed, however correct the JS is.
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow $(PRODUCT_NAME) to use Face ID to sign you in without re-entering your password.',
        },
      ],
      [
        '@react-native-firebase/app',
        {
          // Firebase's SPM products are automatic (static) libraries, so with
          // SPM enabled every RNFirebase pod embeds its own copy and they
          // collide under CocoaPods' default static linkage. Resolving Firebase
          // through CocoaPods instead keeps the rest of the project on the
          // default linkage — the alternative is dynamic frameworks for every
          // pod in the app.
          ios: { disableSPM: true },
        },
      ],
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          // With SPM disabled above, Firebase resolves through CocoaPods, whose
          // Swift pods need framework linkage to expose module maps. Static
          // frameworks keep a single copy per symbol and avoid the dynamic
          // -framework launch cost.
          ios: { useFrameworks: 'static' },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow $(PRODUCT_NAME) to access your photos so you can attach a deposit screenshot or wellness documents.',
          cameraPermission:
            'Allow $(PRODUCT_NAME) to use the camera to capture a deposit screenshot.',
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
    "updates": {
      "url": "https://u.expo.dev/8d927747-196a-4b19-aeef-b1d49fce9ec5"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  },
  ajial: {
    name: 'Ajial',
    slug: 'ajial',
    "owner": "schoolzy-app",
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/ajial/logo.png',
    scheme: 'ajial',
    userInterfaceStyle,
    platforms: ['ios', 'android'],
    "extra": {
      "eas": {
        "projectId": "03f369b9-c259-4747-af6f-24fa8396f5e8"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/03f369b9-c259-4747-af6f-24fa8396f5e8"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },

    ios: {
      bundleIdentifier: 'com.schoolzy.ajial',
      buildNumber: '1',
      supportsTablet: true,
      googleServicesFile: './firebase/ajial/GoogleService-Info.plist',
      entitlements: {
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        // The app only uses standard HTTPS, which is exempt. Declaring it here
        // avoids the manual export-compliance question on every TestFlight build.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.schoolzy.ajial',
      versionCode: 1,
      // Required from Android 13 (API 33). Without it the runtime permission
      // prompt never appears and every notification is silently dropped.
      permissions: ['android.permission.POST_NOTIFICATIONS'],
      googleServicesFile: './firebase/ajial/google-services.json',
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/ajial/android-icon-foreground.png',
        monochromeImage: './assets/ajial/android-icon-foreground.png',
      },
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/ajial/splash-icon.png',
          imageWidth: 220,
          resizeMode: 'contain',
          // Splash uses Ajial's primary navy
          backgroundColor: '#0c2f5d',
          dark: { backgroundColor: '#0c2f5d' },
        },
      ],
      'expo-font',
      'expo-secure-store',
      [
        // Generates NSFaceIDUsageDescription on iOS and the USE_BIOMETRIC
        // permission on Android. Without it `authenticateAsync` cannot
        // succeed, however correct the JS is.
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow $(PRODUCT_NAME) to use Face ID to sign you in without re-entering your password.',
        },
      ],
      [
        '@react-native-firebase/app',
        {
          // Firebase's SPM products are automatic (static) libraries, so with
          // SPM enabled every RNFirebase pod embeds its own copy and they
          // collide under CocoaPods' default static linkage. Resolving Firebase
          // through CocoaPods instead keeps the rest of the project on the
          // default linkage — the alternative is dynamic frameworks for every
          // pod in the app.
          ios: { disableSPM: true },
        },
      ],
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          // With SPM disabled above, Firebase resolves through CocoaPods, whose
          // Swift pods need framework linkage to expose module maps. Static
          // frameworks keep a single copy per symbol and avoid the dynamic
          // -framework launch cost.
          ios: { useFrameworks: 'static' },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow $(PRODUCT_NAME) to access your photos so you can attach a deposit screenshot or wellness documents.',
          cameraPermission:
            'Allow $(PRODUCT_NAME) to use the camera to capture a deposit screenshot.',
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
  },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = process.env.APP_VARIANT ?? 'brighton';
  const appConfig = configs[variant] ?? configs.brighton;
  return { ...config, ...appConfig };
};

