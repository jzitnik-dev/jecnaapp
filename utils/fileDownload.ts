import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Cookies } from '@jzitnik/jecnaapi-react-native/jecnaapi';

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0';
const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const ACCEPT_ENCODING = 'gzip, deflate';

function getAfterLastDot(str: string) {
  const index = str.lastIndexOf('.');
  return index === -1 ? '' : str.slice(index + 1);
}

export default async function downloadFile(filePath: string, label: string) {
  const url = new URL(filePath, 'https://www.spsejecna.cz').toString();
  const extension = getAfterLastDot(filePath);
  const filename = label + '.' + extension;

  const cookies = [
    await Cookies.getSessionCookie(),
    await Cookies.getCookie('WTDGUID'),
  ].filter((cookie): cookie is NonNullable<typeof cookie> => cookie !== null);

  if (cookies.length === 0)
    throw new Error('No authentication cookies available.');

  const cookieHeader = cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  // 1. Download to temporary internal storage first
  const internalUri = `${FileSystem.documentDirectory}${filename}`;
  const downloadResult = await FileSystem.downloadAsync(url, internalUri, {
    headers: {
      Cookie: cookieHeader,
      'User-Agent': USER_AGENT,
      'Accept-Language': ACCEPT_LANGUAGE,
      'Accept-Encoding': ACCEPT_ENCODING,
    },
  });

  const mimeType = downloadResult.mimeType || 'application/octet-stream';

  // 2. Platform specific saving logic
  if (Platform.OS === 'android') {
    try {
      // Asks user to pick a folder (like Downloads) - only prompts if permission not already saved
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        // Create an empty file in the user's chosen directory
        const externalUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            mimeType
          );

        // Read the internally downloaded file and write it to the public folder
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(externalUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return; // Success! File saved silently on Android.
      }
    } catch (e) {
      console.warn('SAF Failed, falling back to Share sheet', e);
    }
  }

  // 3. Fallback for iOS (or if Android user canceled the folder picker)
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(downloadResult.uri, {
    dialogTitle: `Save ${filename}`,
    mimeType: mimeType,
    UTI: mimeType,
  });
}
