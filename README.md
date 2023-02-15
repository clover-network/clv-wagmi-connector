# clv-wagmi-connector

clv-wagmi-connector is a tool that can connect the clv wallet to wagmi.

The use of wagmi can be referred to: https://wagmi.sh

## How to use CLVConnector

### 1. Add CLVConnector dependency in the project

`yarn add clv-wagmi-connector`

### 2. How to generate an instance of CLVConnector

#### 2.1 Create a CLVConnector instance and put it in the wallet list

```ts
import {CLVConnector} from "clv-wagmi-connector";

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

#### 2.2 Apply the CLVConnector instance to the connector list and create a wagmi client

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

````ts
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});
````

### 3. Two ways of using the client created

#### 3.1 Create a separate CLVConnector button

```tsx
import {useConnect} from "wagmi";

const CLVConnectButton = () => {
  const {connectors, connect} = useConnect()
  return (
    {
      connectors.map((connector) => (
        <button
          suppressContentEditableWarning
          key={connector.id}
          onClick={() => connect({connector})}
        >{connector.name}</button>
      ))
    }
  )
}
```

#### 3.2 Add the CLVConnector to the rainbowkit's wallet list

```tsx
import {ConnectButton} from '@rainbow-me/rainbowkit';

const RainbowKitConnectButton = () => {
  return (
    <ConnectButton/>
  )
}
```

