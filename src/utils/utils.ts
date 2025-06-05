import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { isValid, parseISO } from "date-fns";
import AppError from "@models/errors/AppError";
import { AppDataSource } from "@database";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";

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
function validMacAddress(mac: string): boolean {
  const regexp = /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/;
  return regexp.test(mac);
}

/* NETWORKS VALIDATION */
export function validateNetworkCode(networkCode: string): void {
  // Format validation
  if (!networkCode || typeof networkCode !== "string" || networkCode.length < 3) {
    throw new AppError(`Invalid network code format: ${networkCode}`, 400);
  }
}

// Checks if network exists in DB
export async function verifyNetworkExists(networkCode: string): Promise<NetworkDAO> {
  validateNetworkCode(networkCode);
  
  const networkRepo = AppDataSource.getRepository(NetworkDAO);
  const network = await networkRepo.findOne({ where: { code: networkCode } });
  
  if (!network) {
    throw new NotFoundError(`Network with code '${networkCode}' not found`);
  }
  
  return network;
}

/* GATEWAYS VALIDATION */
export function validateGatewayMac(gatewayMac: string): void {
  if (!gatewayMac || typeof gatewayMac !== "string") {
    throw new AppError(`Invalid gateway MAC address: missing or wrong type`, 400);
  }
  
  if (!validMacAddress(gatewayMac)) {
    throw new AppError(`Invalid gateway MAC address format: ${gatewayMac}`, 400);
  }
}

// Checks if gateway exists in DB
export async function verifyGatewayExists(gatewayMac: string, networkCode: string): Promise<GatewayDAO> {
  validateGatewayMac(gatewayMac);
  await verifyNetworkExists(networkCode);
  
  const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
  const gateway = await gatewayRepo.findOne({ 
    where: { 
      macAddress: gatewayMac,
      networkCode: networkCode
    }
  });
  
  if (!gateway) {
    throw new NotFoundError(`Gateway with macAddress '${gatewayMac}' not found in network '${networkCode}'`);
  }
  
  return gateway;
}

/* SENSOR VALIDATION */
export function validateSensorMac(sensorMac: string): void {
  if (!sensorMac || typeof sensorMac !== "string") {
    throw new AppError(`Invalid sensor MAC address: missing or wrong type`, 400);
  }
  
  if (!validMacAddress(sensorMac)) {
    throw new AppError(`Invalid sensor MAC address format: ${sensorMac}`, 400);
  }
}

// Checks if sensor exists and validates its relationships
export async function verifySensorExists(sensorMac: string, gatewayMac: string, networkCode: string): Promise<SensorDAO> {
  validateSensorMac(sensorMac);
  validateGatewayMac(gatewayMac);
  validateNetworkCode(networkCode);
  
  const sensorRepo = AppDataSource.getRepository(SensorDAO);
  
  // Find gateway and network which the sensor should belong to
  const sensor = await sensorRepo.findOne({ 
    relations: ['gateway', 'gateway.network'],
    where: { 
      macAddress: sensorMac,
      gatewayMac: gatewayMac
    }
  });
  
  if (!sensor) {
    throw new NotFoundError(`Sensor with macAddress '${sensorMac}' not found for gateway '${gatewayMac}' in network '${networkCode}'`);
  }
  
  // Additional validation to ensure relations match
  if (!sensor.gateway) {
    throw new NotFoundError(`Gateway relationship missing for sensor '${sensorMac}'`);
  }
  
  if (sensor.gateway.macAddress !== gatewayMac) {
    throw new NotFoundError(`Sensor '${sensorMac}' does not belong to gateway '${gatewayMac}'`);
  }
  
  if (!sensor.gateway.network) {
    throw new NotFoundError(`Network relationship missing for gateway '${gatewayMac}'`);
  }
  
  if (sensor.gateway.network.code !== networkCode) {
    throw new NotFoundError(`Gateway '${gatewayMac}' does not belong to network '${networkCode}'`);
  }
  
  return sensor;
}