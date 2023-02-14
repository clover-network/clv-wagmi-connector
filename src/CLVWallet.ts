import {
  AddChainError,
  Address,
  ChainNotConfiguredError,
  ConnectorNotFoundError,
  getClient,
  InjectedConnector,
  InjectedConnectorOptions,
  normalizeChainId,
  ProviderRpcError,
  ResourceUnavailableError,
  RpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from '@wagmi/core'
import type { Chain } from '@wagmi/core/chains'
import { providers } from 'ethers'
import { getAddress, hexValue } from 'ethers/lib/utils.js'
import { Ethereum } from './types'

export type CLVConnectorOptions = Pick<InjectedConnectorOptions, 'shimChainChangedDisconnect' | 'shimDisconnect'> & {
  /**
   * While "disconnected" with `shimDisconnect`, allows user to select a different MetaMask account (than the currently connected account) when trying to connect.
   */
  UNSTABLE_shimOnConnectSelectAccount?: boolean
}

export class CLVConnector extends InjectedConnector {
  readonly id = 'CLV'
  declare readonly name: string
  declare readonly ready: boolean

  #provider?: Ethereum
  #switchingChains?: boolean

  protected shimDisconnectKey = `${this.id}.shimDisconnect`
  // @ts-ignore
  #UNSTABLE_shimOnConnectSelectAccount: CLVConnectorOptions['UNSTABLE_shimOnConnectSelectAccount']
  constructor({
    chains,
    options: options_,
  }: {
    chains?: Chain[]
    options?: CLVConnectorOptions
  } = {}) {
    const options = {
      name: 'CLVWallet',
      shimDisconnect: true,
      shimChainChangedDisconnect: true,
      getProvider() {
        function getReady(ethereum?: Ethereum) {
          // @ts-ignore
          const isClover = !!ethereum?.isClover
          if (!isClover) return
          // Brave tries to make itself look like MetaMask
          // Could also try RPC `web3_clientVersion` if following is unreliable
          if (ethereum.isBraveWallet && !ethereum._events && !ethereum._state) return
          if (ethereum.isAvalanche) return
          if (ethereum.isKuCoinWallet) return
          if (ethereum.isPortal) return
          if (ethereum.isTokenPocket) return
          if (ethereum.isTokenary) return
          return ethereum
        }

        if (typeof window === 'undefined') return
        // @ts-ignore
        const clover = window['clover'] as Ethereum | undefined
        if (clover?.providers) {
          return clover.providers.find(getReady)
        }
        return getReady(clover)
      },
      ...options_,
    }
    // @ts-ignore
    super({ chains, options })
    this.#UNSTABLE_shimOnConnectSelectAccount = options.UNSTABLE_shimOnConnectSelectAccount
  }
  async connect({ chainId }: { chainId?: number }) {
    try {
      const provider = await this.getProvider()
      if (!provider) throw new ConnectorNotFoundError()
      if (provider.on) {
        provider.on('accountsChanged', this.onAccountsChanged)
        provider.on('chainChanged', this.onChainChanged)
        provider.on('disconnect', this.onDisconnect)
      }
      this.emit('message', { type: 'connecting' })
      let account: Address | null = null
      if (
        this.#UNSTABLE_shimOnConnectSelectAccount &&
        this.options?.shimDisconnect &&
        !getClient().storage?.getItem(this.shimDisconnectKey)
      ) {
        account = await this.getAccount().catch(() => null)
        const isConnected = !!account
        if (isConnected)
          // Attempt to show another prompt for selecting wallet if already connected
          try {
            await provider.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }],
            })
            // User may have selected a different account so we will need to revalidate here.
            account = await this.getAccount()
          } catch (error) {
            // Not all MetaMask injected providers support `wallet_requestPermissions` (e.g. MetaMask iOS).
            // Only bubble up error if user rejects request
            if (this.isUserRejectedRequestError(error)) throw new UserRejectedRequestError(error)
          }
      }
      if (!account) {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        })
        account = getAddress(accounts[0] as string)
      }

      // Switch to chain if provided
      let id = await this.getChainId()
      let unsupported = this.isChainUnsupported(id)
      if (chainId && id !== chainId) {
        const chain = await this.switchChain(chainId)
        id = chain.id
        unsupported = this.isChainUnsupported(id)
      }

      if (this.options?.shimDisconnect) getClient().storage?.setItem(this.shimDisconnectKey, true)

      return { account, chain: { id, unsupported }, provider }
    } catch (error) {
      if (this.isUserRejectedRequestError(error)) throw new UserRejectedRequestError(error)
      if ((error as RpcError).code === -32002) throw new ResourceUnavailableError(error)
      throw error
    }
  }

  async disconnect() {
    const provider = await this.getProvider()
    if (!provider?.removeListener) return

    provider.removeListener('accountsChanged', this.onAccountsChanged)
    provider.removeListener('chainChanged', this.onChainChanged)
    provider.removeListener('disconnect', this.onDisconnect)

    // Remove shim signalling wallet is disconnected
    if (this.options.shimDisconnect) getClient().storage?.removeItem(this.shimDisconnectKey)
  }

  async getAccount() {
    const provider = await this.getProvider()
    if (!provider) throw new ConnectorNotFoundError()
    const accounts = await provider.request({
      method: 'eth_accounts',
    })
    // return checksum address
    return getAddress(accounts[0] as string)
  }

  async getChainId() {
    const provider = await this.getProvider()
    if (!provider) throw new ConnectorNotFoundError()
    return provider.request({ method: 'eth_chainId' }).then(normalizeChainId)
  }

  async getProvider() {
    const provider = this.options.getProvider()
    if (provider) this.#provider = provider
    return this.#provider
  }
  async switchChain(chainId: number): Promise<any> {
    if (this.options.shimChainChangedDisconnect) this.#switchingChains = true

    const provider = await this.getProvider()
    if (!provider) throw new ConnectorNotFoundError()
    const id = hexValue(chainId)

    try {
      await Promise.all([
        provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: id }],
        }),
        new Promise<void>((res) =>
          this.on('change', ({ chain }) => {
            if (chain?.id === chainId) res()
          })
        ),
      ])
      return (
        this.chains.find((x) => x.id === chainId) ?? {
          id: chainId,
          name: `Chain ${id}`,
          network: `${id}`,
          nativeCurrency: { name: 'Ether', decimals: 18, symbol: 'ETH' },
          rpcUrls: { default: { http: [''] }, public: { http: [''] } },
        }
      )
    } catch (error) {
      const chain = this.chains.find((x) => x.id === chainId)
      if (!chain) throw new ChainNotConfiguredError({ chainId, connectorId: this.id })

      // Indicates chain is not added to provider
      if (
        (error as ProviderRpcError).code === 4902 ||
        // Unwrapping for MetaMask Mobile
        // https://github.com/MetaMask/metamask-mobile/issues/2944#issuecomment-976988719
        (error as RpcError<{ originalError?: { code: number } }>)?.data?.originalError?.code === 4902
      ) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: id,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpcUrls.public?.http[0] ?? ''],
                blockExplorerUrls: this.getBlockExplorerUrls(chain),
              },
            ],
          })
          return chain
        } catch (addError) {
          if (this.isUserRejectedRequestError(addError)) throw new UserRejectedRequestError(error)
          throw new AddChainError()
        }
      }

      if (this.isUserRejectedRequestError(error)) throw new UserRejectedRequestError(error)
      throw new SwitchChainError(error)
    }
  }
  async getSigner({ chainId }: { chainId?: number } = {}) {
    const [provider, account] = await Promise.all([this.getProvider(), this.getAccount()])
    return new providers.Web3Provider(provider as providers.ExternalProvider, chainId).getSigner(account)
  }

  async isAuthorized() {
    try {
      if (
        this.options.shimDisconnect &&
        // If shim does not exist in storage, wallet is disconnected
        !getClient().storage?.getItem(this.shimDisconnectKey)
      )
        return false

      const provider = await this.getProvider()
      if (!provider) throw new ConnectorNotFoundError()
      const account = await this.getAccount()
      return !!account
    } catch {
      return false
    }
  }
  protected onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) this.emit('disconnect')
    else
      this.emit('change', {
        account: getAddress(accounts[0] as string),
      })
  }

  protected onChainChanged = (chainId: number | string) => {
    const id = normalizeChainId(chainId)
    const unsupported = this.isChainUnsupported(id)
    this.emit('change', { chain: { id, unsupported } })
  }

  protected onDisconnect = () => {
    // We need this as MetaMask can emit the "disconnect" event
    // upon switching chains. This workaround ensures that the
    // user currently isn't in the process of switching chains.
    if (this.options.shimChainChangedDisconnect && this.#switchingChains) {
      this.#switchingChains = false
      return
    }

    this.emit('disconnect')
    // Remove shim signalling wallet is disconnected
    if (this.options.shimDisconnect) getClient().storage?.removeItem(this.shimDisconnectKey)
  }

  protected isUserRejectedRequestError(error: unknown) {
    return (error as ProviderRpcError).code === 4001
  }
}
