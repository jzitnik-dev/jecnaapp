import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Menu, Surface, Text, useTheme } from 'react-native-paper';

export default function PrichodyScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    client.getPrichody()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Chyba při načítání příchodů.');
        setLoading(false);
      });
  }, [client]);

  const reload = (yearId?: string, monthId?: string) => {
    if (!client) return;
    setLoading(true);
    setError(null);
    client.getPrichody(yearId, monthId)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Chyba při načítání příchodů.');
        setLoading(false);
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 0 }}>
        <Menu
          visible={yearMenuVisible}
          onDismiss={() => setYearMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setYearMenuVisible(true)} style={styles.selector}>
              {data?.years?.find((y: any) => y.id === data.selectedYearId)?.label || 'Školní rok'}
            </Button>
          }
        >
          {data?.years?.map((y: any) => (
            <Menu.Item key={y.id} onPress={() => { setYearMenuVisible(false); reload(y.id, data.selectedMonthId); }} title={y.label} />
          ))}
        </Menu>
        <Menu
          visible={monthMenuVisible}
          onDismiss={() => setMonthMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setMonthMenuVisible(true)} style={styles.selector}>
              {data?.months?.find((m: any) => m.id === data.selectedMonthId)?.label || 'Měsíc'}
            </Button>
          }
        >
          {data?.months?.map((m: any) => (
            <Menu.Item key={m.id} onPress={() => { setMonthMenuVisible(false); reload(data.selectedYearId, m.id); }} title={m.label} />
          ))}
        </Menu>
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" /><Text>Načítám příchody…</Text></View>
      ) : error ? (
        <View style={styles.centered}><Text style={{ color: 'red' }}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
          {data?.days?.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 32 }}>Žádné záznamy.</Text>
          ) : data.days.map((day: any, i: number) => (
            <Surface key={i} style={[styles.dayCard, { backgroundColor: theme.colors.surfaceVariant }]}> 
              <Text style={[styles.dayDate, { color: theme.colors.primary }]}>{day.date}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {day.events.length === 0 ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Žádné záznamy</Text>
                ) : day.events.map((ev: any, j: number) => (
                  <View key={j} style={[styles.event, { backgroundColor: ev.type === 'Příchod' ? '#c8e6c9' : '#ffcdd2' }]}> 
                    <Text style={[styles.eventType, { color: ev.type === 'Příchod' ? '#388e3c' : '#b71c1c' }]}>{ev.type}</Text>
                    <Text style={[styles.eventTime, { color: ev.type === 'Příchod' ? '#388e3c' : '#b71c1c' }]}>{ev.time}</Text>
                  </View>
                ))}
              </View>
            </Surface>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  selector: {
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dayCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dayDate: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  event: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 15,
  },
  eventTime: {
    fontSize: 15,
    fontWeight: '500',
  },
}); 