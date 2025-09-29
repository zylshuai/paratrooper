import { 
  Paratrooper, 
  Team, 
  Vector2D, 
  ParatrooperConfig, 
  ParatrooperPhysicalState,
  ParatrooperCombatState
} from '../types/paratrooper';

export class ParatrooperSimulation {
  private config: ParatrooperConfig;
  private paratroopers: Map<number, Paratrooper> = new Map();
  private teams: Map<number, Team> = new Map();
  private currentTime: number = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, config: ParatrooperConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    
    // 修复高DPI屏幕字体模糊问题
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    this.initializeParatroopers();
  }

  private initializeParatroopers(): void {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const shapes: Array<'circle' | 'triangle' | 'square'> = ['circle', 'triangle', 'square'];
    
    for (let i = 0; i < this.config.A; i++) {
      const landingTime = Math.random() * 8 + 1; // 1-9秒内降落，确保有足够的分布
      const maxSpeed = Math.random() * this.config.V_a + 0.5; // 至少0.5的速度
      const paratrooper: Paratrooper = {
        id: i,
        position: {
          x: this.config.X + Math.random() * this.config.W,
          y: this.config.Y + Math.random() * this.config.H
        },
        velocity: { x: 0, y: 0 },
        maxSpeed: maxSpeed,
        minSpeed: maxSpeed * 0.5, // 最小速度为最大速度的50%
        landingTime: landingTime,
        physicalState: ParatrooperPhysicalState.FALLING,  // 物理状态：降落中
        combatState: ParatrooperCombatState.WAITING,      // 作战状态：等待中
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length]
      };
      this.paratroopers.set(i, paratrooper);
    }
  }

  private distance(p1: Vector2D, p2: Vector2D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private normalize(v: Vector2D): Vector2D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }

  private getRandomDirection(): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  private ensureMinimumSpeed(velocity: Vector2D, paratrooper: Paratrooper): Vector2D {
    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    if (currentSpeed < paratrooper.minSpeed && currentSpeed > 0) {
      const ratio = paratrooper.minSpeed / currentSpeed;
      return {
        x: velocity.x * ratio,
        y: velocity.y * ratio
      };
    }
    return velocity;
  }

  private applySpacingForce(paratrooper: Paratrooper): Vector2D {
    // 头兵不受间距控制影响，可以自由移动带领队伍
    if (paratrooper.combatState === ParatrooperCombatState.LEADING) {
      return { x: 0, y: 0 };
    }
    
    let forceX = 0;
    let forceY = 0;
    
    // 检查与其他已着陆伞兵的距离
    for (const other of this.paratroopers.values()) {
      if (other.id === paratrooper.id || other.physicalState !== ParatrooperPhysicalState.LANDED) {
        continue;
      }
      
      // 跟随者不与自己的头兵产生推挤力（跟随逻辑会处理距离控制）
      if (paratrooper.combatState === ParatrooperCombatState.FOLLOWING && 
          other.id === paratrooper.leaderId) {
        continue;
      }
      
      const dist = this.distance(paratrooper.position, other.position);
      
      // 如果对方是头兵，需要保持更大的距离（尊重头兵的个人空间）
      const minDistance = other.combatState === ParatrooperCombatState.LEADING 
        ? this.config.z * 0.6  // 与头兵保持更大距离
        : this.config.z;       // 与普通伞兵保持正常距离
      
      if (dist < minDistance && dist > 0) {
        // 太近了，需要推开
        const pushStrength = (minDistance - dist) / minDistance; // 距离越近，推力越大
        const direction = this.normalize({
          x: paratrooper.position.x - other.position.x,
          y: paratrooper.position.y - other.position.y
        });
        
        // 如果对方是头兵，推力更强
        const forceMagnitude = other.combatState === ParatrooperCombatState.LEADING 
          ? paratrooper.maxSpeed * 0.8  // 对头兵更强的推力
          : paratrooper.maxSpeed * 0.5; // 对普通伞兵正常推力
        
        forceX += direction.x * pushStrength * forceMagnitude;
        forceY += direction.y * pushStrength * forceMagnitude;
      }
    }
    
    return { x: forceX, y: forceY };
  }

  private checkMeetings(): void {
    const landedTroopers = Array.from(this.paratroopers.values())
      .filter(p => p.physicalState === ParatrooperPhysicalState.LANDED && p.combatState === ParatrooperCombatState.WAITING)
      .sort((a, b) => (a.actualLandedTime || a.landingTime) - (b.actualLandedTime || b.landingTime)); // 按实际降落时间排序

    console.log(`检查相遇：当前有${landedTroopers.length}个等待中的已着陆伞兵`);

    // 检查现有队伍是否可以吸收新成员
    for (const team of this.teams.values()) {
      const leader = this.paratroopers.get(team.leaderId);
      if (!leader || leader.combatState !== ParatrooperCombatState.LEADING) continue;

      for (const trooper of landedTroopers) {
        if (trooper.teamId !== undefined) continue; // 已经有队伍了
        
        const distance = this.distance(leader.position, trooper.position);
        if (distance < this.config.Z) {
          console.log(`伞兵${trooper.id}加入现有队伍${team.id}，跟随头兵${leader.id}，距离:${distance.toFixed(1)}`);
          this.addToTeam(team.id, trooper);
        }
      }
    }

    // 为剩余的等待伞兵寻找新的组队机会
    const remainingTroopers = landedTroopers.filter(p => p.teamId === undefined);
    
    for (let i = 0; i < remainingTroopers.length; i++) {
      const leader = remainingTroopers[i];
      if (leader.teamId !== undefined) continue; // 已经被分配了

      const nearbyTroopers = [];
      
      // 找到所有在Z范围内的其他伞兵
      for (let j = i + 1; j < remainingTroopers.length; j++) {
        const follower = remainingTroopers[j];
        if (follower.teamId !== undefined) continue; // 已经被分配了
        
        const distance = this.distance(leader.position, follower.position);
        if (distance < this.config.Z) {
          nearbyTroopers.push(follower);
        }
      }

      // 如果找到了附近的伞兵，创建队伍
      if (nearbyTroopers.length > 0) {
        console.log(`伞兵${leader.id}创建新队伍，将带领${nearbyTroopers.length}个伞兵`);
        const teamId = this.createTeam(leader);
        
        for (const follower of nearbyTroopers) {
          this.addToTeam(teamId, follower);
        }
      }
    }
  }

  private createTeam(leader: Paratrooper): number {
    const teamId = this.teams.size;
    const team: Team = {
      id: teamId,
      leaderId: leader.id,
      members: [leader.id],
      direction: this.getRandomDirection(),
      lastDirectionChange: this.currentTime
    };
    this.teams.set(teamId, team);
    
    leader.combatState = ParatrooperCombatState.LEADING;
    leader.teamId = teamId;
    console.log(`创建新队伍${teamId}，伞兵${leader.id}成为头兵`);
    return teamId;
  }

  private addToTeam(teamId: number, follower: Paratrooper): void {
    const team = this.teams.get(teamId);
    if (!team) return;

    const leader = this.paratroopers.get(team.leaderId);
    if (!leader) return;

    if (!team.members.includes(follower.id)) {
      team.members.push(follower.id);
      follower.combatState = ParatrooperCombatState.FOLLOWING;
      follower.teamId = teamId;
      follower.leaderId = leader.id;
      console.log(`伞兵${follower.id}加入队伍${teamId}，跟随头兵${leader.id}`);
    }
  }

  private formTeam(leader: Paratrooper, follower: Paratrooper): void {
    // 只有等待中的已着陆伞兵才能组队
    if (leader.physicalState === ParatrooperPhysicalState.LANDED && 
        follower.physicalState === ParatrooperPhysicalState.LANDED &&
        leader.combatState === ParatrooperCombatState.WAITING &&
        follower.combatState === ParatrooperCombatState.WAITING) {
      
      let teamId = leader.teamId;
      
      if (!teamId) {
        // 创建新队伍
        teamId = this.createTeam(leader);
      }

      // 添加跟随者
      this.addToTeam(teamId, follower);
    }
  }

  private updateParatroopers(deltaTime: number): void {
    for (const paratrooper of this.paratroopers.values()) {
      // 更新降落状态
      if (paratrooper.physicalState === ParatrooperPhysicalState.FALLING) {
        if (this.currentTime >= paratrooper.landingTime) {
          paratrooper.physicalState = ParatrooperPhysicalState.LANDED;
          paratrooper.combatState = ParatrooperCombatState.WAITING;
          paratrooper.actualLandedTime = this.currentTime; // 记录实际着陆时间
        }
        continue;
      }

      // 更新位置和速度
      this.updateParatrooperMovement(paratrooper, deltaTime);
      
      // 边界检测
      paratrooper.position.x = Math.max(this.config.X, 
        Math.min(this.config.X + this.config.W, paratrooper.position.x));
      paratrooper.position.y = Math.max(this.config.Y, 
        Math.min(this.config.Y + this.config.H, paratrooper.position.y));
    }
  }

  private updateParatrooperMovement(paratrooper: Paratrooper, deltaTime: number): void {
    if (paratrooper.combatState === ParatrooperCombatState.LEADING) {
      this.updateLeaderMovement(paratrooper, deltaTime);
    } else if (paratrooper.combatState === ParatrooperCombatState.FOLLOWING) {
      this.updateFollowerMovement(paratrooper, deltaTime);
    } else if (paratrooper.combatState === ParatrooperCombatState.WAITING) {
      // 给着陆的伞兵2秒时间来寻找队友
      const waitTime = 2.0; // 2秒等待时间，便于测试
      if (paratrooper.actualLandedTime && 
          this.currentTime - paratrooper.actualLandedTime >= waitTime && 
          !paratrooper.teamId) {
        // 等待时间结束且没有找到队友，变为单独行动
        paratrooper.combatState = ParatrooperCombatState.ALONE;
        const newVelocity = {
          x: (Math.random() - 0.5) * paratrooper.maxSpeed,
          y: (Math.random() - 0.5) * paratrooper.maxSpeed
        };
        paratrooper.velocity = this.ensureMinimumSpeed(newVelocity, paratrooper);
        // 状态已转换为ALONE，继续执行移动逻辑而不是返回
      } else {
        // 仍在等待状态下不移动，等待其他伞兵或超时
        return; // 不执行位置更新
      }
    }
    
    // ALONE状态的处理
    if (paratrooper.combatState === ParatrooperCombatState.ALONE) {
      // 随机移动（2%概率改变方向）
      if (Math.random() < 0.02) {
        const newVelocity = {
          x: (Math.random() - 0.5) * paratrooper.maxSpeed,
          y: (Math.random() - 0.5) * paratrooper.maxSpeed
        };
        paratrooper.velocity = this.ensureMinimumSpeed(newVelocity, paratrooper);
      }
    }

    // 应用速度（FALLING状态不移动）
    if (paratrooper.physicalState !== ParatrooperPhysicalState.FALLING) {
      // 应用间距控制力
      const spacingForce = this.applySpacingForce(paratrooper);
      
      // 将间距力与当前速度结合
      let finalVelocity = {
        x: paratrooper.velocity.x + spacingForce.x,
        y: paratrooper.velocity.y + spacingForce.y
      };
      
      // 限制最大速度
      const currentSpeed = Math.sqrt(finalVelocity.x ** 2 + finalVelocity.y ** 2);
      if (currentSpeed > paratrooper.maxSpeed) {
        const ratio = paratrooper.maxSpeed / currentSpeed;
        finalVelocity = {
          x: finalVelocity.x * ratio,
          y: finalVelocity.y * ratio
        };
      }
      
      // 确保最小速度
      finalVelocity = this.ensureMinimumSpeed(finalVelocity, paratrooper);
      
      paratrooper.position.x += finalVelocity.x * deltaTime;
      paratrooper.position.y += finalVelocity.y * deltaTime;
    }
  }

  private updateLeaderMovement(leader: Paratrooper, _deltaTime: number): void {
    const team = this.teams.get(leader.teamId!)!;
    
    // 定期改变方向
    if (this.currentTime - team.lastDirectionChange > 2 + Math.random() * 3) {
      team.direction = this.getRandomDirection();
      team.lastDirectionChange = this.currentTime;
    }

    const newVelocity = {
      x: team.direction.x * leader.maxSpeed,
      y: team.direction.y * leader.maxSpeed
    };
    leader.velocity = this.ensureMinimumSpeed(newVelocity, leader);
  }

  private updateFollowerMovement(follower: Paratrooper, _deltaTime: number): void {
    const leader = this.paratroopers.get(follower.leaderId!)!;
    if (!leader) return;

    const dist = this.distance(follower.position, leader.position);
    const leaderPersonalSpace = this.config.z * 0.4; // 头兵的个人空间，约为z的40%
    
    if (dist > this.config.Z) {
      // 太远了，脱离队伍
      follower.combatState = ParatrooperCombatState.ALONE;
      follower.teamId = undefined;
      follower.leaderId = undefined;
      return;
    }

    if (dist < leaderPersonalSpace) {
      // 太接近头兵了，需要后退保持个人空间
      const direction = this.normalize({
        x: follower.position.x - leader.position.x,
        y: follower.position.y - leader.position.y
      });
      
      // 强制推开力，确保不会重叠
      const pushForce = (leaderPersonalSpace - dist) / leaderPersonalSpace;
      const pushSpeed = follower.maxSpeed * pushForce * 1.5; // 强力推开
      
      const newVelocity = {
        x: direction.x * pushSpeed,
        y: direction.y * pushSpeed
      };
      follower.velocity = this.ensureMinimumSpeed(newVelocity, follower);
    } else if (dist > this.config.z) {
      // 距离大于z，需要靠近队长，但不能进入个人空间
      const direction = this.normalize({
        x: leader.position.x - follower.position.x,
        y: leader.position.y - follower.position.y
      });
      
      // 目标距离是z，避免进入个人空间
      const targetDistance = Math.max(this.config.z, leaderPersonalSpace * 1.2);
      const targetSpeed = Math.min(follower.maxSpeed * 0.8, (dist - targetDistance) * 2);
      
      if (targetSpeed > 0) {
        const newVelocity = {
          x: direction.x * targetSpeed,
          y: direction.y * targetSpeed
        };
        follower.velocity = this.ensureMinimumSpeed(newVelocity, follower);
      } else {
        // 已经在合适距离，保持当前速度的一部分
        follower.velocity = {
          x: follower.velocity.x * 0.8,
          y: follower.velocity.y * 0.8
        };
      }
    } else {
      // 在合适的跟随距离内，轻微调整位置
      follower.velocity = {
        x: follower.velocity.x * 0.9,
        y: follower.velocity.y * 0.9
      };
    }
  }

  private render(): void {
    // 获取实际的画布尺寸（除以dpr）
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;
    
    // 清空画布
    this.ctx.fillStyle = '#f0f8ff';
    this.ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 绘制区域边界
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.config.X, this.config.Y, this.config.W, this.config.H);

    // 绘制伞兵
    for (const paratrooper of this.paratroopers.values()) {
      this.drawParatrooper(paratrooper);
    }

    // 绘制队伍连线
    this.drawTeamConnections();

    // 绘制信息
    this.drawInfo();
  }

  private drawParatrooper(paratrooper: Paratrooper): void {
    const { position, shape, physicalState, combatState } = paratrooper;
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y);

    // 根据状态设置透明度
    let alpha = 1;
    if (physicalState === ParatrooperPhysicalState.FALLING) alpha = 0.3;

    this.ctx.globalAlpha = alpha;

    // 根据作战状态设置颜色
    let fillColor = '#6B7280'; // 默认灰色
    switch (combatState) {
      case ParatrooperCombatState.LEADING:
        fillColor = '#10B981'; // 绿色 - 头兵
        break;
      case ParatrooperCombatState.FOLLOWING:
        fillColor = '#3B82F6'; // 蓝色 - 跟随者
        break;
      case ParatrooperCombatState.WAITING:
        fillColor = '#8B5CF6'; // 紫色 - 等待组队
        break;
      case ParatrooperCombatState.ALONE:
        fillColor = '#F59E0B'; // 橙色 - 单独行动
        break;
    }

    // 绘制形状
    this.ctx.fillStyle = fillColor;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = combatState === ParatrooperCombatState.LEADING ? 2 : 1;

    const size = combatState === ParatrooperCombatState.LEADING ? 8 : 6;

    switch (shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 头兵额外的外边框
        if (combatState === ParatrooperCombatState.LEADING) {
          this.ctx.strokeStyle = '#065F46'; // 深绿色边框
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, size + 1, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        break;
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(-size, size);
        this.ctx.lineTo(size, size);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 头兵额外的外边框
        if (combatState === ParatrooperCombatState.LEADING) {
          this.ctx.strokeStyle = '#065F46'; // 深绿色边框
          this.ctx.lineWidth = 3;
          const outerSize = size + 1;
          this.ctx.beginPath();
          this.ctx.moveTo(0, -outerSize);
          this.ctx.lineTo(-outerSize, outerSize);
          this.ctx.lineTo(outerSize, outerSize);
          this.ctx.closePath();
          this.ctx.stroke();
        }
        break;
      case 'square':
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        this.ctx.strokeRect(-size, -size, size * 2, size * 2);
        
        // 头兵额外的外边框
        if (combatState === ParatrooperCombatState.LEADING) {
          this.ctx.strokeStyle = '#065F46'; // 深绿色边框
          this.ctx.lineWidth = 3;
          const outerSize = size + 1;
          this.ctx.strokeRect(-outerSize, -outerSize, outerSize * 2, outerSize * 2);
        }
        break;
    }

    this.ctx.restore();
  }

  private drawTeamConnections(): void {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    
    for (const team of this.teams.values()) {
      const leader = this.paratroopers.get(team.leaderId);
      if (!leader) continue;

      for (const memberId of team.members) {
        if (memberId === team.leaderId) continue;
        
        const member = this.paratroopers.get(memberId);
        if (!member || member.combatState !== ParatrooperCombatState.FOLLOWING) continue;

        this.ctx.beginPath();
        this.ctx.moveTo(leader.position.x, leader.position.y);
        this.ctx.lineTo(member.position.x, member.position.y);
        this.ctx.stroke();
      }
    }
  }

  private drawInfo(): void {
    const states = {
      falling: 0,
      landed: 0,
      leading: 0,
      following: 0,
      alone: 0
    };
    
    for (const paratrooper of this.paratroopers.values()) {
      // 统计物理状态
      if (paratrooper.physicalState === ParatrooperPhysicalState.FALLING) {
        states.falling++;
      } else if (paratrooper.physicalState === ParatrooperPhysicalState.LANDED) {
        states.landed++;
        
        // 统计作战状态（仅对已着陆的伞兵）
        switch (paratrooper.combatState) {
          case ParatrooperCombatState.WAITING: break; // 等待状态不单独显示
          case ParatrooperCombatState.LEADING: states.leading++; break;
          case ParatrooperCombatState.FOLLOWING: states.following++; break;
          case ParatrooperCombatState.ALONE: states.alone++; break;
        }
      }
    }

    // 使用更清晰的字体设置
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 14px "Monaco", "Menlo", "Ubuntu Mono", monospace';
    this.ctx.textBaseline = 'top';
    let y = 30;
    
    this.ctx.fillText(`时间: ${this.currentTime.toFixed(1)}s`, 10, y);
    y += 20;
    this.ctx.fillText(`降落中: ${states.falling}`, 10, y);
    y += 20;
    this.ctx.fillText(`已着陆: ${states.landed}`, 10, y);
    y += 20;
    this.ctx.fillText(`头兵: ${states.leading}`, 10, y);
    y += 20;
    this.ctx.fillText(`跟随: ${states.following}`, 10, y);
    y += 20;
    this.ctx.fillText(`单独: ${states.alone}`, 10, y);
    y += 20;
    this.ctx.fillText(`队伍数: ${this.teams.size}`, 10, y);
  }

  public start(): void {
    if (this.animationId) return; // 如果已经在运行，直接返回
    
    let lastTime = performance.now(); // 使用performance.now()获取更精确的时间
    
    const animate = (currentTime: number) => {
      if (!this.animationId) return; // 检查是否被停止
      
      const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
      lastTime = currentTime;

      this.currentTime += deltaTime; // 不要重置currentTime，让它继续累加
      
      // 检查相遇
      this.checkMeetings();
      
      // 更新伞兵
      this.updateParatroopers(deltaTime);
      
      // 渲染
      this.render();
      
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public isRunning(): boolean {
    return this.animationId !== null;
  }

  public reset(): void {
    this.stop();
    this.currentTime = 0; // 重置时间
    this.paratroopers.clear();
    this.teams.clear();
    this.initializeParatroopers(); // 重新生成新的伞兵
    this.render(); // 立即渲染重置后的状态
    console.log('Reset完成，重新生成了', this.paratroopers.size, '个伞兵');
  }
}