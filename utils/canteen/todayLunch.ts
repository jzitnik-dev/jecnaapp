import {
  DayMenu,
  MenuItem,
  MenuPage,
} from '@jzitnik/jecnaapi-react-native/canteen';

export function findTodayMenu(page: MenuPage, now?: Date): DayMenu | undefined {
  const ref = now ?? new Date();
  const day = ref.getDate();
  const month = ref.getMonth();
  const year = ref.getFullYear();

  return Object.values(page.menu.menu).find(menu => {
    const menuDate = new Date(menu.day);
    return (
      menuDate.getDate() === day &&
      menuDate.getMonth() === month &&
      menuDate.getFullYear() === year
    );
  });
}

export function findOrderedLunch(
  page: MenuPage,
  now?: Date
): MenuItem | undefined {
  return findTodayMenu(page, now)?.items.find(food => food.isOrdered);
}
