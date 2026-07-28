import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, List, Text, useTheme } from 'react-native-paper';

interface AnnouncementFlag {
  kind: 'showAllEntries' | 'unknown';
  value?: string;
}

interface Announcement {
  id: number;
  author: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  textContent: string | null;
  classes: string[];
  flags: AnnouncementFlag[];
}

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  style?: any;
}

export function AnnouncementsSection({
  announcements,
  style,
}: AnnouncementsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const visibleAnnouncements = useMemo(() => {
    return announcements.filter(
      a => a.textContent !== null && a.textContent.trim() !== ''
    );
  }, [announcements]);

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      <List.Accordion
        title="Oznámení"
        titleStyle={{ fontWeight: 'bold' }}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        left={props => <List.Icon {...props} icon="information" />}
        style={styles.accordion}
      >
        <View style={styles.listContainer}>
          {visibleAnnouncements.map(announcement => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </View>
      </List.Accordion>
    </View>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const theme = useTheme();

  const dateText = useMemo(() => {
    try {
      // Assuming dates come in "YYYY-MM-DD" format
      const parseDate = (dateString: string) => {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Removes leading zeros (e.g., 2026-07-05 -> 5.7.2026)
          return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}.${parts[0]}`;
        }
        return dateString;
      };

      const start = parseDate(announcement.startDate);
      const end = parseDate(announcement.endDate);

      if (start && end) {
        return start !== end ? `${start} - ${end}` : start;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [announcement.startDate, announcement.endDate]);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.tertiaryContainer }]}
      mode="contained"
    >
      <Card.Content style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.authorContainer}>
            <Icon
              source="account"
              size={16}
              color={theme.colors.onTertiaryContainer}
            />
            <Text
              style={[
                styles.headerText,
                { color: theme.colors.onTertiaryContainer, opacity: 0.7 },
              ]}
              numberOfLines={1}
            >
              {announcement.author}
            </Text>
          </View>

          {dateText && (
            <View style={styles.dateContainer}>
              <Icon
                source="calendar"
                size={16}
                color={theme.colors.onTertiaryContainer}
              />
              <Text
                style={[
                  styles.headerText,
                  { color: theme.colors.onTertiaryContainer, opacity: 0.7 },
                ]}
              >
                {dateText}
              </Text>
            </View>
          )}
        </View>

        {/* Body Text */}
        <Text
          style={[styles.bodyText, { color: theme.colors.onTertiaryContainer }]}
        >
          {announcement.textContent}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  accordion: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8, // Adds spacing between cards
  },
  card: {
    width: '100%',
    marginBottom: 8,
  },
  cardContent: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
