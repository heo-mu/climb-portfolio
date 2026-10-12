import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { InstancedMesh, PMREMGenerator, type Texture, type WebGLRenderer, type WebGLRenderTarget } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FinishEnvironment = createContext<Texture | null>(null);
export const useApplianceEnvironment = () => useContext(FinishEnvironment);

const environments = new WeakMap<WebGLRenderer, { target: WebGLRenderTarget; users: number }>();

/** Small, once-baked reflection field for the appliance materials only.
 * No downloaded HDR, live cube capture, extra scene lights or room restyling.
 * 64px cube faces are sufficient for these broad, rough satin reflections. */
export function ApplianceEnvironment({children}: {children:ReactNode}) {
  const gl = useThree(state=>state.gl);
  const [texture,setTexture] = useState<Texture | null>(null);
  useEffect(()=> {
    let environment = environments.get(gl);
    if (!environment) {
      const room = new RoomEnvironment();
      const generator = new PMREMGenerator(gl);
      const target = generator.fromScene(room,0.08,0.1,100,{size:64});
      // RoomEnvironment.dispose handles shared geometry/materials; the instance
      // matrix is a separate renderer resource owned by the instanced mesh.
      room.traverse(object => {
        if (object instanceof InstancedMesh) object.dispose();
      });
      room.dispose();
      generator.dispose();
      environment = { target, users: 0 };
      environments.set(gl, environment);
    }
    const owned = environment;
    owned.users++;
    setTexture(owned.target.texture);
    return () => {
      owned.users--;
      // StrictMode immediately re-subscribes effects; reuse the same bake.
      // A real unmount still releases the GPU target within this microtask.
      queueMicrotask(() => {
        if (owned.users === 0 && environments.get(gl) === owned) {
          owned.target.dispose();
          environments.delete(gl);
        }
      });
    };
  },[gl]);
  return <FinishEnvironment.Provider value={texture}>{children}</FinishEnvironment.Provider>;
}
