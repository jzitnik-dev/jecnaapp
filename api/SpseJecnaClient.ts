import { selectAll } from 'css-select';
import type { Element } from 'domhandler';
import * as SecureStore from 'expo-secure-store';
import { parseDocument } from 'htmlparser2';
import { iCanteenClient } from './iCanteenClient';

export type Grade = {
  value: number | 'N' | 'Pochvala'; // 1-5, 'N' (absence), or 'Pochvala'
  weight: number; // 1 for normal, 0.5 for small, 0 for pochvala
  date?: string;
  note?: string;
  teacher?: string;
  href?: string;
};
export type SubjectGrades = {
  subject: string;
  splits: { label: string; grades: Grade[] }[];
  finalGrade?: number | string;
};

export type PochvalaDetail = {
  type: string;
  date: string;
  message: string;
};

export type TimetableLesson = {
  subject: string;
  subjectLong?: string;
  teacher: string;
  teacherFull?: string;
  room: string;
  group?: string;
  className?: string;
};

export type TimetableCell = TimetableLesson[]; // Multiple lessons per cell (splits/groups)

export type TimetableDay = {
  day: string; // e.g. 'Po'
  cells: (TimetableCell | null)[]; // null for empty periods
};

export type TimetablePeriod = {
  number: number;
  time: string; // e.g. '7:30 - 8:15'
};

export type TimetableYearOption = {
  id: string;
  label: string;
  selected: boolean;
};

export type TimetablePeriodOption = {
  id: string;
  label: string;
  selected: boolean;
};

export type TimetableMeta = {
  years: TimetableYearOption[];
  periods: TimetablePeriodOption[];
  selectedYearId: string;
  selectedPeriodId: string;
};

export type Timetable = {
  periods: TimetablePeriod[];
  days: TimetableDay[];
  yearLabel: string;
  periodLabel: string;
  meta?: TimetableMeta;
};

export type OmluvnyListAbsence = {
  date: string; // e.g. '11.6. (středa)'
  count: number; // total hours
  countUnexcused?: number; // unexcused hours, if present
  href?: string; // link to detail, if present
};

export type OmluvnyListResult = {
  years: { id: string; label: string }[];
  selectedYearId: string;
  absences: OmluvnyListAbsence[];
};

export type TimetableEntry = {
  day: string;
  time: string;
  subject: string;
};

export type UcebnaData = {
  title: string;
  floor: string;
  phone: string;
  manager: string;
  timetable: TimetableEntry[];
};

export class SpseJecnaClient {
  private readonly baseUrl = 'https://www.spsejecna.cz';
  private cookies: string = '';
  private canteenClient: iCanteenClient | null = null;
  private username: string = '';
  private password: string = '';

  // This is for the fucking iOS people, who are not able to use the same headers as Android. Fucking idiots. The stupid spsejecna website is blocking requests on iOS just randomly probably because If-Modified-Since is not set or is not set correctly.
  // I hate them so much. This stupid shit, why did I choose to make it also for iOS. And if some of you fucking idiots will say that it does not work 100% I will find you and tickle you on your feet in the middle of the night.
  // Yes you can report a bug on iOS but PLEASE be cooperative. I don't own any Apple device (yeah I'm Arch user btw), so I have no real way to test it.
  private buildHeaders(extraHeaders?: Record<string, string>): HeadersInit {
    function toHttpDate(date: Date) {
      return date.toUTCString();
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ifModifiedSince = toHttpDate(oneDayAgo);

    // TODO: This will need more testing on iOS
    return {
      ...(this.cookies ? { 'Cookie': this.cookies } : {}),
      'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      'Accept-Encoding': 'gzip',
      'Cookie': 'WTDGUID=10',
      'If-Modified-Since': 'Fri, 20 Jun 2025 07:45:34 GMT',
      ...extraHeaders,
    };
  }

  private extractToken3(html: string): string | null {
    const document = parseDocument(html);
    const inputs = selectAll('input[name="token3"]', document.children) as Element[];
    if (inputs.length > 0) {
      const token = inputs[0].attribs?.value;
      return token || null;
    }
    return null;
  }

  private updateCookies(response: Response) {
    // @ts-ignore
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie.split(',').map((c: string) => c.split(';')[0]).join('; ');
      this.cookies = cookies;
    }
  }

  private async getLoginToken(): Promise<string> {
    await fetch(`${this.baseUrl}/user/role?role=student`);
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'GET',
      headers: this.buildHeaders({
        'Accept-Encoding': 'gzip',
      }),
      credentials: 'include',
    });
    const html = await response.text();
    this.updateCookies(response);
    console.log(html)
    const token = this.extractToken3(html);
    if (!token) throw new Error('Login token not found');
    return token;
  }

  public async isLoggedIn(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/score/student`, {
      method: 'GET',
      headers: this.buildHeaders(),
      credentials: 'include',
    });
    const html = await response.text();
    return !response.url.includes('/user/need-login') && !html.includes("Pro další postup je vyžadováno přihlášení uživatele.");
  }

  public async login(username: string, password: string): Promise<boolean> {
    this.username = username;
    this.password = password;
    
    const token3 = await this.getLoginToken();
    const form = new URLSearchParams();
    form.append('user', username);
    form.append('pass', password);
    form.append('token3', token3);
    form.append('submit', "Přihlásit+se")

    const response = await fetch(`${this.baseUrl}/user/login`, {
      method: 'POST',
      headers: this.buildHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      body: form.toString(),
    });
    const document = parseDocument(await response.text());
    const data = selectAll('.message.message-error', document.children) as Element[];
    if (data.length === 0) {
      this.updateCookies(response);
      this.canteenClient = new iCanteenClient();
      await this.canteenClient.setup(username, password);
      return true;
    }
    return false;
  }

  public async fetchHtml(path: string, extraHeaders?: Record<string, string>): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(extraHeaders),
      credentials: 'include',
    });
    this.updateCookies(response);
    return await response.text();
  }

  public async fetchAndParse(path: string): Promise<ReturnType<typeof parseDocument>> {
    const html = await this.fetchHtml(path);
    return parseDocument(html);
  }

  public async getGradesMeta(): Promise<{ years: { id: string, label: string }[], periods: { id: string, label: string }[], selectedYearId: string, selectedPeriodId: string }> {
    const html = await this.fetchHtml('/score/student');
    const document = parseDocument(html);

    // Years
    const yearSelect = selectAll('select#schoolYearId', document.children)[0] as Element | undefined;
    const years: { id: string, label: string }[] = [];
    let selectedYearId = '';
    if (yearSelect) {
      const options = selectAll('option', [yearSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedYearId = id;
        years.push({ id, label });
      }
    }

    // Periods
    const periodSelect = selectAll('select#schoolYearHalfId', document.children)[0] as Element | undefined;
    const periods: { id: string, label: string }[] = [];
    let selectedPeriodId = '';
    if (periodSelect) {
      const options = selectAll('option', [periodSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedPeriodId = id;
        periods.push({ id, label });
      }
    }

    return { years, periods, selectedYearId, selectedPeriodId };
  }

  public async getZnamky(yearId?: string, periodId?: string): Promise<SubjectGrades[]> {
    let url = '/score/student';
    if (yearId || periodId) {
      const params = new URLSearchParams();
      if (yearId) params.append('schoolYearId', yearId);
      if (periodId) params.append('schoolYearHalfId', periodId);
      url += '?' + params.toString();
    }
    const html = await this.fetchHtml(url);
    const document = parseDocument(html);
    const tables = selectAll('table.score', document.children) as Element[];
    const result: SubjectGrades[] = [];
    for (const table of tables) {
      const rows = selectAll('tbody > tr', [table]) as Element[];
      for (const row of rows) {
        const ths = selectAll('th', [row]) as Element[];
        const tds = selectAll('td', [row]) as Element[];
        if (ths.length === 0 || tds.length === 0) continue;
        const subject = ths[0].children.find(c => c.type === 'text')?.data?.trim() || 'Neznámý předmět';
        const splits: { label: string; grades: Grade[] }[] = [];
        let currentLabel = '';
        let currentGrades: Grade[] = [];
        const tdChildren = tds[0].children;
        // Special handling for Chování: look for Pochvala
        if (subject === 'Chování') {
          // Find all <a class="link"> with label containing 'Pochvala'
          const pochvaly: Grade[] = [];
          for (let i = 0; i < tdChildren.length; i++) {
            const node = tdChildren[i];
            if (node.type === 'tag' && node.name === 'span' && node.attribs && node.attribs.style && node.attribs.style.includes('float: left')) {
              // This span contains the <a class="link"> for Pochvala
              const a = (node.children || []).find(c => c.type === 'tag' && c.name === 'a' && c.attribs && c.attribs.class === 'link') as Element | undefined;
              if (a) {
                const labelSpan = (a.children || []).find(c => c.type === 'tag' && c.name === 'span' && c.attribs && c.attribs.class === 'label') as Element | undefined;
                const label = labelSpan && labelSpan.children.find(c => c.type === 'text')?.data?.trim();
                const href = a.attribs && a.attribs.href;
                if (label && label.includes('Pochvala')) {
                  pochvaly.push({ value: 'Pochvala', weight: 0, note: label, href });
                }
              }
            }
          }
          splits.push({ label: '', grades: pochvaly });
        } else {
          for (let i = 0; i < tdChildren.length; i++) {
            const node = tdChildren[i];
            if (node.type === 'tag' && node.name === 'strong' && node.attribs && node.attribs.class === 'subjectPart') {
              if (currentGrades.length > 0 || currentLabel) {
                splits.push({ label: currentLabel || 'Bez rozdělení', grades: currentGrades });
              }
              currentLabel = node.children.find(c => c.type === 'text')?.data?.replace(':', '').trim() || '';
              currentGrades = [];
            } else if (node.type === 'tag' && node.name === 'a' && node.attribs && node.attribs.class && node.attribs.class.includes('score')) {
              const classAttr = node.attribs.class || '';
              const valueSpan = selectAll('span.value', [node]) as Element[];
              const valueText = valueSpan[0]?.children.find(c => c.type === 'text')?.data?.trim();
              let value: number | 'N' | 'Pochvala' | undefined;
              if (valueText === 'N') {
                value = 'N';
              } else {
                const parsed = valueText ? parseInt(valueText, 10) : undefined;
                if (!parsed || isNaN(parsed) || parsed < 1 || parsed > 5) continue;
                value = parsed;
              }
              let weight = 1;
              if (classAttr.includes('scoreSmall')) weight = 0.5;
              let date, note, teacher;
              if (node.attribs && node.attribs.title) {
                const str = node.attribs.title;
                const index = str.lastIndexOf('(');
                const firstPart = str.slice(0, index);
                const secondPart = str.slice(index).replace('(', '').replace(')', '').split(',');
                note = firstPart.trim();
                teacher = secondPart[1]?.trim();
                date = secondPart[0]?.trim();
              }
              currentGrades.push({ value, weight, date, note: note, teacher });
            }
          }
          if (currentGrades.length > 0 || currentLabel) {
            splits.push({ label: currentLabel || 'Bez rozdělení', grades: currentGrades });
          }
        }
        let finalGrade: number | string | undefined = undefined;
        if (tds.length > 1) {
          const finalTd = tds[1];
          const finalLink = selectAll('a.scoreFinal', [finalTd]) as Element[];
          if (finalLink.length > 0) {
            const valueText = finalLink[0].children.find(c => c.type === 'text')?.data?.trim();
            if (valueText) finalGrade = valueText;
          } else if (finalTd && finalTd.children.length > 0) {
            const text = finalTd.children.find(c => c.type === 'text')?.data?.trim();
            if (text) finalGrade = text;
          }
        }
        result.push({ subject, splits, finalGrade });
      }
    }
    return result;
  }

  public getCookies(): string {
    return this.cookies;
  }

  public setCookies(cookies: string) {
    this.cookies = cookies;
  }

  public async getCanteenClient(): Promise<iCanteenClient> {
    if (!this.canteenClient) {
      // If we don't have credentials stored, try to get them from SecureStore
      if (!this.username || !this.password) {
        try {
          this.username = await SecureStore.getItemAsync('username') || '';
          this.password = await SecureStore.getItemAsync('password') || '';
        } catch (error) {
          console.error('Error retrieving credentials from SecureStore:', error);
        }
      }
      
      if (!this.username || !this.password) {
        throw new Error('iCanteenClient not initialized. Please login first with username and password.');
      }
      
      // Check if we're logged in to the main system
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) {
        throw new Error('Not logged in to SPŠE Ječná. Please login first.');
      }
      
      // Create and set up the iCanteenClient if it doesn't exist
      this.canteenClient = new iCanteenClient();
      await this.canteenClient.setup(this.username, this.password);
    }
    return this.canteenClient;
  }

  public async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/user/logout`, {
      method: 'GET',
      headers: {
        ...(this.cookies ? { 'Cookie': this.cookies } : {}),
        'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      },
      credentials: 'include',
    });
    this.cookies = '';
  }

  public async getPochvalaDetail(path: string): Promise<PochvalaDetail> {
    // path is like '/user-student/record?userStudentRecordId=7540'
    const html = await this.fetchHtml(path);
    const document = parseDocument(html);
    const table = selectAll('table.userprofile', document.children)[0] as Element | undefined;
    let type = '', date = '', message = '';
    if (table) {
      const rows = selectAll('tr', [table]) as Element[];
      for (const row of rows) {
        const th = selectAll('th', [row])[0];
        const td = selectAll('td', [row])[0];
        const label = th && selectAll('span.label', [th])[0]?.children.find(c => c.type === 'text')?.data?.trim();
        const value = td && selectAll('span.value', [td])[0]?.children.find(c => c.type === 'text')?.data?.trim();
        if (label === 'Typ') type = value || '';
        if (label === 'Datum') date = value || '';
        if (label === 'Sdělení') message = value || '';
      }
    }
    return { type, date, message };
  }

  public async getTimetable(yearId?: string, periodId?: string): Promise<Timetable> {
    let url = '/timetable/class';
    if (yearId || periodId) {
      const params = new URLSearchParams();
      if (yearId) params.append('schoolYearId', yearId);
      if (periodId) params.append('timetableId', periodId);
      url += '?' + params.toString();
    }
    const html = await this.fetchHtml(url);
    const document = parseDocument(html);
    // Parse year/period selects
    const yearSelect = selectAll('select#schoolYearId', document.children)[0] as Element | undefined;
    const periodSelect = selectAll('select#timetableId', document.children)[0] as Element | undefined;
    const years: TimetableYearOption[] = [];
    let selectedYearId = '';
    if (yearSelect) {
      const options = selectAll('option', [yearSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedYearId = id;
        years.push({ id, label, selected });
      }
    }
    const periodOptions: TimetablePeriodOption[] = [];
    let selectedPeriodId = '';
    if (periodSelect) {
      const options = selectAll('option', [periodSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedPeriodId = id;
        periodOptions.push({ id, label, selected });
      }
    }
    // Get year/period info
    const versionInfo = selectAll('.versionInfo', document.children)[0];
    let yearLabel = '', periodLabel = '';
    if (versionInfo && Array.isArray((versionInfo as Element).children)) {
      const textNode = (versionInfo as Element).children.find((c: any) => c.type === 'text');
      const text = textNode && textNode.type === 'text' ? (textNode as import('domhandler').Text).data?.trim() : '';
      // e.g. 'Rozvrh pro školní rok: 2024/2025, období: Od 01.06.2025.'
      const match = text.match(/školní rok: ([^,]+), období: (.+)/);
      if (match) {
        yearLabel = match[1];
        periodLabel = match[2].replace(/\.$/, '');
      }
    }
    // Parse periods (header row)
    const table = selectAll('table.timetable', document.children)[0];
    if (!table) throw new Error('Timetable table not found');
    const headerRow = selectAll('tr', [table])[0];
    const ths = selectAll('th', [headerRow]);
    const periods: TimetablePeriod[] = [];
    for (let i = 1; i < ths.length; i++) { // skip first (empty) th
      const th = ths[i] as Element;
      let numberText: string | undefined = undefined;
      if (Array.isArray(th.children)) {
        const textNode = th.children.find((c: any) => c.type === 'text');
        if (textNode && textNode.type === 'text') numberText = (textNode as import('domhandler').Text).data?.trim();
      }
      const timeSpan = selectAll('span.time', [th])[0] as Element | undefined;
      let time = '';
      if (timeSpan && Array.isArray(timeSpan.children)) {
        const timeNode = timeSpan.children.find((c: any) => c.type === 'text');
        if (timeNode && timeNode.type === 'text') time = (timeNode as import('domhandler').Text).data?.trim();
      }
      const number = numberText ? parseInt(numberText, 10) : i;
      periods.push({ number, time });
    }
    // Parse days/rows
    const rows = selectAll('tr', [table]).slice(1); // skip header
    const days: TimetableDay[] = [];
    for (const row of rows) {
      const th = selectAll('th.day', [row])[0] as Element | undefined;
      let day = '';
      if (th && Array.isArray(th.children)) {
        const dayNode = th.children.find((c: any) => c.type === 'text');
        if (dayNode && dayNode.type === 'text') day = (dayNode as import('domhandler').Text).data?.trim();
      }
      const tds = selectAll('td', [row]);
      const cells: (TimetableCell | null)[] = [];
      for (const td of tds) {
        let colspan = 1;
        if (td.type === 'tag' && td.attribs && td.attribs.colspan) {
          colspan = parseInt(td.attribs.colspan, 10);
        }
        if (td.type === 'tag' && td.attribs && td.attribs.class && td.attribs.class.includes('empty')) {
          for (let i = 0; i < colspan; i++) cells.push(null);
          continue;
        }
        // Each cell may have multiple lessons (splits/groups)
        const divs = selectAll('div', [td]);
        const lessons: TimetableLesson[] = [];
        for (const div of divs) {
          // Room
          const roomA = selectAll('a.room', [div])[0] as Element | undefined;
          let room = '';
          if (roomA && Array.isArray(roomA.children)) {
            const roomNode = roomA.children.find((c: any) => c.type === 'text');
            if (roomNode && roomNode.type === 'text') room = (roomNode as import('domhandler').Text).data?.trim();
          }
          // Teacher
          const empA = selectAll('a.employee', [div])[0] as Element | undefined;
          let teacher = '';
          let teacherFull = '';
          if (empA) {
            if (Array.isArray(empA.children)) {
              const teacherNode = empA.children.find((c: any) => c.type === 'text');
              if (teacherNode && teacherNode.type === 'text') teacher = (teacherNode as import('domhandler').Text).data?.trim();
            }
            if (empA.type === 'tag' && empA.attribs && typeof empA.attribs.title === 'string') teacherFull = empA.attribs.title;
          }
          // Subject
          const subjSpan = selectAll('span.subject', [div])[0] as Element | undefined;
          let subject = '';
          let subjectLong = '';
          if (subjSpan) {
            if (Array.isArray(subjSpan.children)) {
              const subjNode = subjSpan.children.find((c: any) => c.type === 'text');
              if (subjNode && subjNode.type === 'text') subject = (subjNode as import('domhandler').Text).data?.trim();
            }
            if (subjSpan.type === 'tag' && subjSpan.attribs && typeof subjSpan.attribs.title === 'string') subjectLong = subjSpan.attribs.title;
          }
          // Class
          const classSpan = selectAll('span.class', [div])[0] as Element | undefined;
          let className = '';
          if (classSpan && Array.isArray(classSpan.children)) {
            const classNode = classSpan.children.find((c: any) => c.type === 'text');
            if (classNode && classNode.type === 'text') className = (classNode as import('domhandler').Text).data?.trim();
          }
          // Group (optional)
          const groupSpan = selectAll('span.group', [div])[0] as Element | undefined;
          let group = '';
          if (groupSpan && Array.isArray(groupSpan.children)) {
            const groupNode = groupSpan.children.find((c: any) => c.type === 'text');
            if (groupNode && groupNode.type === 'text') group = (groupNode as import('domhandler').Text).data?.trim();
          }
          lessons.push({ subject, subjectLong, teacher, teacherFull, room, group, className });
        }
        for (let i = 0; i < colspan; i++) cells.push(lessons);
      }
      days.push({ day, cells });
    }
    return { periods, days, yearLabel, periodLabel, meta: { years, periods: periodOptions, selectedYearId, selectedPeriodId } };
  }

  /**
   * Fetches a teacher's profile, timetable, and certifications from /ucitel/[code]
   */
  public async getTeacherProfile(code: string): Promise<{
    name: string;
    code: string;
    username: string;
    email: string;
    privateEmail?: string;
    phone?: string;
    privatePhone?: string;
    room?: string;
    roomHref?: string;
    consultation?: string;
    photo?: string;
    timetable: {
      periods: { number: number; time: string }[];
      days: { day: string; cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] }[];
    };
    certifications: { date: string; label: string; institution: string }[];
  }> {
    const html = await this.fetchHtml(`/ucitel/${code}`);
    const document = parseDocument(html);
    // Profile table
    const profileTable = selectAll('table.userprofile', document.children)[0] as Element | undefined;
    let name = '', codeVal = '', username = '', email = '', privateEmail = '', phone = '', privatePhone = '', room = '', roomHref = '', consultation = '', photo = '', linka = '';
    if (profileTable) {
      const rows = selectAll('tr', [profileTable]) as Element[];
      for (const row of rows) {
        const th = selectAll('th', [row])[0];
        const td = selectAll('td', [row])[0];
        if (!th || !td) continue;
        const label = selectAll('.label', [th])[0]?.children.find(c => c.type === 'text')?.data?.trim() || th.children.find(c => c.type === 'text')?.data?.trim();
        // Try to get value from <span class="value"> or <span class="label"> or direct text
        let value = '';
        const valueSpan = selectAll('.value', [td])[0];
        if (valueSpan) {
          value = valueSpan.children.find(c => c.type === 'text')?.data?.trim() || '';
        } else {
          value = td.children.find(c => c.type === 'text')?.data?.trim() || '';
        }
        if (label === 'Jméno') name = value;
        if (label === 'Zkratka') codeVal = value;
        if (label === 'Uživatelské jméno') username = value;
        if (label === 'E-mail') {
          const a = selectAll('a', [td])[0];
          if (a && a.attribs && a.attribs.href) email = a.attribs.href.replace('mailto:', '');
        }
        if (label === 'Soukromý e-mail') {
          const a = selectAll('a', [td])[0];
          if (a && a.attribs && a.attribs.href) privateEmail = a.attribs.href.replace('mailto:', '');
        }
        if (label === 'Telefon') {
          phone = value;
        }
        if (label === 'Soukromý telefon') privatePhone = value;
        if (label === 'Kabinet') {
          // Try <a>, <span>, or direct text
          const a = selectAll('a', [td])[0];
          if (a && a.attribs && a.attribs.href) roomHref = a.attribs.href;
          if (a && a.children.find(c => c.type === 'text')) {
            room = a.children.find((c) => c.type === 'text')?.data?.trim() || '';
          } else {
            const span = selectAll('span', [td])[0];
            if (span && span.children.find(c => c.type === 'text')) {
              room = span.children.find(c => c.type === 'text')?.data?.trim() || '';
            } else {
              room = value;
            }
          }
        }
        if (label === 'Konzultační hodiny') consultation = value;
      }
    }
    // Photo
    const photoImg = selectAll('.profilephoto img', document.children)[0] as Element | undefined;
    if (photoImg && photoImg.attribs && photoImg.attribs.src) {
      photo = photoImg.attribs.src.startsWith('http') ? photoImg.attribs.src : `https://www.spsejecna.cz${photoImg.attribs.src}`;
    }
    // Timetable
    const timetableTable = selectAll('table.timetable', document.children)[0] as Element | undefined;
    let periods: { number: number; time: string }[] = [];
    let days: { day: string; cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] }[] = [];
    if (timetableTable) {
      // Header row
      const headerRow = selectAll('tr', [timetableTable])[0];
      const ths = selectAll('th', [headerRow]);
      periods = [];
      for (let i = 1; i < ths.length; i++) { // skip first (empty) th
        const th = ths[i] as Element;
        let numberText: string | undefined = undefined;
        if (Array.isArray(th.children)) {
          const textNode = th.children.find((c: any) => c.type === 'text');
          if (textNode && textNode.type === 'text') numberText = (textNode as import('domhandler').Text).data?.trim();
        }
        const timeSpan = selectAll('span.time', [th])[0] as Element | undefined;
        let time = '';
        if (timeSpan && Array.isArray(timeSpan.children)) {
          const timeNode = timeSpan.children.find((c: any) => c.type === 'text');
          if (timeNode && timeNode.type === 'text') time = (timeNode as import('domhandler').Text).data?.trim();
        }
        const number = numberText ? parseInt(numberText, 10) : i;
        periods.push({ number, time });
      }
      // Day rows
      const rows = selectAll('tr', [timetableTable]).slice(1); // skip header
      for (const row of rows) {
        const th = selectAll('th.day', [row])[0] as Element | undefined;
        let day = '';
        if (th && Array.isArray(th.children)) {
          const dayNode = th.children.find((c: any) => c.type === 'text');
          if (dayNode && dayNode.type === 'text') day = (dayNode as import('domhandler').Text).data?.trim();
        }
        const tds = selectAll('td', [row]);
        const cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] = [];
        for (const td of tds) {
          let colspan = 1;
          if (td.type === 'tag' && td.attribs && td.attribs.colspan) {
            colspan = parseInt(td.attribs.colspan, 10);
          }
          if (td.type === 'tag' && td.attribs && td.attribs.class && td.attribs.class.includes('empty')) {
            for (let i = 0; i < colspan; i++) cells.push(null);
            continue;
          }
          // Each cell may have multiple lessons (splits/groups)
          const divs = selectAll('div', [td]);
          const lessons: import('./SpseJecnaClient').TimetableLesson[] = [];
          for (const div of divs) {
            // Room
            const roomA = selectAll('a.room', [div])[0] as Element | undefined;
            let room = '';
            if (roomA && Array.isArray(roomA.children)) {
              const roomNode = roomA.children.find((c: any) => c.type === 'text');
              if (roomNode && roomNode.type === 'text') room = (roomNode as import('domhandler').Text).data?.trim();
            }
            // Teacher
            const empA = selectAll('a.employee', [div])[0] as Element | undefined;
            let teacher = '';
            let teacherFull = '';
            if (empA) {
              if (Array.isArray(empA.children)) {
                const teacherNode = empA.children.find((c: any) => c.type === 'text');
                if (teacherNode && teacherNode.type === 'text') teacher = (teacherNode as import('domhandler').Text).data?.trim();
              }
              if (empA.type === 'tag' && empA.attribs && typeof empA.attribs.title === 'string') teacherFull = empA.attribs.title;
            }
            // Subject
            const subjSpan = selectAll('span.subject', [div])[0] as Element | undefined;
            let subject = '';
            let subjectLong = '';
            if (subjSpan) {
              if (Array.isArray(subjSpan.children)) {
                const subjNode = subjSpan.children.find((c: any) => c.type === 'text');
                if (subjNode && subjNode.type === 'text') subject = (subjNode as import('domhandler').Text).data?.trim();
              }
              if (subjSpan.type === 'tag' && subjSpan.attribs && typeof subjSpan.attribs.title === 'string') subjectLong = subjSpan.attribs.title;
            }
            // Class
            const classSpan = selectAll('span.class', [div])[0] as Element | undefined;
            let className = '';
            if (classSpan && Array.isArray(classSpan.children)) {
              const classNode = classSpan.children.find((c: any) => c.type === 'text');
              if (classNode && classNode.type === 'text') className = (classNode as import('domhandler').Text).data?.trim();
            }
            // Group (optional)
            const groupSpan = selectAll('span.group', [div])[0] as Element | undefined;
            let group = '';
            if (groupSpan && Array.isArray(groupSpan.children)) {
              const groupNode = groupSpan.children.find((c: any) => c.type === 'text');
              if (groupNode && groupNode.type === 'text') group = (groupNode as import('domhandler').Text).data?.trim();
            }
            lessons.push({ subject, subjectLong, teacher, teacherFull, room, group, className });
          }
          for (let i = 0; i < colspan; i++) cells.push(lessons);
        }
        days.push({ day, cells });
      }
    }
    // Certifications
    const certLis = selectAll('ul.certifications > li', document.children) as Element[];
    const certifications: { date: string; label: string; institution: string }[] = [];
    for (const li of certLis) {
      const dateSpan = selectAll('span.date', [li])[0] as Element | undefined;
      const infoSpan = selectAll('span.info', [li])[0] as Element | undefined;
      let date = '', label = '', institution = '';
      if (dateSpan && Array.isArray(dateSpan.children)) {
        const dateNode = dateSpan.children.find((c: any) => c.type === 'text');
        if (dateNode && dateNode.type === 'text') date = (dateNode as import('domhandler').Text).data?.trim();
      }
      if (infoSpan && Array.isArray(infoSpan.children)) {
        const labelSpan = selectAll('span.label', [infoSpan])[0] as Element | undefined;
        if (labelSpan && Array.isArray(labelSpan.children)) {
          const labelNode = labelSpan.children.find((c: any) => c.type === 'text');
          if (labelNode && labelNode.type === 'text') label = (labelNode as import('domhandler').Text).data?.trim();
        }
        const instSpan = selectAll('span.institution', [infoSpan])[0] as Element | undefined;
        if (instSpan && Array.isArray(instSpan.children)) {
          const instNode = instSpan.children.find((c: any) => c.type === 'text');
          if (instNode && instNode.type === 'text') institution = (instNode as import('domhandler').Text).data?.trim();
        }
      }
      if (date && label) certifications.push({ date, label, institution });
    }
    return {
      name,
      code: codeVal,
      username,
      email,
      privateEmail,
      phone,
      privatePhone,
      room,
      roomHref,
      consultation,
      photo,
      timetable: { periods, days },
      certifications,
    };
  }

  public async getUcebna(code: string): Promise<string> {
    return this.fetchHtml(`/ucebna/${code}`);
  }

  public async getUcebnaParsed(code: string): Promise<{
    title: string;
    floor: string;
    mainClassroom: string;
    manager: string;
    managerHref: string;
    timetable?: { periods: { number: number; time: string }[]; days: { day: string; cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] }[] };
  }> {
    const html = await this.fetchHtml(`/ucebna/${code}`);
    const document = parseDocument(html);
    // Title (from <h1> or <title>)
    let title = '';
    const h1 = selectAll('h1 span.label', document.children)[0] as Element | undefined;
    if (h1 && h1.children.length > 0 && h1.children[0].type === 'text') {
      title = h1.children[0].data?.trim() || '';
    } else {
      const t = selectAll('title', document.children)[0] as Element | undefined;
      if (t && t.children.length > 0 && t.children[0].type === 'text') title = t.children[0].data?.trim() || '';
    }
    // Info table (userprofile)
    let floor = '', mainClassroom = '', manager = '', managerHref = '';
    const profileTable = selectAll('table.userprofile', document.children)[0] as Element | undefined;
    if (profileTable) {
      const rows = selectAll('tr', [profileTable]) as Element[];
      for (const row of rows) {
        const th = selectAll('th', [row])[0];
        const td = selectAll('td', [row])[0];
        if (!th || !td) continue;
        const label = selectAll('.label', [th])[0]?.children.find(c => c.type === 'text')?.data?.trim() || th.children.find(c => c.type === 'text')?.data?.trim();
        let value = '';
        const valueSpan = selectAll('.value', [td])[0];
        if (valueSpan) {
          value = valueSpan.children.find(c => c.type === 'text')?.data?.trim() || '';
        } else {
          value = td.children.find(c => c.type === 'text')?.data?.trim() || '';
        }
        if (label === 'Podlaží') floor = value;
        if (label === 'Kmenová učebna') mainClassroom = value;
        if (label === 'Správce') {
          const a = selectAll('a', [td])[0];
          if (a && a.attribs && a.attribs.href) managerHref = a.attribs.href;
          if (a && a.children.find(c => c.type === 'text')) {
            manager = a.children.find((c) => c.type === 'text')?.data?.trim() || '';
          } else {
            manager = td.children.find((c) => c.type === 'text')?.data?.trim() || '';
          }
        }
      }
    }
    // Timetable
    let timetable: { periods: { number: number; time: string }[]; days: { day: string; cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] }[] } | undefined = undefined;
    const timetableTable = selectAll('table.timetable', document.children)[0] as Element | undefined;
    if (timetableTable) {
      // Header row
      const headerRow = selectAll('tr', [timetableTable])[0];
      const ths = selectAll('th', [headerRow]);
      const periods: { number: number; time: string }[] = [];
      for (let i = 1; i < ths.length; i++) { // skip first (empty) th
        const th = ths[i] as Element;
        let numberText: string | undefined = undefined;
        if (Array.isArray(th.children)) {
          const textNode = th.children.find((c: any) => c.type === 'text');
          if (textNode && textNode.type === 'text') numberText = (textNode as import('domhandler').Text).data?.trim();
        }
        const timeSpan = selectAll('span.time', [th])[0] as Element | undefined;
        let time = '';
        if (timeSpan && Array.isArray(timeSpan.children)) {
          const timeNode = timeSpan.children.find((c: any) => c.type === 'text');
          if (timeNode && timeNode.type === 'text') time = (timeNode as import('domhandler').Text).data?.trim();
        }
        const number = numberText ? parseInt(numberText, 10) : i;
        periods.push({ number, time });
      }
      // Day rows
      const rows = selectAll('tr', [timetableTable]).slice(1); // skip header
      const days: { day: string; cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] }[] = [];
      for (const row of rows) {
        const th = selectAll('th.day', [row])[0] as Element | undefined;
        let day = '';
        if (th && Array.isArray(th.children)) {
          const dayNode = th.children.find((c: any) => c.type === 'text');
          if (dayNode && dayNode.type === 'text') day = (dayNode as import('domhandler').Text).data?.trim();
        }
        const tds = selectAll('td', [row]);
        const cells: (import('./SpseJecnaClient').TimetableLesson[] | null)[] = [];
        for (const td of tds) {
          let colspan = 1;
          if (td.type === 'tag' && td.attribs && td.attribs.colspan) {
            colspan = parseInt(td.attribs.colspan, 10);
          }
          if (td.type === 'tag' && td.attribs && td.attribs.class && td.attribs.class.includes('empty')) {
            for (let i = 0; i < colspan; i++) cells.push(null);
            continue;
          }
          // Each cell may have multiple lessons (splits/groups)
          const divs = selectAll('div', [td]);
          const lessons: import('./SpseJecnaClient').TimetableLesson[] = [];
          for (const div of divs) {
            // Room
            const roomA = selectAll('a.room', [div])[0] as Element | undefined;
            let room = '';
            if (roomA && Array.isArray(roomA.children)) {
              const roomNode = roomA.children.find((c: any) => c.type === 'text');
              if (roomNode && roomNode.type === 'text') room = (roomNode as import('domhandler').Text).data?.trim();
            }
            // Teacher
            const empA = selectAll('a.employee', [div])[0] as Element | undefined;
            let teacher = '';
            let teacherFull = '';
            if (empA) {
              if (Array.isArray(empA.children)) {
                const teacherNode = empA.children.find((c: any) => c.type === 'text');
                if (teacherNode && teacherNode.type === 'text') teacher = (teacherNode as import('domhandler').Text).data?.trim();
              }
              if (empA.type === 'tag' && empA.attribs && typeof empA.attribs.title === 'string') teacherFull = empA.attribs.title;
            }
            // Subject
            const subjSpan = selectAll('span.subject', [div])[0] as Element | undefined;
            let subject = '';
            let subjectLong = '';
            if (subjSpan) {
              if (Array.isArray(subjSpan.children)) {
                const subjNode = subjSpan.children.find((c: any) => c.type === 'text');
                if (subjNode && subjNode.type === 'text') subject = (subjNode as import('domhandler').Text).data?.trim();
              }
              if (subjSpan.type === 'tag' && subjSpan.attribs && typeof subjSpan.attribs.title === 'string') subjectLong = subjSpan.attribs.title;
            }
            // Class
            const classSpan = selectAll('span.class', [div])[0] as Element | undefined;
            let className = '';
            if (classSpan && Array.isArray(classSpan.children)) {
              const classNode = classSpan.children.find((c: any) => c.type === 'text');
              if (classNode && classNode.type === 'text') className = (classNode as import('domhandler').Text).data?.trim();
            }
            // Group (optional)
            const groupSpan = selectAll('span.group', [div])[0] as Element | undefined;
            let group = '';
            if (groupSpan && Array.isArray(groupSpan.children)) {
              const groupNode = groupSpan.children.find((c: any) => c.type === 'text');
              if (groupNode && groupNode.type === 'text') group = (groupNode as import('domhandler').Text).data?.trim();
            }
            lessons.push({ subject, subjectLong, teacher, teacherFull, room, group, className });
          }
          for (let i = 0; i < colspan; i++) cells.push(lessons);
        }
        days.push({ day, cells });
      }
      timetable = { periods, days };
    }
    return { title, floor, mainClassroom, manager, managerHref, timetable };
  }

  /**
   * Fetches the list of teachers from /ucitel
   */
  public async getTeachersList(): Promise<{ name: string; shortcut: string }[]> {
    const html = await this.fetchHtml('/ucitel');
    const document = parseDocument(html);
    const teachers: { name: string; shortcut: string }[] = [];
    // Teachers are in two columns: .contentLeftColumn ul > li > a and .contentRightColumn ul > li > a
    const leftLinks = selectAll('.contentLeftColumn ul li a', document.children) as Element[];
    const rightLinks = selectAll('.contentRightColumn ul li a', document.children) as Element[];
    for (const a of [...leftLinks, ...rightLinks]) {
      const name = a.children.find(c => c.type === 'text')?.data?.trim() || '';
      const href = a.attribs?.href || '';
      const match = href.match(/\/ucitel\/([A-Z]+)/i);
      const shortcut = match ? match[1] : '';
      if (name && shortcut) {
        teachers.push({ name, shortcut });
      }
    }
    return teachers;
  }

  /**
   * Fetches the list of rooms from /ucebna
   */
  public async getRoomsList(): Promise<{ label: string; code: string }[]> {
    const html = await this.fetchHtml('/ucebna');
    const document = parseDocument(html);
    const rooms: { label: string; code: string }[] = [];
    // Rooms are in .list li a.item
    const links = selectAll('.list li a.item', document.children) as Element[];
    for (const a of links) {
      const labelSpan = selectAll('span.label', [a])[0];
      const label = labelSpan && labelSpan.children.find(c => c.type === 'text')?.data?.trim() || '';
      const href = a.attribs?.href || '';
      const match = href.match(/\/ucebna\/(.+)$/i);
      const code = match ? decodeURIComponent(match[1]) : '';
      if (label && code) {
        rooms.push({ label, code });
      }
    }
    return rooms;
  }

  /**
   * Fetches arrivals and departures from /absence/passing-student
   */
  public async getPrichody(yearId?: string, monthId?: string): Promise<{
    years: { id: string, label: string }[];
    selectedYearId: string;
    months: { id: string, label: string }[];
    selectedMonthId: string;
    days: { date: string, events: { type: 'Příchod' | 'Odchod', time: string }[] }[];
  }> {
    let url = '/absence/passing-student';
    const params = new URLSearchParams();
    if (yearId) params.append('schoolYearId', yearId);
    if (monthId) params.append('schoolYearPartMonthId', monthId);
    if ([...params].length > 0) url += '?' + params.toString();
    const html = await this.fetchHtml(url);
    const document = parseDocument(html);
    // Year select
    const yearSelect = selectAll('select#schoolYearId', document.children)[0] as Element | undefined;
    const years: { id: string, label: string }[] = [];
    let selectedYearId = '';
    if (yearSelect) {
      const options = selectAll('option', [yearSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedYearId = id;
        years.push({ id, label });
      }
    }
    // Month select
    const monthSelect = selectAll('select#schoolYearPartMonthId', document.children)[0] as Element | undefined;
    const months: { id: string, label: string }[] = [];
    let selectedMonthId = '';
    if (monthSelect) {
      const options = selectAll('option', [monthSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedMonthId = id;
        months.push({ id, label });
      }
    }
    // Table rows
    const rows = selectAll('table.absence-list tr', document.children) as Element[];
    const days: { date: string, events: { type: 'Příchod' | 'Odchod', time: string }[] }[] = [];
    for (const row of rows) {
      const dateTd = selectAll('td.date', [row])[0] as Element | undefined;
      const contentTd = selectAll('td', [row])[1] as Element | undefined;
      if (!dateTd) continue;
      const date = dateTd.children.find(c => c.type === 'text')?.data?.replace(/\s+/g, ' ').trim() || '';
      const events: { type: 'Příchod' | 'Odchod', time: string }[] = [];
      if (contentTd) {
        // There may be multiple arrivals/departures in <p> or as text
        const ps = selectAll('p', [contentTd]);
        if (ps.length > 0) {
          for (const p of ps) {
            // Collect all text from text nodes and span nodes
            let text = '';
            for (const c of p.children) {
              if (c.type === 'text') text += c.data;
              if (c.type === 'tag' && c.name === 'span' && c.children.length > 0) {
                for (const sc of c.children) {
                  if (sc.type === 'text') text += sc.data;
                }
              }
            }
            text = text.trim();
            // Split by comma, e.g. "Příchod 8:56, Odchod 14:27"
            for (const part of text.split(', ')) {
              const m = part.split(" ");
              if (m) events.push({ type: m[0] as 'Příchod' | 'Odchod', time: m[1] });
            }
          }
        } else {
          // Sometimes just text
          const text = contentTd.children.map(c => c.type === 'text' ? c.data : '').join('').trim();
          for (const part of text.split(',')) {
            const m = part.match(/(Příchod|Odchod)\s+(\d{1,2}:\d{2})/);
            if (m) events.push({ type: m[1] as 'Příchod' | 'Odchod', time: m[2] });
          }
        }
      }
      days.push({ date, events });
    }
    return { years, selectedYearId, months, selectedMonthId, days };
  }

  /**
   * Fetches the omluvný list (absence list) from /absence/student
   */
  public async getOmluvnyList(yearId?: string): Promise<OmluvnyListResult> {
    let url = '/absence/student';
    const params = new URLSearchParams();
    if (yearId) params.append('schoolYearId', yearId);
    if ([...params].length > 0) url += '?' + params.toString();
    const html = await this.fetchHtml(url);
    const document = parseDocument(html);
    // Year select
    const yearSelect = selectAll('select#schoolYearId', document.children)[0] as Element | undefined;
    const years: { id: string; label: string }[] = [];
    let selectedYearId = '';
    if (yearSelect) {
      const options = selectAll('option', [yearSelect]) as Element[];
      for (const opt of options) {
        const id = opt.attribs.value;
        const label = opt.children.find(c => c.type === 'text')?.data?.trim() || '';
        const selected = !!opt.attribs.selected;
        if (selected) selectedYearId = id;
        years.push({ id, label });
      }
    }
    // Table rows
    const rows = selectAll('table.absence-list tr', document.children) as Element[];
    const absences: OmluvnyListAbsence[] = [];
    for (const row of rows) {
      const tds = selectAll('td', [row]);
      if (tds.length < 2) continue;
      const dateTd = tds[0] as Element;
      const countTd = tds[1] as Element;
      // Date and href
      let date = '';
      let href = undefined;
      const a = selectAll('a', [dateTd])[0] as Element | undefined;
      if (a && a.children.find(c => c.type === 'text')) {
        date = a.children.find((c) => c.type === 'text')?.data?.trim() || '';
        if (a.attribs && a.attribs.href) href = a.attribs.href;
      } else {
        date = dateTd.children.find((c) => c.type === 'text')?.data?.trim() || '';
      }
      // Count and unexcused
      let count = 0;
      let countUnexcused: number | undefined = undefined;
      // e.g. '<strong>1 hodina</strong> z toho <strong style="color:red">1 neomluvena</strong>'
      const strongs = selectAll('strong', [countTd]) as Element[];
      if (strongs.length > 0) {
        // First strong: total hours
        const countText = strongs[0].children.find(c => c.type === 'text')?.data?.trim() || '';
        const m = countText.match(/(\d+)/);
        if (m) count = parseInt(m[1], 10);
        // Second strong: unexcused
        if (strongs.length > 1) {
          const unexcusedText = strongs[1].children.find(c => c.type === 'text')?.data?.trim() || '';
          const m2 = unexcusedText.match(/(\d+)/);
          if (m2) countUnexcused = parseInt(m2[1], 10);
        }
      }
      absences.push({ date, count, countUnexcused, href });
    }
    return { years, selectedYearId, absences };
  }
} 