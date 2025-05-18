/**
 * Defines the role of the user.
 * @export
 */
export const NetworkType = {
  Admin: 'admin',
  Operator: 'operator',
  Viewer: 'viewer'
} as const;
export type NetworkType = typeof NetworkType[keyof typeof NetworkType];


export function instanceOfNetworkType(value: any): boolean {
  for (const key in NetworkType) {
      if (Object.prototype.hasOwnProperty.call(NetworkType, key)) {
          if (NetworkType[key as keyof typeof NetworkType] === value) {
              return true;
          }
      }
  }
  return false;
}

export function NetworkTypeFromJSON(json: any): NetworkType {
  return NetworkTypeFromJSONTyped(json, false);
}

export function NetworkTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): NetworkType {
  return json as NetworkType;
}

export function NetworkTypeToJSON(value?: NetworkType | null): any {
  return value as any;
}

export function NetworkTypeToJSONTyped(value: any, ignoreDiscriminator: boolean): NetworkType {
  return value as NetworkType;
}
