const selectDep = document.getElementById("select-bDepartamento");
const textLoca = document.getElementById("bLocalizacion");
const textClave = document.getElementById("bClave");
const botonBuscar = document.getElementById("button-Buscar");
const sectionCards = document.getElementById("cards-container");
const loadingElement = document.getElementById("loading");

let paginaActual = 1;
let totalPaginas = 1;
let ultimaBusqueda = null;


async function cargarObras(pagina = 1) {
  const clave = textClave.value.trim();
  const localizacion = textLoca.value.trim();
  let valorSeleccionado = selectDep.value;

  ultimaBusqueda = { clave, localizacion, valorSeleccionado, pagina };
  sessionStorage.setItem('ultimaBusqueda', JSON.stringify(ultimaBusqueda));

  mostrarCargando();

  try {
    if(valorSeleccionado === '') valorSeleccionado = "Ver todos los departamentos";
    const respuesta = await fetch(`/buscar?clave=${encodeURIComponent(clave)}&localizacion=${encodeURIComponent(localizacion)}&departamento=${encodeURIComponent(valorSeleccionado)}&pagina=${pagina}`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: estado ${respuesta.status}`);
    }
    const datos = await respuesta.json();
    sectionCards.innerHTML = datos.tarjetasHTML;

    if (datos.tarjetasHTML.trim() === '') {
      const mensajeSinResultados = document.createElement('p');
      mensajeSinResultados.textContent = 'No se encontraron obras para los criterios de búsqueda dados.';
      sectionCards.appendChild(mensajeSinResultados);
    } else {
      totalPaginas = datos.totalPaginas;
      crearBotonesPaginacion(pagina, totalPaginas);
    }
    paginaActual = pagina;
  } catch (error) {
    console.error("Error al cargar obras:", error);
    sectionCards.innerHTML = `<p>Error al cargar obras: ${error.message}</p>`;
  } finally {
    ocultarCargando();
  }
}

function crearTarjetaObra(obra) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'artwork-card';

  const imagen = document.createElement('img');
  imagen.src = obra.primaryImageSmall || 'https://upload.wikimedia.org/wikipedia/commons/5/5e/No_image_available_-_museum.svg';
  imagen.alt = obra.title;

  const titulo = document.createElement('h2');
  titulo.textContent = obra.title;

  const artista = document.createElement('p');
  artista.textContent = obra.artistDisplayName;

  const cultura = document.createElement('p');
  cultura.textContent = obra.culture;

  const dinastia = document.createElement('p');
  dinastia.textContent = obra.dynasty;

  tarjeta.appendChild(imagen);
  tarjeta.appendChild(titulo);
  tarjeta.appendChild(artista);
  tarjeta.appendChild(cultura);
  tarjeta.appendChild(dinastia);
  
  return tarjeta;
}

function crearBotonesPaginacion(paginaActual, totalPaginas) {

  let contenedorPaginacion = document.querySelector('.pagination');
  if (contenedorPaginacion) {
    contenedorPaginacion.remove(); 
  }

  contenedorPaginacion = document.createElement('div');
  contenedorPaginacion.className = 'pagination';

  const botonAnterior = document.createElement('button');
  botonAnterior.textContent = 'Anterior';
  botonAnterior.disabled = paginaActual <= 1;
  botonAnterior.addEventListener('click', () => cargarObras(paginaActual - 1));

  const botonSiguiente = document.createElement('button');
  botonSiguiente.textContent = 'Siguiente';
  botonSiguiente.disabled = paginaActual >= totalPaginas;
  botonSiguiente.addEventListener('click', () => cargarObras(paginaActual + 1));

  contenedorPaginacion.appendChild(botonAnterior);
  contenedorPaginacion.appendChild(botonSiguiente);

  const cardsContainer = document.getElementById('cards-container');
  cardsContainer.after(contenedorPaginacion);
}


function iniciarCarrusel() {
  let indice = 0;
  const imagenes = document.querySelectorAll('.carousel-images img');
  const totalImagenes = imagenes.length;
  console.log('Total de imagenes:', totalImagenes);

  if (totalImagenes === 0) {
    console.log('No hay imágenes en el carrusel');
    return;
  }

  const nextButton = document.querySelector('.carousel-next');
  const prevButton = document.querySelector('.carousel-prev');

  if (!nextButton || !prevButton) {
    console.log('No se crearon botones para el carrusel');
    return;
  }

  nextButton.addEventListener('click', () => {
    imagenes[indice].classList.remove('active');
    indice = (indice + 1) % totalImagenes;
    imagenes[indice].classList.add('active');
  });

  prevButton.addEventListener('click', () => {
    imagenes[indice].classList.remove('active');
    indice = (indice - 1 + totalImagenes) % totalImagenes;
    imagenes[indice].classList.add('active');
  });

  
  if (!document.querySelector('.carousel-images img.active')) {
    imagenes[0].classList.add('active');
  }
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('additional-images-btn')) {
    const obraId = e.target.getAttribute('data-id');
    fetch(`/obra/${obraId}/imagenes`)
      .then(response => response.text())
      .then(html => {
        document.body.innerHTML = html;
        iniciarCarrusel();
        const backLink = document.querySelector('.back-link');
        if(backLink){
          backLink.addEventListener('click', function(event){
            event.preventDefault();
            window.location.href='/galeria';
          })
        }
      })
      .catch(error => console.error('Error:', error));
  }
});


function mostrarCargando() {
  loadingElement.style.display = 'flex';
  sectionCards.style.display = 'none';
}

function ocultarCargando() {
  loadingElement.style.display = 'none';
  sectionCards.style.display = 'grid';
}

botonBuscar.addEventListener('click', (evento) => {
  evento.preventDefault();
  paginaActual = 1;
  cargarObras(paginaActual);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM cargado, iniciando carga de obras");
  const busquedaGuardada = sessionStorage.getItem('ultimaBusqueda');
  if (busquedaGuardada) {
    const { clave, localizacion, valorSeleccionado, pagina } = JSON.parse(busquedaGuardada);
    textClave.value = clave;
    textLoca.value = localizacion;
    selectDep.value = valorSeleccionado;
    cargarObras(pagina);
  } else {
    cargarObras(paginaActual);
  }
  iniciarCarrusel();
});
