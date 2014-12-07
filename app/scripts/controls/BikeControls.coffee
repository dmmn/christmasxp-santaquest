class BikeControls
  FLAG_LEFT = 1
  FLAG_UP = 2
  FLAG_RIGHT = 4
  FLAG_DOWN = 8
  FLAG_SPACE = 16

  SPEED = 2
  ROTATION_SPEED = new THREE.Vector3(.01, .05, .01)

  GRAVITY = -.81

  constructor: (@object, @initialSpeed = 0) ->
    @keyFlags = 0
    @velocity = new THREE.Vector3()
    @movement = new THREE.Vector3()
    @euler = new THREE.Euler()
    @quaternion = new THREE.Quaternion()
    @angleEuler = new THREE.Euler()
    @angleQuaternion = new THREE.Quaternion()
    @currentVelocity = @velocity.clone()

    @speed = 0
    @groundRefY = @object.position.y

    window.addEventListener 'keydown', @onKeyDown
    window.addEventListener 'keyup', @onKeyUp
    return

  reset: =>
    @keyFlags = 0
    return

  onKeyDown: (e) =>
    switch e.keyCode
      when 32
        @keyFlags |= FLAG_SPACE
      when 37
        @keyFlags |= FLAG_LEFT
      when 38
        @keyFlags |= FLAG_UP
      when 39
        @keyFlags |= FLAG_RIGHT
      when 40
        @keyFlags |= FLAG_DOWN
    return

  onKeyUp: (e) =>
    switch e.keyCode
      when 32
        @keyFlags &= (31 - FLAG_SPACE)
      when 37
        @keyFlags &= (31 - FLAG_LEFT)
      when 38
        @keyFlags &= (31 - FLAG_UP)
      when 39
        @keyFlags &= (31 - FLAG_RIGHT)
      when 40
        @keyFlags &= (31 - FLAG_DOWN)
    return

  update: (dt) =>

    dt = 1

    # z
    if (@keyFlags & FLAG_RIGHT)
      @euler.z += ROTATION_SPEED.z * dt
    if (@keyFlags & FLAG_LEFT)
      @euler.z -= ROTATION_SPEED.z * dt
    if !(@keyFlags & FLAG_RIGHT) and !(@keyFlags & FLAG_LEFT)
      @euler.z = 0

    # velocity
    @velocity.set 0, 0, @initialSpeed
    if (@keyFlags & FLAG_UP)
      @velocity.z += SPEED * dt
    if (@keyFlags & FLAG_DOWN)
      @velocity.z -= SPEED * dt

    # x
    if (@keyFlags & FLAG_SPACE)
      @angleEuler.x -= ROTATION_SPEED.x * dt
    else if @object.position.y > @groundRefY + 20
      @angleEuler.x %= Math.PI * 2
      @angleEuler.x += ROTATION_SPEED.x * dt
    else
      @angleEuler.x = 0


    if @angleEuler.x > 1
      @angleEuler.x = 1

    # y
    if (@keyFlags & FLAG_RIGHT)
      @euler.y -= ROTATION_SPEED.y * dt
    if (@keyFlags & FLAG_LEFT)
      @euler.y += ROTATION_SPEED.y * dt

    # @euler.multiply(dt)
    # @euler.x *= dt
    # @euler.y *= dt
    # @euler.z *= dt
    # @velocity.multiplyScalar(dt)

    @angleQuaternion.setFromEuler(@angleEuler)

    @quaternion.setFromEuler(@euler)

    @quaternion.multiply(@angleQuaternion)

    @object.quaternion.slerp(@quaternion, .1 * dt)

    @velocity.applyQuaternion(@object.quaternion)

    @currentVelocity.lerp(@velocity, .1 * dt)

    if @object.position.y < 0
      @object.position.y = 0

    if @object.position.y < @groundRefY
      @object.position.y += (@groundRefY - @object.position.y) * .1 * dt
    else if @object.position.y > @groundRefY
      @velocity.y += GRAVITY
    
    @object.position.add @currentVelocity

    return
