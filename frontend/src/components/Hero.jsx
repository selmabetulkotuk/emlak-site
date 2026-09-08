'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';

export default function Hero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const gold = new THREE.Color(0xC7A05C);
    const goldDim = new THREE.Color(0x6B5A34);
    const group = new THREE.Group();
    scene.add(group);

    const shapes = [];
    const geos = [
      () => new THREE.IcosahedronGeometry(2.4, 0),
      () => new THREE.OctahedronGeometry(1.7, 0),
      () => new THREE.TetrahedronGeometry(1.5, 0),
      () => new THREE.IcosahedronGeometry(1.1, 1),
    ];

    for(let i=0; i<5; i++){
      const geo = geos[i % geos.length]();
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? gold : goldDim, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.32 - i * 0.02
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*6, (Math.random()-0.5)*6 - 2);
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
      mesh.userData = {
        speed: 0.05 + Math.random()*0.08,
        axis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize()
      };
      group.add(mesh);
      shapes.push(mesh);
    }

    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
      positions[i*3] = (Math.random()-0.5)*24;
      positions[i*3+1] = (Math.random()-0.5)*14;
      positions[i*3+2] = (Math.random()-0.5)*14 - 4;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({color: 0xC7A05C, size: 0.028, transparent: true, opacity: 0.55});
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      shapes.forEach(m => {
        m.rotateOnAxis(m.userData.axis, m.userData.speed * dt);
      });
      points.rotation.y += dt * 0.01;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.02;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <section className="hero" id="home">
      <canvas id="bg-canvas" ref={canvasRef}></canvas>
      <div className="hero-content">
        <div className="line"></div>
        <h1>Her Zemin Bir <em>Başlangıçtır</em></h1>
        <p>Şehrin en seçkin bölgelerinden satılık ve kiralık daire, villa, müstakil ev ve arsa fırsatlarını keşfedin.</p>
        <div className="hero-cta">
          <Link href="#listings" className="btn btn-primary">İlanları Keşfet</Link>
          <Link href="#contact" className="btn btn-ghost">Bize Ulaşın</Link>
        </div>
      </div>
      <div className="scroll-cue">
        <div className="dash"></div>
        <span>AŞAĞI KAYDIRIN</span>
      </div>
    </section>
  );
}