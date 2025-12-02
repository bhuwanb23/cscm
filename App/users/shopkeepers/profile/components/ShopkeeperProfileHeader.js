import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const ShopkeeperProfileHeader = ({ shopkeeperProfile, onEditProfile }) => {
  return (
    <CSCMCard style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="storefront" size={32} color={COLORS.indigo} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.shopNameContainer}>
            <Text style={styles.shopName}>{shopkeeperProfile.shopName}</Text>
            {shopkeeperProfile.verificationStatus && (
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.ownerName}>Owned by {shopkeeperProfile.ownerName}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
          <Ionicons name="pencil" size={16} color={COLORS.white} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.metadataContainer}>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Shop ID</Text>
          <Text style={styles.metadataValue}>{shopkeeperProfile.shopId}</Text>
        </View>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Location</Text>
          <Text style={styles.metadataValue}>{shopkeeperProfile.location}</Text>
        </View>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Category</Text>
          <Text style={styles.metadataValue}>{shopkeeperProfile.category}</Text>
        </View>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Joined</Text>
          <Text style={styles.metadataValue}>{shopkeeperProfile.joinedDate}</Text>
        </View>
      </View>
      
      <View style={styles.nodesContainer}>
        <Text style={styles.nodesLabel}>Connected Nodes:</Text>
        <View style={styles.nodesList}>
          {shopkeeperProfile.connectedNodes.map((node, index) => (
            <View key={index} style={styles.nodeTag}>
              <Text style={styles.nodeText}>{node}</Text>
            </View>
          ))}
        </View>
      </View>
    </CSCMCard>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    padding: 0, // Override default padding for custom header styling
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.indigoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  shopNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    ...TYPOGRAPHY.h1,
    marginRight: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationText: {
    ...TYPOGRAPHY.small,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  ownerName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.indigo,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  metadataItem: {
    width: '50%',
    marginBottom: 12,
  },
  metadataLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
    marginBottom: 2,
  },
  metadataValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  nodesContainer: {
    padding: 20,
  },
  nodesLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginBottom: 8,
  },
  nodesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nodeTag: {
    backgroundColor: COLORS.slateLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  nodeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '500',
  },
});

export default ShopkeeperProfileHeader;