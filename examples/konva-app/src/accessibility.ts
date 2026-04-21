import Konva from 'konva';

export function loadAccessibilityExample(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({ container, width: 900, height: 500 });
  const layer = new Konva.Layer({ name: 'a11y-layer' });
  stage.add(layer);

  layer.add(new Konva.Text({
    x: 20, y: 15, text: 'Accessibility Insights Test — select each node to see issues',
    fontSize: 15, fontFamily: 'system-ui, sans-serif', fill: '#7f8c8d', name: 'header',
  }));

  // --- Good: interactive node with name ---
  const goodBtn = new Konva.Group({ x: 30, y: 60, name: 'good-button' });
  layer.add(goodBtn);
  const goodBg = new Konva.Rect({
    width: 160, height: 44, fill: '#2ecc71', cornerRadius: 6, name: 'good-btn-bg',
  });
  goodBtn.add(goodBg);
  goodBtn.add(new Konva.Text({
    x: 20, y: 12, text: 'Good Button', fontSize: 14, fill: '#fff', name: 'good-btn-label',
  }));
  goodBtn.on('click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 30, y: 110, text: '✓ Has name, proper size, click listener',
    fontSize: 11, fill: '#2ecc71', fontFamily: 'system-ui', name: 'good-desc',
  }));

  // --- Bad: interactive node with NO name or id ---
  const noNameBtn = new Konva.Rect({
    x: 230, y: 60, width: 140, height: 44, fill: '#e74c3c', cornerRadius: 6,
  });
  layer.add(noNameBtn);
  noNameBtn.on('click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 230, y: 82, text: 'No Name', fontSize: 14, fill: '#fff', name: 'no-name-label',
  }));
  layer.add(new Konva.Text({
    x: 230, y: 110, text: '⚠ Interactive but has no name or id',
    fontSize: 11, fill: '#e74c3c', fontFamily: 'system-ui', name: 'noname-desc',
  }));

  // --- Bad: tiny click target ---
  const tinyBtn = new Konva.Circle({
    x: 430, y: 82, radius: 6, fill: '#e67e22', name: 'tiny-target',
  });
  layer.add(tinyBtn);
  tinyBtn.on('tap click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 410, y: 110, text: '⚠ Tiny hit area (12×12px)',
    fontSize: 11, fill: '#e67e22', fontFamily: 'system-ui', name: 'tiny-desc',
  }));

  // --- Bad: listening=false blocks events ---
  const blockedGroup = new Konva.Group({ x: 30, y: 160, listening: false, name: 'blocked-parent' });
  layer.add(blockedGroup);
  const blockedChild = new Konva.Rect({
    width: 160, height: 44, fill: '#9b59b6', cornerRadius: 6, name: 'blocked-child',
  });
  blockedGroup.add(blockedChild);
  blockedChild.on('click', () => { /* noop */ });
  blockedGroup.add(new Konva.Text({
    x: 15, y: 12, text: 'Blocked Child', fontSize: 14, fill: '#fff', name: 'blocked-label',
  }));
  layer.add(new Konva.Text({
    x: 30, y: 210, text: '✖ Parent has listening=false, events blocked',
    fontSize: 11, fill: '#9b59b6', fontFamily: 'system-ui', name: 'blocked-desc',
  }));

  // --- Bad: self listening=false but has listeners ---
  const selfBlocked = new Konva.Rect({
    x: 230, y: 160, width: 160, height: 44, fill: '#c0392b', cornerRadius: 6,
    listening: false, name: 'self-blocked',
  });
  layer.add(selfBlocked);
  selfBlocked.on('click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 230, y: 210, text: '✖ Own listening=false with click handler',
    fontSize: 11, fill: '#c0392b', fontFamily: 'system-ui', name: 'selfblocked-desc',
  }));

  // --- Bad: nearly invisible interactive ---
  const ghostBtn = new Konva.Rect({
    x: 430, y: 160, width: 160, height: 44, fill: '#3498db', cornerRadius: 6,
    opacity: 0.05, name: 'ghost-button',
  });
  layer.add(ghostBtn);
  ghostBtn.on('click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 430, y: 210, text: '⚠ Nearly invisible (opacity=0.05) + click',
    fontSize: 11, fill: '#3498db', fontFamily: 'system-ui', name: 'ghost-desc',
  }));

  // --- Bad: hidden but has listeners ---
  const hiddenBtn = new Konva.Rect({
    x: 630, y: 160, width: 160, height: 44, fill: '#1abc9c', cornerRadius: 6,
    visible: false, name: 'hidden-button',
  });
  layer.add(hiddenBtn);
  hiddenBtn.on('click', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 630, y: 210, text: '✖ visible=false but has click handler',
    fontSize: 11, fill: '#1abc9c', fontFamily: 'system-ui', name: 'hidden-desc',
  }));

  // --- Multiple issues at once ---
  const multiIssue = new Konva.Circle({
    x: 80, y: 290, radius: 8, fill: '#e74c3c', opacity: 0.08,
  });
  layer.add(multiIssue);
  multiIssue.on('click tap', () => { /* noop */ });
  layer.add(new Konva.Text({
    x: 30, y: 310, text: '⚠⚠ No name + tiny + nearly invisible',
    fontSize: 11, fill: '#e74c3c', fontFamily: 'system-ui', name: 'multi-desc',
  }));

  // --- Non-interactive (no issues expected) ---
  layer.add(new Konva.Rect({
    x: 230, y: 270, width: 200, height: 50, fill: '#34495e', cornerRadius: 6, name: 'decoration',
  }));
  layer.add(new Konva.Text({
    x: 240, y: 283, text: 'Non-interactive (no listeners)',
    fontSize: 13, fill: '#95a5a6', fontFamily: 'system-ui', name: 'deco-label',
  }));
  layer.add(new Konva.Text({
    x: 230, y: 330, text: '✓ No events = no a11y issues expected',
    fontSize: 11, fill: '#2ecc71', fontFamily: 'system-ui', name: 'deco-desc',
  }));

  // --- Legend ---
  layer.add(new Konva.Text({
    x: 20, y: 380, fontSize: 13, fontFamily: 'system-ui, sans-serif', fill: '#95a5a6',
    lineHeight: 1.8, name: 'legend',
    text: [
      'Legend (select nodes above, check Accessibility section in inspector):',
      '  ✓  No issues — properly named, sized, and configured',
      '  ⚠  Warning — missing name, too small, or nearly invisible',
      '  ✖  Error — listening blocked, hidden with listeners',
    ].join('\n'),
  }));

  return stage;
}
