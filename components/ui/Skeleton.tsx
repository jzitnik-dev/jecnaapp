import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

export default function Skeleton({
  style,
  isDark,
}: {
  style: any;
  isDark: boolean;
}) {
  return (
    <ShimmerPlaceholder
      shimmerColors={
        isDark
          ? ['#2C2C2C', '#3A3A3A', '#2C2C2C']
          : ['#E1E9EE', '#F2F8FC', '#E1E9EE']
      }
      style={[style, { borderRadius: style.borderRadius || 8 }]}
    />
  );
}

export function WelcomeSkeleton({
  style,
  isDark,
}: {
  style: any;
  isDark: boolean;
}) {
  return (
    <ShimmerPlaceholder
      shimmerColors={
        isDark
          ? ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']
          : [
            'rgba(255,255,255,0.2)',
            'rgba(255,255,255,0.4)',
            'rgba(255,255,255,0.2)',
          ]
      }
      style={[style, { borderRadius: style.borderRadius || 8 }]}
    />
  );
}
