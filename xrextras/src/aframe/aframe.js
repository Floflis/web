let xrextrasAframe = null

const AFrameFactory = () => {
  if (!xrextrasAframe) {
    xrextrasAframe = create()
  }

  return xrextrasAframe
}

function create() {
  let registered = false

  const registerXrExtrasComponents = () => {
    // If AFrame is not ready, or we already registered components, skip.
    if (registered || !window.AFRAME) {
      return
    }

    // Only register the components once.
    registered = true

    // Display 'almost there' flows.
    AFRAME.registerComponent('xrextras-almost-there', {
      init: function() {
        const load = () => { XR.addCameraPipelineModule(XRExtras.AlmostThere.pipelineModule()) }
        window.XRExtras && window.XR ? load() : window.addEventListener('xrandextrasloaded', load)
      }
    })

    // Display loading screen.
    AFRAME.registerComponent('xrextras-loading', {
      init: function() {
        let aframeLoaded = false
        this.el.addEventListener('loaded', () => {aframeLoaded = true})
        const aframeDidLoad = () => { return aframeLoaded }
        const onxrloaded = () => { XR.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }
        const load = () => {
          XRExtras.Loading.setAppLoadedProvider(aframeDidLoad)
          XRExtras.Loading.showLoading({onxrloaded})
        }
        window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load)
      }
    })

    // Show an error-handling scene on error.
    AFRAME.registerComponent('xrextras-runtime-error', {
      init: function() {
        const load = () => { XR.addCameraPipelineModule(XRExtras.RuntimeError.pipelineModule()) }
        window.XRExtras && window.XR ? load() : window.addEventListener('xrandextrasloaded', load)
      }
    })

    // Recenter the scene when the screen is tapped.
    AFRAME.registerComponent('xrextras-tap-recenter', {
      init: function() {
        const scene = this.el.sceneEl
        scene.addEventListener('click', () => { scene.emit('recenter', {}) })
      }
    })
  }

  // Eagerly try to register the aframe components, if aframe has already loaded.
  registerXrExtrasComponents()

  return {
    // Register the XRExtras components. This should only be called after AFrame has loaded.
    registerXrExtrasComponents
  }
}

// We want to start showing the loading screen eagerly (before AFRAME has loaded and parsed the
// scene and set up everything). We also need to work around a bug in the AFRAME loading in iOS
// Webviews for almost there.
const eagerload = () => {
  // Manually traverse the dom for an aframe scene and check its attributes.
  const scene = document.getElementsByTagName('a-scene')[0]
  if (!scene) {
    return
  }
  const attrs = scene.attributes

  // In some iOS webviews, AFRAME is never properly loaded. We need to recover from this by
  // expressly triggering a compatibility check (which will fail in these cases) regardless of
  // whether the camera framework is successfully run.
  Object.keys(attrs).forEach(a => {
    const attr = attrs.item(a).name
    if (attr == 'xrextras-almost-there') {
      window.XR
        ? window.XRExtras.AlmostThere.checkCompatibility()
        : window.addEventListener('xrloaded', window.XRExtras.AlmostThere.checkCompatibility)
    }

    if (attr == 'xrextras-loading') {
      window.XRExtras.Loading.showLoading()
    }
  })
}

const oldonload = window.onload
const aframeonload = () => {
  if (oldonload) {
    oldonload()
  }
  window.XRExtras ? eagerload() : window.addEventListener('xrextrasloaded', eagerload)
}
window.onload = aframeonload

module.exports = {
  AFrameFactory,
}
