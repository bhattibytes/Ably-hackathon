import Ably from "ably/promises";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });
export const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

const realtime = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

export function useChannel(channelName, callbackOnMessage) {
  const channel = realtime.channels.get(channelName);
  const { data: session, status } = useSession();
  
  const onMount = () => {
   
    channel.subscribe(msg => { 
      if (session && status === 'authenticated' && msg.connectionId === realtime.connection.id) {
        dynamodb.putItem({
          TableName: 'ably_users',
          Item: {
            'id': { S: uuidv4() },
            'email': { S: session.user.email },
            'name': { S: session.user.name },
            'message': { S: msg.data },
            'image': { S: session.user.image },
            'channel': { S: msg.name },
            'author': { S: session.user.name.split(' ')[0] },
            'timestamp': { S: new Date().toISOString() },
            'connectionId': { S: realtime.connection.id },
            'msgId': { S: msg.id },
            'clientId': { S: msg.clientId },
          }
        }, function(err, data) {
          if (err) {
            console.log('Error', err);
          } else {
            console.log('Success MSG: ', msg);
          }
        });
      }
        callbackOnMessage(msg); 
      });
  }

  const onUnmount = () => {
    channel.unsubscribe();
  }

  const useEffectHook = () => {
    onMount();
    return () => { onUnmount(); };
  };

  useEffect(useEffectHook);

  return [channel, realtime];
}