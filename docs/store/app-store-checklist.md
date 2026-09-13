# App Store and TestFlight checklist

## Xcode and signing

- Open `ios/App/App.xcodeproj` in Xcode after installing full Xcode.
- In the **App** target, choose the Apple Developer Team under Signing & Capabilities.
- Keep the bundle identifier as `games.ovolar.app`. If it is unavailable to that team, stop and choose an identifier only with product-owner approval.
- Leave **Automatically manage signing** enabled so Xcode can select the certificate and provisioning profile.
- Archive the Release build, validate it, upload it to App Store Connect, then distribute it through TestFlight.

## App Store Connect

- Create the App Store Connect record for **Ovolar** before upload.
- Add final iPhone/iPad screenshots, app icon, subtitle, description, keywords, support URL, and (if required by actual data practices) privacy policy URL.
- Complete the App Privacy questionnaire from the final build and actual data practices; do not claim data collection that does not exist.
- Complete the age rating questionnaire and export-compliance answers truthfully.
- Set the category to Games, with Casual as the recommended secondary classification where available.
- Test Home, Block, 2048, Snake, gestures, background/resume, safe areas, and no-scroll behavior on physical devices before submission.

## Native configuration

- The iOS project uses `games.ovolar.app`, display name **Ovolar**, local Capacitor web assets, automatic signing, and portrait-only orientations.
- The generated Capacitor icon and splash mark are usable development placeholders; replace them with final Ovolar store artwork before public submission.
