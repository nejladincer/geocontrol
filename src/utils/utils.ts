import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { isValid, parseISO } from "date-fns";

export function findOrThrowNotFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): T {
  const item = array.find(predicate);
  if (!item) {
    throw new NotFoundError(errorMessage);
  }
  return item;
}

export function throwConflictIfFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): void {
  if (array.find(predicate)) {
    throw new ConflictError(errorMessage);
  }
}

export function parseISODateParamToUTC(param: unknown): Date | undefined {
  if (typeof param !== "string") return undefined;

  const date = parseISO(decodeURIComponent(param));
  return isValid(date) ? new Date(date.getTime()) : undefined;
}

export function parseStringArrayParam(param?: unknown): string[] | undefined {
  if (Array.isArray(param)) {
    return param
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  if (typeof param === "string") {
    return param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  return undefined;
}

/* VALIDATION FUNCTIONS */
function validName(name: string): boolean {
  const regexp = /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/;
  if (!regexp.test(name)) {
    return false;
  }

  return true;
}

/* NETWORKS VALIDATION */
export function validateNetworkCode(networkCode: string): void {
  if (!networkCode ||  typeof networkCode !== "string" || networkCode.length < 3) {
    throw new Error(`Invalid network ${networkCode}`);
  }
}

/* GATEWAYS VALIDATION */
export function validateGatewayMac(gatewayMac: string): void {
  if (!gatewayMac || typeof gatewayMac !== "string" || !validName(gatewayMac)) {
    console.log(`MAC Ad`)
    throw new Error(`Invalid gateway MAC address ${gatewayMac}`);
  }
}

/* SENSOR VALIDATION */
export function validateSensorMac(sensorMac: string): void {
  if (!sensorMac || typeof sensorMac !== "string" || !validName(sensorMac)) {
    throw new Error(`Invalid sensor MAC address ${sensorMac}`);
  }
}