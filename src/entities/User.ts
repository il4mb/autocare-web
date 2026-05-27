import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, DeleteDateColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}

@Entity("users")
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255 })
    password!: string;

    @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt!: Date | null;

    // Tambahkan kolom untuk reset token dan expiry
    @Column({ name: "reset_token", type: "varchar", length: 255, nullable: true, default: null })
    resetToken!: string | null;

    @Column({ name: "reset_token_expiry", type: "timestamp", nullable: true, default: null })
    resetTokenExpiry!: Date | null;

}