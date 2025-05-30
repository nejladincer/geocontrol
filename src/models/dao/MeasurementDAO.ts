import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, Timestamp, JoinColumn } from "typeorm";
import { NetworkDAO } from "./NetworkDAO"; 
import { SensorDAO } from "./SensorDAO";

@Entity("measurements")
export class MeasurementDAO {
  @PrimaryColumn({ nullable: false })
  code: string;

  @Column({ nullable: false }) 
  createdAt: string;

  @Column({ nullable: false })
  value: number;

  @Column({ nullable: true })
  isOutlier: boolean;

  // N Measurement : 1 Sensor
  @ManyToOne( () => SensorDAO, (sensor) => sensor.measurements, { cascade: true })
  @JoinColumn({ name: "sensorMacAddress" })
  sensor: SensorDAO;

  @Column()
  sensorMacAddress: string;
}
