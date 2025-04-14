import "./style.css";
import { getHTMLElementById, includeHTML } from "./utils";
import appHtml from "./html/app.html?raw";
import { WebRtcConncetion } from "./services/webrtc/webrtc-connection";

await includeHTML("app", appHtml);

const localMedieaEl = document.getElementById("local-video");
const remoteMedieaEl = document.getElementById("remote-video");

if (!localMedieaEl || !(localMedieaEl instanceof HTMLVideoElement)) {
  throw "local media element not found";
}
if (!remoteMedieaEl || !(remoteMedieaEl instanceof HTMLVideoElement)) {
  throw "local media element not found";
}

const webrtc = new WebRtcConncetion({
  constraints: {
    audio: true,
    video: false,
  },
  localMedieaEl,
  remoteMedieaEl,
  polite: false,
});

const callBtn = getHTMLElementById("btn-call", HTMLButtonElement);
const answerBtn = getHTMLElementById("btn-answer", HTMLButtonElement);

callBtn.onclick = () => {
  webrtc.start();
};
