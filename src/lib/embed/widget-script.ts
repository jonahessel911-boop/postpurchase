/** Vanilla JS widget: popup on submit + legacy div embed. */
export function buildPostpurchaseEmbedScript(appOrigin: string): string {
  const safeOrigin = appOrigin.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `(function () {
  var ORIGIN = '${safeOrigin}';
  var ATTR = 'data-postpurchase-placement';
  var ACCENT = '#5B47FB';

  function sanitizeText(s) {
    return String(s || '')
      .replace(/\\s*[-–—•|]?\\s*cpc\\s*model\\s*/gi, ' ')
      .replace(/\\bcpc\\s*model\\b/gi, '')
      .replace(/\\s{2,}/g, ' ')
      .trim();
  }

  function injectStyles(root) {
    var style = document.createElement('style');
    style.textContent = [
      '.pp-root{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased}',
      '.pp-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999998;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}',
      '.pp-popup-panel{position:relative;max-width:400px;width:100%;max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:20px 20px 16px;box-shadow:0 24px 48px rgba(0,0,0,.18);box-sizing:border-box}',
      '.pp-popup-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;padding-right:28px}',
      '.pp-check{width:32px;height:32px;border-radius:50%;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;font-weight:700}',
      '.pp-popup-title{margin:0;font-size:15px;font-weight:600;line-height:1.35}',
      '.pp-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;cursor:pointer;font-size:20px;color:#a1a1aa;line-height:1}',
      '.pp-close:hover{background:#f4f4f5;color:#52525b}',
      '.pp-offers{display:flex;flex-direction:column;gap:8px}',
      '.pp-row-popup{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f4f4f5;border-radius:12px;text-decoration:none;color:inherit;background:#fff;transition:background .15s}',
      '.pp-row-popup:hover{background:#fafafa;border-color:#e4e4e7}',
      '.pp-thumb{width:56px;height:56px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#f4f4f5}',
      '.pp-thumb img,.pp-thumb video{width:100%;height:100%;object-fit:cover;display:block}',
      '.pp-row-body{flex:1;min-width:0}',
      '.pp-row-title{margin:0;font-size:14px;font-weight:600}',
      '.pp-row-desc{margin:4px 0 0;font-size:12px;color:#71717a;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.pp-btn-round{width:40px;height:40px;border-radius:50%;background:' + ACCENT + ';color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}',
      '.pp-dismiss{display:block;width:100%;margin-top:12px;padding:8px;border:0;background:transparent;font-size:13px;font-weight:500;color:#a1a1aa;cursor:pointer}',
      '.pp-dismiss:hover{color:#52525b}',
      '.pp-empty{padding:20px;text-align:center;font-size:13px;color:#71717a}',
      '.pp-native-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
      '.pp-native-title{margin:0;font-size:16px;font-weight:600}',
      '.pp-row-native{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f4f4f5;border-radius:12px;text-decoration:none;color:inherit;margin-bottom:8px}',
      '.pp-row-native:hover{border-color:#e4e4e7}',
      '.pp-chevron{color:#d4d4d8;font-size:18px;flex-shrink:0}',
      '.pp-trust{margin-top:16px;padding:16px;border-radius:14px;background:#fafafa;border:1px solid #f4f4f5}',
      '.pp-trust-title{text-align:center;margin:0 0 12px;font-size:13px;font-weight:600}',
      '.pp-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}',
      '.pp-trust-item{font-size:10px;color:#71717a;line-height:1.35}',
      '.pp-trust-item strong{display:block;font-size:11px;color:#27272a;margin-bottom:2px}'
    ].join('');
    root.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mediaHtml(offer) {
    var url = offer.media_url || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80';
    if (offer.media_type === 'video') {
      return '<video src="' + escapeHtml(url) + '" autoplay muted loop playsinline></video>';
    }
    return '<img src="' + escapeHtml(url) + '" alt="" loading="lazy" />';
  }

  function buildClickUrl(offer, data, widgetUrl) {
    var u = new URL(data.api_domain + '/click/' + offer.campaign_id);
    u.searchParams.set('widget_url', widgetUrl);
    u.searchParams.set('publisher_id', data.publisher_id);
    if (data.intent_product) u.searchParams.set('intent_product', data.intent_product);
    u.searchParams.set('product_choose', offer.product_label);
    u.searchParams.set('product_selection', JSON.stringify(
      (data.offers || []).map(function (o) { return o.product_label; })
    ));
    u.searchParams.set('placement', data.placement);
    u.searchParams.set('ad_id', offer.ad_id);
    if (data.geo) u.searchParams.set('geo', data.geo);
    return u.toString();
  }

  function popupRowHtml(offer, clickUrl) {
    var title = escapeHtml(sanitizeText(offer.title));
    var desc = sanitizeText(offer.subheadline || '');
    return '<a class="pp-row-popup" href="' + escapeHtml(clickUrl) + '" rel="noopener sponsored">' +
      '<div class="pp-thumb">' + mediaHtml(offer) + '</div>' +
      '<div class="pp-row-body"><p class="pp-row-title">' + title + '</p>' +
      (desc ? '<p class="pp-row-desc">' + escapeHtml(desc) + '</p>' : '') +
      '</div><span class="pp-btn-round" aria-hidden="true">›</span></a>';
  }

  function nativeRowHtml(offer, clickUrl) {
    var title = escapeHtml(sanitizeText(offer.title));
    var desc = sanitizeText(offer.subheadline || '');
    return '<a class="pp-row-native" href="' + escapeHtml(clickUrl) + '" rel="noopener sponsored">' +
      '<div class="pp-thumb">' + mediaHtml(offer) + '</div>' +
      '<div class="pp-row-body"><p class="pp-row-title">' + title + '</p>' +
      (desc ? '<p class="pp-row-desc">' + escapeHtml(desc) + '</p>' : '') +
      '</div><span class="pp-chevron" aria-hidden="true">›</span></a>';
  }

  function renderPopupModal(payload, enriched, widgetUrl) {
    var existing = document.getElementById('pp-popup-root');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'pp-popup-root';
    overlay.className = 'pp-popup-overlay pp-root';

    var panel = document.createElement('div');
    panel.className = 'pp-popup-panel';

    var close = document.createElement('button');
    close.className = 'pp-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Sluiten');
    close.innerHTML = '×';
    close.onclick = function () { overlay.remove(); };

    var count = (payload.offers || []).length;
    var head = '<div class="pp-popup-head"><span class="pp-check" aria-hidden="true">✓</span>' +
      '<h2 class="pp-popup-title">' + count + ' relevante aanbiedingen voor jou gevonden</h2></div>';

    var list = document.createElement('div');
    list.className = 'pp-offers';

    if (!payload.offers || !payload.offers.length) {
      list.innerHTML = '<div class="pp-empty">Geen aanbiedingen beschikbaar.</div>';
    } else {
      payload.offers.forEach(function (offer) {
        var clickUrl = buildClickUrl(offer, enriched, widgetUrl);
        var el = document.createElement('div');
        el.innerHTML = popupRowHtml(offer, clickUrl);
        list.appendChild(el.firstChild);
      });
    }

    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'pp-dismiss';
    dismiss.textContent = 'Nee, bedankt';
    dismiss.onclick = function () { overlay.remove(); };

    panel.innerHTML = head;
    panel.appendChild(close);
    panel.appendChild(list);
    panel.appendChild(dismiss);
    overlay.appendChild(panel);
    injectStyles(overlay);
    document.body.appendChild(overlay);
  }

  function renderNative(host, payload, enriched, widgetUrl) {
    var shadow = host.attachShadow({ mode: 'open' });
    injectStyles(shadow);
    var root = document.createElement('div');
    root.className = 'pp-root';

    var html = '';
    if (!payload.offers || !payload.offers.length) {
      html += '<div class="pp-empty">Geen aanbiedingen beschikbaar.</div>';
    } else {
      payload.offers.forEach(function (offer) {
        html += nativeRowHtml(offer, buildClickUrl(offer, enriched, widgetUrl));
      });
    }
    root.innerHTML = html;
    shadow.appendChild(root);
  }

  function openPopup(placementId, opts) {
    opts = opts || {};
    var geo = opts.geo || '';
    var widgetUrl = opts.widgetUrl || window.location.href;

    fetch(ORIGIN + '/api/widget/offers?placement_id=' + encodeURIComponent(placementId))
      .then(function (r) { return r.json(); })
      .then(function (payload) {
        if (payload.error) throw new Error(payload.error);
        var enriched = {
          publisher_id: payload.publisher_id,
          intent_product: payload.intent_product,
          placement: payload.placement || 'popup',
          offers: payload.offers,
          api_domain: opts.apiDomain || payload.api_domain || '',
          geo: geo
        };
        renderPopupModal(payload, enriched, widgetUrl);
      })
      .catch(function (err) {
        console.error('[PostPurchase]', err);
      });
  }

  function attachSubmit(placementId, opts) {
    opts = opts || {};
    var id = opts.submitElementId || opts.elementId;
    if (!id) {
      console.error('[PostPurchase] submitElementId is required for popup');
      return;
    }
    var el = document.getElementById(id);
    if (!el) {
      console.error('[PostPurchase] Submit element not found: #' + id);
      return;
    }
    el.addEventListener('click', function () {
      openPopup(placementId, opts);
    });
  }

  function boot(host) {
    var placementId = host.getAttribute(ATTR) || host.getAttribute('data-placement');
    if (!placementId) return;
    var geo = host.getAttribute('data-geo') || '';
    var widgetUrl = host.getAttribute('data-widget-url') || window.location.href;

    fetch(ORIGIN + '/api/widget/offers?placement_id=' + encodeURIComponent(placementId))
      .then(function (r) { return r.json(); })
      .then(function (payload) {
        if (payload.error) throw new Error(payload.error);
        var enriched = {
          publisher_id: payload.publisher_id,
          intent_product: payload.intent_product,
          placement: payload.placement,
          offers: payload.offers,
          api_domain: host.getAttribute('data-api-domain') || payload.api_domain || '',
          geo: geo
        };
        if (payload.placement === 'popup') {
          renderPopupModal(payload, enriched, widgetUrl);
        } else {
          renderNative(host, payload, enriched, widgetUrl);
        }
      })
      .catch(function (err) {
        console.error('[PostPurchase]', err);
      });
  }

  function init() {
    var nodes = document.querySelectorAll('[' + ATTR + '], [data-placement]');
    if (!nodes.length) return;
    nodes.forEach(boot);
  }

  window.PostPurchase = {
    attachSubmit: attachSubmit,
    openPopup: openPopup,
    boot: boot
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;
}
