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

import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import type { BrowserSession } from '@looker/sdk-rtl'
import { ComponentsProvider } from '@looker/components'

import type { IApixAdaptor } from '../../utils'
import { Loading } from '../../components'

interface OAuthSceneProps {
  adaptor: IApixAdaptor
}

/**
 * OAuth scene for sdk session handling aed redirection to OAuth flow initiation
 * route
 */
export const OAuthScene: FC<OAuthSceneProps> = ({ adaptor }) => {
  const history = useHistory()
  const authSession = adaptor.sdk.authSession as BrowserSession
  const oldUrl = authSession.returnUrl || `/`
  const [error, setError] = useState(false)

  useEffect(() => {
    const maybeLogin = async () => {
      const token = await adaptor.login()
      if (token) {
        history.push(oldUrl)
      } else {
        setError(true)
      }
    }
    maybeLogin()
  }, [])

  const themeOverrides = adaptor.themeOverrides()
  return (
    <ComponentsProvider
      loadGoogleFonts={themeOverrides.loadGoogleFonts}
      themeCustomizations={themeOverrides.themeCustomizations}
    >
      {!error ? (
        <Loading
          loading={true}
          message={`Returning to ${oldUrl} after OAuth login ...`}
        />
      ) : (
        'Failed to login'
      )}
    </ComponentsProvider>
  )
}
