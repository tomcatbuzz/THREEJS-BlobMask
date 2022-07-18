import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import fragment from './shader/fragment.glsl';
import vertex from './shader/vertex.glsl';
import * as dat from 'dat.gui';
// import gsap from 'gsap';

import kh from '../img/kh.jpg';
import ua from '../img/ua.jpg';
import blob from '../img/blob.png';

function range(a, b) {
  let r = Math.random();
  return a*r + b*(1 - r);
}

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.point = new THREE.Vector3();
    
    // not sure if needed here
    // this.container = document.getElementById("container");
    this.container.appendChild(this.renderer.domElement);

    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.001, 
      1000
    );

    // let frustumSize = 10;
    // let aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(
    //   frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000
    // );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addBlobs();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.raycasterEvent();
    // this.settings();
  }

  raycasterEvent() {
    window.addEventListener('pointermove', (event) => {

      this.pointer.x = ( event.clientX / this.width ) * 2 - 1;
      this.pointer.y = - ( event.clientY / this.height ) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([this.plane]);

      if(intersects[0]) {
        this.point.copy(intersects[0].point)
      }
      
    });
  }

  addBlobs() {
    let number = 50;
    let bl = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(blob),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      })
    )
    bl.position.z = 0.1

    this.blobs = [];
    // this.scene.add(bl)
    for (let i = 0; i < number; i++) {
      let b = bl.clone();

      let theta = range(0, 2*Math.PI);
      let r = range(0.1, 0.2);
      b.position.x = r*Math.sin(theta);
      b.position.y = r*Math.cos(theta);
      b.userData.life = range(-2*Math.PI, 2*Math.PI);
      this.blobs.push(b);
      this.scene1.add(b)
    }
  }

  updateBlobs() {
    this.blobs.forEach(b => {
      b.userData.life += 0.1;
      b.scale.setScalar(Math.sin(0.5*b.userData.life))

      if(b.userData.life > 2*Math.PI) {
        b.userData.life = -2*Math.PI;

        let theta = range(0, 2*Math.PI);
        let r = range(0.05, 0.14);

        b.position.x = this.point.x + r*Math.sin(theta);
        b.position.y = this.point.y + r*Math.cos(theta);
      }
      // reset life
    })
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    //image conver
    this.imageAspect = 730/1300;
    let a1;
    let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }
    
    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // cover with quad
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

    // if(w/h>1) {
      if(this.width/this.height>1){
        this.plane.scale.x = this.camera.aspect;
        // this.plane.scale.y = this.camera.aspect;
      } else{
        this.plane.scale.y = 1/this.camera.aspect;
      }

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let vid = document.getElementById('roadVideo');
    vid.play();
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        // texture1: { value: null },
        mask: { value: new THREE.TextureLoader().load(blob) },
        // texture as image background
        // bg: { value: new THREE.TextureLoader().load(ua) },
        // texture as video background
        bg: { value: new THREE.VideoTexture(vid)},
        resolution: { value: new THREE.Vector4() },
        uvRate1: { value: new THREE.Vector2(1, 1) },
      },
      // wireframe: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
    this.plane.position.z = 0.01

    let bgmesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1.8, 1.1),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(kh)
      })
    )
    this.scene.add(bgmesh);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.updateBlobs();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene1, this.camera);
    this.material.uniforms.mask.value = this.renderTarget.texture;
    this.renderer.setRenderTarget(null);
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.progress.value = this.settings.progress;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById('container')
});