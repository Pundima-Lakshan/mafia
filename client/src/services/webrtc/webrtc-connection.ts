import { SignalingChannel } from "./signaling-channel";

interface WebRtcConncetionConfig {
  constraints: { audio: boolean; video: boolean };
  localMedieaEl: HTMLAudioElement | HTMLVideoElement;
  remoteMedieaEl: HTMLAudioElement | HTMLVideoElement;
  polite: boolean;
}

export class WebRtcConncetion {
  private config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  };

  private signaler: SignalingChannel;
  private pc: RTCPeerConnection;

  private makingOffer = false;
  private ignoreOffer = false;
  private isSettingRemoteAnswerPending = false;

  constraints = { audio: true, video: false };
  polite = false;

  localMedieEl: HTMLAudioElement | HTMLVideoElement;
  remoteMediaEl: HTMLAudioElement | HTMLVideoElement;

  constructor(config: WebRtcConncetionConfig) {
    this.constraints = config.constraints;
    this.localMedieEl = config.localMedieaEl;
    this.remoteMediaEl = config.remoteMedieaEl;
    this.polite = config.polite;

    this.signaler = new SignalingChannel("ws://example.com/socket");
    this.pc = new RTCPeerConnection(this.config);

    this.pc.ontrack = ({ track, streams }) => {
      track.onunmute = () => {
        if (this.remoteMediaEl.srcObject) {
          return;
        }
        this.remoteMediaEl.srcObject = streams[0];
      };
    };

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.signaler.send({ description: this.pc.localDescription });
      } catch (err) {
        console.error(err);
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onicecandidate = ({ candidate }) =>
      this.signaler.send({ candidate });

    this.signaler.onmessage = async ({ data: { description, candidate } }) => {
      try {
        if (description) {
          const readyForOffer =
            !this.makingOffer &&
            (this.pc.signalingState === "stable" ||
              this.isSettingRemoteAnswerPending);
          const offerCollision = description.type === "offer" && !readyForOffer;

          this.ignoreOffer = !this.polite && offerCollision;
          if (this.ignoreOffer) {
            return;
          }
          this.isSettingRemoteAnswerPending = description.type == "answer";
          await this.pc.setRemoteDescription(description);
          this.isSettingRemoteAnswerPending = false;
          if (description.type === "offer") {
            await this.pc.setLocalDescription();
            this.signaler.send({ description: this.pc.localDescription });
          }
        } else if (candidate) {
          try {
            await this.pc.addIceCandidate(candidate);
          } catch (err) {
            if (!this.ignoreOffer) {
              throw err;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        this.constraints,
      );
      for (const track of stream.getTracks()) {
        this.pc.addTrack(track, stream);
      }
      this.localMedieEl.srcObject = stream;
    } catch (err) {
      console.error(err);
    }
  }
}
