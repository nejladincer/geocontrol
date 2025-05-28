import {Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany} from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementDAO } from "./MeasurementDAO";
import { measureMemory } from "vm";

@Entity("sensors")
export class SensorDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  variable: string;

  @Column({ nullable: false })
  unit: string;

  // N Sensors : 1 Gateway
  @ManyToOne(() => GatewayDAO, gateway => gateway.sensors, { cascade: true })
  @JoinColumn({ name: "gatewayMac" })
  gateway: GatewayDAO;

  // 1 Sensor : N Measurements
  @OneToMany(() => MeasurementDAO, measurement => measurement.sensor)
  measurements: MeasurementDAO[];
}
