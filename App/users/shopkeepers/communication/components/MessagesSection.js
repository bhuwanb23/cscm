import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const MessageItem = ({ message, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.messageCard}
      onPress={() => onPress(message)}
    >
      <View style={styles.messageContent}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: message.avatar }} 
            style={styles.avatar}
          />
          <View style={[
            styles.statusIndicator,
            { backgroundColor: message.isOnline ? COLORS.success : COLORS.gray[400] }
          ]} />
        </View>
        
        <View style={styles.messageDetails}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageName}>{message.name}</Text>
            <View style={styles.messageMeta}>
              {message.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{message.unreadCount}</Text>
                </View>
              )}
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {message.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MessagesSection = ({ messages, onMessagePress, onNewChatPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <TouchableOpacity onPress={onNewChatPress}>
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.messagesList}>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onPress={onMessagePress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  messageDetails: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  lastMessage: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
});

export default MessagesSection;
