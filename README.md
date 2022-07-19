# Mpost JavaScript SDK

This SDK aims to help the development of integrations with
[Mpost](https://mpost.co.ke/) that use JavaScript, providing an easy
interface to communicate with
[Mpost's REST API](https://mpost.co.ke/).


## Requirements

To use this SDK, you will need:

- [Node.js **v6.3.0 or above**](https://nodejs.org/)

Node installation will include [NPM](https://www.npmjs.com/), which is
responsible for dependency management.

## Installation

### Node.js

`npm install @mpost/mpost-js-sdk`

`import Mpost from '@mpost/mpost-js-sdk';`


## Usage

This SDK relies heavily on [Promises](https://developers.google.com/web/fundamentals/getting-started/primers/promises),
making it easier to handle the asynchronous requests made to the API. The SDK
provides a `Mpost` object containing several methods which map to the
calls and parameters described in
[Mpost's API documentation](https://mpost.co.ke/).

The following snippet is a generic example of how to use the SDK. If you need
details for a specific module, refer to the
[samples folder](https://github.com/ekbaya/mpost-js-sdk/tree/master/samples).

Before executing any request, you need to authorize the calls to the API:


#### Using a permanent token
```js
const mpost = new Mpost({
  baseURL: "https//portal.mpost.com/api/",
  permanentToken: "<token>",
});
```

#### Using OAuth2

1. Call the constructor with your configuration

```js
const mpost = new Mpost({
  baseURL: "https://portal.mpost.com/api/",
  clientId: "<your OAuth2 client id>",
  clientSecret: "<your OAuth2 client secret>",
  redirectUri: "<url where user will be redirected after authenticating>"
});
```

2. Create an authorization URL, login and get one-time authorization code

```js
const authorizationURL = mpost.makeAuthorizationURL();
```

3. Exchange code for an access token

```js
mpost.getToken(code);
```

If you already have an access token, you can also initialize Bynder with the
token directly:

```js
const mpost = new Mpost({
  baseURL: "http://api-url.mpost.io/api/",
  clientId: "<your OAuth2 client id>",
  clientSecret: "<your OAuth2 client secret>",
  redirectUri: "<url where user will be redirected after authenticating>",
  token: "<OAuth2 access token>"
});
```

#### Making requests

You can now use the various methods from the SDK to create delivery requests, fetch delivery requests
and other data. Following the Promises notation, you should use
`.then()`/`.catch()` to handle the successful and failed requests,
respectively.

Most of the calls take an object as the only parameter but please refer to the
API documentation to tune the query as intended.

```js
mpost
  .getDeliveryRequests({
    limit: 20,
    page: 1
  })
  .then(data => {
    // TODO Handle data
  })
  .catch(error => {
    // TODO Handle the error
  });
```
