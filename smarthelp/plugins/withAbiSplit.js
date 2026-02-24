/**
 * Expo config plugin — restricts the APK to arm64-v8a only.
 * This removes native libs for x86, x86_64, and armeabi-v7a,
 * which cuts the Agora SDK footprint from ~200 MB to ~60 MB.
 *
 * 95%+ of modern Android devices (2017+) are arm64-v8a.
 * For production AAB uploads, Google Play handles ABI splits automatically.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAbiSplit(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    const contents = gradleConfig.modResults.contents;

    // Avoid adding twice
    if (contents.includes('splits {')) {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = contents.replace(
      /android\s*\{/,
      `android {\n    splits {\n        abi {\n            reset()\n            include "arm64-v8a"\n            universalApk false\n        }\n    }\n`
    );

    return gradleConfig;
  });
};
