# Chrome Authenticator Extension

A modern, Apple Design System inspired Chrome extension for generating TOTP (Time-based One-Time Password) codes. Built with TypeScript, React, and Vite.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)

## Features

### Core Functionality
- **TOTP Algorithm**: RFC 6238 compliant implementation using HMAC-SHA1
- **30-second period**: Standard 6-digit one-time passwords
- **QR Code Scanning**: Select any area on screen to capture and parse QR codes
- **Manual Entry**: Add accounts by entering issuer, account name, and secret key

### Account Management
- Add new accounts (manual or via QR code)
- Edit existing accounts
- Delete accounts with confirmation
- View all accounts in a clean card layout

### User Interface
- **Apple Design System**: Clean, minimal aesthetic with rounded corners
- **Dark/Light Mode**: Automatic system preference detection + manual toggle
- **Live Countdown**: Visual progress bar showing time until next code
- **Warning Indicators**: Color changes at 5 seconds remaining
- **One-Click Copy**: Click any account card to copy the current code

### Data Management
- **Export**: Export all accounts as JSON (Base64 encoded)
- **Import**: Import accounts from previously exported JSON
- **Chrome Storage**: Accounts persist in Chrome's local storage

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ugur-claw/authenticator.git
cd authenticator
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Chrome Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist` folder from your project directory
5. The extension icon will appear in your toolbar

## Usage

### Adding an Account
1. Click the extension icon to open the popup
2. Click **Add Account** button
3. Choose one of:
   - **Scan QR Code**: Click to select an area containing a QR code
   - **Manual Entry**: Enter issuer, account name, and Base32 secret
4. Click **Add Account**

### Using TOTP Codes
- Each account displays its current 6-digit code
- The progress bar shows time remaining until code refreshes
- **Click anywhere on an account card** to copy the code to clipboard

### Import/Export
- Click the import/export icon in the header
- **Export**: Downloads a JSON file with all your accounts
- **Import**: Paste data or select a file to import accounts

### Theme
- Click the sun/moon icon to toggle between light and dark modes
- Theme preference is saved automatically

## Project Structure

```
authenticator/
├── src/
│   ├── background.ts      # Chrome service worker
│   ├── content.ts         # Content script for QR selection
│   └── popup/
│       ├── App.tsx        # Main React application
│       ├── main.tsx      # Entry point
│       ├── components/   # React components
│       ├── hooks/        # Custom React hooks
│       ├── utils/        # TOTP & storage utilities
│       └── styles/       # CSS styles
├── public/
│   └── manifest.json     # Chrome manifest V3
├── index.html            # HTML template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

## Technologies

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Chrome Manifest V3**: Extension framework
- **Web Crypto API**: HMAC-SHA1 implementation

## Security Notes

- All secrets are stored locally in Chrome's encrypted storage
- No data is sent to any external servers
- Export data is Base64 encoded (no encryption in v1)
- Always keep your backup files secure

## Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium browsers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
