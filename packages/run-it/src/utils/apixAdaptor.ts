/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */
import type { IEnvironmentAdaptor } from '@looker/extension-utils'
import { BrowserAdaptor, getEnvAdaptor } from '@looker/extension-utils'
import type { IAPIMethods } from '@looker/sdk-rtl'
import type { ILookerVersions, SpecItem, SpecList } from '@looker/sdk-codegen'
import { getSpecsFromVersions } from '@looker/sdk-codegen'
import {
  fallbackFetch,
  fullify,
  funFetch,
  RunItConfigKey,
  RunItNoConfig,
} from '../'

export interface IApixAdaptor extends IEnvironmentAdaptor {
  authIsConfigured(): boolean
  fetchSpecList(versionsUrl?: string): Promise<SpecList>
  fetchSpec(spec: SpecItem): Promise<SpecItem>
  verifyConfig(versionsUrl: string): Promise<ILookerVersions>
}

export const getApixAdaptor = () => getEnvAdaptor() as IApixAdaptor

export class ApixAdaptor extends BrowserAdaptor implements IApixAdaptor {
  constructor(sdk: IAPIMethods, private readonly fallbackVersionsUrl: string) {
    super(sdk)
  }

  authIsConfigured(): boolean {
    const storage = localStorage.getItem(RunItConfigKey)
    let config = { base_url: '', looker_url: '' }
    if (storage) {
      config = JSON.parse(storage)
    }
    return config.base_url !== '' && config.looker_url !== ''
  }

  async verifyConfig(versionsUrl: string): Promise<ILookerVersions> {
    let result
    try {
      const response = await fetch(versionsUrl)
      result = (await response.json()) as ILookerVersions
    } catch {
      throw new Error('Invalid server configuration')
    }
    return result
  }

  async fetchSpecList(versionsUrl?: string): Promise<SpecList> {
    const data = await this.localStorageGetItem(RunItConfigKey)
    const config = data ? JSON.parse(data) : RunItNoConfig
    let url: string

    if (versionsUrl) {
      url = versionsUrl
    } else {
      url = config.base_url
        ? `${config.base_url}/versions`
        : `${this.fallbackVersionsUrl}/versions.json`
    }

    const versions = await this.sdk.authSession.transport.rawRequest('GET', url)
    const specs = await getSpecsFromVersions(JSON.parse(versions.body))
    return specs
  }

  async fetchSpec(spec: SpecItem): Promise<SpecItem> {
    spec.specURL = fullify(spec.specURL!, origin)
    spec.api = await fallbackFetch(spec, funFetch)
    return spec
  }
}
