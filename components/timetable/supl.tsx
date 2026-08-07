import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { Text, Surface, useTheme, List } from 'react-native-paper';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import { AnnouncementsSection } from './announcements';

interface SubstitutionSummaryProps {
  suplResult?: SuplResult;
  style?: any;
}

function addAlpha(hexColor: string, opacity: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function SubstitutionSummary({
  suplResult,
  style,
}: SubstitutionSummaryProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const { targetDateString, labelRes } = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const dayFinished = currentHour >= 16;
    const target = new Date(now);
    let label = '';

    if (currentDay === 6) {
      target.setDate(target.getDate() + 2);
      label = 'Koná se v pondělí';
    } else if (currentDay === 0) {
      target.setDate(target.getDate() + 1);
      label = 'Koná se v pondělí';
    } else if (dayFinished) {
      if (currentDay === 5) {
        target.setDate(target.getDate() + 3);
        label = 'Koná se v pondělí';
      } else {
        target.setDate(target.getDate() + 1);
        label = 'Koná se zítra';
      }
    } else {
      label = 'Koná se';
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');

    return { targetDateString: `${year}-${month}-${day}`, labelRes: label };
  }, []);

  const intervalText = useMemo(() => {
    const minutes = suplResult?.status.currentUpdateSchedule ?? 15;
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hod`;
  }, [suplResult?.status.currentUpdateSchedule]);

  if (!suplResult) {
    return (
      <Pressable
        onPress={() => {
          Linking.openURL('https://spsejecna.cz/suplovani');
        }}
        style={style}
      >
        <Surface
          style={[
            styles.errorContainer,
            { backgroundColor: addAlpha(theme.colors.errorContainer, 0.4) },
          ]}
        >
          <View
            style={[
              styles.circleIndicator,
              { backgroundColor: theme.colors.error },
            ]}
          />
          <Text
            style={[styles.errorText, { color: theme.colors.onErrorContainer }]}
          >
            Nepodařilo se načíst suplování
          </Text>
        </Surface>
      </Pressable>
    );
  }

  const lastUpdated = suplResult.status.lastUpdated;
  const targetDailySchedule = suplResult.schedule?.[targetDateString];
  const takesPlaceText = targetDailySchedule?.takesPlace;
  const isExpandable = !!takesPlaceText && takesPlaceText.trim().length > 0;

  const targetAnnouncements = suplResult.annoucements?.[targetDateString] || [];

  return (
    <View style={style}>
      {targetAnnouncements.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <AnnouncementsSection announcements={targetAnnouncements} />
        </View>
      )}

      <List.Accordion
        title="Mimořádný rozvrh"
        titleStyle={{
          color: theme.colors.onSecondaryContainer,
          fontWeight: '500',
        }}
        expanded={isExpandable ? expanded : false}
        onPress={() => isExpandable && setExpanded(!expanded)}
        style={[
          styles.accordionBase,
          {
            backgroundColor: isExpandable
              ? theme.colors.surface
              : addAlpha(theme.colors.surface, 0.6),
          },
        ]}
        left={() => (
          <View style={styles.accordionLeftContainer}>
            <View
              style={[
                styles.circleIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        )}
        right={props => (
          <View style={styles.accordionRightContainer}>
            <Text
              style={[
                styles.updatedText,
                { color: addAlpha(theme.colors.onSecondaryContainer, 0.6) },
              ]}
            >
              {lastUpdated} (každých {intervalText})
            </Text>
            {isExpandable && (
              <List.Icon
                {...props}
                icon={expanded ? 'chevron-up' : 'chevron-down'}
                color={theme.colors.onSecondaryContainer}
              />
            )}
          </View>
        )}
      >
        {isExpandable && (
          <View style={styles.accordionContent}>
            <Text
              style={[
                styles.label,
                { color: addAlpha(theme.colors.onSecondaryContainer, 0.7) },
              ]}
            >
              {labelRes}
            </Text>
            <Text
              style={[
                styles.takesPlaceText,
                { color: theme.colors.onSecondaryContainer },
              ]}
            >
              {takesPlaceText}
            </Text>
          </View>
        )}
      </List.Accordion>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  circleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  accordionBase: {
    borderRadius: 12,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  accordionLeftContainer: {
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },
  accordionRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatedText: {
    fontSize: 11,
  },
  accordionContent: {
    paddingLeft: 30,
    paddingRight: 8,
    paddingBottom: 12,
  },
  label: {
    fontSize: 11,
    marginBottom: 2,
  },
  takesPlaceText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
