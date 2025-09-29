'use client';

import { useEffect, useRef, useState } from 'react';
import { ParatrooperSimulation } from '../lib/ParatrooperSimulation';
import { ParatrooperConfig } from '../types/paratrooper';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<ParatrooperSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<ParatrooperConfig>({
    A: 150,    // 伞兵数量
    X: 50,     // 区域左上角X
    Y: 50,     // 区域左上角Y  
    W: 700,    // 区域宽度
    H: 500,    // 区域高度
    Z: 80,     // 相遇距离阈值
    z: 30,     // 队伍间距
    V_a: 50    // 最大速度
  });

  // 初始化Canvas和模拟实例
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 600;
      simulationRef.current = new ParatrooperSimulation(canvasRef.current, config);
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理配置变化
  useEffect(() => {
    if (simulationRef.current && canvasRef.current) {
      simulationRef.current.stop();
      simulationRef.current = new ParatrooperSimulation(canvasRef.current, config);
      setIsRunning(false);
      console.log('配置变化，重新创建模拟实例');
    }
  }, [config]);

  const handleStart = () => {
    if (simulationRef.current && !isRunning) {
      simulationRef.current.start();
      setIsRunning(true);
      console.log('模拟已启动');
    }
  };

  const handleStop = () => {
    if (simulationRef.current && isRunning) {
      simulationRef.current.stop();
      setIsRunning(false);
      console.log('模拟已停止');
    }
  };

  const handleReset = () => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current.reset();
      setIsRunning(false);
      console.log('模拟已重置');
    }
  };

  const handleConfigChange = (key: keyof ParatrooperConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    
    // 验证约束条件
    if (key === 'Z' && value >= Math.min(newConfig.W, newConfig.H)) {
      alert(`Z必须小于min(W,H) = ${Math.min(newConfig.W, newConfig.H)}`);
      return;
    }
    if (key === 'z' && value >= newConfig.Z) {
      alert(`z必须小于Z = ${newConfig.Z}`);
      return;
    }
    if (key === 'A' && value <= 100) {
      alert('A必须大于100');
      return;
    }

    setConfig(newConfig);
    
    // 更新模拟
    if (simulationRef.current && canvasRef.current) {
      simulationRef.current.stop();
      simulationRef.current = new ParatrooperSimulation(canvasRef.current, newConfig);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🪂 军事演习伞兵模拟系统
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 控制面板 */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">控制面板</h2>
            
            {/* 控制按钮 */}
            <div className="mb-6">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStart}
                  disabled={isRunning}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                >
                  开始模拟
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                >
                  停止模拟
                </button>
                <button
                  onClick={handleReset}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  重置模拟
                </button>
              </div>
              
              {/* 状态显示 */}
              <div className="mt-4 p-2 bg-gray-100 rounded">
                <div className="text-sm text-gray-600">
                  状态: {isRunning ? '运行中' : '已停止'}
                </div>
              </div>
            </div>

            {/* 参数设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-600">参数设置</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  伞兵数量 (A) : {config.A}
                </label>
                <input
                  type="range"
                  min="101"
                  max="300"
                  value={config.A}
                  onChange={(e) => handleConfigChange('A', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域宽度 (W) : {config.W}
                </label>
                <input
                  type="range"
                  min="400"
                  max="800"
                  value={config.W}
                  onChange={(e) => handleConfigChange('W', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域高度 (H) : {config.H}
                </label>
                <input
                  type="range"
                  min="400"
                  max="600"
                  value={config.H}
                  onChange={(e) => handleConfigChange('H', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  相遇距离 (Z) : {config.Z}
                </label>
                <input
                  type="range"
                  min="30"
                  max={Math.min(config.W, config.H) - 1}
                  value={config.Z}
                  onChange={(e) => handleConfigChange('Z', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  队伍间距 (z) : {config.z}
                </label>
                <input
                  type="range"
                  min="10"
                  max={config.Z - 1}
                  value={config.z}
                  onChange={(e) => handleConfigChange('z', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大速度 (V_a) : {config.V_a}
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={config.V_a}
                  onChange={(e) => handleConfigChange('V_a', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* 说明 */}
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-3">图例说明</h4>
              
              {/* 物理状态 */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-2">物理状态</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full opacity-40"></div>
                    <span>降落中</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>已着陆</span>
                  </div>
                </div>
              </div>

              {/* 作战状态 */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-2">作战状态</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-800"></div>
                    <span>头兵(较大+深绿边框)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>跟随者</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>等待组队</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>单独行动</span>
                  </div>
                </div>
              </div>

              {/* 形状说明 */}
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">形状类型</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>圆形伞兵</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[10px] border-b-gray-400 border-r-[6px] border-r-transparent"></div>
                    <span>三角形伞兵</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400"></div>
                    <span>方形伞兵</span>
                  </div>
                </div>
              </div>
              
              {/* 队伍连线 */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-[1px] bg-gray-300"></div>
                    <span>队伍连线</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 模拟画布 */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-4">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>模拟规则：</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>伞兵随机时间降落到矩形区域内</li>
                <li>着陆后等待2秒寻找距离小于Z的队友</li>
                <li>最早着陆的伞兵成为头兵，其他加入队伍</li>
                <li>跟随者保持与头兵z到Z的距离，超出Z会脱离</li>
                <li>所有伞兵保持最小间距z，避免拥挤</li>
                <li>头兵享有&ldquo;个人空间&rdquo;，不受间距力影响</li>
                <li>等待超时的伞兵开始单独行动</li>
                <li>不同颜色和形状代表不同的伞兵个体</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}