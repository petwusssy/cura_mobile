import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";

export interface TabItem {
  key: string;
  label: string;
  icon: (props: { active: boolean; color: string; size: number }) => ReactNode;
  badge?: string | number;
}

export interface LiquidGlassTabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  isDark?: boolean;
  scrollY?: SharedValue<number>;
  autoHideOnScroll?: boolean;
}

export interface LiquidGlassHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  isDark?: boolean;
  rightAction?: ReactNode;
}

export interface LiquidGlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  isDark?: boolean;
  className?: string;
  style?: any;
}
