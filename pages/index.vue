<template>
  <div>
    <video ref="video" autoplay playsinline muted />
  </div>
</template>

<script>

import sqs from '../utils/sqs'

let peerConnection = null

export default {
  name: 'IndexPage',
  async mounted () {
    this.$refs.video.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    })
    const videoTracks = this.$refs.video.captureStream().getVideoTracks()
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    videoTracks.forEach(track => peerConnection.addTrack(track, this.$refs.video.srcObject))
    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        await this.$axios.$post('/', { candidate: event.candidate })
      }
    })
    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'connected') {
        console.log('Peers connected!')
      }
    })
    sqs.setMessageReceived(this.onMessageReceived)
    sqs.start().then()

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    await this.$axios.$post('/', offer)
  },
  methods: {
    async onMessageReceived (m) {
      console.log('message received', m)
      if (m.answer) {
        console.log('add remote', m.answer)
        const remoteDesc = new RTCSessionDescription(m.answer)
        await peerConnection.setRemoteDescription(remoteDesc)
      } else if (m.candidate) {
        await peerConnection.addIceCandidate(m.candidate)
      }
    }
  }
}
</script>
