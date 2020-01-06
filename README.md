# Voxa mParticle plugin

A [mParticle](https://www.mparticle.com/) plugin for [Voxa](http://voxa.ai/)

## Installation

```
yarn add voxa-mparticle
```

## Usage

```javascript
const { VoxaApp } = require('voxa');
const voxaMParticle = require("voxa-mparticle");

const voxaApp = new VoxaApp();
const mParticleConfig = {
  apiKey: "mParticle api key",
  apiSecret: "mParticle api secret",
  suppressSending: false, // A flag to supress sending hits.
};

voxaMParticle(voxaApp, mParticleConfig);
```

Features
--------

### Development and Production enviroments

The plugin will configure the enviroment of the batch events according to the `NODE_ENV` used. If `NODE_ENV` is equal to `production` it will create a production batch of events, otherwise it will use a development batch.

### User identity

User attributes are saved as the user id, supported interfaces and voice platform (only Alexa for now)

### Device information

Device information is gathered like device manufacturer (only Amazon for now), language and country.

### Session information

Session id and timestamps are added automatically to the batch when the session starts and ends.

### Navigation events

State transitions are added as navigation events when the transition happens.

### Custom events

You can add any custom events inside your Voxa states. You will have the mParticle plugin available in your `voxaEvent`. You can pass a custom event string and custom attributes as an object.

To add any custom events you can use it like this:

```javascript
const someCustomAttributes = {
  example: true
}
voxaEvent.mParticle.addCustomEvent("CustomEvent", someCustomAttributes);
```

### Saving events

The plugin will automatically send events at the end of each request or at the end of the session.


TODO
--------

- Add support for non Amazon Alexa devices (like 3rd party thermostats and speakers)
- Add support for Google Assistant devices