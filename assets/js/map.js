// Leer parámetros de la URL
const params = new URLSearchParams(window.location.search);
const project = params.get("proyect") || "Sin nombre";
const isEditMode = params.has("edit");

// Mostrar título del proyecto
document.getElementById("project-title").textContent = `Proyecto: ${project}`;

// Inicializar mapa
var map = L.map('map').setView([-34.6037, -58.3816], 13);

// Cargar capa base (OSM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Toolbar para edición
if (isEditMode) {
  document.getElementById("toolbar").classList.remove("hidden");

  // Botón para añadir pin
  document.getElementById("add-marker").addEventListener("click", () => {
    map.getContainer().style.cursor = "crosshair"; // cambiar cursor

    map.once("click", function (e) {
      const latlng = e.latlng;

      // Crear popup con formulario
      const popupContent = `
        <b>Nuevo Pin</b><br>
        <input type="text" id="pin-title" placeholder="Título"><br>
        <textarea id="pin-desc" placeholder="Descripción"></textarea><br>
        <input type="file" id="pin-img" accept="image/*"><br>
        <button onclick="savePin(${latlng.lat}, ${latlng.lng})">Guardar</button>
      `;

      L.marker(latlng, { draggable: true }).addTo(map)
        .bindPopup(popupContent)
        .openPopup();

      map.getContainer().style.cursor = ""; // volver al normal
    });
  });
}

// Guardar pin definitivo
function savePin(lat, lng) {
  const title = document.getElementById("pin-title").value || "Sin título";
  const desc = document.getElementById("pin-desc").value || "";
  const imgInput = document.getElementById("pin-img");
  let imgURL = "";

  if (imgInput.files.length > 0) {
    const file = imgInput.files[0];
    imgURL = URL.createObjectURL(file);
  }

  // Crear nuevo marcador con opciones
  const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

  let popupHtml = `<h3>${title}</h3><p>${desc}</p>`;
  if (imgURL) popupHtml += `<img src="${imgURL}" width="100%">`;
  popupHtml += `
    <br><button onclick="editPin(${lat}, ${lng})">✏️ Editar</button>
    <button onclick="deletePin(${lat}, ${lng})">🗑️ Borrar</button>
  `;

  marker.bindPopup(popupHtml);

  // Guardar referencia
  markers.push({ marker, lat, lng });
}

// Lista global de pines
let markers = [];

// Eliminar pin
function deletePin(lat, lng) {
  const pin = markers.find(p => p.lat === lat && p.lng === lng);
  if (pin) {
    map.removeLayer(pin.marker);
    markers = markers.filter(p => p !== pin);
  }
}

// Editar pin (muy básico: vuelve a abrir formulario)
function editPin(lat, lng) {
  const pin = markers.find(p => p.lat === lat && p.lng === lng);
  if (pin) {
    const popupContent = `
      <b>Editar Pin</b><br>
      <input type="text" id="pin-title" placeholder="Nuevo título"><br>
      <textarea id="pin-desc" placeholder="Nueva descripción"></textarea><br>
      <input type="file" id="pin-img" accept="image/*"><br>
      <button onclick="updatePin(${lat}, ${lng})">Actualizar</button>
    `;
    pin.marker.bindPopup(popupContent).openPopup();
  }
}

// Actualizar pin
function updatePin(lat, lng) {
  const title = document.getElementById("pin-title").value || "Sin título";
  const desc = document.getElementById("pin-desc").value || "";
  const imgInput = document.getElementById("pin-img");
  let imgURL = "";

  if (imgInput.files.length > 0) {
    const file = imgInput.files[0];
    imgURL = URL.createObjectURL(file);
  }

  const pin = markers.find(p => p.lat === lat && p.lng === lng);
  if (pin) {
    let popupHtml = `<h3>${title}</h3><p>${desc}</p>`;
    if (imgURL) popupHtml += `<img src="${imgURL}" width="100%">`;
    popupHtml += `
      <br><button onclick="editPin(${lat}, ${lng})">✏️ Editar</button>
      <button onclick="deletePin(${lat}, ${lng})">🗑️ Borrar</button>
    `;
    pin.marker.bindPopup(popupHtml).openPopup();
  }
}

// Buscar lugar con Nominatim
document.getElementById("search-btn").addEventListener("click", () => {
  const query = document.getElementById("search-input").value.trim();
  if (!query) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        map.setView([lat, lon], 6); // mover cámara

        if (isEditMode) {
          // Abrir formulario para añadir pin
          const popupContent = `
            <b>Nuevo Pin en ${query}</b><br>
            <input type="text" id="pin-title" placeholder="Título"><br>
            <textarea id="pin-desc" placeholder="Descripción"></textarea><br>
            <input type="file" id="pin-img" accept="image/*"><br>
            <button onclick="savePin(${lat}, ${lon})">Guardar</button>
          `;

          L.marker([lat, lon]).addTo(map)
            .bindPopup(popupContent)
            .openPopup();
        } else {
          // Solo mostrar ubicación
          L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${query}</b>`)
            .openPopup();
        }
      } else {
        alert("No se encontró el lugar.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error en la búsqueda.");
    });
});
