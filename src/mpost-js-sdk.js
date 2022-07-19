const axios = require("axios");
const isUrl = require("is-url");
const joinUrl = require("proper-url-join");
const queryString = require("query-string");
const simpleOAuth2 = require("simple-oauth2");
const pkg = require("../package.json");
const url = require("url");


/**
 * Rejects the request.
 * @return {Promise} error - Returns a Promise with the details for the wrong request.
 */
function rejectValidation(module, param) {
    return Promise.reject({
        status: 0,
        message: `The ${module} ${param} is not valid or it was not specified properly`
    });
}

/**
 * @classdesc Represents an API call.
 * @class
 * @abstract
 */

class APICall {
    /**
   * Create a APICall.
   * @constructor
   * @param {string} baseURL - A string with the base URL for account.
   * @param {string} httpsAgent - A https agent.
   * @param {string} httpAgent - A http agent.
   * @param {string} token - Optional OAuth2 access token
   * @param {Object} [data={}] - An object containing the query parameters.
   */

    constructor(baseURL, httpsAgent, httpAgent, token) {
        if (!isUrl(baseURL)) throw new Error("The base URL provided is not valid");

        this.baseURL = baseURL;
        this.httpsAgent = httpsAgent;
        this.httpAgent = httpAgent;
        this.token = token;
    }

    /**
   * Fetch the information from the API.
   * @return {Promise} - Returns a Promise that, when fulfilled, will either return an JSON Object with the requested
   * data or an Error with the problem.
   */
    async send(method, url, data = {}) {
        let callURL = joinUrl(this.baseURL, url, { trailingSlash: true });

        if (!this.token && !this.permanentToken) {
            throw new Error("No token found");
        }

        const headers = {
            'User-Agent': "mpost-js-sdk/" + pkg.version
        };

        if (this.permanentToken) {
            headers["Authorization"] = "Bearer " + this.permanentToken;
        } else {
            this.token = await (this.token.expired()
                ? this.token.refresh()
                : Promise.resolve(this.token));

            headers["Authorization"] = "Bearer " + this.token.token.access_token;
        }

        let body = "";

        if (method === "POST") {
            headers["Content-Type"] = "application/x-www-form-urlencoded";

            body = queryString.stringify(data);
        } else if (Object.keys(data).length && data.constructor === Object) {
            callURL = joinUrl(callURL, { trailingSlash: true, query: data });
        }

        return axios(callURL, {
            httpsAgent: this.httpsAgent,
            httpAgent: this.httpAgent,
            method,
            data: body,
            headers
        }).then(response => {
            if (response.status >= 400) {
                // check for 4XX, 5XX, wtv
                return Promise.reject({
                    status: response.status,
                    message: response.statusText,
                    body: response.data
                });
            }
            if (response.status >= 200 && response.status <= 202) {
                return response.data;
            }
            return {};
        });
    }
}

/**
 * @classdesc Represents the Mpost SDK. It allows the user to make every call to the API with a single function.
 * @class
 */

class Mpost {
    /**
   * Create Mpost SDK.
   * @constructor
   * @param {String} options.baseURL - The URL with the account domain.
   * @param {String} options.httpsAgent - The https agent.
   * @param {String} options.httpAgent - The http agent.
   * @param {String} options.clientId -- OAuth2 client id
   * @param {String} options.clientSecret -- OAuth2 client secret
   * @param
   * @param {Object} options - An object containing the consumer keys, access keys and the base URL.
   */

    constructor(options) {
        this.options = options;
        this.baseURL = options.baseURL;
        this.redirectUri = options.redirectUri;

        this.api = new APICall(
            options.baseURL,
            options.httpsAgent,
            options.httpAgent
        );

        if (typeof options.permanentToken === "string") {
            this.api.permanentToken = options.permanentToken;
            return;
        }

        const oauthBaseUrl = url.resolve(options.baseURL, "/v6/authentication/");

        this.oauth2 = simpleOAuth2.create({
            client: {
                id: options.clientId,
                secret: options.clientSecret
            },
            auth: {
                tokenHost: oauthBaseUrl,
                tokenPath: "oauth2/token",
                revokePath: "oauth2/revoke",
                authorizeHost: oauthBaseUrl,
                authorizePath: "oauth2/auth"
            }
        });

        if (options.token) {
            if (typeof options.token.access_token !== "string") {
                throw new Error(
                    "Invalid token format: " + JSON.stringify(options.token, null, 2)
                );
            }
            this.api.token = this.oauth2.accessToken.create(options.token);
        }
    }

    /**
 * Builds OAuth2 authorization URL.
 * @return {String} Authorization URL
 */
    makeAuthorizationURL(state, scope) {
        return this.oauth2.authorizationCode.authorizeURL({
            redirect_uri: this.redirectUri,
            scope: scope,
            state: state
        });
    }

    /**
     * Gets OAuth2 access token from authorization code
     * @param {String} code - One time authorization code
     * @return {String} access token
     */
    getToken(code) {
        const tokenConfig = {
            code: code,
            redirect_uri: this.redirectUri
        };

        return this.oauth2.authorizationCode.getToken(tokenConfig).then(result => {
            const token = this.oauth2.accessToken.create(result);
            this.api.token = token;
            return token;
        });
    }

    /**
   * Login to retrieve OAuth credentials.
   * @param {Object} params={} - An object containing the credentials with which the user intends to login.
   * @param {String} params.username - The username of the user.
   * @param {String} params.password - The password of the user.
   * @param {String} params.consumerId - The consumerId of the user.
   * @return {Promise} Credentials - Returns a Promise that, when fulfilled, will either return an Object with the
   * OAuth credentials for login or an Error with the problem.
   */
    userLogin(params) {
        if (!params.username || !params.password || !params.consumerId) {
            return rejectValidation(
                "authentication",
                "username, password or consumerId"
            );
        }

        return this.api.send("POST", "v4/users/login/", params);
    }

  /**
  * Create new Delivery Request
  * @return {Promise}
  */
    createDeliveryRequest(params = {}) {
        if (!params.pickup_address) {
            return rejectValidation("collection", "Pick Up Address");
        }
        return this.api.send("POST", "v4/delivery-requestd/", params);
    }

   /**
   * Get a list of delivary requests
   * @return {Promise}
   */
    getDeliveryRequests(params = {}) {
        return this.api.send("GET", "v4/delivery-requests/", params);
    }

}

module.exports = Mpost;