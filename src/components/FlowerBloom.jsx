/* eslint-disable react/no-unknown-property */
import { useRef, useMemo, Suspense, useEffect, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";

// ============ ErrorBoundary：攔截 3D 模型載入 / 渲染的任何錯誤 ============
class ModelErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.warn('[FlowerBloom] 3D model error:', err?.message ?? err); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
import * as THREE from "three";

// Draco decoder 統一指向本地（與 main.jsx 一致）
useGLTF.setDecoderPath('/draco/')

// 固定相機比例組件 - 防止 3D 內容被拉伸
function FixedAspectCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    // 強制使用 1:1 的相機比例，不管容器實際大小
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}
import { getFlowerConfig } from "../data/flowerConfigs";
import { getDrawQueue } from "../utils/fortuneHelper";

// ============ 模型路徑對照表 ============
const MODEL_PATHS = {
  sunflower: "/models/sunflower/sunflower.glb",
  rose: "/models/rose/rose.glb",
  sakura: "/models/sakura/sakura.glb",
  lavender: "/models/lavender/lavender.glb",
  jasmine: "/models/jasmine/jasmine.glb",
  lotus: "/models/lotus/lotus.glb",
  tulip: "/models/tulip/tulip.glb",
  bellflower: "/models/bellflower/bellflower.glb",
  violet: "/models/violet/violet.glb",
  lily: "/models/lily/lily.glb",
  chrysanthemum: "/models/chrysanthemum/chrysanthemum.glb",
  peony: "/models/peony/peony.glb",
  hydrangea: "/models/hydrangea/hydrangea.glb",
  magnolia: "/models/magnolia/magnolia.glb",
  phoenix_flower: "/models/phoenix_flower/phoenix_flower.glb",
  epiphyllum: "/models/epiphyllum/epiphyllum.glb",
  red_spider_lily: "/models/red_spider_lily/red_spider_lily.glb",
  corn_poppy: "/models/corn_poppy/corn_poppy.glb",
  blue_rose: "/models/blue_rose/blue_rose.glb",
};

// ============ 背景預載入所有模型 ============

// 供展覽模式：依 pool 預載對應花朵的模型
export const preloadModelsForFlowers = (flowers) => {
  flowers.forEach((flower) => {
    const modelPath = MODEL_PATHS[flower.model];
    if (!modelPath) return;
    const useDraco = flower3DConfigs[flower.model]?.useDraco !== false;
    useGLTF.preload(modelPath, useDraco);
  });
};

// main.jsx 已載入第一個模型，這裡繼續載入剩餘的
const preloadAllModels = () => {
  const queue = getDrawQueue();
  const loadedModels = new Set();

  // 按抽籤順序載入模型
  queue.forEach((flower) => {
    const modelPath = MODEL_PATHS[flower.model];
    if (modelPath && !loadedModels.has(modelPath)) {
      const modelConfig = flower3DConfigs[flower.model];
      const useDraco = modelConfig?.useDraco !== false;
      useGLTF.preload(modelPath, useDraco);
      loadedModels.add(modelPath);
    }
  });

  // 載入其他還沒載入的模型
  Object.entries(MODEL_PATHS).forEach(([modelName, path]) => {
    if (!loadedModels.has(path)) {
      const modelConfig = flower3DConfigs[modelName];
      const useDraco = modelConfig?.useDraco !== false;
      useGLTF.preload(path, useDraco);
    }
  });
};

// 延遲執行其他模型的預載入
// main.jsx 已負責第一個模型（fetch 進度條 + THREE.Cache + useGLTF.preload）
// 這裡等 1.5 秒後再開始其他模型，避免搶佔第一個模型的頻寬
setTimeout(preloadAllModels, 1500);


// ============ 花形 Skeleton Loading（參考花朵圖示：5圓瓣＋花心洞＋粗莖＋對稱葉） ============
const FlowerSkeleton = () => {
  const petalMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8875bb",
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
    []
  );

  // 花心：較深色模擬「圓洞」效果
  const holeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1e1230",
        transparent: true,
        opacity: 0.5,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const p = Math.sin(t * 1.5) * 0.07;
    petalMat.opacity = 0.15 + p;
    holeMat.opacity = 0.42 + p * 0.4;
  });

  // 葉子形狀：水滴形，尖端在 [0,0]，圓端延伸至 +Y
  // 旋轉後尖端貼莖，圓端朝外
  const leafGeom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(-0.055, 0.06, -0.17, 0.15, -0.15, 0.27);
    s.bezierCurveTo(-0.13, 0.37, -0.055, 0.42, 0, 0.43);
    s.bezierCurveTo(0.055, 0.42, 0.13, 0.37, 0.15, 0.27);
    s.bezierCurveTo(0.17, 0.15, 0.055, 0.06, 0, 0);
    return new THREE.ShapeGeometry(s, 14);
  }, []);

  // 5 顆球形花瓣排成五邊形，從正上方開始
  // 花瓣球半徑 0.135，環半徑 0.19 → 相鄰花瓣相切產生「泡泡圓瓣」效果
  const petalPositions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return [Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0];
      }),
    []
  );

  return (
    <group position={[0, 0.4, 0]}>
      {/* 5 顆圓形花瓣 */}
      {petalPositions.map((pos, i) => (
        <mesh key={i} position={pos} material={petalMat}>
          <sphereGeometry args={[0.135, 10, 10]} />
        </mesh>
      ))}

      {/* 花心圓洞（浮在花瓣前方） */}
      <mesh position={[0, 0, 0.06]} material={holeMat}>
        <circleGeometry args={[0.085, 16]} />
      </mesh>

      {/* 粗直花莖 */}
      <mesh position={[0, -0.56, 0]} material={petalMat}>
        <cylinderGeometry args={[0.042, 0.042, 1.02, 8]} />
      </mesh>

      {/* 左葉：尖端貼莖，圓端朝左下（旋轉 126° CCW → +Y 指向 216°，即左下方） */}
      <mesh
        position={[-0.02, -0.3, 0]}
        rotation={[0, 0, 2.2]}
        geometry={leafGeom}
        material={petalMat}
      />

      {/* 右葉：尖端貼莖，圓端朝右下（旋轉 126° CW → +Y 指向 324°，即右下方） */}
      <mesh
        position={[0.02, -0.3, 0]}
        rotation={[0, 0, -2.2]}
        geometry={leafGeom}
        material={petalMat}
      />
    </group>
  );
};

// ============ 3D 模型配置 ============
//
// 【參數說明】
// ┌─────────────────┬────────────────────────────────────────────────────────┐
// │ 參數名稱         │ 說明                                                    │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ type            │ 模型格式：'glb'、'fbx' 或 'obj'                          │
// │ glb / fbx / obj / mtl │ 模型檔案路徑                                      │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ scale           │ 縮放比例，數字越大模型越大                               │
// │ position        │ [X, Y, Z] 位置偏移，Y負值=往下移                         │
// │ rotation        │ [X軸, Y軸, Z軸] 旋轉角度（弧度），Z負值=順時針傾斜        │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ modelOffset     │ [X, Y, Z] 模型中心偏移，用於調整旋轉軸心位置              │
// │                 │ X負值=模型往左移（旋轉中心往右）                          │
// │ autoRotateSpeed │ 自動旋轉速度，0=停止旋轉，數字越大轉越快                  │
// │ showPivotGuide  │ true=顯示旋轉中心輔助線（紅:水平 綠:垂直 黃:旋轉圓）      │
// │ pivotHeight     │ 水平旋轉面的高度（Y軸位置），正值=往上，負值=往下          │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ lightIntensity  │ 亮度倍率，預設 1.0，數字越小越暗（0.5=減半）             │
// │ forceOpaque     │ true=強制不透明，解決模型透明度過高問題                   │
// │ flowerColor     │ 花的顏色（十六進位色碼），會覆蓋模型中的白色/淺色材質      │
// │ overrideAllColors│ true=強制覆蓋所有花朵顏色（不只白色），需配合flowerColor    │
// │ stemColor       │ 莖的顏色（十六進位色碼），會覆蓋模型中的棕色材質           │
// │ filterMeshes    │ 要隱藏的 mesh 名稱陣列，例如 ['cube', 'plane']           │
// ├─────────────────┼────────────────────────────────────────────────────────┤
// │ clipThreshold   │ (OBJ專用) 裁切閾值，用於移除模型底部                     │
// │ clipAxis        │ (OBJ專用) 裁切軸：'x', 'y', 或 'z'                       │
// │ clipDirection   │ (OBJ專用) 裁切方向：'>' 保留大於閾值的部分               │
// └─────────────────┴────────────────────────────────────────────────────────┘
//
const flower3DConfigs = {
  // 向日葵 - GLB 模型
  sunflower: {
    type: "glb",
    glb: "/models/sunflower/sunflower.glb",
    useDraco: false,
    scale: 0.04,
    position: [-0.1, 0.2, 0.1],
    rotation: [0.3, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
  },

  // 玫瑰 - GLB 格式模型
  rose: {
    type: "glb",
    glb: "/models/rose/rose.glb",
    scale: 1.5, // 放大 1.5 倍
    position: [0, -0.5, 0], // 往下移 0.5 單位
    rotation: [0, 0, 0], // 不旋轉
    autoRotateSpeed: 0, // 不自動旋轉
  },

  // 櫻花 - GLB 格式模型（樹枝造型）
  sakura: {
    type: "glb",
    glb: "/models/sakura/sakura.glb",
    scale: 4.5, // 放大 4.5 倍
    position: [0, -0.5, 0], // 往下移 0.5 單位
    rotation: [0, 0, -0.3], // Z軸順時針傾斜 0.3 弧度（約17度）
    modelOffset: [-0.05, 0, 0], // 模型往左移 0.05，讓樹枝中心對齊旋轉軸
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 不顯示輔助線（調整時可開啟）
  },

  // 薰衣草 - GLB 格式模型
  lavender: {
    type: "glb",
    glb: "/models/lavender/lavender.glb",
    scale: 2, // 放大 2 倍
    position: [0, 0, 0], // 不偏移
    rotation: [0, 0, 0], // 不旋轉
    modelOffset: [0, 0, 0], // 不偏移中心
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 不顯示輔助線
    flowerColor: "#9370DB", // 紫色（覆蓋原本白色的花）
  },

  // 茉莉花 - GLB 格式模型
  jasmine: {
    type: "glb",
    glb: "/models/jasmine/jasmine.glb",
    scale: 1.8, // 縮放比例
    position: [0, -0.1, 0], // 位置偏移
    rotation: [0, 0, 0.4], // 旋轉角度
    modelOffset: [0.1, 0, 0.01], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0.1, // 水平旋轉面高度（Y軸位置）
    lightIntensity: 0.05, // 亮度倍率
    forceOpaque: false, // 強制不透明
    stemColor: "#2D5A1E", // 莖的顏色（綠色）
  },

  // 蓮花 - GLB 格式模型
  lotus: {
    type: "glb",
    glb: "/models/lotus/lotus.glb",
    scale: 0.12, // 縮放比例
    position: [0, 0, 0], // 位置偏移
    rotation: [0, 0, 0.4], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線
    pivotHeight: 0, // 水平旋轉面高度
  },

  // 鬱金香 - GLB 格式模型
  tulip: {
    type: "glb",
    glb: "/models/tulip/tulip.glb",
    scale: 0.07, // 縮放比例
    position: [0, 0.07, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線
    pivotHeight: 0, // 水平旋轉面高度
  },

  // 桔梗 - GLB 格式模型
  bellflower: {
    type: "glb",
    glb: "/models/bellflower/bellflower.glb",
    scale: 0.2, // 縮放比例
    position: [0, 0, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線
    pivotHeight: 0, // 水平旋轉面高度
  },

  // 紫羅蘭 - GLB 格式模型
  violet: {
    type: "glb",
    glb: "/models/violet/violet.glb",
    scale: 12.5, // 縮放比例
    position: [0, 0.1, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線
    pivotHeight: 0, // 水平旋轉面高度
  },

  // 百合 - GLB 格式模型
  lily: {
    type: "glb",
    glb: "/models/lily/lily.glb",
    scale: 0.1, // 縮放比例
    position: [0.1, 0.5, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0, // 水平旋轉面高度
    lightIntensity: 1.5, // 亮度
  },

  // 牡丹 - GLB 格式模型
  peony: {
    type: "glb",
    glb: "/models/peony/peony.glb",
    scale: 0.47, // 縮放比例
    position: [0, 0, 0.05], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0, // 水平旋轉面高度
    lightIntensity: 1, // 亮度
  },

  // 菊花 - GLB 格式模型
  chrysanthemum: {
    type: "glb",
    glb: "/models/chrysanthemum/chrysanthemum.glb",
    scale: 8.5, // 縮放比例
    position: [0, 0.15, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0, // 水平旋轉面高度
    lightIntensity: 1, // 亮度
  },


  // 繡球花 - GLB 格式模型
  // 模型內含兩組 mesh：
  //   大型 (worldSpread ~3.5, scale=1.0) → 葉子/背景裝飾，× 3.7 後尺寸爆炸
  //   小型 (worldSpread ~0.35, scale=0.02) → 實際花簇，× 3.7 ≈ 1.3 scene units
  // filterByWorldSpread: 1.0 只保留花簇，排除大型背景 mesh
  hydrangea: {
    type: "glb",
    glb: "/models/hydrangea/hydrangea.glb",
    scale: 3.7,
    position: [0, -0.55, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    filterByWorldSpread: 1.0,
  },

  // 康乃馨 - GLB 格式模型
  carnation: {
    type: "glb",
    glb: "/models/carnation/carnation.glb",
    scale: -0.061, // 縮放比例
    position: [0, -0.49, 0], // 位置偏移
    rotation: [135, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0, // 水平旋轉面高度
    lightIntensity: 1, // 亮度
  },

  // 藍色妖姬 SSR - 吉祥物藍玫瑰 GLB 模型
  blue_rose: {
    type: "glb",
    glb: "/models/blue_rose/blue_rose.glb",
    scale: 0.8,
    position: [0, 0.25, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
    lightIntensity: 1,
  },

  // 虞美人 SSR - 吉祥物薰衣草 GLB 模型
  corn_poppy: {
    type: "glb",
    glb: "/models/corn_poppy/corn_poppy.glb",
    scale: 0.83,
    position: [0, 0.34, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
    lightIntensity: 1,
  },

  // 彼岸花 SSR - 吉祥物紅花 GLB 模型
  red_spider_lily: {
    type: "glb",
    glb: "/models/red_spider_lily/red_spider_lily.glb",
    scale: 0.85,
    position: [0, 0.37, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
    lightIntensity: 1,
  },

  // 百合花 SSR - 吉祥物 GLB 模型
  epiphyllum: {
    type: "glb",
    glb: "/models/epiphyllum/epiphyllum.glb",
    scale: 0.8,
    position: [0, 0.35, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
    lightIntensity: 1,
  },

  // 鳳凰花 SSR - 鹽夏主視覺向日葵 GLB 模型
  phoenix_flower: {
    type: "glb",
    glb: "/models/phoenix_flower/phoenix_flower.glb",
    scale: 0.8,
    position: [0, 0.2, 0],
    rotation: [0, 0, 0],
    modelOffset: [0, 0, 0],
    autoRotateSpeed: 0,
    showPivotGuide: false,
    lightIntensity: 1,
  },

  // 玉蘭花 - GLB 格式模型
  magnolia: {
    type: "glb",
    glb: "/models/magnolia/magnolia.glb",
    scale: 1.9, // 縮放比例
    position: [0, 0, 0], // 位置偏移
    rotation: [0, 0, 0], // 旋轉角度
    modelOffset: [0, 0, 0], // 模型中心偏移
    autoRotateSpeed: 0, // 不自動旋轉
    showPivotGuide: false, // 顯示輔助線方便調整
    pivotHeight: 0, // 水平旋轉面高度
    lightIntensity: 1, // 亮度
  },
};

// ============ GLB 模型載入組件 ============
const FlowerGLBModel = ({ modelType }) => {
  const groupRef = useRef();
  const config = flower3DConfigs[modelType];
  // useDraco：預設 true，明確設 false 跳過 Draco decoder
  const { scene } = useGLTF(config.glb, config.useDraco !== false);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // ── 關鍵：scene.clone(true) 只做淺複製，BufferGeometry 仍是共用參考。
    // 若後續修改 geometry（如 setIndex），會直接污染 useGLTF cache 裡的原始場景。
    // 先把每個 mesh 的 geometry 獨立深複製，確保 cache 永遠不受影響。
    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry = child.geometry.clone();
      }
    });

    const toRemove = [];

    // filterByWorldSpread / filterFlatPlane 都需要 world matrix
    clone.updateWorldMatrix(true, true);

    clone.traverse((child) => {
      if (child.isMesh) {
        // 過濾指定的 mesh（如正方體）
        const filterList = config.filterMeshes || [];
        const shouldFilter = filterList.some((name) =>
          child.name.toLowerCase().includes(name.toLowerCase())
        );

        // 過濾 world space 中超過閾值的巨型 mesh
        // 用途：模型內有些 mesh 在 GLB 座標系中就是巨大的（如葉子底座、環境裝飾），
        // 套用場景 scale 後尺寸爆炸，filterByWorldSpread 可精準排除它們
        let isTooLarge = false;
        if (config.filterByWorldSpread !== undefined) {
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
          const spread = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
          isTooLarge = spread > config.filterByWorldSpread;
        }

        // 自動過濾超扁平巨型 mesh（地面平面 / 陰影平面）
        let isFlatPlane = false;
        if (config.filterFlatPlane) {
          child.geometry.computeBoundingBox();
          const rawBox = child.geometry.boundingBox;
          if (rawBox) {
            const box = rawBox.clone().applyMatrix4(child.matrixWorld);
            const dx = box.max.x - box.min.x;
            const dy = box.max.y - box.min.y;
            const dz = box.max.z - box.min.z;
            const spread = Math.max(dx, dz);
            const ratio = config.filterFlatPlaneRatio ?? 0.05;
            isFlatPlane = spread > 1.0 && dy < spread * ratio;
          }
        }

        if (shouldFilter || isTooLarge || isFlatPlane) {
          toRemove.push(child);
        } else {
          child.castShadow = true;
          child.receiveShadow = true;
          // 處理材質（可能是單一材質或材質陣列）
          const isArray = Array.isArray(child.material);
          const materials = isArray ? child.material : [child.material];
          const processedMats = materials.map((mat) => {
            if (!mat) return mat;
            const clonedMat = mat.clone();
            // 透明材質不套用 DoubleSide：
            // 雙面渲染讓背面與正面 z-fighting，導致透明 mesh 顯示放大的反轉輪廓
            const isTransparent =
              (clonedMat.transparent && clonedMat.opacity < 1.0) ||
              clonedMat.alphaTest > 0 ||
              !!clonedMat.alphaMap;
            if (!isTransparent && !config.skipDoubleSide) {
              clonedMat.side = THREE.DoubleSide;
            }
            clonedMat.needsUpdate = true;

            // 強制不透明（解決透明度過高問題）
            if (config.forceOpaque) {
              clonedMat.transparent = false;
              clonedMat.opacity = 1.0;
              clonedMat.alphaTest = 0;
              clonedMat.depthWrite = true;
              clonedMat.alphaMap = null;
              clonedMat.alphaToCoverage = false;
              if (clonedMat.blending !== undefined) {
                clonedMat.blending = THREE.NormalBlending;
              }
            }

            // 如果設定了花的顏色，覆蓋白色/淺色材質（或強制覆蓋所有非莖顏色）
            if (config.flowerColor && clonedMat.color) {
              const color = clonedMat.color;
              // 檢測是否為莖（棕色/綠色系）- 這些不要被 flowerColor 覆蓋
              const isStem =
                (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                (color.r > 0.3 && color.g < 0.4 && color.b < 0.3) ||
                (color.g > color.r && color.g > color.b); // 綠色

              if (config.overrideAllColors) {
                // 強制覆蓋所有顏色（除了莖）
                if (!isStem) {
                  clonedMat.color.set(config.flowerColor);
                }
              } else {
                // 只覆蓋白色/淺色材質
                if (color.r > 0.8 && color.g > 0.8 && color.b > 0.8) {
                  clonedMat.color.set(config.flowerColor);
                }
              }
            }

            // 如果設定了莖的顏色，覆蓋棕色/深色材質
            if (config.stemColor && clonedMat.color) {
              const color = clonedMat.color;
              // 檢測棕色系（R > G > B 且整體偏暗）
              const isBrown =
                (color.r > color.g && color.g > color.b && color.r < 0.7) ||
                (color.r > 0.3 && color.g < 0.4 && color.b < 0.3);
              if (isBrown) {
                clonedMat.color.set(config.stemColor);
              }
            }

            return clonedMat;
          });
          // 如果原本是單一材質，還原為單一材質
          child.material = isArray ? processedMats : processedMats[0];
        }
      }
    });

    // 移除被過濾的 mesh
    toRemove.forEach((obj) => obj.parent?.remove(obj));

    // 幾何裁切（與 FlowerOBJModel 相同邏輯，支援 GLB）
    const { clipThreshold, clipAxis, clipDirection } = config;
    if (clipThreshold !== undefined && clipAxis && clipDirection) {
      clone.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        const geo = child.geometry;
        const pos = geo.attributes.position;
        if (!pos) return;

        const getVal = (i, axis) => {
          if (axis === 'x') return pos.getX(i);
          if (axis === 'y') return pos.getY(i);
          return pos.getZ(i);
        };
        const keep = (v) => clipDirection === '>' ? v > clipThreshold : v < clipThreshold;

        if (geo.index) {
          const idx = Array.from(geo.index.array);
          const newIdx = [];
          for (let i = 0; i < idx.length; i += 3) {
            if (keep(getVal(idx[i], clipAxis)) &&
                keep(getVal(idx[i + 1], clipAxis)) &&
                keep(getVal(idx[i + 2], clipAxis))) {
              newIdx.push(idx[i], idx[i + 1], idx[i + 2]);
            }
          }
          geo.setIndex(newIdx);
        }
      });
    }

    return clone;
  }, [
    scene,
    config.filterMeshes,
    config.flowerColor,
    config.forceOpaque,
    config.stemColor,
    config.overrideAllColors,
    config.clipThreshold,
    config.clipAxis,
    config.clipDirection,
  ]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        state.clock.getElapsedTime() * (config.autoRotateSpeed || 0.15);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 旋轉中心輔助線 */}
      {config.showPivotGuide && (
        <>
          {/* 水平線（紅色）- 可用 pivotHeight 調整高度 */}
          <mesh position={[0, config.pivotHeight || 0, 0]}>
            <boxGeometry args={[2, 0.01, 0.01]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* 垂直線（綠色）*/}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 2, 0.01]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          {/* 旋轉軌跡圓（黃色）- 可用 pivotHeight 調整高度 */}
          <mesh
            position={[0, config.pivotHeight || 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.95, 1, 64]} />
            <meshBasicMaterial
              color="#ffff00"
              side={THREE.DoubleSide}
              transparent
              opacity={0.5}
            />
          </mesh>
        </>
      )}
      {/* 模型容器：先偏移讓樹枝對齊中心，再旋轉 */}
      <group position={config.modelOffset || [0, 0, 0]}>
        <group
          scale={config.scale}
          rotation={config.rotation || [0, 0, 0]}
          position={config.position}
        >
          <primitive object={clonedScene} />
        </group>
      </group>
      {/* 補光 - 可調亮度（lightIntensity: 預設 1.0，數字越小越暗）*/}
      {(() => {
        const li = config.lightIntensity ?? 1.0;
        return (
          <>
            <pointLight
              position={[0, 1, 2]}
              intensity={4 * li}
              color="#fffaf0"
            />
            <pointLight
              position={[0, 1, -2]}
              intensity={4 * li}
              color="#fff8dc"
            />
            <pointLight
              position={[2, 0.8, 0]}
              intensity={3.5 * li}
              color="#ffffff"
            />
            <pointLight
              position={[-2, 0.8, 0]}
              intensity={3.5 * li}
              color="#ffffff"
            />
            <pointLight
              position={[0, -0.5, 1.5]}
              intensity={2.5 * li}
              color="#fff5ee"
            />
            <pointLight
              position={[0, 2, 0]}
              intensity={3 * li}
              color="#ffffff"
            />
          </>
        );
      })()}
    </group>
  );
};

// ============ 統一 3D 模型分發器 ============
const Flower3DModel = ({ modelType }) => {
  const config = flower3DConfigs[modelType];
  if (!config) return null;
  return <FlowerGLBModel modelType={modelType} />;
};

// ============ 完整花朵 ============
const CompleteFlower = ({ flower, config }) => {
  const { petalType } = config;
  return (
    <ModelErrorBoundary fallback={<FlowerSkeleton />}>
      <Suspense fallback={<FlowerSkeleton />}>
        <Flower3DModel modelType={petalType} />
      </Suspense>
    </ModelErrorBoundary>
  );
};

// ============ 主組件 ============
const FlowerBloom = ({ flower }) => {
  const config = getFlowerConfig(flower.model);
  const isSSR = flower.rarity === "ssr";

  return (
    <Canvas
      camera={{ position: [0, 0.08, 2.75], fov: 38 }}
      gl={{ alpha: true, antialias: true, localClippingEnabled: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        // context lost 時呼叫 preventDefault 才能觸發後續的 restore
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
        }, false)
      }}
    >
      <FixedAspectCamera />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.85} color="#ffffff" />
      <pointLight position={[-2, 2, 2]} intensity={0.3} color="#fff5ee" />
      <pointLight position={[0, -1, 2]} intensity={0.16} color="#e8f5e9" />
      <hemisphereLight args={["#f0f8ff", "#228b22", 0.3]} />

      {isSSR && (
        <>
          <pointLight
            position={[0, 1, 0.8]}
            intensity={0.42}
            color={flower.gradientColors?.[0] || "#ffd700"}
          />
          <spotLight
            position={[0, 2.5, 1.5]}
            angle={0.32}
            penumbra={0.5}
            intensity={0.55}
            color={flower.gradientColors?.[1] || "#ffa500"}
          />
        </>
      )}

      <CompleteFlower flower={flower} config={config} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={
          flower3DConfigs[config.petalType] ? 0 : isSSR ? 0.42 : 0.3
        }
        maxPolarAngle={
          flower3DConfigs[config.petalType] ? Math.PI / 2 : Math.PI / 1.55
        }
        minPolarAngle={
          flower3DConfigs[config.petalType] ? Math.PI / 2 : Math.PI / 4.2
        }
        target={flower3DConfigs[config.petalType] ? [0, 0.4, 0] : [0, -0.1, 0]}
      />
    </Canvas>
  );
};

export default FlowerBloom;
