const urlApi = "https://collectionapi.metmuseum.org/public/collection/v1/";

export let ultimoIdValido = 0;

export async function devolverDepartamentos() {
  try {
    const res = await fetch(`${urlApi}departments`);
    if (!res.ok) {
      throw new Error("No se pudo obtener los ids de los departamentos");
    }
    const datos = await res.json();
    return datos.departments;
  } catch (error) {
    console.error("Error en la función devolverDepartamentos:", error);
    return [];
  }
}


export async function devolverIdObras(clave = "", localizacion = "", valueSelect, pagina = 1) {
  console.log("Parámetros de búsqueda:", { clave, localizacion, valueSelect, pagina });
  try {
      if (clave == "" && localizacion == "" && valueSelect == "Ver todos los departamentos") {
         
          let idInicio = (pagina - 1) * 20 + 1;
          let idValido = idInicio;
          let obrasFiltradas = [];
          let index = 0;
          while (index < 20) {
              const obra = await devolveObra(idValido);
              if (obra !== null) {
                  obrasFiltradas.push(idValido);
                  index++;
              }
              idValido++;
          }
          ultimoIdValido = idValido - 1;
          return {
              obras: obrasFiltradas,
              total: 470433, 
              totalPaginas: Math.ceil(470433 / 20)
          };
      } else {
    
          let tempUrl = `${urlApi}search?q=%22${encodeURIComponent(clave)}%22`;
          if (localizacion) tempUrl += `&geoLocation=${encodeURIComponent(localizacion)}`;
          if (valueSelect != "Ver todos los departamentos") tempUrl += `&departmentId=${valueSelect}`;
          
          console.log("URL de búsqueda:", tempUrl);
          
          const res = await fetch(tempUrl);
          if (!res.ok) {
              throw new Error("Parámetros inválidos o problema con la solicitud");
          }

          const data = await res.json();
          console.log("Data de la API:", data);
          const obras = data.objectIDs || [];
          const startIndex = (pagina - 1) * 20;
          const obrasFiltradas = obras.slice(startIndex, startIndex + 20);
          
          return {
              obras: obrasFiltradas,
              total: data.total || obras.length,
              totalPaginas: Math.ceil((data.total || obras.length) / 20)
          };
      }
  } catch (error) {
      console.error("Error en la función devolverIdObras:", error);
      return { obras: [], total: 0, totalPaginas: 0 };
  }
}


export async function devolveObra(idObra) {
  try {
    const res = await fetch(`${urlApi}objects/${idObra}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`Obra con ID ${idObra} no encontrada.`);
        return null;
      }
      throw new Error("Error en la solicitud");
    }
    return await res.json();
  } catch (error) {
    console.error(`Error al obtener la obra ${idObra}:`, error);
    return null;
  }
}

