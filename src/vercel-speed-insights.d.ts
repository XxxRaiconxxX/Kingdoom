declare module "@vercel/speed-insights/react" {
  type SpeedInsightsProps = {
    dsn?: string;
    sampleRate?: number;
    route?: string | null;
    debug?: boolean;
    scriptSrc?: string;
    endpoint?: string;
  };

  export function SpeedInsights(props: SpeedInsightsProps): JSX.Element | null;
}
