"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { RoomModel, WorkflowItem } from "@/src/core/types";

type Props = { items: WorkflowItem[]; room?: RoomModel; selectedId: string | null; onSelect: (id: string) => void };
type Hit = { id: string; x: number; y: number; radius: number };

export default function Installation3DViewer({ items, room, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hits = useRef<Hit[]>([]);
  const camera = useRef({ yaw: -0.45, pitch: 0.52, zoom: 1 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [cameraState, setCameraState] = useState({ yaw: -0.45, pitch: 0.52, zoom: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: true, alpha: false });
    if (!canvas || !gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, "attribute vec3 position; attribute vec3 color; uniform mat4 matrix; varying vec3 vColor; void main(){gl_Position=matrix*vec4(position,1.0);vColor=color;}");
    const fragment = compile(gl.FRAGMENT_SHADER, "precision mediump float; varying vec3 vColor; void main(){gl_FragColor=vec4(vColor,1.0);}");
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const positions: number[] = []; const colors: number[] = [];
    const addBox = (cx: number, cy: number, cz: number, width: number, height: number, depth: number, color: [number, number, number]) => {
      const p = [[-width / 2, 0, -depth / 2], [width / 2, 0, -depth / 2], [width / 2, 0, depth / 2], [-width / 2, 0, depth / 2], [-width / 2, height, -depth / 2], [width / 2, height, -depth / 2], [width / 2, height, depth / 2], [-width / 2, height, depth / 2]].map(([x, y, z]) => [cx + x, cy + y, cz + z]);
      [[0, 1, 2, 0, 2, 3], [4, 6, 5, 4, 7, 6], [0, 4, 5, 0, 5, 1], [1, 5, 6, 1, 6, 2], [2, 6, 7, 2, 7, 3], [4, 0, 3, 4, 3, 7]].flat().forEach((index) => { positions.push(...p[index]); colors.push(...color); });
    };
    const colorOf = (item: WorkflowItem): [number, number, number] => item.id === selectedId ? [0.1, 0.8, 1] : item.status === "completed" ? [0.1, 0.72, 0.34] : item.status === "problem" ? [0.9, 0.16, 0.18] : [0.94, 0.58, 0.08];
    addBox(0, -0.1, 0, 4.8, 0.08, 3.5, [0.07, 0.1, 0.16]);
    addBox(0, 0, -1.75, 4.8, 2.5, 0.08, [0.16, 0.27, 0.4]);
    addBox(-2.4, 0, 0, 0.08, 2.5, 3.5, [0.16, 0.27, 0.4]);
    const centers = items.map((_, index) => { const angle = items.length < 2 ? 0 : -2.4 + index * (4.8 / (items.length - 1)); return { x: Math.sin(angle) * 1.65, z: Math.cos(angle) * 0.82 - 0.2 }; });
    items.forEach((item, index) => { const c = centers[index]; addBox(c.x, 0, c.z, 0.76, 1.35, 0.62, colorOf(item)); addBox(c.x, 0.12, c.z - 0.33, 0.6, 1.1, 0.04, item.id === selectedId ? [0.75, 0.95, 1] : [0.22, 0.32, 0.44]); });
    if (room && !room.ceilingHidden) addBox(0, 2.48, 0, 4.8, 0.06, 3.5, [0.12, 0.18, 0.26]);
    const positionBuffer = gl.createBuffer(); const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(positionLocation); gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const colorLocation = gl.getAttribLocation(program, "color"); gl.enableVertexAttribArray(colorLocation); gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    const matrixLocation = gl.getUniformLocation(program, "matrix");
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const width = Math.max(1, Math.round(canvas.clientWidth * dpr)); const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const aspect = width / Math.max(height, 1); const f = 1.5; const yaw = camera.current.yaw; const pitch = camera.current.pitch; const distance = 5 / camera.current.zoom; const cy = Math.cos(yaw); const sy = Math.sin(yaw); const cp = Math.cos(pitch); const sp = Math.sin(pitch);
      const projection = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, -1.02, -1, 0, 0, -0.202, 0]; const view = [cy, sy * sp, -sy * cp, 0, 0, cp, sp, 0, sy, -cy * sp, cy * cp, 0, 0, 0, -distance, 1]; const matrix = new Array(16).fill(0); for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) for (let k = 0; k < 4; k += 1) matrix[column * 4 + row] += projection[k * 4 + row] * view[column * 4 + k];
      gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(matrix)); gl.viewport(0, 0, width, height); gl.clearColor(0.035, 0.055, 0.09, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
      hits.current = centers.map((center, index) => { const x = center.x * cy - center.z * sy; const z = center.x * sy + center.z * cy; const y = 0.68 * cp - z * sp; const depth = 0.68 * sp + z * cp - distance; const scale = f / -depth; return { id: items[index].id, x: width / 2 + x * scale * height / 2, y: height / 2 - y * scale * height / 2, radius: 48 }; });
    };
    const resizeObserver = new ResizeObserver(render); resizeObserver.observe(canvas); render();
    return () => { resizeObserver.disconnect(); gl.deleteBuffer(positionBuffer); gl.deleteBuffer(colorBuffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); };
  }, [items, room, selectedId, cameraState]);

  const updateCamera = (next: typeof camera.current) => { camera.current = next; setCameraState(next); };
  return <div className="installation-3d-viewer"><canvas ref={canvasRef} className="installation-3d-canvas" aria-label="مدل سه‌بعدی تعاملی کابینت‌ها" onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!drag.current) return; const dx = event.clientX - drag.current.x; const dy = event.clientY - drag.current.y; drag.current.moved ||= Math.abs(dx) + Math.abs(dy) > 5; updateCamera({ ...camera.current, yaw: camera.current.yaw + dx * 0.01, pitch: Math.max(-0.15, Math.min(1.1, camera.current.pitch + dy * 0.008)) }); drag.current.x = event.clientX; drag.current.y = event.clientY; }} onPointerUp={(event) => { const currentDrag = drag.current; if (currentDrag && !currentDrag.moved) { const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) * (event.currentTarget.width / rect.width); const y = (event.clientY - rect.top) * (event.currentTarget.height / rect.height); const hit = hits.current.find((candidate) => Math.hypot(candidate.x - x, candidate.y - y) < candidate.radius); if (hit) onSelect(hit.id); } drag.current = null; }} onWheel={(event) => { event.preventDefault(); updateCamera({ ...camera.current, zoom: Math.max(0.65, Math.min(1.8, camera.current.zoom - event.deltaY * 0.001)) }); }} /><div className="installation-3d-toolbar"><Button size="sm" variant="outline" onClick={() => updateCamera({ ...camera.current, yaw: camera.current.yaw - 0.2 })}>چرخش چپ</Button><Button size="sm" variant="outline" onClick={() => updateCamera({ ...camera.current, yaw: camera.current.yaw + 0.2 })}>چرخش راست</Button><Button size="sm" variant="outline" aria-label="بزرگ‌نمایی" onClick={() => updateCamera({ ...camera.current, zoom: Math.min(1.8, camera.current.zoom + 0.15) })}><ZoomIn aria-hidden="true" /></Button><Button size="sm" variant="outline" aria-label="کوچک‌نمایی" onClick={() => updateCamera({ ...camera.current, zoom: Math.max(0.65, camera.current.zoom - 0.15) })}><ZoomOut aria-hidden="true" /></Button><Button size="sm" variant="ghost" aria-label="بازنشانی" onClick={() => updateCamera({ yaw: -0.45, pitch: 0.52, zoom: 1 })}><RotateCcw aria-hidden="true" /></Button></div><p className="installation-3d-help">برای چرخش بکشید، اسکرول کنید یا روی هر کابینت کلیک کنید.</p></div>;
}
