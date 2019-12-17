const _ = require("lodash");
const mParticle = require("mparticle");

class MParticleEventRider {
  constructor(voxaEvent, config) {
    this.config = config;
    this.api = new mParticle.EventsApi(
      new mParticle.Configuration(config.apiKey, config.apiSecret)
    );
    this.batch = new mParticle.Batch(mParticle.Batch.Environment.development);

    if (process.env.NODE_ENV === "production") {
      this.batch = new mParticle.Batch(mParticle.Batch.Environment.production);
    }

    this.addUserIdentityToBatch(voxaEvent);
    this.addDeviceInfoToBatch(voxaEvent);
  }

  addUserIdentityToBatch(voxaEvent) {
    const userIdentities = new mParticle.UserIdentities();
    const userId = _.get(voxaEvent, "model.user.userId", voxaEvent.user.userId);

    userIdentities.customerid = userId;
    this.batch.user_identities = userIdentities;

    const supportedInterfaces = _.keys(
      voxaEvent.rawEvent.context.System.device.supportedInterfaces
    );

    this.batch.user_attributes = {
      voice_platform: "Alexa",
      user_id: userId,
      voice_supported_interfaces: supportedInterfaces,
      voice_user_id: userId,
    };
  }

  addDeviceInfoToBatch(voxaEvent) {
    const deviceInfo = new mParticle.DeviceInformation();
    deviceInfo.device_manufacturer = "Amazon";
    deviceInfo.locale_language = voxaEvent.request.locale.split("-")[0];
    deviceInfo.locale_country = _.upperCase(
      voxaEvent.request.locale.split("-")[1]
    );
    this.batch.device_info = deviceInfo;
  }

  sessionStarted(sessionId, currentTimestamp) {
    this.sessionStart = new mParticle.SessionStartEvent();
    this.sessionStart.session_uuid = sessionId;
    this.sessionStart.timestamp_unixtime_ms = currentTimestamp;

    this.batch.addEvent(this.sessionStart);
  }

  sessionEnded(sessionId, sessionStartedTimestamp) {
    const sessionEnd = new mParticle.SessionEndEvent();
    sessionEnd.session_uuid = sessionId;
    const currentTimestamp = +new Date();
    sessionEnd.session_duration_ms = currentTimestamp - sessionStartedTimestamp;
    sessionEnd.timestamp_unixtime_ms = currentTimestamp;

    this.batch.addEvent(sessionEnd);
  }

  addNavigationEvent(state) {
    const event = new mParticle.AppEvent(
      mParticle.AppEvent.CustomEventType.navigation,
      state
    );
    this.batch.addEvent(event);
  }

  addCustomEvent(eventName, eventCustomTags) {
    const event = new mParticle.AppEvent(
      mParticle.AppEvent.CustomEventType.other,
      eventName
    );

    event.custom_attributes = {
      ...eventCustomTags,
    };

    this.batch.addEvent(event);
  }

  saveEvents() {
    this.api.bulkUploadEvents([this.batch], error => {
      if (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
      } else {
        // tslint:disable-next-line:no-console
        console.log("API called successfully.");
      }
    });
  }
}

module.exports = MParticleEventRider;
