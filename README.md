# @clover-network/clv-wagmi-connector

@clover-network/clv-wagmi-connector is a custom wagmi connector for CLV Wallet

The use of wagmi can be referred to: https://wagmi.sh

## How to use @clover-network/clv-wagmi-connector

### Install

```ts
yarn add @clover-network/clv-wagmi-connector
```

### Use with RainbowKit

#### Create a custom Wallet of RainbowKit with CLVConnector

```ts
import { CLVConnector } from "@clover-network/clv-wagmi-connector";
import { Wallet } from '@rainbow-me/rainbowkit';

interface MyWalletOptions {
  chains: Chain[]
}

const CLVWallet = ({chains}: MyWalletOptions): Wallet => ({
  id: 'CLV',
  name: 'CLV Wallet',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTM2LjQ4IDBIMTEuNTJDNS4xNTc2OCAwIDAgNS4xNTc2OCAwIDExLjUyVjM2LjQ4QzAgNDIuODQyMyA1LjE1NzY4IDQ4IDExLjUyIDQ4SDM2LjQ4QzQyLjg0MjMgNDggNDggNDIuODQyMyA0OCAzNi40OFYxMS41MkM0OCA1LjE1NzY4IDQyLjg0MjMgMCAzNi40OCAwWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzc5MTBfMTYzMzUxKSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI0LjAwMDYgMzkuMzYwNkMzMi40ODM3IDM5LjM2MDYgMzkuMzYwNiAzMi40ODM3IDM5LjM2MDYgMjQuMDAwNkMzOS4zNjA2IDE1LjUxNzUgMzIuNDgzNyA4LjY0MDYyIDI0LjAwMDYgOC42NDA2MkMxNS41MTc1IDguNjQwNjIgOC42NDA2MiAxNS41MTc1IDguNjQwNjIgMjQuMDAwNkM4LjY0MDYyIDMyLjQ4MzcgMTUuNTE3NSAzOS4zNjA2IDI0LjAwMDYgMzkuMzYwNlpNMjEuMjg5OSAxNS44Njg4SDI2LjcxMVYyMS4zNDdIMjEuMjkwNFYyNi42NTRIMjYuNzExVjMyLjEzMjJIMjEuMjg5OVYyNi44MjUySDE1Ljg2OTNWMjEuMzQ3SDIxLjI4OTlWMTUuODY4OFpNMjYuNzEyIDIxLjM0N0gzMi4xMzMxVjI2LjgyNTJIMjYuNzEyVjIxLjM0N1oiIGZpbGw9ImJsYWNrIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNzkxMF8xNjMzNTEiIHgxPSI0OCIgeTE9Ii0xLjQzMDUxZS0wNiIgeDI9IjEuNDMwNTFlLTA2IiB5Mj0iNDgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0E5RkZFMCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4NkQ1RkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
  iconBackground: 'linear-gradient(39.66deg, #BDFDE2 -8.36%, #9BDAF6 143.89%)',
  downloadUrls: {browserExtension: "https://chrome.google.com/webstore/detail/clover-wallet/nhnkbkgjikgcigadomkphalanndcapjk"},
  createConnector: () => {
    const connector = new CLVConnector({options: undefined, chains});
    return {
      connector,
    };
  },
})
```

#### Apply the custom Wallet to RainbowKit connectorsForWallets

```ts
import {connectorsForWallets} from '@rainbow-me/rainbowkit';
import {createClient} from 'wagmi';

const connectors = connectorsForWallets([{
  groupName: 'Recommended',
  wallets: [
    CLVWallet({chains}),  //CLVWallet
    metaMaskWallet({chains}),  //metaMaskWallet
  ]
}] as WalletList)
```

#### Create wagmi client
````ts
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});
````

#### Use Providers

```tsx
function MyApp({Component, pageProps}: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

#### Use RainbowKit component as usual

```tsx
import {ConnectButton} from '@rainbow-me/rainbowkit';

const RainbowKitConnectButton = () => {
  return (
    <ConnectButton/>
  )
}
```

