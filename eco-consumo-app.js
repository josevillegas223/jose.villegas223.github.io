(() => {
  const STORAGE_KEY = "lumenhogar-web-v1";
  const navMeta = {
    inicio: {
      title: "Haz visible la energia de tu casa",
      copy: "Empieza con el perfil del hogar, registra aparatos con nombres personalizados y observa como cambia el consumo al ubicarlos dentro del plano."
    },
    registro: {
      title: "Construye el perfil energetico del hogar",
      copy: "Cuanto mejor definido este el contexto de tu vivienda, mas utiles y aterrizadas seran las recomendaciones."
    },
    aparatos: {
      title: "Crea tu inventario electrico",
      copy: "Agrega equipos por nombre, potencia y uso real para que el analisis del hogar se parezca a tu rutina diaria."
    },
    consumo: {
      title: "Lee el consumo por zonas",
      copy: "No solo importa cuanto consumes, sino en que habitaciones y en que aparatos se concentra la carga mensual."
    },
    reportes: {
      title: "Convierte datos en decisiones",
      copy: "LumenHogar sintetiza la informacion del mapa y del inventario para senalar prioridades concretas."
    },
    mapa: {
      title: "Ordena tu hogar en el plano",
      copy: "Coloca los aparatos dentro de sus espacios reales para descubrir con claridad donde esta el peso energetico."
    }
  };

  const defaultUser = {
    name: "",
    homeType: "",
    members: "",
    city: "",
    goal: "",
    ratePlan: "",
    monthlyGoal: ""
  };

  const refs = {
    heroTitle: document.querySelector("[data-hero-title]"),
    heroCopy: document.querySelector("[data-hero-copy]"),
    navButtons: document.querySelectorAll("[data-section-target]"),
    sections: document.querySelectorAll("[data-section]"),
    heroMetricTotal: document.getElementById("heroMetricTotal"),
    heroMetricCost: document.getElementById("heroMetricCost"),
    heroMetricRoom: document.getElementById("heroMetricRoom"),
    homeSummary: document.getElementById("homeSummary"),
    homeTotal: document.getElementById("homeTotal"),
    homeCount: document.getElementById("homeCount"),
    homeTopRoom: document.getElementById("homeTopRoom"),
    setupProfile: document.getElementById("setupProfile"),
    setupDevices: document.getElementById("setupDevices"),
    setupMap: document.getElementById("setupMap"),
    userName: document.getElementById("userName"),
    userHomeType: document.getElementById("userHomeType"),
    userMembers: document.getElementById("userMembers"),
    userCity: document.getElementById("userCity"),
    userGoal: document.getElementById("userGoal"),
    userRatePlan: document.getElementById("userRatePlan"),
    userMonthlyGoal: document.getElementById("userMonthlyGoal"),
    saveUserButton: document.getElementById("saveUserButton"),
    userProfileSummary: document.getElementById("userProfileSummary"),
    userProfileType: document.getElementById("userProfileType"),
    userProfileGoal: document.getElementById("userProfileGoal"),
    userProfileRate: document.getElementById("userProfileRate"),
    userProfileTarget: document.getElementById("userProfileTarget"),
    userReadiness: document.getElementById("userReadiness"),
    quickPresetList: document.getElementById("quickPresetList"),
    devicePreset: document.getElementById("devicePreset"),
    deviceRoom: document.getElementById("deviceRoom"),
    deviceName: document.getElementById("deviceName"),
    devicePower: document.getElementById("devicePower"),
    deviceHours: document.getElementById("deviceHours"),
    deviceDays: document.getElementById("deviceDays"),
    addDeviceButton: document.getElementById("addDeviceButton"),
    deviceFormNote: document.getElementById("deviceFormNote"),
    appDeviceCount: document.getElementById("appDeviceCount"),
    appDeviceList: document.getElementById("appDeviceList"),
    consumptionTotal: document.getElementById("consumptionTotal"),
    consumptionCost: document.getElementById("consumptionCost"),
    consumptionRoom: document.getElementById("consumptionRoom"),
    consumptionLevel: document.getElementById("consumptionLevel"),
    consumptionInsight: document.getElementById("consumptionInsight"),
    consumptionBars: document.getElementById("consumptionBars"),
    consumptionTopDevices: document.getElementById("consumptionTopDevices"),
    consumptionRoomCards: document.getElementById("consumptionRoomCards"),
    reportCost: document.getElementById("reportCost"),
    reportCO2: document.getElementById("reportCO2"),
    reportTopDevice: document.getElementById("reportTopDevice"),
    reportTopRoom: document.getElementById("reportTopRoom"),
    reportSummaryText: document.getElementById("reportSummaryText"),
    reportTips: document.getElementById("reportTips"),
    reportRoomFocus: document.getElementById("reportRoomFocus"),
    reportNextStep: document.getElementById("reportNextStep"),
    mapRoot: document.getElementById("mainMapRoot")
  };

  const presetOptions = window.EcoMapa3D ? window.EcoMapa3D.presets : [];
  const roomOptions = window.EcoMapa3D ? window.EcoMapa3D.rooms.map((room) => room.name) : [];
  const state = loadState();

  window.EcoMapa3D.initAll();
  const mapInstance = window.EcoMapa3D.getInstance(refs.mapRoot);

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { user: { ...defaultUser }, devices: [] };
      }
      const parsed = JSON.parse(raw);
      return {
        user: { ...defaultUser, ...(parsed.user || {}) },
        devices: Array.isArray(parsed.devices) ? parsed.devices : []
      };
    } catch (error) {
      return { user: { ...defaultUser }, devices: [] };
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatCurrency(value) {
    return `$${formatNumber(value)} MXN`;
  }

  function showSection(id) {
    refs.navButtons.forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-section-target") === id);
    });

    refs.sections.forEach((section) => {
      section.classList.toggle("active", section.getAttribute("data-section") === id);
    });

    if (navMeta[id]) {
      refs.heroTitle.textContent = navMeta[id].title;
      refs.heroCopy.textContent = navMeta[id].copy;
    }
  }

  function fillDeviceSelectors() {
    refs.devicePreset.innerHTML = [
      '<option value="">Selecciona un aparato comun</option>',
      ...presetOptions.map((preset) => `<option value="${preset.label}">${preset.label}</option>`)
    ].join("");

    refs.deviceRoom.innerHTML = roomOptions
      .map((room) => `<option value="${room}">${room}</option>`)
      .join("");

    refs.quickPresetList.innerHTML = presetOptions.slice(0, 8).map((preset) => `
      <button type="button" class="eco-app-button secondary" data-quick-preset="${preset.label}">
        ${preset.label}
      </button>
    `).join("");
  }

  function computeSummary() {
    const rooms = {};
    roomOptions.forEach((room) => {
      rooms[room] = { total: 0, devices: [] };
    });

    let total = 0;
    let topDevice = null;

    state.devices.forEach((device) => {
      const consumption = Number(device.consumption || 0);
      total += consumption;
      if (!rooms[device.room]) {
        rooms[device.room] = { total: 0, devices: [] };
      }
      rooms[device.room].total += consumption;
      rooms[device.room].devices.push(device);
      if (!topDevice || consumption > Number(topDevice.consumption || 0)) {
        topDevice = device;
      }
    });

    let topRoom = null;
    roomOptions.forEach((room) => {
      if (!topRoom || rooms[room].total > topRoom.total) {
        topRoom = { name: room, total: rooms[room].total, count: rooms[room].devices.length };
      }
    });

    const sortedDevices = state.devices
      .slice()
      .sort((a, b) => Number(b.consumption || 0) - Number(a.consumption || 0));

    const sortedRooms = roomOptions
      .map((room) => ({
        name: room,
        total: rooms[room].total,
        count: rooms[room].devices.length
      }))
      .sort((a, b) => b.total - a.total);

    return {
      total,
      rooms,
      topRoom,
      topDevice,
      sortedDevices,
      sortedRooms,
      cost: total * 1.2,
      co2: total * 0.43
    };
  }

  function getConsumptionLevel(total) {
    if (total >= 300) {
      return "Intenso";
    }
    if (total >= 150) {
      return "Moderado";
    }
    return "Base";
  }

  function applyPresetToForm(label) {
    const preset = presetOptions.find((item) => item.label === label);
    if (!preset) {
      return;
    }
    refs.devicePreset.value = preset.label;
    refs.deviceName.value = preset.label;
    refs.devicePower.value = preset.power;
    refs.deviceRoom.value = preset.room;
    refs.deviceFormNote.textContent = `Preset cargado: ${preset.label}. Si quieres, cambia el nombre por uno personalizado.`;
  }

  function renderHome(summary) {
    const homeName = state.user.name ? `${state.user.name}` : "tu hogar";
    const level = getConsumptionLevel(summary.total);
    const topRoomLabel = summary.topRoom && summary.topRoom.total ? `${summary.topRoom.name}` : "Sin datos";

    refs.heroMetricTotal.textContent = `${formatNumber(summary.total)} kWh/mes`;
    refs.heroMetricCost.textContent = formatCurrency(summary.cost);
    refs.heroMetricRoom.textContent = topRoomLabel;

    if (!state.devices.length) {
      refs.homeSummary.textContent = "Aun no hay informacion guardada. Empieza creando el perfil del hogar y agregando tus primeros aparatos.";
    } else {
      refs.homeSummary.textContent = `${homeName} registra ${state.devices.length} ${state.devices.length === 1 ? "aparato" : "aparatos"}, un consumo de ${formatNumber(summary.total)} kWh/mes y un nivel ${level.toLowerCase()} de demanda energetica.`;
    }

    refs.homeTotal.textContent = `${formatNumber(summary.total)} kWh/mes`;
    refs.homeCount.textContent = `${state.devices.length} ${state.devices.length === 1 ? "aparato" : "aparatos"}`;
    refs.homeTopRoom.textContent = topRoomLabel;

    const profileComplete = Boolean(state.user.name && state.user.homeType && state.user.goal);
    const devicesComplete = state.devices.length > 0;
    const mapComplete = state.devices.length >= 3;

    refs.setupProfile.classList.toggle("is-complete", profileComplete);
    refs.setupDevices.classList.toggle("is-complete", devicesComplete);
    refs.setupMap.classList.toggle("is-complete", mapComplete);
  }

  function renderUserProfile(summary) {
    refs.userName.value = state.user.name;
    refs.userHomeType.value = state.user.homeType;
    refs.userMembers.value = state.user.members;
    refs.userCity.value = state.user.city;
    refs.userGoal.value = state.user.goal;
    refs.userRatePlan.value = state.user.ratePlan;
    refs.userMonthlyGoal.value = state.user.monthlyGoal;

    refs.userProfileType.textContent = state.user.homeType || "Sin definir";
    refs.userProfileGoal.textContent = state.user.goal || "Sin definir";
    refs.userProfileRate.textContent = state.user.ratePlan || "Sin definir";
    refs.userProfileTarget.textContent = state.user.monthlyGoal ? `${formatNumber(state.user.monthlyGoal)} kWh` : "Sin definir";

    if (!state.user.name && !state.user.homeType && !state.user.goal) {
      refs.userProfileSummary.textContent = "Todavia no hay informacion guardada del usuario.";
      refs.userReadiness.textContent = "Completa el perfil para que la plataforma pueda contextualizar mejor el consumo del hogar.";
      return;
    }

    const targetText = state.user.monthlyGoal
      ? `La meta mensual deseada es de ${formatNumber(state.user.monthlyGoal)} kWh.`
      : "Aun no se ha definido una meta mensual.";

    refs.userProfileSummary.textContent = `${state.user.name || "Usuario"} vive en ${state.user.homeType || "una vivienda"}${state.user.city ? ` en ${state.user.city}` : ""}${state.user.members ? ` con ${state.user.members} personas` : ""}. Su prioridad actual es ${state.user.goal || "sin definir"}.`;

    if (state.user.monthlyGoal && summary.total > Number(state.user.monthlyGoal)) {
      refs.userReadiness.textContent = `${targetText} El consumo actual supera esa meta, asi que conviene revisar primero ${summary.topRoom ? summary.topRoom.name : "la zona principal"}.`;
    } else {
      refs.userReadiness.textContent = `${targetText} La tarifa registrada es ${state.user.ratePlan || "sin definir"}, lo que ayuda a orientar mejor las decisiones del hogar.`;
    }
  }

  function renderDeviceList(summary) {
    refs.appDeviceCount.textContent = `${state.devices.length} ${state.devices.length === 1 ? "registrado" : "registrados"}`;

    if (!state.devices.length) {
      refs.appDeviceList.innerHTML = '<div class="eco-app-empty">Aun no hay aparatos registrados. Agrega uno y despues ubicalo dentro del mapa.</div>';
      return;
    }

    refs.appDeviceList.innerHTML = summary.sortedDevices.map((device) => `
      <article class="eco-app-device">
        <div>
          <strong>${device.name}</strong>
          <span>${device.room} | ${formatNumber(device.power)} W | ${formatNumber(device.hours)} h/dia | ${formatNumber(device.consumption)} kWh/mes</span>
        </div>
        <div class="eco-app-device-actions">
          <button type="button" class="eco-app-button secondary" data-device-place="${device.id}">Ubicar en mapa</button>
          <button type="button" class="eco-app-button secondary" data-device-remove="${device.id}">Quitar</button>
        </div>
      </article>
    `).join("");
  }

  function renderConsumption(summary) {
    const level = getConsumptionLevel(summary.total);
    refs.consumptionTotal.textContent = `${formatNumber(summary.total)} kWh/mes`;
    refs.consumptionCost.textContent = formatCurrency(summary.cost);
    refs.consumptionRoom.textContent = summary.topRoom && summary.topRoom.total ? `${summary.topRoom.name} (${formatNumber(summary.topRoom.total)} kWh)` : "Sin datos";
    refs.consumptionLevel.textContent = level;

    if (!state.devices.length) {
      refs.consumptionInsight.textContent = "Agrega aparatos para comenzar el analisis de consumo.";
    } else if (state.user.monthlyGoal && summary.total > Number(state.user.monthlyGoal)) {
      refs.consumptionInsight.textContent = `El hogar esta por encima de la meta mensual de ${formatNumber(state.user.monthlyGoal)} kWh. La mejor primera accion es intervenir la zona de mayor carga.`;
    } else {
      refs.consumptionInsight.textContent = `La demanda actual se interpreta como ${level.toLowerCase()}. ${summary.topRoom && summary.topRoom.total ? `${summary.topRoom.name} requiere la mayor atencion.` : "Sigue agregando datos para afinar la lectura."}`;
    }

    refs.consumptionBars.innerHTML = summary.sortedRooms.map((room) => {
      const percent = summary.total ? (room.total / summary.total) * 100 : 0;
      return `
        <div class="eco-app-bar-row">
          <label>
            <span>${room.name}</span>
            <span>${formatNumber(room.total)} kWh</span>
          </label>
          <div class="eco-app-bar"><span style="width:${percent}%"></span></div>
        </div>
      `;
    }).join("");

    if (!summary.sortedDevices.length) {
      refs.consumptionTopDevices.innerHTML = '<div class="eco-app-empty">Sin aparatos suficientes para calcular prioridades.</div>';
    } else {
      refs.consumptionTopDevices.innerHTML = summary.sortedDevices.slice(0, 3).map((device, index) => `
        <div class="eco-app-note">
          <strong>${index + 1}. ${device.name}</strong><br>
          ${formatNumber(device.consumption)} kWh/mes en ${device.room}.
        </div>
      `).join("");
    }

    refs.consumptionRoomCards.innerHTML = summary.sortedRooms.map((room) => {
      const percentage = summary.total ? (room.total / summary.total) * 100 : 0;
      return `
        <div class="eco-app-note">
          <strong>${room.name}</strong><br>
          ${room.count} ${room.count === 1 ? "aparato" : "aparatos"} | ${formatNumber(room.total)} kWh/mes | ${formatNumber(percentage)}% del total.
        </div>
      `;
    }).join("");
  }

  function buildTips(summary) {
    const tips = [];

    if (!state.devices.length) {
      return [
        "Agrega aparatos y ubicalos en el mapa para recibir recomendaciones del hogar."
      ];
    }

    if (summary.topDevice) {
      tips.push(`Revisa primero ${summary.topDevice.name}, ya que es el aparato con mayor impacto mensual.`);
    }

    if (summary.topRoom && summary.topRoom.total) {
      tips.push(`${summary.topRoom.name} es la zona con mayor carga. Conviene revisar horarios de uso y eficiencia en ese espacio.`);
    }

    if (summary.total >= 300) {
      tips.push("El consumo total esta en un nivel alto. Prioriza reducciones en clima, refrigeracion o lavado.");
    } else if (summary.total >= 150) {
      tips.push("Estas en un rango medio. Pequenos ajustes de habitos y sustitucion de focos o equipos pueden ayudarte bastante.");
    } else {
      tips.push("El consumo base se mantiene moderado. Aprovecha para sostener equipos eficientes y horarios ordenados.");
    }

    if (state.user.goal === "Reducir costo") {
      tips.push("Enfoca tus decisiones en los aparatos que pasan mas horas encendidos durante el mes.");
    }

    if (state.user.goal === "Reducir CO2") {
      tips.push("Prioriza bajar el uso continuo de los equipos mas potentes y mejora la eficiencia de iluminacion.");
    }

    if (state.user.ratePlan === "Alta demanda") {
      tips.push("Con una tarifa de alta demanda conviene evitar que varios equipos potentes se usen al mismo tiempo.");
    }

    return tips.slice(0, 5);
  }

  function renderReports(summary) {
    refs.reportCost.textContent = formatCurrency(summary.cost);
    refs.reportCO2.textContent = `${formatNumber(summary.co2)} kg`;
    refs.reportTopDevice.textContent = summary.topDevice ? summary.topDevice.name : "Sin datos";
    refs.reportTopRoom.textContent = summary.topRoom && summary.topRoom.total ? summary.topRoom.name : "Sin datos";

    if (!state.devices.length) {
      refs.reportSummaryText.textContent = "Agrega aparatos para generar recomendaciones automaticas.";
      refs.reportRoomFocus.innerHTML = '<div class="eco-app-empty">Sin datos por habitacion.</div>';
      refs.reportNextStep.textContent = "Cuando agregues aparatos, aqui aparecera la prioridad principal a trabajar.";
    } else {
      refs.reportSummaryText.textContent = `${state.user.name || "Tu hogar"} presenta un consumo estimado de ${formatNumber(summary.total)} kWh/mes. La prioridad actual esta entre ${summary.topDevice ? summary.topDevice.name : "el aparato principal"} y ${summary.topRoom ? summary.topRoom.name : "la zona principal"}.`;

      refs.reportRoomFocus.innerHTML = summary.sortedRooms.slice(0, 3).map((room, index) => `
        <div class="eco-app-note">
          <strong>Prioridad ${index + 1}: ${room.name}</strong><br>
          ${formatNumber(room.total)} kWh/mes con ${room.count} ${room.count === 1 ? "aparato" : "aparatos"} registrados.
        </div>
      `).join("");

      if (summary.topRoom && summary.topDevice) {
        refs.reportNextStep.textContent = `Siguiente paso sugerido: revisa ${summary.topDevice.name} dentro de ${summary.topRoom.name}, porque ahi se cruza el mayor aparato con la zona mas exigente del hogar.`;
      } else {
        refs.reportNextStep.textContent = "Sigue agregando informacion para profundizar el reporte.";
      }
    }

    refs.reportTips.innerHTML = buildTips(summary)
      .map((tip) => `<li>${tip}</li>`)
      .join("");
  }

  function renderAll() {
    const summary = computeSummary();
    renderHome(summary);
    renderUserProfile(summary);
    renderDeviceList(summary);
    renderConsumption(summary);
    renderReports(summary);
  }

  function saveUser() {
    state.user = {
      name: refs.userName.value.trim(),
      homeType: refs.userHomeType.value,
      members: refs.userMembers.value,
      city: refs.userCity.value.trim(),
      goal: refs.userGoal.value,
      ratePlan: refs.userRatePlan.value,
      monthlyGoal: refs.userMonthlyGoal.value
    };
    saveState();
    renderAll();
    showSection("aparatos");
  }

  function addDevice() {
    const preset = presetOptions.find((item) => item.label === refs.devicePreset.value);
    const name = refs.deviceName.value.trim() || (preset ? preset.label : "");
    const power = Number(refs.devicePower.value);
    const hours = Number(refs.deviceHours.value);
    const days = Number(refs.deviceDays.value);
    const room = refs.deviceRoom.value;

    if (!name || !power || !hours || !days || !room) {
      refs.deviceFormNote.textContent = "Completa nombre, potencia, horas, dias y habitacion antes de agregar el aparato.";
      return;
    }

    if (!mapInstance) {
      refs.deviceFormNote.textContent = "No se pudo inicializar el mapa interactivo.";
      return;
    }

    mapInstance.addDevice({
      name,
      power,
      hours,
      days,
      room,
      short: preset ? preset.short : null,
      tip: preset ? preset.tip : null
    });

    refs.deviceName.value = "";
    refs.devicePower.value = "";
    refs.deviceHours.value = "";
    refs.deviceDays.value = 30;
    refs.devicePreset.value = "";
    refs.deviceRoom.value = roomOptions[0] || "";
    refs.deviceFormNote.textContent = `Se agrego "${name}". Ahora puedes ubicarlo o ajustarlo dentro del mapa.`;
    showSection("mapa");
  }

  function removeDevice(id) {
    if (!mapInstance) {
      return;
    }
    state.devices = state.devices.filter((device) => device.id !== id);
    mapInstance.setDevices(state.devices);
  }

  function syncFromMap(detail) {
    state.devices = detail.devices || [];
    saveState();
    renderAll();
  }

  fillDeviceSelectors();
  refs.deviceRoom.value = roomOptions[0] || "";

  if (mapInstance && state.devices.length) {
    mapInstance.setDevices(state.devices, { silent: true });
  }

  if (refs.mapRoot) {
    refs.mapRoot.addEventListener("ecomapa:change", (event) => {
      syncFromMap(event.detail);
    });
  }

  refs.saveUserButton.addEventListener("click", saveUser);
  refs.devicePreset.addEventListener("change", () => applyPresetToForm(refs.devicePreset.value));
  refs.addDeviceButton.addEventListener("click", addDevice);

  document.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-section-target]");
    const jumpButton = event.target.closest("[data-jump]");
    const removeButton = event.target.closest("[data-device-remove]");
    const placeButton = event.target.closest("[data-device-place]");
    const sampleButton = event.target.closest("[data-action='load-sample']");
    const quickPresetButton = event.target.closest("[data-quick-preset]");

    if (navButton) {
      showSection(navButton.getAttribute("data-section-target"));
    }

    if (jumpButton) {
      showSection(jumpButton.getAttribute("data-jump"));
    }

    if (quickPresetButton) {
      applyPresetToForm(quickPresetButton.getAttribute("data-quick-preset"));
      showSection("aparatos");
    }

    if (removeButton) {
      removeDevice(removeButton.getAttribute("data-device-remove"));
    }

    if (placeButton && mapInstance) {
      showSection("mapa");
      mapInstance.beginPlacement(placeButton.getAttribute("data-device-place"));
    }

    if (sampleButton && mapInstance) {
      mapInstance.loadSample();
      showSection("mapa");
    }
  });

  renderAll();
})();
