declare module '@sohumsuthar/liquid-glass' {
  export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
    macro?: boolean;
    variant?: 'clear' | 'regular';
    dimmed?: boolean;
    interactive?: boolean;
    lens?: boolean;
    lensOptions?: {
      bezel?: number;
      refraction?: number;
      dispersion?: number;
      radius?: number;
    };
    mobileFlat?: boolean;
    className?: string;
    style?: React.CSSProperties;
    contentClassName?: string;
    contentStyle?: React.CSSProperties;
    children?: React.ReactNode;
  }
  export const LiquidGlass: React.FC<LiquidGlassProps>;
  export const LiquidGlassFilter: React.FC<{
    displacementMap?: string;
    scale?: number;
    smScale?: number;
    dispersion?: number;
    smDispersion?: number;
  }>;
}

declare module '@sohumsuthar/liquid-glass/components/LiquidGlass' {
  import type { LiquidGlassProps } from '@sohumsuthar/liquid-glass';
  const LiquidGlass: React.FC<LiquidGlassProps>;
  export default LiquidGlass;
}
