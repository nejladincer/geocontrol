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

  @ManyToOne(() => GatewayDAO, gateway => gateway.sensors, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "gatewayMac" }) // deve esistere
  gateway: GatewayDAO;

  @Column()
  gatewayMac: string;

  @OneToMany(() => MeasurementDAO, (measurement) => measurement.sensor)
measurements: MeasurementDAO[];
}
