import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const MessageItem = ({ message, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress(message);
  };

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.messageCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.messageGradient}
        >
          <View style={styles.messageContent}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: message.avatar }} 
                style={styles.avatar}
              />
              <LinearGradient
                colors={message.isOnline ? ['#22C55E', '#16A34A'] : ['#9CA3AF', '#6B7280']}
                style={styles.statusIndicator}
              />
            </View>
            
            <View style={styles.messageDetails}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName} numberOfLines={1}>{message.name}</Text>
                <View style={styles.messageMeta}>
                  {message.unreadCount > 0 && (
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.unreadBadge}
                    >
                      <Text style={styles.unreadText}>{message.unreadCount}</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              </View>
              <Text style={styles.lastMessage} numberOfLines={2}>
                {message.lastMessage}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MessagesSection = ({ messages, onMessagePress, onNewChatPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={onNewChatPress} style={styles.newChatButton}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.newChatGradient}
            >
              <Ionicons name="add" size={12} color="#FFFFFF" />
              <Text style={styles.newChatText}>New Chat</Text>
            </LinearGradient>
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
      </LinearGradient>
    </Animated.View>
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
