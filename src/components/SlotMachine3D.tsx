import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { SlotSymbol, SLOT_SYMBOLS, SlotGameMode } from "./NewAgeSlotMachine";
import { 
  Sparkles, 
  Rotate3d, 
  Eye, 
  Maximize2, 
  Zap, 
  Coins, 
  Flame, 
  Swords, 
  Camera, 
  Sliders
} from "lucide-react";

interface SlotMachine3DProps {
  grid: SlotSymbol[][];
  isSpinning: boolean;
  spinningReels: boolean[];
  winningLines: number[];
  isLeverPulled: boolean;
  onLeverPull?: () => void;
  activeMode: SlotGameMode;
  isFeverActive: boolean;
  wildStormActive: boolean;
  lastWinAmount: number;
  turboMode: boolean;
}

export const SlotMachine3D: React.FC<SlotMachine3DProps> = ({
  grid,
  isSpinning,
  spinningReels,
  winningLines,
  isLeverPulled,
  onLeverPull,
  activeMode,
  isFeverActive,
  wildStormActive,
  lastWinAmount,
  turboMode
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reelsRef = useRef<THREE.Mesh[]>([]);
  const leverArmRef = useRef<THREE.Group | null>(null);
  const coinParticlesRef = useRef<THREE.Points | null>(null);
  const lightningGroupRef = useRef<THREE.Group | null>(null);
  const paylineBeamsRef = useRef<THREE.Line[]>([]);
  const pointLightsRef = useRef<THREE.PointLight[]>([]);

  // Reel Animation Tracking
  const reelAngles = useRef<number[]>([0, 0, 0]);
  const targetAngles = useRef<number[]>([0, 0, 0]);
  const reelVelocities = useRef<number[]>([0, 0, 0]);
  const isReelSpinningInternal = useRef<boolean[]>([false, false, false]);

  // Camera views
  const [cameraPreset, setCameraPreset] = useState<"front" | "perspective" | "close">("perspective");
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fps, setFps] = useState<number>(60);

  // Generate high-resolution canvas texture with all 10 AWS slot symbols mapped along circumference
  const createReelTexture = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const numSymbols = SLOT_SYMBOLS.length; // 10 symbols
    const sliceHeight = canvas.height / numSymbols;

    SLOT_SYMBOLS.forEach((sym, idx) => {
      const y = idx * sliceHeight;

      // Slice background gradient
      const grad = ctx.createLinearGradient(0, y, canvas.width, y + sliceHeight);
      if (sym.category === "jackpot") {
        grad.addColorStop(0, "#b45309");
        grad.addColorStop(0.5, "#f59e0b");
        grad.addColorStop(1, "#d97706");
      } else if (sym.category === "wild") {
        grad.addColorStop(0, "#0891b2");
        grad.addColorStop(0.5, "#06b6d4");
        grad.addColorStop(1, "#0284c7");
      } else if (sym.category === "ai") {
        grad.addColorStop(0, "#6b21a8");
        grad.addColorStop(0.5, "#a855f7");
        grad.addColorStop(1, "#4c1d95");
      } else if (sym.category === "security") {
        grad.addColorStop(0, "#065f46");
        grad.addColorStop(0.5, "#10b981");
        grad.addColorStop(1, "#047857");
      } else if (sym.category === "networking") {
        grad.addColorStop(0, "#1e40af");
        grad.addColorStop(0.5, "#3b82f6");
        grad.addColorStop(1, "#1d4ed8");
      } else if (sym.category === "database") {
        grad.addColorStop(0, "#0369a1");
        grad.addColorStop(0.5, "#0ea5e9");
        grad.addColorStop(1, "#075985");
      } else if (sym.category === "storage") {
        grad.addColorStop(0, "#047857");
        grad.addColorStop(0.5, "#059669");
        grad.addColorStop(1, "#065f46");
      } else if (sym.category === "compute") {
        grad.addColorStop(0, "#c2410c");
        grad.addColorStop(0.5, "#f97316");
        grad.addColorStop(1, "#9a3412");
      } else {
        grad.addColorStop(0, "#be185d");
        grad.addColorStop(0.5, "#ec4899");
        grad.addColorStop(1, "#9d174d");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, y, canvas.width, sliceHeight);

      // Inner bevel card
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.roundRect 
        ? ctx.roundRect(16, y + 10, canvas.width - 32, sliceHeight - 20, 16) 
        : ctx.fillRect(16, y + 10, canvas.width - 32, sliceHeight - 20);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = sym.category === "jackpot" ? "#fef08a" : "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Emoji Icon
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sym.emoji, canvas.width / 2, y + sliceHeight * 0.38);

      // Symbol Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.fillText(sym.name, canvas.width / 2, y + sliceHeight * 0.68);

      // AWS Service Subtitle
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 16px monospace";
      ctx.fillText(sym.awsService, canvas.width / 2, y + sliceHeight * 0.85);

      // Divider line
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(0, y + sliceHeight - 2, canvas.width, 2);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.04);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 6.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    mainLight.position.set(4, 6, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const cyanRim = new THREE.PointLight(0x06b6d4, 2.5, 12);
    cyanRim.position.set(-3.5, 2, 2.5);
    scene.add(cyanRim);

    const amberRim = new THREE.PointLight(0xf59e0b, 2.5, 12);
    amberRim.position.set(3.5, -1, 2.5);
    scene.add(amberRim);
    pointLightsRef.current = [cyanRim, amberRim];

    // 5. Build 3D Arcade Cabinet
    // Cabinet Body Chassis
    const cabinetGeo = new THREE.BoxGeometry(4.8, 3.8, 2.2);
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.0
    });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.set(0, 0, -0.4);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    scene.add(cabinet);

    // Bezel Frame
    const bezelGeo = new THREE.BoxGeometry(4.2, 3.0, 0.4);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.9,
      roughness: 0.15
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, 0, 0.8);
    scene.add(bezel);

    // Neon Frame Accent Light
    const neonArchGeo = new THREE.TorusGeometry(2.1, 0.05, 16, 64, Math.PI);
    const neonArchMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const neonArch = new THREE.Mesh(neonArchGeo, neonArchMat);
    neonArch.position.set(0, 1.35, 0.95);
    neonArch.rotation.z = Math.PI;
    scene.add(neonArch);

    // Glass Reel Window Cover (Transparent Acrylic reflection)
    const glassGeo = new THREE.PlaneGeometry(3.6, 2.4);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0, 0.96);
    scene.add(glass);

    // 6. Build 3 Rotational Reel Cylinders
    const reelTexture = createReelTexture();
    const reelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.95, 48, 1, true);
    reelGeo.rotateZ(Math.PI / 2); // align horizontally for vertical rotation

    const reelMat = new THREE.MeshStandardMaterial({
      map: reelTexture,
      roughness: 0.35,
      metalness: 0.1,
      bumpScale: 0.02
    });

    const reels: THREE.Mesh[] = [];
    const reelSpacing = 1.15;

    for (let i = 0; i < 3; i++) {
      const reel = new THREE.Mesh(reelGeo, reelMat);
      reel.position.set((i - 1) * reelSpacing, 0, 0.4);
      reel.castShadow = true;
      scene.add(reel);
      reels.push(reel);

      // Chrome separator dividers between reels
      if (i < 2) {
        const dividerGeo = new THREE.BoxGeometry(0.08, 2.5, 0.5);
        const dividerMat = new THREE.MeshStandardMaterial({
          color: 0xd1d5db,
          metalness: 0.95,
          roughness: 0.1
        });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.set((i - 0.5) * reelSpacing, 0, 0.7);
        scene.add(divider);
      }
    }
    reelsRef.current = reels;

    // 7. Interactive 3D Pull Lever (on right side of cabinet)
    const leverGroup = new THREE.Group();
    leverGroup.position.set(2.45, -0.2, 0);

    // Pivot Base
    const pivotGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    pivotGeo.rotateZ(Math.PI / 2);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.98, roughness: 0.05 });
    const pivot = new THREE.Mesh(pivotGeo, chromeMat);
    leverGroup.add(pivot);

    // Lever Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 16);
    shaftGeo.translate(0, 0.8, 0);
    const shaft = new THREE.Mesh(shaftGeo, chromeMat);
    leverGroup.add(shaft);

    // Red/Gold Chrome Knob Sphere
    const knobGeo = new THREE.SphereGeometry(0.22, 32, 32);
    const knobMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.6,
      roughness: 0.15,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3
    });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.set(0, 1.6, 0);
    leverGroup.add(knob);

    scene.add(leverGroup);
    leverArmRef.current = leverGroup;

    // 8. 3D Particle System for Wins (Gold Coins / Starbursts)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      positions[p * 3] = (Math.random() - 0.5) * 0.5;
      positions[p * 3 + 1] = -10; // off screen initially
      positions[p * 3 + 2] = 1.0;

      velocities[p * 3] = (Math.random() - 0.5) * 3;
      velocities[p * 3 + 1] = Math.random() * 4 + 2;
      velocities[p * 3 + 2] = (Math.random() - 0.5) * 2;

      colors[p * 3] = 1.0;
      colors[p * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[p * 3 + 2] = 0.1;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    coinParticlesRef.current = particles;

    // 9. Wild Lightning Sparks Group
    const lightningGroup = new THREE.Group();
    scene.add(lightningGroup);
    lightningGroupRef.current = lightningGroup;

    // 10. Mouse Interaction for 3D Camera Tilt
    const handleMouseMove = (e: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x, y };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 11. Raycaster for clicking 3D Lever directly
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if (!mountRef.current || isSpinning) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      if (leverArmRef.current) {
        const intersects = raycaster.intersectObjects(leverArmRef.current.children, true);
        if (intersects.length > 0 && onLeverPull) {
          onLeverPull();
        }
      }
    };

    mountRef.current.addEventListener("click", handleClick);

    // 12. Animation & Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Calculate FPS
      frameCount++;
      if (time - fpsTimer > 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = time;
      }

      // Smooth Camera Parallax based on preset
      if (cameraPreset === "perspective") {
        const targetX = mousePos.current.x * 0.8;
        const targetY = 0.8 + mousePos.current.y * 0.5;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.position.z += (6.2 - camera.position.z) * 0.05;
      } else if (cameraPreset === "front") {
        camera.position.x += (0 - camera.position.x) * 0.08;
        camera.position.y += (0.4 - camera.position.y) * 0.08;
        camera.position.z += (5.4 - camera.position.z) * 0.08;
      } else {
        // Close-up
        camera.position.x += (0 - camera.position.x) * 0.08;
        camera.position.y += (0.1 - camera.position.y) * 0.08;
        camera.position.z += (4.2 - camera.position.z) * 0.08;
      }
      camera.lookAt(0, 0, 0);

      // Animate 3D Lever Pull
      if (leverArmRef.current) {
        const targetRotZ = isLeverPulled ? -0.85 : 0;
        leverArmRef.current.rotation.z += (targetRotZ - leverArmRef.current.rotation.z) * 0.25;
      }

      // Animate 3D Reels Rotation
      reelsRef.current.forEach((reel, idx) => {
        if (isReelSpinningInternal.current[idx]) {
          // High speed spin
          reelVelocities.current[idx] = turboMode ? 28 : 18;
          reelAngles.current[idx] += reelVelocities.current[idx] * delta;
        } else {
          // Decelerate and snap with elastic bounce to target angle
          const currentAngle = reelAngles.current[idx];
          const target = targetAngles.current[idx];
          const diff = target - currentAngle;
          reelAngles.current[idx] += diff * (turboMode ? 0.28 : 0.14);
        }
        reel.rotation.x = reelAngles.current[idx];
      });

      // Animate Particle Physics (Coin Explosion on Wins)
      if (coinParticlesRef.current && coinParticlesRef.current.geometry.attributes.position) {
        const posAttr = coinParticlesRef.current.geometry.attributes.position;
        const velAttr = coinParticlesRef.current.geometry.attributes.velocity;
        const pos = posAttr.array as Float32Array;
        const vel = velAttr.array as Float32Array;

        for (let p = 0; p < particleCount; p++) {
          if (pos[p * 3 + 1] > -5) {
            pos[p * 3] += vel[p * 3] * delta;
            pos[p * 3 + 1] += vel[p * 3 + 1] * delta;
            pos[p * 3 + 2] += vel[p * 3 + 2] * delta;

            // Gravity
            vel[p * 3 + 1] -= 9.8 * delta;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Emissive Pulsing on Point Lights
      if (pointLightsRef.current[0] && pointLightsRef.current[1]) {
        if (isFeverActive) {
          pointLightsRef.current[0].color.setHex(0xf43f5e);
          pointLightsRef.current[1].color.setHex(0xfbbf24);
          pointLightsRef.current[0].intensity = 3.5 + Math.sin(time * 0.01) * 1.5;
        } else if (wildStormActive) {
          pointLightsRef.current[0].color.setHex(0x22d3ee);
          pointLightsRef.current[1].color.setHex(0x60a5fa);
          pointLightsRef.current[0].intensity = 4.0 + Math.random() * 2.0;
        } else {
          pointLightsRef.current[0].color.setHex(0x06b6d4);
          pointLightsRef.current[1].color.setHex(0xf59e0b);
          pointLightsRef.current[0].intensity = 2.0;
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Observer for responsive canvas sizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(mountRef.current);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mountRef.current) {
        mountRef.current.removeEventListener("click", handleClick);
      }
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [createReelTexture, onLeverPull, cameraPreset, isFeverActive, wildStormActive, turboMode, isSpinning]);

  // Synchronize Reel Spinning State with Props
  useEffect(() => {
    isReelSpinningInternal.current = [...spinningReels];
  }, [spinningReels]);

  // When spin finishes or grid updates, compute target angles to display the center row matching React state
  useEffect(() => {
    if (isSpinning) return;

    // Angle per symbol on a 10-facet cylinder: 2*PI / 10
    const sliceRad = (Math.PI * 2) / SLOT_SYMBOLS.length;

    [0, 1, 2].forEach((col) => {
      const centerSymbol = grid[1][col];
      const symbolIdx = SLOT_SYMBOLS.findIndex((s) => s.id === centerSymbol.id);
      if (symbolIdx !== -1) {
        const currentAngle = reelAngles.current[col];
        // Calculate nearest forward landing angle that aligns with the target symbol
        const currentTurns = Math.floor(currentAngle / (Math.PI * 2));
        const targetFacet = (symbolIdx / SLOT_SYMBOLS.length) * (Math.PI * 2);
        const nextTarget = (currentTurns + 1) * Math.PI * 2 + targetFacet;
        targetAngles.current[col] = nextTarget;
      }
    });
  }, [grid, isSpinning]);

  // Trigger 3D Particle Fountain on Wins
  useEffect(() => {
    if (lastWinAmount > 0 && coinParticlesRef.current) {
      const posAttr = coinParticlesRef.current.geometry.attributes.position;
      const velAttr = coinParticlesRef.current.geometry.attributes.velocity;
      const pos = posAttr.array as Float32Array;
      const vel = velAttr.array as Float32Array;

      const particleCount = pos.length / 3;
      for (let p = 0; p < particleCount; p++) {
        pos[p * 3] = (Math.random() - 0.5) * 2.5;
        pos[p * 3 + 1] = 0;
        pos[p * 3 + 2] = 0.8 + Math.random() * 0.5;

        vel[p * 3] = (Math.random() - 0.5) * 4;
        vel[p * 3 + 1] = Math.random() * 5 + 3;
        vel[p * 3 + 2] = Math.random() * 3 + 1;
      }
      posAttr.needsUpdate = true;
      velAttr.needsUpdate = true;
    }
  }, [lastWinAmount]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 shadow-2xl">
      {/* 3D WebGL Canvas Stage */}
      <div 
        ref={mountRef} 
        className="w-full h-[380px] sm:h-[460px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Floating 3D HUD & Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        
        {/* Real-time WebGL Engine Badge */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/40 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Rotate3d className="w-3.5 h-3.5 text-[#FF9900]" /> Three.js 3D Physics
          </span>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {fps} FPS
          </span>
        </div>

        {/* Camera Preset Switcher */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
          <button
            onClick={() => setCameraPreset("perspective")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              cameraPreset === "perspective"
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Dynamic Mouse Parallax 3D Perspective"
          >
            <Camera className="w-3 h-3" /> Parallax
          </button>

          <button
            onClick={() => setCameraPreset("front")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              cameraPreset === "front"
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Arcade Frontal View"
          >
            <Eye className="w-3 h-3" /> Front
          </button>

          <button
            onClick={() => setCameraPreset("close")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              cameraPreset === "close"
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Close-Up Reel Zoom"
          >
            <Maximize2 className="w-3 h-3" /> Zoom
          </button>
        </div>

      </div>

      {/* Interactive 3D Lever Helper Prompt */}
      <div className="absolute bottom-3 right-4 pointer-events-none z-10 hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800 text-[10px] font-mono text-slate-300">
        <span className="text-amber-400 font-bold">💡 Tip:</span> Click 3D Lever or drag mouse to tilt cabinet perspective!
      </div>
    </div>
  );
};
