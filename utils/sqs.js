import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const client = new SQSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey
  }
})

export default {
  receiveMessage: () => client.send(new ReceiveMessageCommand({ QueueUrl: process.env.QueueUrl }))
}
