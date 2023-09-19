import Ably from "ably/promises";
import { useEffect } from 'react'

const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

export function useChannel(channelName, callbackOnMessage) {
  const channel = ably.channels.get(`[?rewind=2m&rewindLimit=10]${channelName}`);
  
  const onMount = () => {
      channel.subscribe(msg => { callbackOnMessage(msg); });
  }

  const onUnmount = () => {
      channel.unsubscribe();
  }

  const useEffectHook = () => {
      onMount();
      return () => { onUnmount(); };
  };

  useEffect(useEffectHook);

  return [channel, ably];
}