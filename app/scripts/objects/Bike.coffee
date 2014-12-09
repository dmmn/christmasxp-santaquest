class Bike extends THREE.Object3D
  constructor: ->
    super()

    loader = new THREE.JSONLoader()
    loader.load '../models/bike.json', (geometry) =>
      geometry.computeMorphNormals()

      mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial(
        color: 0xffffff
        # shading: THREE.FlatShading
      ))
      @add mesh
      return
    
    null