# Android versioning

Ovolar uses the Android values in `android/app/build.gradle`.

- `versionCode` is a positive integer and must increase with every Google Play or tester-facing Android update.
- `versionName` is the user-facing semantic version (for example, `1.1.0`).
- Before manually dispatching **Publish Ovolar APK**, update both values, commit them, then use the matching tag such as `v1.1.0`.

The manual release workflow builds the installable debug-signed `ovolar.apk` and attaches it to the GitHub Release. The latest stable release is available at `releases/latest/download/ovolar.apk`.
