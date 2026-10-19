// Every buy link on the page goes here.
const CHECKOUT_URL = 'https://whop.com/checkout/plan_HuqZigB6WGDvW';

// Creator attribution: ?a=creatorname and any utm_ parameters are kept for
// 30 days and passed through to the checkout, so creators get paid.
const ATTRIBUTION_KEY = 'tfp_attribution';
const ATTRIBUTION_DAYS = 30;

function isTracked(key) {
  return key === 'a' || /^utm_[a-z0-9_]+$/i.test(key);
}

function readIncoming() {
  const found = {};
  new URLSearchParams(window.location.search).forEach(function (value, key) {
    value = value.trim();
    if (isTracked(key) && value) found[key] = value.slice(0, 200);
  });
  return found;
}

function readStored() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY));
    if (!saved || typeof saved.params !== 'object' || typeof saved.savedAt !== 'number') return {};
    if (Date.now() - saved.savedAt > ATTRIBUTION_DAYS * 864e5) {
      window.localStorage.removeItem(ATTRIBUTION_KEY);
      return {};
    }
    return saved.params;
  } catch (e) {
    return {};
  }
}

function store(params) {
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ params: params, savedAt: Date.now() }));
  } catch (e) {
    // Storage blocked (private browsing, in-app browsers). This visit still passes them through.
  }
}

function attribution() {
  const incoming = readIncoming();
  if (!Object.keys(incoming).length) return readStored();

  // A new creator link starts fresh; utm-only visits keep the creator already on file.
  const params = 'a' in incoming ? incoming : Object.assign({}, readStored(), incoming);
  store(params);
  return params;
}

function checkoutHref(params) {
  const url = new URL(CHECKOUT_URL);
  Object.keys(params).forEach(function (key) {
    if (isTracked(key)) url.searchParams.set(key, params[key]);
  });
  return url.toString();
}

const href = checkoutHref(attribution());
document.querySelectorAll('[data-checkout]').forEach(function (link) {
  link.href = href;
});

// Sample pages open larger in a dialog. Escape and a click outside the page close it.
const viewer = document.querySelector('.viewer');

if (viewer && typeof viewer.showModal === 'function') {
  const viewerImg = viewer.querySelector('img');
  const viewerCaption = viewer.querySelector('figcaption');
  let opener = null;

  document.querySelectorAll('.sheet-open').forEach(function (button) {
    button.addEventListener('click', function () {
      const thumb = button.querySelector('img');
      const caption = button.parentElement.querySelector('.caption');
      opener = button;
      viewerImg.src = button.dataset.full;
      viewerImg.alt = thumb.alt;
      viewerCaption.textContent = caption ? caption.textContent : '';
      viewer.showModal();
    });
  });

  viewer.querySelector('.viewer-close').addEventListener('click', function () {
    viewer.close();
  });

  viewer.addEventListener('click', function (event) {
    if (event.target === viewer || event.target === viewer.querySelector('figure')) viewer.close();
  });

  viewer.addEventListener('close', function () {
    if (opener) opener.focus();
  });
}
