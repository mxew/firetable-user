// ─── Floating UI Popover Positioning ────────────────────────────────────────
// Shared utility: positions a floating element anchored to a reference element.
// arrowEl is optional (pass null for no arrow).

firetable.ui.positionPopover = function (anchorEl, floatingEl, arrowEl) {
  var middleware = [
    FloatingUIDOM.offset(8),
    FloatingUIDOM.flip(),
    FloatingUIDOM.shift({ padding: 8 })
  ];
  if (arrowEl) {
    middleware.push(FloatingUIDOM.arrow({ element: arrowEl }));
  }
  FloatingUIDOM.computePosition(anchorEl, floatingEl, {
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: middleware
  }).then(function (pos) {
    floatingEl.style.left = pos.x + 'px';
    floatingEl.style.top  = pos.y + 'px';

    if (arrowEl && pos.middlewareData.arrow) {
      var ax = pos.middlewareData.arrow.x;
      var ay = pos.middlewareData.arrow.y;
      var staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[pos.placement.split('-')[0]];
      Object.assign(arrowEl.style, {
        left:   ax != null ? ax + 'px' : '',
        top:    ay != null ? ay + 'px' : '',
        right:  '',
        bottom: '',
        [staticSide]: '-4px'
      });
    }
  });
};
