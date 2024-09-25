import express from 'express';
import { mostrarImagenesAdicionales, cargarDepartamentos, conseguirObras } from '../controllers/viewController.js';
import { devolveObra } from '../services/apiCall.js';
import translate from '../services/translationBridge.cjs';
const enrutador = express.Router();



async function traducirTexto(texto, langOrigen) {
  return new Promise((resolve, reject) => {
    translate({
      text: texto,
      source: langOrigen,
      target: 'es'
    }, (result) => {
      if (result && result.translation) {
        resolve(result.translation);
      } else {
        reject('Error en la traducción');
      }
    });
  });
}

async function traducirDepartamentos(departamentos, lang) {
  try {
    const departamentosTraducidos = await Promise.all(
      departamentos.map(async (dep) => {
        const nombreTraducido = await traducirTexto(dep.displayName, lang);
        return { ...dep, displayName: nombreTraducido };
      })
    );
    return departamentosTraducidos;
  } catch (error) {
    console.error('Error al traducir los departamentos:', error);
    return departamentos;
  }
}


enrutador.get('/', (req, res) => {
  res.render('index', { title: 'Inicio' });
});

enrutador.get('/galeria', async (req, res) => {
  const lang = req.query.lang || 'en';
  const startTime = Date.now();
  try {
    const departamentos = await cargarDepartamentos();

    const departamentosTraducidos = lang !== 'es' ?
      await traducirDepartamentos(departamentos, lang) :
      departamentos;

    res.render('galeria', { title: 'Galería', departamentos: departamentosTraducidos });
  } catch (error) {
    console.error('Error al cargar la página de galería:', error);
    res.status(500).send('Error al cargar la página');
  }

  const endTime = Date.now(); // Marca el tiempo al final
  const executionTime = endTime - startTime; // Calcula el tiempo total en milisegundos
  console.log(`Tiempo de ejecución para /galeria: ${executionTime} ms`);

});


enrutador.get('/buscar', async (req, res) => {
  const { clave, localizacion, departamento, pagina = 1 } = req.query;
  try {
    const resultado = await conseguirObras(clave, localizacion, departamento, parseInt(pagina));

    res.render('partials/obras', { obras: resultado.obras }, (err, html) => {
      if (err) {
        console.error('Error al renderizar obras:', err);
        res.status(500).json({ error: 'Error al renderizar obras' });
      } else {
        res.json({
          tarjetasHTML: html,
          totalPaginas: resultado.totalPaginas,
          paginaActual: parseInt(pagina),
          total: resultado.total
        });
      }
    });
  } catch (error) {
    console.error('Error al buscar obras:', error);
    res.status(500).json({ error: 'Error al buscar obras', mensaje: error.message });
  }
});

enrutador.get('/obra/:id/imagenes', mostrarImagenesAdicionales);


export default enrutador;

