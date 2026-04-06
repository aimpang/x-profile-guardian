"use client";

import React, { useEffect, useRef } from "react";

export function MinimalHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 7000);

    const make = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(29, 155, 240, ${p.opacity * 0.4})`;
        ctx.fillRect(p.x, p.y, 0.6, Math.random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style>{`
        .hero-accent-lines { position: absolute; inset: 0; pointer-events: none; }
        .hline, .vline { position: absolute; background: hsl(220 9% 16%); opacity: .5; will-change: transform, opacity; }
        .hline { height: 1px; left: 0; right: 0; transform: scaleX(0); transform-origin: 50% 50%; animation: drawX 800ms cubic-bezier(.22,.61,.36,1) forwards; }
        .hline:nth-child(1){ top: 20%; animation-delay: 150ms; }
        .hline:nth-child(2){ top: 50%; animation-delay: 280ms; }
        .hline:nth-child(3){ top: 80%; animation-delay: 410ms; }
        .vline { width: 1px; top: 0; bottom: 0; transform: scaleY(0); transform-origin: 50% 0%; animation: drawY 900ms cubic-bezier(.22,.61,.36,1) forwards; }
        .vline:nth-child(4){ left: 20%; animation-delay: 520ms; }
        .vline:nth-child(5){ left: 50%; animation-delay: 640ms; }
        .vline:nth-child(6){ left: 80%; animation-delay: 760ms; }
        .hline::after, .vline::after { content:""; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(29,155,240,.15), transparent); opacity:0; animation: shimmer 900ms ease-out forwards; }
        .hline:nth-child(1)::after{ animation-delay: 150ms; }
        .hline:nth-child(2)::after{ animation-delay: 280ms; }
        .hline:nth-child(3)::after{ animation-delay: 410ms; }
        .vline:nth-child(4)::after{ animation-delay: 520ms; }
        .vline:nth-child(5)::after{ animation-delay: 640ms; }
        .vline:nth-child(6)::after{ animation-delay: 760ms; }
        @keyframes drawX { 0% { transform: scaleX(0); opacity: 0; } 60% { opacity: .7; } 100% { transform: scaleX(1); opacity: .5; } }
        @keyframes drawY { 0% { transform: scaleY(0); opacity: 0; } 60% { opacity: .7; } 100% { transform: scaleY(1); opacity: .5; } }
        @keyframes shimmer { 0% { opacity: 0; } 30% { opacity: .2; } 100% { opacity: 0; } }
      `}</style>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-60"
      />
      <div className="hero-accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>
    </>
  );
}
