declare module "react-simple-maps" {
  import * as React from "react";

  export interface ComposableMapProps extends React.SVGAttributes<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: any[] }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps {
    geography: any;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }
  export const Geography: React.FC<GeographyProps>;

  export interface LineProps extends React.SVGAttributes<SVGPathElement> {
    from: [number, number];
    to: [number, number];
  }
  export const Line: React.FC<LineProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
  }
  export const Marker: React.FC<MarkerProps>;
}
