"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var axios = require("axios");
var isUrl = require("is-url");
var joinUrl = require("proper-url-join");
var queryString = require("query-string");
var simpleOAuth2 = require("simple-oauth2");
var pkg = require("../package.json");
var url = require("url");

/**
 * Rejects the request.
 * @return {Promise} error - Returns a Promise with the details for the wrong request.
 */
function rejectValidation(module, param) {
    return Promise.reject({
        status: 0,
        message: "The " + module + " " + param + " is not valid or it was not specified properly"
    });
}

/**
 * @classdesc Represents an API call.
 * @class
 * @abstract
 */

var APICall = function () {
    /**
    * Create a APICall.
    * @constructor
    * @param {string} baseURL - A string with the base URL for account.
    * @param {string} httpsAgent - A https agent.
    * @param {string} httpAgent - A http agent.
    * @param {string} token - Optional OAuth2 access token
    * @param {Object} [data={}] - An object containing the query parameters.
    */

    function APICall(baseURL, httpsAgent, httpAgent, token) {
        (0, _classCallCheck3.default)(this, APICall);

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


    (0, _createClass3.default)(APICall, [{
        key: "send",
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(method, url) {
                var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
                var callURL, headers, body;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                callURL = joinUrl(this.baseURL, url, { trailingSlash: true });

                                if (!(!this.token && !this.permanentToken)) {
                                    _context.next = 3;
                                    break;
                                }

                                throw new Error("No token found");

                            case 3:
                                headers = {
                                    'User-Agent': "mpost-js-sdk/" + pkg.version
                                };

                                if (!this.permanentToken) {
                                    _context.next = 8;
                                    break;
                                }

                                headers["Authorization"] = "Bearer " + this.permanentToken;
                                _context.next = 12;
                                break;

                            case 8:
                                _context.next = 10;
                                return this.token.expired() ? this.token.refresh() : Promise.resolve(this.token);

                            case 10:
                                this.token = _context.sent;


                                headers["Authorization"] = "Bearer " + this.token.token.access_token;

                            case 12:
                                body = "";


                                if (method === "POST") {
                                    headers["Content-Type"] = "application/x-www-form-urlencoded";

                                    body = queryString.stringify(data);
                                } else if (Object.keys(data).length && data.constructor === Object) {
                                    callURL = joinUrl(callURL, { trailingSlash: true, query: data });
                                }

                                return _context.abrupt("return", axios(callURL, {
                                    httpsAgent: this.httpsAgent,
                                    httpAgent: this.httpAgent,
                                    method: method,
                                    data: body,
                                    headers: headers
                                }).then(function (response) {
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
                                }));

                            case 15:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function send(_x2, _x3) {
                return _ref.apply(this, arguments);
            }

            return send;
        }()
    }]);
    return APICall;
}();

/**
 * @classdesc Represents the Mpost SDK. It allows the user to make every call to the API with a single function.
 * @class
 */

var Mpost = function () {
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

    function Mpost(options) {
        (0, _classCallCheck3.default)(this, Mpost);

        this.options = options;
        this.baseURL = options.baseURL;
        this.redirectUri = options.redirectUri;

        this.api = new APICall(options.baseURL, options.httpsAgent, options.httpAgent);

        if (typeof options.permanentToken === "string") {
            this.api.permanentToken = options.permanentToken;
            return;
        }

        var oauthBaseUrl = url.resolve(options.baseURL, "/v6/authentication/");

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
                throw new Error("Invalid token format: " + JSON.stringify(options.token, null, 2));
            }
            this.api.token = this.oauth2.accessToken.create(options.token);
        }
    }

    /**
    * Builds OAuth2 authorization URL.
    * @return {String} Authorization URL
    */


    (0, _createClass3.default)(Mpost, [{
        key: "makeAuthorizationURL",
        value: function makeAuthorizationURL(state, scope) {
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

    }, {
        key: "getToken",
        value: function getToken(code) {
            var _this = this;

            var tokenConfig = {
                code: code,
                redirect_uri: this.redirectUri
            };

            return this.oauth2.authorizationCode.getToken(tokenConfig).then(function (result) {
                var token = _this.oauth2.accessToken.create(result);
                _this.api.token = token;
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

    }, {
        key: "userLogin",
        value: function userLogin(params) {
            if (!params.username || !params.password || !params.consumerId) {
                return rejectValidation("authentication", "username, password or consumerId");
            }

            return this.api.send("POST", "v4/users/login/", params);
        }

        /**
        * Create new Delivery Request
        * @return {Promise}
        */

    }, {
        key: "createDeliveryRequest",
        value: function createDeliveryRequest() {
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (!params.pickup_address) {
                return rejectValidation("collection", "Pick Up Address");
            }
            return this.api.send("POST", "v4/delivery-requestd/", params);
        }

        /**
        * Get a list of delivary requests
        * @return {Promise}
        */

    }, {
        key: "getDeliveryRequests",
        value: function getDeliveryRequests() {
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            return this.api.send("GET", "v4/delivery-requests/", params);
        }

        /**
        * Get Distance and Delivery Cost
        * @return {Promise}
        */

    }, {
        key: "calculateDistance",
        value: function calculateDistance() {
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (!params.pickup_address) {
                return rejectValidation("collection", "Pick Up Address");
            }
            return this.api.send("POST", "v4/delivery-requests/distance/", params);
        }
    }]);
    return Mpost;
}();

module.exports = Mpost;