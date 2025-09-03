import { selectAll, selectOne } from 'css-select';
import type { Element } from 'domhandler';
import { parseDocument } from 'htmlparser2';

export type CanteenMenuItem = {
  name: string;
  allergens: number[];
  price: string;
  buttonPresstype: 'přeobjednat' | 'zrušit' | 'objednat';
  ordered: boolean;
  pickupTime?: string;
  orderDeadline?: string;
  cancelDeadline?: string;
  disabledAction: boolean;
  params: URLSearchParams;
  burzable: boolean;
  burzaType?: 'do burzy' | 'z burzy';
  burzaParams?: URLSearchParams;
};

export type CanteenMenuDay = {
  date: string;
  dayName: string;
  polevka: string;
  items: CanteenMenuItem[];
};

export type CanteenMenuResult = {
  credit: string; // current credit
  pickupLocation: string; // pickup location name
  menus: CanteenMenuDay[];
};

export class iCanteenClient {
  private readonly baseUrl = 'https://strav.nasejidelna.cz/0341';
  private auth = {
    username: '',
    password: '',
  };

  private async getCsrfToken() {
    const url = `${this.baseUrl}/faces/secured/main.jsp`;
    const response = await fetch(url);
    const text = await response.text();
    const csrfToken = text.match(/name="_csrf" value="([^"]+)"/)?.[1];
    return csrfToken;
  }

  public async setup(username: string, password: string) {
    const url = `${this.baseUrl}/j_spring_security_check`;
    const csrf = (await this.getCsrfToken()) || '';

    // Use URLSearchParams to build correct x-www-form-urlencoded body
    const params = new URLSearchParams();
    params.append('j_username', username);
    params.append('j_password', password);
    params.append('terminal', 'false');
    params.append('printer', 'false');
    params.append('keyboard', 'false');
    params.append('status', 'true');
    params.append('_spring_security_remember_me', 'false'); // fixed field name
    params.append('_', new Date().toString());
    params.append(
      'targetUrl',
      '/faces/secured/main.jsp?status=true&printer=&keyboard='
    );
    params.append('_csrf', csrf);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      credentials: 'include',
    });

    // Check if login was successful by examining the final URL
    if (response.url.includes('error=')) {
      console.log(
        'Unexpected login response:',
        response.status,
        response.url.substring(0, 200)
      );
      return;
    }

    // If we reach here, login was successful
    console.log('Login successful');
    this.auth.username = username;
    this.auth.password = password;
  }

  /**
   * Fetches and parses the monthly menu from iCanteen
   */
  public async getMonthlyMenu(): Promise<CanteenMenuResult> {
    const url = `${this.baseUrl}/faces/secured/month.jsp`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    const html = await response.text();
    const document = parseDocument(html);

    // Extract credit
    const creditElement = selectOne('[id="Kredit"]', document.children) as
      | Element
      | undefined;
    const credit =
      creditElement?.children.find(c => c.type === 'text')?.data?.trim() ||
      '0,00 Kč';

    // Extract pickup location
    const locationElement = selectOne(
      '[id="top:status:vydejnaName"]',
      document.children
    ) as Element | undefined;
    const pickupLocation =
      locationElement?.children.find(c => c.type === 'text')?.data?.trim() ||
      '';
    if (pickupLocation === '') {
      this.setup(this.auth.username, this.auth.password);
      return this.getMonthlyMenu();
    }

    // Extract menus
    const menuItems: CanteenMenuDay[] = [];
    const dayElements = selectAll(
      '.mainContext td form[name="objednatJidlo-"]',
      document.children
    ) as Element[];

    for (const day of dayElements) {
      const dayTextEl = selectOne(
        '.jidelnicekTop.semibold',
        day.children
      ) as Element;
      const regex = /^(\p{L}+)\s+(\d{2}\.\d{2}\.\d{4})$/u;
      const match =
        dayTextEl?.children
          .find(c => c.type === 'text')
          ?.data?.trim()
          .match(regex) || [];

      const [, dayName, date] = match;

      const foodItems = selectAll('.jidelnicekItem', day.children) as Element[];

      let polevka = '';
      const items: CanteenMenuItem[] = [];

      for (const food of foodItems) {
        const nameEl = selectOne('.jidWrapCenter', food.children) as Element;
        const name = nameEl.children.find(c => c.type === 'text')?.data?.trim();
        if (name?.length === 0) {
          continue;
        }
        const [thisPolivka, finalName] = name?.split(/,\s*;/) || [];
        polevka = thisPolivka;

        const allergensEl = selectAll(
          'sub > span.textGrey > span.textGrey', // I HATE BRITISH ENGLISH
          nameEl.children
        ) as Element[];
        const allergens = allergensEl.map(el =>
          parseInt(
            el.children
              .find(c => c.type === 'text')
              ?.data?.trim()
              .replaceAll(',', '') || ''
          )
        );

        const actionEl = selectOne(
          '.button-link-align.noPrint',
          food.children
        ) as Element;
        const action = actionEl.children
          .find(c => c.type === 'text')
          ?.data?.trim() as 'objednat' | 'zrušit' | 'přeobjednat';

        const ordered = selectAll('.fa.fa-check', food.children).length !== 0;

        const priceEl = selectOne(
          '.important.warning.button-link-align',
          food.children
        ) as Element;
        const price =
          priceEl.children.find(c => c.type === 'text')?.data?.trim() || '';

        const times = selectOne(
          '.far.fa-clock.fa-2x.inlineIcon',
          food.children
        ) as Element;
        const timesContent = times.attribs.title.trim();
        const normalized = timesContent.replace(/\u00A0/g, ' ');
        const regex =
          /výdej\s*od\s*:\s*<b>(.*?)<\/b>\s*do\s*:\s*<b>(.*?)<\/b>.*?objednat\s*do\s*:\s*<b>(.*?)<\/b>.*?zrušit\s*do\s*:\s*<b>(.*?)<\/b>/i;
        const match = normalized.match(regex) || [];
        const vydejOd = match[1];
        const vydejDo = match[2];
        const objednatDo = match[3];
        const zrusitDo = match[4];

        const disabledAction =
          selectAll(
            '.btn.button-link.button-link-main.maxbutton.disabled',
            food.children
          ).length !== 0;
        let burzaParams;
        let burzable = false;
        let burzaType: 'z burzy' | 'do burzy' | undefined;
        if (disabledAction) {
          // Do burzy
          const el = selectOne(
            '.jidWrapRight [id^="burza-amount"][id$="submit"]',
            food.children
          ) as Element | null;

          if (el) {
            burzable = true;
            burzaType = 'do burzy';
            const ajaxStr = el.attribs.onclick.trim();
            const urlMatch = ajaxStr.match(/'([^']+\.jsp\?[^']+)'/);
            const url = urlMatch ? urlMatch[1] : '';
            const queryString = url.split('?')[1];
            burzaParams = new URLSearchParams(queryString);
            burzaParams.set('amount', '1');
          } else {
            const el = selectOne(
              '.jidWrapRight .btn.button-link',
              food.children
            ) as Element | null;
            if (el) {
              burzable = true;
              burzaType = 'z burzy';
              const ajaxStr = el.attribs.onclick.trim();
              const urlMatch = ajaxStr.match(/'([^']+\.jsp\?[^']+)'/);
              const url = urlMatch ? urlMatch[1] : '';
              const queryString = url.split('?')[1];
              burzaParams = new URLSearchParams(queryString);
            }
          }
        }

        const btn = selectOne('.btn.button-link', food.children) as Element;

        const ajaxStr = btn.attribs.onclick.trim();
        const urlMatch = ajaxStr.match(/'([^']+\.jsp\?[^']+)'/);
        const url = urlMatch ? urlMatch[1] : '';
        const queryString = url.split('?')[1];
        const params = new URLSearchParams(queryString);

        items.push({
          name: finalName,
          allergens,
          ordered,
          buttonPresstype: action,
          price,
          pickupTime:
            vydejOd && vydejDo ? `${vydejOd} - ${vydejDo}` : undefined,
          orderDeadline: objednatDo,
          cancelDeadline: zrusitDo,
          disabledAction,
          params,
          burzable,
          burzaParams,
          burzaType,
        });
      }

      const dayObj: CanteenMenuDay = {
        date,
        dayName,
        polevka,
        items,
      };

      if (items.length === 0) {
        continue;
      }
      menuItems.push(dayObj);
    }

    console.log('FINAL: ', menuItems);

    return {
      credit,
      pickupLocation,
      menus: menuItems,
    };
  }

  public async runAction(menuItem: CanteenMenuItem) {
    const queryString = menuItem.params.toString();
    const url = `${this.baseUrl}/faces/secured/db/dbProcessOrder.jsp?${queryString}`;
    await fetch(url, {
      credentials: 'include',
    });
  }

  public async runBurza(menuItem: CanteenMenuItem) {
    const queryString = menuItem.burzaParams?.toString();
    const url = `${this.baseUrl}/faces/secured/db/dbProcessOrder.jsp?${queryString}`;
    await fetch(url, {
      credentials: 'include',
    });
  }
}
