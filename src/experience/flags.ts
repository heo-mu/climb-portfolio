import * as THREE from 'three'

export function flagGeometry(width: number, height: number, top: number, color: string, taper = .15) {
  const geometry = new THREE.PlaneGeometry(1, 1, 28, 14)
  const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv'), colors: number[] = []
  const cloth = new THREE.Color(color), seam = new THREE.Color('#e0d3b6')
  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i), v = 1 - uv.getY(i)
    const drop = height * (1 - u * taper)
    positions.setXYZ(i, .035 + u * width, top - v * drop - .11 * u * u + Math.sin(u * 9) * .04 * u,
      Math.sin(u * 9 - v * 2) * .14 * width * u + .07 * u * u)
    const hem = u < .045 ? .8 : v < .07 || v > .93 || u > .97 ? .13 : 0
    const tint = cloth.clone().lerp(seam, hem).multiplyScalar(.96 + Math.cos(u * 9 - v * 2) * .04)
    colors.push(tint.r, tint.g, tint.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals(); geometry.computeBoundingSphere()
  geometry.boundingSphere!.radius += .12
  return geometry
}

export function flagMaterial(wind: { value: number }, transmission = .08, flutter = .065) {
  // A little transmitted light keeps the fabric readable on the unlit side.
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .93, emissive: '#977351', emissiveIntensity: .24 })
  material.onBeforeCompile = shader => {
    shader.uniforms.uFlagWind = wind
    shader.vertexShader = 'uniform float uFlagWind;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed.z += sin(uv.x * 8.0 + uv.y * 2.0 - uFlagWind * 1.2) * ${flutter.toFixed(3)} * uv.x;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float phase = uv.x * 8.0 + uv.y * 2.0 - uFlagWind * 1.2;
        objectNormal.x -= (sin(phase) + 8.0 * uv.x * cos(phase)) * ${(flutter * .77).toFixed(3)};
        objectNormal.y -= cos(phase) * ${(flutter * 2).toFixed(3)} * uv.x;
        objectNormal = normalize(objectNormal);
      `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight += diffuseColor.rgb * ${transmission.toFixed(3)};\n#include <opaque_fragment>`)
  }
  material.customProgramCacheKey = () => `alpine-cloth-${transmission}-${flutter}`
  return material
}
