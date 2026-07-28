import { Time } from 'jecnaapi-react-native';

export function formatTime(time?: Time) {
  if (!time) {
    return '0:00';
  }

  const paddedMinute = String(time.minute).padStart(2, '0');

  return `${time.hour}:${paddedMinute}`;
}
