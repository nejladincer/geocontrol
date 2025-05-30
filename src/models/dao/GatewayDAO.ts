import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { NetworkDAO } from "./NetworkDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @ManyToOne(() => NetworkDAO, network => network.gateways, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "networkCode" })
  network: NetworkDAO;

  @Column()
  networkCode: string;

  @OneToMany(() => SensorDAO, sensor => sensor.gateway, {
    cascade: true,
  })
  sensors: SensorDAO[];
}
