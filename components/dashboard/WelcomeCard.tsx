import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { ImageViewer } from '@/components/ImageViewer';
import { GradeStats } from '@/utils/dashboard/grades';
import { StudentProfile } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { WelcomeSkeleton } from '@/components/ui/Skeleton';
import { useSecureStore } from '@/hooks/useSecureStore';

interface WelcomeCardProps {
  accountInfo?: StudentProfile | null | never[];
  gradeStats?: GradeStats | null | never[];
  theme: any;
}

export default function WelcomeCard({
  accountInfo,
  gradeStats,
  theme,
}: WelcomeCardProps) {
  const isDark = theme.dark;

  const [hideProfilePicture, , isLoadingPfp] = useSecureStore<boolean>(
    'hide-profilepicture',
    {
      initialValue: false,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

  const showProfilePicture = !hideProfilePicture;

  const isLoading = !accountInfo || !gradeStats || isLoadingPfp;

  if (isLoading) {
    return (
      <Card
        style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}
        elevation={4}
      >
        <Card.Content style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            {showProfilePicture && (
              <View style={{ marginRight: 16 }}>
                <WelcomeSkeleton
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                  isDark={isDark}
                />
              </View>
            )}
            <View style={styles.welcomeText}>
              <WelcomeSkeleton
                style={{ width: 120, height: 28, marginBottom: 6 }}
                isDark={isDark}
              />
              <WelcomeSkeleton
                style={{ width: 160, height: 20, marginBottom: 4 }}
                isDark={isDark}
              />
              <WelcomeSkeleton
                style={{ width: 220, height: 16 }}
                isDark={isDark}
              />
            </View>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <WelcomeSkeleton
                style={{ width: 40, height: 32, marginBottom: 4 }}
                isDark={isDark}
              />
              <WelcomeSkeleton
                style={{ width: 60, height: 14 }}
                isDark={isDark}
              />
            </View>

            <View style={styles.quickStat}>
              <WelcomeSkeleton
                style={{ width: 40, height: 32, marginBottom: 4 }}
                isDark={isDark}
              />
              <WelcomeSkeleton
                style={{ width: 50, height: 14 }}
                isDark={isDark}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}
      elevation={4}
    >
      <Card.Content style={styles.welcomeContent}>
        <View style={styles.welcomeHeader}>
          {showProfilePicture && (
            <View style={{ marginRight: 16 }}>
              <ImageViewer
                imageUrl={(accountInfo as StudentProfile).profilePicturePath}
                size={60}
                fallbackSource={require('@/assets/images/icon.png')}
              />
            </View>
          )}

          <View style={styles.welcomeText}>
            <Text
              variant="headlineSmall"
              style={[styles.welcomeTitle, { color: theme.colors.onPrimary }]}
            >
              Vítej zpět!
            </Text>

            <Text
              variant="bodyLarge"
              style={[
                styles.welcomeSubtitle,
                { color: theme.colors.onPrimary },
              ]}
            >
              {(accountInfo as StudentProfile).fullName || 'Student'}
            </Text>

            <Text
              variant="bodyMedium"
              style={[styles.welcomeClass, { color: theme.colors.onPrimary }]}
            >
              {(accountInfo as StudentProfile).username || ''} •{' '}
              {(accountInfo as StudentProfile).className || ''} •{' '}
              {(accountInfo as StudentProfile).classGroups}
            </Text>
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text
              variant="titleLarge"
              style={[styles.quickStatValue, { color: theme.colors.onPrimary }]}
            >
              {(gradeStats as GradeStats).average}
            </Text>

            <Text
              variant="bodySmall"
              style={[styles.quickStatLabel, { color: theme.colors.onPrimary }]}
            >
              Průměr
            </Text>
          </View>

          <View style={styles.quickStat}>
            <Text
              variant="titleLarge"
              style={[styles.quickStatValue, { color: theme.colors.onPrimary }]}
            >
              {(gradeStats as GradeStats).totalGrades}
            </Text>

            <Text
              variant="bodySmall"
              style={[styles.quickStatLabel, { color: theme.colors.onPrimary }]}
            >
              Známek
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    margin: 16,
    borderRadius: 20,
  },
  welcomeContent: {
    paddingVertical: 12,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeClass: {
    opacity: 0.9,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  quickStatLabel: {
    marginTop: 4,
    opacity: 0.9,
  },
});
