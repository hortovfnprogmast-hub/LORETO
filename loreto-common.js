/**
 * loreto-common.js
 * Funciones compartidas de la aplicación Loreto Ingeniería.
 *
 * Debe cargarse DESPUÉS de Firebase y Lucide en cada página:
 *   <script src="loreto-common.js"></script>
 *
 * Funciones expuestas:
 *   - filtrarMenuPorPrivilegio()   : oculta secciones del sidebar con data-privilegio="1" si el usuario tiene privilegio "2"
 *   - initLogoutFlotante()         : inyecta el botón rojo "Cerrar sesión" flotante bajo el logo superior derecho
 *   - cerrarSesion()               : limpia localStorage y redirige a index.html
 *   - mostrarAlertaLoreto(msg, tipo)   : reemplaza alert() nativo. tipo: 'info'|'success'|'error'|'warning'
 *   - mostrarConfirmLoreto(msg, onSi, onNo) : reemplaza confirm() nativo
 *
 * Convención de privilegios (Google Sheets, columna E):
 *   1 = menú completo abierto (admin / contador)
 *   2 = solo sección Trabajador (personal de campo)
 */
(function () {
    'use strict';

    // Evitar doble carga
    if (window.__loretoCommonLoaded) return;
    window.__loretoCommonLoaded = true;

    // ==========================================
    // CSS compartido (inyectado una sola vez)
    // ==========================================
    var STYLE_ID = 'loreto-common-css';
    if (!document.getElementById(STYLE_ID)) {
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent =
            /* Contenedor del logo superior derecho + popup logout */ +
            ".loreto-logo-wrap { position: relative; display: inline-flex; align-items: center; cursor: pointer; }" +
            ".loreto-logout-popup {" +
            "  display: none; position: absolute; top: calc(100% + 8px); right: 0; z-index: 1000;" +
            "  animation: loretoPopIn 0.18s ease-out;" +
            "}" +
            ".loreto-logout-popup.show { display: block; }" +
            ".loreto-logout-btn {" +
            "  background: #dc2626; color: #ffffff; border: none; padding: 10px 18px;" +
            "  border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;" +
            "  display: inline-flex; align-items: center; gap: 8px;" +
            "  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.45); white-space: nowrap;" +
            "  font-family: 'Inter', 'Segoe UI', sans-serif; transition: background 0.2s;" +
            "}" +
            ".loreto-logout-btn:hover { background: #b91c1c; }" +
            ".loreto-logout-btn svg, .loreto-logout-btn i { width: 16px; height: 16px; }" +

            /* Modal Loreto (alertas y confirmaciones) */ +
            ".loreto-modal-overlay {" +
            "  position: fixed; top: 0; left: 0; width: 100%; height: 100%;" +
            "  background: rgba(0,0,0,0.6); z-index: 10001;" +
            "  display: none; align-items: center; justify-content: center;" +
            "  padding: 20px; box-sizing: border-box;" +
            "}" +
            ".loreto-modal-overlay.show { display: flex; }" +
            ".loreto-modal-card {" +
            "  background: #ffffff; border-radius: 16px; padding: 28px 24px;" +
            "  width: 100%; max-width: 360px; text-align: center;" +
            "  box-shadow: 0 12px 32px rgba(0,0,0,0.25);" +
            "  animation: loretoPopIn 0.25s ease-out;" +
            "  font-family: 'Inter', 'Segoe UI', sans-serif;" +
            "}" +
            ".loreto-modal-icon { width: 52px; height: 52px; margin: 0 auto 14px auto; display: block; }" +
            ".loreto-modal-msg {" +
            "  font-size: 15px; color: #1e293b; margin: 0 0 22px 0; line-height: 1.5; font-weight: 500;" +
            "  white-space: pre-wrap; word-wrap: break-word;" +
            "}" +
            ".loreto-modal-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }" +
            ".loreto-modal-btn {" +
            "  border: none; padding: 11px 22px; border-radius: 8px;" +
            "  font-size: 14px; font-weight: 700; cursor: pointer;" +
            "  font-family: 'Inter', 'Segoe UI', sans-serif; transition: background 0.2s;" +
            "  min-width: 110px;" +
            "}" +
            ".loreto-modal-btn.primary { background: #263fa4; color: #ffffff; }" +
            ".loreto-modal-btn.primary:hover { background: #1a2a6e; }" +
            ".loreto-modal-btn.danger { background: #dc2626; color: #ffffff; }" +
            ".loreto-modal-btn.danger:hover { background: #b91c1c; }" +
            ".loreto-modal-btn.success { background: #10b981; color: #ffffff; }" +
            ".loreto-modal-btn.success:hover { background: #059669; }" +
            ".loreto-modal-btn.neutral { background: #e2e8f0; color: #1e293b; }" +
            ".loreto-modal-btn.neutral:hover { background: #cbd5e1; }" +

            "@keyframes loretoPopIn {" +
            "  from { transform: translateY(-8px) scale(0.96); opacity: 0; }" +
            "  to   { transform: translateY(0) scale(1); opacity: 1; }" +
            "}";
        document.head.appendChild(style);
    }

    // ==========================================
    // 1. PRIVILEGIOS DEL MENÚ LATERAL
    // ==========================================
    // Oculta las secciones del sidebar marcadas con data-privilegio="1"
    // cuando el usuario logueado tiene privilegio "2" (personal de campo).
    // Llamar DESPUÉS de que el fetch('menu.html') haya insertado el HTML.
    window.filtrarMenuPorPrivilegio = function () {
        var priv = localStorage.getItem('privilegio');
        if (String(priv) !== '2') return; // privilegio 1 o no definido => menú completo
        var sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.querySelectorAll('[data-privilegio="1"]').forEach(function (el) {
            el.style.display = 'none';
        });
    };

    // ==========================================
    // 2. CERRAR SESIÓN
    // ==========================================
    window.cerrarSesion = function () {
        try {
            localStorage.removeItem('usuario');
            localStorage.removeItem('privilegio');
            localStorage.removeItem('nombre');
        } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
    };

    // ==========================================
    // 3. LOGOUT POR CLIC EN LOGO SUPERIOR DERECHO
    // ==========================================
    // El logo de la esquina superior derecha funciona directamente como
    // botón de cerrar sesión. Al hacer clic, muestra una confirmación Loreto.
    // Si se confirma, limpia localStorage y redirige a index.html.
    // Idempotente: seguro llamar varias veces.
    window.initLogoutFlotante = function () {
        var headerRight = document.querySelector('.header-right');
        if (!headerRight) return;
        if (headerRight.dataset.loretoLogoutInit) return; // ya inicializado

        var logo = headerRight.querySelector('img');
        if (!logo) return;

        // Indicar visualmente que el logo es clicable
        logo.style.cursor = 'pointer';
        logo.title = 'Cerrar sesión';

        logo.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof window.mostrarConfirmLoreto === 'function') {
                window.mostrarConfirmLoreto('¿Deseas cerrar sesión?', function () {
                    window.cerrarSesion();
                });
            } else {
                window.cerrarSesion();
            }
        });

        headerRight.dataset.loretoLogoutInit = 'true';
    };

    // ==========================================
    // 4. ALERTA LORETO (reemplaza alert() nativo del navegador)
    // ==========================================
    // tipo: 'info' | 'success' | 'error' | 'warning'
    window.mostrarAlertaLoreto = function (mensaje, tipo) {
        tipo = tipo || 'info';
        var icons = {
            info:    { name: 'info',          color: '#263fa4', btn: 'primary' },
            success: { name: 'check-circle',  color: '#10b981', btn: 'success' },
            error:   { name: 'alert-triangle',color: '#dc2626', btn: 'danger'  },
            warning: { name: 'alert-circle',  color: '#f59e0b', btn: 'primary' }
        };
        var cfg = icons[tipo] || icons.info;
        var safe = String(mensaje == null ? '' : mensaje).replace(/</g, '&lt;');

        var overlay = document.createElement('div');
        overlay.className = 'loreto-modal-overlay';
        overlay.innerHTML =
            '<div class="loreto-modal-card">' +
                '<i data-lucide="' + cfg.name + '" class="loreto-modal-icon" style="color:' + cfg.color + ';"></i>' +
                '<p class="loreto-modal-msg">' + safe + '</p>' +
                '<div class="loreto-modal-btns">' +
                    '<button class="loreto-modal-btn ' + cfg.btn + '" type="button">Aceptar</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();
        void overlay.offsetWidth; // forzar reflow para animación
        overlay.classList.add('show');

        var cerrar = function () {
            overlay.classList.remove('show');
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 220);
        };
        overlay.querySelector('button').addEventListener('click', cerrar);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrar();
        });
        var escHandler = function (e) {
            if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    };

    // ==========================================
    // 5. CONFIRMACIÓN LORETO (reemplaza confirm() nativo)
    // ==========================================
    // Uso: mostrarConfirmLoreto("¿Eliminar?", function() { /* al Sí */ }, function() { /* al No (opcional) */ })
    window.mostrarConfirmLoreto = function (mensaje, onSi, onNo) {
        var safe = String(mensaje == null ? '' : mensaje).replace(/</g, '&lt;');
        var overlay = document.createElement('div');
        overlay.className = 'loreto-modal-overlay';
        overlay.innerHTML =
            '<div class="loreto-modal-card">' +
                '<i data-lucide="help-circle" class="loreto-modal-icon" style="color:#263fa4;"></i>' +
                '<p class="loreto-modal-msg">' + safe + '</p>' +
                '<div class="loreto-modal-btns">' +
                    '<button class="loreto-modal-btn neutral" type="button" data-role="no">No, cancelar</button>' +
                    '<button class="loreto-modal-btn danger"  type="button" data-role="si">Sí, continuar</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();
        void overlay.offsetWidth;
        overlay.classList.add('show');

        var cerrar = function () {
            overlay.classList.remove('show');
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 220);
        };
        overlay.querySelector('[data-role="si"]').addEventListener('click', function () {
            cerrar(); if (typeof onSi === 'function') onSi();
        });
        overlay.querySelector('[data-role="no"]').addEventListener('click', function () {
            cerrar(); if (typeof onNo === 'function') onNo();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrar();
        });
    };

})();
