import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const client = new SQSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey
  }
})

let _messageReceived = null

export default {
  setMessageReceived: (messageReceived) => { _messageReceived = messageReceived },
  async start () {
    while (true) {
      const message = await client.send(new ReceiveMessageCommand({ QueueUrl: process.env.QueueUrl, WaitTimeSeconds: 10 }))
      if (message && message.Messages && message.Messages.length && _messageReceived) {
        for (const m of message.Messages) {
          await client.send(new DeleteMessageCommand({
            QueueUrl: process.env.QueueUrl,
            ReceiptHandle: m.ReceiptHandle
          }))
          await _messageReceived(JSON.parse(m.Body))
        }
      }
    }
  }
}
