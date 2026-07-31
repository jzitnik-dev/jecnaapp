import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { entryCheckGradeNotifications } from './gradeNotifications';

export default async function checkGradesDefaultFetch() {
  const page = await JecnaAPI.getGradesPage();

  await entryCheckGradeNotifications(page);
}
