# Cortex — Intelligent AI Assistant Mobile App

A React Native mobile application built with Expo that brings powerful AI capabilities to your phone. Chat with any OpenAI-compatible LLM, with support for Telegram and Home Assistant message gateways.

## Features

- **Multi-Model Support**: Works with OpenAI, Claude, Gemini, Mistral, Llama, Hermes, and 20+ other models
- **Flexible API Configuration**: Use any OpenAI-compatible API endpoint (EdgeFn, OpenRouter, local Ollama, etc.)
- **Real-time Streaming**: See AI responses appear in real-time as they're generated
- **Message Gateways**: 
  - **Telegram**: Push AI responses directly to Telegram chats
  - **Home Assistant**: Integrate with Home Assistant notify services
- **Bilingual UI**: Full support for English and Simplified Chinese with system language detection
- **Conversation History**: Local storage of all conversations with search and management
- **Customizable AI**: Adjust temperature, max tokens, and system prompts per conversation
- **Beautiful UI**: Dark/light mode support with intuitive design following iOS HIG

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm 9.12+
- Expo CLI (`npm install -g expo-cli`)
- An API key for any OpenAI-compatible LLM provider

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# On iOS
pnpm ios

# On Android
pnpm android

# On Web
pnpm web
```

## Configuration

### Model Setup

1. Open the **Settings** tab
2. Select a model preset from the language selector section, or manually configure:
   - **Base URL**: Your API endpoint (default: `https://api.edgefn.net/v1`)
   - **API Key**: Your authentication token
   - **Model**: Model identifier (e.g., `nousresearch/hermes-3-llama-3.1-405b`)
   - **Temperature**: Creativity level (0.0–2.0)
   - **Max Tokens**: Response length limit
   - **System Prompt**: AI personality/instructions

### Supported Model Providers

| Provider | Base URL | Example Model |
|----------|----------|---------------|
| **EdgeFn** | `https://api.edgefn.net/v1` | `nousresearch/hermes-3-llama-3.1-405b` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.1-405b-instruct` |
| **Anthropic** | `https://api.anthropic.com/v1` | `claude-3-5-sonnet-20241022` |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash` |
| **Mistral** | `https://api.mistral.ai/v1` | `mistral-large-latest` |
| **Groq** | `https://api.groq.com/openai/v1` | `mixtral-8x7b-32768` |
| **Local Ollama** | `http://localhost:11434/v1` | `llama2` |

### Telegram Gateway

1. Create a bot via [@BotFather](https://t.me/botfather) and copy the **Bot Token**
2. Get your **Chat ID** (send a message to your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`)
3. In Settings, enable Telegram and enter both values
4. Test the connection to verify setup

### Home Assistant Gateway

1. Go to **Settings** → **Security** → **Create Long-Lived Access Token**
2. Copy the token and your HA URL (e.g., `http://homeassistant.local:8123`)
3. In Settings, enable Home Assistant and enter credentials
4. Specify a notify service (e.g., `notify.mobile_app_phone`)
5. Test the connection to verify setup

## Building for Production

### Build APK Locally

```bash
# Build for Android (APK)
eas build --platform android --non-interactive

# Build for iOS
eas build --platform ios --non-interactive
```

### Automated Builds with GitHub Actions

This project includes a GitHub Actions workflow (`.github/workflows/build-apk.yml`) that automatically builds APKs on:
- Every push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

**Setup:**
1. Add `EXPO_TOKEN` secret to your GitHub repository (get from [Expo Dashboard](https://expo.dev))
2. Push code to trigger automatic builds
3. Download APKs from GitHub Artifacts or Releases

## Project Structure

```
cortex-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx      # Chat screen
│   │   ├── history.tsx    # Conversation history
│   │   └── settings.tsx   # Configuration
│   ├── _layout.tsx        # Root layout with providers
│   └── oauth/             # OAuth callback
├── components/            # Reusable UI components
│   ├── message-bubble.tsx
│   ├── chat-input.tsx
│   ├── markdown-renderer.tsx
│   └── ui/
├── lib/                   # Business logic
│   ├── i18n/             # Translations (en.json, zh.json)
│   ├── ai.ts             # LLM API integration
│   ├── gateway.ts        # Telegram & HA integration
│   ├── app-context.tsx   # Global state management
│   ├── model-presets.ts  # Model configuration presets
│   └── storage.ts        # AsyncStorage utilities
├── hooks/                # React hooks
├── constants/            # App constants
├── eas.json             # EAS Build configuration
├── app.config.ts        # Expo app configuration
└── tailwind.config.js   # Tailwind CSS config
```

## Environment Variables

No environment variables required for local development. All sensitive data (API keys, tokens) are stored securely on-device using AsyncStorage.

For CI/CD builds, ensure `EXPO_TOKEN` is set in your GitHub secrets.

## Internationalization (i18n)

The app supports English and Simplified Chinese with automatic system language detection.

**Switch Language:**
1. Open Settings
2. Tap the language selector at the top
3. Choose "Follow System", "English", or "中文简体"

**Add New Language:**
1. Create a new translation file in `lib/i18n/` (e.g., `es.json`)
2. Add the language code to `SUPPORTED_LANGUAGES` in `lib/i18n/index.ts`
3. Import and register the translation in `lib/i18n/index.ts`

## Troubleshooting

### API Connection Issues
- Verify your API key is correct and has sufficient credits
- Check that the Base URL is accessible from your network
- Test the connection using the Settings test buttons

### Telegram Not Receiving Messages
- Ensure Bot Token and Chat ID are correct
- Verify the bot has permission to send messages
- Check that Telegram gateway is enabled in Settings

### Home Assistant Connection Failed
- Verify HA is accessible at the provided URL
- Confirm the Long-Lived Token is valid and hasn't expired
- Ensure the notify service name is correct (check HA Developer Tools)

### App Crashes on Startup
- Clear app cache and data
- Reinstall the app
- Check that all required permissions are granted

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see LICENSE file for details

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing discussions for solutions
- Review the [Expo documentation](https://docs.expo.dev)

## Acknowledgments

- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- UI components styled with [NativeWind](https://www.nativewind.dev) (Tailwind CSS)
- Internationalization with [i18next](https://www.i18next.com)
- Powered by [Nous Research Hermes](https://www.nous.ai/) and other open-source LLMs

---

**Cortex** — Your intelligent AI assistant, always in your pocket.
