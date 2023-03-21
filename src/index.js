/** 
 * Imports
 */

import * as THREE from 'three'

import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import gsap from 'gsap';

import watertexture from './waternormals.jpg';
import sandtexture from './sand-texture-2.jpg';

/**
 * Global Variables
 */

let container, stats, camera, scene, renderer, controlscam, water, sun, cube1, cube1BB, prevhovered, originalColor;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

const metalMaterial = {
  metalness: 1.0,
  roughness: 1.0,
  color: 0xcfcfcf,
};

let homebutton = document.querySelector('.homebutton');
let buttonLeft = document.querySelector('.buttonleft');
let buttonRight = document.querySelector('.buttonright');
let editbutton = document.querySelector('.editbutton')
let cameraCounter = 1;
let editMode = true;

init();
animate();

function init() {
  /**
   * Base
   */

  // Setting the canvas for the THREEjs scene

  container = document.getElementById("container");
  container.innerHTML = "";
  
    // Initialising the renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  renderer.setClearColor('0x003366')

  // Creating the threejs scene

  scene = new THREE.Scene();

  // Creating the camera at setting the inital camera position and orientation

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(40, 40, 80);
  camera.lookAt(10, 20, 0)

  /**
   * Sun
   */

  sun = new THREE.Vector3();

  /**
   * Water
   */

  const waterGeometry = new THREE.PlaneGeometry(2500, 2500); // Sets the plane area for the water

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(watertexture,
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: (scene.fog = new THREE.Fog(0x003366, 10, 500)), // Applies fog to the scene
  });

  water.rotation.x = -Math.PI / 2; // Sets the texture to face upwards
  //water.material.side = THREE.DoubleSide;
  scene.add(water); // Adds water to the scene

  /**
   * SkyBox
   */

  const sky = new Sky();
  sky.scale.setScalar(2500);
  scene.add(sky); // Adds the skybox to the scene

  const skyUniforms = sky.material.uniforms;

  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 4,
    azimuth: 0,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  let renderTarget;

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene(sky);

    scene.environment = renderTarget.texture;
  }

  updateSun();

  /**
   * Ocean Area, neccessary for fog to work under water line
   */

  const geometrycube = new THREE.BoxGeometry(2500, 1000, 2500); // Creates the cube for the ocean area
  const materialcube = new THREE.MeshBasicMaterial({ color: 0x001a33 }); // Set cube color to dark blue
  const cube = new THREE.Mesh(geometrycube, materialcube); // Generates mesh
  cube.material.side = THREE.BackSide; // Sets the Mesh to be visible on both sides
  cube.position.set(0, -501, 0); // Sets the cube position
  scene.add(cube); // Adds the ocena cube to the scene

  /**
   * Ocean Floor
   */

  const geometrysea = new THREE.BoxGeometry(2500, 10, 2500); // Creates the cube for the ocean floor
  const materialsea = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(sandtexture), // Loads the sand texture to wrap around geometry
  });
  const cubesea = new THREE.Mesh(geometrysea, materialsea); // Generates mesh
  cubesea.position.set(0, -1001, 0); // Sets the ocean floor position below the ocean area
  scene.add(cubesea); // Adds the ocean floor to the scene

  /**
   * Initialise Models
   */

  modelInit();

  /**
   * Mooring Lines
   */

  //Create Basic Mooring line bezier curve geometry

  const curve1 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, -750, 0),
    new THREE.Vector3(750, -850, 750),
    new THREE.Vector3(1250, -1000, 1250)
  );

  const curve2 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, -750, 0),
    new THREE.Vector3(-750, -850, 750),
    new THREE.Vector3(-1250, -1000, 1250)
  );

  const curve3 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, -750, 0),
    new THREE.Vector3(750, -850, -750),
    new THREE.Vector3(1250, -1000, -1250)
  );

  const curve4 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, -750, 0),
    new THREE.Vector3(-750, -850, -750),
    new THREE.Vector3(-1250, -1000, -1250)
  );

  let curve = [curve1, curve2, curve3, curve4];
  let counter = 1;

  // Instancing the chain geometry along the defined curves

  for (let i = 0; i < curve.length; i++) {
    spawnChainUsingBezier(curve[i], counter);
    counter += 1;
  }

  /**
   * Fly Controls / Orbit Controls
   */

    controlscam = new FlyControls(camera, renderer.domElement);

    controlscam.enabled = false;
    controlscam.movementSpeed = 50;
    controlscam.domElement = renderer.domElement;
    controlscam.rollSpeed = 0.5;
    controlscam.enableRotate = false;
    controlscam.autoForward = false;
    controlscam.dragToLook = true;
  
 

  

  // Stats Module

  // stats = new Stats();
  // container.appendChild(stats.dom);

  /**
   * GUI 
   */ /*

  const gui = new GUI();

  const folderSky = gui.addFolder("Sky");
  folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
  folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
  folderSky.open();

  const waterUniforms = water.material.uniforms;

  const folderWater = gui.addFolder("Water");
  folderWater
    .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
    .name("distortionScale");
  folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
  folderWater.open(); */


  // Creating bounding box

  cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1950,1950,1950),
    new THREE.MeshPhongMaterial({ color: 0xff0000})
  );
  cube1.position.set(0, 10, 0)

  cube1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  cube1BB.setFromObject(cube1);


  // Calls the window resize function

  window.addEventListener("resize", onWindowResize);

  // Checks for mouse movement

  window.addEventListener("mousemove", onMouseMove);

  // Checks for click 

  window.addEventListener("click", onClick);
}

// Function to instance the chain along the set curves

function spawnChainUsingBezier(curve, counter) {
  // Creating points array from curve, equal to the number of instanced chain links

  const points1 = curve.getPoints(1500);

  // Creating the curve which the tube geometry will be created from

  const curvecat = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, -0.75),
    new THREE.Vector3(0, 0.5, 0.75),
    new THREE.Vector3(0, 0.25, 1),
    new THREE.Vector3(0, -0.25, 1),
    new THREE.Vector3(0, -0.5, 0.75),
    new THREE.Vector3(0, -0.5, -0.75),
    new THREE.Vector3(0, -0.25, -1),
    new THREE.Vector3(0, 0.25, -1),
  ]);

  curvecat.closed = true;

  // Defining the geometry, material and mesh for the chain link

  const geometry = new THREE.TubeGeometry(curvecat, 20, 0.2, 16, false);
  const material = new THREE.MeshStandardMaterial(metalMaterial);
  const mesh2 = new THREE.InstancedMesh(geometry, material, 1500);
  mesh2.name = "chain" + counter; // Set the current chain length name to chain plus the counter number
  scene.add(mesh2); // adds the chain mesh to the scene

  //Setting up instancing for chain link, setting position at each point in points array and defining rotation from lookAt method

  const dummy = new THREE.Object3D(); // creates a dummy object for chain instancing

  for (let i = 0; i < points1.length - 1; i++) { // loops through the point list
    dummy.position.set( // set the position of the dummy chain link at current array point
      points1[i].getComponent(0), // x coord
      points1[i].getComponent(1), // y coord
      points1[i].getComponent(2) //z coord
    );

    dummy.lookAt(points1[i + 1]); // Sets the orientation of the chain to look at the next position in the array

    if (i % 2 === 0) {
      dummy.rotateZ(Math.PI / 2); //Rotates every other chain link
    }

    dummy.updateMatrix(); // updated the matrix with the set dummy position
    mesh2.setMatrixAt(i, dummy.matrix);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {

  requestAnimationFrame(animate);

  checkCollision();

  render();

  //stats.update();
}

function render() {

  const time = performance.now() * 0.001;

  water.material.uniforms["time"].value += 0.5 / 60.0;

  const delta = clock.getDelta();

  controlscam.update(delta);

  renderer.render(scene, camera);
}

function checkCollision() {
  if(camera.position.x > cube1BB.max.x){
    camera.position.x = cube1BB.max.x;
}

if(camera.position.x < cube1BB.min.x){
    camera.position.x = cube1BB.min.x;
}

if(camera.position.z > cube1BB.max.z){
    camera.position.z = cube1BB.max.z;
}

if(camera.position.z < cube1BB.min.z){
    camera.position.z = cube1BB.min.z;
}

if(camera.position.y > cube1BB.max.z){
  camera.position.y = cube1BB.max.z;
}

if(camera.position.y < cube1BB.min.z){
  camera.position.y = cube1BB.min.z;
}
}

function onMouseMove(event) {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  hovered();
}

function hovered() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    if (/^chain.*$/.test(intersects[i].object.name)){ // &! intersects[i].object === prevhovered) {
      
      if ( prevhovered != null){// || prevhovered != intersects[i].object.name) {
        prevhovered.material.color.set(originalColor); // reset previous to original colour
      }
      originalColor = intersects[i].object.material.color.getHex(); //16777215
      prevhovered = intersects[i].object;
      prevhovered.material.color.set(0xff2e2e);
      break;
    }
  }
}

function onClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === "chain1"){

      cameraCounter = 1;

      gsap.to(camera.position, {
        x: cameraset.cameraList[cameraCounter].positionx,
        y: cameraset.cameraList[cameraCounter].positiony,
        z: cameraset.cameraList[cameraCounter].positionz,
        duration: cameraset.cameraList[cameraCounter].positiondur
      });
    
      gsap.to(camera.rotation, {
        x: cameraset.cameraList[cameraCounter].rotationx,
        y: cameraset.cameraList[cameraCounter].rotationy,
        z: cameraset.cameraList[cameraCounter].rotationz,
        duration: cameraset.cameraList[cameraCounter].rotationdur
      });
    }
    if (intersects[i].object.name === "chain2"){

      cameraCounter = 2;

      gsap.to(camera.position, {
        x: cameraset.cameraList[cameraCounter].positionx,
        y: cameraset.cameraList[cameraCounter].positiony,
        z: cameraset.cameraList[cameraCounter].positionz,
        duration: cameraset.cameraList[cameraCounter].positiondur
      });
    
      gsap.to(camera.rotation, {
        x: cameraset.cameraList[cameraCounter].rotationx,
        y: cameraset.cameraList[cameraCounter].rotationy,
        z: cameraset.cameraList[cameraCounter].rotationz,
        duration: cameraset.cameraList[cameraCounter].rotationdur
      });
    }
    if (intersects[i].object.name === "chain3"){

      cameraCounter = 3;

      gsap.to(camera.position, {
        x: cameraset.cameraList[cameraCounter].positionx,
        y: cameraset.cameraList[cameraCounter].positiony,
        z: cameraset.cameraList[cameraCounter].positionz,
        duration: cameraset.cameraList[cameraCounter].positiondur
      });
    
      gsap.to(camera.rotation, {
        x: cameraset.cameraList[cameraCounter].rotationx,
        y: cameraset.cameraList[cameraCounter].rotationy,
        z: cameraset.cameraList[cameraCounter].rotationz,
        duration: cameraset.cameraList[cameraCounter].rotationdur
      });
    }
    if (intersects[i].object.name === "chain4"){

      cameraCounter = 4;

      gsap.to(camera.position, {
        x: cameraset.cameraList[cameraCounter].positionx,
        y: cameraset.cameraList[cameraCounter].positiony,
        z: cameraset.cameraList[cameraCounter].positionz,
        duration: cameraset.cameraList[cameraCounter].positiondur
      });
    
      gsap.to(camera.rotation, {
        x: cameraset.cameraList[cameraCounter].rotationx,
        y: cameraset.cameraList[cameraCounter].rotationy,
        z: cameraset.cameraList[cameraCounter].rotationz,
        duration: cameraset.cameraList[cameraCounter].rotationdur
      });
    }
  }
}

function modelInit() {
/**
*  GLTF MODEL LOADER
*/
const gltfLoader = new GLTFLoader();

/**
 * Draco Mesh Loader
 */

const dLoader = new DRACOLoader();
dLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dLoader.setDecoderConfig({type: 'js'});
gltfLoader.setDRACOLoader(dLoader);


// Loading the Vessel Model glTF

gltfLoader.load(
 './models/vessels/glTF/annanery.gltf', // Model File Path
 (gltf) => {
   const modelvessel = gltf.scene;

   const newMaterial = new THREE.MeshStandardMaterial(metalMaterial); 
   // Checking if the model has a material and setting it to a new THREE Materal
   modelvessel.traverse((o) => {
     if (o.isMesh) o.material = newMaterial;
   });

   modelvessel.rotation.set(0, -Math.PI/2, 0);

   modelvessel.position.set(0, 2, -180); // Setting the position of the Model

   modelvessel.frustumCulled = true;

   scene.add(gltf.scene); // Adding Model to Scene
 }
)

// Loading the Turret Model glTF

gltfLoader.load(
 './models/turret/glTF/turret.glb', // Model File Path
 (glb) => {
   const modelturret = glb.scene;

   const newMaterial = new THREE.MeshStandardMaterial(metalMaterial);
   // Checking if the model has a material and setting it to a new THREE Materal
   modelturret.traverse((o) => {
     if (o.isMesh) o.material = newMaterial;
   });

   modelturret.scale.set(2, 2, 2); // Setting the Scale of the Model

   modelturret.position.set(0, -2, 0); // Setting the position of the Model

   modelturret.frustumCulled = true;

   scene.add(glb.scene); // Adding Model to Scene
 }
)}

// Defining an Individual Camera, holds the properties and behaviours for one camera
class Camera {
  constructor(name, positionx, positiony, positionz, positiondur, rotationx, rotationy, rotationz, rotationdur) {
    this.name = name;
    this.positionx = positionx;
    this.positiony = positiony;
    this.positionz = positionz;
    this.positiondur = positiondur;
    this.rotationx = rotationx;
    this.rotationy = rotationy;
    this.rotationz = rotationz;
    this.rotationdur = rotationdur;
  }
  play() {
    console.log(this.name, "plays")
  }
}

// Class that holds a collection of camera properties and functions
class Cameras {
  constructor (){
    this.cameras = []
  }
// Creates a new camera and saves it in the collection
  newCamera(name, positionx, positiony, positionz, positiondur, rotationx, rotationy, rotationz, rotationdur){
    let cam = new Camera(name, positionx, positiony, positionz, positiondur, rotationx, rotationy, rotationz, rotationdur)
    this.cameras.push(cam)
    return cam
  }
  get cameraList(){
    return this.cameras
  }
  get numberOfCameras(){
    return this.cameras.length
  }
}

let cameraset = new Cameras()
cameraset.newCamera("Home", 40, 40, 80, 2, -0.23, 0.32, 0.08, 2)
cameraset.newCamera("Chain1", 380, -690, 460, 2, -0.55, -0.6, -0.37, 2)
cameraset.newCamera("Chain2", -380, -690, 460, 2, -0.56, 0.64, 0.33, 2)
cameraset.newCamera("Chain3", 380, -680, -460, 2, -2.52, -0.34, -2.89, 2)
cameraset.newCamera("Chain4", -380, -680, -460, 2, -2.36, 0.62, 2.65, 2)

// Lists all the cameras
// console.log(cameraset)
// console.log(cameraset.numberOfCameras + " Cameras")
// console.log(cameraset.cameraList)

// Make them do something
// cameraset.cameraList.forEach(camera => camera.play())

homebutton.addEventListener('click', () => {

  cameraCounter = 1;

  gsap.to(camera.position, {
    x: cameraset.cameraList[0].positionx,
    y: cameraset.cameraList[0].positiony,
    z: cameraset.cameraList[0].positionz,
    duration: cameraset.cameraList[0].positiondur
  });

  gsap.to(camera.rotation, {
    x: cameraset.cameraList[0].rotationx,
    y: cameraset.cameraList[0].rotationy,
    z: cameraset.cameraList[0].rotationz,
    duration: cameraset.cameraList[0].rotationdur
  });

  return cameraCounter
})

buttonLeft.addEventListener('click', () => {
  if (cameraCounter == 1) {
    cameraCounter = 4;
  } else {
    cameraCounter -= 1;
  }

  gsap.to(camera.position, {
    x: cameraset.cameraList[cameraCounter].positionx,
    y: cameraset.cameraList[cameraCounter].positiony,
    z: cameraset.cameraList[cameraCounter].positionz,
    duration: cameraset.cameraList[cameraCounter].positiondur
  });

  gsap.to(camera.rotation, {
    x: cameraset.cameraList[cameraCounter].rotationx,
    y: cameraset.cameraList[cameraCounter].rotationy,
    z: cameraset.cameraList[cameraCounter].rotationz,
    duration: cameraset.cameraList[cameraCounter].rotationdur
  });

  console.log(cameraCounter)
  return cameraCounter
  
});

buttonRight.addEventListener('click', () => {
  if (cameraCounter == 4) {
    cameraCounter = 1;
  } else {
    cameraCounter += 1;
  }

  gsap.to(camera.position, {
    x: cameraset.cameraList[cameraCounter].positionx,
    y: cameraset.cameraList[cameraCounter].positiony,
    z: cameraset.cameraList[cameraCounter].positionz,
    duration: cameraset.cameraList[cameraCounter].positiondur
  });

  gsap.to(camera.rotation, {
    x: cameraset.cameraList[cameraCounter].rotationx,
    y: cameraset.cameraList[cameraCounter].rotationy,
    z: cameraset.cameraList[cameraCounter].rotationz,
    duration: cameraset.cameraList[cameraCounter].rotationdur
  });

  console.log(cameraCounter)
  return cameraCounter
});

editbutton.addEventListener('click', () => {
  if (editMode)
  {
    editMode = false
  }
  else
  {
    editMode = true
  }
})

