class WorldShader
  constructor: ->
    @uniforms =
      'uResolution':
        type: 'v2'
        value: new THREE.Vector2()
      'uNear':
        type: 'f'
        value: 0
      'uFar':
        type: 'f'
        value: 0
      'uFov':
        type: 'f'
        value: 0
      'uTime':
        type: 'f'
        value: 0
      'uProgress':
        type: 'f'
        value: 0
      'uDirectionHotness':
        type: 'f'
        value: 0
      'uLightPosition':
        type: 'v3'
        value: new THREE.Vector3()
      'uSounds' :
        type: 'fv1'
        value: [0, 0, 0, 0, 0]
      'uModelViewMatrix':
        type: 'm4'
        value: new THREE.Matrix4()
      'uProjectionMatrix':
        type: 'm4'
        value: new THREE.Matrix4()
      'uNoiseTexture':
        type: 't'
        value: null

    @vertexShader = document.querySelector('#world-shader-vertex').textContent

    @fragmentShader = [
      document.querySelector('#world-shader-fragment').textContent
      # document.querySelector('#world-shader-fragment').import.body.innerText
    ].join('\n')

    return