# Code Signing Plan

**Status**: COMPLETED
**Priority**: High (required for production distribution)

---

## Overview

Code signing is required for distributing Sonic Flow to end users without OS security warnings. This document covers macOS notarization and Windows code signing.

---

## macOS: Notarization

### Prerequisites

1. **Apple Developer Account** ($99/year) — developer.apple.com
2. **Developer ID Application Certificate** — Keychain Access or Apple Developer portal
3. **App-Specific Password** — appleid.apple.com (for notarytool)

### Configuration (electron-builder.yml)

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

afterSign: scripts/notarize.js
```

### Entitlements (build/entitlements.mac.plist)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key><true/>
</dict>
</plist>
```

### Notarization Script (scripts/notarize.js)

```javascript
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") return;

  const appName = context.packager.appInfo.productFilename;
  await notarize({
    appBundleId: "com.sonicflow.app",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### Environment Variables (CI/CD)

```
APPLE_ID=your@email.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
CSC_LINK=base64-encoded-p12-or-path
CSC_KEY_PASSWORD=certificate-password
```

---

## Windows: Code Signing

### Prerequisites

1. **Code Signing Certificate** — DigiCert, Sectigo, or similar CA
   - EV Certificate recommended (SmartScreen trust from first install)
   - Standard OV Certificate alternative (builds SmartScreen reputation over time)
2. **Certificate file** (.pfx / .p12 format)

### Configuration (electron-builder.yml)

```yaml
win:
  certificateFile: ${env.WIN_CSC_LINK}
  certificatePassword: ${env.WIN_CSC_KEY_PASSWORD}
  signingHashAlgorithms: [sha256]
  sign: null # use default signtool
```

### Environment Variables (CI/CD)

```
WIN_CSC_LINK=path-to-certificate.pfx
WIN_CSC_KEY_PASSWORD=certificate-password
```

---

## CI/CD Integration (GitHub Actions)

### Workflow: `.github/workflows/release.yml`

Trigger: Push tag `v*` (e.g., `v1.1.0`)

Steps:

1. Checkout + install dependencies
2. Build frontend + electron
3. Run electron-builder with platform matrix (macOS + Windows)
4. macOS: sign + notarize (using stored secrets)
5. Windows: sign (using stored secrets)
6. Upload artifacts to GitHub Release (draft)
7. Manually publish release after verification

### GitHub Secrets Required

```
APPLE_ID
APPLE_APP_PASSWORD
APPLE_TEAM_ID
CSC_LINK (macOS certificate, base64)
CSC_KEY_PASSWORD (macOS certificate password)
WIN_CSC_LINK (Windows certificate, base64)
WIN_CSC_KEY_PASSWORD (Windows certificate password)
GH_TOKEN (auto-provided by Actions)
```

---

## Cost Estimate

| Item                      | Cost      | Recurrence |
| ------------------------- | --------- | ---------- |
| Apple Developer Account   | $99       | Annual     |
| Windows Code Signing (OV) | ~$200-400 | Annual     |
| Windows Code Signing (EV) | ~$400-600 | Annual     |

---

## Implementation Steps

1. Obtain Apple Developer account and certificates
2. Obtain Windows code signing certificate
3. Create `build/entitlements.mac.plist`
4. Create `scripts/notarize.js`
5. Update `electron-builder.yml` with signing configuration
6. Set up GitHub Actions workflow
7. Store all secrets in GitHub repository settings
8. Test: create a tagged release and verify signed artifacts
9. Verify macOS Gatekeeper acceptance (`spctl --assess`)
10. Verify Windows SmartScreen behavior

---

## Notes

- Auto-updater (`electron-updater`) works without code signing for testing, but production releases should always be signed
- macOS notarization requires hardened runtime, which may affect some native modules — test thoroughly
- Windows EV certificates provide immediate SmartScreen trust; OV certificates require building reputation through download volume
