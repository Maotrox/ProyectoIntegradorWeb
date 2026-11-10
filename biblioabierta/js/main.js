

(function () {
  "use strict";

  function normalizar(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function fechaHoy() {
    const ahora = new Date();
    const desfase = ahora.getTimezoneOffset() * 60000;
    return new Date(ahora - desfase).toISOString().slice(0, 10);
  }

  function formatoHora(decimal) {
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    const sufijo = horas < 12 ? "a. m." : "p. m.";
    const hora12 = horas % 12 === 0 ? 12 : horas % 12;
    return hora12 + ":" + String(minutos).padStart(2, "0") + " " + sufijo;
  }


  const botonMenu = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu-principal");

  if (botonMenu && menu) {
    botonMenu.addEventListener("click", function () {
      const estaAbierto = botonMenu.getAttribute("aria-expanded") === "true";
      botonMenu.setAttribute("aria-expanded", String(!estaAbierto));
      menu.classList.toggle("abierto", !estaAbierto);
    });

    // Al elegir una sección, el menú se cierra.
    menu.querySelectorAll("a").forEach(function (enlace) {
      enlace.addEventListener("click", function () {
        botonMenu.setAttribute("aria-expanded", "false");
        menu.classList.remove("abierto");
      });
    });
  }


  const horario = { 0: null, 1: [7, 20], 2: [7, 20], 3: [7, 20], 4: [7, 20], 5: [7, 20], 6: [8, 14] };
  const nombresDia = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  const indicador = document.getElementById("estado-indicador");
  const textoEstado = document.getElementById("estado-texto");
  const detalleEstado = document.getElementById("estado-detalle");

  function actualizarEstado() {
    if (!indicador || !textoEstado || !detalleEstado) return;

    const ahora = new Date();
    const hoy = ahora.getDay();
    const decimal = ahora.getHours() + ahora.getMinutes() / 60;
    const tramo = horario[hoy];

    if (tramo && decimal >= tramo[0] && decimal < tramo[1]) {
      indicador.classList.add("abierta");
      indicador.classList.remove("cerrada");
      textoEstado.textContent = "Abierta ahora";
      detalleEstado.textContent = "Cierra a las " + formatoHora(tramo[1]);
      return;
    }

    indicador.classList.add("cerrada");
    indicador.classList.remove("abierta");
    textoEstado.textContent = "Cerrada en este momento";

    for (let i = 0; i < 7; i++) {
      const dia = (hoy + i) % 7;
      const apertura = horario[dia];
      if (!apertura) continue;
      if (i === 0 && decimal >= apertura[0]) continue; // hoy ya cerró

      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : "el " + nombresDia[dia];
      detalleEstado.textContent = "Abre " + cuando + " a las " + formatoHora(apertura[0]);
      return;
    }
  }


  document.querySelectorAll("#tabla-horarios [data-dias]").forEach(function (fila) {
    const dias = fila.dataset.dias.split(",").map(Number);
    if (dias.includes(new Date().getDay())) {
      fila.classList.add("hoy");
    }
  });

  actualizarEstado();
  setInterval(actualizarEstado, 60000);


  const campoBuscar = document.getElementById("buscar");
  const campoCategoria = document.getElementById("categoria");
  const formFiltros = document.getElementById("form-filtros");
  const libros = Array.from(document.querySelectorAll("#lista-libros .libro"));
  const textoResultados = document.getElementById("resultados");
  const mensajeVacio = document.getElementById("sin-resultados");

  function filtrarCatalogo() {
    const termino = normalizar(campoBuscar.value.trim());
    const categoria = campoCategoria.value;
    let visibles = 0;

    libros.forEach(function (libro) {
      const coincideTexto = normalizar(libro.dataset.busqueda).includes(termino);
      const coincideCategoria = categoria === "todas" || libro.dataset.categoria === categoria;
      const mostrar = coincideTexto && coincideCategoria;

      libro.hidden = !mostrar;
      if (mostrar) visibles++;
    });

    textoResultados.textContent = "Mostrando " + visibles + " de " + libros.length + " libros.";
    mensajeVacio.hidden = visibles !== 0;
  }

  campoBuscar.addEventListener("input", filtrarCatalogo);
  campoCategoria.addEventListener("change", filtrarCatalogo);
  formFiltros.addEventListener("submit", function (evento) {
    evento.preventDefault(); // evita recargar la página al pulsar Enter
  });
  filtrarCatalogo();


  const formReserva = document.getElementById("form-reserva");
  const selectLibro = document.getElementById("libro");
  const radiosTipo = document.querySelectorAll('input[name="tipo"]');

  function tipoSeleccionado() {
    return document.querySelector('input[name="tipo"]:checked').value;
  }

  function actualizarCampos() {
    const tipo = tipoSeleccionado();
    formReserva.querySelectorAll("[data-solo]").forEach(function (campo) {
      const visible = campo.dataset.solo === tipo;
      campo.hidden = !visible;
      campo.querySelectorAll("input, select").forEach(function (control) {
        control.disabled = !visible;
      });
    });
  }

  document.querySelectorAll("[data-libro]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      selectLibro.value = boton.dataset.libro;
      document.querySelector('input[name="tipo"][value="prestamo"]').checked = true;
      actualizarCampos();
      document.getElementById("reservas").scrollIntoView();
      document.getElementById("nombre").focus({ preventScroll: true });
    });
  });

  radiosTipo.forEach(function (radio) {
    radio.addEventListener("change", actualizarCampos);
  });


  const campoFecha = document.getElementById("fecha");
  const campoPersonas = document.getElementById("personas");
  const selectEspacio = document.getElementById("espacio");
  const mensajeForm = document.getElementById("mensaje-form");

  campoFecha.min = fechaHoy();

  // Devuelve true si el campo es válido. Muestra u oculta el mensaje de error.
  function validarCampo(control) {
    const error = document.getElementById("error-" + control.id);
    const valor = control.value.trim();
    let texto = "";

    if (control.required && !valor) {
      texto = "Completa este campo.";
    } else if (control.type === "email" && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      texto = "Escribe un correo válido, por ejemplo nombre@correo.edu.";
    } else if (control === campoFecha && valor && valor < fechaHoy()) {
      texto = "La fecha no puede ser anterior a hoy.";
    } else if (control === campoPersonas && valor) {
      const capacidad = Number(selectEspacio.selectedOptions[0].dataset.capacidad || 1);
      const cantidad = Number(valor);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        texto = "Escribe un número de personas mayor que cero.";
      } else if (cantidad > capacidad) {
        texto = "Este espacio admite hasta " + capacidad + " personas.";
      }
    }

    control.setAttribute("aria-invalid", texto ? "true" : "false");
    if (error) {
      error.textContent = texto;
      error.hidden = !texto;
    }
    return texto === "";
  }

  formReserva.querySelectorAll("input:not([type='radio']), select").forEach(function (control) {
    control.addEventListener("blur", function () {
      if (!control.disabled) validarCampo(control);
    });
  });


  selectEspacio.addEventListener("change", function () {
    if (campoPersonas.value) validarCampo(campoPersonas);
  });

  formReserva.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const controles = Array.from(formReserva.querySelectorAll("input, select"))
      .filter(function (control) {
        return !control.disabled && control.type !== "radio";
      });

    const todosValidos = controles.map(validarCampo).every(Boolean);

    if (!todosValidos) {
      mensajeForm.className = "mensaje error-global";
      mensajeForm.textContent = "Revisa los campos marcados antes de enviar.";
      const primero = controles.find(function (control) {
        return control.getAttribute("aria-invalid") === "true";
      });
      if (primero) primero.focus();
      return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const fechaTexto = new Date(campoFecha.value + "T00:00:00").toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    let resumen;
    if (tipoSeleccionado() === "sala") {
      const espacio = selectEspacio.selectedOptions[0].textContent;
      const hora = document.getElementById("hora").value;
      resumen = "Reserva de " + espacio.toLowerCase() + " el " + fechaTexto +
        " a las " + hora + " para " + campoPersonas.value + " persona(s).";
    } else {
      resumen = "Préstamo de «" + selectLibro.value + "» para recoger el " + fechaTexto + ".";
    }

    mensajeForm.className = "mensaje exito";
    mensajeForm.textContent = "Recibimos tu solicitud, " + nombre + ". " + resumen +
      " Te escribiremos a " + correo + " para confirmarla.";

    formReserva.reset();
    actualizarCampos();
    mensajeForm.focus();
  });

  actualizarCampos();

  const anio = document.getElementById("anio");
  if (anio) {
    anio.textContent = new Date().getFullYear();
  }
})();
