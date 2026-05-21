import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Brand } from "./Brand";

export enum DTCCategory {
    GENERIC = "generic",
    SPECIFIC = "specific",
}

@Entity("diagnostic_codes")
export class DiagnosticCode {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // Index agar pencarian P0133, dll menjadi sangat cepat
    @Index()
    @Column({ type: "varchar", length: 10 })
    code!: string; // contoh: "P0133"

    @Column({ type: "enum", enum: DTCCategory, default: DTCCategory.GENERIC })
    category!: DTCCategory;

    // Relasi: Boleh KOSONG (nullable) jika kodenya "generic" (berlaku semua merek)
    @ManyToOne(() => Brand, (brand) => brand.diagnosticCodes, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "brand_id" })
    brand!: Brand | null;

    @Column({ type: "text" })
    description!: string;

    // simple-array di TypeORM akan menyimpannya sebagai string yang dipisahkan koma di database
    // Jika pakai PostgreSQL, Anda bisa ganti jadi type: "text", array: true
    @Column("simple-array")
    symptoms!: string[];

    @Column("simple-array")
    causes!: string[];

    @Column("simple-array")
    solutions!: string[];
}