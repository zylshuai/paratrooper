export interface Vector2D {
  x: number;
  y: number;
}

export interface ParatrooperConfig {
  A: number;    // 伞兵数量 (> 100)
  X: number;    // 区域左上角X坐标
  Y: number;    // 区域左上角Y坐标  
  W: number;    // 区域宽度
  H: number;    // 区域高度
  Z: number;    // 相遇距离阈值 (< min(W,H))
  z: number;    // 队伍间距范围 (0 < z < Z)
  V_a: number;  // 最大速度
}

export enum ParatrooperPhysicalState {
  FALLING = 'falling',    // 降落中
  LANDED = 'landed'       // 已着陆（永久状态）
}

export enum ParatrooperCombatState {
  WAITING = 'waiting',       // 等待中（刚着陆）
  LEADING = 'leading',       // 头兵
  FOLLOWING = 'following',   // 跟随
  ALONE = 'alone'           // 单独作战
}

export interface Paratrooper {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  maxSpeed: number;
  minSpeed: number;        // 最小速度，不低于最大速度的50%
  landingTime: number;        // 预定降落时间
  actualLandedTime?: number;  // 实际着陆时间
  physicalState: ParatrooperPhysicalState;  // 物理状态：降落中/已着陆
  combatState: ParatrooperCombatState;      // 作战状态：等待/头兵/跟随等
  teamId?: number;
  leaderId?: number;
  color: string;
  shape: 'circle' | 'triangle' | 'square';
}

export interface Team {
  id: number;
  leaderId: number;
  members: number[];
  direction: Vector2D;
  lastDirectionChange: number;
}