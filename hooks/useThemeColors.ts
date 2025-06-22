import { useAppTheme } from './useAppTheme';

export const useThemeColors = () => {
  const { navigationTheme } = useAppTheme();

  return {
    primary: navigationTheme.colors.primary,
    background: navigationTheme.colors.background,
    surface: navigationTheme.colors.card,
    text: navigationTheme.colors.text,
    border: navigationTheme.colors.border,
    notification: navigationTheme.colors.notification,
  };
};
