// ============================================================
// A Donde Vamos - Game Data Module
// All cities, tags, questions, options, and mappings
// ============================================================

export const TAGS = [
  'agua_cerca',
  'montana_cerca',
  'naturaleza_potente',
  'caminable',
  'gastronomia',
  'tranquilidad',
  'paisajes',
  'autentica',
  'diferente',
  'excursiones_faciles'
];

export const TAG_LABELS = {
  agua_cerca: 'Agua cerca',
  montana_cerca: 'Montaña cerca',
  naturaleza_potente: 'Naturaleza potente',
  caminable: 'Caminable',
  gastronomia: 'Gastronomía',
  tranquilidad: 'Tranquilidad',
  paisajes: 'Paisajes',
  autentica: 'Auténtica',
  diferente: 'Diferente',
  excursiones_faciles: 'Excursiones fáciles'
};

export const CITIES = [
  {
    id: 'bilbao',
    name: 'Bilbao',
    country: 'España',
    tags: { agua_cerca: 1, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'a_coruna',
    name: 'A Coruña',
    country: 'España',
    tags: { agua_cerca: 2, montana_cerca: 0, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'santander',
    name: 'Santander',
    country: 'España',
    tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'palma',
    name: 'Palma de Mallorca',
    country: 'España',
    tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 1, paisajes: 2, autentica: 1, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'menorca',
    name: 'Menorca',
    country: 'España',
    tags: { agua_cerca: 2, montana_cerca: 1, naturaleza_potente: 2, caminable: 1, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 2, excursiones_faciles: 2 }
  },
  {
    id: 'paris',
    name: 'París',
    country: 'Francia',
    tags: { agua_cerca: 1, montana_cerca: 0, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 0, paisajes: 2, autentica: 1, diferente: 0, excursiones_faciles: 1 }
  },
  {
    id: 'lyon',
    name: 'Lyon',
    country: 'Francia',
    tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'nantes',
    name: 'Nantes',
    country: 'Francia',
    tags: { agua_cerca: 1, montana_cerca: 0, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'toulouse',
    name: 'Toulouse',
    country: 'Francia',
    tags: { agua_cerca: 1, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'estrasburgo',
    name: 'Estrasburgo',
    country: 'Francia',
    tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 1, diferente: 2, excursiones_faciles: 2 }
  },
  {
    id: 'bolonia',
    name: 'Bolonia',
    country: 'Italia',
    tags: { agua_cerca: 0, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'turin',
    name: 'Turín',
    country: 'Italia',
    tags: { agua_cerca: 0, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'ginebra',
    name: 'Ginebra',
    country: 'Suiza',
    tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 1, diferente: 1, excursiones_faciles: 2 }
  },
  {
    id: 'praga',
    name: 'Praga',
    country: 'República Checa',
    tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 1, paisajes: 2, autentica: 1, diferente: 2, excursiones_faciles: 2 }
  },
  {
    id: 'sofia',
    name: 'Sofía',
    country: 'Bulgaria',
    tags: { agua_cerca: 0, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 2, excursiones_faciles: 2 }
  }
];

export const CITY_INFO = {
  bilbao: {
    pros: ['Muy buena gastronomía local', 'Ciudad cómoda para caminar', 'Buena base para excursiones cortas', 'Sensación auténtica'],
    cons: ['Clima inestable y lluvioso', 'No tiene un gran casco histórico monumental', 'En pocos días se recorre bastante'],
    nature: ['Costa y playas: 15–25 km', 'Acantilados vascos: 30–40 km', 'Montaña (Urkiola): ~40 km'],
    dishes: ['Pintxos variados', 'Bacalao a la vizcaína', 'Txuleton', 'Tarta de queso vasca'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/bio/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  a_coruna: {
    pros: ['Muy auténtica y poco turística', 'Mar muy presente en la ciudad', 'Paseos marítimos muy bonitos', 'Excelente marisco'],
    cons: ['Clima ventoso y cambiante', 'Menos "atractivos icónicos"', 'Sensación más tranquila'],
    nature: ['Playas urbanas dentro de la ciudad', 'Costa salvaje y acantilados: 20–60 km', 'Costa da Morte: 60–90 km'],
    dishes: ['Pulpo a la gallega', 'Empanada gallega', 'Mariscos (percebes, centollo)', 'Tarta de Santiago'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/lcg/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  santander: {
    pros: ['Muy elegante y agradable para pasear', 'Playas dentro de la ciudad', 'Entorno natural muy bonito'],
    cons: ['Clima impredecible', 'Se recorre bastante rápido', 'Más enfocada al paisaje que a monumentos'],
    nature: ['Playas urbanas', 'Acantilados costeros: 10–30 km', 'Picos de Europa: ~100 km'],
    dishes: ['Rabas (calamares fritos)', 'Anchoas del Cantábrico', 'Cocido montañés', 'Quesada pasiega'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/sdr/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  palma: {
    pros: ['Casco antiguo muy bonito', 'Mar y naturaleza muy cerca', 'Buen equilibrio entre ciudad y paisaje'],
    cons: ['Algunas zonas muy turísticas', 'Para ver lo mejor, ayuda moverse'],
    nature: ['Calas y playas: 5–30 km', 'Sierra de Tramuntana: ~25 km', 'Pueblos de montaña: 20–40 km'],
    dishes: ['Ensaimada', 'Sobrasada', 'Tumbet', 'Arroz brut'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/pmi/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  menorca: {
    pros: ['Naturaleza muy bien conservada', 'Calas espectaculares', 'Ritmo muy tranquilo'],
    cons: ['Necesidad de moverse para conocer la isla', 'Menos variedad urbana', 'Mar aún frío en abril'],
    nature: ['Calas por toda la isla: 5–40 km', 'Acantilados y senderos costeros', 'Camí de Cavalls (ruta natural)'],
    dishes: ['Caldereta de langosta', 'Queso de Mahón', 'Sobrasada menorquina', 'Pastissets'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/mah/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  paris: {
    pros: ['Muy bonita para caminar sin rumbo', 'Arquitectura y calles muy especiales', 'Paseos junto al Sena'],
    cons: ['Mucha gente', 'Precios altos', 'Ritmo más intenso'],
    nature: ['Río Sena dentro de la ciudad', 'Grandes parques urbanos', 'Jardines de Versalles: ~20 km'],
    dishes: ['Croissants', 'Crepes', 'Boeuf bourguignon', 'Quesos franceses'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/pari/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
  lyon: {
    pros: ['Muy gastronómica', 'Casco antiguo bonito', 'Sensación auténtica'],
    cons: ['Menos impactante visualmente que París', 'Centro relativamente compacto'],
    nature: ['Ríos Ródano y Saona', 'Colinas dentro de la ciudad', 'Región vinícola Beaujolais: ~30 km'],
    dishes: ['Quenelles', 'Saucisson lyonnais', 'Gratin dauphinois'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/lys/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  nantes: {
    pros: ['Muy verde y relajada', 'Poco turismo internacional', 'Paseos junto al río'],
    cons: ['Menos espectacular', 'Más discreta visualmente'],
    nature: ['Río Loira dentro de la ciudad', 'Costa atlántica: ~50–60 km'],
    dishes: ['Mariscos', 'Mejillones', 'Crepes bretonas'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/nte/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  toulouse: {
    pros: ['Muy agradable y auténtica', 'Arquitectura rosada única', 'Ritmo tranquilo'],
    cons: ['Centro no muy grande', 'Menos conocida'],
    nature: ['Río Garona', 'Canal du Midi', 'Pirineos: ~100–150 km'],
    dishes: ['Cassoulet', 'Foie gras', 'Salchichas de Toulouse'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/tls/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  estrasburgo: {
    pros: ['Muy pintoresca', 'Canales y casas tradicionales', 'Muy agradable para caminar'],
    cons: ['Ciudad pequeña', 'Puede ser cara'],
    nature: ['Río Rin', 'Campos de Alsacia: 20–40 km', 'Montañas Vosgos: ~60 km'],
    dishes: ['Flammkuchen', 'Chucrut alsaciano', 'Salchichas'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/sxb/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439&preferdirects=false',
  },
  bolonia: {
    pros: ['Una de las mejores ciudades para comer en Italia', 'Muy auténtica', 'Calles porticadas perfectas para pasear'],
    cons: ['Menos icónica visualmente', 'Se recorre rápido'],
    nature: ['Colinas cercanas: 5–15 km', 'Apeninos: ~60–90 km'],
    dishes: ['Tagliatelle al ragù', 'Tortellini', 'Lasaña', 'Mortadela'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/blq/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
  turin: {
    pros: ['Ciudad elegante', 'Muy cerca de los Alpes', 'Ambiente tranquilo'],
    cons: ['Más sobria que otras ciudades italianas', 'Clima algo fresco en primavera'],
    nature: ['Alpes: 40–80 km', 'Viñedos del Piamonte: 30–60 km'],
    dishes: ['Risotto al Barolo', 'Vitello tonnato', 'Agnolotti', 'Chocolate piamontés'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/trn/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
  ginebra: {
    pros: ['Lago muy bonito', 'Montañas muy cerca', 'Sensación de calma'],
    cons: ['Muy cara', 'Se recorre rápido'],
    nature: ['Lago Lemán en la ciudad', 'Alpes: 60–120 km', 'Mont Blanc (Chamonix): ~80 km'],
    dishes: ['Fondue', 'Raclette', 'Rösti', 'Chocolate suizo'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/gva/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
  praga: {
    pros: ['Muy bonita visualmente', 'Perfecta para pasear', 'Mucha personalidad'],
    cons: ['Zonas muy turísticas', 'Clima fresco'],
    nature: ['Río Moldava', 'Parques urbanos', 'Naturaleza en Bohemia: 60–130 km'],
    dishes: ['Goulash', 'Cerdo asado con knedlíky', 'Sopas tradicionales', 'Strudel'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/prg/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
  sofia: {
    pros: ['Muy auténtica', 'Poco turística', 'Montaña muy cerca'],
    cons: ['Menos impactante visualmente', 'Centro relativamente pequeño'],
    nature: ['Montaña Vitosha: 10–20 km', 'Senderismo cercano', 'Monasterio de Rila: ~120 km'],
    dishes: ['Banitsa', 'Shopska salad', 'Kebapche', 'Guisos tradicionales'],
    flights: 'https://www.skyscanner.es/transporte/vuelos/agp/sof/260401/260405/?adultsv2=2&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=1050-1439,720-1439',
  },
};

// ============================================================
// Mini-Game 1: Emotional Test - Questions
// ============================================================

export const MG1_QUESTIONS = [
  {
    id: 'q1',
    text: '¿Qué imagen te atrae más?',
    maxSelect: 2,
    timer: 20,
    options: [
      { id: 'agua', label: 'Agua', icon: '🌊', tags: { agua_cerca: 1.0 } },
      { id: 'calles_bonitas', label: 'Calles bonitas', icon: '🏘️', tags: { caminable: 0.7, paisajes: 0.3 } },
      { id: 'naturaleza', label: 'Naturaleza', icon: '🌿', tags: { naturaleza_potente: 1.0 } },
      { id: 'comida', label: 'Comida', icon: '🍽️', tags: { gastronomia: 1.0 } }
    ]
  },
  {
    id: 'q2',
    text: '¿Tu ritmo ideal?',
    maxSelect: 2,
    timer: 20,
    options: [
      { id: 'muy_tranquilo', label: 'Muy tranquilo', icon: '😌', tags: { tranquilidad: 1.0 } },
      { id: 'tranquilo_activo', label: 'Tranquilo pero activo', icon: '🚶', tags: { caminable: 0.6, excursiones_faciles: 0.4 } },
      { id: 'explorar_bastante', label: 'Explorar bastante', icon: '🧭', tags: { excursiones_faciles: 0.6, diferente: 0.4 } }
    ]
  },
  {
    id: 'q3',
    text: '¿Qué te atrae más?',
    maxSelect: 2,
    timer: 20,
    options: [
      { id: 'bonito_visual', label: 'Bonito visualmente', icon: '✨', tags: { paisajes: 0.7, caminable: 0.3 } },
      { id: 'autentico', label: 'Auténtico', icon: '🏺', tags: { autentica: 1.0 } },
      { id: 'diferente', label: 'Diferente', icon: '🗺️', tags: { diferente: 1.0 } }
    ]
  },
  {
    id: 'q4',
    text: '¿Qué te gustaría tener cerca?',
    maxSelect: 2,
    timer: 20,
    options: [
      { id: 'mar', label: 'Mar', icon: '🏖️', tags: { agua_cerca: 1.0 } },
      { id: 'montana', label: 'Montaña', icon: '⛰️', tags: { montana_cerca: 1.0 } },
      { id: 'pueblos', label: 'Pueblos', icon: '🏡', tags: { excursiones_faciles: 0.6, paisajes: 0.4 } },
      { id: 'me_da_igual', label: 'Me da igual', icon: '🤷', tags: {} }
    ]
  },
  {
    id: 'q5',
    text: '¿Qué te ilusiona más?',
    maxSelect: 2,
    timer: 20,
    options: [
      { id: 'pasear', label: 'Pasear sin rumbo', icon: '👣', tags: { caminable: 0.7, paisajes: 0.3 } },
      { id: 'paisajes', label: 'Ver paisajes', icon: '🏞️', tags: { paisajes: 1.0 } },
      { id: 'comer', label: 'Comer bien', icon: '🧑‍🍳', tags: { gastronomia: 1.0 } }
    ]
  }
];

// ============================================================
// Mini-Game 2: "3 Muy Importantes" & "3 NO Quiero"
// ============================================================

export const MG2_IMPORTANT_OPTIONS = [
  { id: 'imp_naturaleza', label: 'Naturaleza cerca', icon: '🌿', tags: { naturaleza_potente: 1.0 } },
  { id: 'imp_montana', label: 'Montaña cerca', icon: '⛰️', tags: { montana_cerca: 1.0 } },
  { id: 'imp_agua', label: 'Agua cerca (mar/lago/río)', icon: '🌊', tags: { agua_cerca: 1.0 } },
  { id: 'imp_paisajes', label: 'Ver paisajes', icon: '🏞️', tags: { paisajes: 1.0 } },
  { id: 'imp_caminar', label: 'Caminar mucho', icon: '🚶', tags: { caminable: 1.0 } },
  { id: 'imp_tranquilidad', label: 'Tranquilidad', icon: '😌', tags: { tranquilidad: 1.0 } },
  { id: 'imp_autentico', label: 'Sentirlo auténtico', icon: '🏺', tags: { autentica: 1.0 } },
  { id: 'imp_diferente', label: 'Algo diferente', icon: '🗺️', tags: { diferente: 1.0 } },
  { id: 'imp_comer', label: 'Comer muy bien', icon: '🍽️', tags: { gastronomia: 1.0 } },
  { id: 'imp_excursiones', label: 'Excursiones fáciles cerca', icon: '🚌', tags: { excursiones_faciles: 1.0 } },
  { id: 'imp_sin_coche', label: 'Ciudad cómoda sin coche', icon: '🚶‍♀️', tags: { caminable: 0.6, excursiones_faciles: 0.4 } },
  { id: 'imp_transporte', label: 'Buen transporte público', icon: '🚇', tags: { caminable: 0.5, excursiones_faciles: 0.5 } },
  { id: 'imp_relajada', label: 'Escapada relajada', icon: '🧘', tags: { excursiones_faciles: 0.6, tranquilidad: 0.4 } },
  { id: 'imp_precio', label: 'Buena relación calidad/precio', icon: '💰', tags: {} }, // No direct tag - handled via penalties
  { id: 'imp_compacta', label: 'Ciudad mediana/compacta', icon: '🏘️', tags: { caminable: 1.0 } }
];

export const MG2_NOWANT_OPTIONS = [
  { id: 'no_masificacion', label: 'Mucha masificación turística', icon: '👥', penalty: { autentica: 0.04, tranquilidad: 0.04 } },
  { id: 'no_grande', label: 'Ciudad muy grande', icon: '🏙️', penalty: { caminable: 0.03, tranquilidad: 0.03 }, affectedCities: ['paris'] },
  { id: 'no_caro', label: 'Destino caro', icon: '💸', penalty: {}, affectedCities: ['ginebra', 'paris'], cityPenalty: 0.08 },
  { id: 'no_coche', label: 'Tener que usar coche sí o sí', icon: '🚗', penalty: { caminable: 0.05 } },
  { id: 'no_traslados', label: 'Demasiados traslados largos', icon: '🛣️', penalty: { excursiones_faciles: 0.05 } },
  { id: 'no_aburrido', label: 'Lugar demasiado tranquilo', icon: '😴', penalty: { tranquilidad: -0.05 } }, // Inverted: reduces score for high-tranquilidad cities
  { id: 'no_postal', label: 'Mucho "de postal" y poco auténtico', icon: '📸', penalty: { autentica: 0.05 } },
  { id: 'no_comida', label: 'Comida poco interesante', icon: '😕', penalty: { gastronomia: 0.05 } },
  { id: 'no_urbano', label: 'Demasiado urbano sin naturaleza', icon: '🏢', penalty: { naturaleza_potente: 0.05 } },
  { id: 'no_cuestas', label: 'Demasiadas cuestas/esfuerzo', icon: '🥵', penalty: { caminable: 0.03 } },
  { id: 'no_frio', label: 'Clima muy frío', icon: '🥶', penalty: {} }, // Player preference only
  { id: 'no_lluvia', label: 'Lluvia frecuente', icon: '🌧️', penalty: {} }, // Player preference only
  { id: 'no_pie', label: 'Dificultad de moverse a pie', icon: '🦶', penalty: { caminable: 0.05 } },
  { id: 'no_paseos', label: 'Pocas opciones de paseos', icon: '🚷', penalty: { paisajes: 0.03, excursiones_faciles: 0.03 } },
  { id: 'no_conocido', label: 'Destino "muy conocido"', icon: '🌍', penalty: {}, boostTag: 'diferente', boostAmount: 0.05 }
];

// ============================================================
// Mini-Game 3: Sliders (tags to rate 1..5)
// ============================================================

export const MG3_SLIDERS = TAGS.map(tag => ({
  id: tag,
  label: TAG_LABELS[tag],
  min: 1,
  max: 5,
  defaultValue: 3
}));

// ============================================================
// Scoring weights (hardcoded, not configurable via UI)
// ============================================================

export const SCORING_WEIGHTS = {
  mg1: 0.30,
  mg2: 0.40,
  mg3: 0.30
};

// Epsilon to avoid division by zero
export const EPSILON = 0.0001;

// ============================================================
// Instruction texts for each mini-game (shown before starting)
// ============================================================

export const INSTRUCTIONS = {
  mg1: {
    title: 'Ronda 1: Test Emocional',
    subtitle: '5 preguntas rápidas',
    rules: [
      'Elige hasta 2 opciones por pregunta',
      'Tienes 20 segundos por pregunta',
      'Puedes usar el botón +10s una vez por pregunta',
      'Si se acaba el tiempo, se avanza automáticamente'
    ],
    icon: '💭'
  },
  mg2: {
    title: 'Ronda 2: Lo Importante',
    subtitle: 'Elige 3 + 3',
    rules: [
      'Primero: elige exactamente 3 cosas MUY importantes para ti',
      'Después: elige exactamente 3 cosas que NO quieres',
      'El tiempo se muestra en pantalla',
      'Puedes buscar opciones con el buscador'
    ],
    icon: '⚖️'
  },
  mg3: {
    title: 'Ronda 3: Tus Prioridades',
    subtitle: 'Puntúa del 1 al 5',
    rules: [
      'Puntúa la importancia de cada categoría',
      '1 = poco importante, 5 = imprescindible',
      'El tiempo se muestra en pantalla',
      'Si se acaba el tiempo, se guardan tus valores actuales'
    ],
    icon: '🎚️'
  }
};

// ============================================================
// WebSocket message types (shared contract with server)
// ============================================================

export const MSG = {
  // Client -> Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  PLAYER_READY: 'player_ready',
  SUBMIT_ANSWER: 'submit_answer',
  REQUEST_EXTEND: 'request_extend',
  REMATCH: 'rematch',
  CREATE_SOLO: 'create_solo',

  // Server -> Client
  ROOM_CREATED: 'room_created',
  PLAYER_JOINED: 'player_joined',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  BOTH_READY: 'both_ready',
  GAME_START: 'game_start',
  SHOW_INSTRUCTIONS: 'show_instructions',
  QUESTION: 'question',
  TIMER_TICK: 'timer_tick',
  TIMER_EXTENDED: 'timer_extended',
  PARTNER_ANSWERED: 'partner_answered',
  PHASE_CHANGE: 'phase_change',
  RESULTS: 'results',
  WAITING_RECONNECT: 'waiting_reconnect',
  GAME_ABORTED: 'game_aborted',
  REMATCH_READY: 'rematch_ready',
  SHOW_INTRO: 'show_intro',
  INTRO_ALL_READY: 'intro_all_ready',
  ERROR: 'error'
};

// ============================================================
// Game phases
// ============================================================

export const PHASES = {
  LOBBY: 'lobby',
  INTRO: 'intro',
  READY: 'ready',
  INSTRUCTIONS: 'instructions',
  MG1: 'mg1',
  MG2_IMPORTANT: 'mg2_important',
  MG2_NOWANT: 'mg2_nowant',
  MG3: 'mg3',
  RESULTS: 'results'
};
