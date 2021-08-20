/*
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import * as React from 'react';
import {useOktaAuth} from "@okta/okta-react";
import {useHistory, useLocation} from "react-router-dom";
import queryString from "query-string";
import axios from "axios";
import {IDToken, Tokens, TokenVerifyParams, toRelativeUrl} from "@okta/okta-auth-js";

interface LoginCallbackProps {
    errorComponent?: React.ComponentType<{ error: Error }>;
    loadingElement?: React.ReactElement;
}

/**
 * The no PKCE login callback is an attempt to allow us to keep a SPA that is set up for
 * PKCE flows - but temporarily use it on a server that does not support it. So it is an
 * authorisation code flow - with no client secret held on the client.
 *
 * So we intercept the code coming back - and do an exchange with our backend - and
 * the backend completes the rest of the auth code flow by also doing an exchange that
 * includes the client secret.
 *
 * @param errorComponent
 * @param loadingElement
 * @constructor
 */
const NoPKCELoginCallback: React.FC<LoginCallbackProps> = ({ errorComponent, loadingElement = null}) => {
    const { oktaAuth, authState } = useOktaAuth();
    const [callbackError, setCallbackError] = React.useState(null);

    const location = useLocation();
    const history = useHistory();

    React.useEffect(() => {
            const qs = queryString.parse(location.search);

            if (qs.code && qs.state) {
                axios({
                    method: 'post',
                    url: '/login/exchange',
                    data: {
                        code: qs.code,
                        state: qs.state
                    }
                }).then((res) => {
                    var tokenDict = {} as Tokens;
                    var expiresIn = res.data.expires_in;
                    var tokenType = res.data.token_type;
                    var accessToken = res.data.access_token;
                    var idToken = res.data.id_token;
                    var refreshToken = res.data.refresh_token;
                    var now = Math.floor(Date.now()/1000);

                    if (accessToken) {
                        var idJwt = oktaAuth.token.decode(idToken);

                        tokenDict.accessToken = {
                            accessToken: accessToken,
                            claims: idJwt.payload,
                            expiresAt: Number(expiresIn) + now,
                            tokenType: tokenType,
                            scopes: oktaAuth.options.scopes!,
                            authorizeUrl: oktaAuth.options.authorizeUrl!,
                            userinfoUrl: oktaAuth.options.userinfoUrl!
                        };
                    }

                    if (refreshToken) {
                        tokenDict.refreshToken = {
                            refreshToken: refreshToken,
                            expiresAt: Number(expiresIn) + now, // should not be used, this is the accessToken expire time
                            scopes: oktaAuth.options.scopes!,
                            tokenUrl: oktaAuth.options.tokenUrl!,
                            authorizeUrl: oktaAuth.options.authorizeUrl!,
                            issuer: oktaAuth.options.issuer!,
                        };
                    }

                    if (idToken) {
                        var idJwt = oktaAuth.token.decode(idToken);

                        var idTokenObj: IDToken = {
                            idToken: idToken,
                            claims: idJwt.payload,
                            expiresAt: idJwt.payload.exp! - idJwt.payload.iat! + now, // adjusting expiresAt to be in local time
                            scopes: oktaAuth.options.scopes!,
                            authorizeUrl: oktaAuth.options.authorizeUrl!,
                            issuer: oktaAuth.options.issuer!,
                            clientId: oktaAuth.options.clientId!
                        };

                        tokenDict.idToken = idTokenObj;

                        /* YES we should be validating these tokens .. var validationParams: TokenVerifyParams = {
                            clientId: oktaAuth.options.clientId!
                            issuer: oktaAuth.options.issuer!,
                            nonce: tokenParams.nonce,
                            accessToken: accessToken
                        };

                        validationParams.ignoreSignature = tokenParams.ignoreSignature;

                        return verifyToken(sdk, idTokenObj, validationParams)
                            .then(function () {
                                tokenDict.idToken = idTokenObj;
                                return tokenDict;
                            }); */
                    }

                    console.log(tokenDict);

                    oktaAuth.tokenManager.setTokens(tokenDict);

                    // ensure auth state has been updated
                    oktaAuth.authStateManager.updateAuthState().then(() => {
                        // Get and clear originalUri from storage
                        const originalUri = oktaAuth.getOriginalUri();
                        oktaAuth.removeOriginalUri();

                        history.replace(toRelativeUrl(originalUri, window.location.origin));
                    });
                });
            } else {
                console.log("Not processing code");
            }

    }, [oktaAuth, location, history]);

    const authError = authState?.error;
    const displayError = callbackError || authError;
    if (displayError) {
        return <div>{displayError}</div>;
    }

    return loadingElement;
};

export default NoPKCELoginCallback;