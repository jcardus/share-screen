<template>
  <div style="padding: 30px; font-size: x-large; margin: auto;">
    <p>{{ $t('welcome') }}</p>
    <video ref="video" autoplay playsinline muted style="width: 75%" />
  </div>
</template>

<script>

import sqs from '../utils/sqs'

let peerConnection = null

export default {
  name: 'IndexPage',
  async mounted () {
    this.candidates = []
    this.$refs.video.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    })
    const videoTracks = this.$refs.video.captureStream().getVideoTracks()
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    videoTracks.forEach(track => peerConnection.addTrack(track, this.$refs.video.srcObject))
    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        console.log('event', event)
        const message = { candidate: event.candidate }
        if (this.offerSent) {
          console.log('sending', message)
          await this.$axios.$post('/', message)
        } else {
          console.log('holding candidate')
          this.candidates.push(message)
        }
      }
    })
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log('sending', offer)
    await this.$axios.$post('/', offer)
    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'connected') {
        console.log('Peers connected!')
      }
    })
    sqs.setMessageReceived(this.onMessageReceived)
    sqs.start().then()
    if (this.candidates) {
      for (const c of this.candidates) {
        await this.$axios.$post('/', c)
      }
    }
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
