import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ChatBubble from './ChatBubble';
import { useStore } from '../../store';

export default function ChatList() {
  const messages = useStore(state => state.messages);
  const flashListRef = useRef<any>(null);

  useEffect(() => {
    if (messages.length > 0 && flashListRef.current) {
      flashListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <FlashList
        ref={flashListRef}
        data={messages}
        renderItem={({ item }) => <ChatBubble message={item} />}
        // @ts-ignore
        estimatedItemSize={100}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}
      />
    </View>
  );
}
