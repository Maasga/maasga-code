/* MAASGA — comportements globaux du site (extraits de Layout.tsx).
 * Chargé une seule fois via <script defer> ; le routeur PJAX ne remplace que <main>.
 * Compilé/minifié par scripts/build-assets.mjs -> public/static/js/site.js
 */

/* ---- bloc 1 ---- */
          // Hide loader (rapide si déjà visité)
          (function() {
            function hideLoader() {
              var l = document.getElementById('page-loader');
              if (!l || l.style.display === 'none') return;
              l.style.opacity = '0';
              l.style.visibility = 'hidden';
              setTimeout(function() { l.style.display = 'none'; }, 350);
            }
            // Use DOMContentLoaded instead of load — don't wait for external fonts/images
            if (document.readyState !== 'loading') { setTimeout(hideLoader, 50); }
            else { document.addEventListener('DOMContentLoaded', function() { setTimeout(hideLoader, 50); }); }
          })();

          // Scroll reveal (+ left/right variants) — classe legacy .visible
          var legacyRevealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                legacyRevealObserver.unobserve(entry.target);
              }
            });
          }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

          // Moteur de révélation data-* — robuste, indépendant de GSAP.
          // Ajoute .in dès que l'élément entre à l'écran (CSS gère l'anim + cascade).
          var revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObserver.unobserve(entry.target);
              }
            });
          }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });

          // Animated number counters
          var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var el = entry.target;
                var target = el.getAttribute('data-count');
                var isNum = /^\d+$/.test(target);
                // La valeur finale est déjà rendue côté serveur : l'animation n'est qu'un bonus
                if (isNum && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                  var end = parseInt(target);
                  var duration = 1800;
                  var startTime = null;
                  function animate(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min((timestamp - startTime) / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.floor(eased * end) + (el.getAttribute('data-suffix') || '');
                    if (progress < 1) requestAnimationFrame(animate);
                  }
                  requestAnimationFrame(animate);
                }
                counterObserver.unobserve(el);
              }
            });
          }, { threshold: 0.3 });

          // Attache les 3 observers ci-dessus à tout élément concerné sous root —
          // document au chargement initial, le nouveau <main> après un swap de
          // transition async (voir bloc "ASYNC PAGE TRANSITIONS" plus bas).
          function initPageBehaviors(root) {
            root = root || document;
            root.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(function(el) { legacyRevealObserver.observe(el); });
            root.querySelectorAll('[data-reveal],[data-stagger],[data-hero]').forEach(function(el) { revealObserver.observe(el); });
            root.querySelectorAll('[data-count]').forEach(function(el) { counterObserver.observe(el); });
          }
          window.__maasgaInitPageBehaviors = initPageBehaviors;

          document.addEventListener('DOMContentLoaded', function() {
            // Close "Plus" dropdown on outside click
            document.addEventListener('click', function(e) {
              var dd = document.getElementById('nav-more-dropdown');
              var wr = document.getElementById('nav-more-wrapper');
              if (dd && wr && !wr.contains(e.target)) dd.classList.add('hidden');
            });
            // Close mobile menu on link click
            document.querySelectorAll('#mobile-menu a').forEach(function(a) {
              a.addEventListener('click', function() {
                var m = document.getElementById('mobile-menu');
                if (m) m.classList.remove('open');
              });
            });

            // Profile avatar: show first letter of name when logged in
            (function() {
              fetch('/api/session-check', { credentials: 'same-origin' })
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function(data) {
                  if (data && data.loggedIn && data.name) {
                    var btn = document.getElementById('user-nav-btn');
                    if (!btn) return;
                    var letter = data.name.trim().charAt(0).toUpperCase();
                    btn.innerHTML = '<span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0077b6,#0ea5e9);color:#fff;font-weight:800;font-size:0.85rem;display:flex;align-items:center;justify-content:center;pointer-events:none;">' + letter + '</span>';
                    btn.style.padding = '0';
                    btn.title = data.name;
                  }
                })
                .catch(function() {});
            })();

            initPageBehaviors(document);

            var backToTop = document.getElementById('back-to-top');
            var headerPill = document.getElementById('header-pill');
            window.addEventListener('scroll', function() {
              var scrollTop = window.scrollY;
              if (backToTop) backToTop.style.display = scrollTop > 400 ? 'flex' : 'none';
              if (headerPill) headerPill.classList.toggle('scrolled', scrollTop > 20);
            }, { passive: true });
          });

/* ---- bloc 2 ---- */
          (function() {
            var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            function initGsap(root) {
              root = root || document;
              if (!window.gsap || !window.ScrollTrigger) return false;
              var gsap = window.gsap;
              gsap.registerPlugin(window.ScrollTrigger);

              // Les reveals/cascades sont gérés en CSS+IntersectionObserver (robuste).
              // GSAP n'ajoute QUE des enrichissements. Distinction clé sous reduced-motion :
              //  - parallax = mouvement AUTOMATIQUE au scroll → désactivé sous reduced-motion.
              //  - tilt + CTA magnétiques = interactions DIRECTES au pointeur (déclenchées par
              //    l'utilisateur, pas auto-jouées) → CONSERVÉS même sous reduced-motion, sinon
              //    l'effet demandé ne se voit jamais chez un utilisateur qui a « réduire les
              //    animations » activé (cas de l'owner de ce site).
              if (!reduce) {
                gsap.utils.toArray(root.querySelectorAll('[data-parallax]')).forEach(function(el) {
                  var amount = parseFloat(el.getAttribute('data-parallax')) || 30;
                  amount = Math.max(-80, Math.min(80, amount));
                  gsap.to(el, {
                    y: amount, ease: 'none',
                    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
                  });
                });
              }

              if (finePointer) {
                root.querySelectorAll('.magnetic').forEach(function(btn) {
                  btn.addEventListener('mousemove', function(e) {
                    var r = btn.getBoundingClientRect();
                    var mx = e.clientX - r.left - r.width / 2;
                    var my = e.clientY - r.top - r.height / 2;
                    gsap.to(btn, { x: mx * 0.22, y: my * 0.3, duration: 0.4, ease: 'power3.out' });
                  });
                  btn.addEventListener('mouseleave', function() {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                  });
                });

                // Tilt 3D « carte entière » (type Tympanus) — SEULE la carte s'incline (plus
                // de couches internes qui glissent, plus de reflet). Suivi RÉACTIF de la
                // souris : lissage court (0.14s) + overwrite:'auto' pour que chaque mouvement
                // reprenne la main immédiatement (sinon les tweens s'empilent et l'effet
                // « traîne »). Rebond élastique accentué au départ du curseur.
                root.querySelectorAll('[data-tilt]').forEach(function(card) {
                  gsap.set(card, { transformPerspective: 900, transformOrigin: 'center' });
                  var rect = null;
                  card.addEventListener('mouseenter', function() { rect = card.getBoundingClientRect(); });
                  card.addEventListener('mousemove', function(e) {
                    if (!rect) rect = card.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width - 0.5;
                    var y = (e.clientY - rect.top) / rect.height - 0.5;
                    gsap.to(card, {
                      rotateY: x * 20, rotateX: -y * 20,
                      duration: 0.14, ease: 'power2.out', overwrite: 'auto'
                    });
                  });
                  card.addEventListener('mouseleave', function() {
                    rect = null;
                    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1.05, ease: 'elastic.out(1.3, 0.3)', overwrite: 'auto' });
                  });
                });
              }
              return true;
            }
            window.__maasgaReinitGsap = initGsap;

            // GSAP est chargé en <script defer> depuis un CDN : sur un réseau lent le
            // download peut prendre plusieurs secondes (mesuré ~5s ici). L'ancienne fenêtre
            // de 3s abandonnait avant que window.gsap soit prêt → le tilt/parallax ne
            // s'attachaient jamais au 1er chargement (il fallait naviguer pour re-déclencher
            // l'init). On élargit le poll à ~20s ET on relance au 'load' de la fenêtre (qui
            // ne se déclenche qu'une fois les scripts defer téléchargés, même très tard).
            var gsapInited = initGsap(document);
            if (!gsapInited) {
              var tries = 0;
              var iv = setInterval(function() {
                tries++;
                if (!gsapInited) gsapInited = initGsap(document);
                if (gsapInited || tries > 400) clearInterval(iv);
              }, 50);
              window.addEventListener('load', function() {
                if (!gsapInited) gsapInited = initGsap(document);
              });
            }
          })();

/* ---- bloc 3 ---- */
          (function() {
            var MIN_DISPLAY_MS = 900;
            var FETCH_TIMEOUT_MS = 5000;
            var ROUTE_LABELS = (window.__MAASGA_ROUTE_LABELS__ || {});
            var navigationInProgress = false;

            function labelForPath(pathname) {
              if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
              var segment = pathname.split('/').filter(Boolean).pop() || 'Accueil';
              return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            }

            function showOverlay(label) {
              var overlay = document.getElementById('page-transition');
              var text = document.getElementById('page-transition-text');
              if (!overlay || !text) return;
              text.textContent = label;
              text.classList.remove('pt-slide');
              void text.offsetWidth; // force reflow so the animation restarts every time
              text.classList.add('pt-slide');
              overlay.style.opacity = '1';
              overlay.style.pointerEvents = 'all';
            }

            function hideOverlay() {
              var overlay = document.getElementById('page-transition');
              if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
              }
            }

            function runNewMainScripts(main) {
              main.querySelectorAll('script').forEach(function(oldScript) {
                var newScript = document.createElement('script');
                for (var i = 0; i < oldScript.attributes.length; i++) {
                  var attr = oldScript.attributes[i];
                  newScript.setAttribute(attr.name, attr.value);
                }
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
              });
            }

            function syncNavActiveState(doc) {
              var oldHeader = document.querySelector('header');
              var newHeader = doc.querySelector('header');
              if (!oldHeader || !newHeader) return;
              // Le header est rendu par le MÊME composant Layout pour chaque page :
              // l'ordre des <a href> est identique d'une page à l'autre, seul l'état
              // actif change. On apparie donc par INDEX (et non par href) — car le
              // même href apparaît dans plusieurs variantes (nav xl / nav lg /
              // dropdown / menu mobile) ET comme CTA (bouton "Rendez-vous"), chacun
              // avec un style actif différent. L'ancien appariement par href
              // recopiait la classe de CHAQUE nouveau lien vers TOUS les anciens de
              // même href : le dernier dans l'ordre DOM (souvent un CTA non-actif)
              // écrasait l'état actif du vrai lien nav → aucune page marquée active.
              var oldLinks = oldHeader.querySelectorAll('a[href]');
              var newLinks = newHeader.querySelectorAll('a[href]');
              if (oldLinks.length === newLinks.length) {
                for (var i = 0; i < oldLinks.length; i++) {
                  var oldLink = oldLinks[i], newLink = newLinks[i];
                  oldLink.className = newLink.className;
                  if (newLink.hasAttribute('aria-current')) oldLink.setAttribute('aria-current', newLink.getAttribute('aria-current'));
                  else oldLink.removeAttribute('aria-current');
                  if (newLink.hasAttribute('style')) oldLink.setAttribute('style', newLink.getAttribute('style'));
                  else oldLink.removeAttribute('style');
                  var newIcon = newLink.querySelector('i.fas');
                  var oldIcon = oldLink.querySelector('i.fas');
                  if (newIcon && oldIcon && newIcon.hasAttribute('style')) oldIcon.setAttribute('style', newIcon.getAttribute('style'));
                }
              }
              // Bouton "Plus" (dropdown lg) : ce n'est pas un <a href>, on le
              // synchronise à part pour qu'il s'illumine quand la page courante est
              // l'une de ses entrées (À propos / Espace client).
              var oldPlus = oldHeader.querySelector('#nav-more-wrapper > button');
              var newPlus = newHeader.querySelector('#nav-more-wrapper > button');
              if (oldPlus && newPlus) oldPlus.className = newPlus.className;
              var oldEyebrow = oldHeader.querySelector('.eyebrow');
              var newEyebrow = newHeader.querySelector('.eyebrow');
              if (oldEyebrow && newEyebrow) {
                oldEyebrow.textContent = newEyebrow.textContent;
              } else if (oldEyebrow && !newEyebrow) {
                oldEyebrow.remove();
              }
            }

            function swapContent(html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var newMain = doc.getElementById('main-content');
              var currentMain = document.getElementById('main-content');
              if (!newMain || !currentMain) return false;
              newMain = document.adoptNode(newMain);
              if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach(function(st) {
                  if (st.trigger && currentMain.contains(st.trigger)) st.kill();
                });
              }
              currentMain.replaceWith(newMain);
              document.title = doc.title;
              syncNavActiveState(doc);
              runNewMainScripts(newMain);
              if (window.__maasgaInitPageBehaviors) window.__maasgaInitPageBehaviors(newMain);
              if (window.__maasgaReinitGsap) window.__maasgaReinitGsap(newMain);
              return true;
            }

            function navigate(href, isPopstate) {
              if (navigationInProgress) return;
              navigationInProgress = true;
              // Replie toute navigation ouverte AVANT la transition — sinon le
              // dropdown "Plus" (fermé uniquement au clic extérieur) et le menu
              // mobile restent ouverts par-dessus la nouvelle page.
              var dd = document.getElementById('nav-more-dropdown');
              if (dd) dd.classList.add('hidden');
              var mm = document.getElementById('mobile-menu');
              if (mm) mm.classList.remove('open');
              var burger = document.querySelector('button[aria-controls="mobile-menu"]');
              if (burger) {
                burger.setAttribute('aria-expanded', 'false');
                var bi = burger.querySelector('i');
                if (bi) bi.className = 'fas fa-bars text-lg';
              }
              var pathname = href.split('?')[0].split('#')[0];
              var supportsVT = typeof document.startViewTransition === 'function';
              // Le morph View Transitions (sans overlay) est réservé aux navigations
              // catalogue ↔ fiche produit (/catalogue/:id) — là où une image partage un
              // view-transition-name. Partout ailleurs on garde l'overlay navy (« preloader »)
              // à texte glissant, historique du site.
              function isProductPath(p) { return /^\/catalogue\/[0-9]+$/.test(p); }
              var here = window.location.pathname;
              // Morph uniquement sur catalogue → fiche produit, et fiche produit → catalogue.
              // Quitter une fiche vers une AUTRE page (ex: contact) garde l'overlay navy.
              var useMorph = supportsVT && (isProductPath(pathname) || (isProductPath(here) && pathname === '/catalogue'));

              var controller = new AbortController();
              var timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);
              var fetchPromise = fetch(href, { credentials: 'same-origin', signal: controller.signal })
                .then(function(res) {
                  clearTimeout(timeoutId);
                  if (!res.ok) throw new Error('HTTP ' + res.status);
                  return res.text();
                });

              function finishNav(html) {
                var ok = swapContent(html);
                if (!ok) { window.location.href = href; return false; }
                if (!isPopstate) { history.pushState(null, '', href); window.scrollTo(0, 0); }
                if (typeof window.gtag === 'function') {
                  window.gtag('event', 'page_view', { page_path: pathname, page_title: document.title });
                }
                return true;
              }

              if (useMorph) {
                // Navigation catalogue ↔ fiche produit : le crossfade + le morph de l'image
                // (view-transition-name partagé) SONT la transition — pas d'overlay navy,
                // il masquerait le morph.
                fetchPromise.then(function(html) {
                  var vt = document.startViewTransition(function() { finishNav(html); });
                  vt.finished.then(function() { navigationInProgress = false; }, function() { navigationInProgress = false; });
                }).catch(function() {
                  navigationInProgress = false;
                  window.location.href = href;
                });
              } else {
                // Toutes les autres navigations : overlay navy à texte glissant (« preloader ») + swap.
                showOverlay(labelForPath(pathname));
                var minTimer = new Promise(function(resolve) { setTimeout(resolve, MIN_DISPLAY_MS); });
                Promise.all([fetchPromise, minTimer]).then(function(results) {
                  finishNav(results[0]);
                  hideOverlay();
                  navigationInProgress = false;
                }).catch(function() {
                  navigationInProgress = false;
                  window.location.href = href;
                });
              }
            }

            document.addEventListener('click', function(e) {
              var link = e.target.closest('a[href]');
              if (!link) return;
              if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              var href = link.getAttribute('href');
              if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('/admin') || link.target === '_blank') return;
              e.preventDefault();
              navigate(href, false);
            });

            window.__maasgaNavigate = navigate; // exposé pour le hardening des tâches suivantes

            window.addEventListener('popstate', function() {
              navigate(window.location.pathname + window.location.search, true);
            });
          })();

/* ---- bloc 4 ---- */
          (function() {
            const hasAccepted = localStorage.getItem('maasga_cgu_accepted') === 'true'
            if (!hasAccepted) {
              setTimeout(() => {
                const modal = document.getElementById('cgu-modal')
                if (modal) modal.classList.remove('hidden')
              }, 500)
            }
            const checkbox = document.getElementById('accept-cgu')
            const acceptBtn = document.getElementById('accept-btn')
            if (checkbox && acceptBtn) {
              checkbox.addEventListener('change', () => {
                acceptBtn.disabled = !checkbox.checked
              })
            }
            window.acceptCGU = () => {
              const checkbox = document.getElementById('accept-cgu')
              if (checkbox?.checked) {
                localStorage.setItem('maasga_cgu_accepted', 'true');
                // Legacy: also keep version info in a separate key (does not bloat the check key)
                localStorage.setItem('maasga_cgu_meta', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  version: '1.0'
                }))
                const modal = document.getElementById('cgu-modal')
                if (modal) modal.classList.add('hidden')
              }
            }
          })()

/* ---- bloc 5 ---- */
          function toggleWaPanel() {
            const panel = document.getElementById('wa-panel');
            const iconOpen = document.getElementById('wa-icon-open');
            const iconClose = document.getElementById('wa-icon-close');
            const dot = document.getElementById('wa-notif-dot');
            const isOpen = panel.style.display !== 'none';
            if (isOpen) {
              panel.style.display = 'none';
              iconOpen.style.display = '';
              iconClose.style.display = 'none';
            } else {
              panel.style.display = '';
              panel.style.animation = 'none';
              void panel.offsetWidth;
              panel.style.animation = 'waPop 0.22s cubic-bezier(.34,1.56,.64,1) both';
              iconOpen.style.display = 'none';
              iconClose.style.display = '';
              dot.style.display = 'none';
            }
          }
          function closeWaPanel() {
            document.getElementById('wa-panel').style.display = 'none';
            document.getElementById('wa-icon-open').style.display = '';
            document.getElementById('wa-icon-close').style.display = 'none';
          }
          function openWa(msg) {
            window.open('https://wa.me/22655996418?text=' + encodeURIComponent(msg), '_blank');
          }
          // Auto-open after 30s on first visit (only if user hasn't dismissed, no DNT)
          if (!sessionStorage.getItem('wa_shown') && navigator.doNotTrack !== '1') {
            setTimeout(function() {
              if (document.getElementById('wa-panel').style.display === 'none') {
                toggleWaPanel();
                sessionStorage.setItem('wa_shown', '1');
              }
            }, 30000);
          }

/* ---- bloc 6 ---- */
          (function() {
            var consent = localStorage.getItem('maasga_cookies_accepted');
            if (consent === null) {
              setTimeout(function() {
                var b = document.getElementById('cookie-banner');
                if (b) b.style.display = 'block';
              }, 2000);
            }
          })();
          function handleCookieConsent(accepted) {
            localStorage.setItem('maasga_cookies_accepted', accepted ? 'true' : 'false');
            document.getElementById('cookie-banner').style.display = 'none';
            if (accepted && typeof gtag === 'function') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          }

/* ---- bloc 7 ---- */
          window.showToast = function(msg, type) {
            type = type || 'info';
            var colors = {
              success: 'linear-gradient(135deg,#059669,#10b981)',
              error: 'linear-gradient(135deg,#dc2626,#ef4444)',
              warning: 'linear-gradient(135deg,#d97706,#f59e0b)',
              info: 'linear-gradient(135deg,#0ea5e9,#3b82f6)'
            };
            var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            var container = document.getElementById('toast-container');
            var el = document.createElement('div');
            el.className = 'pointer-events-auto flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium';
            el.style.cssText = 'background:' + (colors[type]||colors.info) + ';animation:slideInRight .35s ease-out;border:1px solid rgba(255,255,255,0.15);';
            var ico = document.createElement('i');
            ico.className = 'fas ' + (icons[type]||icons.info) + ' text-lg opacity-90';
            var sp = document.createElement('span');
            sp.textContent = msg;
            el.appendChild(ico);
            el.appendChild(sp);
            container.appendChild(el);
            setTimeout(function() {
              el.style.animation = 'fadeOutRight .35s ease-in forwards';
              setTimeout(function() { el.remove(); }, 350);
            }, 4000);
          };

          // Focus trap utility for modals
          window.__focusTrapStack = [];
          window.trapFocus = function(modalEl) {
            var focusable = modalEl.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            function handler(e) {
              if (e.key !== 'Tab') return;
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            }
            modalEl.__focusTrapHandler = handler;
            modalEl.addEventListener('keydown', handler);
            window.__focusTrapStack.push(modalEl);
            first.focus();
          };
          window.releaseFocus = function(modalEl) {
            if (modalEl && modalEl.__focusTrapHandler) {
              modalEl.removeEventListener('keydown', modalEl.__focusTrapHandler);
              delete modalEl.__focusTrapHandler;
            }
            window.__focusTrapStack = window.__focusTrapStack.filter(function(m) { return m !== modalEl; });
          };

          // Alerte réappro stock (utilisée par les cartes catalogue et la page produit)
          window.submitStockAlert = function(productId) {
            var phoneEl = document.getElementById('stock-phone-' + productId) || document.getElementById('modal-stock-phone');
            var phone = phoneEl ? phoneEl.value.trim() : '';
            if (!phone || phone.length < 8) {
              alert('Veuillez saisir un numéro de téléphone valide.');
              return;
            }
            var fd = new FormData();
            fd.append('product_id', String(productId));
            fd.append('phone', phone);
            fetch('/api/stock-alert', { method: 'POST', body: fd })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                if (data.ok) {
                  var safeMsg = (data.message || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                  var container = document.getElementById('stock-alert-' + productId);
                  if (container) {
                    container.innerHTML = '<div class="text-xs text-center py-2 rounded-lg" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);"><i class="fas fa-check-circle mr-1"></i>' + safeMsg + '</div>';
                  }
                  var modalForm = document.getElementById('modal-stock-form');
                  if (modalForm) {
                    modalForm.parentElement.innerHTML = '<div style="text-align:center;padding:12px;border-radius:12px;background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.2);font-size:0.85rem;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + safeMsg + '</div>';
                  }
                } else {
                  alert(data.error || 'Erreur, réessayez.');
                }
              })
              .catch(function() { alert('Erreur réseau.'); });
          };

/* ---- bloc 8 ---- */
          (function(){
            function boot(){
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              if (typeof Lenis === 'undefined') return;
              var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
              window.__lenis = lenis;
              var usingGsap = false;
              // Fallback rAF : garantit que Lenis avance même si GSAP tarde (jamais de scroll figé)
              function raf(t){ if (!usingGsap) { lenis.raf(t); requestAnimationFrame(raf); } }
              requestAnimationFrame(raf);
              function wire(){
                if (window.gsap && window.ScrollTrigger) {
                  lenis.on('scroll', ScrollTrigger.update);
                  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
                  gsap.ticker.lagSmoothing(0);
                  usingGsap = true; // stoppe le fallback à sa prochaine frame
                  return true;
                }
                return false;
              }
              if (!wire()) { var n = 0, iv = setInterval(function(){ n++; if (wire() || n > 60) clearInterval(iv); }, 50); }
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
          })();

/* ---- PWA : service worker + boîte d'envoi hors connexion ---- */
(function () {
  var secure = location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  if ('serviceWorker' in navigator && secure) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}) })
  }

  // Formulaires marqués data-offline-queue : si l'envoi échoue faute de réseau, la demande
  // est gardée sur l'appareil puis renvoyée automatiquement au retour de la connexion.
  var KEY = 'maasga_outbox'
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch (e) { return [] } }
  function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch (e) {} }
  function toast(msg, type) { if (window.showToast) window.showToast(msg, type); }

  document.addEventListener('submit', function (e) {
    var form = e.target
    if (!form || !form.hasAttribute || !form.hasAttribute('data-offline-queue')) return
    if (navigator.onLine !== false) return
    e.preventDefault()
    var fields = {}
    new FormData(form).forEach(function (v, k) { if (typeof v === 'string') fields[k] = v })
    var list = read()
    list.push({ action: form.getAttribute('action'), fields: fields, at: Date.now(), label: form.getAttribute('data-offline-queue') || 'demande' })
    write(list)
    toast('Pas de connexion : nous enverrons votre ' + (form.getAttribute('data-offline-queue') || 'demande') + ' automatiquement dès le retour du réseau.', 'warning')
  }, true)

  var flushing = false
  function flush() {
    if (flushing || navigator.onLine === false) return
    var list = read()
    if (!list.length) return
    flushing = true
    var item = list[0]
    var body = new FormData()
    Object.keys(item.fields).forEach(function (k) { body.append(k, item.fields[k]) })
    fetch(item.action, { method: 'POST', body: body, credentials: 'same-origin', redirect: 'manual' })
      .then(function (res) {
        // le serveur répond par une redirection (succès ou message d'erreur)
        var ok = res.type === 'opaqueredirect' || res.ok
        write(read().slice(1))
        if (ok) toast('Connexion rétablie : envoi de votre ' + item.label + ' effectué.', 'success')
      })
      .catch(function () {})
      .then(function () { flushing = false; if (read().length) setTimeout(flush, 1500) })
  }
  window.addEventListener('online', flush)
  if (document.readyState === 'complete') flush(); else window.addEventListener('load', flush)
})();
