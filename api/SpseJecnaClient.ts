import { JecnaAPI } from 'jecnaapi-react-native';
import {
  GradeRequestType,
  MONTH_NAMES,
  TimetableRequestType,
  MonthName,
} from 'jecnaapi-react-native/jecnaapi';
import { getCurrentSchoolYearStart } from '@/utils/selectors';

export class SpseJecnaClient {
  public async isLoggedIn(): Promise<boolean> {
    return await JecnaAPI.isLoggedIn();
  }

  public async login(username: string, password: string): Promise<boolean> {
    return await JecnaAPI.login(username, password);
  }

  public async getGrades(data?: GradeRequestType) {
    return JecnaAPI.getGradesPage(data);
  }

  public async logout(): Promise<void> {
    return await JecnaAPI.logout();
  }

  public async getNews() {
    return await JecnaAPI.getNewsPage();
  }

  public async getLocker() {
    return await JecnaAPI.getLocker();
  }

  public async getNotification(notificationId: number) {
    return await JecnaAPI.getNotification(notificationId);
  }

  public async getTimetable(data?: TimetableRequestType) {
    return await JecnaAPI.getTimetablePage(data);
  }

  public async getTeacherProfile(code: string) {
    return await JecnaAPI.getTeacher(code);
  }

  public async getRoom(code: string) {
    return await JecnaAPI.getRoom(code);
  }

  public async getTeachersList() {
    return await JecnaAPI.getTeachersPage();
  }

  public async getRoomsList() {
    return await JecnaAPI.getRoomsPage();
  }

  public async getPrichody(
    yearId: number | undefined,
    monthId?: MonthName | undefined
  ) {
    const date = new Date();
    let final:
      | { firstCalendarYear: number; month: MonthName }
      | { firstCalendarYear: undefined; month: undefined } = {
      firstCalendarYear: undefined,
      month: undefined,
    };

    if (yearId === undefined && monthId !== undefined) {
      final = {
        firstCalendarYear: getCurrentSchoolYearStart(),
        month: monthId,
      };
    } else if (monthId === undefined && yearId !== undefined) {
      final = {
        firstCalendarYear: yearId,
        month: MONTH_NAMES[date.getMonth()],
      };
    } else if (yearId !== undefined && monthId !== undefined) {
      final = {
        firstCalendarYear: yearId,
        month: monthId,
      };
    }

    return await JecnaAPI.getAttendances(final);
  }

  public async getOmluvnyList(yearFirst?: number) {
    return await JecnaAPI.getAbsencesPage(yearFirst);
  }

  public async getAccountInfo() {
    return await JecnaAPI.getStudentProfile();
  }
}
