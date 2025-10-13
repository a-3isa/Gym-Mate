import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, List, useTheme } from 'react-native-paper';
import { SPACING } from '@utils/constants';

const ProfileScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Avatar.Icon
        size={96}
        icon="account"
        style={styles.avatar}
        color={colors.onPrimary}
        theme={{ colors: { primary: colors.primary } }}
      />
      <Text variant="headlineSmall" style={[styles.username, { color: colors.onSurface }] }>
        User Name
      </Text>
      <List.Section style={styles.listSection}>
        <List.Item title="Edit Profile" left={(props) => <List.Icon {...props} icon="account-edit" />} />
        <List.Item title="Settings" left={(props) => <List.Icon {...props} icon="cog" />} />
        <List.Item title="Logout" left={(props) => <List.Icon {...props} icon="logout" />} />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg
  },
  avatar: {
    marginBottom: SPACING.md
  },
  username: {
    marginBottom: SPACING.lg
  },
  listSection: {
    alignSelf: 'stretch'
  }
});

export default ProfileScreen;
