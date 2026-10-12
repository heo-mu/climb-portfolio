import { useEffect, useLayoutEffect, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Refrigerator3D } from './components/Refrigerator3D'
import { InstallationSpace3D } from './components/InstallationSpace3D'
import { IssueHighlights3D } from './components/IssueHighlights3D'
import { CAMERA_FOV_DEG, defaultPose, minDistanceMm, maxDistanceMm, ORBIT_MIN_POLAR_ANGLE, ORBIT_MAX_POLAR_ANGLE } from './utils/cameraPolicy'
import { mmToSceneUnit } from './utils/units'
import { focusPose } from './focusPose'
import { product, layout, report, doorAnglesDeg, subject, highlights, issueFor } from './demoScene'

type ViewerProps = { side: 'left' | 'right'; hovered: 'left' | 'right' | null; focusRequest: number; active: boolean }
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function SceneContent({ side, hovered, focusRequest }: ViewerProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const goal = useRef<ReturnType<typeof focusPose>>(null)
  const { camera, size } = useThree()
  const selected = issueFor(side)

  useLayoutEffect(() => {
    const pose = defaultPose(subject)
    const target = new THREE.Vector3(pose.targetMm.x, pose.targetMm.y, pose.targetMm.z).multiplyScalar(.001)
    const position = new THREE.Vector3(pose.positionMm.x, pose.positionMm.y, pose.positionMm.z).multiplyScalar(.001)
    position.sub(target).multiplyScalar(Math.max(1, size.height / Math.max(1, size.width))).add(target)
    camera.position.copy(position)
    controls.current?.target.copy(target)
    controls.current?.update()
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  // Explicit row activation (including the already-selected row) requests focus.
  // Hover only changes the original issue overlay's emphasis.
  useEffect(() => {
    goal.current = focusPose(selected, subject, size)
  }, [selected, focusRequest, size])

  useFrame(() => {
    const pose = goal.current
    if (!pose || !controls.current) return
    // Scene.tsx CameraRig's original easing and relative arrival tolerance.
    const lerp = reducedMotion() ? 1 : .09
    camera.position.lerp(pose.position, lerp)
    controls.current.target.lerp(pose.target, lerp)
    controls.current.update()
    const arrival = mmToSceneUnit(Math.max(subject.sizeMm.x, subject.sizeMm.y) * .004)
    if (camera.position.distanceTo(pose.position) < arrival && controls.current.target.distanceTo(pose.target) < arrival) goal.current = null
  })

  return <>
    <ambientLight intensity={0.75} />
    <hemisphereLight args={['#f7f8fb', '#bdbfcc', 0.8]} />
    <directionalLight position={[3.5, 5, 4.5]} intensity={2.1} />
    <directionalLight position={[-4.5, 2.2, 3]} intensity={0.8} />
    <directionalLight position={[-1.5, 3.5, -4]} intensity={0.5} />
    <InstallationSpace3D layout={layout.space} showDebugGeometry={false} />
    <Refrigerator3D product={product} layout={layout.product!} doorAnglesDeg={doorAnglesDeg}
      doorChecks={report.doorCollision} showDebugGeometry={false} />
    <IssueHighlights3D highlights={highlights} selectedIssueId={selected.checkId}
      hoveredIssueId={hovered ? issueFor(hovered).checkId : null} />
    <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={false}
      enableDamping dampingFactor={.12} minPolarAngle={ORBIT_MIN_POLAR_ANGLE} maxPolarAngle={ORBIT_MAX_POLAR_ANGLE}
      minDistance={mmToSceneUnit(minDistanceMm(subject))} maxDistance={mmToSceneUnit(maxDistanceMm(subject))}
      onStart={() => { goal.current = null }} />
  </>
}

export default function ValidationViewer(props: ViewerProps) {
  return <Canvas frameloop={props.active ? 'always' : 'never'}
    camera={{ fov: CAMERA_FOV_DEG, near: .12, far: 30 }} dpr={[1, 2]}
    gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}>
    <SceneContent {...props} />
  </Canvas>
}
