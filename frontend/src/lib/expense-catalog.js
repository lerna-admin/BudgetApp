export const expenseCatalog = {
  Gastos: {
    "Necesidades Basicas": [
      "Arriendo",
      "Telefono/Celular",
      "Servicios publicos",
      "Gas",
      "Cable/Internet",
      "Mercado",
      "Gasolina",
      "Transporte diario",
    ],
    Deudas: [
      "Deuda Carro",
      "Deuda tarjeta 1",
      "Deuda familiar",
      "Deuda Estudio",
      "Carro",
    ],
    Casa: ["Limpieza", "Mantenimiento", "Muebles", "Impuestos"],
    Alimentacion: ["Restaurantes", "Domicilios"],
    Salud: ["Medicinas", "Tratamientos", "Deporte"],
    Entretenimiento: [
      "Vacaciones",
      "Citas",
      "Cine",
      "Plataformas de series 1",
      "Plataformas de musica 1",
    ],
    Mascota: ["Comida", "Veterinario", "Juguetes", "Medicinas"],
    "Regalos/Caridad": ["Regalos Navidad", "Regalos cumpleanos", "Caridad"],
    Transporte: ["App taxis/taxi", "Estacionamiento", "Mantenimiento", "Impuestos", "Colpass/Peaje"],
    Seguros: ["Carro", "Vida", "Casa", "Salud"],
    "Cuidado Personal": ["Ropa", "Belleza", "Peluqueria", "Sastre", "Tintoreria"],
    Hijos: ["Ropa", "Estudio", "Utiles Escolares", "Ninera"],
    Otros: [],
  },
  Ahorro: {
    Ahorros: [
      "Fondo de Emergencia",
      "Fondo de Pension",
      "Fondo de Educacion",
      "Cuota Inicial Casa",
      "Aporte a Capital",
    ],
  },
};

export function getSubcategories(category) {
  if (!category || !expenseCatalog[category]) {
    return [];
  }

  return Object.keys(expenseCatalog[category]);
}

export function getAristas(category, subcategory) {
  if (!category || !subcategory || !expenseCatalog[category]) {
    return [];
  }

  return expenseCatalog[category][subcategory] || [];
}
