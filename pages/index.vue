<template>
  <div>
    <video ref="video" autoplay playsinline muted />
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  async mounted () {
    this.$refs.video.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    })
  }
}
</script>
