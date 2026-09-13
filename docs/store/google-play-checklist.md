# Google Play submission checklist

## Build and signing

- Create one upload keystore and keep it outside the repository.
- Add these GitHub Actions secrets: `OVOLAR_ANDROID_KEYSTORE_BASE64`, `OVOLAR_ANDROID_KEYSTORE_PASSWORD`, `OVOLAR_ANDROID_KEY_ALIAS`, and `OVOLAR_ANDROID_KEY_PASSWORD`.
- Run **Build signed store packages** manually with a unique, increasing `version_code` and matching `version_name`.
- Upload the generated `ovolar-<version>.aab` to the Play Console. The APK is for direct tester distribution only.
- Confirm the app identity is `Ovolar` / `games.ovolar.app`, version `1.0.0` / version code `1` for the first upload.

## Play Console

- Create the app record in **Games → Casual** (recommended category) and select an appropriate target audience only after reviewing the actual audience policy.
- Complete the content rating questionnaire truthfully.
- Declare **no ads** unless ads are added later.
- Complete Data safety based on the released build. The app currently has no account, analytics, ads, backend, or runtime permissions; recheck this declaration before every release.
- Provide a privacy policy URL if Play Console policy or any future data practice requires one. Do not claim one exists until it is published.
- Add the final 512×512 store icon, feature graphic, phone screenshots, app description, support contact, and any required testing-track details.

## Permissions

The release manifest requests no Android runtime permissions. It intentionally does not request internet, tracking, advertising, storage, location, camera, notifications, or billing permissions.
