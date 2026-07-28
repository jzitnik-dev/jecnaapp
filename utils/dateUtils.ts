import { Time } from 'jecnaapi-react-native';

export function formatTime(time?: Time | string) {
  if (typeof time === 'string') {
    return time;
  }

  if (!time) {
    return '0:00';
  }

  const paddedMinute = String(time.minute).padStart(2, '0');

  return `${time.hour}:${paddedMinute}`;
}
