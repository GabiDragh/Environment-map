import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { GroundProjectedSkybox } from 'three/addons/objects/GroundProjectedSkybox.js'

/**
 * INFO: Loaders
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const cubeTextureLoader = new THREE.CubeTextureLoader()

const rgbeLoader = new RGBELoader()

// Texture loader for the skybox map
const exrLoader = new EXRLoader()
const textureLoader = new THREE.TextureLoader()

/**
 * Base
 */
// Debug
const gui = new GUI()

// INFO: Create empty global variable
const global = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * INFO: Function to update all materials 
 */


const updateAllMaterials = () => {
    // console.log('Function to traverse the scene and update all materials here')
    scene.traverse((child) => {
        // console.log(child)
        // Apply it on the meshes that have a meshStandardMaterial
        // Test with if to see if the child is an instance of THREE>MeshStandardMaterial
        // if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if(child.isMesh && child.material.isMeshStandardMaterial){
            
            // console.log(child)
            child.material.envMapIntensity = global.envMapIntensity

        }
    })
}

// updateAllMaterials() - > call it after loading the model into the scene

/**
 * INFO: Environment map
 */

// INFO: Add background bluriness (after global intensity)
scene.backgroundBlurriness = 0 //goodon low def maps and want the user to focus on central object

// INFO: Background intensity (only background, not environment map)
scene.backgroundIntensity = 1

gui.add(scene, 'backgroundBlurriness').min(0).max(10).step(0.001)
gui.add(scene, 'backgroundIntensity').min(0).max(10).step(0.001)


// INFO: Add global intensity (way later in the course, but added before loading the maps)
global.envMapIntensity = 1
gui.add(global, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials)

// // INFO: LDR cube texture - commented out to load the hdr map (needs RGBELoader - HDR format encoding)

// const environmentMap = cubeTextureLoader.load( //need to follow order!! First positive, then negative x, y, z
//     [
//         '/environmentMaps/Grass-Map/px.png',
//         '/environmentMaps/Grass-Map/nx.png',
//         '/environmentMaps/Grass-Map/py.png',
//         '/environmentMaps/Grass-Map/ny.png',
//         '/environmentMaps/Grass-Map/pz.png',
//         '/environmentMaps/Grass-Map/nz.png',
//     ]
// )

// // Use as background
// // create cube very far and apply visible face on the inside. Used in the past, but not very good

// // assign env map to scene background -> after creating the environmentMap and the scene
// scene.environment = environmentMap //applies the environment map to all scene
// scene.background = environmentMap

//  INFO: HDR (RGBE) equirectangular - much heavier to load and render. can work on lower resolution and blurred background. use them only for lighting
// rgbeLoader.load('/environmentMaps/blender-studio-2k.hdr', (environmentMap) => {
//     // console.log(environmentMap)
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping
//     // scene.background = environmentMap
//     scene.environment = environmentMap
// })

// // LDR equirectangular - load Skybox AI environment map
// const environmentMap = textureLoader.load('/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg')

// environmentMap.mapping = THREE.EquirectangularReflectionMapping
// environmentMap.colorSpace = THREE.SRGBColorSpace //Three sees the colours linear, doesn't recognise the color space of the map

// scene.background = environmentMap
// scene.environment = environmentMap

// Ground projected skybox!!
// rgbeLoader.load('/environmentMaps/2/2k.hdr', (environmentMap) => {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping
//     scene.environment = environmentMap //using the env map only for lighting - no background


// // Skybox
// const skybox = new GroundProjectedSkybox(environmentMap)
// skybox.radius = 50
// skybox.height = 10
// skybox.scale.setScalar(50)
// scene.add(skybox)

// gui.add(skybox, 'radius', 1, 200, 0.1).name('skyBoxRadius')
// gui.add(skybox, 'height', 1, 100, 0.1).name('skyBoxHeight')

// })

/**
 * INFO: Real time environment map
*/

const environmentMap = textureLoader.load('/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg')
environmentMap.mapping = THREE.EquirectangularReflectionMapping
environmentMap.colorSpace = THREE.SRGBColorSpace

scene.background = environmentMap

// Add holy donut - to light around the objects - not using the map to light the environment
const holyDonut = new THREE.Mesh(
    new THREE.TorusGeometry(8, 0.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) }) //brighter light than just white
)
holyDonut.layers.enable(1)
holyDonut.position.x = -4
holyDonut.position.z = -4
scene.add(holyDonut)

// INFO: Add Cube Render Target => render targets are textures in which we can store renders of any scene

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType}) //resolution 256 -> for each square of the cube => 6 times this resolution
                                                                    // type: type of value to be stored. We want the same behaviour as the HDR with a high range of data = > use THREE.HalfFloatType or THREE.FloatType
                                                                    // Float uses 32 bits to store a wide range of values. Half float uses 16, but still stores a wide range, Difference not noticeable, but better performance
scene.environment = cubeRenderTarget.texture

// Cube camera
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget) //near, far and the WebGlCubeRenderTarget
cubeCamera.layers.set(1)



/**
 * Torus Knot
 */
const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
    new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1, color: 0xaaaaaa })
)

// torusKnot.material.envMap = environmentMap
torusKnot.position.x = -4
torusKnot.position.y = 0
scene.add(torusKnot)

/**
 * INFO: Model
 */

gltfLoader.load(
    '/models/gallery-new.glb',
    (gltf) => {
        // console.log('success')
        // console.log(gltf)

        const model = gltf.scene
        model.scale.set(400, 400, 400)
        model.position.set(-6, -5, 1)
        model.rotation.y = Math.PI * 0.2
        scene.add(model)
        updateAllMaterials()
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 5, 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.y = 3.5
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
const tick = () =>
{
    // Time
    const elapsedTime = clock.getElapsedTime()

    // INFO: Real time environment map animation
    // Test if holyDonut exists
    if(holyDonut) {
        holyDonut.rotation.x = Math.sin(elapsedTime) * 2 //use elapsedTime on the rotation
        cubeCamera.update(renderer, scene)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()