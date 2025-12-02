import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const MessageItem = ({ message, onPress, index }) => {
  const handlePress = () => {
    onPress(message);
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? '#22C55E' : '#9CA3AF';
  };

  return (
    <View style={styles.messageWrapper}>
      <TouchableOpacity 
        style={styles.messageCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.messageGradient}>
          <View style={styles.messageContent}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: message.avatar }} 
                style={styles.avatar}
              />
              <View 
                style={[styles.statusIndicator, { backgroundColor: getStatusColor(message.isOnline) }]}
              />
            </View>
            
            <View style={styles.messageDetails}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName} numberOfLines={1}>{message.name}</Text>
                <View style={styles.messageMeta}>
                  {message.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{message.unreadCount}</Text>
                    </View>
                  )}
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              </View>
              <Text style={styles.lastMessage} numberOfLines={2}>
                {message.lastMessage}
              </Text>
              
              {/* Detailed information */}
              {message.details && (
                <View style={styles.detailsContainer}>
                  {Object.keys(message.details).map((key, idx) => (
                    <View key={idx} style={styles.detailRow}>
                      <Text style={styles.detailKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Text>
                      <Text style={styles.detailValue}>{message.details[key]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const MessagesSection = ({ messages, onMessagePress, onNewChatPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={onNewChatPress} style={styles.newChatButton}>
            <View style={styles.newChatGradient}>
              <Ionicons name="add" size={12} color="#FFFFFF" />
              <Text style={styles.newChatText}>New Chat</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.messagesList}>
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              onPress={onMessagePress}
              index={index}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  newChatButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: '#22C55E',
  },
  newChatText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesList: {
    gap: 6,
  },
  messageWrapper: {
    marginBottom: 2,
  },
  messageCard: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  messageGradient: {
    padding: 10,
  },
  messageContent: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
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
    fontSize: 10,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 4,
  },
  detailsContainer: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailKey: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 9,
    color: '#4B5563',
    flex: 1,
  },
});

export default MessagesSection;