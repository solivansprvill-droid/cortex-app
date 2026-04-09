# Cortex App — Setup & Deployment Guide

## Local Development Setup

### 1. Prerequisites

- **Node.js**: 22+ (LTS recommended)
- **pnpm**: 9.12+ (`npm install -g pnpm`)
- **Expo CLI**: Latest (`npm install -g expo-cli`)
- **Git**: For version control

### 2. Clone & Install

```bash
git clone https://github.com/solivansprvill-droid/cortex-app.git
cd cortex-app
pnpm install
```

### 3. Start Development Server

```bash
# Start Metro bundler + dev server
pnpm dev

# Or run on specific platform
pnpm ios      # iOS simulator
pnpm android  # Android emulator
pnpm web      # Web browser
```

The app will be available at:
- **Web**: `http://localhost:8081`
- **Mobile**: Scan QR code with Expo Go app

### 4. Configure Your First Model

1. Open the app
2. Go to **Settings** tab
3. Select a model preset or manually enter:
   - **Base URL**: `https://api.edgefn.net/v1` (or your provider)
   - **API Key**: Your authentication token
   - **Model**: Model identifier
4. Tap **Save Configuration**

## Production Build

### Build APK (Android)

#### Option A: Using EAS (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --non-interactive

# Download APK from EAS dashboard
```

#### Option B: Local Build

```bash
# Requires Android SDK setup
eas build --platform android --local

# APK will be in `dist/` directory
```

### Build IPA (iOS)

```bash
eas build --platform ios --non-interactive

# Download from EAS dashboard or use TestFlight for distribution
```

## GitHub Actions CI/CD

### Setup Automated Builds

1. **Get Expo Token**:
   - Go to [https://expo.dev/settings/tokens](https://expo.dev/settings/tokens)
   - Create a new token
   - Copy the token

2. **Add to GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: Paste your Expo token
   - Click "Add secret"

3. **Trigger Builds**:
   - Push to `main` or `develop` branch
   - Or manually trigger: Go to Actions → Build APK with EAS → Run workflow

4. **Download APKs**:
   - Go to Actions → Latest workflow run
   - Download artifact `cortex-app-apk`
   - Or download from GitHub Releases (for main branch pushes)

### Workflow Configuration

Edit `.github/workflows/build-apk.yml` to customize:

```yaml
# Change build profile
EAS_BUILD_PROFILE: production  # or 'preview', 'development'

# Add release notes
- name: Create Release
  with:
    body: "Release notes here"
```

## Environment Variables

### For Local Development

Create `.env.local` (optional):

```env
EXPO_PUBLIC_API_BASE_URL=https://api.edgefn.net/v1
EXPO_PUBLIC_API_KEY=your-api-key
EXPO_PUBLIC_MODEL=nousresearch/hermes-3-llama-3.1-405b
```

**Note**: These are optional. You can also configure everything in the app Settings.

### For CI/CD

Required GitHub secrets:
- `EXPO_TOKEN`: Your Expo authentication token

Optional:
- `SENTRY_AUTH_TOKEN`: For error tracking (if using Sentry)
- `SLACK_WEBHOOK`: For build notifications

## Deployment Checklist

- [ ] Update version in `app.config.ts`
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on physical device (if possible)
- [ ] Run `pnpm lint` and fix any issues
- [ ] Run `pnpm check` for TypeScript errors
- [ ] Commit and push to GitHub
- [ ] Verify GitHub Actions build succeeds
- [ ] Download and test the APK
- [ ] Create GitHub Release with APK attached

## Troubleshooting

### Build Fails with "EXPO_TOKEN not found"

```bash
# Solution: Set token in GitHub secrets or locally
export EXPO_TOKEN=your-token-here
eas build --platform android
```

### "Metro bundler failed to start"

```bash
# Solution: Clear cache and restart
pnpm install
rm -rf node_modules/.cache
pnpm dev
```

### "Android SDK not found"

```bash
# Solution: Install Android SDK or use EAS
# Option 1: Install Android Studio and SDK
# Option 2: Use EAS (recommended)
eas build --platform android
```

### App crashes on startup

```bash
# Solution: Clear app data and reinstall
# Android:
adb shell pm clear com.solivansprvill.cortexapp

# iOS:
# Delete app and reinstall
```

## Advanced Configuration

### Custom Branding

Edit `app.config.ts`:

```typescript
const env = {
  appName: "Your App Name",
  appSlug: "your-app-slug",
  logoUrl: "https://your-cdn.com/logo.png",
};
```

### Add New Language

1. Create `lib/i18n/fr.json` (French example)
2. Add to `lib/i18n/index.ts`:

```typescript
import fr from './fr.json';

resources: {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },  // Add here
}
```

### Custom API Integration

Edit `lib/ai.ts` to add custom LLM provider support.

## Performance Optimization

### Reduce Bundle Size

```bash
# Analyze bundle
pnpm build

# Remove unused dependencies
pnpm prune
```

### Optimize Images

```bash
# Compress app icon
pnpm run compress-images
```

## Monitoring & Analytics

### Error Tracking (Optional)

Add Sentry integration:

```bash
npx expo install @sentry/react-native
```

### Usage Analytics (Optional)

Configure in `app.config.ts`:

```typescript
plugins: [
  ["expo-analytics", { trackingId: "UA-XXXXXXXXX-X" }],
]
```

## Support & Resources

- **Expo Docs**: [https://docs.expo.dev](https://docs.expo.dev)
- **React Native**: [https://reactnative.dev](https://reactnative.dev)
- **GitHub Issues**: [Report bugs or request features](https://github.com/solivansprvill-droid/cortex-app/issues)
- **EAS Build**: [https://eas.expo.dev](https://eas.expo.dev)

## License

MIT — See LICENSE file for details
