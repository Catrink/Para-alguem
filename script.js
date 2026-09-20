(() => {
  'use strict';
  const yesButton = document.querySelector('#yes-button');
  const noButton = document.querySelector('#no-button');
  const invitation = document.querySelector('#invitation-content');
  const success = document.querySelector('#success-content');
  const message = document.querySelector('#playful-message');
  const confetti = document.querySelector('#confetti');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let escapes = 0;
  let lastEscape = -Infinity;
  let celebrationTimer;
  const teasing = [
    'ué... esse botão ficou tímido 🙈',
    'ele também acha que a gente devia sair ♡',
    'tá difícil dizer não pra esse encontro, né?',
    'prometo que a companhia compensa 💕',
    'o “não” foi dar uma voltinha... vem comigo?',
    'só sei que eu ia adorar te ver sorrir ♡',
  ];
  function bounds() {
    const viewport = window.visualViewport;
    return {
      left: viewport?.offsetLeft || 0,
      top: viewport?.offsetTop || 0,
      width: viewport?.width || window.innerWidth,
      height: viewport?.height || window.innerHeight,
    };
  }
  function escapeNo(event) {
    if (invitation.hidden) return;
    event?.preventDefault();
    const now = performance.now();
    if (now - lastEscape < 180) return;
    lastEscape = now;
    const old = noButton.getBoundingClientRect();
    const yes = yesButton.getBoundingClientRect();
    const viewport = bounds();
    const pad = 16;
    const minX = viewport.left + pad;
    const minY = viewport.top + pad;
    const maxX = Math.max(minX, viewport.left + viewport.width - old.width - pad);
    const maxY = Math.max(minY, viewport.top + viewport.height - old.height - pad);
    const pointerX = event?.clientX ?? old.x + old.width / 2;
    const pointerY = event?.clientY ?? old.y + old.height / 2;
    let choice = null;
    let bestDistance = -1;
    // Compare safe destinations, keeping the Sim button free and the Não in view.
    for (let i = 0; i < 36; i += 1) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const overlapsYes = x < yes.right + 24 && x + old.width > yes.left - 24 &&
        y < yes.bottom + 24 && y + old.height > yes.top - 24;
      if (overlapsYes) continue;
      const distance = Math.hypot(x + old.width / 2 - pointerX, y + old.height / 2 - pointerY);
      if (distance > bestDistance) {
        bestDistance = distance;
        choice = { x, y };
      }
    }
    if (!choice) return;
    document.body.append(noButton);
    noButton.classList.add('escaped');
    noButton.style.left = `${choice.x}px`;
    noButton.style.top = `${choice.y}px`;
    message.textContent = teasing[escapes % teasing.length];
    escapes += 1;
  }
  noButton.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') escapeNo(event);
  });
  noButton.addEventListener('pointerdown', escapeNo);
  // Keyboard and assistive clicks work without trapping focus.
  noButton.addEventListener('click', escapeNo);
  function returnNo() {
    document.querySelector('.no-slot').append(noButton);
    noButton.classList.remove('escaped');
    noButton.style.removeProperty('left');
    noButton.style.removeProperty('top');
  }
  window.addEventListener('resize', returnNo, { passive: true });
  window.visualViewport?.addEventListener('resize', returnNo, { passive: true });
  window.visualViewport?.addEventListener('scroll', returnNo, { passive: true });
  function celebrate() {
    clearTimeout(celebrationTimer);
    confetti.replaceChildren();
    if (reducedMotion.matches) return;
    const colors = ['#bd3b66', '#e989ab', '#f5b7ce', '#e4a56e', '#ffffff'];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 65; i += 1) {
      const heart = document.createElement('span');
      heart.textContent = i % 5 === 0 ? '✦' : '♥';
      heart.className = 'confetti-piece';
      heart.style.setProperty('--x', `${Math.random() * 100}%`);
      heart.style.setProperty('--delay', `${Math.random() * 1.7}s`);
      heart.style.setProperty('--duration', `${3 + Math.random() * 2}s`);
      heart.style.setProperty('--drift', `${(Math.random() - 0.5) * 200}px`);
      heart.style.setProperty('--spin', `${(Math.random() - 0.5) * 600}deg`);
      heart.style.fontSize = `${12 + Math.random() * 19}px`;
      heart.style.color = colors[i % colors.length];
      fragment.append(heart);
    }
    confetti.append(fragment);
    celebrationTimer = window.setTimeout(() => confetti.replaceChildren(), 7000);
  }
  function acceptInvitation() {
    if (!success.hidden) return { accepted: true, messageSent: false };
    returnNo();
    invitation.hidden = true;
    success.hidden = false;
    document.body.classList.add('accepted');
    document.querySelector('#success-title').focus({ preventScroll: true });
    celebrate();
    return { accepted: true, messageSent: false };
  }
  yesButton.addEventListener('click', acceptInvitation);
  document.querySelector('#reset-button').addEventListener('click', () => {
    success.hidden = true;
    invitation.hidden = false;
    document.body.classList.remove('accepted');
    clearTimeout(celebrationTimer);
    confetti.replaceChildren();
    returnNo();
    escapes = 0;
    lastEscape = -Infinity;
    message.textContent = 'acho que a gente combina, sabia? ♡';
    yesButton.focus({ preventScroll: true });
  });
  const backdrop = document.querySelector('.background-hearts');
  for (let i = 0; i < 14; i += 1) {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = i % 3 === 0 ? '✧' : '♡';
    heart.style.left = `${3 + i * 7}%`;
    heart.style.setProperty('--duration', `${18 + (i % 5) * 3}s`);
    heart.style.setProperty('--delay', `${-i * 2.9}s`);
    heart.style.fontSize = `${18 + (i % 4) * 10}px`;
    backdrop.append(heart);
  }
  // Optional page tool invokes exactly the same local celebration as Sim.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'accept_invitation',
        title: 'Aceitar o convite para sair',
        description: 'Mostra a comemoração do Sim nesta página. Não envia uma mensagem nem agenda um encontro.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) {
            throw new Error('Esperado um objeto vazio.');
          }
          return acceptInvitation();
        },
      }, { signal: lifecycle.signal })).catch(() => {});
      window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    } catch { /* The visible buttons work in browsers without WebMCP. */ }
  }
})();
