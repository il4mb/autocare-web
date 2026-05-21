import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Brand } from "./Brand";

@Entity("vehicles")
export class Vehicle {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 150 })
    model!: string;

    @Column({ type: "varchar", length: 4, nullable: true })
    year!: string;

    @ManyToOne(() => Brand, (brand) => brand.vehicles, { onDelete: "CASCADE" })
    @JoinColumn({ name: "brand_id" })
    brand!: Brand;
}