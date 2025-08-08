import { selectAll, selectOne } from 'css-select';
import type { Element } from 'domhandler';
import { parseDocument } from 'htmlparser2';

export type CanteenMenuItem = {
  date: string; // e.g. '2025-06-20'
  dayName: string; // e.g. 'pátek'
  food: string; // food description
  price: string; // e.g. '40,00 Kč'
  status: 'ordered' | 'disabled' | 'allowed'; // order status
  allergens: string[]; // allergen codes
  orderDeadline?: string; // when to order by
  cancelDeadline?: string; // when to cancel by
  pickupTime?: string; // pickup time range
  orderId?: string; // internal order ID for ordering
  orderToken?: string; // token for ordering
  orderType?: string; // type for ordering (make, delete, none, etc.)
};

export type CanteenMenuResult = {
  credit: string; // current credit
  pickupLocation: string; // pickup location name
  menus: CanteenMenuItem[];
};

export class iCanteenClient {
  private readonly baseUrl = 'https://strav.nasejidelna.cz/0341';

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

    console.log('Login response final URL:', response.url);

    // Check if login was successful by examining the final URL
    if (response.url.includes('error=')) {
      const returnUrl = response.url;
      const parts = returnUrl.split('=');
      const errorCode = parseInt(parts[parts.length - 1]);
      console.log(
        'Unexpected login response:',
        response.status,
        response.url.substring(0, 200)
      );
    }

    // If we reach here, login was successful
    console.log('Login successful');
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
    console.log(html.replaceAll('\n', ''));
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

    // Extract menus
    const menuItems: CanteenMenuItem[] = [];
    const dayElements = selectAll(
      'div[id^="day-"]',
      document.children
    ) as Element[];

    for (const dayElement of dayElements) {
      const dayId = dayElement.attribs?.id;
      if (!dayId) continue;

      const date = dayId.replace('day-', '');
      const dayName =
        dayElement.children.find(c => c.type === 'text')?.data?.trim() || '';

      // Find the menu content for this day
      const orderContent = selectOne(
        `[id="orderContent${date}"]`,
        document.children
      ) as Element | undefined;
      if (!orderContent) continue;

      // Extract food description
      const menuElement = selectOne('.jidWrapCenter', [orderContent]) as
        | Element
        | undefined;
      if (!menuElement) continue;

      let food = '';
      for (const child of menuElement.children) {
        if (child.type === 'text') {
          food += child.data;
        }
      }
      food = food.replace(/\s+/g, ' ').trim();

      // Extract price
      const priceElement = selectOne('.important.warning', [orderContent]) as
        | Element
        | undefined;
      const price =
        priceElement?.children.find(c => c.type === 'text')?.data?.trim() || '';

      // Determine order status and extract order tokens
      const buttonElement = selectOne('.button-link-main', [orderContent]) as
        | Element
        | undefined;
      const buttonClass = buttonElement?.attribs?.class || '';
      let status: 'ordered' | 'disabled' | 'allowed' = 'allowed';
      if (buttonClass.includes('ordered')) status = 'ordered';
      else if (buttonClass.includes('disabled')) status = 'disabled';

      // Extract order ID and token from onClick attribute
      let orderId: string | undefined;
      let orderToken: string | undefined;
      let orderType: string | undefined;
      const onClickAttr = buttonElement?.attribs?.onClick || '';
      console.log('Button onClick attribute:', onClickAttr);

      const orderMatch = onClickAttr.match(/ID=(\d+)/);
      const tokenMatch = onClickAttr.match(/token=([^&]+)/);
      const typeMatch = onClickAttr.match(/type=([^&]+)/);

      if (orderMatch) {
        orderId = orderMatch[1];
        console.log('Found order ID:', orderId);
      }
      if (tokenMatch) {
        orderToken = decodeURIComponent(tokenMatch[1]);
        console.log('Found order token:', orderToken);
      }
      if (typeMatch) {
        orderType = decodeURIComponent(typeMatch[1]);
        console.log('Found order type:', orderType);
      }

      // If we didn't find tokens in onClick, try to find them in the HTML
      if (!orderId || !orderToken) {
        console.log('Trying to find tokens in HTML...');
        // Look for any element with order information
        const allElements = selectAll('*', [orderContent]) as Element[];
        for (const element of allElements) {
          const attrs = element.attribs || {};
          for (const [key, value] of Object.entries(attrs)) {
            if (value && typeof value === 'string') {
              if (value.includes('ID=') && value.includes('token=')) {
                console.log('Found element with order info:', key, value);
                const idMatch = value.match(/ID=(\d+)/);
                const tokenMatch = value.match(/token=([^&]+)/);
                const typeMatch = value.match(/type=([^&]+)/);
                if (idMatch && !orderId) {
                  orderId = idMatch[1];
                  console.log('Found order ID from HTML:', orderId);
                }
                if (tokenMatch && !orderToken) {
                  orderToken = decodeURIComponent(tokenMatch[1]);
                  console.log('Found order token from HTML:', orderToken);
                }
                if (typeMatch && !orderType) {
                  orderType = decodeURIComponent(typeMatch[1]);
                  console.log('Found order type from HTML:', orderType);
                }
              }
            }
          }
        }
      }

      // If still no tokens, try searching in the entire document
      if (!orderId || !orderToken) {
        console.log('Searching entire document for tokens...');
        const allDocElements = selectAll('*', document.children) as Element[];
        for (const element of allDocElements) {
          const attrs = element.attribs || {};
          for (const [key, value] of Object.entries(attrs)) {
            if (
              value &&
              typeof value === 'string' &&
              value.includes('ID=') &&
              value.includes('token=')
            ) {
              console.log(
                'Found document element with order info:',
                key,
                value
              );
              const idMatch = value.match(/ID=(\d+)/);
              const tokenMatch = value.match(/token=([^&]+)/);
              const typeMatch = value.match(/type=([^&]+)/);
              if (idMatch && !orderId) {
                orderId = idMatch[1];
                console.log('Found order ID from document:', orderId);
              }
              if (tokenMatch && !orderToken) {
                orderToken = decodeURIComponent(tokenMatch[1]);
                console.log('Found order token from document:', orderToken);
              }
              if (typeMatch && !orderType) {
                orderType = decodeURIComponent(typeMatch[1]);
                console.log('Found order type from document:', orderType);
              }
            }
          }
        }
      }

      console.log('Final order ID:', orderId);
      console.log('Final order token:', orderToken);
      console.log('Final order type:', orderType);

      // Extract allergens
      const allergenElements = selectAll('.textGrey span[title]', [
        orderContent,
      ]) as Element[];
      const allergens = allergenElements
        .map(el => {
          const title = el.attribs?.title || '';
          const match = title.match(/<b>([^<]+)<\/b>/);
          return match ? match[1] : '';
        })
        .filter(a => a);

      // Extract deadlines and pickup time from clock icon title
      const clockElement = selectOne('.fa-clock', [orderContent]) as
        | Element
        | undefined;
      const clockTitle = clockElement?.attribs?.title || '';

      let orderDeadline: string | undefined;
      let cancelDeadline: string | undefined;
      let pickupTime: string | undefined;

      if (clockTitle) {
        const pickupMatch = clockTitle.match(
          /výdej od: <b>([^<]+)<\/b> do: <b>([^<]+)<\/b>/
        );
        if (pickupMatch) {
          pickupTime = `${pickupMatch[1]} - ${pickupMatch[2]}`;
        }

        const orderMatch = clockTitle.match(/objednat do: <b>([^<]+)<\/b>/);
        if (orderMatch) {
          orderDeadline = orderMatch[1];
        }

        const cancelMatch = clockTitle.match(/zrušit do: <b>([^<]+)<\/b>/);
        if (cancelMatch) {
          cancelDeadline = cancelMatch[1];
        }
      }

      menuItems.push({
        date,
        dayName,
        food,
        price,
        status,
        allergens,
        orderDeadline,
        cancelDeadline,
        pickupTime,
        orderId,
        orderToken,
        orderType,
      });
    }

    return {
      credit,
      pickupLocation,
      menus: menuItems,
    };
  }

  /**
   * Orders a meal for a specific date
   */
  public async orderMeal(menuItem: CanteenMenuItem): Promise<boolean> {
    console.log('Ordering meal for date:', menuItem.date);
    console.log('Order ID:', menuItem.orderId);
    console.log('Order token:', menuItem.orderToken);
    console.log('Order type:', menuItem.orderType);

    if (!menuItem.orderId || !menuItem.orderToken) {
      console.error(
        'Missing order information - ID:',
        menuItem.orderId,
        'Token:',
        menuItem.orderToken
      );
      throw new Error('Missing order information');
    }

    // Construct the exact URL as in the original onClick attributes
    const time = Date.now();
    const token = menuItem.orderToken;
    const orderId = menuItem.orderId;
    const day = menuItem.date;
    const type = menuItem.orderType || 'make';
    const underscore = Date.now(); // Add the _ parameter like in curl

    // Build the URL with the correct path and all parameters
    const orderUrl = `${this.baseUrl}/faces/secured/db/dbProcessOrder.jsp?time=${time}&token=${token}&ID=${orderId}&day=${day}&type=${type}&week=&terminal=false&keyboard=false&printer=false&_=${underscore}`;

    console.log('Order URL:', orderUrl);

    try {
      const response = await fetch(orderUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          DNT: '1',
          'Sec-GPC': '1',
          Connection: 'keep-alive',
          Referer: `${this.baseUrl}/faces/secured/month.jsp`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          Priority: 'u=0',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          TE: 'trailers',
        },
        credentials: 'include',
      });

      console.log('Order response status:', response.status);

      // Check if the order was successful
      const responseText = await response.text();
      console.log('Order response text length:', responseText.length);
      console.log(
        'Order response text preview:',
        responseText.replaceAll('\n', '')
      );

      // Check for specific success/error indicators in the response
      const isSuccess =
        response.ok &&
        !responseText.includes('error') &&
        !responseText.includes('Error') &&
        !responseText.includes('chyba') &&
        !responseText.includes('Bezpečnostní kód je neplatný') &&
        !responseText.includes('Chyba 404') &&
        !responseText.includes('iCanteen chyba') &&
        !responseText.includes('více oken prohlížeče');

      console.log('Order success determination:', isSuccess);

      return isSuccess;
    } catch (error) {
      console.error('Order request failed:', error);
      return false;
    }
  }

  /**
   * Cancels an ordered meal for a specific date
   */
  public async cancelMeal(menuItem: CanteenMenuItem): Promise<boolean> {
    console.log('Canceling meal for date:', menuItem.date);
    console.log('Order ID:', menuItem.orderId);
    console.log('Order token:', menuItem.orderToken);
    console.log('Order type:', menuItem.orderType);

    if (!menuItem.orderId || !menuItem.orderToken) {
      console.error(
        'Missing order information - ID:',
        menuItem.orderId,
        'Token:',
        menuItem.orderToken
      );
      throw new Error('Missing order information');
    }

    // Construct the exact URL as in the original onClick attributes
    const time = Date.now();
    const token = menuItem.orderToken;
    const orderId = menuItem.orderId;
    const day = menuItem.date;
    const type = 'delete'; // Always use 'delete' for canceling
    const underscore = Date.now(); // Add the _ parameter like in curl

    // Build the URL with the correct path and all parameters
    const cancelUrl = `${this.baseUrl}/faces/secured/db/dbProcessOrder.jsp?time=${time}&token=${token}&ID=${orderId}&day=${day}&type=${type}&week=&terminal=false&keyboard=false&printer=false&_=${underscore}`;

    console.log('Cancel URL:', cancelUrl);

    try {
      const response = await fetch(cancelUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          DNT: '1',
          'Sec-GPC': '1',
          Connection: 'keep-alive',
          Referer: `${this.baseUrl}/faces/secured/month.jsp`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          Priority: 'u=0',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          TE: 'trailers',
        },
        credentials: 'include',
      });

      console.log('Cancel response status:', response.status);

      // Check if the cancellation was successful
      const responseText = await response.text();
      console.log('Cancel response text length:', responseText.length);
      console.log(
        'Cancel response text preview:',
        responseText.replaceAll('\n', '')
      );

      // Check for specific success/error indicators in the response
      const isSuccess =
        response.ok &&
        !responseText.includes('error') &&
        !responseText.includes('Error') &&
        !responseText.includes('chyba') &&
        !responseText.includes('Bezpečnostní kód je neplatný') &&
        !responseText.includes('Chyba 404') &&
        !responseText.includes('iCanteen chyba') &&
        !responseText.includes('více oken prohlížeče');

      console.log('Cancel success determination:', isSuccess);

      return isSuccess;
    } catch (error) {
      console.error('Cancel request failed:', error);
      return false;
    }
  }

  /**
   * Orders or cancels a meal based on current status
   */
  public async toggleMealOrder(menuItem: CanteenMenuItem): Promise<boolean> {
    if (menuItem.status === 'disabled') {
      throw new Error('Cannot order or cancel this meal');
    }

    if (menuItem.status === 'ordered') {
      return await this.cancelMeal(menuItem);
    } else {
      return await this.orderMeal(menuItem);
    }
  }
}
