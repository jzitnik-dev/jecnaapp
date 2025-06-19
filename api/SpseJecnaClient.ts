import { selectAll } from 'css-select';
import type { Element } from 'domhandler';
import { parseDocument } from 'htmlparser2';

export type Grade = {
  value: number | 'N'; // 1-5 or 'N' (absence, no grade)
  weight: number; // 1 for normal, 0.5 for small
  date?: string;
  note?: string;
  teacher?: string;
};
export type SubjectGrades = {
  subject: string;
  splits: { label: string; grades: Grade[] }[];
  finalGrade?: number | string;
};

export class SpseJecnaClient {
  private readonly baseUrl = 'https://www.spsejecna.cz';
  private cookies: string = '';

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
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'GET',
      headers: {
        'Cookie': 'WTDGUID=10',
        'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      },
      credentials: 'include',
    });
    const html = await response.text();
    
    this.updateCookies(response);
    const token = this.extractToken3(html);
    if (!token) throw new Error('Login token not found');
    return token;
  }

  public async login(username: string, password: string): Promise<boolean> {
    const token3 = await this.getLoginToken();
    const form = new URLSearchParams();
    form.append('user', username);
    form.append('pass', password);
    form.append('token3', token3);
    form.append('submit', "Přihlásit+se")

    const response = await fetch(`${this.baseUrl}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(this.cookies ? { 'Cookie': this.cookies } : {}),
        'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      },
      body: form.toString(),
    });
    const document = parseDocument(await response.text());
    const data = selectAll('.message.message-error', document.children) as Element[];
    if (data.length === 0) {
      this.updateCookies(response);
      return true;
    }

    return false;
  }

  public async fetchHtml(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        ...(this.cookies ? { 'Cookie': this.cookies } : {}),
        'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      },
      credentials: 'include',
    });
    this.updateCookies(response);
    return await response.text();
  }

  public async fetchAndParse(path: string): Promise<ReturnType<typeof parseDocument>> {
    const html = await this.fetchHtml(path);
    return parseDocument(html);
  }

  public async getZnamky(): Promise<SubjectGrades[]> {
    const html = await this.fetchHtml('/score/student');
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
            let value: number | 'N' | undefined;
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

  public async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/user/logout`, {
      method: 'GET',
      headers: {
        ...(this.cookies ? { 'Cookie': this.cookies } : {}),
        'User-Agent': 'Mozilla/5.0 (compatible; SpseJecnaBot/1.0)',
      },
      credentials: 'include',
    });
    this.cookies = '';
  }
} 