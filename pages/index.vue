<template>
  <div>
    <video ref="video" autoplay playsinline muted />
  </div>
</template>

<script>

import sqs from '../utils/sqs'

const pc1 = new RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:openrelay.metered.ca:80'
    },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
})

export default {
  name: 'IndexPage',
  data () {
    return {

    }
  },
  async mounted () {
    this.$refs.video.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    })
    //      const videoTracks = this.$refs.video.captureStream().getVideoTracks()

    pc1.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        await this.$axios.$post('/candidate', event.candidate)
      }
    })
    const offer = await pc1.createOffer()
    await pc1.setLocalDescription(offer)
    await this.$axios.$post('/', offer)
    const message = await sqs.receiveMessage()
    console.log('message', message)
  }
}
</script>
