import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const client = new SQSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey
  }
})

let _messageReceived = null

export default {
  started: false,
  setMessageReceived: (messageReceived) => { _messageReceived = messageReceived },
  async start () {
    this.started = true
    while (this.started) {
      const message = await client.send(new ReceiveMessageCommand({ QueueUrl: process.env.QueueUrl, WaitTimeSeconds: 2 }))
      if (message && message.Messages && message.Messages.length) {
        for (const m of message.Messages) {
          try {
            await client.send(new DeleteMessageCommand({
              QueueUrl: process.env.QueueUrl,
              ReceiptHandle: m.ReceiptHandle
            }))
            await _messageReceived(JSON.parse(m.Body))
          } catch (e) {
            alert(e)
          }
        }
      }
    }
  },
  stop () {
    this.started = false
  }
}
