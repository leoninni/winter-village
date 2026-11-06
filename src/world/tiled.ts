/** The subset of the Tiled JSON (.tmj) format this game reads and writes. */

export interface TiledProperty {
  name: string;
  type: 'string' | 'bool' | 'int' | 'float';
  value: string | boolean | number;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  point?: boolean;
  properties?: TiledProperty[];
}

export interface TiledTileLayer {
  id: number;
  name: string;
  type: 'tilelayer';
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  data: number[];
}

export interface TiledObjectLayer {
  id: number;
  name: string;
  type: 'objectgroup';
  draworder: 'topdown' | 'index';
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  objects: TiledObject[];
}

export interface TiledTileset {
  firstgid: number;
  name: string;
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  margin: number;
  spacing: number;
  tiles?: { id: number; properties?: TiledProperty[] }[];
  /** present if the tileset is external – not supported by Phaser */
  source?: string;
}

export interface TiledMap {
  type: 'map';
  version: string;
  tiledversion: string;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: boolean;
  properties?: TiledProperty[];
  nextlayerid: number;
  nextobjectid: number;
  layers: (TiledTileLayer | TiledObjectLayer)[];
  tilesets: TiledTileset[];
}

export function prop(obj: { properties?: TiledProperty[] }, name: string): TiledProperty['value'] | undefined {
  return obj.properties?.find((p) => p.name === name)?.value;
}
