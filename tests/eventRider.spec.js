const chai = require("chai");
const tk = require("timekeeper");
const MParticleEventRider = require("../lib/eventRider");

const { expect } = chai;

const config = {
  apiKey: "someApiKey",
  apiSecret: "someApiSecret",
  suppressSending: true,
};

const voxaEvent = {
  user: { userId: "amzn1.ask.account.123" },
  request: { locale: "en-us" },
  platform: { name: "alexa" },
  rawEvent: {
    context: {
      System: {
        device: {
          supportedInterfaces: {
            AudioPlayer: {},
            "Alexa.Presentation.APL": {
              runtime: {
                maxVersion: "1.2",
              },
            },
          },
        },
      },
    },
  },
};

describe("mParticle Event Rider", () => {
  it("should create a batch of events for development by default", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    expect(mParticle.batch.environment).to.be.equal("development");
  });

  it("should create a batch of events for production when NODE_ENV is equal to production", () => {
    process.env.NODE_ENV = "production";
    const mParticle = new MParticleEventRider(voxaEvent, config);
    expect(mParticle.batch.environment).to.be.equal("production");
    process.env.NODE_ENV = "development";
  });

  it("should add user identities and attributes to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    expect(mParticle.batch.user_identities.customerid).to.be.equal(
      "amzn1.ask.account.123"
    );
    expect(mParticle.batch.user_attributes.voice_platform).to.be.equal("Alexa");
    expect(mParticle.batch.user_attributes.user_id).to.be.equal(
      "amzn1.ask.account.123"
    );
    expect(mParticle.batch.user_attributes.voice_user_id).to.be.equal(
      "amzn1.ask.account.123"
    );
    expect(mParticle.batch.user_attributes.voice_supported_interfaces).to.eql([
      "AudioPlayer",
      "Alexa.Presentation.APL",
    ]);
  });

  it("should add device information to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    expect(mParticle.batch.device_info.device_manufacturer).to.be.equal(
      "Amazon"
    );
    expect(mParticle.batch.device_info.locale_language).to.be.equal("en");
    expect(mParticle.batch.device_info.locale_country).to.be.equal("US");
  });

  it("should be able to add session uuid and time when session starts to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    const sessionId = "amzn1.echo-api.session.123";
    const currentTimestamp = +new Date();
    mParticle.sessionStarted(sessionId, currentTimestamp);

    const sessionStartEvent = mParticle.batch.events.find(
      event => event.event_type === "session_start"
    );

    expect(sessionStartEvent.data.session_uuid).to.be.equal(sessionId);
    expect(sessionStartEvent.data.timestamp_unixtime_ms).to.be.equal(
      currentTimestamp
    );
  });

  it("should be able to add session uuid and time when session ends to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    const sessionId = "amzn1.echo-api.session.123";
    const sessionEndedTimestamp = +new Date();
    tk.freeze(sessionEndedTimestamp);
    const sessionDuration = 5;
    const sessionStartTimestamp = sessionEndedTimestamp - sessionDuration;
    mParticle.sessionEnded(sessionId, sessionStartTimestamp);

    const sessionEndEvent = mParticle.batch.events.find(
      event => event.event_type === "session_end"
    );

    expect(sessionEndEvent.data.session_uuid).to.be.equal(sessionId);
    expect(sessionEndEvent.data.session_duration_ms).to.be.equal(
      sessionDuration
    );
    expect(sessionEndEvent.data.timestamp_unixtime_ms).to.be.equal(
      sessionEndedTimestamp
    );
    tk.reset();
  });

  it("should be able to add navigation events to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    mParticle.addNavigationEvent("stateName");

    const customEvent = mParticle.batch.events.find(
      event => event.event_type === "custom_event"
    );

    expect(customEvent.data.custom_event_type).to.be.equal("navigation");
    expect(customEvent.data.event_name).to.be.equal("stateName");
  });

  it("should be able to add custom events to the batch of events", () => {
    const mParticle = new MParticleEventRider(voxaEvent, config);
    mParticle.addCustomEvent("CustomEvent", {
      customTag: "something",
    });
    mParticle.addCustomEvent("AnotherCustomEvent", {
      customTag: "something else",
    });

    const firstEvent = mParticle.batch.events[0];
    const secondEvent = mParticle.batch.events[1];

    expect(firstEvent.data.custom_event_type).to.be.equal("other");
    expect(firstEvent.data.event_name).to.be.equal("CustomEvent");
    expect(firstEvent.data.custom_attributes).to.eql({
      customTag: "something",
    });

    expect(secondEvent.data.custom_event_type).to.be.equal("other");
    expect(secondEvent.data.event_name).to.be.equal("AnotherCustomEvent");
    expect(secondEvent.data.custom_attributes).to.eql({
      customTag: "something else",
    });
  });
});
