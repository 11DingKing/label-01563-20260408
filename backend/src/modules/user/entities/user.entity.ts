import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 50, unique: true })
  username: string;

  @Column({ type: "varchar", length: 255 })
  @Exclude()
  password: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  nickname: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string | null;

  @Column({ type: "tinyint", default: 1, comment: "状态: 0禁用 1启用" })
  @Index()
  status: number;

  @Column({ type: "tinyint", default: 0, comment: "角色: 0普通用户 1管理员" })
  @Index()
  role: number;

  // 登录失败限制相关字段
  @Column({
    name: "login_attempts",
    type: "int",
    default: 0,
    comment: "登录失败次数",
  })
  @Exclude()
  loginAttempts: number;

  @Column({
    name: "locked_until",
    type: "datetime",
    nullable: true,
    comment: "锁定截止时间",
  })
  @Exclude()
  lockedUntil: Date | null;

  @Column({
    name: "last_login_at",
    type: "datetime",
    nullable: true,
    comment: "最后登录时间",
  })
  lastLoginAt: Date | null;

  @Column({
    name: "last_login_ip",
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "最后登录IP",
  })
  lastLoginIp: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // 判断账户是否被锁定
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }
}
