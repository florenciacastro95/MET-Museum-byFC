import { devolveObra, devolverDepartamentos, devolverIdObras} from '../services/apiCall.js';
import translate from '../services/translationBridge.cjs';

export async function cargarDepartamentos() {
  try {
    return await devolverDepartamentos();
  } catch (error) {
    console.error('Error al cargar los departamentos:', error);
    throw error;
  }
}



export async function conseguirObras(clave, localizacion, departamento, pagina) {
  try {
    const resultado = await devolverIdObras(clave, localizacion, departamento, pagina);
    const obras = await Promise.all(resultado.obras.map(id => devolveObra(id)));
    const obrasFiltradas = obras.filter(obra => obra !== null);
    const obrasTraducidas = await Promise.all(obrasFiltradas.map(traducirObra));
    
    return {
      obras: obrasTraducidas,
      total: resultado.total,
      totalPaginas: resultado.totalPaginas
    };
  } catch (error) {
    console.error('Error al conseguir obras:', error);
    return { obras: [], total: 0, totalPaginas: 0 };
  }
}


export function imagenPequena(urlOriginal, ancho = 200) {
  if (!urlOriginal) return "https://upload.wikimedia.org/wikipedia/commons/5/5e/No_image_available_-_museum.svg";
  const url = new URL(urlOriginal);
  url.searchParams.set('width', ancho.toString());
  return url.toString();
}


async function traducirTexto(texto, idiomaOrigen = 'en', idiomaDestino = 'es') {
  if (!texto || texto === "No artist available" || texto === "No culture available" || texto === "No dynasty available") {
    return texto;
  }
  return new Promise((resolve, reject) => {
    translate({
      text: texto,
      source: idiomaOrigen,
      target: idiomaDestino
    }, (result) => {
      if (result && result.translation) {
        resolve(result.translation);
      } else {
        reject('Error en la traducción');
      }
    });
  });
}

async function traducirObra(obra) {
  try {
    const [tituloTraducido, artistaTraducido, culturaTraducida, dinastiaTraducida] = await Promise.all([
      traducirTexto(obra.title),
      traducirTexto(obra.artistDisplayName),
      traducirTexto(obra.culture),
      traducirTexto(obra.dynasty)
    ]);

    return {
      ...obra,
      title: tituloTraducido || "No hay título disponible",
      artistDisplayName: artistaTraducido || "No hay artista disponible",
      culture: culturaTraducida || "No hay cultura disponible",
      dynasty: dinastiaTraducida || "No hay dinastía disponible"
    };
  } catch (error) {
    console.error('Error al traducir obra:', error);
    return obra;
  }
}


export async function mostrarImagenesAdicionales(req, res) {
  const { id } = req.params;  
  try {
    const obra = await devolveObra(id);  

    if (!obra || !obra.additionalImages || obra.additionalImages.length === 0) {
      return res.status(404).send('No hay imágenes adicionales disponibles para esta obra.');
    }

    res.render('galeria-imagenes', { obra });
  } catch (error) {
    console.error('Error al obtener imágenes adicionales:', error);
    res.status(500).send('Error al obtener imágenes adicionales');
  }
}