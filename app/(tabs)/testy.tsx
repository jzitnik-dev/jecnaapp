import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Chip,
    Divider,
    FAB,
    IconButton,
    Modal,
    Portal,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import type { Timetable } from '../../api/SpseJecnaClient';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';

interface TestEvent {
  id: string;
  date: Date;
  period: number;
  periodTime: string;
  type: 'test' | 'písemka' | 'zkoušení' | 'vlastní';
  subject: string;
  description: string;
  createdAt: Date;
}

export default function TestyScreen() {
  const theme = useTheme();
  const { client } = useSpseJecnaClient();
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'test' | 'písemka' | 'zkoušení' | 'vlastní'>('test');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Načtení rozvrhu
  const { data: timetable } = useQuery<Timetable>({
    queryKey: ['timetable'],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return client.getTimetable();
    },
    enabled: !!client,
  });

  // Kontrola víkendu
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = neděle, 6 = sobota
  };

  // Získání názvu dne
  const getDayName = (date: Date) => {
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return days[date.getDay()];
  };

  // Filtrování událostí podle data
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    ).sort((a, b) => a.period - b.period);
  };

  // Přidání nové události
  const addEvent = () => {
    if (isWeekend(selectedDate)) {
      Alert.alert('Víkend', 'Testy se nemohou konat o víkendu.');
      return;
    }

    if (!selectedPeriod) {
      Alert.alert('Chyba', 'Vyberte hodinu z rozvrhu.');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Chyba', 'Zadejte předmět.');
      return;
    }

    const period = timetable?.periods.find(p => p.number === selectedPeriod);
    const newEvent: TestEvent = {
      id: Date.now().toString(),
      date: new Date(selectedDate),
      period: selectedPeriod,
      periodTime: period?.time || '',
      type: selectedType,
      subject: subject.trim(),
      description: description.trim(),
      createdAt: new Date(),
    };

    setEvents(prev => [...prev, newEvent]);
    resetForm();
    setModalVisible(false);
  };

  // Smazání události
  const deleteEvent = (id: string) => {
    Alert.alert(
      'Smazat test',
      'Opravdu chcete smazat tento test?',
      [
        { text: 'Zrušit', style: 'cancel' },
        { 
          text: 'Smazat', 
          style: 'destructive',
          onPress: () => setEvents(prev => prev.filter(e => e.id !== id))
        },
      ]
    );
  };

  // Reset formuláře
  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedPeriod(null);
    setSelectedType('test');
    setSubject('');
    setDescription('');
  };

  // Získání barvy pro typ testu
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test': return theme.colors.primary;
      case 'písemka': return theme.colors.error;
      case 'zkoušení': return theme.colors.tertiary;
      case 'vlastní': return theme.colors.secondary;
      default: return theme.colors.primary;
    }
  };

  // Získání ikony pro typ testu
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test': return 'file-document-outline';
      case 'písemka': return 'pencil-box-outline';
      case 'zkoušení': return 'account-question-outline';
      case 'vlastní': return 'plus-box-outline';
      default: return 'file-document-outline';
    }
  };

  // Generování kalendáře pro aktuální měsíc
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const days = [];

    // Přidat dny z předchozího měsíce
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i);
      days.push(date);
    }

    // Přidat dny aktuálního měsíce
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    // Přidat dny z následujícího měsíce
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i));
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Kalendář */}
        <Card style={[styles.calendarCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.calendarTitle, { color: theme.colors.onSurface }]}>
              Kalendář testů
            </Text>
            <View style={styles.calendarGrid}>
              {/* Dny v týdnu */}
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, index) => (
                <View key={day} style={styles.calendarHeader}>
                  <Text style={[styles.calendarHeaderText, { color: theme.colors.onSurfaceVariant }]}>
                    {day}
                  </Text>
                </View>
              ))}
              
              {/* Dny v měsíci */}
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentMonth = date.getMonth() === new Date().getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekendDay = isWeekend(date);
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.calendarDay,
                      isToday && { backgroundColor: theme.colors.primaryContainer },
                      isWeekendDay && { backgroundColor: theme.colors.surfaceVariant },
                      !isCurrentMonth && { opacity: 0.3 }
                    ]}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: theme.colors.onSurface },
                      isToday && { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }
                    ]}>
                      {date.getDate()}
                    </Text>
                    {dayEvents.length > 0 && (
                      <View style={styles.eventIndicator}>
                        <Text style={[styles.eventCount, { color: theme.colors.primary }]}>
                          {dayEvents.length}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Seznam testů */}
        <Card style={[styles.eventsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.eventsTitle, { color: theme.colors.onSurface }]}>
              Nadcházející testy
            </Text>
            <Divider style={{ marginVertical: 12 }} />
            
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="calendar-blank" 
                  size={48} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Žádné testy nejsou naplánovány
                </Text>
              </View>
            ) : (
              events
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map(event => (
                  <Card 
                    key={event.id} 
                    style={[styles.eventCard, { backgroundColor: theme.colors.surfaceVariant }]} 
                    elevation={1}
                  >
                    <Card.Content>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventInfo}>
                          <View style={styles.eventTypeRow}>
                            <MaterialCommunityIcons 
                              name={getTypeIcon(event.type) as any} 
                              size={20} 
                              color={getTypeColor(event.type)} 
                            />
                            <Chip 
                              mode="outlined" 
                              textStyle={{ color: getTypeColor(event.type) }}
                              style={{ borderColor: getTypeColor(event.type), marginLeft: 8 }}
                            >
                              {event.type}
                            </Chip>
                          </View>
                          <Text variant="titleMedium" style={[styles.eventSubject, { color: theme.colors.onSurface }]}>
                            {event.subject}
                          </Text>
                          <Text variant="bodyMedium" style={[styles.eventDate, { color: theme.colors.onSurfaceVariant }]}>
                            {event.date.toLocaleDateString('cs-CZ')} • {getDayName(event.date)} • {event.period}. hodina ({event.periodTime})
                          </Text>
                          {event.description && (
                            <Text variant="bodySmall" style={[styles.eventDescription, { color: theme.colors.onSurfaceVariant }]}>
                              {event.description}
                            </Text>
                          )}
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => deleteEvent(event.id)}
                          iconColor={theme.colors.error}
                        />
                      </View>
                    </Card.Content>
                  </Card>
                ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB pro přidání */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      />

      {/* Modal pro přidání testu */}
      <Portal>
        <Modal 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Přidat test
            </Text>

            {/* Datum */}
            <View style={styles.inputGroup}>
              <Text variant="bodyMedium" style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Datum
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowDatePicker(true)}
                icon="calendar"
              >
                {selectedDate.toLocaleDateString('cs-CZ')} ({getDayName(selectedDate)})
              </Button>
              {isWeekend(selectedDate) && (
                <Text style={[styles.warningText, { color: theme.colors.error }]}>
                  ⚠️ Vybraný den je víkend
                </Text>
              )}
            </View>

            {/* Typ testu */}
            <View style={styles.inputGroup}>
              <Text variant="bodyMedium" style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Typ
              </Text>
              <View style={styles.typeChips}>
                {(['test', 'písemka', 'zkoušení', 'vlastní'] as const).map(type => (
                  <Chip
                    key={type}
                    selected={selectedType === type}
                    onPress={() => setSelectedType(type)}
                    style={[
                      styles.typeChip,
                      selectedType === type && { backgroundColor: getTypeColor(type) }
                    ]}
                    textStyle={[
                      selectedType === type && { color: theme.colors.onPrimary }
                    ]}
                  >
                    {type}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Předmět */}
            <View style={styles.inputGroup}>
              <Text variant="bodyMedium" style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Předmět
              </Text>
              <TextInput
                mode="outlined"
                value={subject}
                onChangeText={setSubject}
                placeholder="Např. Matematika"
              />
            </View>

            {/* Hodina z rozvrhu */}
            <View style={styles.inputGroup}>
              <Text variant="bodyMedium" style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Hodina z rozvrhu
              </Text>
              {timetable ? (
                <View style={styles.periodGrid}>
                  {timetable.periods.map(period => (
                    <Chip
                      key={period.number}
                      selected={selectedPeriod === period.number}
                      onPress={() => setSelectedPeriod(period.number)}
                      style={[
                        styles.periodChip,
                        selectedPeriod === period.number && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={[
                        selectedPeriod === period.number && { color: theme.colors.onPrimary }
                      ]}
                    >
                      {period.number}. ({period.time})
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  Načítání rozvrhu...
                </Text>
              )}
            </View>

            {/* Popis */}
            <View style={styles.inputGroup}>
              <Text variant="bodyMedium" style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Popis (volitelné)
              </Text>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Např. Derivace, integrály"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Tlačítka */}
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Zrušit
              </Button>
              <Button 
                mode="contained" 
                onPress={addEvent}
                style={styles.modalButton}
                disabled={isWeekend(selectedDate) || !selectedPeriod || !subject.trim()}
              >
                Přidat
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  calendarCard: {
    margin: 16,
    marginBottom: 8,
  },
  calendarTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 14,
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventsCard: {
    margin: 16,
    marginTop: 8,
  },
  eventsTitle: {
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
  },
  eventCard: {
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventSubject: {
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    marginBottom: 4,
  },
  eventDescription: {
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  warningText: {
    marginTop: 4,
    fontSize: 12,
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    marginBottom: 4,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    marginBottom: 4,
  },
  loadingText: {
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 