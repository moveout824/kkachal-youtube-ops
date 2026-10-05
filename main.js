(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* scroll progress + nav hide on scroll down */
  const bar = document.querySelector(".progress");
  const nav = document.querySelector(".nav");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) nav.classList.toggle("hide", y > 240 && y > lastY + 4);
    if (y < lastY - 4 || y < 240) nav && nav.classList.remove("hide");
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* reveal on scroll */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* cursor glow */
  const glow = document.querySelector(".glow");
  if (glow && fine && !reduce) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`; requestAnimationFrame(loop); })();
  }

  /* card spotlight + tilt */
  document.querySelectorAll(".card").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
      if (fine && !reduce) {
        const rx = ((y / r.height) - 0.5) * -8, ry = ((x / r.width) - 0.5) * 8;
        c.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      }
    });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });

  /* magnetic buttons */
  if (fine && !reduce) document.querySelectorAll(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    b.addEventListener("pointerleave", () => {
      b.style.transition = "transform .6s cubic-bezier(.2,.7,.1,1)"; b.style.transform = "";
      setTimeout(() => (b.style.transition = ""), 600);
    });
  });

  /* sticky flow steps */
  const steps = [...document.querySelectorAll(".step")];
  const nodes = [...document.querySelectorAll(".node")];
  const core = document.querySelector(".core");
  if (steps.length) {
    const so = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = steps.indexOf(e.target);
      steps.forEach((s, j) => s.classList.toggle("active", j === i));
      nodes.forEach((n, j) => n.classList.toggle("on", j === i));
      if (core) core.style.transform = `scale(${1 + i * 0.08}) rotate(${i * 30}deg)`;
    }), { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => so.observe(s));
  }

  /* count up */
  const co = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    co.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, dur = reduce ? 0 : 1800, t0 = performance.now();
    const fmt = (v) => Math.round(v).toLocaleString("ko-KR");
    (function tick(t) {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      el.firstChild.nodeValue = fmt(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: 0.6 });
  document.querySelectorAll("[data-to]").forEach((el) => co.observe(el));

  /* policy TOC highlight */
  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const to = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.remove("on"));
      const a = map.get(e.target.id);
      if (a) { a.classList.add("on"); a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    }), { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".doc article section[id]").forEach((s) => to.observe(s));
  }

  /* sesame field */
  const cv = document.getElementById("sesame");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    let W, H, dpr, seeds = [];
    const mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(260, (W * H) / 6500));
      seeds = Array.from({ length: n }, () => {
        const x = Math.random() * W, y = Math.random() * H;
        return { x, y, ox: x, oy: y, vx: 0, vy: 0, a: Math.random() * Math.PI, s: 2.2 + Math.random() * 2.6,
          dark: Math.random() < 0.28, ph: Math.random() * 6.28, sp: 0.2 + Math.random() * 0.5 };
      });
    };
    resize(); addEventListener("resize", resize);
    cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cv);
    const draw = (t) => {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      const sy = scrollY * 0.25;
      for (const p of seeds) {
        const dx = p.x - mouse.x, dy = p.y + sy - mouse.y, d2 = dx * dx + dy * dy, R = 140;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.4; p.vx += (dx / d) * f; p.vy += (dy / d) * f; p.a += f * 0.05; }
        p.vx += (p.ox + Math.sin(t * 0.0004 * p.sp + p.ph) * 10 - p.x) * 0.012;
        p.vy += (p.oy + Math.cos(t * 0.0003 * p.sp + p.ph) * 10 - p.y) * 0.012;
        p.vx *= 0.88; p.vy *= 0.88; p.x += p.vx; p.y += p.vy;
        const y = p.y - sy;
        if (y < -20 || y > H + 20) continue;
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.a);
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.55, p.s, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.dark ? "rgba(60,44,30,.9)" : `rgba(248,234,210,${0.35 + 0.35 * Math.sin(t * 0.001 + p.ph) ** 2})`;
        ctx.fill(); ctx.restore();
      }
    };
    requestAnimationFrame(draw);
  }
})();
