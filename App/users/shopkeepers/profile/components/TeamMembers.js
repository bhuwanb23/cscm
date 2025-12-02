import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const TeamMembers = ({ teamMembers }) => {
  return (
    <CSCMCard title="Connected Team Members">
      {teamMembers.map((member) => (
        <View key={member.id} style={styles.memberItem}>
          <View style={styles.memberInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
              <Text style={styles.memberContact}>{member.contact}</Text>
            </View>
          </View>
          
          <View style={styles.memberActions}>
            <View style={styles.permissionsContainer}>
              {member.permissions.map((permission, index) => (
                <View key={index} style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>{permission}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.lastActive}>Active: {member.lastActive}</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.slateDark} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </CSCMCard>
  );
};

const styles = StyleSheet.create({
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.indigoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.indigo,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  memberRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 2,
  },
  memberContact: {
    ...TYPOGRAPHY.small,
    color: COLORS.indigo,
    marginTop: 2,
  },
  memberActions: {
    alignItems: 'flex-end',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  permissionBadge: {
    backgroundColor: COLORS.slateLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
  permissionText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  lastActive: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
    marginBottom: 4,
  },
  actionButton: {
    padding: 4,
  },
});

export default TeamMembers;