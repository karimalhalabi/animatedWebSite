// Offerers create transceivers before offering. Answerers reuse the offered
// transceivers after setRemoteDescription, avoiding duplicate receive-only lines.
export async function attachLocalTracks(pc, media, screen) {
  for (const kind of ["audio", "video"]) {
    const transceiver =
      pc.getTransceivers().find((t) => t.receiver.track.kind === kind) ||
      pc.addTransceiver(kind, { direction: "sendrecv" });
    transceiver.direction = "sendrecv";
    if (media) transceiver.sender.setStreams(media);
    const track =
      kind === "video" && screen
        ? screen.getVideoTracks()[0]
        : media?.getTracks().find((t) => t.kind === kind);
    await transceiver.sender.replaceTrack(track || null);
  }
}
