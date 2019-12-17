# Voxa mParticle plugin

A [mParticle](https://www.mparticle.com/) plugin for [Voxa](http://voxa.ai/)

## Installation

```
yarn add voxa-mparticle
```

## Usage

```
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