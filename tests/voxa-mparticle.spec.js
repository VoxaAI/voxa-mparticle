const chai = require("chai");
const tk = require("timekeeper");
const simple = require("simple-mock");
const { AlexaPlatform, VoxaApp } = require("voxa");
const voxaMParticle = require("../lib/voxa-mparticle");
const eventRider = require("../lib/eventRider");

const { expect } = chai;
const sessionId = "amzn1.echo-api.session.123";
const userId = "amzn1.ask.account.123";

const alexaEvent = {
  user: { userId },
  session: {
    new: true,
    sessionId,
    user: { userId },
  },
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
  request: {
    type: "IntentRequest",
    locale: "en-us",
    intent: {
      name: "SomeIntent",
    },
  },
};

describe("voxa-mparticle", () => {
  let mParticle;
  let voxaApp;
  let alexaPlatform;
  let currentTimestamp;

  beforeEach(() => {
    voxaApp = new VoxaApp({ views: {} });
    alexaPlatform = new AlexaPlatform(voxaApp);
    currentTimestamp = +new Date();
    tk.freeze(currentTimestamp);
    voxaMParticle(voxaApp, {
      apiKey: "someApiKey",
      apiSecret: "someApiSecret",
      suppressSending: false,
    });

    voxaApp.onIntentRequest(event => {
      mParticle = event.mParticle;
    });

    voxaApp.onIntent("SomeIntent", () => ({ to: "SomeState" }));
    voxaApp.onState("SomeState", () => ({ to: "AnotherState" }));
    voxaApp.onState("AnotherState", () => ({ to: "die" }));

    simple.mock(eventRider.prototype, "saveEvents").returnWith(undefined);
  });

  afterEach(() => {
    mParticle = undefined;
    currentTimestamp = undefined;
    tk.reset();
    simple.restore();
  });

  it("should initializate the mParticle plugin", async () => {
    await alexaPlatform.execute(alexaEvent, {});
    expect(mParticle).to.not.be.undefined;
  });

  it("should set the session start and end data", async () => {
    await alexaPlatform.execute(alexaEvent, {});

    const sessionStartEvent = mParticle.batch.events.find(
      event => event.event_type === "session_start"
    );
    expect(sessionStartEvent.data.session_uuid).to.be.equal(
      "amzn1.echo-api.session.123"
    );
    expect(sessionStartEvent.data.timestamp_unixtime_ms).to.be.equal(
      currentTimestamp
    );

    const sessionEndEvent = mParticle.batch.events.find(
      event => event.event_type === "session_end"
    );
    expect(sessionEndEvent.data.session_uuid).to.be.equal(
      "amzn1.echo-api.session.123"
    );
    expect(sessionEndEvent.data.session_duration_ms).to.be.equal(0); // Because time is freezed, real data should be 1 or more
    expect(sessionEndEvent.data.timestamp_unixtime_ms).to.be.equal(
      currentTimestamp
    );
  });

  it("should set all states in the flow for navigation events", async () => {
    await alexaPlatform.execute(alexaEvent, {});

    const customEvents = mParticle.batch.events;

    const navigationEvents = [
      customEvents[1],
      customEvents[2],
      customEvents[3],
    ];

    navigationEvents.forEach(navEvent =>
      expect(navEvent.data.custom_event_type).to.be.equal("navigation")
    );
    expect(navigationEvents[0].data.event_name).to.be.equal("SomeIntent");
    expect(navigationEvents[1].data.event_name).to.be.equal("SomeState");
    expect(navigationEvents[2].data.event_name).to.be.equal("AnotherState");
  });

  it("should save the events just one time", async () => {
    await alexaPlatform.execute(alexaEvent, {});

    expect(mParticle.saveEvents.callCount).to.be.equal(1);
  });
});
