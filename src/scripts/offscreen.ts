/**
 * Marks each page band (`main section`) with `data-offscreen` while none of
 * it is on screen. `global.css` pauses every CSS animation inside a marked
 * band, so looping blinks and pulses stop when nobody can see them, and
 * one-shot fills wait to play until their band scrolls in. Scripted loops
 * (canvas, WebGL, timers) gate themselves on visibility in their own code.
 */
const observer = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries)
    target.toggleAttribute('data-offscreen', !isIntersecting)
})

for (const band of document.querySelectorAll('main section'))
  observer.observe(band)
