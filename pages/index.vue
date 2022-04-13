<template>
  <div style="padding: 30px; font-size: large; margin: auto;">
    <p>{{ message }} {{ getConnected }}</p>
    <div v-if="!connected">
      {{ logMessage }}
    </div>
    <video ref="video" autoplay playsinline muted style="width: 75%" />
  </div>
</template>

<script>

import sqs from '../utils/sqs'

let peerConnection = null

export default {
  name: 'IndexPage',
  data () {
    return {
      connected: false,
      logMessage: ''
    }
  },
  computed: {
    getConnected () {
      switch (navigator.language) {
        case 'pt':
          return this.connected ? 'Sim' : 'Não'
        case 'fr':
          return this.connected ? 'Oui' : 'Non'
        case 'es':
          return this.connected ? 'Si' : 'No'
        default:
          return this.connected
      }
    },
    message () {
      switch (navigator.language) {
        case 'pt':
          return 'A partilhar o ecrã:'
        case 'fr':
          return 'Sharing your screen:'
        case 'es':
          return 'Compartiendo tu pantalla:'
        default:
          return 'Sharing your screen:'
      }
    }
  },
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
      if (this.connected) { return }
      if (event.candidate) {
        const message = { candidate: event.candidate }
        if (this.offerSent) {
          this.logMessage = 'sending' + JSON.stringify(message)
          await this.$axios.$post('/', message)
        } else {
          this.logMessage = 'holding candidate'
          this.candidates.push(message)
        }
      }
    })
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    this.logMessage = 'sending' + JSON.stringify(offer)
    await this.$axios.$post('/', offer)
    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'connected') {
        this.connected = true
        sqs.stop()
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
      if (this.connected) {
        this.logMessage = 'ignoring message because connected...'
        return
      }
      if (m.answer && !this.remoteSet) {
        const remoteDesc = new RTCSessionDescription(m.answer)
        this.logMessage = 'add remote...'
        await peerConnection.setRemoteDescription(remoteDesc)
        this.remoteSet = true
      } else if (m.candidate && this.remoteSet) {
        await peerConnection.addIceCandidate(m.candidate)
      }
    }
  }
}
</script>
