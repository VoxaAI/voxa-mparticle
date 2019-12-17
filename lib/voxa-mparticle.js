const _ = require("lodash");
const MParticleEventRider = require("./eventRider");

function register(voxaApp, config) {
  voxaApp.onRequestStarted(async voxaEvent => {
    voxaEvent.mParticle = new MParticleEventRider(voxaEvent, config);
  });

  voxaApp.onSessionStarted(voxaEvent => {
    const sessionId = _.get(voxaEvent, "rawEvent.session.sessionId");
    const currentTimestamp = +new Date();
    voxaEvent.model.sessionStartedTimestamp = currentTimestamp;
    voxaEvent.mParticle.sessionStarted(sessionId, currentTimestamp);
  });

  voxaApp.onBeforeStateChanged((voxaEvent, reply, state) => {
    voxaEvent.mParticle.addNavigationEvent(state.name);
  });

  voxaApp.onSessionEnded(voxaEvent => {
    const sessionId = _.get(voxaEvent, "rawEvent.session.sessionId");
    voxaEvent.mParticle.sessionEnded(
      sessionId,
      voxaEvent.model.sessionStartedTimestamp
    );
    if (!voxaEvent.mParticle.config.suppressSending) {
      voxaEvent.mParticle.saveEvents();
      voxaEvent.model.mParticleEventsSaved = true;
    }
  });

  voxaApp.onBeforeReplySent(voxaEvent => {
    if (
      !voxaEvent.model.mParticleEventsSaved &&
      !voxaEvent.mParticle.config.suppressSending
    ) {
      voxaEvent.mParticle.saveEvents();
    }
  });
}

module.exports = register;
