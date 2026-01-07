# Pezkuwi Extension

A browser extension for PezkuwiChain that injects a [@pezkuwi/api](https://github.com/pezkuwichain/pezkuwi-api) Signer into a page, along with any associated accounts, allowing for use by any dapp. This is an implementation of a PezkuwiChain browser signer.

**Developed by Dijital Kurdistan Tech Institute**

## Overview

This extension manages accounts and allows the signing of transactions with those accounts for the PezkuwiChain network.

## Installation

- Chrome: Coming soon to Chrome Web Store
- Firefox: Coming soon to Firefox Add-ons

## Documentation

Find out more about how to use the extension as a Dapp developer in the [Pezkuwi Extension Documentation](https://js.pezkuwichain.app/docs/extension/)

## Development

### Prerequisites

- Node.js >= 18.14
- Yarn 4.x (via corepack)

### Building from Source

1. Enable corepack: `corepack enable`
2. Install dependencies: `yarn install`
3. Build for Chrome: `yarn build:chrome`
4. Build for Firefox: `yarn build:ff`

### Loading the Extension

**Chrome:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select `packages/extension/build`

**Firefox:**
1. Go to `about:debugging#addons`
2. Check "Enable add-on debugging"
3. Click "Load Temporary Add-on" and select `packages/extension/build/manifest.json`

## Packages

- [extension](packages/extension/) - Main entry point with injection and background logic
- [extension-ui](packages/extension-ui/) - UI components for the popup
- [extension-dapp](packages/extension-dapp/) - Wrapper for dapps to work with injected objects
- [extension-inject](packages/extension-inject/) - Wrapper for extension developers to inject their extension

## For Dapp Developers

Use the [@pezkuwi/extension-dapp](packages/extension-dapp/) package to integrate with this extension or any compatible extension.

```javascript
import { web3Enable, web3Accounts } from '@pezkuwi/extension-dapp';

// Enable the extension
const extensions = await web3Enable('My Dapp');

// Get all accounts
const accounts = await web3Accounts();
```

## Links

- Website: https://pezkuwichain.io
- Documentation: https://docs.pezkuwichain.io
- GitHub: https://github.com/pezkuwichain
- API Docs: https://js.pezkuwichain.app

## License

Apache-2.0

## Author

Dijital Kurdistan Tech Institute
