<template>
  <div>
    <video ref="video" autoplay playsinline muted />
  </div>
</template>

<script>

import sqs from '../utils/sqs'

const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })

export default {
  name: 'IndexPage',
  async mounted () {
    this.$refs.video.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    })
    //      const videoTracks = this.$refs.video.captureStream().getVideoTracks()

    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        console.log(event)
        await this.$axios.$post('/candidate', event.candidate)
      }
    })
    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'connected') {
        alert('Peers connected!')
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
      if (m.answer) {
        console.log('received answer', m.answer)
        const remoteDesc = new RTCSessionDescription(m.answer)
        await peerConnection.setRemoteDescription(remoteDesc)
      } else if (m.iceCandidate) {
        try {
          await peerConnection.addIceCandidate(m.iceCandidate)
        } catch (e) {
          console.error('Error adding received ice candidate', e)
        }
      } else {
        console.log('ignoring', m)
      }
    }
  }
}
</script>
