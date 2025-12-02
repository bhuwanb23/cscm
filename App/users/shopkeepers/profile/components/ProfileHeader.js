import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const ProfileHeader = ({ shopInfo, stats, onEditProfile }) => {
  return (
    <View style={styles.profileHero}>
      <View style={styles.gradientBackground}></View>
      
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: shopInfo.avatar }} 
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.shopName}>{shopInfo.name}</Text>
      </View>
      
      <View style={styles.shopInfo}>
        <Text style={styles.shopId}>Shop ID: {shopInfo.id}</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot}></View>
            <Text style={styles.statusText}>{shopInfo.status}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{shopInfo.role}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.statValue}>{stats.rating}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Orders</Text>
          <Text style={styles.statValue}>{stats.orders}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Join Date</Text>
          <Text style={styles.statValue}>{stats.joinDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileHero: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 96,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    zIndex: 1,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIcon: {
    color: '#fff',
    fontSize: 16,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  shopInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shopId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#22c55e',
  },
  roleBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
});

export default ProfileHeader;