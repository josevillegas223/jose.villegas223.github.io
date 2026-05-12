(() => {
  const DEFAULT_STORAGE_KEY = "lumenhogar-mapa-v1";
  const numberFormat = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const ROOMS = [
    { name: "Sala", hint: "TV, ventilacion y descanso", area: "sala" },
    { name: "Cocina", hint: "Frio y calor del hogar", area: "cocina" },
    { name: "Comedor", hint: "Apoyo e iluminacion", area: "comedor" },
    { name: "Recamara", hint: "Uso nocturno y confort", area: "recamara" },
    { name: "Estudio", hint: "Trabajo, red y carga", area: "estudio" },
    { name: "Lavanderia", hint: "Ciclos de lavado", area: "lavanderia" }
  ];

  const PRESETS = [
    { label: "Refrigerador", power: 350, room: "Cocina", short: "RF", tip: "Revisa sellos y evita abrirlo de forma constante." },
    { label: "Television", power: 120, room: "Sala", short: "TV", tip: "Activa modo ahorro y desconectala si queda en espera." },
    { label: "Aire acondicionado", power: 1500, room: "Recamara", short: "AC", tip: "Mantenlo entre 24 y 26 C y limpia filtros." },
    { label: "Computadora", power: 300, room: "Estudio", short: "PC", tip: "Usa suspension automatica cuando no la estes usando." },
    { label: "Microondas", power: 1200, room: "Cocina", short: "MW", tip: "Agrupa calentamientos cortos para reducir picos." },
    { label: "Foco LED", power: 10, room: "Comedor", short: "LED", tip: "Mantener iluminacion LED ayuda a bajar el consumo base." },
    { label: "Lavadora", power: 800, room: "Lavanderia", short: "LV", tip: "Aprovecha cargas completas y agua fria si es posible." },
    { label: "Ventilador", power: 75, room: "Recamara", short: "VT", tip: "Usalo junto con ventilacion natural para reducir horas." },
    { label: "Router", power: 18, room: "Estudio", short: "RT", tip: "Si no se usa por la noche, define horarios de apagado." },
    { label: "Cafetera", power: 900, room: "Cocina", short: "CF", tip: "Evita dejarla encendida mas tiempo del necesario." },
    { label: "Consola", power: 180, room: "Sala", short: "GS", tip: "Desconectala si suele quedarse en modo espera." }
  ];

  const DEFAULT_SEED = [
    { name: "Refrigerador", power: 350, hours: 24, days: 30, room: "Cocina", short: "RF", x: 28, y: 38 },
    { name: "Television principal", power: 120, hours: 5, days: 30, room: "Sala", short: "TV", x: 62, y: 42 },
    { name: "Computadora de estudio", power: 300, hours: 8, days: 22, room: "Estudio", short: "PC", x: 46, y: 46 },
    { name: "Lavadora", power: 800, hours: 1.4, days: 16, room: "Lavanderia", short: "LV", x: 40, y: 48 },
    { name: "Lampara de comedor", power: 12, hours: 6, days: 30, room: "Comedor", short: "LED", x: 52, y: 42 }
  ];

  const AUTO_POINTS = {
    Sala: [
      { x: 24, y: 34 }, { x: 56, y: 36 }, { x: 76, y: 58 }, { x: 34, y: 70 }
    ],
    Cocina: [
      { x: 26, y: 30 }, { x: 64, y: 34 }, { x: 40, y: 64 }, { x: 74, y: 70 }
    ],
    Comedor: [
      { x: 32, y: 34 }, { x: 62, y: 34 }, { x: 48, y: 64 }, { x: 76, y: 62 }
    ],
    Recamara: [
      { x: 26, y: 34 }, { x: 60, y: 32 }, { x: 48, y: 66 }, { x: 76, y: 58 }
    ],
    Estudio: [
      { x: 26, y: 36 }, { x: 60, y: 34 }, { x: 46, y: 68 }, { x: 76, y: 56 }
    ],
    Lavanderia: [
      { x: 28, y: 34 }, { x: 56, y: 34 }, { x: 76, y: 56 }, { x: 40, y: 68 }
    ]
  };

  const instances = [];

  const safeText = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const slug = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const formatNumber = (value) => numberFormat.format(Number(value || 0));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const computeConsumption = (power, hours, days) => (Number(power || 0) * Number(hours || 0) * Number(days || 0)) / 1000;

  const getPreset = (label) => PRESETS.find((preset) => preset.label === label) || null;

  const inferPreset = (name) => {
    const plain = String(name || "").toLowerCase();
    return PRESETS.find((preset) => plain.includes(preset.label.toLowerCase())) || null;
  };

  const inferRoom = (name) => {
    const plain = String(name || "").toLowerCase();
    if (/(refrigerador|microondas|cafetera|horno|licuadora)/.test(plain)) {
      return "Cocina";
    }
    if (/(lavadora|secadora|plancha)/.test(plain)) {
      return "Lavanderia";
    }
    if (/(computadora|impresora|router|modem)/.test(plain)) {
      return "Estudio";
    }
    if (/(foco|lampara)/.test(plain)) {
      return "Comedor";
    }
    if (/(ventilador|aire|cargador)/.test(plain)) {
      return "Recamara";
    }
    return "Sala";
  };

  const abbreviation = (name) => {
    const parts = String(name || "AP")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    return parts.slice(0, 3) || "AP";
  };

  const roomNames = () => ROOMS.map((room) => room.name);

  const roomHint = (roomName) => (ROOMS.find((room) => room.name === roomName) || {}).hint || "Organiza tus aparatos aqui.";

  const autoPointFor = (roomName, count) => {
    const points = AUTO_POINTS[roomName] || [{ x: 50, y: 50 }];
    const point = points[count % points.length];
    return { x: point.x, y: point.y };
  };

  const normalizePosition = (x, y) => ({
    x: clamp(Number(x || 50), 12, 88),
    y: clamp(Number(y || 50), 16, 86)
  });

  const normalizeDevice = (source, roomCountMap) => {
    const preset = inferPreset(source.name || source.nombre || "");
    const name = source.name || source.nombre || "Aparato";
    const room = roomNames().includes(source.room) ? source.room : inferRoom(name);
    const power = Number(source.power || source.potencia || 0);
    const hours = Number(source.hours || source.horas || 0);
    const days = Number(source.days || source.dias || 30);
    const consumption = Number(source.consumption || source.consumo || computeConsumption(power, hours, days));
    const count = roomCountMap ? (roomCountMap[room] || 0) : 0;
    const fallbackPoint = autoPointFor(room, count);
    const position = normalizePosition(source.x || fallbackPoint.x, source.y || fallbackPoint.y);

    if (roomCountMap) {
      roomCountMap[room] = count + 1;
    }

    return {
      id: source.id || `device-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name,
      power,
      hours,
      days,
      room,
      consumption,
      short: source.short || (preset ? preset.short : abbreviation(name)),
      tip: source.tip || (preset ? preset.tip : "Evalua si este aparato puede usarse menos tiempo o en un horario mas eficiente."),
      type: source.type || (preset ? slug(preset.label) : slug(name)),
      x: position.x,
      y: position.y
    };
  };

  const normalizeDevices = (devices) => {
    const countMap = {};
    return (devices || []).map((device) => normalizeDevice(device, countMap));
  };

  const loadState = (storageKey) => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveState = (storageKey, devices) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(devices));
    } catch (error) {
      return;
    }
  };

  const summarizeByRoom = (devices) => {
    const summary = {};
    ROOMS.forEach((room) => {
      summary[room.name] = { total: 0, devices: [] };
    });

    devices.forEach((device) => {
      if (!summary[device.room]) {
        summary[device.room] = { total: 0, devices: [] };
      }
      summary[device.room].total += device.consumption;
      summary[device.room].devices.push(device);
    });

    return summary;
  };

  const roomLoad = (total) => {
    if (!total) {
      return "empty";
    }
    if (total >= 120) {
      return "high";
    }
    if (total >= 50) {
      return "medium";
    }
    return "low";
  };

  const roomStrategy = (roomName) => {
    if (roomName === "Cocina") {
      return "Agrupa usos cortos de calor y revisa la eficiencia del refrigerador.";
    }
    if (roomName === "Sala") {
      return "Desconecta equipos en espera y evita usar entretenimiento y clima al mismo tiempo.";
    }
    if (roomName === "Comedor") {
      return "Aprovecha iluminacion LED y evita dejar luces encendidas sin necesidad.";
    }
    if (roomName === "Recamara") {
      return "Controla equipos nocturnos y regula ventilacion o aire acondicionado.";
    }
    if (roomName === "Estudio") {
      return "Activa suspension automatica y evita dejar perifericos conectados sin uso.";
    }
    if (roomName === "Lavanderia") {
      return "Concentra cargas completas y evita ciclos parciales cuando sea posible.";
    }
    return "Revisa horarios y eficiencia de los equipos ubicados en esta zona.";
  };

  const buildSummary = (devices) => {
    const rooms = summarizeByRoom(devices);
    let total = 0;
    let topRoom = null;
    let topDevice = null;

    devices.forEach((device) => {
      total += device.consumption;
      if (!topDevice || device.consumption > topDevice.consumption) {
        topDevice = device;
      }
    });

    ROOMS.forEach((room) => {
      const current = rooms[room.name];
      if (!topRoom || current.total > topRoom.total) {
        topRoom = { name: room.name, total: current.total, count: current.devices.length };
      }
    });

    return {
      total,
      rooms,
      topRoom,
      topDevice,
      estimatedCost: total * 1.2,
      estimatedCO2: total * 0.43
    };
  };

  const buildRecommendations = (devices, summary, selectedRoom) => {
    if (!devices.length) {
      return [
        {
          title: "Crea tu mapa base",
          body: "Agrega tus aparatos principales y despues ubicalos dentro del plano para detectar las zonas de mayor impacto.",
          priority: "low"
        }
      ];
    }

    const cards = [];
    const topRoom = summary.topRoom;
    const topDevice = summary.topDevice;

    if (selectedRoom && summary.rooms[selectedRoom] && summary.rooms[selectedRoom].devices.length) {
      cards.push({
        title: `Foco en ${selectedRoom}`,
        body: `${selectedRoom} concentra ${formatNumber(summary.rooms[selectedRoom].total)} kWh/mes. ${roomStrategy(selectedRoom)}`,
        priority: roomLoad(summary.rooms[selectedRoom].total)
      });
    }

    if (summary.total >= 300) {
      cards.push({
        title: "Consumo mensual alto",
        body: "Tu consumo ya esta en una zona alta. Conviene atacar primero el aparato mas demandante y la habitacion de mayor carga.",
        priority: "high"
      });
    } else if (summary.total >= 150) {
      cards.push({
        title: "Consumo mensual medio",
        body: "Estas en un rango donde ajustar horarios y sustituir equipos ineficientes puede dar un ahorro claro.",
        priority: "medium"
      });
    } else {
      cards.push({
        title: "Base de consumo controlada",
        body: "Mantener habitos ordenados y equipos eficientes ayudara a sostener un consumo moderado.",
        priority: "low"
      });
    }

    if (topDevice) {
      cards.push({
        title: `Atiende primero ${topDevice.name}`,
        body: `${topDevice.name} aporta ${formatNumber(topDevice.consumption)} kWh/mes. ${topDevice.tip}`,
        priority: topDevice.consumption >= 150 ? "high" : "medium"
      });
    }

    if (topRoom && summary.total > 0 && topRoom.total / summary.total >= 0.35) {
      cards.push({
        title: `${topRoom.name} domina el consumo`,
        body: `Esta zona representa ${formatNumber((topRoom.total / summary.total) * 100)}% del consumo mensual. ${roomStrategy(topRoom.name)}`,
        priority: topRoom.total >= 120 ? "high" : "medium"
      });
    }

    const standbyCount = devices.filter((device) => /(television|computadora|router|consola|monitor)/.test(device.type)).length;
    if (standbyCount >= 2) {
      cards.push({
        title: "Reduce cargas fantasma",
        body: "Tienes varios equipos de uso continuo o en espera. Una regleta con interruptor puede ayudarte a cortar consumo silencioso.",
        priority: "medium"
      });
    }

    return cards.slice(0, 5);
  };

  const buildOptions = () => {
    const presetOptions = PRESETS.map((preset) => `<option value="${safeText(preset.label)}">${safeText(preset.label)}</option>`).join("");
    return `<option value="">Selecciona un aparato comun</option>${presetOptions}`;
  };

  const buildRoomOptions = () => roomNames()
    .map((roomName) => `<option value="${safeText(roomName)}">${safeText(roomName)}</option>`)
    .join("");

  const buildRoomMarkup = () => ROOMS.map((room) => `
    <article class="eco-room" data-room-card="${safeText(room.name)}" data-load="empty" style="grid-area:${room.area}">
      <div class="eco-room-head">
        <div>
          <h4>${safeText(room.name)}</h4>
          <p>${safeText(room.hint)}</p>
        </div>
        <strong data-room-total="${safeText(room.name)}">0 kWh/mes</strong>
      </div>
      <div class="eco-room-meter"><span data-room-meter="${safeText(room.name)}"></span></div>
      <div class="eco-room-meta">
        <span data-room-count="${safeText(room.name)}">0 aparatos</span>
        <button type="button" data-room-filter="${safeText(room.name)}">Ver zona</button>
      </div>
      <div class="eco-room-canvas" data-room-canvas="${safeText(room.name)}">
        <p class="eco-room-empty">Selecciona un aparato y colocalo aqui.</p>
      </div>
    </article>
  `).join("");

  const buildFormMarkup = () => `
    <div class="eco-map-form">
      <div class="eco-map-form-grid">
        <label>
          Preset
          <select data-role="preset">${buildOptions()}</select>
        </label>
        <label>
          Habitacion
          <select data-role="room">${buildRoomOptions()}</select>
        </label>
        <label>
          Nombre del aparato
          <input data-role="name" placeholder="Ej. TV principal">
        </label>
        <label>
          Potencia (W)
          <input data-role="power" type="number" min="1" placeholder="Ej. 120">
        </label>
        <label>
          Horas por dia
          <input data-role="hours" type="number" min="0.1" step="0.1" placeholder="Ej. 4">
        </label>
        <label>
          Dias por mes
          <input data-role="days" type="number" min="1" max="31" value="30">
        </label>
      </div>
      <div class="eco-map-actions">
        <button type="button" class="eco-map-primary" data-action="add">Agregar aparato</button>
        <button type="button" class="eco-map-secondary" data-action="sample">Cargar ejemplo</button>
        <button type="button" class="eco-map-secondary" data-action="sync">Importar inventario</button>
        <button type="button" class="eco-map-secondary" data-action="clear-all">Limpiar mapa</button>
      </div>
    </div>
  `;

  const buildVisualToolbar = () => `
    <div class="eco-map-tools">
      <button type="button" class="eco-map-secondary" data-action="sample">Cargar ejemplo</button>
      <button type="button" class="eco-map-secondary" data-action="clear-all">Limpiar mapa</button>
      <button type="button" class="eco-map-secondary" data-action="clear-room">Ver toda la casa</button>
    </div>
  `;

  const buildTemplate = (mode) => `
    <section class="eco-map-shell">
      <div class="eco-map-header">
        <div class="eco-map-copy">
          <p class="eco-map-overline">Mapa interactivo</p>
          <h2>Plano de LumenHogar</h2>
          <p>Ubica aparatos dentro de cada habitacion, compara cargas por zona y recibe recomendaciones segun el consumo registrado.</p>
        </div>
        <div class="eco-map-kpis">
          <article class="eco-map-kpi"><span>Consumo total</span><strong data-kpi="total">0 kWh/mes</strong></article>
          <article class="eco-map-kpi"><span>Aparatos</span><strong data-kpi="count">0 aparatos</strong></article>
          <article class="eco-map-kpi"><span>Zona critica</span><strong data-kpi="room">Sin datos</strong></article>
          <article class="eco-map-kpi"><span>Aparato principal</span><strong data-kpi="device">Sin datos</strong></article>
        </div>
      </div>

      <div class="eco-map-layout ${mode === "visual" ? "is-visual" : ""}">
        <aside class="eco-map-side">
          ${mode === "full" ? buildFormMarkup() : buildVisualToolbar()}
          <div class="eco-map-status info" data-role="status">Agrega aparatos y usa el boton "Ubicar" para colocarlos dentro del plano.</div>
          <div class="eco-map-list-head">
            <h3>Aparatos registrados</h3>
            <span data-role="list-caption">Vista general</span>
          </div>
          <div class="eco-map-device-list" data-role="device-list"></div>
        </aside>

        <section class="eco-map-board">
          <div class="eco-map-board-top">
            <div>
              <h3>Plano 2D del hogar</h3>
              <p>Selecciona un aparato y despues haz clic dentro de una habitacion para colocarlo. Tambien puedes moverlo arrastrandolo dentro del cuarto.</p>
            </div>
            <button type="button" class="eco-map-secondary" data-action="clear-room">Ver toda la casa</button>
          </div>
          <div class="eco-map-legend">
            <span><i class="low"></i>Carga baja</span>
            <span><i class="medium"></i>Carga media</span>
            <span><i class="high"></i>Carga alta</span>
          </div>
          <div class="eco-map-focus" data-role="focus">Vista general del hogar.</div>
          <div class="eco-map-floorplan">
            ${buildRoomMarkup()}
          </div>
        </section>
      </div>

      <div class="eco-map-bottom">
        <section class="eco-map-report">
          <h3>Recomendaciones</h3>
          <div class="eco-map-recommendations" data-role="recommendations"></div>
        </section>
        <section class="eco-map-report">
          <h3>Resumen por habitacion</h3>
          <div class="eco-map-room-summary" data-role="room-summary"></div>
        </section>
      </div>
    </section>
  `;

  const emitChange = (root, detail) => {
    root.dispatchEvent(new CustomEvent("ecomapa:change", {
      bubbles: true,
      detail
    }));
  };

  const createDefaultSeed = () => normalizeDevices(DEFAULT_SEED);

  const createInstance = (root) => {
    const mode = root.getAttribute("data-eco-mapa-mode") || "full";
    const persist = root.getAttribute("data-eco-mapa-persist") !== "false";
    const storageKey = root.getAttribute("data-eco-mapa-storage") || DEFAULT_STORAGE_KEY;
    const useSeed = root.getAttribute("data-eco-mapa-seed") === "default";
    const persisted = persist ? loadState(storageKey) : [];

    const state = {
      devices: normalizeDevices(persisted.length ? persisted : (useSeed ? createDefaultSeed() : [])),
      selectedRoom: null,
      placingId: null,
      draggingId: null
    };

    root.classList.add("eco-map-root");
    root.innerHTML = buildTemplate(mode);

    const refs = {
      preset: root.querySelector('[data-role="preset"]'),
      room: root.querySelector('[data-role="room"]'),
      name: root.querySelector('[data-role="name"]'),
      power: root.querySelector('[data-role="power"]'),
      hours: root.querySelector('[data-role="hours"]'),
      days: root.querySelector('[data-role="days"]'),
      status: root.querySelector('[data-role="status"]'),
      focus: root.querySelector('[data-role="focus"]'),
      listCaption: root.querySelector('[data-role="list-caption"]'),
      deviceList: root.querySelector('[data-role="device-list"]'),
      recommendations: root.querySelector('[data-role="recommendations"]'),
      roomSummary: root.querySelector('[data-role="room-summary"]'),
      totalKpi: root.querySelector('[data-kpi="total"]'),
      countKpi: root.querySelector('[data-kpi="count"]'),
      roomKpi: root.querySelector('[data-kpi="room"]'),
      deviceKpi: root.querySelector('[data-kpi="device"]')
    };

    const getSummary = () => buildSummary(state.devices);

    const setStatus = (text, type = "info") => {
      refs.status.textContent = text;
      refs.status.className = `eco-map-status ${type}`;
    };

    const persistIfNeeded = () => {
      if (persist) {
        saveState(storageKey, state.devices);
      }
    };

    const syncExternal = () => {
      persistIfNeeded();
      emitChange(root, {
        devices: state.devices.map((device) => ({ ...device })),
        summary: getSummary(),
        selectedRoom: state.selectedRoom,
        placingId: state.placingId
      });
    };

    const clearForm = () => {
      if (!refs.name) {
        return;
      }
      refs.preset.value = "";
      refs.name.value = "";
      refs.power.value = "";
      refs.hours.value = "";
      refs.days.value = 30;
      refs.room.value = "Sala";
    };

    const applyPreset = () => {
      if (!refs.preset || !refs.preset.value) {
        return;
      }
      const preset = getPreset(refs.preset.value);
      if (!preset) {
        return;
      }
      refs.name.value = preset.label;
      refs.power.value = preset.power;
      refs.room.value = preset.room;
    };

    const selectRoom = (roomName) => {
      state.selectedRoom = roomName || null;
      render();
    };

    const beginPlacement = (id) => {
      const device = state.devices.find((item) => item.id === id);
      if (!device) {
        return;
      }
      state.placingId = id;
      state.selectedRoom = device.room;
      render();
      setStatus(`Selecciona una posicion dentro de ${device.room} para ubicar "${device.name}".`, "warning");
      syncExternal();
    };

    const endPlacement = (message) => {
      state.placingId = null;
      render();
      if (message) {
        setStatus(message, "info");
      }
      syncExternal();
    };

    const placeDevice = (id, roomName, x, y) => {
      const device = state.devices.find((item) => item.id === id);
      if (!device) {
        return;
      }
      const position = normalizePosition(x, y);
      device.room = roomName;
      device.x = position.x;
      device.y = position.y;
      device.consumption = computeConsumption(device.power, device.hours, device.days);
      state.selectedRoom = roomName;
      state.placingId = null;
      render();
      setStatus(`"${device.name}" fue colocado en ${roomName}.`, "info");
      syncExternal();
    };

    const addDevice = (source) => {
      const roomCountMap = {};
      const roomTotals = summarizeByRoom(state.devices);
      Object.keys(roomTotals).forEach((key) => {
        roomCountMap[key] = roomTotals[key].devices.length;
      });

      const device = normalizeDevice(source, roomCountMap);
      state.devices.unshift(device);
      state.selectedRoom = device.room;
      state.placingId = device.id;
      render();
      setStatus(`"${device.name}" fue agregado. Ahora haz clic dentro de ${device.room} para colocarlo.`, "warning");
      syncExternal();
      return device;
    };

    const removeDevice = (id) => {
      const device = state.devices.find((item) => item.id === id);
      state.devices = state.devices.filter((item) => item.id !== id);
      if (state.placingId === id) {
        state.placingId = null;
      }
      render();
      setStatus(device ? `"${device.name}" fue eliminado.` : "Aparato eliminado.", "info");
      syncExternal();
    };

    const loadSample = () => {
      state.devices = createDefaultSeed();
      state.selectedRoom = null;
      state.placingId = null;
      render();
      setStatus("Se cargo un ejemplo inicial para que pruebes el plano del hogar.", "info");
      syncExternal();
    };

    const clearAll = () => {
      state.devices = [];
      state.selectedRoom = null;
      state.placingId = null;
      render();
      setStatus("El plano quedo limpio.", "info");
      syncExternal();
    };

    const importFromMainInventory = () => {
      if (typeof aparatos === "undefined" || !Array.isArray(aparatos)) {
        setStatus("No se encontro el inventario principal. Este boton funcionara al integrarlo dentro de tu pagina base.", "warning");
        return;
      }
      state.devices = normalizeDevices(aparatos);
      state.selectedRoom = null;
      state.placingId = null;
      render();
      setStatus(`${state.devices.length} aparatos fueron importados desde el inventario principal.`, "info");
      syncExternal();
    };

    const setDevices = (devices, options = {}) => {
      const existing = new Map(state.devices.map((device) => [device.id, device]));
      const mapped = (devices || []).map((device) => {
        const current = existing.get(device.id);
        const merged = current ? { ...current, ...device } : device;
        return merged;
      });
      state.devices = normalizeDevices(mapped);
      if (!options.keepSelection) {
        state.selectedRoom = null;
      }
      if (!options.keepPlacing) {
        state.placingId = null;
      }
      render();
      if (!options.silent) {
        syncExternal();
      } else {
        persistIfNeeded();
      }
    };

    const parseCanvasPoint = (canvas, event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      return normalizePosition(x, y);
    };

    const renderRoomCards = (summary) => {
      const maxRoomTotal = Math.max(...ROOMS.map((room) => summary.rooms[room.name].total), 0);
      ROOMS.forEach((room) => {
        const card = root.querySelector(`[data-room-card="${room.name}"]`);
        const totalNode = root.querySelector(`[data-room-total="${room.name}"]`);
        const countNode = root.querySelector(`[data-room-count="${room.name}"]`);
        const meterNode = root.querySelector(`[data-room-meter="${room.name}"]`);
        const canvas = root.querySelector(`[data-room-canvas="${room.name}"]`);
        const roomDevices = summary.rooms[room.name].devices;
        const load = roomLoad(summary.rooms[room.name].total);
        const percent = maxRoomTotal ? clamp((summary.rooms[room.name].total / maxRoomTotal) * 100, 8, 100) : 0;

        totalNode.textContent = `${formatNumber(summary.rooms[room.name].total)} kWh/mes`;
        countNode.textContent = `${roomDevices.length} ${roomDevices.length === 1 ? "aparato" : "aparatos"}`;
        meterNode.style.width = `${percent}%`;
        card.setAttribute("data-load", load);
        card.classList.toggle("is-selected", state.selectedRoom === room.name);
        card.classList.toggle("is-dimmed", Boolean(state.selectedRoom && state.selectedRoom !== room.name));

        if (!roomDevices.length) {
          canvas.innerHTML = '<p class="eco-room-empty">Selecciona un aparato y colocalo aqui.</p>';
          return;
        }

        canvas.innerHTML = roomDevices.map((device) => `
          <button
            type="button"
            class="eco-appliance-marker ${state.placingId === device.id ? "is-placing" : ""}"
            data-device-marker="${safeText(device.id)}"
            style="left:${device.x}%; top:${device.y}%"
            title="${safeText(device.name)}"
          >
            <span>${safeText(device.short)}</span>
            <small>${safeText(device.name)}</small>
          </button>
        `).join("");
      });
    };

    const renderDeviceList = () => {
      const visibleDevices = state.selectedRoom
        ? state.devices.filter((device) => device.room === state.selectedRoom)
        : state.devices.slice();

      refs.listCaption.textContent = state.selectedRoom ? `Vista en ${state.selectedRoom}` : "Vista general";

      if (!visibleDevices.length) {
        refs.deviceList.innerHTML = '<div class="eco-map-empty">No hay aparatos en esta vista.</div>';
        return;
      }

      refs.deviceList.innerHTML = visibleDevices.map((device) => `
        <article class="eco-map-device ${state.placingId === device.id ? "is-active" : ""}">
          <div class="eco-map-device-main">
            <span class="eco-map-badge">${safeText(device.short)}</span>
            <div>
              <strong>${safeText(device.name)}</strong>
              <p>${safeText(device.room)} | ${formatNumber(device.power)} W | ${formatNumber(device.hours)} h/dia</p>
            </div>
          </div>
          <div class="eco-map-device-side">
            <strong>${formatNumber(device.consumption)} kWh/mes</strong>
            <div class="eco-map-row-actions">
              <button type="button" data-action="place" data-device-id="${safeText(device.id)}">Ubicar</button>
              <button type="button" data-action="remove" data-device-id="${safeText(device.id)}">Quitar</button>
            </div>
          </div>
        </article>
      `).join("");
    };

    const renderRoomSummary = (summary) => {
      refs.roomSummary.innerHTML = ROOMS.map((room) => {
        const current = summary.rooms[room.name];
        const percentage = summary.total ? (current.total / summary.total) * 100 : 0;
        return `
          <button type="button" class="eco-room-summary-card ${state.selectedRoom === room.name ? "is-active" : ""}" data-room-filter="${safeText(room.name)}">
            <div>
              <strong>${safeText(room.name)}</strong>
              <span>${current.devices.length} ${current.devices.length === 1 ? "aparato" : "aparatos"}</span>
            </div>
            <div>
              <b>${formatNumber(current.total)} kWh</b>
              <small>${formatNumber(percentage)}%</small>
            </div>
          </button>
        `;
      }).join("");
    };

    const renderRecommendations = (summary) => {
      const cards = buildRecommendations(state.devices, summary, state.selectedRoom);
      refs.recommendations.innerHTML = cards.map((card) => `
        <article class="eco-map-tip" data-priority="${safeText(card.priority)}">
          <strong>${safeText(card.title)}</strong>
          <p>${safeText(card.body)}</p>
        </article>
      `).join("");
    };

    const renderHeader = (summary) => {
      refs.totalKpi.textContent = `${formatNumber(summary.total)} kWh/mes`;
      refs.countKpi.textContent = `${state.devices.length} ${state.devices.length === 1 ? "aparato" : "aparatos"}`;
      refs.roomKpi.textContent = summary.topRoom && summary.topRoom.total ? `${summary.topRoom.name} (${formatNumber(summary.topRoom.total)} kWh)` : "Sin datos";
      refs.deviceKpi.textContent = summary.topDevice ? `${summary.topDevice.name} (${formatNumber(summary.topDevice.consumption)} kWh)` : "Sin datos";
      if (state.selectedRoom && summary.rooms[state.selectedRoom]) {
        refs.focus.textContent = `Filtro activo: ${state.selectedRoom}. Haz clic en otro cuarto o en "Ver toda la casa" para cambiar la vista.`;
      } else if (summary.topRoom && summary.topRoom.total) {
        refs.focus.textContent = `Vista general: ${summary.topRoom.name} es la zona mas cargada con ${formatNumber(summary.topRoom.total)} kWh/mes.`;
      } else {
        refs.focus.textContent = "Vista general del hogar.";
      }
    };

    const render = () => {
      const summary = getSummary();
      renderHeader(summary);
      renderRoomCards(summary);
      renderDeviceList();
      renderRoomSummary(summary);
      renderRecommendations(summary);
      persistIfNeeded();
    };

    if (refs.preset) {
      refs.preset.addEventListener("change", applyPreset);
    }

    root.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      const roomFilter = event.target.closest("[data-room-filter]");
      const roomCard = event.target.closest("[data-room-card]");
      const roomCanvas = event.target.closest("[data-room-canvas]");
      const marker = event.target.closest("[data-device-marker]");

      if (actionButton) {
        const action = actionButton.getAttribute("data-action");
        const id = actionButton.getAttribute("data-device-id");

        if (action === "add" && refs.name) {
          const name = refs.name.value.trim();
          const power = Number(refs.power.value);
          const hours = Number(refs.hours.value);
          const days = Number(refs.days.value);
          const room = refs.room.value;
          const preset = inferPreset(name) || getPreset(refs.preset.value);

          if (!name || !power || !hours || !days) {
            setStatus("Completa nombre, potencia, horas y dias para agregar el aparato.", "warning");
            return;
          }

          addDevice({
            name,
            power,
            hours,
            days,
            room,
            short: preset ? preset.short : abbreviation(name),
            tip: preset ? preset.tip : "Evalua si este aparato puede usarse menos tiempo o en un horario mas eficiente.",
            type: preset ? slug(preset.label) : slug(name)
          });
          clearForm();
          return;
        }

        if (action === "sample") {
          loadSample();
          return;
        }

        if (action === "clear-all") {
          clearAll();
          return;
        }

        if (action === "clear-room") {
          selectRoom(null);
          syncExternal();
          return;
        }

        if (action === "sync") {
          importFromMainInventory();
          return;
        }

        if (action === "place" && id) {
          beginPlacement(id);
          return;
        }

        if (action === "remove" && id) {
          removeDevice(id);
          return;
        }
      }

      if (roomFilter) {
        const roomName = roomFilter.getAttribute("data-room-filter");
        selectRoom(state.selectedRoom === roomName ? null : roomName);
        syncExternal();
        return;
      }

      if (roomCanvas && state.placingId) {
        const roomName = roomCanvas.getAttribute("data-room-canvas");
        const point = parseCanvasPoint(roomCanvas, event);
        placeDevice(state.placingId, roomName, point.x, point.y);
        return;
      }

      if (roomCard && !state.placingId) {
        const roomName = roomCard.getAttribute("data-room-card");
        selectRoom(state.selectedRoom === roomName ? null : roomName);
        syncExternal();
        return;
      }

      if (marker && !state.placingId) {
        const id = marker.getAttribute("data-device-marker");
        const device = state.devices.find((item) => item.id === id);
        if (device) {
          state.selectedRoom = device.room;
          render();
          syncExternal();
        }
      }
    });

    root.addEventListener("pointerdown", (event) => {
      const marker = event.target.closest("[data-device-marker]");
      if (!marker) {
        return;
      }

      const id = marker.getAttribute("data-device-marker");
      const device = state.devices.find((item) => item.id === id);
      if (!device) {
        return;
      }

      event.preventDefault();
      state.draggingId = id;
      marker.setPointerCapture(event.pointerId);
    });

    root.addEventListener("pointermove", (event) => {
      if (!state.draggingId) {
        return;
      }

      const device = state.devices.find((item) => item.id === state.draggingId);
      if (!device) {
        return;
      }

      const canvas = root.querySelector(`[data-room-canvas="${device.room}"]`);
      if (!canvas) {
        return;
      }

      const point = parseCanvasPoint(canvas, event);
      device.x = point.x;
      device.y = point.y;
      render();
    });

    root.addEventListener("pointerup", () => {
      if (!state.draggingId) {
        return;
      }
      state.draggingId = null;
      persistIfNeeded();
      syncExternal();
    });

    render();
    syncExternal();

    return {
      root,
      addDevice,
      beginPlacement,
      clearAll,
      getDevices: () => state.devices.map((device) => ({ ...device })),
      getSummary,
      importFromMainInventory,
      loadSample,
      selectRoom,
      setDevices
    };
  };

  const initAll = () => {
    document.querySelectorAll("[data-eco-mapa3d-root]").forEach((root) => {
      if (root.getAttribute("data-eco-mapa-ready") === "true") {
        return;
      }
      root.setAttribute("data-eco-mapa-ready", "true");
      instances.push(createInstance(root));
    });
  };

  const getInstance = (target) => {
    if (!target) {
      return instances[0] || null;
    }

    if (typeof target === "string") {
      return instances.find((instance) => instance.root.matches(target)) || null;
    }

    return instances.find((instance) => instance.root === target) || null;
  };

  window.EcoMapa3D = {
    initAll,
    getInstance,
    presets: PRESETS.map((preset) => ({ ...preset })),
    rooms: ROOMS.map((room) => ({ ...room }))
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
