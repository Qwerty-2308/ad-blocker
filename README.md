# 🛡️ Ad Blocker Extension

A lightweight, privacy-focused ad blocker that works completely **offline** with no external API calls.

## ✨ Features

- **100% Offline** - No API calls, no external dependencies
- **Pattern-Based Detection** - Uses intelligent CSS selectors to identify ads
- **Background Color Matching** - Hides ads seamlessly by matching the page background
- **YouTube Ad Blocking** - Automatically skips YouTube video ads
- **Network Request Blocking** - Blocks ad requests at the network level
- **Real-time Stats** - Track blocked ads and protected sites
- **Zero Performance Impact** - Lightweight and fast

## 🚀 How It Works

### 1. Pattern Matching
The extension uses an extensive list of CSS selectors to identify common ad patterns:
- Generic ad classes (`ad-`, `-ad`, `ad_`, `_ad`)
- Ad service providers (Google Ads, AdSense, etc.)
- Sponsored content markers
- Ad iframes and containers

### 2. Seamless Ad Hiding
Instead of completely removing ads (which can break page layouts), the extension:
- Detects the background color of the parent element or page
- Replaces ad content with a matching background color
- Maintains element dimensions to prevent layout shifts
- Removes borders, shadows, and interactivity

### 3. Network-Level Blocking
Intercepts and blocks requests to known ad domains using:
- `declarativeNetRequest` API for efficient blocking
- Fetch and XMLHttpRequest interception
- Rules-based filtering from `rules.json`

## 📦 Installation

1. Clone or download this repository
2. Clone the [Gemini CLI](https://github.com/google-gemini/gemini-cli) repo inside the project directory — this is required for the extension to run fully offline:
   ```bash
   git clone https://github.com/google-gemini/gemini-cli.git
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the ad blocker directory

> ⚠️ **Important:** The `gemini-cli` folder **must** be cloned inside this repository's root directory for the extension to work properly. The final structure should look like:
> ```
> ad-blocker/
> ├── gemini-cli/    ← cloned here
> ├── manifest.json
> ├── content.js
> └── ...
> ```

## 🎯 Usage

1. Click the extension icon to open the popup
2. Toggle ad blocking on/off
3. View statistics for blocked ads and protected sites
4. Refresh stats or reset counters as needed

## 📁 File Structure

```
ad-blocker/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for stats tracking
├── content.js            # Main ad blocking logic
├── popup.html            # Popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── rules.json            # Network blocking rules
└── icons/                # Extension icons
```

## 🔧 Technical Details

### Content Script (`content.js`)
- **MutationObserver**: Monitors DOM changes to block dynamically loaded ads
- **Pattern Matching**: Extensive CSS selector list for ad detection
- **YouTube Integration**: Special handling for YouTube video ads
- **Network Interception**: Blocks ad requests via fetch/XHR

### Background Script (`background.js`)
- **Stats Tracking**: Maintains counters for blocked ads
- **Message Handling**: Coordinates between content scripts and popup
- **Storage Management**: Persists settings and statistics

### Popup Interface
- **Toggle Control**: Enable/disable ad blocking
- **Live Stats**: Real-time display of blocked ads
- **Actions**: Refresh and reset statistics

## 🎨 Ad Hiding Strategy

The `coverUpAd()` function implements a sophisticated hiding mechanism:

```javascript
1. Get background color from parent elements or page body
2. Clear ad content while preserving element structure
3. Apply matching background color
4. Maintain original dimensions (prevent layout shift)
5. Remove visual indicators (borders, shadows)
6. Disable interactivity (pointer events)
```

This approach ensures ads are hidden seamlessly without breaking page layouts.

## 🌐 Supported Sites

The extension works on all websites and includes special optimizations for:
- **YouTube**: Auto-skip video ads, block overlays
- **News Sites**: Block banner ads and sponsored content
- **Social Media**: Hide promoted posts
- **General Websites**: Block common ad networks

## 🔒 Privacy

- **No Data Collection**: Extension doesn't collect or transmit any data
- **No External Calls**: Works completely offline
- **Local Processing**: All ad detection happens on your device
- **No Tracking**: No analytics or telemetry

## ⚡ Performance

- **Lightweight**: Minimal memory footprint
- **Fast**: Pattern matching is instant
- **Efficient**: Uses native browser APIs
- **Non-blocking**: Doesn't slow down page loads

## 🛠️ Customization

### Adding Custom Selectors
Edit `content.js` and add patterns to the `adSelectors` array:

```javascript
const adSelectors = [
  '[class*="your-custom-pattern"]',
  // ... more selectors
];
```

### Adding Blocked Domains
Edit `rules.json` to add network-level blocking rules.

## 📝 Notes

- **No API Keys Required**: Unlike the previous version, this extension doesn't need any API keys
- **Gemini Service**: The `gemini-service.js` file is not used in this version
- **Offline First**: Works without internet connection
- **Privacy Focused**: No external dependencies or API calls

## 🐛 Troubleshooting

**Ads still showing?**
- Try refreshing the page
- Check if ad blocking is enabled in the popup
- Some sites may use advanced ad techniques

**Extension not working?**
- Reload the extension in `chrome://extensions/`
- Check browser console for errors
- Ensure you're using a Chromium-based browser

## 🛠️ Built With

This ad blocker extension was built with the help of [Gemini CLI](https://github.com/google-gemini/gemini-cli), Google's open-source AI coding agent for the terminal.

## 📄 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to submit issues or pull requests to improve the ad blocking patterns!
